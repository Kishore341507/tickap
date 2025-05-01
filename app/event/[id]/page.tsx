import prisma from "@/prisma/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Trophy, Info } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { getGuild } from "@/lib/discord";
import { auth } from "@/auth";
import { RegisterButton } from "./_components/register-button";

// interface EventDetailPageProps {
//   params: {
//     id: string;
//   };
// }

export default async function EventDetailPage({params,}: {params: Promise<{ id: string }>} ) {
  const session = await auth();
  const { id } = await params ;
  
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
  if (session?.user?.userId) {
    const userId = session.user.userId ? BigInt(session.user.userId) : null;
    isRegistered = event.registrations.some(registration => 
      registration.registrationusers.some(user => 
      user.user_id === userId
      )
    );
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
    VedioGame: "bg-blue-500",
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
                    {event.date
                      ? format(new Date(event.date), "MMMM d, yyyy h:mm a")
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Info */}
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
                />
              </div>
            </CardContent>
          </Card>

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
