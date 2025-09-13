import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { responses, user_name } = await request.json();

    // Get session for user_id if authenticated
    const session = await auth();
    const user_id = session?.user?.userId ? BigInt(session.user.userId) : null;

    // Check if form exists and is active
    const form = await prisma.forms.findUnique({
      where: { 
        id: BigInt(id),
        is_deleted: false,
        is_active: true
      },
      include: {
        form_questions: true
      }
    });

    if (!form) {
      return NextResponse.json({ message: "Form not found or inactive" }, { status: 404 });
    }

    // Validate required questions are answered
    const requiredQuestions = form.form_questions.filter(q => q.is_required);
    for (const question of requiredQuestions) {
      if (!responses[question.id.toString()] || responses[question.id.toString()].trim() === "") {
        return NextResponse.json({ 
          message: `Question "${question.question_text}" is required` 
        }, { status: 400 });
      }
    }

    // Create form response
    const formResponse = await prisma.form_responses.create({
      data: {
        form_id: BigInt(id),
        user_id,
        user_name: user_name || session?.user?.name || null,
        responses: JSON.stringify(responses),
      },
    });

    return NextResponse.json({
      message: "Form response submitted successfully",
      response_id: formResponse.id.toString()
    });

  } catch (error) {
    console.error("Error submitting form response:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is authorized to view responses (form owner)
    const form = await prisma.forms.findUnique({
      where: { id: BigInt(id) }
    });

    if (!form) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    if (form.manager_id !== BigInt(session.user.userId!)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get all responses for this form
    const responses = await prisma.form_responses.findMany({
      where: { form_id: BigInt(id) },
      orderBy: { submitted_at: 'desc' }
    });

    return NextResponse.json(responses);

  } catch (error) {
    console.error("Error fetching form responses:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}