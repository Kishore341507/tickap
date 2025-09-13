import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const form = await prisma.forms.findUnique({
      where: { 
        id: BigInt(id),
        is_deleted: false
      },
      include: {
        form_questions: {
          orderBy: { question_order: 'asc' }
        },
        _count: {
          select: {
            form_responses: true
          }
        }
      }
    });

    if (!form) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(form);

  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, is_active, questions } = await request.json();

    // Check if user is authorized to edit this form
    const existingForm = await prisma.forms.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existingForm) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    if (existingForm.manager_id !== BigInt(session.user.userId!)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (questions && questions.length > 15) {
      return NextResponse.json({ message: "Maximum 15 questions allowed" }, { status: 400 });
    }

    // Update form with questions in a transaction
    const updatedForm = await prisma.$transaction(async (tx: any) => {
      // Update the form
      const form = await tx.forms.update({
        where: { id: BigInt(id) },
        data: {
          title: title || existingForm.title,
          is_active: is_active !== undefined ? is_active : existingForm.is_active,
        },
      });

      // If questions are provided, replace all existing questions
      if (questions) {
        // Delete existing questions
        await tx.form_questions.deleteMany({
          where: { form_id: BigInt(id) }
        });

        // Create new questions
        if (questions.length > 0) {
          await tx.form_questions.createMany({
            data: questions.map((q: any, index: number) => ({
              form_id: BigInt(id),
              question_text: q.question_text,
              description: q.description || null,
              placeholder: q.placeholder || null,
              default_value: q.default_value || null,
              question_type: q.question_type,
              is_required: q.is_required || false,
              question_order: q.question_order || index + 1,
              select_options: q.select_options ? JSON.stringify(q.select_options) : null,
            }))
          });
        }
      }

      return form;
    });

    return NextResponse.json({
      message: "Form updated successfully",
      form: {
        id: updatedForm.id.toString(),
        title: updatedForm.title,
        is_active: updatedForm.is_active,
      }
    });

  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is authorized to delete this form
    const existingForm = await prisma.forms.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existingForm) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    if (existingForm.manager_id !== BigInt(session.user.userId!)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Soft delete the form
    await prisma.forms.update({
      where: { id: BigInt(id) },
      data: { is_deleted: true },
    });

    return NextResponse.json({ message: "Form deleted successfully" });

  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}