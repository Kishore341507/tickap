import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { sendLookingForTeamNotification } from "@/lib/discord";

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

    if (!registration.events.enable_team_invites) {
      return NextResponse.json(
        { message: "Event does not allow team invites" },
        { status: 403 }
      );
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const inviteCount = await prisma.joinRequest.count({
      where: {
        registration_id: registration.id,
        type: "INVITE",
        updated_at: {
          gt: tenMinutesAgo,
        },
      },
    });

    if (inviteCount >= 3) {
      return NextResponse.json(
        { message: "Invite limit reached. Try again in 10 minutes." },
        { status: 429 }
      );
    }
    
    const existingInvite = await prisma.joinRequest.findFirst({
        where: {
            registration_id: registration.id,
            user_id: BigInt(userId),
            type: "INVITE"
        }
    });

    if (existingInvite) {
         if (existingInvite.status === "DECLINED") {
             return NextResponse.json(
                { message: "User has previously declined an invitation to this team" },
                { status: 400 }
            );
         }

         await prisma.joinRequest.update({
             where: { id: existingInvite.id },
             data: { status: "PENDING" }
         });

         return NextResponse.json({ message: "Invite sent successfully" });
    }

    // Check for pending request from user
    const existingRequest = await prisma.joinRequest.findFirst({
        where: {
            registration_id: registration.id,
            user_id: BigInt(userId),
            type: "REQUEST",
            status: "PENDING"
        }
    });

    if (existingRequest) {
         return NextResponse.json(
            { message: "User has already requested to join this team" },
            { status: 400 }
        );
    }

    const inTeam = registration.registrationusers.some(u => u.user_id === BigInt(userId));
    if (inTeam) {
         return NextResponse.json(
            { message: "User is already in the team" },
            { status: 400 }
        );
    }

    await prisma.joinRequest.create({
      data: {
        event_id: registration.event_id,
        registration_id: registration.id,
        user_id: BigInt(userId),
        user_name: username || "Unknown",
        user_pfp: pfp || null,
        type: "INVITE",
        status: "PENDING"
      },
    });

    const event = registration.events;
    if (event.notification_channel_id) {
      await sendLookingForTeamNotification({
        channelId: event.notification_channel_id.toString(),
        teamName: registration.team_name || "Unknown Team",
        members: registration.registrationusers.map((member) => ({
          user_id: member.user_id,
          user_name: member.user_name,
        })),
        eventId: event.id.toString(),
        color: 0x57F287, // Green embed
        mentionUserId: userId, // Mention target user in the message
      });
    }

    return NextResponse.json({ message: "Invite sent successfully" });

  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
