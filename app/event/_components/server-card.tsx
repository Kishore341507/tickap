"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Guild } from "@/types";
import { Users, ArrowRight, ExternalLink, ShieldCheck, Plus, Globe } from "lucide-react";

interface ServerCardProps {
  guild: Guild;
  type?: "manage" | "invite" | "explore" | "forms";
  customHref?: string;
}

export default function ServerCard({ guild, type = "explore", customHref }: ServerCardProps) {
  const [imgError, setImgError] = useState(false);

  // Fallback initial
  const initial = guild.name ? guild.name.charAt(0).toUpperCase() : "?";

  // Card destination and behavior
  const href = customHref 
    ? customHref 
    : type === "invite" 
      ? "https://discord.com/oauth2/authorize?client_id=1239169472304910408&permissions=8&integration_type=0&scope=bot" 
      : type === "forms"
        ? `/event/forms/guild/${guild.id}`
        : `/event/server/${guild.id}`;
  const isExternal = type === "invite";

  const renderBadge = () => {
    switch (type) {
      case "manage":
      case "forms":
        return (
          <Badge 
            variant="secondary" 
            className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 gap-1 shrink-0"
          >
            <ShieldCheck className="h-3 w-3" />
            <span>Manager</span>
          </Badge>
        );
      case "invite":
        return (
          <Badge 
            variant="secondary" 
            className="text-[10px] font-medium px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 gap-1 shrink-0"
          >
            <Plus className="h-3 w-3" />
            <span>Invite Bot</span>
          </Badge>
        );
      default:
        return (
          <Badge 
            variant="outline" 
            className="text-[10px] font-mono px-2 py-0.5 border-border/60 text-muted-foreground shrink-0"
          >
            Community
          </Badge>
        );
    }
  };

  const renderActionLabel = () => {
    switch (type) {
      case "forms":
        return (
          <>
            <span className="text-foreground/80 group-hover:text-foreground">Manage Forms</span>
            <ArrowRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </>
        );
      case "manage":
        return (
          <>
            <span className="text-foreground/80 group-hover:text-foreground">Manage Server</span>
            <ArrowRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </>
        );
      case "invite":
        return (
          <>
            <span className="text-blue-500 font-semibold group-hover:text-blue-400">Add to Server</span>
            <ExternalLink className="h-3 w-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-blue-500" />
          </>
        );
      default:
        return (
          <>
            <span className="text-foreground/80 group-hover:text-foreground">View Events</span>
            <ArrowRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </>
        );
    }
  };

  const cardContent = (
    <Card className="rounded-xl border border-border/60 bg-card/40 hover:bg-card/80 hover:border-border hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between overflow-hidden p-4 sm:p-5">
      <div>
        {/* Top: Avatar & Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="relative h-12 w-12 shrink-0 rounded-2xl overflow-hidden ring-1 ring-border/60 bg-muted/60 flex items-center justify-center shadow-xs">
            {!imgError && guild.icon && !guild.icon.includes("embed/avatars") ? (
              <Image
                src={guild.icon}
                alt={guild.name || "Server"}
                width={48}
                height={48}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImgError(true)}
                unoptimized
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center font-bold text-base text-foreground">
                {initial}
              </div>
            )}
          </div>

          {renderBadge()}
        </div>

        {/* Server Name */}
        <h3 className="text-sm font-semibold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors" title={guild.name}>
          {guild.name}
        </h3>

        {/* Member Count */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <Users className="h-3.5 w-3.5 opacity-60 shrink-0" />
          <span>
            {typeof guild.approximate_member_count === "number" && guild.approximate_member_count > 0
              ? `${guild.approximate_member_count.toLocaleString()} members`
              : "Discord Community"}
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-muted-foreground/80 font-mono">
          {type === "forms" ? "Forms" : type === "manage" ? "Active" : type === "invite" ? "Setup" : "Public"}
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-medium">
          {renderActionLabel()}
        </span>
      </div>
    </Card>
  );

  if (isExternal) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block group h-full focus-visible:outline-none"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link href={href} className="block group h-full focus-visible:outline-none">
      {cardContent}
    </Link>
  );
}
