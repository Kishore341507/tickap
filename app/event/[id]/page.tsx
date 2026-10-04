import prisma from "@/prisma/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  Info, 
  UserCircle2, 
  UserPlus, 
  Link as LinkIcon, 
  ChevronLeft, 
  ExternalLink, 
  FileText, 
  ShieldAlert, 
  Radio, 
  Server as ServerIcon,
  CheckCircle2,
  Clock
} from "lucide-react";
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
import { Registration } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const registrationCountState = event.hide_registration_count; // true -> hide, null -> users, false -> teams
  const showRegistrationCount = registrationCountState !== true || isManager;
  const showUsersCount = registrationCountState === null;

  let totalUsersRegistered = 0;
  if (showUsersCount || isManager) {
    totalUsersRegistered = event.registrations.reduce((acc, reg) => acc + reg.registrationusers.length, 0);
  }
  const totalMaxUsers = event.max_teams && event.max_team_player ? event.max_teams * event.max_team_player : null;

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
  if (event.status === "Open" && event.enable_team_requests && !isRegistered && !event.is_solo) {
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

  // Render registration card body (reused on desktop and mobile)
  const renderRegistrationDetails = () => (
    <div className="space-y-4">
      {showRegistrationCount && (
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20">
          {(!showUsersCount || isManager) && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Teams Registered
              </p>
              <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {event.registrations.length}
                {event.max_teams && (
                  <span className="text-xs font-normal text-muted-foreground"> / {event.max_teams}</span>
                )}
              </p>
            </div>
          )}
          {(showUsersCount || isManager) && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Total Participants
              </p>
              <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {totalUsersRegistered}
                {totalMaxUsers && (
                  <span className="text-xs font-normal text-muted-foreground"> / {totalMaxUsers}</span>
                )}
              </p>
            </div>
          )}
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
        userRegistration={userRegistration as unknown as Registration | null}
        eventExtra={event.extra}
        allowIncompleteTeams={event.allow_incomplete_teams}
        registerForOther={event.register_for_other}
        enableTeamInvites={event.enable_team_invites}
        openToJoinCount={openToJoinTeams.length}
      />
    </div>
  );

  // Location display resolution
  const isDiscord =
    event.platform === "Discord" ||
    !event.location ||
    event.location.toLowerCase().includes("discord") ||
    event.location.toLowerCase() === "virtual";

  const locationName = isDiscord && guildInfo?.name
    ? guildInfo.name
    : (event.location || (event.location_url ? "Online" : "Virtual"));

  const locationSubtitle = isDiscord
    ? "Discord"
    : (event.platform || (event.location_url ? "Online" : "In-Person"));

  const hasPrize = Boolean(event.prize && event.prize.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground flex-wrap">
        <Link
          href="/event"
          className="hover:text-foreground transition-colors inline-flex items-center gap-1 group"
        >
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Events</span>
        </Link>
        {guildInfo && (
          <>
            <span className="opacity-40">/</span>
            <Link
              href={`/event/server/${event.guild_id}`}
              className="hover:text-foreground transition-colors truncate max-w-[160px]"
            >
              {guildInfo.name}
            </Link>
          </>
        )}
        <span className="opacity-40">/</span>
        <span className="text-foreground truncate max-w-[200px] sm:max-w-md font-semibold">
          {event.name}
        </span>
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Event Hero, Info Strip, Details, Rules, Teams */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Event Hero Banner */}
          <div className="relative aspect-[21/9] sm:aspect-[2.2/1] w-full rounded-2xl overflow-hidden border border-border/50 bg-card/40 shadow-sm">
            {/* Ambient Background Glow */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-25 scale-105"
              style={{ backgroundImage: `url(${event.banner})` }}
            />
            {/* Foreground Banner */}
            <Image
              src={event.banner}
              alt={event.name}
              fill
              className="object-contain relative z-10 p-2"
              unoptimized
            />
            {/* Status & Category Overlay Badges */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
              {event.status === "Live" && (
                <Badge variant="secondary" className="bg-rose-500/15 text-rose-500 border border-rose-500/30 text-xs font-semibold backdrop-blur-md animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
              {event.status === "Open" && (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-semibold backdrop-blur-md">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Registration Open
                </Badge>
              )}
              {event.status === "Closed" && (
                <Badge variant="secondary" className="bg-muted/80 text-muted-foreground border border-border/60 text-xs font-semibold backdrop-blur-md">
                  Closed
                </Badge>
              )}
              {event.status === "Cancelled" && (
                <Badge variant="destructive" className="text-xs font-semibold backdrop-blur-md">
                  Cancelled
                </Badge>
              )}
            </div>

            <div className="absolute top-3 right-3 z-20">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-md text-foreground border border-border/60 text-xs font-medium">
                {event.category}
              </Badge>
            </div>
          </div>

          {/* Title & Headline */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {event.name}
            </h1>
          </div>

          {/* Key Info Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Date & Time */}
            <div className="rounded-xl border border-border/50 bg-card/40 p-3.5 flex flex-col justify-between min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 opacity-70" />
                Date & Time
              </span>
              <p className="text-xs sm:text-sm font-semibold text-foreground mt-2 leading-tight">
                {event.date
                  ? format(new Date(event.date), "MMM d, yyyy")
                  : "TBD"}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {event.date
                  ? format(new Date(event.date), "h:mm a")
                  : "Time TBD"}
              </p>
            </div>

            {/* Location / Mode */}
            <div className="rounded-xl border border-border/50 bg-card/40 p-3.5 flex flex-col justify-between min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 opacity-70" />
                Location
              </span>
              <p
                className="text-xs sm:text-sm font-semibold text-foreground mt-2 truncate"
                title={locationName}
              >
                {locationName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {locationSubtitle}
              </p>
            </div>

            {/* Format & Team Size */}
            <div className="rounded-xl border border-border/50 bg-card/40 p-3.5 flex flex-col justify-between min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 opacity-70" />
                Format
              </span>
              <p className="text-xs sm:text-sm font-semibold text-foreground mt-2">
                {event.is_solo ? "Solo" : "Team Event"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {event.is_solo
                  ? "1 Player"
                  : `${event.min_team_player || 1}-${event.max_team_player || "?"} Players`}
              </p>
            </div>

            {/* Prize Pool */}
            <div className="rounded-xl border border-border/50 bg-card/40 p-3.5 flex flex-col justify-between min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 opacity-70" />
                Prize Pool
              </span>
              {hasPrize ? (
                <div>
                  <p
                    className="text-xs sm:text-sm font-semibold text-foreground mt-2 truncate"
                    title={event.prize!}
                  >
                    {event.prize}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    Tournament Reward
                  </p>
                </div>
              ) : (
                <div className="mt-2" />
              )}
            </div>
          </div>

          {/* Mobile Registration Card (rendered in flow on smaller screens) */}
          <div className="lg:hidden">
            <Card className="rounded-xl border border-border/60 bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Registration</CardTitle>
              </CardHeader>
              <CardContent>
                {renderRegistrationDetails()}
              </CardContent>
            </Card>
          </div>

          {/* Open To Join Section */}
          {session && !isRegistered && (openToJoinTeams.length > 0 || userRequests.length > 0 || userInvites.length > 0) && (
            <Card id="open-to-join-section" className="rounded-xl border border-border/60 bg-card/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span>Open Teams & Invitations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Invitations */}
                  {userInvites.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                        Your Invitations
                      </p>
                      {userInvites.map((invite) => {
                        if (!invite.registration) return null;
                        const registration = invite.registration;
                        return (
                          <div
                            key={invite.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20"
                          >
                            <div>
                              <h3 className="font-semibold text-sm text-foreground">
                                {registration.team_name || "Unnamed Team"}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                {registration.registrationusers.length} / {event.max_team_player || "?"} members
                              </p>
                            </div>
                            <RespondInviteButton
                              requestId={invite.id}
                              teamName={registration.team_name || "Unnamed Team"}
                              className="w-full sm:w-auto"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Open Teams List */}
                  {openToJoinTeams.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                        Teams Looking For Players
                      </p>
                      <div className="space-y-2">
                        {openToJoinTeams.map((registration) => {
                          const isComplete = registration.registrationusers.length >= (event.min_team_player || 0);
                          return (
                            <div
                              key={registration.id.toString()}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm text-foreground">
                                  {registration.team_name || "Unnamed Team"}
                                </h3>
                                {showRegistrations && (
                                  <a
                                    href={`#team-${registration.id.toString()}`}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <LinkIcon className="h-3.5 w-3.5 opacity-60" />
                                  </a>
                                )}
                                {!isComplete && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                                    Need Members
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground font-mono ml-1">
                                  ({registration.registrationusers.length}/{event.max_team_player || "?"})
                                </span>
                              </div>

                              <div className="w-full sm:w-auto shrink-0">
                                <JoinRequestButton
                                  registrationId={registration.id.toString()}
                                  eventName={event.name}
                                  teamName={registration.team_name || "Unnamed Team"}
                                  className="w-full sm:w-auto text-xs h-8"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pending User Requests */}
                  {userRequests.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                        Pending Requests
                      </p>
                      <div className="space-y-2">
                        {userRequests.map((request) => {
                          if (!request.registration) return null;
                          const registration = request.registration;
                          return (
                            <div
                              key={request.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20"
                            >
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-foreground">
                                  {registration.team_name || "Unnamed Team"}
                                </h3>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Request Sent
                                </Badge>
                              </div>
                              <RevokeRequestButton
                                registrationId={registration.id.toString()}
                                teamName={registration.team_name || "Unnamed Team"}
                                className="w-full sm:w-auto text-xs h-8"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Event Description Section */}
          {event.details && (
            <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-7 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">About This Event</h2>
              </div>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed pt-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.details}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Event Rules Section */}
          {event.rules && (
            <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-7 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">Rules & Regulations</h2>
              </div>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed pt-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.rules}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Registered Teams Accordion */}
          {event.registrations.length > 0 && showRegistrations && (
            <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-7 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">Registered Teams</h2>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {event.registrations.length} team{event.registrations.length !== 1 ? "s" : ""}
                </span>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-2">
                {event.registrations.map((registration) => (
                  <AccordionItem
                    id={`team-${registration.id.toString()}`}
                    key={registration.id.toString()}
                    value={registration.id.toString()}
                    className="border border-border/40 rounded-xl px-4 bg-muted/10 data-[state=open]:bg-muted/20"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center justify-between w-full pr-3">
                        <span className="font-semibold text-sm text-foreground">
                          {registration.team_name || "Unnamed Team"}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono font-normal">
                          {registration.registrationusers.length}{" "}
                          {registration.registrationusers.length === 1 ? "player" : "players"}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                        {registration.registrationusers.map((user) => (
                          <div
                            key={user.user_id.toString()}
                            className="flex items-center gap-2.5 p-2 rounded-lg border border-border/40 bg-card/60"
                          >
                            <Avatar className="h-7 w-7 rounded-full ring-1 ring-border/50">
                              <AvatarImage
                                src={user.pfp || undefined}
                                alt={user.user_name || "User"}
                              />
                              <AvatarFallback>
                                <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-xs text-foreground truncate">
                              {user.user_name || "Unknown User"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>

        {/* Right Column (Desktop Sticky Sidebar): Actions, Registration Info, Host Server */}
        <div className="space-y-6 lg:sticky lg:top-20 self-start">
          {/* Manager Actions Card - Only shown to managers */}
          {isManager && event.guild_id && (
            <ManagerActionCard
              eventId={id}
              currentStatus={event.status}
              guildId={event.guild_id.toString()}
              eventName={event.name}
            />
          )}

          {/* Desktop Registration Information Card */}
          <div className="hidden lg:block">
            <Card className="rounded-2xl border border-border/60 bg-card/50 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-semibold">Registration</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {renderRegistrationDetails()}
              </CardContent>
            </Card>
          </div>

          {/* Host Server & Platform Information Card */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Host Community</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {guildInfo ? (
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden ring-1 ring-border/60 bg-muted/60 shrink-0">
                    <Image
                      src={
                        guildInfo.icon
                          ? `https://cdn.discordapp.com/icons/${guildInfo.id}/${guildInfo.icon}.png`
                          : "https://cdn.discordapp.com/embed/avatars/0.png"
                      }
                      alt={guildInfo.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/event/server/${guildInfo.id}`}
                      className="font-semibold text-sm text-foreground hover:text-primary transition-colors block truncate"
                    >
                      {guildInfo.name}
                    </Link>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <ServerIcon className="h-3 w-3 opacity-60" />
                      Discord Server
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ServerIcon className="h-4 w-4 opacity-60" />
                  <span>Hosted on Discord</span>
                </div>
              )}

              {event.location_url && (
                <div className="pt-2 border-t border-border/40">
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-medium py-2 px-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/70 text-foreground transition-colors"
                  >
                    <span>Open Event Platform</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
