import { auth } from "@/auth";
import { botInviteUrl, getValidAccessToken } from "@/lib/discord";
import { Guild } from "@/types";
import { env } from "process";
import GuildCard from "../_components/guild-card";
import Link from "next/link";
import { SignInCard } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileSpreadsheet, ShieldAlert } from "lucide-react";

export default async function FormsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Forms & Applications
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create, manage, and review submissions for your server forms.
          </p>
        </div>
        <SignInCard
          title="Sign in to Manage Forms"
          description="Connect your Discord account to view servers you manage, configure forms, and review responses."
          callbackUrl="/event/forms"
        />
      </div>
    );
  }

  const accessToken = await getValidAccessToken(session.user.id);
  if (!accessToken) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Forms & Applications
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create, manage, and review submissions for your server forms.
          </p>
        </div>
        <SignInCard
          title="Session Expired"
          description="Your Discord authentication token has expired. Please sign in again to access your managed forms."
          buttonText="Re-authenticate with Discord"
          callbackUrl="/event/forms"
        />
      </div>
    );
  }

  const [botRes, userRes] = await Promise.all([
    fetch(env.DISCORD_API_URL + "/users/@me/guilds?with_counts=true", {
      headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
      next: { revalidate: 300 },
    }),
    fetch(env.DISCORD_API_URL + "/users/@me/guilds?with_counts=true", {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 300 },
    }),
  ]);

  const botGuilds: Guild[] = (await botRes.json()) || [];
  const userGuilds: any[] = (await userRes.json()) || [];

  const managerGuilds: Guild[] = [];

  if (Array.isArray(userGuilds) && Array.isArray(botGuilds)) {
    userGuilds.forEach((guild) => {
      guild.icon = guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        : "https://cdn.discordapp.com/embed/avatars/0.png";
      guild.manager = (BigInt(guild.permissions) & BigInt(0x20)) !== BigInt(0);
      guild.mutual = botGuilds.some((bg) => bg.id === guild.id);

      if (guild.manager && guild.mutual) {
        managerGuilds.push(guild);
      }
    });
  }

  managerGuilds.sort(
    (a: any, b: any) => (b.approximate_member_count || 0) - (a.approximate_member_count || 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Forms & Applications
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Select a server you manage to create custom forms, registration questionnaires, and review responses.
        </p>
      </div>

      {managerGuilds.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-base mb-1">No Managed Servers Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            You don&apos;t manage any servers with the TickAp bot installed. Invite the bot to your Discord server to start creating forms.
          </p>
          <a href={botInviteUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-1.5 text-xs">
              <span>Add Bot to Discord</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Managed Servers ({managerGuilds.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8 my-4 mx-3">
            {managerGuilds.map((guild) => (
              <Link
                href={`/event/forms/guild/${guild.id}`}
                key={guild.id}
              >
                <GuildCard guild={guild} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
