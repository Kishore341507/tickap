import { env } from "process";

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
    const roles = guild.roles || await getGuildRoles(guildId);
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
    return (permissions & MANAGE_GUILD) === MANAGE_GUILD;
  } catch (error) {
    console.error("Error checking manager permission:", error);
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

export async function searchGuildMembers(guildId: string, query: string, limit?: number) {
  const searchParams = new URLSearchParams({
    query: query,
    limit: (limit || 1).toString()
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
export const botInviteUrl = 'https://discord.com/oauth2/authorize?client_id=1111585383705219134&permissions=17996718402624&integration_type=0&scope=bot+applications.commands'

