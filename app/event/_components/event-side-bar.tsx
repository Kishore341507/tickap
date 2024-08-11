"use client";

import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { HomeIcon, Info, Server, Settings, SquarePlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { json } from "stream/consumers";
import { useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Guild {
  id: string;
  name: string;
  permissions: string;
  icon: string;
  manager: boolean;
  mutual: boolean;
}

export default function EventSideBar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { status } = useSession();

  const [mutualManagerGuilds, setMutualManagerGuilds] = useState([]);
  const [toAddGuilds, setToAddGuilds] = useState([]);
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/discord/user/guild")
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        setMutualManagerGuilds(data.filter((guild: Guild) => guild.manager &&  guild.mutual ));
        setToAddGuilds(data.filter((guild: Guild) => guild.manager && !guild.mutual ));
      })
      .catch((err) => console.error(err));
  }, [status]);


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

            {mutualManagerGuilds.length > 0 && (
              <div>
                <Separator className="my-3" />
                <div className="flex gap-1 items-center py-2 px-3">
                  <Settings className="h-5 w-5" />
                  <span className="ml-2">Manage Server(s)</span>
                </div>

                <ScrollArea className="h-48 rounded-md border-r border-b border-secondary ">
                  {mutualManagerGuilds.map((guild: Guild) => (
                    <Link
                      key={guild.id}
                      className={clsx(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                        {
                          "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50":
                            pathname === `/event/server/${guild.id}`,
                        }
                      )}
                      href={`/event/server/${guild.id}`}
                    >
                      <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 bg-white">
                        <Image
                          src={guild.icon}
                          width={20}
                          height={20}
                          alt={guild.name}
                          className="rounded-lg"
                        />
                      </div>
                      {guild.name}
                    </Link>
                  ))}
                </ScrollArea>
              </div>
            )}
            
            {toAddGuilds.length > 0 && (
              <div>
                <Separator className="my-3" />
                <div className="flex gap-1 items-center py-2 px-3">
                  <SquarePlus className="h-5 w-5" />
                  <span className="ml-2">Add to Server(s)</span>
                </div>

                <ScrollArea className="h-48 rounded-md border-r border-b border-secondary ">
                  {toAddGuilds.map((guild: Guild) => (
                    <Link
                      key={guild.id}
                      className={clsx(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                        {
                          "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50":
                            pathname === `/event/server/${guild.id}`,
                        }
                      )}
                      href={`/event/server/${guild.id}`}
                    >
                      <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 bg-white">
                        <Image
                          src={guild.icon}
                          width={20}
                          height={20}
                          alt={guild.name}
                          className="rounded-lg"
                        />
                      </div>
                      {guild.name}
                    </Link>
                  ))}
                </ScrollArea>
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
