import { env } from "process";
import prisma from "@/prisma/db";
import { Registration, RegistrationUser } from "@/types";

async function fetchAccessTokenForUser(userId: string): Promise<string | null> {
  try {
    // Find the account in the database where the providerAccountId matches the Discord userId
    const account = await prisma.account.findFirst({
      where: {
        provider: "discord",
        providerAccountId: userId,
      },
    });

    return account?.access_token || null;
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null;
  }
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: "discord"
      }
    });

    if (!account) {
      console.error("No Discord account found for user");
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = account.expires_at || 0;
    
    if (expiresAt > now + 300) {
      // Token is still valid
      return account.access_token;
    }

    // Token is expired or about to expire, refresh it
    console.log("Token expired, refreshing...");
    
    if (!account.refresh_token) {
      console.error("No refresh token available");
      return null;
    }

    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: account.refresh_token,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Failed to refresh token:", await tokenResponse.text());
      return null;
    }

    const tokens = await tokenResponse.json();
    
    // Update the database with new tokens
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      data: {
        access_token: tokens.access_token,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
        refresh_token: tokens.refresh_token ?? account.refresh_token,
      },
    });

    console.log("Token refreshed successfully");
    return tokens.access_token;
  } catch (error) {
    console.error("Error getting valid access token:", error);
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

export async function fetchMember(guildId: string, userId: string) {
  const memberResponse = await fetch(
    `${env.DISCORD_API_URL}/guilds/${guildId}/members/${userId}`,
    {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      cache: "no-store",
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
  if (query.match(/^\d{17,20}$/)) {
    const member = await getMember(guildId, query);
    if (member) {
      return member.user.bot ? [] : [member];
    }
  }

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

  let data = await searchResponse.json();
  if (data.length > 0) {
    data = data.filter((member: any) => {
      console.log(member.user);
      return member.user.bot != true;
    });
  }

  console.log("Search results:", data);

  return data;
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
        cache: "no-store",
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
        cache: "no-store",
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

export async function addMemberToGuild(guildId: string, userId: string) {
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
        cache: "no-store",
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
        cache: "no-store",
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

export async function sendLogMessage(
  userName: string,
  eventId: string,
  guildId: string,
  channelId: string,
  type: string,
  data: Registration
) {
  try {
    let embed = {
      title: userName,
      description: "",
      color: 0x2ecc71,
      footer: {
        text: `Event ID: ${eventId}`,
        icon_url: `https://tickap.com/tickap_dark.png`,
      },
      fields: [
        {
          name: " ",
          value: `**[Log](https://tickap.com/event/server/${guildId}/logs/${eventId})** | **[Registration](https://tickap.com/event/server/${guildId}/registrations/${eventId})**`,
          inline: false,
        },
      ],
    };
    if (type == "Registration") {
      embed.title = data.team_name || userName;
      embed.color = 0x2ecc71;
      let users = data.registrationusers
        .map((user: RegistrationUser) => {
          return `<@${user.user_id}> | ${user.user_id}`;
        })
        .join("\n");
      embed.description = `${users}`;
      let extra_input = "";
      if (data.extra) {
        const parsedExtra = JSON.parse(data.extra);
        if (typeof parsedExtra === "object" && parsedExtra !== null) {
          let extraLines = [];
          for (const key in parsedExtra) {
            if (parsedExtra[key] && parsedExtra[key] !== "") {
              extraLines.push(`**${key}**\n${parsedExtra[key]}`);
            }
          }
          extra_input = extraLines.join("\n");
        }

        embed.fields.push({
          name: "Extra Input",
          value: extra_input,
          inline: false,
        });
      }
    } else if (type == "Unregistration") {
      embed.title = `Unregistered by ${userName}`;
      embed.color = 0xe74c3c;
      embed.description = `Unregistered from ${data.team_name}`;
      embed.fields.push({
        name: "Unregistered Users",
        value: data.registrationusers
          .map((user: RegistrationUser) => {
            return `<@${user.user_id}> | ${user.user_id}`;
          })
          .join("\n"),
        inline: false,
      });
    } else if (type == "Registration Update") {
      embed.title = `Updated by ${userName}`;
      embed.color = 0xf39c12;
      embed.description = `Updated ${data.team_name}`;
      embed.fields.push({
        name: "Updated Users",
        value: data.registrationusers
          .map((user: RegistrationUser) => {
            return `<@${user.user_id}> | ${user.user_id}`;
          })
          .join("\n"),
        inline: false,
      });
    }

    const messageResponse = await fetch(
      `${env.DISCORD_API_URL}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
        cache: "no-store",
      }
    );

    if (!messageResponse.ok) {
      return null;
    }

    return true;
  } catch (error) {
    console.error("Error sending log message:", error);
    return null;
  }
}

export async function sendLookingForTeamNotification({
  channelId,
  teamName,
  members,
  eventId,
  color,
  mentionUserId,
}: {
  channelId: string;
  teamName: string;
  members: { user_id: bigint | string; user_name: string | null }[];
  eventId: string;
  color: number;
  mentionUserId?: string;
}) {
  try {
    const memberMentions = members
      .map((member) => `<@${member.user_id}>`)
      .join("\n");

    const embed: any = {
      title: `Team: ${teamName}`,
      description: `**Members:**\n${memberMentions || "None"}`,
      color: color,
      footer: {
        text: `Event ID: ${eventId}`,
      },
    };

    const payload: any = {
      embeds: [embed],
      components: [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 5, // Link Button
              label: "View Event",
              url: `https://tickap.com/event/${eventId}`,
            },
          ],
        },
      ],
    };

    if (mentionUserId) {
      payload.content = `Hey <@${mentionUserId}>, you've been invited!`;
    }

    const messageResponse = await fetch(
      `${env.DISCORD_API_URL}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    if (!messageResponse.ok) {
      const errText = await messageResponse.text();
      console.error("Failed to send Looking for team notification:", errText);
      return null;
    }

    return true;
  } catch (error) {
    console.error("Error sending Looking for team notification:", error);
    return null;
  }
}
