import { Calendar, Gamepad2, Music, Trophy, HelpCircle, Users, MapPin, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Event } from '@/types';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  // Function to get the appropriate icon based on category
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'VideoGame':
        return <Gamepad2 className="h-3.5 w-3.5" />;
      case 'ESports':
        return <Trophy className="h-3.5 w-3.5" />;
      case 'Music':
        return <Music className="h-3.5 w-3.5" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5" />;
    }
  };

  // Format category name if custom category_name is not provided
  const displayCategory = event.category_name || event.category?.replace(/([A-Z])/g, ' $1').trim() || "Event";

  // Formatted date
  const formattedDate = event.date 
    ? new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : "Date TBD";

  const bannerSrc = event.banner || "/tickap_dark.png";

  return (
    <Link href={`/event/${event.id}`} className="group block h-full">
      <div className="relative flex flex-col h-full rounded-xl border border-border/60 bg-card overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-md">
        {/* 16:9 Aspect Ratio Hero Banner */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
          <Image
            src={bannerSrc}
            alt={event.name || "Event banner"}
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            unoptimized
          />
          {/* Subtle gradient overlay for badge readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Top Overlays */}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
            {/* Category Pill */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-md border border-border/30 shadow-xs">
              {getCategoryIcon(event.category)}
              <span>{displayCategory}</span>
            </span>

            {/* Status Pill */}
            {event.status === "Live" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow-xs backdrop-blur-md animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Live
              </span>
            ) : event.status === "Open" ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-medium text-white shadow-xs backdrop-blur-md">
                Open
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-zinc-700/90 px-2.5 py-1 text-xs font-medium text-zinc-100 shadow-xs backdrop-blur-md">
                {event.status}
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                {event.name}
              </h3>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
            </div>

            {/* Quick Meta Row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/80" />
                <span className="line-clamp-1">{event.platform || "Discord / Online"}</span>
              </div>
            </div>
          </div>

          {/* Card Footer Divider */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
            {/* Format (Solo vs Team) */}
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>
                {event.is_solo 
                  ? "Solo" 
                  : event.min_team_player 
                    ? `${event.min_team_player}-${event.max_team_player || event.min_team_player} Players`
                    : "Team Event"}
              </span>
            </div>

            {/* Prize Pool */}
            {event.prize ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <Trophy className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{event.prize}</span>
              </span>
            ) : (
              <span className="text-muted-foreground/70">Community</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
