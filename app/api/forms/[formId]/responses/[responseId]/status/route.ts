import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { auth } from "@/auth";
import { checkIsManager } from "@/lib/discord";

enum ResponseStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED"
}

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; responseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId, responseId } = await params;
    const body = await request.json();
    const { status, custom_message } = body;

    if (!Object.values(ResponseStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if form exists and user is manager
    const form = await prisma.form.findUnique({
      where: { id: formId },
    }) as any;

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const isManager = await checkIsManager(session.user.userId, form.guild_id.toString());
    if (!isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedResponse = await prisma.response.update({
      where: { id: responseId },
      data: { 
        status: status as any,
        custom_message: custom_message
      }
    });

    return NextResponse.json(serializeData(updatedResponse));
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
