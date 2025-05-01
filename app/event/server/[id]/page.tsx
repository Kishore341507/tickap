import prisma from "@/prisma/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCard from "../../_components/event-card";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { env } from 'process';
import { checkIsManager } from "@/lib/discord";


export default async function Events( {params,}: {params: Promise<{ id: string }>} ) {

  const {id} = await params;
  
  // Fetch all events for the guild in a single query
  const events = await prisma.events.findMany({
    where: {
      guild_id: BigInt(id)
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Filter events in memory for better performance
  const liveEvents = events.filter(event => event.status === "Live");
  const closedEvents = events.filter(event => event.status === "Closed");
  const upcomingEvents = events.filter(event => 
    event.status === "Open" && event.date && event.date > new Date()
  );

  const guildResponce: Response = await fetch(env.DISCORD_API_URL + `/guilds/${id}`, {
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`
    }
  });
  const guild = await guildResponce.json();
  let guildName = "Server";
  if(guild){
    guildName = guild.name;
  }

  // fetch the guild member with bot 
  let isManager = false;

  const session = await auth() ;
  if( session ){

    // check if the user is a manager
    const userId = session.user.userId!;
    const guildId = id;
    const isManagerResponce = await checkIsManager(userId, guildId);
    console.log("isManagerResponce: ", isManagerResponce);
    if(isManagerResponce){
      isManager = true;
    }
    
  }

  return (
    <>
    
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        {guildName} Events
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
            { upcomingEvents.length == 0 && <div className="col-span-3">No upcoming events</div> }
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

      { isManager && 
        <Link href={`/event/server/${id}/create`} className="absolute right-2 bottom-2 z-99">
          <Button className={clsx({ "animate-bounce": upcomingEvents.length == 0 })}>
            <Plus className="mr-2 h-4 w-4" />
            Create new
          </Button>
        </Link>
      }

    </>
  );
}
