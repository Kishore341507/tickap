import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user?.userId) {
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    const userId = BigInt(session.user.userId);

    // Find all events where the user is registered
    const registrations = await prisma.registrationusers.findMany({
      where: {
        user_id: userId,
      },
      select: {
        event_id: true,
      },
      distinct: ['event_id'],
    });

    if (registrations.length === 0) {
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    // Get event IDs
    const eventIds = registrations.map(r => r.event_id);

    // Fetch the actual events
    const events = await prisma.events.findMany({
      where: {
        id: {
          in: eventIds,
        },
        is_deleted: false,
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
      },
      orderBy: {
        date: 'desc',
      },
    });

    const serializedEvents = serializeData(events);
    return NextResponse.json({ events: serializedEvents }, { status: 200 });
  } catch (error) {
    console.error("Error fetching participated events:", error);
    return NextResponse.json(
      { error: "Failed to fetch participated events" },
      { status: 500 }
    );
  }
}
