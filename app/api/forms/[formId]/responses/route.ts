import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { auth } from "@/auth";

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

    // Check limits
    const session = await auth();
    const userId = session?.user?.userId;

    if (userId) {
      const userBigInt = BigInt(userId);

      // Check Max Submissions
      if (form.maxResponsesPerUser > 0) {
        const userResponseCount = await prisma.response.count({
          where: {
            formId: formId,
            userId: userBigInt,
          },
        });

        if (userResponseCount >= form.maxResponsesPerUser) {
          return NextResponse.json(
            { error: `You have reached the limit of ${form.maxResponsesPerUser} submission(s) for this form.` },
            { status: 403 }
          );
        }
      }

      // Check Cooldown
      if (form.submissionCooldown > 0) {
        const lastResponse = await prisma.response.findFirst({
          where: {
            formId: formId,
            userId: userBigInt,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (lastResponse) {
          const timeSinceLast = (new Date().getTime() - lastResponse.createdAt.getTime()) / 1000;
          if (timeSinceLast < form.submissionCooldown) {
            const waitTime = Math.ceil(form.submissionCooldown - timeSinceLast);
            return NextResponse.json(
              { error: `Please wait ${waitTime} seconds before submitting again.` },
              { status: 429 }
            );
          }
        }
      }
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
        userId: userId ? BigInt(userId) : null,
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
