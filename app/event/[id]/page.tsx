import prisma from "@/prisma/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Trophy, Info, UserCircle2, UserPlus, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { getGuild, checkIsManager } from "@/lib/discord";
import { auth } from "@/auth";
import { JoinRequestButton } from "./_components/join-request-button";
import { RegisterButton } from "./_components/register-button";
import { RevokeRequestButton } from "./_components/revoke-request-button";
import { RespondInviteButton } from "./_components/respond-invite-button";


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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  const event = await prisma.events.findUnique({
    where: { id: BigInt(id) },
    select: {
      name: true,
      details: true,
      banner: true,
      date: true,
      prize: true,
      location: true,
      location_url: true,
    }
  });

  if (!event) {
    return {
      title: "Event Not Found",
    };
  }

  const title = event.name;
  
  const dateStr = event.date ? format(event.date, "dd MMMM yyyy, h:mm a") : "Date TBD";
  const prizeStr = event.prize ? `🏆 ${event.prize}` : "";
  const locationStr = event.location ? `📍 ${event.location}` : "";
  
  const metaInfo = [
    `⌚ ${dateStr}`,
    prizeStr,
    locationStr
  ].filter(Boolean).join(" | ");

  let details = (event.details || "Join us for this event!").replace(/\s+/g, " ").trim();
  if (details.length > 250) {
    details = details.substring(0, 250) + "...";
  }

  const description = `${metaInfo}\n\n${details}`;
  let banner = event.banner || "/tickap_dark.png";
  
  if (banner.startsWith("/")) {
    banner = `https://tickap.com${banner}`;
  }

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: `https://tickap.com/event/${id}`,
      siteName: "tickap.com",
      images: [
        {
          url: banner,
          width: 1200,
          height: 600,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [banner],
    },
  };
}

