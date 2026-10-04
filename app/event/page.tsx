import prisma from "@/prisma/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCard from "./_components/event-card";
import { Calendar, Radio, Trophy, CalendarX2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/types";

export default async function Events() {
  const now = new Date();
  const [liveEvents, upcomingEvents, closedEvents] = await Promise.all([
    prisma.events.findMany({
      where: { status: "Live", is_verified: true, is_deleted: false },
      orderBy: { date: "asc" },
    }),
    prisma.events.findMany({
      where: {
        AND: [
          { status: "Open" },
          { date: { gt: now } },
          { is_verified: true, is_deleted: false },
        ],
      },
      orderBy: { date: "asc" },
    }),
    prisma.events.findMany({
      where: {
        AND: [
          { date: { lt: now } },
          { status: { not: "Live" } },
          { is_verified: true, is_deleted: false },
        ],
      },
      orderBy: { date: "desc" },
      take: 24,
    }),
  ]);

  const defaultTab = liveEvents.length > 0 ? "Live" : "Upcoming";

  return (
    <div className="space-y-6">
      {/* Tabs Filter Bar */}
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
        </TabsList>

        {/* Upcoming Events Grid */}
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
              <h3 className="font-semibold text-base mb-1">No Upcoming Events Scheduled</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Check back soon or browse our community servers to see where new tournaments are being announced.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Live Events Grid */}
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
                Currently no competitions are in progress. Switch to the Upcoming tab to find open registrations!
              </p>
            </div>
          )}
        </TabsContent>

        {/* Closed / Past Events Grid */}
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
              <h3 className="font-semibold text-base mb-1">No Past Events Archive</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Past tournament results and archives will appear here once events conclude.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
