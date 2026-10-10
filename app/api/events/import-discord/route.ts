import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { env } from "process";
import {
  checkIsManager,
  mapDiscordStatusToTickAp,
} from "@/lib/discord";
import { createEventLog } from "@/lib/event-logger";
import { EventLogType, EventLogTarget, Platform, Category } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json(
        { error: "You must be logged in to import an event" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { guildId, discordEventId } = body;

    if (!guildId || !discordEventId) {
      return NextResponse.json(
        { error: "guildId and discordEventId are required" },
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

    // Check if already linked
    const existing = await prisma.events.findUnique({
      where: {
        discord_event_id: BigInt(discordEventId),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This Discord event is already linked to a TickAp event", eventId: existing.id.toString() },
        { status: 409 }
      );
    }

    // Fetch the event from Discord API
    const discordRes = await fetch(
      `${env.DISCORD_API_URL}/guilds/${guildId}/scheduled-events/${discordEventId}`,
      {
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!discordRes.ok) {
      const err = await discordRes.text();
      return NextResponse.json(
        { error: `Failed to fetch Discord scheduled event: ${err}` },
        { status: discordRes.status }
      );
    }

    const discordEvent = await discordRes.json();

    const bannerUrl = discordEvent.image
      ? `https://cdn.discordapp.com/guild-events/${discordEvent.id}/${discordEvent.image}.png?size=1024`
      : "/tickap_dark.png";

    const eventDate = discordEvent.scheduled_start_time
      ? new Date(discordEvent.scheduled_start_time)
      : null;

    const eventStatus = mapDiscordStatusToTickAp(discordEvent.status);

    const initialEvent = await prisma.events.create({
      data: {
        name: discordEvent.name,
        details: discordEvent.description || null,
        date: eventDate,
        banner: bannerUrl,
        status: eventStatus,
        guild_id: BigInt(guildId),
        discord_event_id: BigInt(discordEventId),
        is_solo: true,
        platform: Platform.Discord,
        category: Category.VideoGame,
        manager_id: BigInt(session.user.userId),
        location_url: null,
      },
    });

    const locationUrl = `https://tickap.com/event/${initialEvent.id}`;

    // Update location_url in DB
    const finalEvent = await prisma.events.update({
      where: { id: initialEvent.id },
      data: { location_url: locationUrl },
    });

    // Try updating location on Discord if entity_type is EXTERNAL (3)
    if (discordEvent.entity_type === 3) {
      try {
        await fetch(
          `${env.DISCORD_API_URL}/guilds/${guildId}/scheduled-events/${discordEventId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              entity_metadata: { location: locationUrl },
            }),
            cache: "no-store",
          }
        );
      } catch (err) {
        console.warn("Could not update location metadata on Discord event:", err);
      }
    }

    await createEventLog({
      event_id: finalEvent.id,
      log_type: EventLogType.CREATE,
      log_target: EventLogTarget.EVENT,
      new_data: {
        source: "DISCORD_SCHEDULED_EVENT_IMPORT",
        discord_event_id: discordEventId,
        name: finalEvent.name,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: finalEvent.id.toString(),
    });
  } catch (error: any) {
    console.error("Error importing Discord scheduled event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import event" },
      { status: 500 }
    );
  }
}
