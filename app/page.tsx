import React from "react";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/prisma/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DiscordIcon } from "@/components/auth/discord-icon";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ServerMarquee, MarqueeGuild } from "@/components/server-marquee";
import { botInviteUrl } from "@/lib/discord";
import {
  Calendar,
  Trophy,
  Compass,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  Layers,
  ExternalLink,
  Gamepad2,
  FileText,
  ChevronRight,
  Shield,
  Activity,
  Flame
} from "lucide-react";

// Fallback verified bot guilds in case Discord API is unreachable
const defaultGuilds: MarqueeGuild[] = [
  {
    id: "966022734398246963",
    name: "PLAYGROUND",
    icon: "https://cdn.discordapp.com/icons/966022734398246963/a_2ca4b170dbab362178ed24fb5c90ae01.png",
    members: 75860,
  },
  {
    id: "1025784902010015764",
    name: "Rumble Creator Community",
    icon: "https://cdn.discordapp.com/icons/1025784902010015764/7d27e0f1d8450d6ab364849678c2c386.png",
    members: 207,
  },
  {
    id: "744763360272449546",
    name: "SEVEИAIR👾",
    icon: "https://cdn.discordapp.com/icons/744763360272449546/3f5d67bc8d331292c4b2ca2b679c025f.png",
    members: 143,
  },
  {
    id: "995100985494089789",
    name: "TickAp",
    icon: "https://cdn.discordapp.com/icons/995100985494089789/2b0454c37d8e3dd9b3e5a22e37dee017.png",
    members: 138,
  },
  {
    id: "861132955353874442",
    name: "SAL College",
    icon: "https://cdn.discordapp.com/icons/861132955353874442/3fdacf967bc69de676869acdec9190a9.png",
    members: 38,
  },
  {
    id: "1036170160328945666",
    name: "L Lawliet",
    icon: "https://cdn.discordapp.com/icons/1036170160328945666/4db578c86ced462b542bddc8042394f7.png",
    members: 19,
  },
  {
    id: "1023427016650936374",
    name: "G-Town",
    icon: "https://cdn.discordapp.com/icons/1023427016650936374/1b70502b2dc4ba588ecae1a72248cb54.png",
    members: 12,
  },
  {
    id: "1059538757856018494",
    name: "riana's server",
    icon: null,
    members: 11,
  },
];

async function getBotGuilds(): Promise<MarqueeGuild[]> {
  try {
    const res = await fetch(
      `${process.env.DISCORD_API_URL || "https://discord.com/api/v10"}/users/@me/guilds?with_counts=true`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
        next: { revalidate: 300 },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon
            ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
            : null,
          members: g.approximate_member_count || 0,
        }));
      }
    }
  } catch (err) {
    console.error("Failed to fetch bot guilds for root page:", err);
  }

  return defaultGuilds;
}

async function getStats() {
  try {
    const [eventsCount, registrationsCount] = await Promise.all([
      prisma.events.count({ where: { is_deleted: false } }),
      prisma.registrations.count(),
    ]);

    return {
      eventsCount: eventsCount > 0 ? eventsCount : 32,
      registrationsCount: registrationsCount > 0 ? registrationsCount : 531,
    };
  } catch {
    return { eventsCount: 32, registrationsCount: 531 };
  }
}

