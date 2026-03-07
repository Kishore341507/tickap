import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { auth } from "@/auth";
import { checkIsManager } from "@/lib/discord";

// Helper function to handle BigInt serialization
const serializeData = (data: any): any => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    })
  );
};

// GET - Get a specific form by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        responses: {
          include: {
            answers: true,
          },
        },
      },
    }) as any;

    if (!form || form.is_deleted) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Convert BigInt fields to strings for JSON serialization
    const serializedForm = serializeData(form);

    return NextResponse.json(serializedForm);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// PUT - Update a form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId } = await params;
    const body = await request.json();
    const { 
      title, 
      description, 
      questions, 
      guild_id, 
      channel_id, 
      role_id, 
      manager_id, 
      maxResponsesPerUser, 
      submissionCooldown,
      custom_response,
      accept_response,
      reject_response
    } = body;

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Title and at least one question are required" },
        { status: 400 }
      );
    }

    if (!guild_id) {
      return NextResponse.json(
        { error: "Guild ID is required" },
        { status: 400 }
      );
    }

    // Validate form fields
    if (title.length > 200) {
      return NextResponse.json(
        { error: "Form title must be 200 characters or less" },
        { status: 400 }
      );
    }

    if (description && description.length > 1000) {
      return NextResponse.json(
        { error: "Form description must be 1000 characters or less" },
        { status: 400 }
      );
    }

    if (questions.length > 30) {
      return NextResponse.json(
        { error: "Maximum 30 questions allowed per form" },
        { status: 400 }
      );
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.text || q.text.trim().length === 0) {
        return NextResponse.json(
          { error: `Question ${i + 1} text is required` },
          { status: 400 }
        );
      }

      if (q.text.length > 200) {
        return NextResponse.json(
          { error: `Question ${i + 1} text must be 200 characters or less` },
          { status: 400 }
        );
      }

      if (q.description && q.description.length > 400) {
        return NextResponse.json(
          { error: `Question ${i + 1} description must be 400 characters or less` },
          { status: 400 }
        );
      }

      if (q.placeholder && q.placeholder.length > 400) {
        return NextResponse.json(
          { error: `Question ${i + 1} placeholder must be 400 characters or less` },
          { status: 400 }
        );
      }
      if (q.type === "CHECKBOX" && q.required) {
        return NextResponse.json(
          { error: `Question ${i + 1} of type Checkbox cannot be required.` },
          { status: 400 }
        );
      }
      const needsOptions = ["MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN"].includes(q.type);
      if (needsOptions && (!q.options || q.options.length < 2)) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have at least 2 options` },
          { status: 400 }
        );
      }
    }

    // Check if form exists
    const existingForm = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    }) as any;

    if (!existingForm || existingForm.is_deleted) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Transaction to update form, questions, and options
    await prisma.$transaction(async (tx: any) => {
      // 1. Identify Questions to Delete
      const incomingQuestionIds = questions
        .filter((q: any) => q.id && !q.id.startsWith("new-"))
        .map((q: any) => q.id);

      const questionsToDelete = existingForm.questions
        .filter((q: any) => !incomingQuestionIds.includes(q.id))
        .map((q: any) => q.id);

      if (questionsToDelete.length > 0) {
        await tx.question.deleteMany({
          where: { id: { in: questionsToDelete } },
        });
      }

      // 2. Process Incoming Questions (Create or Update)
      for (const q of questions) {
        if (!q.id || q.id.startsWith("new-")) {
          // --- CREATE NEW QUESTION ---
          await tx.question.create({
            data: {
              formId,
              text: q.text,
              description: q.description || null,
              placeholder: q.placeholder || null,
              type: q.type,
              required: q.required || false,
              order: q.order,
              min: q.min,
              max: q.max,
              options: {
                create: q.options?.map((opt: any) => ({
                  text: typeof opt === "string" ? opt : opt.text,
                })) || [],
              },
            },
          });
        } else {
          // --- UPDATE EXISTING QUESTION ---
          await tx.question.update({
            where: { id: q.id },
            data: {
              text: q.text,
              description: q.description || null,
              placeholder: q.placeholder || null,
              type: q.type,
              required: q.required || false,
              order: q.order,
              min: q.min,
              max: q.max,
            },
          });

          // Handle Options Diffing for this question
          const existingQuestion = existingForm.questions.find((eq: any) => eq.id === q.id);
          const existingOptions = existingQuestion ? existingQuestion.options : [];
          
          const incomingOptions = q.options || [];
          const incomingOptionIds = incomingOptions
            .filter((o: any) => o.id && !o.id.toString().startsWith("new-"))
            .map((o: any) => o.id);

          // Options to Delete
          const optionsToDelete = existingOptions
            .filter((o: any) => !incomingOptionIds.includes(o.id))
            .map((o: any) => o.id);

          if (optionsToDelete.length > 0) {
            await tx.option.deleteMany({
              where: { id: { in: optionsToDelete } },
            });
          }

          // Options to Create or Update
          for (const opt of incomingOptions) {
            // Handle plain string options (fallback) or object options
            const optText = typeof opt === "string" ? opt : opt.text;
            const optId = typeof opt === "object" ? opt.id : null;

            if (!optId || optId.startsWith("new-")) {
              await tx.option.create({
                data: {
                  questionId: q.id,
                  text: optText,
                },
              });
            } else {
              await tx.option.update({
                where: { id: optId },
                data: {
                  text: optText,
                },
              });
            }
          }
        }
      }

      // 3. Update Parent Form Fields
      await tx.form.update({
        where: { id: formId },
        data: {
          title,
          description: description || null,
          guild_id: BigInt(guild_id),
          channel_id: channel_id ? BigInt(channel_id) : null,
          role_id: role_id ? BigInt(role_id) : null,
          manager_id: manager_id ? BigInt(manager_id) : null,
          maxResponsesPerUser: maxResponsesPerUser !== undefined ? parseInt(maxResponsesPerUser) : 1,
          submissionCooldown: submissionCooldown !== undefined ? parseInt(submissionCooldown) : 0,
          custom_response: custom_response !== undefined ? custom_response : false,
          accept_response: accept_response || null,
          reject_response: reject_response || null,
        } as any,
      });
    });

    // Fetch the final updated form to return
    const updatedForm = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializedForm = serializeData(updatedForm);

    return NextResponse.json(serializedForm);
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId } = await params;

    const form = await prisma.form.findUnique({
      where: { id: formId },
    }) as any;

    if (!form || form.is_deleted) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Check if user is a manager for this form's guild
    const userId = session.user.userId;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    const isManager = await checkIsManager(userId, form.guild_id.toString());
    if (!isManager) {
      return NextResponse.json(
        { error: "You must be a guild manager to delete this form" },
        { status: 403 }
      );
    }

    // Soft delete the form by setting is_deleted to true
    await prisma.form.update({
      where: { id: formId },
      data: { is_deleted: true } as any,
    });

    return NextResponse.json({ message: "Form deleted successfully" });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}
