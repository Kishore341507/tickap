
import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json(); // "accept" or "decline"

    if (!["accept", "decline"].includes(action)) {
         return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    const inviteId = id;
    const userId = BigInt(session.user.userId);

    const invite = await prisma.joinRequest.findUnique({
        where: { id: inviteId },
        include: {
            registration: {
                include: {
                    events: true,
                    registrationusers: true
                }
            }
        }
    });

    if (!invite) {
        return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    if (invite.status !== "PENDING") {
         return NextResponse.json({ message: "Request is not pending" }, { status: 400 });
    }

    // Permission Check
    let hasPermission = false;
    let targetUserId = invite.user_id; // The user to be added/rejected

    if (invite.type === "INVITE") {
        // Case 1: User accepting an invite to join a team
        // The session user must be the invited user
        if (invite.user_id === userId) {
            hasPermission = true;
            targetUserId = userId;
        }
    } else if (invite.type === "REQUEST") {
        // Case 2: Team Leader/Manager approving a request to join the team
        // The session user must be a leader or manager of the team
        const currentUserRole = invite.registration.registrationusers.find(
            u => u.user_id === userId
        )?.role;
        
        if (currentUserRole === "LEADER" || currentUserRole === "MANAGER") {
            hasPermission = true;
            targetUserId = invite.user_id;
        }
    }

    if (!hasPermission) {
        return NextResponse.json({ message: "Permission denied" }, { status: 403 });
    }

    const registration = invite.registration;
    if (!registration) {
         return NextResponse.json({ message: "Registration not found" }, { status: 404 });
    }

    if (action === "decline") {
        await prisma.joinRequest.update({
            where: { id: inviteId },
            data: { status: "DECLINED" }
        });
        return NextResponse.json({ message: "Request declined" });
    }

    if (action === "accept") {
        // Validation checks
        
        // 1. Check if user already in event
        const userEventRegistration = await prisma.registrationusers.findFirst({
            where: {
                user_id: targetUserId,
                event_id: registration.event_id
            }
        });

        if (userEventRegistration) {
            return NextResponse.json(
                { message: "User is already registered for this event" },
                { status: 400 }
            );
        }

        // 2. Check if team is full
         if (registration.events.max_team_player && registration.registrationusers.length >= registration.events.max_team_player) {
             return NextResponse.json(
                { message: "Team is full" },
                { status: 400 }
            );
        }

        // Execute transaction
        await prisma.$transaction([
            prisma.joinRequest.update({
                where: { id: inviteId },
                data: { status: "ACCEPTED" }
            }),
            prisma.registrationusers.create({
                data: {
                    user_id: targetUserId,
                    registration_id: registration.id,
                    event_id: registration.event_id,
                    user_name: invite.user_name || "Unknown",
                    pfp: invite.user_pfp,
                    role: "MEMBER"
                }
            })
        ]);

        return NextResponse.json({ message: "Member added successfully" });
    }

  } catch (error) {
    console.error("Error responding to invite:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
