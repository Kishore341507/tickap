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
    const userId = BigInt(session.user.userId);

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

    // Check if event allows requests
    if (!registration.events.enable_team_requests) {
        return NextResponse.json(
            { message: "Event does not allow team requests" },
            { status: 403 }
        );
    }

    // Check if registration accepts requests
    if (!registration.requests_open) {
        return NextResponse.json(
            { message: "This team is not accepting requests" },
            { status: 403 }
        );
    }

    // Check if user is already in this team
    const inTeam = registration.registrationusers.some(u => u.user_id === userId);
    if (inTeam) {
        return NextResponse.json(
            { message: "You are already in this team" },
            { status: 400 }
        );
    }

    // Check if user is already registered in ANY team for this event
    const userEventRegistration = await prisma.registrationusers.findFirst({
        where: {
            user_id: userId,
            event_id: registration.event_id
        }
    });

    if (userEventRegistration) {
        return NextResponse.json(
            { message: "You are already registered for this event" },
            { status: 400 }
        );
    }

    // Check if team is full
    if (registration.events.max_team_player && registration.registrationusers.length >= registration.events.max_team_player) {
         return NextResponse.json(
            { message: "Team is full" },
            { status: 400 }
        );
    }

    // Check for cooldown
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const requestCount = await prisma.joinRequest.count({
      where: {
        registration_id: registration.id,
        user_id: userId,
        type: "REQUEST",
        updated_at: {
          gt: tenMinutesAgo,
        },
      },
    });

    if (requestCount >= 3) {
      return NextResponse.json(
        { message: "Request limit reached. Try again in 10 minutes." },
        { status: 429 }
      );
    }

    // Check for existing request (any status)
    const existingRequest = await prisma.joinRequest.findFirst({
        where: {
            registration_id: registration.id,
            user_id: userId,
            type: "REQUEST"
        }
    });

    if (existingRequest) {
         if (existingRequest.status === "DECLINED") {
             return NextResponse.json(
                { message: "Your request to join this team was previously declined" },
                { status: 400 }
            );
         }

         // Update to pending if it was cancelled or whatever else (except accepted which should be caught by inTeam check)
         await prisma.joinRequest.update({
             where: { id: existingRequest.id },
             data: { status: "PENDING" }
         });

         return NextResponse.json({ message: "Request sent successfully" });
    }

    await prisma.joinRequest.create({
      data: {
        event_id: registration.event_id,
        registration_id: registration.id,
        user_id: userId,
        user_name: session.user.name,
        user_pfp: session.user.image,
        type: "REQUEST",
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Request sent successfully" });
  } catch (error) {
    console.error("Error creating join request:", error);
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
    const userId = BigInt(session.user.userId);
    
    // Check if request exists
    const existingRequest = await prisma.joinRequest.findFirst({
        where: {
            registration_id: BigInt(id),
            user_id: userId,
            status: "PENDING",
            type: "REQUEST"
        }
    });

    if (!existingRequest) {
         return NextResponse.json(
            { message: "No pending request found" },
            { status: 404 }
        );
    }
    
    await prisma.joinRequest.update({
        where: {
            id: existingRequest.id
        },
        data: {
            status: "CANCELLED"
        }
    });
    
    return NextResponse.json({ message: "Request revoked successfully" });

  } catch (error) {
    console.error("Error revoking join request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

