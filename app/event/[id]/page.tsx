import prisma from "@/prisma/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Trophy, Info, UserCircle2 } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { getGuild, checkIsManager } from "@/lib/discord";
import { auth } from "@/auth";
import { RegisterButton } from "./_components/register-button";
import ManagerActionCard from "./_components/manager-action-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EventDetailPage({ params, }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const event = await prisma.events.findUnique({
    where: { id: BigInt(id) },
    include: {
      registrations: {
        include: {
          registrationusers: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Check if current user is registered for this event
  let isRegistered = false;
  let userRegistration = null;

  if (session?.user?.userId) {
    const userId = session.user.userId ? BigInt(session.user.userId) : null;

    // Find registration that includes the current user
    userRegistration = event.registrations.find(registration =>
      registration.registrationusers.some(user => user.user_id === userId)
    );

    isRegistered = !!userRegistration;
  }

  // Check if current user is manager for this guild
  let isManager = false;
  if (session?.user?.userId && event.guild_id) {
    isManager = await checkIsManager(session.user.userId, event.guild_id.toString());
  }

  // Fetch guild information if the event has a guild_id
  let guildInfo = null;
  if (event.guild_id) {
    guildInfo = await getGuild(event.guild_id.toString());
  }

  const statusColors = {
    Open: "bg-green-500",
    Closed: "bg-red-500",
    Cancelled: "bg-gray-500",
    Live: "bg-red-500 animate-pulse",
  };

  const categoryColors = {
    VideoGame: "bg-blue-500",
    ESports: "bg-purple-500",
    Music: "bg-pink-500",
    Other: "bg-gray-500",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Event Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Banner */}
          <div className="relative h-64 w-full rounded-lg overflow-hidden">
            <Image
              src={event.banner}
              alt={event.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Event Title and Status */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <Badge
              className={`${statusColors[event.status]} text-white`}
            >
              {event.status}
            </Badge>
          </div>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>
                    {/* {event.date
                      ? format(new Date(event.date), "MMMM d, yyyy h:mm a")
                      : "Date not set"} */}
                    {event.date
                      ? new Date(event.date).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                      })
                      : "Date not set"}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span>
                    {event.is_solo
                      ? "Solo Event"
                      : `Team Size: ${event.min_team_player}-${event.max_team_player} players`}
                  </span>
                </div>
                {event.prize && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-gray-500" />
                    <span>Prize: {event.prize}</span>
                  </div>
                )}
                <Badge
                  className={`${categoryColors[event.category]} text-white`}
                >
                  {event.category}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="lg:hidden">
            <Card>
              <CardHeader>
                <CardTitle>Registration Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Teams Registered</p>
                    <p className="text-2xl font-bold">
                      {event.registrations.length}
                      {event.max_teams && ` / ${event.max_teams}`}
                    </p>
                  </div>

                  {/* Registration Button */}
                  <RegisterButton
                    eventId={id}
                    eventStatus={event.status}
                    isRegistered={isRegistered}
                    redirectUrl={event.redirect_url}
                    isSolo={event.is_solo}
                    maxTeamPlayer={event.max_team_player}
                    minTeamPlayer={event.min_team_player}
                    guildId={event.guild_id}
                    session={!!session}
                    userRegistration={userRegistration}
                    eventExtra={event.extra}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Description */}
          {event.details && (
            <Card>
              <CardHeader>
                <CardTitle>About the Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{event.details}</p>
              </CardContent>
            </Card>
          )}

          {/* Event Rules */}
          {event.rules && (
            <Card>
              <CardHeader>
                <CardTitle>Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{event.rules}</p>
              </CardContent>
            </Card>
          )}

          {/* Registrations Accordion */}
          {event.registrations.length > 0 && isManager && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Registered Teams
                  </CardTitle>
                  {isManager && (
                    <div className="flex gap-2">
                      <Link href={`/event/server/${event.guild_id?.toString()}/logs/${id}`}>
                        <Button variant="outline" size="sm">
                          <span className="sr-only">Logs</span>
                          Logs
                        </Button>
                      </Link>
                      <Link href={`/event/server/${event.guild_id?.toString()}/registrations/${id}`}>
                        <Button variant="outline" size="sm">
                          <span className="sr-only">Manage</span>
                          Manage
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {event.registrations.map((registration) => (
                    <AccordionItem key={registration.id.toString()} value={registration.id.toString()}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-medium">
                            {registration.team_name || "Unnamed Team"}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {registration.registrationusers.length} {registration.registrationusers.length === 1 ? 'member' : 'members'}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 py-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {registration.registrationusers.map((user) => (
                              <div
                                key={user.user_id.toString()}
                                className="flex items-center gap-3 p-2 rounded-md border"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={user.pfp || undefined}
                                    alt={user.user_name || "User"}
                                  />
                                  <AvatarFallback>
                                    <UserCircle2 className="h-6 w-6" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {user.user_name || "Unknown User"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Manager Actions Card - Only shown to managers */}
          {isManager && event.guild_id && (
            <ManagerActionCard
              eventId={id}
              currentStatus={event.status}
              guildId={event.guild_id.toString()}
            />
          )}

          {/* Registration Info - for desktop view */}
          <div className="hidden lg:block">
            <Card>
              <CardHeader>
                <CardTitle>Registration Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* <div>
                    <p className="text-sm text-gray-500">Total Teams Registered</p>
                    <p className="text-2xl font-bold">
                      {event.registrations.length}
                      {event.max_teams && ` / ${event.max_teams}`}
                    </p>
                  </div> */}
                  
                  {/* Registration Button */}
                  <RegisterButton
                    eventId={id}
                    eventStatus={event.status}
                    isRegistered={isRegistered}
                    redirectUrl={event.redirect_url}
                    isSolo={event.is_solo}
                    maxTeamPlayer={event.max_team_player}
                    minTeamPlayer={event.min_team_player}
                    guildId={event.guild_id}
                    session={!!session}
                    userRegistration={userRegistration}
                    eventExtra={event.extra}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Info */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Platform</p>
                  <p className="font-medium">{event.platform}</p>
                </div>
                {guildInfo && (
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={guildInfo.icon ? `https://cdn.discordapp.com/icons/${guildInfo.id}/${guildInfo.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}
                        alt={guildInfo.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{guildInfo.name}</p>
                      <p className="text-sm text-gray-500">Discord Server</p>
                    </div>
                  </div>
                )}
                {event.location_url && (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Join Platform
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
