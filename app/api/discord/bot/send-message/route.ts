
import { NextResponse } from "next/server";
import { env } from "process";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      channelId, 
      content, 
      description, 
      color, 
      username, 
      pfpUrl, 
      thumbnailUrl, 
      imageUrl,
      eventLink,
      eventId
    } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    const embed: any = {
      description: description,
      color: color ? parseInt(color.replace("#", ""), 16) : 0,
    };

    if (username || pfpUrl) {
      embed.author = {
        name: username,
        icon_url: pfpUrl,
      };
    }

    if (thumbnailUrl) {
      embed.thumbnail = {
        url: thumbnailUrl,
      };
    }

    if (imageUrl) {
      embed.image = {
        url: imageUrl,
      };
    }
    
    // Clean up empty fields
    if (!embed.description) delete embed.description;

    const messagePayload: any = {
      content: content,
      embeds: [embed],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 5, // Link
              label: "Event",
              url: eventLink, // We should pass the event link
            },
            {
              type: 2, // Button
              style: 3, // Green (Success)
              label: "Register", // Assuming "Register" based on context
              custom_id: `event_id:${eventId}`,
            },
          ],
        },
      ],
    };

    // If description is empty and no other embed fields, we might want to skip embed?
    // But user asked for specific fields. If they are empty, we just don't render them in embed.

    const response = await fetch(
      `${env.DISCORD_API_URL}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Discord API Error:", errorData);
        return NextResponse.json(
            { error: errorData.message || "Failed to send message to Discord" },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
