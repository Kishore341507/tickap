import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";

// POST - Submit a response to a form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { userName, userEmail, answers } = body;

    // Validate form exists
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: true,
      },
    });

    if (!form || form.is_deleted) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Validate required fields
    if (!userName || !userEmail || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: "Name, email, and answers are required" },
        { status: 400 }
      );
    }

    // Create the response with answers
    const response = await prisma.response.create({
      data: {
        formId,
        userName,
        userEmail,
        answers: {
          create: answers.map((answer: { questionId: string; value: string }) => ({
            questionId: answer.questionId,
            value: answer.value,
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}

// GET - Get all responses for a form (for form owners)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;

    const responses = await prisma.response.findMany({
      where: { formId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
