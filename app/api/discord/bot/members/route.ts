import { NextResponse } from "next/server";
import { getGuildMembers } from "@/lib/discord";

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
    const members = await getGuildMembers(guildId);
    
    if (!members) {
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 404 }
      );
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}