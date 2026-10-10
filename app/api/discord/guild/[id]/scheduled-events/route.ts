import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { checkIsManager, getGuildScheduledEvents } from "@/lib/discord";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: guildId } = await params;
    if (!guildId) {
      return NextResponse.json(
        { error: "Guild ID is required" },
        { status: 400 }
      );
    }

    const isManager = await checkIsManager(session.user.userId, guildId);
    if (!isManager) {
      return NextResponse.json(
        { error: "You do not have permission to manage events in this guild" },
        { status: 403 }
      );
    }

    // 1. Fetch scheduled events from Discord API
    const discordEvents = await getGuildScheduledEvents(guildId);
    if (!Array.isArray(discordEvents)) {
      return NextResponse.json({ events: [] });
    }

    // 2. Fetch all linked discord_event_id from database for this guild
    const linkedEvents = await prisma.events.findMany({
      where: {
        guild_id: BigInt(guildId),
        discord_event_id: { not: null },
        is_deleted: false,
      },
      select: {
        discord_event_id: true,
      },
    });

    const linkedEventIds = new Set(
      linkedEvents.map((e) => e.discord_event_id?.toString())
    );

    // 3. Filter for upcoming/active events (1 = SCHEDULED, 2 = ACTIVE) not already linked
    const unlinkedEvents = discordEvents
      .filter((ev: any) => {
        const notLinked = !linkedEventIds.has(ev.id);
        const isActiveOrScheduled = ev.status === 1 || ev.status === 2;
        return notLinked && isActiveOrScheduled;
      })
      .map((ev: any) => ({
        id: ev.id,
        name: ev.name,
        description: ev.description || "",
        scheduled_start_time: ev.scheduled_start_time,
        scheduled_end_time: ev.scheduled_end_time || null,
        status: ev.status,
        entity_type: ev.entity_type,
        location: ev.entity_metadata?.location || null,
        banner: ev.image
          ? `https://cdn.discordapp.com/guild-events/${ev.id}/${ev.image}.png?size=1024`
          : "/tickap_dark.png",
        user_count: ev.user_count || 0,
      }));

    return NextResponse.json({ events: unlinkedEvents });
  } catch (error) {
    console.error("Error fetching unlinked scheduled events:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled events" },
      { status: 500 }
    );
  }
}
