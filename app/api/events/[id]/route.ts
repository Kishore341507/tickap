import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { auth } from "@/auth";
import { checkIsManager } from "@/lib/discord";

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
    const session = await auth();
    const { id } = await params;
    
    // Validate event ID
    // const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Find the event in the database
    const event = await prisma.events.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if the user is a manager for this event's guild
    let isManager = false;
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session?.user && event.guild_id) {
      const userId = session.user.userId
      if (userId) {
        isManager = await checkIsManager(userId, event.guild_id.toString());
      }
    }

    if (!isManager) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Serialize data to handle BigInt values
    const serializedEvent = serializeData(event);
    
    return NextResponse.json({ event : serializedEvent });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}