import prisma from "@/prisma/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCard from "../../_components/event-card";
import FormCard from "../../_components/form-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Radio, 
  Trophy, 
  CalendarX2, 
  FileText, 
  Plus, 
  Users, 
  ChevronLeft 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { env } from "process";
import { checkIsManager } from "@/lib/discord";
import Image from "next/image";
import { Event } from "@/types";

export default async function ServerEvents({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch all events for the guild
  const events = await prisma.events.findMany({
    where: {
      guild_id: BigInt(id),
      is_deleted: false,
    },
    orderBy: {
      date: "asc",
    },
  });

  const now = new Date();
  const liveEvents = events.filter((event) => event.status === "Live");
  const closedEvents = events
    .filter((event) => event.status !== "Live" && event.date && event.date < now)
    .sort((a, b) => (b.date && a.date ? b.date.getTime() - a.date.getTime() : 0));
  const upcomingEvents = events.filter(
    (event) => event.status === "Open" && event.date && event.date > now
  );

  // Fetch forms for this guild
  const forms = await prisma.form.findMany({
    where: {
      guild_id: BigInt(id),
      is_deleted: false,
    },
    include: {
      questions: true,
      responses: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch Discord guild details
  let guildName = "Server";
  let guildIcon: string | null = null;
  let guildDescription: string | null = null;
  let memberCount: number | null = null;

  try {
    const guildResponse = await fetch(
      `${env.DISCORD_API_URL}/guilds/${id}?with_counts=true`,
      {
        headers: {
          Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        },
        next: {
          revalidate: 120,
        },
      }
    );
    if (guildResponse.ok) {
      const guildData = await guildResponse.json();
      if (guildData && guildData.name) {
        guildName = guildData.name;
        guildIcon = guildData.icon
          ? `https://cdn.discordapp.com/icons/${id}/${guildData.icon}.png`
          : null;
        guildDescription = guildData.description || null;
        memberCount = guildData.approximate_member_count || null;
      }
    }
  } catch (err) {
    console.error("Failed to fetch Discord guild:", err);
  }

  // Check manager status
  let isManager = false;
  const session = await auth();
  if (session?.user?.userId) {
    try {
      const isManagerResponse = await checkIsManager(session.user.userId, id);
      if (isManagerResponse) {
        isManager = true;
      }
    } catch (e) {
      console.error("Error checking manager status:", e);
    }
  }

  const defaultTab = liveEvents.length > 0 ? "Live" : "Upcoming";

  return (
    <div className="space-y-6">
      {/* Back to Servers Navigation */}
      <div>
        <Link
          href="/event/server"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>All Servers</span>
        </Link>

        {/* Server Header Card */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-5 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              {guildIcon ? (
                <Image
                  src={guildIcon}
                  alt={guildName}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-2xl object-cover ring-1 ring-border/60 shadow-sm shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-muted ring-1 ring-border/60 flex items-center justify-center font-bold text-lg text-foreground shrink-0">
                  {guildName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                    {guildName}
                  </h1>
                  {isManager && (
                    <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5">
                      Organizer
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  {memberCount !== null && (
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Users className="h-3.5 w-3.5 opacity-70" />
                      {memberCount.toLocaleString()} members
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    {events.length} event{events.length !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span>
                    {forms.length} form{forms.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {guildDescription && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1 max-w-xl">
                    {guildDescription}
                  </p>
                )}
              </div>
            </div>

            {isManager && (
              <div className="flex items-center gap-2.5 shrink-0">
                <Link href={`/event/server/${id}/forms/create`}>
                  <Button size="sm" variant="outline" className="h-9 gap-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    <span>New Form</span>
                  </Button>
                </Link>
                <Link href={`/event/server/${id}/create`}>
                  <Button size="sm" className="h-9 gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Event</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Filter Bar (Synced with /event design) */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="h-10 p-1 bg-muted/60 border border-border/40 rounded-lg inline-flex">
          <TabsTrigger
            value="Upcoming"
            className="rounded-md px-3.5 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5 opacity-70" />
            Upcoming ({upcomingEvents.length})
          </TabsTrigger>

          <TabsTrigger
            value="Live"
            className="rounded-md px-3.5 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all relative"
          >
            <Radio className="mr-1.5 h-3.5 w-3.5 text-rose-500" />
            <span>Live</span>
            {liveEvents.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px] rounded-full">
                {liveEvents.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="Closed"
            className="rounded-md px-3.5 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <Trophy className="mr-1.5 h-3.5 w-3.5 opacity-70" />
            Past ({closedEvents.length})
          </TabsTrigger>

          <TabsTrigger
            value="Forms"
            className="rounded-md px-3.5 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5 opacity-70" />
            Forms ({forms.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Events Tab Content */}
        <TabsContent value="Upcoming" className="mt-0 focus-visible:outline-none">
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id.toString()} event={event as unknown as Event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
              <CalendarX2 className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <h3 className="font-semibold text-base mb-1">No Upcoming Events</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                There are currently no upcoming events scheduled for this server.
              </p>
              {isManager && (
                <Link href={`/event/server/${id}/create`}>
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Create First Event
                  </Button>
                </Link>
              )}
            </div>
          )}
        </TabsContent>

        {/* Live Events Tab Content */}
        <TabsContent value="Live" className="mt-0 focus-visible:outline-none">
          {liveEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveEvents.map((event) => (
                <EventCard key={event.id.toString()} event={event as unknown as Event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
              <Radio className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <h3 className="font-semibold text-base mb-1">No Live Events Right Now</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No competitions are currently in progress on this server. Check the Upcoming tab for scheduled events!
              </p>
            </div>
          )}
        </TabsContent>

        {/* Closed Events Tab Content */}
        <TabsContent value="Closed" className="mt-0 focus-visible:outline-none">
          {closedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {closedEvents.map((event) => (
                <EventCard key={event.id.toString()} event={event as unknown as Event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
              <Trophy className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <h3 className="font-semibold text-base mb-1">No Past Events</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Past tournament results and archives will appear here once events conclude.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Forms Tab Content */}
        <TabsContent value="Forms" className="mt-0 focus-visible:outline-none">
          {forms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <FormCard key={form.id} form={form} showActions={isManager} guildId={id} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
              <FileText className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <h3 className="font-semibold text-base mb-1">No Forms Created Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                Create customizable registration and application forms for your server members.
              </p>
              {isManager && (
                <Link href={`/event/server/${id}/forms/create`}>
                  <Button size="sm" className="gap-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    Create First Form
                  </Button>
                </Link>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
