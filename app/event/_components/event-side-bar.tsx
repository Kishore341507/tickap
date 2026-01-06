"use client";

import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { HomeIcon, Info, Clock, UserCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Event } from "@/types";

export default function EventSideBar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { status } = useSession();
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [participatedEvents, setParticipatedEvents] = useState<Event[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isLoadingParticipated, setIsLoadingParticipated] = useState(false);

  // Load recent events from localStorage
  useEffect(() => {
    const loadRecentEvents = async () => {
      try {
        const recentEventIdsJson = localStorage.getItem("recentEventIds");
        if (recentEventIdsJson) {
          const recentEventIds: string[] = JSON.parse(recentEventIdsJson);
          
          // Fetch all recent events
          const eventPromises = recentEventIds.map(async (eventId) => {
            try {
              const response = await fetch(`/api/events/${eventId}`);
              if (response.ok) {
                const data = await response.json();
                return data.event;
              }
              return null;
            } catch (error) {
              console.error(`Error loading event ${eventId}:`, error);
              return null;
            }
          });
          
          const events = await Promise.all(eventPromises);
          // Filter out any null events (failed fetches or deleted events)
          const validEvents = events.filter(event => event !== null);
          setRecentEvents(validEvents);
          
          // Update localStorage to only keep valid event IDs
          if (validEvents.length !== recentEventIds.length) {
            const validEventIds = validEvents.map(event => event.id.toString());
            localStorage.setItem("recentEventIds", JSON.stringify(validEventIds));
          }
        }
      } catch (error) {
        console.error("Error loading recent events:", error);
      } finally {
        setIsLoadingRecent(false);
      }
    };

    loadRecentEvents();
  }, []);

  // Load participated events when authenticated
  useEffect(() => {
    const loadParticipatedEvents = async () => {
      if (status !== "authenticated") {
        setParticipatedEvents([]);
        setIsLoadingParticipated(false);
        return;
      }

      setIsLoadingParticipated(true);
      try {
        const response = await fetch("/api/events/participated");
        if (response.ok) {
          const data = await response.json();
          setParticipatedEvents(data.events || []);
        }
      } catch (error) {
        console.error("Error loading participated events:", error);
      } finally {
        setIsLoadingParticipated(false);
      }
    };

    loadParticipatedEvents();
  }, [status]);

  const EventSkeleton = () => (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2">
      <Skeleton className="h-5 w-5 rounded-lg" />
      <Skeleton className="h-4 w-32" />
    </div>
  );

  return (
    <div className="lg:block hidden border-r h-full border-secondary">
      <div className="flex h-full max-h-screen flex-col gap-2 ">
        <div className="flex h-[55px] items-center justify-between border-b px-3 w-full border-secondary">
          <Link className="flex items-center gap-1 font-semibold ml-1" href="/">
            <Image
              src={theme === "light" ? "/tickap_light.svg" : "/tickap_dark.svg"}
              width={30}
              height={30}
              alt="Tickap : logo"
            />
            <span className="">TickAp</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2 ">
          <nav className="grid items-start px-4 text-sm font-medium">
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50":
                    pathname === "/event",
                }
              )}
              href="/event"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <HomeIcon className="h-3 w-3" />
              </div>
              Home
            </Link>
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50":
                    pathname === "/event/aboutus",
                }
              )}
              href="/event/aboutus"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Info className="h-3 w-3" />
              </div>
              About Us
            </Link>

            {/* Recent Events Section */}
            {isLoadingRecent ? (
              <>
                <Separator className="my-3" />
                <div className="flex gap-1 items-center py-2 px-3">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-semibold">Recently Opened</span>
                </div>
                <ScrollArea className="h-48 rounded-md">
                  {[...Array(3)].map((_, i) => (
                    <EventSkeleton key={i} />
                  ))}
                </ScrollArea>
              </>
            ) : recentEvents.length > 0 ? (
              <>
                <Separator className="my-3" />
                <div className="flex gap-1 items-center py-2 px-3">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-semibold">Recently Opened</span>
                </div>
                <ScrollArea className="h-48 rounded-md">
                  {recentEvents.map((event) => (
                    <Link
                      key={event.id.toString()}
                      className={clsx(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                        {
                          "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50":
                            pathname === `/event/${event.id}`,
                        }
                      )}
                      href={`/event/${event.id}`}
                    >
                      <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 bg-white overflow-hidden flex-shrink-0">
                        <Image
                          src={event.banner || "/tickap_dark.png"}
                          width={20}
                          height={20}
                          alt={event.name}
                          className="rounded-lg"
                        />
                      </div>
                      <span className="truncate text-sm">{event.name}</span>
                    </Link>
                  ))}
                </ScrollArea>
              </>
            ) : null}

            {/* Participated Events Section */}
            {isLoadingParticipated ? (
              <>
                <Separator className="my-3" />
                <div className="flex gap-1 items-center py-2 px-3">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold">Participated Events</span>
                </div>
                <ScrollArea className="h-48 rounded-md">
                  {[...Array(3)].map((_, i) => (
                    <EventSkeleton key={i} />
                  ))}
                </ScrollArea>
              </>
            ) : participatedEvents.length > 0 ? (
              <>
                <Separator className="my-3" />
                <div className="flex gap-1 items-center py-2 px-3">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold">Participated Events</span>
                </div>
                <ScrollArea className="h-48 rounded-md">
                  {participatedEvents.map((event) => (
                    <Link
                      key={event.id.toString()}
                      className={clsx(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                        {
                          "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50":
                            pathname === `/event/${event.id}`,
                        }
                      )}
                      href={`/event/${event.id}`}
                    >
                      <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 bg-white overflow-hidden flex-shrink-0">
                        <Image
                          src={event.banner || "/tickap_dark.png"}
                          width={20}
                          height={20}
                          alt={event.name}
                          className="rounded-lg"
                        />
                      </div>
                      <span className="truncate text-sm">{event.name}</span>
                    </Link>
                  ))}
                </ScrollArea>
              </>
            ) : null}
          </nav>
        </div>
      </div>
    </div>
  );
}
