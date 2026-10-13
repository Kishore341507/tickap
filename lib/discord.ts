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
  data: Registration,
  options?: {
    eventName?: string;
    userAvatar?: string;
  }
) {
  try {
    let embed: any = {
      title: userName,
      description: "",
      color: 0x2a2b31,
      footer: {
        text: options?.eventName ? `${options.eventName} | tickap.com` : "tickap.com",
      },
      fields: [],
    };

    let fields: Array<{ name: string; value: string; inline: boolean }> = [];
    let components: any[] = [];

    if (type == "Registration") {
      embed.title = data.team_name || userName;
      embed.color = 0x2a2b31;
      
      const authorIcon = options?.userAvatar || data.registrationusers?.find((u: RegistrationUser) => u.user_name === userName || u.role === 'LEADER')?.pfp || data.registrationusers?.[0]?.pfp || "https://tickap.com/tickap_dark.png";
      embed.author = {
        name: userName,
        icon_url: authorIcon,
      };

      let users = (data.registrationusers || [])
        .map((user: RegistrationUser) => {
          return `> <@${user.user_id}> (${user.user_id})`;
        })
        .join("\n");
      embed.description = users || userName;

      if (data.extra) {
        let parsedExtra: any = data.extra;
        if (typeof data.extra === "string") {
          try {
            parsedExtra = JSON.parse(data.extra);
          } catch {
            parsedExtra = null;
          }
        }

        if (parsedExtra && typeof parsedExtra === "object") {
          const formatInputValue = (val: any): string => {
            if (val === undefined || val === null) return "";
            if (typeof val === "boolean") return val ? "Yes" : "No";

            const formatSingle = (s: string): string => {
              const trimmed = s.trim();
              const mentionMatch = trimmed.match(/^<@!?(\d{17,20})>$/);
              if (mentionMatch) {
                return `<@${mentionMatch[1]}> (${mentionMatch[1]})`;
              }
              if (/^\d{17,20}$/.test(trimmed)) {
                return `<@${trimmed}> (${trimmed})`;
              }
              return trimmed;
            };

            if (Array.isArray(val)) {
              return val
                .map((item) => (item !== undefined && item !== null ? formatSingle(String(item)) : ""))
                .filter((s) => s.length > 0)
                .join(" , ");
            }

            const valStr = String(val).trim();
            const tokens = valStr.split(/[, \t\r\n]+/).map((t) => t.trim()).filter(Boolean);
            if (
              tokens.length > 0 &&
              tokens.every((t) => /^\d{17,20}$/.test(t) || /^<@!?\d{17,20}>$/.test(t))
            ) {
              return tokens.map((t) => formatSingle(t)).join(" , ");
            }

            return valStr;
          };

          if (Array.isArray(parsedExtra)) {
            for (let i = 0; i < parsedExtra.length; i++) {
              const item = parsedExtra[i];
              if (item && typeof item === "object") {
                const qText = item.text || item.question || item.label || `Question ${i + 1}`;
                const qAns = item.value ?? item.answer ?? item.val ?? "";
                const ansStr = formatInputValue(qAns);
                if (ansStr.trim()) {
                  fields.push({
                    name: qText.slice(0, 256),
                    value: ansStr.length > 1024 ? ansStr.slice(0, 1021) + "..." : ansStr,
                    inline: false,
                  });
                }
              } else if (item !== undefined && item !== null && String(item).trim()) {
                const ansStr = formatInputValue(item);
                if (ansStr.trim()) {
                  fields.push({
                    name: `Question ${i + 1}`,
                    value: ansStr.length > 1024 ? ansStr.slice(0, 1021) + "..." : ansStr,
                    inline: false,
                  });
                }
              }
            }
          } else {
            for (const key in parsedExtra) {
              const val = parsedExtra[key];
              if (val !== undefined && val !== null) {
                const valStr = formatInputValue(val);
                if (valStr.trim() !== "") {
                  fields.push({
                    name: key.slice(0, 256),
                    value: valStr.length > 1024 ? valStr.slice(0, 1021) + "..." : valStr,
                    inline: false,
                  });
                }
              }
            }
          }
        }
      }

      embed.footer = {
        text: options?.eventName ? `${options.eventName} | tickap.com` : "tickap.com",
      };

      if (data.id) {
        components = [
          {
            type: 1, // ActionRow
            components: [
              {
                type: 2, // Button
                style: 5, // Link
                label: "Manage on Web",
                url: `https://tickap.com/event/server/${guildId}/registrations/${eventId}`,
                emoji: { name: "🔗" },
              },
            ],
          },
        ];
      }
    } else if (type == "Unregistration") {
      embed.title = `Unregistered by ${userName}`;
      embed.color = 0xe74c3c;
      embed.description = `Unregistered from ${data.team_name || "event"}`;
      fields.push({
        name: "Unregistered Users",
        value: (data.registrationusers || [])
          .map((user: RegistrationUser) => {
            return `> <@${user.user_id}> (${user.user_id})`;
          })
          .join("\n") || userName,
        inline: false,
      });
    } else if (type == "Registration Update") {
      embed.title = `Updated by ${userName}`;
      embed.color = 0xf39c12;
      embed.description = `Updated ${data.team_name || "registration"}`;
      fields.push({
        name: "Updated Users",
        value: (data.registrationusers || [])
          .map((user: RegistrationUser) => {
            return `> <@${user.user_id}> (${user.user_id})`;
          })
          .join("\n") || userName,
        inline: false,
      });
    }

    embed.fields = fields;

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
          ...(components.length > 0 ? { components } : {}),
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
      .map((member) => `> <@${member.user_id}>`)
      .join("\n");

    const isInvite = !!mentionUserId;
    const embed: any = {
      title: isInvite ? `'${teamName}' Invited You` : `'${teamName}' Looking for members`,
      description: isInvite
        ? `Members\n${memberMentions || "None"}`
        : `Members\n${memberMentions || "None"}`,
      color: color,
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

    if (isInvite) {
      payload.content = `<@${mentionUserId}>`;
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
export async function sendJoinRequestNotification({
  channelId,
  teamName,
  requesterId,
  requesterName,
  eventId,
  leaders,
}: {
  channelId: string;
  teamName: string;
  requesterId: string | bigint;
  requesterName: string | null;
  eventId: string | bigint;
  leaders: { user_id: bigint | string }[];
}) {
  try {
    const leaderMentions = leaders
      .map((leader) => `<@${leader.user_id}>`)
      .join(" ");

    const embed: any = {
      title: `New Join Request for '${teamName}'`,
      description: `> <@${requesterId}> (${requesterName || "Unknown"}) has requested to join your team.`,
      color: 0xFEE75C, // Yellow embed
    };

    const payload: any = {
      content: leaderMentions ? `Attention ${leaderMentions}` : undefined,
      embeds: [embed],
      components: [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 5, // Link Button
              label: "View Request",
              url: `https://tickap.com/event/${eventId}`,
            },
          ],
        },
      ],
    };

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
      console.error("Failed to send join request notification:", errText);
      return null;
    }

    return true;
  } catch (error) {
    console.error("Error sending join request notification:", error);
    return null;
  }
}

