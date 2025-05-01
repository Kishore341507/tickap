import { NextResponse } from "next/server";
import { searchGuildMembers } from "@/lib/discord";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get("guildId");
  const query = searchParams.get("query");
  const limit = searchParams.get("limit");

  if (!guildId) {
    return NextResponse.json(
      { error: "Guild ID is required" },
      { status: 400 }
    );
  }

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  try {
    const members = await searchGuildMembers(
      guildId, 
      query, 
      limit ? parseInt(limit) : undefined
    );
    
    if (!members) {
      return NextResponse.json(
        { error: "Failed to search members" },
        { status: 404 }
      );
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error searching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}