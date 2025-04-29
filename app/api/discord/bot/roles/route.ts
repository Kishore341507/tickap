import { NextResponse } from "next/server";
import { getGuildRoles } from "@/lib/discord";

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
    const roles = await getGuildRoles(guildId);
    
    if (!roles) {
      return NextResponse.json(
        { error: "Failed to fetch roles" },
        { status: 404 }
      );
    }

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 