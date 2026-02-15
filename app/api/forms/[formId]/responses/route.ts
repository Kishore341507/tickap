import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { auth } from "@/auth";
import { checkIsManager } from "@/lib/discord";

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

// DELETE - Delete responses
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    
    // Authenticate user
    const session = await auth();
    if (!session || !session.user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.userId;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    
    const { responseIds } = body;

    if (!responseIds || !Array.isArray(responseIds) || responseIds.length === 0) {
      return NextResponse.json(
        { error: "No response IDs provided" },
        { status: 400 }
      );
    }

    // Fetch form to get guild_id
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { guild_id: true }
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Check if manager
    const isManager = await checkIsManager(userId, form.guild_id.toString());

    if (!isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete responses
    const result = await prisma.response.deleteMany({
      where: {
        id: { in: responseIds },
        formId: formId,
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error deleting responses:", error);
    return NextResponse.json(
      { error: "Failed to delete responses" },
      { status: 500 }
    );
  }
}
