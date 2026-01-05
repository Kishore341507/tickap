import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { EventStatus, Platform, Category } from "@prisma/client";
import { checkIsManager } from "@/lib/discord";
import { createEventLog } from "@/lib/event-logger";
import { EventLogType , EventLogTarget } from "@prisma/client";

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

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to create an event" },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await req.formData();
    
    // Check if user is a manager for the specified guild
    const userId = session.user?.userId;
    const guildId = formData.get("guild_id")?.toString();
    
    if (!userId || !guildId) {
      return NextResponse.json(
        { error: "Invalid user or guild information" },
        { status: 400 }
      );
    }

    const isManager = await checkIsManager(userId, guildId);
    if (!isManager) {
      return NextResponse.json(
        { error: "You do not have permission to create events for this guild" },
        { status: 403 }
      );
    }
    
    // Handle banner upload
    let bannerPath = "/tickap_dark.png"; // Default banner
    const bannerFile = formData.get("banner") as File || null;
    
    if ( bannerFile && bannerFile.size && bannerFile instanceof Blob) {
      try {
        console.log("Uploading banner file:", bannerFile);
        const bytes = await bannerFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileStorage = await prisma.fileStorage.create({
          data: {
            filename: bannerFile.name || "unknown.png",
            mimetype: bannerFile.type || "image/png",
            data: buffer,
            size: buffer.length,
          },
        });

        // Use the file ID as the banner path
        bannerPath = `/api/files/${fileStorage.id}`;

      } catch (error) {
        console.error("Error uploading banner:", error);
        console.log("Using default banner");
        // Continue with default banner if upload fails
      }
    }

    // Parse form data
    const data = {
      name: formData.get("name") as string,
      banner: bannerPath,
      date: formData.get("date") ? new Date(formData.get("date") as string) : null,
      // start_time: parseInt(formData.get("start_time")?.toString().replace(":", "") || "0"),
      prize: formData.get("prize") as string || null,
      max_teams: formData.get("max_teams") ? parseInt(formData.get("max_teams") as string) : null,
      min_team_player: formData.get("min_team_player") ? parseInt(formData.get("min_team_player") as string) : null,
      max_team_player: formData.get("max_team_player") ? parseInt(formData.get("max_team_player") as string) : null,
      rules: formData.get("rules") as string || null,
      details: formData.get("details") as string || null,
      is_solo: formData.get("is_solo") === "true",
      extra: formData.get("extra") ? JSON.parse(formData.get("extra") as string) : null,
      redirect_url: formData.get("redirect_url") as string || null,
      location: formData.get("location") as string || null,
      location_url: formData.get("location_url") as string || null,
      status: (formData.get("status") as EventStatus) || EventStatus.Open,
      category: (formData.get("category") as Category) || Category.VideoGame,
      category_name: formData.get("category_name") as string || null,
      platform: (formData.get("platform") as Platform) || Platform.Discord,
      role_id: formData.get("role_id") ? BigInt(formData.get("role_id") as string) : null,
      manager_id: formData.get("manager_id") ? BigInt(formData.get("manager_id") as string) : null, 
      guild_id: formData.get("guild_id") ? BigInt(formData.get("guild_id") as string) : null,
      channel_id: formData.get("channel_id") ? BigInt(formData.get("channel_id") as string) : null,
      hide_registrations: formData.get("hide_registrations") === "true",
      hide_registration_count: formData.get("hide_registration_count") === "true",
    };

    // Create event in database
    const event = await prisma.events.create({
      data
    });

    await createEventLog({
      event_id: event.id,
      log_type: EventLogType.CREATE,
      log_target: EventLogTarget.EVENT,
      new_data: data,
    });

    // Serialize the event to handle BigInt values
    const serializedEvent = serializeData(event);
    return NextResponse.json({ event: serializedEvent }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const events = await prisma.events.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    // Serialize events to handle BigInt values
    const serializedEvents = serializeData(events);
    return NextResponse.json({ events: serializedEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to update an event" },
        { status: 401 }
      );
    }

    // Get event ID from request
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("id");
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Find the event
    const existingEvent = await prisma.events.findUnique({
      where: { id: parseInt(eventId) },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user is a manager for this guild
    const userId = session.user?.userId;
    const guildId = existingEvent.guild_id?.toString();
    
    if (!userId || !guildId) {
      return NextResponse.json(
        { error: "Invalid user or guild information" },
        { status: 400 }
      );
    }

    const isManager = await checkIsManager(userId, guildId);
    if (!isManager) {
      return NextResponse.json(
        { error: "You do not have permission to update this event" },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await req.formData();
    
    // Handle banner upload
    let bannerPath = existingEvent.banner; // Keep existing banner by default
    const bannerFile = formData.get("banner") as File || null;
    
    if (bannerFile && bannerFile.size && bannerFile instanceof Blob) {
      try {
        console.log("Uploading new banner file:", bannerFile);
        const bytes = await bannerFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileStorage = await prisma.fileStorage.create({
          data: {
            filename: bannerFile.name || "unknown.png",
            mimetype: bannerFile.type || "image/png",
            data: buffer,
            size: buffer.length,
          },
        });

        // Use the file ID as the banner path
        bannerPath = `/api/files/${fileStorage.id}`;

      } catch (error) {
        console.error("Error uploading banner:", error);
        console.log("Keeping existing banner");
        // Continue with existing banner if upload fails
      }
    }

    // Parse form data
    const data = {
      name: formData.get("name") as string || existingEvent.name,
      banner: bannerPath,
      date: formData.get("date") ? new Date(formData.get("date") as string) : existingEvent.date,
      // start_time: formData.get("start_time") ? parseInt(formData.get("start_time")?.toString().replace(":", "") || "0") : existingEvent.start_time,
      prize: formData.get("prize") as string || existingEvent.prize,
      max_teams: formData.get("max_teams") ? parseInt(formData.get("max_teams") as string) : existingEvent.max_teams,
      min_team_player: formData.get("min_team_player") ? parseInt(formData.get("min_team_player") as string) : existingEvent.min_team_player,
      max_team_player: formData.get("max_team_player") ? parseInt(formData.get("max_team_player") as string) : existingEvent.max_team_player,
      rules: formData.get("rules") as string || existingEvent.rules,
      details: formData.get("details") as string || existingEvent.details,
      is_solo: formData.has("is_solo") ? formData.get("is_solo") === "true" : existingEvent.is_solo,
      extra: formData.get("extra") ? JSON.parse(formData.get("extra") as string) : existingEvent.extra,
      redirect_url: formData.get("redirect_url") as string || existingEvent.redirect_url,
      location: formData.get("location") as string || existingEvent.location,
      location_url: formData.get("location_url") as string || existingEvent.location_url,
      status: formData.get("status") as EventStatus || existingEvent.status,
      category: formData.get("category") as Category || existingEvent.category,
      category_name: formData.get("category_name") as string || existingEvent.category_name,
      platform: formData.get("platform") as Platform || existingEvent.platform,
      role_id: formData.get("role_id") ? BigInt(formData.get("role_id") as string) : existingEvent.role_id,
      manager_id: formData.get("manager_id") ? BigInt(formData.get("manager_id") as string) : existingEvent.manager_id,
      guild_id: formData.get("guild_id") ? BigInt(formData.get("guild_id") as string) : existingEvent.guild_id,
      channel_id: formData.get("channel_id") ? BigInt(formData.get("channel_id") as string) : existingEvent.channel_id,
      hide_registrations: formData.has("hide_registrations") ? formData.get("hide_registrations") === "true" : existingEvent.hide_registrations,
      hide_registration_count: formData.has("hide_registration_count") ? formData.get("hide_registration_count") === "true" : existingEvent.hide_registration_count,
      updated_at: new Date(),
    };

    // Update event in database
    const updatedEvent = await prisma.events.update({
      where: { id: parseInt(eventId) },
      data
    });

    await createEventLog({
      event_id: updatedEvent.id,
      log_type: EventLogType.UPDATE,
      log_target: EventLogTarget.EVENT,
      old_data: existingEvent,
      new_data: data,
    });

    const serializedEvent = serializeData(updatedEvent);
    return NextResponse.json({ event: serializedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}