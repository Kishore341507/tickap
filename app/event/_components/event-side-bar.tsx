"use client";

import clsx from "clsx";
import { 
  Calendar, 
  FileText, 
  Info, 
  Server, 
  ExternalLink,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { botInviteUrl } from "@/lib/discord";
import { Guild } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function EventSideBar() {
  const pathname = usePathname();
  const { status } = useSession();
  const [hasManagerGuilds, setHasManagerGuilds] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Restore collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tickap_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // localStorage may fail in private browsing
    }
    const timer = setTimeout(() => setHasMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tickap_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "b" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check manager guilds for organizer forms link
  useEffect(() => {
    if (status !== "authenticated") {
      setHasManagerGuilds(false);
      return;
    }
    fetch("/api/discord/user/guild")
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        setHasManagerGuilds(
          Array.isArray(data) && data.some((guild: Guild) => guild.manager && guild.mutual)
        );
      })
      .catch(() => setHasManagerGuilds(false));
  }, [status]);

  const navItemClass = (isActive: boolean) =>
    clsx(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
      isActive
        ? "bg-primary/10 text-primary dark:bg-primary/15 font-semibold"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );

  const collapsedItemClass = (isActive: boolean) =>
    clsx(
      "flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-150",
      isActive
        ? "bg-primary/10 text-primary dark:bg-primary/15 font-semibold ring-1 ring-primary/25"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={clsx(
          "hidden lg:flex flex-col border-r border-border/50 bg-card/50 backdrop-blur-sm h-screen sticky top-0 shrink-0 z-20 overflow-x-hidden",
          hasMounted && "transition-[width] duration-300 ease-in-out",
          isCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div
          className={clsx(
            "flex h-16 items-center border-b border-border/40 shrink-0",
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/event"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 p-1.5 hover:bg-primary/20 transition-all duration-150"
                  aria-label="TickAp"
                >
                  <Image
                    src="/tickap_dark.svg"
                    width={22}
                    height={22}
                    alt="TickAp Logo"
                    className="dark:block hidden"
                    priority
                  />
                  <Image
                    src="/tickap_light.svg"
                    width={22}
                    height={22}
                    alt="TickAp Logo"
                    className="dark:hidden block"
                    priority
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                TickAp
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Link className="flex items-center gap-2.5 transition-opacity hover:opacity-90 min-w-0" href="/event">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 p-1">
                  <Image
                    src="/tickap_dark.svg"
                    width={24}
                    height={24}
                    alt="TickAp Logo"
                    className="dark:block hidden"
                    priority
                  />
                  <Image
                    src="/tickap_light.svg"
                    width={24}
                    height={24}
                    alt="TickAp Logo"
                    className="dark:hidden block"
                    priority
                  />
                </div>
                <span className="font-bold tracking-tight text-base truncate">TickAp</span>
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleCollapsed}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                    aria-label="Collapse sidebar (Ctrl+B)"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-medium text-xs">
                  Collapse sidebar <span className="opacity-60 text-[10px] ml-1 font-mono">Ctrl+B</span>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Main Navigation */}
        <div
          className={clsx(
            "flex-1 overflow-y-auto overflow-x-hidden",
            isCollapsed ? "p-2 space-y-3 flex flex-col items-center" : "px-3 py-4 space-y-6"
          )}
        >
          {isCollapsed ? (
            /* Collapsed Icon Rail */
            <>
              {/* Expand Trigger Button at top of rail */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleCollapsed}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-150"
                    aria-label="Expand sidebar (Ctrl+B)"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Expand sidebar <span className="opacity-60 text-[10px] ml-1 font-mono">Ctrl+B</span>
                </TooltipContent>
              </Tooltip>

              <div className="w-8 h-px bg-border/40 my-1" />

              {/* Discover Nav */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/event"
                    className={collapsedItemClass(pathname === "/event")}
                    aria-label="Browse Events"
                  >
                    <Calendar className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Browse Events
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/event/server"
                    className={collapsedItemClass(pathname === "/event/server" || pathname.startsWith("/event/server/"))}
                    aria-label="Servers"
                  >
                    <Server className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  Servers
                </TooltipContent>
              </Tooltip>

              {/* Organizer Nav */}
              {hasManagerGuilds && (
                <>
                  <div className="w-8 h-px bg-border/40 my-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/event/forms"
                        className={collapsedItemClass(pathname.startsWith("/event/forms"))}
                        aria-label="Forms & Applications"
                      >
                        <FileText className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                      Forms & Applications
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              <div className="w-8 h-px bg-border/40 my-1" />

              {/* About Nav */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/event/aboutus"
                    className={collapsedItemClass(pathname === "/event/aboutus")}
                    aria-label="About TickAp"
                  >
                    <Info className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                  About TickAp
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            /* Expanded Full Navigation */
            <>
              {/* Discovery Group */}
              <div>
                <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase mb-2">
                  Discover
                </p>
                <nav className="space-y-1">
                  <Link
                    className={navItemClass(pathname === "/event")}
                    href="/event"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Browse Events</span>
                  </Link>

                  <Link
                    className={navItemClass(pathname === "/event/server" || pathname.startsWith("/event/server/"))}
                    href="/event/server"
                  >
                    <Server className="h-4 w-4" />
                    <span>Servers</span>
                  </Link>
                </nav>
              </div>

              {/* Manager Group */}
              {hasManagerGuilds && (
                <div>
                  <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase mb-2">
                    Organizer
                  </p>
                  <nav className="space-y-1">
                    <Link
                      className={navItemClass(pathname.startsWith("/event/forms"))}
                      href="/event/forms"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Forms & Applications</span>
                    </Link>
                  </nav>
                </div>
              )}

              {/* About Group */}
              <div>
                <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase mb-2">
                  About
                </p>
                <nav className="space-y-1">
                  <Link
                    className={navItemClass(pathname === "/event/aboutus")}
                    href="/event/aboutus"
                  >
                    <Info className="h-4 w-4" />
                    <span>About TickAp</span>
                  </Link>
                </nav>
              </div>
            </>
          )}
        </div>

        {/* Footer Area */}
        {isCollapsed ? (
          <div className="p-2 border-t border-border/40 shrink-0 flex flex-col items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={botInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-xl bg-foreground/10 text-foreground hover:bg-foreground/15 transition-all duration-150"
                  aria-label="Add TickAp Bot to Discord"
                >
                  <Bot className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                Add TickAp Bot to Discord
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="p-3 border-t border-border/40 shrink-0">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="rounded-md bg-foreground/10 p-1 text-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold">TickAp Bot</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Host tournaments & sync rosters directly inside your Discord server.
              </p>
              <a
                href={botInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full text-xs font-medium bg-foreground text-background hover:opacity-90 py-1.5 px-3 rounded-lg transition-opacity"
              >
                <span>Add to Discord</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