export default async function EventDetailPage({ params, }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const event = await prisma.events.findUnique({
    where: { id: BigInt(id) },
    include: {
      registrations: {
        include: {
          registrationusers: true,
          join_requests: {
            where: {
              status: "PENDING"
            }
          }
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

  // Determine visibility of registrations based on event settings and manager status
  const showRegistrations = !event.hide_registrations || isManager;
  const showRegistrationCount = !event.hide_registration_count || isManager;

  // Fetch guild information if the event has a guild_id
  let guildInfo = null;
  if (event.guild_id) {
    guildInfo = await getGuild(event.guild_id.toString());
  }

  // Fetch user's pending requests for this event
  let userRequests: any[] = [];
  let userInvites: any[] = [];

  if (session?.user?.userId) {
     userRequests = await prisma.joinRequest.findMany({
        where: {
           event_id: BigInt(id),
           user_id: BigInt(session.user.userId),
           type: "REQUEST",
           status: "PENDING"
        },
        include: {
           registration: {
             include: {
               registrationusers: true
             }
           }
        }
     });

     userInvites = await prisma.joinRequest.findMany({
        where: {
            event_id: BigInt(id),
            user_id: BigInt(session.user.userId),
            type: "INVITE",
            status: "PENDING"
        },
        include: {
            registration: {
                include: {
                    registrationusers: true
                }
            }
        }
     });
  }

  // Open To Join Logic
  let openToJoinTeams: typeof event.registrations = [];
  if (event.enable_team_requests && !isRegistered && !event.is_solo) {
    const minPlayers = event.min_team_player || 0;
    const maxPlayers = event.max_team_player || Infinity;

    let requestableTeams = event.registrations.filter(reg => 
      reg.requests_open && reg.registrationusers.length < maxPlayers
    );

    // Filter out teams that user has already requested
    const requestedRegistrationIds = new Set(userRequests.map(r => r.registration_id?.toString()));
    requestableTeams = requestableTeams.filter(reg => !requestedRegistrationIds.has(reg.id.toString()));

    const incompleteTeams = requestableTeams.filter(reg => reg.registrationusers.length < minPlayers);
    const otherOpenTeams = requestableTeams.filter(reg => reg.registrationusers.length >= minPlayers);

    incompleteTeams.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    otherOpenTeams.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    openToJoinTeams = [...incompleteTeams, ...otherOpenTeams];
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
                  {showRegistrationCount && (
                    <div>
                      <p className="text-sm text-gray-500">Total Teams Registered</p>
                      <p className="text-2xl font-bold">
                        {event.registrations.length}
                        {event.max_teams && ` / ${event.max_teams}`}
                      </p>
                    </div>
                  )}

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
                    allowIncompleteTeams={event.allow_incomplete_teams}
                    registerForOther={event.register_for_other}
                    enableTeamInvites={event.enable_team_invites}
                    openToJoinCount={openToJoinTeams.length}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Open To Join Section */}
          {session && !isRegistered && (openToJoinTeams.length > 0 || userRequests.length > 0 || userInvites.length > 0) && (
            <Card id="open-to-join-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Open To Join
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Invitations */}
                  {userInvites.length > 0 && (
                      <>
                        <div className="text-xs uppercase">
                             <span className="bg-background pr-2 text-muted-foreground font-semibold">
                                Your Invitations
                             </span>
                             <span className="w-full border-t absolute top-2 z-[-1]" />
                        </div>
                        {userInvites.map((invite) => {
                             if (!invite.registration) return null;
                             const registration = invite.registration;
                             
                             return (
                                <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
                                   <div>
                                     <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-0">
                                        <h3 className="font-semibold">{registration.team_name || "Unnamed Team"}</h3>
                                        {/* <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Invited You</Badge> */}
                                     </div>
                                     <p className="text-sm text-gray-500">
                                        {registration.registrationusers.length} / {event.max_team_player || "?"} members
                                     </p>
                                   </div>
                                   <div className="w-full sm:w-auto">
                                      <RespondInviteButton
                                         requestId={invite.id}
                                         teamName={registration.team_name || "Unnamed Team"}
                                         className="w-full sm:w-auto"
                                      />
                                   </div>
                                </div>
                             )
                        })}
                         {(openToJoinTeams.length > 0 || userRequests.length > 0) && (
                             <div className="relative py-1">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                            </div>
                         )}
                      </>
                  )}

                  {openToJoinTeams.map((registration) => {
                    const isComplete = registration.registrationusers.length >= (event.min_team_player || 0);

                    return (
                      <div
                        key={registration.id.toString()}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border ${!isComplete ? 'border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20' : ''}`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-0">
                            <h3 className="font-semibold">{registration.team_name || "Unnamed Team"}</h3>
                            {showRegistrations && (
                              <a href={`#team-${registration.id.toString()}`} className="text-muted-foreground hover:text-foreground">
                                <LinkIcon className="h-4 w-4" />
                              </a>
                            )}
                            {!isComplete && (
                              <Badge variant="secondary" className="text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-400 hover:bg-orange-100">
                                Need Members
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {registration.registrationusers.length} / {event.max_team_player || "?"} members
                          </p>
                        </div>

                        <div className="w-full sm:w-auto">
                           <JoinRequestButton
                              registrationId={registration.id.toString()}
                              eventName={event.name}
                              teamName={registration.team_name || "Unnamed Team"}
                              className="w-full sm:w-auto"
                           />
                        </div>
                      </div>
                    )
                  })}

                  {userRequests.length > 0 && (
                      <>
                        {userRequests.map((request) => {
                             if (!request.registration) return null;
                             const registration = request.registration;
                             
                             return (
                                <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                                   <div>
                                     <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-0">
                                        <h3 className="font-semibold">{registration.team_name || "Unnamed Team"}</h3>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Request Sent</Badge>
                                     </div>
                                     <p className="text-sm text-gray-500">
                                        {registration.registrationusers.length} / {event.max_team_player || "?"} members
                                     </p>
                                   </div>
                                   <div className="w-full sm:w-auto">
                                      <RevokeRequestButton
                                         registrationId={registration.id.toString()}
                                         teamName={registration.team_name || "Unnamed Team"}
                                         className="w-full sm:w-auto"
                                      />
                                   </div>
                                </div>
                             )
                        })}
                      </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
          {event.registrations.length > 0 && showRegistrations && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Registered Teams
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {event.registrations.map((registration) => (
                    <AccordionItem id={`team-${registration.id.toString()}`} key={registration.id.toString()} value={registration.id.toString()}>
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
              eventName={event.name}
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
                  {showRegistrationCount && (
                    <div>
                      <p className="text-sm text-gray-500">Total Teams Registered</p>
                      <p className="text-2xl font-bold">
                        {event.registrations.length}
                        {event.max_teams && ` / ${event.max_teams}`}
                      </p>
                    </div>
                  )}
                  
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
                    allowIncompleteTeams={event.allow_incomplete_teams}
                    registerForOther={event.register_for_other}
                    enableTeamInvites={event.enable_team_invites}
                    openToJoinCount={openToJoinTeams.length}
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
