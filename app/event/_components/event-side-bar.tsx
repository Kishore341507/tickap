"use client";

import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { FileText, HomeIcon, Info, Server, Settings, SquarePlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { botInviteUrl } from "@/lib/discord";
import { Guild } from "@/types";

export default function EventSideBar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { status } = useSession();
  const [hasManagerGuilds, setHasManagerGuilds] = useState(false);

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
      });
  }, [status]);

  // const GuildSkeleton = () => (
  //   <div className="flex items-center gap-2 rounded-lg px-3 py-2">
  //     <Skeleton className="h-5 w-5 rounded-lg" />
  //     <Skeleton className="h-4 w-32" />
  //   </div>
  // );

  // const GuildListSkeleton = () => (
  //   <div className="space-y-2">
  //     {[...Array(4)].map((_, i) => (
  //       <GuildSkeleton key={i} />
  //     ))}
  //   </div>
  // );

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

            {hasManagerGuilds && (
              <Link
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  {
                    "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50":
                      pathname.startsWith("/event/forms"),
                  }
                )}
                href="/event/forms"
              >
                <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                  <FileText className="h-3 w-3" />
                </div>
                Forms
              </Link>
            )}
            
            <Link
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                {
                  "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50":
                    pathname === "/event/server",
                }
              )}
              href="/event/server"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Server className="h-3 w-3" />
              </div>
              Servers
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

          </nav>
        </div>
      </div>
    </div>
  );
}
