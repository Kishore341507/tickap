import { env } from "process";
import auth from "next-auth";
import prisma from "@/prisma/db";

/**
 * Fetches the Discord OAuth2 access token for a user from the database
 * @param userId The Discord user ID
 * @returns The access token if found, otherwise null
 */
async function fetchAccessTokenForUser(userId: string): Promise<string | null> {
  try {
    // Find the account in the database where the providerAccountId matches the Discord userId
    const account = await prisma.account.findFirst({
      where: {
        provider: "discord",
        providerAccountId: userId
      }
    });
    
    return account?.access_token || null;
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null;
  }
}

export async function getGuild(guildId: string) {
  const guildResponse = await fetch(
    `${env.DISCORD_API_URL}/guilds/${guildId}`,
    {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      next: {
        revalidate: 300,
      },
    }
  );

  if (!guildResponse.ok) {
    return null;
  }

  return await guildResponse.json();
}

export async function getMember(guildId: string, userId: string) {
  const memberResponse = await fetch(
    `${env.DISCORD_API_URL}/guilds/${guildId}/members/${userId}`,
    {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      next: {
        revalidate: 60,
      },
    }
  );

  if (!memberResponse.ok) {
    return null;
  }

  return await memberResponse.json();
}

export async function getGuildChannels(guildId: string) {
  const channelsResponse = await fetch(
    `${env.DISCORD_API_URL}/guilds/${guildId}/channels`,
    {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      next: {
        revalidate: 300,
      },
    }
  );

  if (!channelsResponse.ok) {
    return null;
  }

  return await channelsResponse.json();
}

export async function getGuildRoles(guildId: string) {
  const rolesResponse = await fetch(
    `${env.DISCORD_API_URL}/guilds/${guildId}/roles`,
    {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      next: {
        revalidate: 300,
      },
    }
  );

  if (!rolesResponse.ok) {
    return null;
  }

  return await rolesResponse.json();
}

export async function checkIsManager(
  userId: string,
  guildId: string
): Promise<boolean> {
  try {
    // Fetch guild information
    const guild = await getGuild(guildId);
    if (!guild) {
      return false;
    }

    // Check if the user is the guild owner
    if (guild.owner_id === userId) {
      return true;
    }

    // Fetch member information
    const member = await getMember(guildId, userId);
    if (!member) {
      return false;
    }

    // Get guild roles
    const roles = guild.roles || (await getGuildRoles(guildId));
    if (!roles) {
      return false;
    }

    const rolePermissionsMap = new Map<string, bigint>();
    for (const role of roles) {
      rolePermissionsMap.set(role.id, BigInt(role.permissions));
    }

    let permissions = BigInt(0);
    for (const roleId of member.roles) {
      const rolePerms = rolePermissionsMap.get(roleId);
      if (rolePerms !== undefined) {
        permissions |= rolePerms;
      }
    }

    const MANAGE_GUILD = BigInt(0x20);
    const ADMINISTRATOR = BigInt(0x00000008);
    return (
      (permissions & MANAGE_GUILD) === MANAGE_GUILD ||
      (permissions & ADMINISTRATOR) === ADMINISTRATOR
    );
  } catch (error) {
    return false;
  }
}

export async function getGuildMembers(guildId: string) {
  const membersResponse = await fetch(
    `${env.DISCORD_API_URL}/guilds/${guildId}/members`,
    {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      next: {
        revalidate: 300,
      },
    }
  );

  if (!membersResponse.ok) {
    return null;
  }

  return await membersResponse.json();
}

export async function searchGuildMembers(
  guildId: string,
  query: string,
  limit?: number
) {
  const searchParams = new URLSearchParams({
    query: query,
    limit: (limit || 1).toString(),
  });

  const searchResponse = await fetch(
    `${env.DISCORD_API_URL}/guilds/${guildId}/members/search?${searchParams}`,
    {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      next: {
        revalidate: 60,
      },
    }
  );

  if (!searchResponse.ok) {
    return null;
  }

  return await searchResponse.json();
}

// export a url (variable)
export const botInviteUrl =
  "https://discord.com/oauth2/authorize?client_id=1111585383705219134&permissions=17996718655505&integration_type=0&scope=bot+applications.commands";

export async function giveEventRole(
  guildId: string,
  userId: string,
  roleId: string
) {
  try {
    const response = await fetch(
      `${env.DISCORD_API_URL}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        cache : "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    // return await response.json();
    return true;
  } catch (error) {
    return null;
  }
}

// take event role
export async function takeEventRole(
  guildId: string,
  userId: string,
  roleId: string
) {
  try {
    const response = await fetch(
      `${env.DISCORD_API_URL}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        cache : "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }
    // return await response.json();
    return true;
  } catch (error) {
    return null;
  }
}

export async function addMemberToGuild(
  guildId: string,
  userId: string
) {
  try {
    const requestBody: any = {};
    const accessToken = await fetchAccessTokenForUser(userId);
    
    if (accessToken) {
      requestBody.access_token = accessToken;
    }
    const response = await fetch(
      `${env.DISCORD_API_URL}/guilds/${guildId}/members/${userId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        cache : "no-store",
      }
    );

    if (!response.ok) {
      console.error("Failed to add member to guild:", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding member to guild:", error);
    return null;
  }
}

export async function sendDMMessage(
  userId: string,
  userName: string,
  eventId: string,
  eventName: string
) {
  // Create DM channel

  try {
    const dmResponse = await fetch(
      `${env.DISCORD_API_URL}/users/@me/channels`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_id: userId,
        }),
      }
    );

    if (!dmResponse.ok) {
      return null;
    }

    const dmChannel = await dmResponse.json();
    const channelId = dmChannel.id;

    // Send message to DM channel
    const messageResponse = await fetch(
      `${env.DISCORD_API_URL}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [
            {
              title: "Your Team Has Been Registered Successfully!",
              description: `You can check your registrations on [**${eventName}**](https://tickap.com/event/${eventId})`,
              color: 0x2a2c30,
              footer: {
                text: `Registered by ${userName}`,
              },
            },
          ],
        }),
        cache : "no-store",
      }
    );

    if (!messageResponse.ok) {
      return null;
    }

    return true;
  } catch (error) {
    return null;
  }
}
