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
    const body = await req.json();
    const { userId, username, pfp } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const registration = await prisma.registrations.findUnique({
      where: { id: BigInt(id) },
      include: {
        events: true,
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

    if (!registration.events.register_for_other) {
      return NextResponse.json(
        { message: "Event does not allow adding members" },
        { status: 403 }
      );
    }

    if (
      registration.events.max_team_player &&
      registration.registrationusers.length >=
        registration.events.max_team_player
    ) {
      return NextResponse.json(
        { message: "Team is full" },
        { status: 400 }
      );
    }

    const existingUser = registration.registrationusers.find(
      (u) => u.user_id === BigInt(userId)
    );

    if (existingUser) {
        return NextResponse.json(
            { message: "User is already in the team" },
            { status: 400 }
        );
    }
    
    // Check if user is already registered in another team for this event
    const duplicateRegistration = await prisma.registrationusers.findFirst({
        where: {
            event_id: registration.event_id,
            user_id: BigInt(userId)
        }
    });

    if (duplicateRegistration) {
        return NextResponse.json(
            { message: "User is already registered for this event" },
            { status: 400 }
        );
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const memberAddCount = await prisma.registrationusers.count({
      where: {
        registration_id: registration.id,
        created_at: {
          gt: tenMinutesAgo,
        },
      },
    });

    if (memberAddCount >= 3) {
      return NextResponse.json(
        { message: "Member addition limit reached. Try again in 10 minutes." },
        { status: 429 }
      );
    }

    await prisma.registrationusers.create({
      data: {
        registration_id: registration.id,
        user_id: BigInt(userId),
        event_id: registration.event_id,
        user_name: username || "Unknown",
        pfp: pfp || null,
        role: "MEMBER",
      },
    });

    return NextResponse.json({ message: "Member added successfully" });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { targetUserId } = body;

        if (!targetUserId) {
             return NextResponse.json(
                { message: "Target User ID is required" },
                { status: 400 }
            );
        }

        const registration = await prisma.registrations.findUnique({
            where: { id: BigInt(id) },
            include: {
                registrationusers: true,
                events: true,
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

        const targetUser = registration.registrationusers.find(u => u.user_id === BigInt(targetUserId));
        if (!targetUser) {
             return NextResponse.json(
                { message: "User not found in team" },
                { status: 404 }
            );
        }

        if (targetUser.role === "LEADER" && currentUser.user_id !== targetUser.user_id) {
             return NextResponse.json(
                { message: "Cannot remove the team leader" },
                { status: 403 }
            );
        }
        
        if (currentUser.role === "MANAGER" && (targetUser.role === "MANAGER" || targetUser.role === "LEADER") && currentUser.user_id !== targetUser.user_id) {
             return NextResponse.json(
                { message: "Managers cannot remove other managers or the leader" },
                { status: 403 }
            );
        }

        await prisma.registrationusers.deleteMany({
            where: {
                registration_id: registration.id,
                user_id: BigInt(targetUserId)
            }
        });

        // Check if the team becomes incomplete and incomplete teams are not allowed
        if (!registration.events.allow_incomplete_teams && registration.events.min_team_player) {
            const remainingMembers = registration.registrationusers.filter(u => u.user_id !== BigInt(targetUserId)).length;
            
            if (remainingMembers < registration.events.min_team_player) {
                await prisma.registrations.delete({
                    where: { id: registration.id }
                });
                return NextResponse.json({ message: "Registration deleted as team became incomplete" });
            }
        }

        return NextResponse.json({ message: "Member removed successfully" });

    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
