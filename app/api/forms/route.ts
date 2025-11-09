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

// GET - List forms by userId or guildId
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const guildId = searchParams.get("guildId");

    const where = userId ? { userId, is_deleted: false } : guildId ? { guild_id: BigInt(guildId), is_deleted: false } : { is_deleted: false };

    const forms = await prisma.form.findMany({
      where,
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        responses: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializedForms = serializeData(forms);

    return NextResponse.json(serializedForms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

// POST - Create a new form
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, questions, guild_id, channel_id, role_id, manager_id } = body;

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

    // Check if user is a manager for the specified guild
    const userId = session.user.userId;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    const isManager = await checkIsManager(userId, guild_id);
    if (!isManager) {
      return NextResponse.json(
        { error: "You must be a guild manager to create forms" },
        { status: 403 }
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

      const needsOptions = ["MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN"].includes(q.type);
      if (needsOptions && (!q.options || q.options.length < 2)) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have at least 2 options` },
          { status: 400 }
        );
      }
    }

    const form = await prisma.form.create({
      data: {
        title,
        description: description || null,
        userId: session.user.userId || null,
        guild_id: BigInt(guild_id),
        channel_id: channel_id ? BigInt(channel_id) : null,
        role_id: role_id ? BigInt(role_id) : null,
        manager_id: manager_id ? BigInt(manager_id) : null,
        questions: {
          create: questions.map((q: any) => ({
            text: q.text,
            description: q.description || null,
            placeholder: q.placeholder || null,
            type: q.type,
            required: q.required || false,
            order: q.order,
            options: {
              create: q.options?.map((opt: string) => ({ text: opt })) || [],
            },
          })),
        },
      } as any,
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializedForm = serializeData(form);

    return NextResponse.json(serializedForm, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a form (or hard delete if needed)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    // Check if form exists
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        userId: true,
        guild_id: true,
        is_deleted: true,
      },
    } as any);

    if (!form || form.is_deleted ) {
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