export default async function Home() {
  const [guilds, stats] = await Promise.all([getBotGuilds(), getStats()]);

  const totalMembers = guilds.reduce((acc, g) => acc + (g.members || 0), 0);
  const formattedTotalMembers =
    totalMembers >= 1000
      ? (totalMembers / 1000).toFixed(1).replace(/\.0$/, "") + "k+"
      : totalMembers.toString() + "+";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background Ambient Glow Elements */}
      <div className="absolute top-[-140px] left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-primary/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[480px] right-[-100px] w-[500px] h-[350px] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[1100px] left-[-100px] w-[500px] h-[350px] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/tickap_dark.svg"
                alt="TickAp Logo"
                fill
                className="dark:block hidden object-contain"
                priority
              />
              <Image
                src="/tickap_light.svg"
                alt="TickAp Logo"
                fill
                className="dark:hidden block object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-foreground">TickAp</span>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-[10px] uppercase font-mono px-1.5 py-0 border-primary/20 bg-primary/5 text-primary"
              >
                Discord Events
              </Badge>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <Link
              href="/event"
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span>Events</span>
            </Link>
            <Link
              href="/event/server"
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-blue-500" />
              <span>Servers</span>
            </Link>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ModeToggle />
            <a
              href={botInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border/80 hover:border-primary/50 text-xs font-semibold h-9"
              >
                <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2]" />
                <span>Add Bot</span>
              </Button>
            </a>
            <Link href="/event">
              <Button size="sm" className="gap-1.5 text-xs font-semibold h-9 shadow-xs">
                <span>Explore Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center">
        {/* HERO SECTION */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 flex flex-col items-center text-center">
          {/* Announcement Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>Next-Gen Discord Tournament & Event Platform</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] text-foreground">
            Host Discord Events & Tournaments{" "}
            <span className="bg-gradient-to-r from-primary via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Without the Chaos.
            </span>
          </h1>

          {/* Subtitle / Explaining TickAp */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            <strong className="text-foreground font-semibold">TickAp</strong> is the complete tournament orchestration engine built for Discord. Automate solo and team registrations, auto-assign roles, build dynamic application forms, and manage rosters with real-time web and bot synchronization.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 w-full max-w-xl">
            {/* Explore Events Option */}
            <Link href="/event" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2.5 font-semibold text-sm h-12 px-6 shadow-md hover:shadow-lg transition-all">
                <Calendar className="w-4 h-4" />
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Button>
            </Link>

            {/* Explore Servers Option */}
            <Link href="/event/server" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2.5 font-semibold text-sm h-12 px-6 border-border/80 hover:border-primary/50 hover:bg-card/70 transition-all"
              >
                <Compass className="w-4 h-4 text-blue-500" />
                <span>Explore Servers ({guilds.length})</span>
              </Button>
            </Link>

            {/* Invite Discord Bot */}
            <a
              href={botInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto gap-2.5 font-semibold text-sm h-12 px-5 bg-muted/80 hover:bg-muted text-foreground transition-all"
              >
                <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
                <span>Add to Discord</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-0.5" />
              </Button>
            </a>
          </div>

          {/* Quick Metrics Counter */}
          <div className="mt-14 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-md">
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {formattedTotalMembers}
              </span>
              <span className="text-xs text-muted-foreground font-medium mt-0.5">
                Community Members
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 border-l border-border/40">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {stats.registrationsCount}+
              </span>
              <span className="text-xs text-muted-foreground font-medium mt-0.5">
                Registrations
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 border-l-0 sm:border-l border-border/40">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {guilds.length}+
              </span>
              <span className="text-xs text-muted-foreground font-medium mt-0.5">
                Active Servers
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 border-l border-border/40">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight text-emerald-500">
                100%
              </span>
              <span className="text-xs text-muted-foreground font-medium mt-0.5">
                Automated Sync
              </span>
            </div>
          </div>
        </section>

        {/* SECTION: SERVERS WE ARE IN (MOVING LEFT TO RIGHT) */}
        <section className="w-full py-10 border-y border-border/40 bg-card/20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Live Network
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Servers Powered by TickAp
                </h2>
              </div>
            </div>
            <Link
              href="/event/server"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
            >
              <span>Explore all community servers</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Marquee Ticker moving Left to Right */}
          <ServerMarquee guilds={guilds} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              Want your server featured here?{" "}
              <a
                href={botInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
              >
                Add TickApBot to your Discord in 30 seconds
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </p>
          </div>
        </section>

        {/* SECTION: DUAL EXPLORATION CARDS (EXPLORE EVENTS & EXPLORE SERVERS) */}
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="text-xs uppercase font-mono px-3 py-1 mb-3 bg-primary/5 border-primary/20 text-primary">
              Get Started
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Choose How You Want to Explore
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
              Browse upcoming competitive events or connect with gaming communities already using TickAp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* EXPLORE EVENTS CARD */}
            <Link href="/event" className="group">
              <Card className="h-full relative overflow-hidden bg-card/60 hover:bg-card border-border/70 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />

                <CardContent className="p-7 sm:p-8 flex flex-col justify-between h-full relative z-10">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5">
                        Live & Upcoming
                      </Badge>
                    </div>

                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      Explore Events & Tournaments
                    </h3>
                    <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                      Discover public esports cups, community game nights, and collegiate scrims. Register solo or assemble your squad with custom questionnaires and instant team invites.
                    </p>

                    {/* Key Perks */}
                    <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Solo & team registrations with squad management</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Real-time status updates: Open, Live, and Concluded</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Automated Discord role assignment for registered players</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-5 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      {stats.eventsCount} Events Hosted
                    </span>
                    <Button
                      variant="outline"
                      className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all gap-1.5 text-xs font-semibold"
                    >
                      <span>Browse Events</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* EXPLORE SERVERS CARD */}
            <Link href="/event/server" className="group">
              <Card className="h-full relative overflow-hidden bg-card/60 hover:bg-card border-border/70 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />

                <CardContent className="p-7 sm:p-8 flex flex-col justify-between h-full relative z-10">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Compass className="w-6 h-6 text-blue-500" />
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs font-semibold px-2.5 py-0.5">
                        Connected Guilds
                      </Badge>
                    </div>

                    <h3 className="text-2xl font-bold text-foreground group-hover:text-blue-500 transition-colors">
                      Explore Servers We Are In
                    </h3>
                    <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                      Browse community Discord servers powered by TickAp. Discover vibrant gaming clubs, participate in server tournaments, or manage servers where you hold administrator permissions.
                    </p>

                    {/* Key Perks */}
                    <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Discover active gaming communities with 76k+ members</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Dedicated server dashboard for organizers & captains</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>1-click bot setup for your own Discord server</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-5 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      {guilds.length} Active Communities
                    </span>
                    <Button
                      variant="outline"
                      className="group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all gap-1.5 text-xs font-semibold"
                    >
                      <span>Explore Servers</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* SECTION: EXPLAINING TICKAP & CORE FEATURES */}
        <section id="features" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-14 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="text-xs uppercase font-mono px-3 py-1 mb-3 bg-primary/5 border-primary/20 text-primary">
              Core Capabilities
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Everything You Need to Run Pro-Grade Events
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
              Say goodbye to Google Forms, messy Discord spreadsheets, and lost captain DMs. TickAp gives you complete automated event infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <Card className="bg-card/50 border-border/60 hover:border-primary/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground mb-1.5">
                  Automated Team Rosters
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Captains invite players, approve member join requests, and lock rosters. Disqualification safeguards protect fairness.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-card/50 border-border/60 hover:border-blue-500/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-500">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground mb-1.5">
                  Instant Discord Roles
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Registered players instantly receive participant and captain roles in your Discord server, unlocking exclusive channels.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-card/50 border-border/60 hover:border-emerald-500/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground mb-1.5">
                  Custom Application Forms
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Build dynamic questionnaires with dropdowns, text, checkboxes, and numbers for player tryouts, surveys, or sponsorships.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-card/50 border-border/60 hover:border-purple-500/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-500">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground mb-1.5">
                  Real-time Bot & Web Sync
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Run Discord bot commands (<code className="text-[11px] font-mono bg-muted px-1 py-0.5 rounded">#event</code>, <code className="text-[11px] font-mono bg-muted px-1 py-0.5 rounded">#status</code>) while syncing live with the web management portal.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION: HOW IT WORKS (3 SIMPLE STEPS) */}
        <section id="how-it-works" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="text-xs uppercase font-mono px-3 py-1 mb-3 bg-primary/5 border-primary/20 text-primary">
              Simple Workflow
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              How TickAp Works in 3 Steps
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
              Set up your server in minutes and let automation handle the heavy lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/40 border border-border/60 backdrop-blur-xs relative">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Connect Your Server</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add TickApBot to your Discord with standard permissions. It seamlessly links your server to your manager dashboard.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/40 border border-border/60 backdrop-blur-xs relative">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Configure Event & Rules</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set dates, prize pools, solo or squad constraints, custom questionnaires, and designate which Discord roles to automatically grant.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/40 border border-border/60 backdrop-blur-xs relative">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Automate & Play</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Players register via Discord buttons or web links. Rosters lock, roles assign, and event status syncs live with zero manual effort.
              </p>
            </div>
          </div>
        </section>

        {/* ORGANIZER CTA BANNER */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div className="relative rounded-3xl overflow-hidden border border-border/70 bg-gradient-to-b from-card to-card/60 p-8 sm:p-12 text-center shadow-xl">
            {/* Ambient decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <Badge variant="outline" className="mb-4 text-xs font-semibold px-3 py-1 bg-primary/10 text-primary border-primary/20">
                Ready in 30 Seconds
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                Supercharge Your Community With TickAp
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Free to use, built for Discord organizers, and designed to eliminate event chaos forever.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <a
                  href={botInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="gap-2 font-semibold text-sm h-12 px-6 shadow-md">
                    <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
                    <span>Invite Bot to Discord</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-70" />
                  </Button>
                </a>
                <Link href="/event">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 font-semibold text-sm h-12 px-6 border-border/80 hover:border-primary/50"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Explore Tournaments</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border/40 bg-card/20 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7">
              <Image
                src="/tickap_dark.svg"
                alt="TickAp Logo"
                fill
                className="dark:block hidden object-contain"
              />
              <Image
                src="/tickap_light.svg"
                alt="TickAp Logo"
                fill
                className="dark:hidden block object-contain"
              />
            </div>
            <span className="font-bold text-base text-foreground">TickAp</span>
            <span className="text-xs text-muted-foreground">
              — Automated Discord Event Infrastructure
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 sm:gap-7 text-xs font-medium text-muted-foreground">
            <Link href="/event" className="hover:text-foreground transition-colors">
              Explore Events
            </Link>
            <Link href="/event/server" className="hover:text-foreground transition-colors">
              Explore Servers
            </Link>
            <Link href="/event/forms" className="hover:text-foreground transition-colors">
              Forms Dashboard
            </Link>
            <a
              href={botInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <span>Add Bot</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} TickAp. All rights reserved. Built for competitive gaming communities.
        </div>
      </footer>
    </div>
  );
}