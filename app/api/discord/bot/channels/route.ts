import { NextResponse } from "next/server";
import { getGuildChannels } from "@/lib/discord";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get("guildId");

  if (!guildId) {
    return NextResponse.json(
      { error: "Guild ID is required" },
      { status: 400 }
    );
  }

  try {
    const channels = await getGuildChannels(guildId);
    
    if (!channels) {
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 404 }
      );
    }

    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 