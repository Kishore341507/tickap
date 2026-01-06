import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";

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

export async function GET(
  request: NextRequest,
  {params,}: {params: Promise<{ id: string }>}
) {
  try {
    const { id } = await params;
    
    // Validate event ID
    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Find the event in the database
    const event = await prisma.events.findUnique({
      where: {
        id: BigInt(id)
      },
      select: {
        id: true,
        name: true,
        banner: true,
        date: true,
        status: true,
        category: true,
        platform: true,
        is_solo: true,
        guild_id: true,
        created_at: true,
        updated_at: true,
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Serialize data to handle BigInt values
    const serializedEvent = serializeData(event);
    
    return NextResponse.json({ event : serializedEvent });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}