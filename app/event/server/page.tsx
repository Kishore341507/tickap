import { auth } from "@/auth";
import { env } from "process";
import React from "react";
import Link from "next/link";
import { botInviteUrl, getValidAccessToken } from "@/lib/discord";
import { Guild } from "@/types";
import { SignInCard } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServerCard from "../_components/server-card";
import { 
  Shield, 
  Plus, 
  ExternalLink, 
  Compass, 
  ShieldAlert,
  Layers,
  Sparkles
} from "lucide-react";

export default async function Servers() {
  const managableGuilds: Guild[] = [];
  const toAddGuilds: Guild[] = [];
  const session = await auth();

  let botGuilds: Guild[] = [];

  try {
    const botGuildsResponse = await fetch(
      `${env.DISCORD_API_URL}/users/@me/guilds?with_counts=true`,
      {
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        },
        next: {
          revalidate: 300,
        },
      }
    );

    if (botGuildsResponse.ok) {
      botGuilds = (await botGuildsResponse.json()) || [];
    }
  } catch (error) {
    console.error("Failed to fetch bot guilds:", error);
  }

  if (Array.isArray(botGuilds) && botGuilds.length > 0) {
    botGuilds.forEach((guild: Guild) => {
      guild.icon = guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        : "https://cdn.discordapp.com/embed/avatars/0.png";
    });
  }

  if (session?.user?.id) {
    const accessToken = await getValidAccessToken(session.user.id);

    if (accessToken) {
      try {
        const userGuildsResponse = await fetch(
          `${env.DISCORD_API_URL}/users/@me/guilds?with_counts=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            next: {
              revalidate: 300,
            },
          }
        );

        if (userGuildsResponse.ok) {
          const userGuilds = (await userGuildsResponse.json()) || [];

          if (Array.isArray(userGuilds) && userGuilds.length > 0) {
            userGuilds.forEach((guild: any) => {
              guild.icon = guild.icon
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : "https://cdn.discordapp.com/embed/avatars/0.png";
              guild.manager = (BigInt(guild.permissions) & BigInt(0x20)) !== BigInt(0);
              guild.mutual = botGuilds.some((bg: any) => bg.id === guild.id);

              if (guild.manager && guild.mutual) {
                managableGuilds.push(guild);
                botGuilds = botGuilds.filter((bg: any) => bg.id !== guild.id);
              } else if (guild.manager && !guild.mutual) {
                toAddGuilds.push(guild);
                botGuilds = botGuilds.filter((bg: any) => bg.id !== guild.id);
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch user guilds:", error);
      }
    }
  }

  const canJoinGuilds = botGuilds;
  canJoinGuilds.sort(
    (a: any, b: any) => (b.approximate_member_count || 0) - (a.approximate_member_count || 0)
  );
  managableGuilds.sort(
    (a: any, b: any) => (b.approximate_member_count || 0) - (a.approximate_member_count || 0)
  );
  toAddGuilds.sort(
    (a: any, b: any) => (b.approximate_member_count || 0) - (a.approximate_member_count || 0)
  );

  const hasManaged = managableGuilds.length > 0;
  const hasToAdd = toAddGuilds.length > 0;
  const hasExplore = canJoinGuilds.length > 0;

  const activeCategoriesCount = (hasManaged ? 1 : 0) + (hasToAdd ? 1 : 0) + (hasExplore ? 1 : 0);
  const totalServersCount = managableGuilds.length + toAddGuilds.length + canJoinGuilds.length;
  const defaultTab = hasManaged ? "Managed" : "All";

  const renderManagedSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Managed Servers ({managableGuilds.length})
          </h2>
        </div>
        <Link 
          href="/event/forms" 
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          <span>Forms Dashboard</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {managableGuilds.map((guild) => (
          <ServerCard key={guild.id} guild={guild} type="manage" />
        ))}
      </div>
    </div>
  );

  const renderInviteSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Install Bot to Your Servers ({toAddGuilds.length})
          </h2>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Click to invite bot with manager permissions
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {toAddGuilds.map((guild) => (
          <ServerCard key={guild.id} guild={guild} type="invite" />
        ))}
      </div>
    </div>
  );

  const renderCommunitySection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Community Servers ({canJoinGuilds.length})
          </h2>
        </div>
      </div>
      {canJoinGuilds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {canJoinGuilds.map((guild) => (
            <ServerCard key={guild.id} guild={guild} type="explore" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
          <Compass className="h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-base mb-1">No Community Servers Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
            There are currently no public community servers available.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Guest Sign-in Callout */}
      {!session && (
        <SignInCard
          variant="banner"
          title="Sign in to Manage Your Servers"
          description="Connect your Discord account to view servers you manage, configure tournaments, and customize application forms."
          callbackUrl="/event/server"
        />
      )}

      {/* Guest / Logged Out View: Show Community Servers directly without tabs */}
      {!session && renderCommunitySection()}

      {/* Authenticated View */}
      {session && (
        <>
          {activeCategoriesCount > 1 ? (
            <Tabs key={defaultTab} defaultValue={defaultTab} className="space-y-6">
              <TabsList className="h-10 p-1 bg-muted/60 border border-border/40 rounded-lg inline-flex">
                <TabsTrigger
                  value="All"
                  className="rounded-md px-3.5 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  <Layers className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                  All ({totalServersCount})
                </TabsTrigger>

                {hasManaged && (
                  <TabsTrigger
                    value="Managed"
                    className="rounded-md px-3.5 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                  >
                    <Shield className="mr-1.5 h-3.5 w-3.5 opacity-70 text-primary" />
                    Managed ({managableGuilds.length})
                  </TabsTrigger>
                )}

                {hasToAdd && (
                  <TabsTrigger
                    value="Add"
                    className="rounded-md px-3.5 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5 opacity-70 text-blue-500" />
                    Invite Bot ({toAddGuilds.length})
                  </TabsTrigger>
                )}

                {hasExplore && (
                  <TabsTrigger
                    value="Explore"
                    className="rounded-md px-3.5 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                  >
                    <Compass className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                    Explore ({canJoinGuilds.length})
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Tab: All */}
              <TabsContent value="All" className="space-y-8 mt-0 focus-visible:outline-none">
                {hasManaged && renderManagedSection()}
                {hasToAdd && renderInviteSection()}
                {hasExplore && renderCommunitySection()}
              </TabsContent>

              {/* Tab: Managed */}
              {hasManaged && (
                <TabsContent value="Managed" className="mt-0 focus-visible:outline-none">
                  {renderManagedSection()}
                </TabsContent>
              )}

              {/* Tab: Invite Bot */}
              {hasToAdd && (
                <TabsContent value="Add" className="mt-0 focus-visible:outline-none">
                  {renderInviteSection()}
                </TabsContent>
              )}

              {/* Tab: Explore */}
              {hasExplore && (
                <TabsContent value="Explore" className="mt-0 focus-visible:outline-none">
                  {renderCommunitySection()}
                </TabsContent>
              )}
            </Tabs>
          ) : activeCategoriesCount === 1 ? (
            /* Single category with items - render directly without redundant tabs */
            <div className="space-y-6">
              {hasManaged && renderManagedSection()}
              {hasToAdd && renderInviteSection()}
              {hasExplore && renderCommunitySection()}
            </div>
          ) : (
            /* No servers found */
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
              <ShieldAlert className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <h3 className="font-semibold text-base mb-1">No Servers Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
                You don&apos;t manage any servers with the TickAp bot installed. Invite the bot to your Discord server to start hosting events.
              </p>
              <a href={botInviteUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Bot to Discord</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Button>
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
