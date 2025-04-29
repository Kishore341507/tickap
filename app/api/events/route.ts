import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { EventStatus, Platform, Category } from "@prisma/client";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { randomUUID } from "crypto";

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
    
    // Handle banner upload
    let bannerPath = "/tickap_dark.png"; // Default banner
    const bannerFile = formData.get("banner") ;
    // bannerFile is a string
    // console.log("Banner file type:", typeof bannerFile);
    // console.log("Banner file1:", bannerFile?.valueOf());
    // console.log("Banner file2:", bannerFile?.toString());
    
    if (bannerFile && bannerFile instanceof Blob) {
    // if (bannerFile ) {
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
      start_time: parseInt(formData.get("start_time")?.toString().replace(":", "") || "0"),
      prize: formData.get("prize") as string || null,
      max_teams: formData.get("max_teams") ? parseInt(formData.get("max_teams") as string) : null,
      min_team_player: formData.get("min_team_player") ? parseInt(formData.get("min_team_player") as string) : null,
      max_team_player: formData.get("max_team_player") ? parseInt(formData.get("max_team_player") as string) : null,
      rules: formData.get("rules") as string || null,
      details: formData.get("details") as string || null,
      is_solo: formData.get("is_solo") === "true",
      redirect_url: formData.get("redirect_url") as string || null,
      location: formData.get("location") as string || null,
      location_url: formData.get("location_url") as string || null,
      status: (formData.get("status") as EventStatus) || EventStatus.Open,
      category: (formData.get("category") as Category) || Category.VedioGame,
      category_name: formData.get("category_name") as string || null,
      platform: (formData.get("platform") as Platform) || Platform.Discord,
      role_id: formData.get("role_id") ? BigInt(formData.get("role_id") as string) : null,
      manager_id: formData.get("manager_id") ? BigInt(formData.get("manager_id") as string) : null, 
      guild_id: formData.get("guild_id") ? BigInt(formData.get("guild_id") as string) : null,
      channel_id: formData.get("channel_id") ? BigInt(formData.get("channel_id") as string) : null,
    };

    // Create event in database
    const event = await prisma.events.create({
      data
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