/**
 * Fetch all scheduled events for a Discord guild
 */
export async function getGuildScheduledEvents(guildId: string) {
  try {
    const response = await fetch(
      `${env.DISCORD_API_URL}/guilds/${guildId}/scheduled-events?with_user_count=true`,
      {
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Failed to fetch guild scheduled events:", errText);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getGuildScheduledEvents:", error);
    return [];
  }
}

/**
 * Create a Discord scheduled event (External/TickAp event)
 */
export async function createGuildScheduledEvent(
  guildId: string,
  eventData: {
    name: string;
    description?: string | null;
    scheduled_start_time: string | Date;
    scheduled_end_time?: string | Date;
    location: string;
    image?: string | null; // Data URI (data:image/png;base64,...)
  }
) {
  try {
    const startDate =
      eventData.scheduled_start_time instanceof Date
        ? eventData.scheduled_start_time
        : new Date(eventData.scheduled_start_time);

    const endDate = eventData.scheduled_end_time
      ? eventData.scheduled_end_time instanceof Date
        ? eventData.scheduled_end_time
        : new Date(eventData.scheduled_end_time)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default

    const payload: Record<string, any> = {
      name: eventData.name.slice(0, 100),
      privacy_level: 2, // GUILD_ONLY is required by Discord
      scheduled_start_time: startDate.toISOString(),
      scheduled_end_time: endDate.toISOString(),
      entity_type: 3, // EXTERNAL
      entity_metadata: {
        location: eventData.location.slice(0, 100),
      },
    };

    if (eventData.description) {
      payload.description = eventData.description.slice(0, 1000);
    }

    if (eventData.image) {
      payload.image = eventData.image;
    }

    const response = await fetch(
      `${env.DISCORD_API_URL}/guilds/${guildId}/scheduled-events`,
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

    if (!response.ok) {
      const errText = await response.text();
      console.error("Failed to create scheduled event on Discord:", errText);
      return { success: false, error: errText };
    }

    const createdEvent = await response.json();
    return { success: true, event: createdEvent };
  } catch (error: any) {
    console.error("Error creating scheduled event on Discord:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a Discord scheduled event
 * Note: do not sync entity_type and location on updates as per spec
 */
export async function updateGuildScheduledEvent(
  guildId: string,
  eventId: string,
  updateData: {
    name?: string;
    description?: string | null;
    scheduled_start_time?: string | Date;
    scheduled_end_time?: string | Date;
    status?: number;
    image?: string | null;
  }
) {
  try {
    const payload: Record<string, any> = {};

    if (updateData.name !== undefined) {
      payload.name = updateData.name.slice(0, 100);
    }

    if (updateData.description !== undefined) {
      payload.description = updateData.description
        ? updateData.description.slice(0, 1000)
        : "";
    }

    if (updateData.scheduled_start_time) {
      const startDate =
        updateData.scheduled_start_time instanceof Date
          ? updateData.scheduled_start_time
          : new Date(updateData.scheduled_start_time);
      payload.scheduled_start_time = startDate.toISOString();

      const endDate = updateData.scheduled_end_time
        ? updateData.scheduled_end_time instanceof Date
          ? updateData.scheduled_end_time
          : new Date(updateData.scheduled_end_time)
        : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      payload.scheduled_end_time = endDate.toISOString();
    }

    if (updateData.image) {
      payload.image = updateData.image;
    }

    if (updateData.status !== undefined) {
      payload.status = updateData.status;
    }

    const response = await fetch(
      `${env.DISCORD_API_URL}/guilds/${guildId}/scheduled-events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Failed to update scheduled event on Discord:", errText);
      return { success: false, error: errText };
    }

    const updatedEvent = await response.json();
    return { success: true, event: updatedEvent };
  } catch (error: any) {
    console.error("Error updating scheduled event on Discord:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Status mapping helpers
 */
export function mapDiscordStatusToTickAp(discordStatus: number): "Open" | "Live" | "Closed" | "Cancelled" {
  switch (discordStatus) {
    case 1:
      return "Open";
    case 2:
      return "Live";
    case 3:
      return "Closed";
    case 4:
      return "Cancelled";
    default:
      return "Open";
  }
}

export function mapTickApStatusToDiscord(tickApStatus: string): number {
  switch (tickApStatus) {
    case "Open":
      return 1;
    case "Live":
      return 2;
    case "Closed":
      return 3;
    case "Cancelled":
      return 4;
    default:
      return 1;
  }
}
