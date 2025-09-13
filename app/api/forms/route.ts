import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, guild_id, questions } = await request.json();

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    if (questions && questions.length > 15) {
      return NextResponse.json({ message: "Maximum 15 questions allowed" }, { status: 400 });
    }

    // Create form with questions in a transaction
    const form = await prisma.$transaction(async (tx) => {
      // Create the form
      const newForm = await tx.forms.create({
        data: {
          title,
          guild_id: guild_id ? BigInt(guild_id) : null,
          manager_id: BigInt(session.user.userId!),
        },
      });

      // Create questions if provided
      if (questions && questions.length > 0) {
        await tx.form_questions.createMany({
          data: questions.map((q: any, index: number) => ({
            form_id: newForm.id,
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

      return newForm;
    });

    return NextResponse.json({
      message: "Form created successfully",
      form: {
        id: form.id.toString(),
        title: form.title,
        is_active: form.is_active,
      }
    });

  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guild_id = searchParams.get('guild_id');

    const where = guild_id 
      ? { guild_id: BigInt(guild_id), is_deleted: false }
      : { is_deleted: false };

    const forms = await prisma.forms.findMany({
      where,
      include: {
        form_questions: {
          orderBy: { question_order: 'asc' }
        },
        _count: {
          select: {
            form_responses: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(forms);

  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}