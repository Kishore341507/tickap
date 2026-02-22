import { auth } from '@/auth';
import { botInviteUrl, getValidAccessToken } from '@/lib/discord';
import { Guild } from '@/types';
import { env } from 'process';
import GuildCard from '../_components/guild-card';
import Link from 'next/link';

export default async function FormsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div>
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Forms
        </h2>
        <p className="mt-4 text-muted-foreground">Please sign in to manage forms.</p>
      </div>
    );
  }

  const accessToken = await getValidAccessToken(session.user.id);
  if (!accessToken) {
    return (
      <div>
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Forms
        </h2>
        <p className="mt-4 text-muted-foreground">Authentication error. Please sign out and sign in again.</p>
      </div>
    );
  }

  const [botRes, userRes] = await Promise.all([
    fetch(env.DISCORD_API_URL + '/users/@me/guilds?with_counts=true', {
      headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
      next: { revalidate: 600 },
    }),
    fetch(env.DISCORD_API_URL + '/users/@me/guilds?with_counts=true', {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 600 },
    }),
  ]);

  const botGuilds: Guild[] = await botRes.json();
  const userGuilds: any[] = await userRes.json();

  const managerGuilds: Guild[] = [];

  if (Array.isArray(userGuilds) && Array.isArray(botGuilds)) {
    userGuilds.forEach((guild) => {
      guild.icon = guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
      guild.manager = (BigInt(guild.permissions) & BigInt(0x20)) !== BigInt(0);
      guild.mutual = botGuilds.some((bg) => bg.id === guild.id);

      if (guild.manager && guild.mutual) {
        managerGuilds.push(guild);
      }
    });
  }

  managerGuilds.sort((a: any, b: any) => b.approximate_member_count - a.approximate_member_count);

  return (
    <div>
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Manage Server Forms
      </h2>

      {managerGuilds.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          You don&apos;t manage any servers with the bot installed.{' '}
          <Link href={botInviteUrl} target="_blank" className="underline">
            Add the bot to your server
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8 my-4 mx-3">
          {managerGuilds.map((guild) => (
            <Link href={`/event/forms/guild/${guild.id}`} key={guild.id}>
              <GuildCard guild={guild} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
