import { NextRequest, NextResponse } from "next/server";
import { checkIsManager } from "@/lib/discord";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const guildId = searchParams.get("guildId");

    if (!userId || !guildId) {
      return NextResponse.json(
        { error: "userId and guildId are required" },
        { status: 400 }
      );
    }

    const isManager = await checkIsManager(userId, guildId);
    
    return NextResponse.json({ isManager });
  } catch (error) {
    console.error("Error checking manager status:", error);
    return NextResponse.json(
      { error: "Failed to check manager status" },
      { status: 500 }
    );
  }
}
