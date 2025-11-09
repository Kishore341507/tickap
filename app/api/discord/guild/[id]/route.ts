import { NextRequest, NextResponse } from "next/server";
import { env } from 'process';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guildId } = await params;

    const response = await fetch(`${env.DISCORD_API_URL}/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch guild" },
        { status: response.status }
      );
    }

    const guild = await response.json();
    return NextResponse.json(guild);
  } catch (error) {
    console.error("Error fetching guild:", error);
    return NextResponse.json(
      { error: "Failed to fetch guild" },
      { status: 500 }
    );
  }
}
