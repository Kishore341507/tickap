import prisma from "@/prisma/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCard from "./_components/event-card";

interface Guild {
  id: string;
  name: string;
  permissions: string;
  icon: string;
}

export default async function Events() {

  const Events = await prisma.events.findMany({});
  const liveEvents = await prisma.events.findMany({
    where: { status: "Live" },
  });
  const closedEvents = await prisma.events.findMany({
    where: { status: "Closed" },
  });
  const upcomingEvents = await prisma.events.findMany({
    where: { AND: [{ status: "Open" }, { date: { gt: new Date() } }] },
  });

  return (
    <>
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Events
      </h4>
      <Tabs defaultValue="Upcoming" >
        <TabsList className="grid grid-cols-3 lg:w-[400px] md:w-[400px] mb-5">
          <TabsTrigger value="Upcoming" disabled={upcomingEvents.length == 0 ? true : false}>Upcoming ({upcomingEvents.length})</TabsTrigger>
          <TabsTrigger value="Live" className="animate-pulse" disabled={liveEvents.length == 0 ? true : false}>
            🔴 Live ({liveEvents.length})
          </TabsTrigger>
          <TabsTrigger value="Closed" disabled={closedEvents.length == 0 ? true : false}>Closed ({closedEvents.length}) </TabsTrigger>
        </TabsList>
        <TabsContent value="Upcoming">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 ">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} ></EventCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="Live">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 ">
          {liveEvents.map((event) => (
              <EventCard key={event.id} event={event} ></EventCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="Closed">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 ">
          {closedEvents.map((event) => (
              <EventCard key={event.id} event={event} ></EventCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
