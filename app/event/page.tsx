import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardImage,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/prisma/db";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Gamepad2 } from "lucide-react";

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
  console.log(await prisma.events.findMany({}));

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
              <Card key={event.id} className="border-secondary hover:scale-105 duration-500 ease-in-out" >
                <CardImage
                  src={event.banner!}
                  alt={event.name!}
                  width={200}
                  height={200}
                  style={{ backgroundImage  : `url(${event.banner})`}}
                  className="bg-cover bg-center backdrop-blur-lg"
                />
                <CardContent>
                  <CardHeader className="text-center pb-3" >
                    <CardTitle>
                        {event.name}
                      </CardTitle>
                    <CardDescription className="flex gap-2 justify-center" >
                        <Gamepad2 className="h-4 w-4" />
                        <span>{event.game_name}</span>
                    </CardDescription>
                    <CardDescription  className="flex gap-2 justify-center">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date?.toDateString()}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardDescription className="text-center" >{ event.details?.length && event.details.length > 100 ? event.details.slice(0, 100) + "..." : event.details }</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="Live">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 ">
          {liveEvents.map((event) => (
              <Card key={event.id} className="border-secondary hover:scale-105 duration-500 ease-in-out" >
                <CardImage
                  src={event.banner!}
                  alt={event.name!}
                  width={200}
                  height={200}
                  style={{ backgroundImage  : `url(${event.banner})`}}
                  className="bg-cover bg-center backdrop-blur-lg"
                />
                <CardContent>
                  <CardHeader className="text-center pb-3" >
                    <CardTitle>
                        {event.name}
                      </CardTitle>
                    <CardDescription className="flex gap-2 justify-center" >
                        <Gamepad2 className="h-4 w-4" />
                        <span>{event.game_name}</span>
                    </CardDescription>
                    <CardDescription  className="flex gap-2 justify-center">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date?.toDateString()}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardDescription className="text-center" >{ event.details?.length && event.details.length > 100 ? event.details.slice(0, 100) + "..." : event.details }</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="Closed">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 ">
          {closedEvents.map((event) => (
              <Card key={event.id} className="border-secondary hover:scale-105 duration-500 ease-in-out" >
                <CardImage
                  src={event.banner!}
                  alt={event.name!}
                  width={200}
                  height={200}
                  style={{ backgroundImage  : `url(${event.banner})`}}
                  className="bg-cover bg-center backdrop-blur-lg"
                />
                <CardContent>
                  <CardHeader className="text-center pb-3" >
                    <CardTitle>
                        {event.name}
                      </CardTitle>
                    <CardDescription className="flex gap-2 justify-center" >
                        <Gamepad2 className="h-4 w-4" />
                        <span>{event.game_name}</span>
                    </CardDescription>
                    <CardDescription  className="flex gap-2 justify-center">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date?.toDateString()}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardDescription className="text-center" >{ event.details?.length && event.details.length > 100 ? event.details.slice(0, 100) + "..." : event.details }</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
