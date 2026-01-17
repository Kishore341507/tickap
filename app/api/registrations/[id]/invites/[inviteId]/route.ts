import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, inviteId } = await params;

    const registration = await prisma.registrations.findUnique({
      where: { id: BigInt(id) },
      include: {
        registrationusers: true,
      },
    });

     if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 }
      );
    }

    const currentUser = registration.registrationusers.find(
      (u) => u.user_id === BigInt(session.user.userId!)
    );

    if (
      !currentUser ||
      (currentUser.role !== "LEADER" && currentUser.role !== "MANAGER")
    ) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    // Check if invite exists and belongs to this registration
    const invite = await prisma.joinRequest.findUnique({
        where: { id: inviteId }
    });

    if (!invite || invite.registration_id !== BigInt(id)) {
        return NextResponse.json(
            { message: "Invite not found" },
            { status: 404 }
        );
    }

    // Optional: check if it's strictly an invite and pending
    /*
    if (invite.status !== "PENDING" || invite.type !== "INVITE") {
         return NextResponse.json(
            { message: "Cannot revoke this request" },
            { status: 400 }
        );
    }
    */

    await prisma.joinRequest.delete({
        where: { id: inviteId }
    });

    return NextResponse.json({ message: "Invite revoked successfully" });

  } catch (error) {
     console.error("Error revoking invite:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
