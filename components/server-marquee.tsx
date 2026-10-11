"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, ExternalLink, ShieldCheck } from "lucide-react";

export interface MarqueeGuild {
  id: string;
  name: string;
  icon: string | null;
  members: number;
}

interface ServerMarqueeProps {
  guilds: MarqueeGuild[];
}

function ServerBadgeItem({ guild }: { guild: MarqueeGuild }) {
  const [imgError, setImgError] = useState(false);
  const initial = guild.name ? guild.name.charAt(0).toUpperCase() : "T";
  
  const formatMembers = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return count.toString();
  };

  return (
    <Link
      href={`/event/server`}
      className="group flex-shrink-0 flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/40 backdrop-blur-md shadow-xs hover:shadow-md transition-all duration-300"
    >
      {/* Server Icon / Fallback */}
      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center border border-border/40 shrink-0 group-hover:scale-105 transition-transform duration-300">
        {guild.icon && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={guild.icon}
            alt={guild.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className="text-base font-bold text-primary select-none">
            {initial}
          </span>
        )}
      </div>

      {/* Server Info */}
      <div className="flex flex-col min-w-0 pr-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-foreground truncate max-w-[140px] sm:max-w-[170px] group-hover:text-primary transition-colors">
            {guild.name}
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {formatMembers(guild.members)} members
          </span>
        </div>
      </div>

      <div className="text-muted-foreground/40 group-hover:text-primary transition-colors pl-1">
        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

export function ServerMarquee({ guilds }: ServerMarqueeProps) {
  if (!guilds || guilds.length === 0) return null;

  // Duplicate list twice to create a seamless infinite loop
  const displayList = [...guilds, ...guilds];

  return (
    <div className="relative w-full overflow-hidden py-4 select-none">
      {/* Side gradient blur masks for smooth fade in/out */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

      {/* Marquee Row: Moving Left to Right */}
      <div className="animate-marquee-ltr flex items-center gap-4">
        {displayList.map((guild, idx) => (
          <ServerBadgeItem key={`${guild.id}-${idx}`} guild={guild} />
        ))}
      </div>
    </div>
  );
}
