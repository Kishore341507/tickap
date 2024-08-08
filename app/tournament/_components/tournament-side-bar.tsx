"use client" ;

import { auth } from '@/auth';
import { Separator } from '@/components/ui/separator';
import clsx from 'clsx';
import { Banknote, Folder, HomeIcon, KeyRound, LogIn, LogOut, Server, Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

export default function TournamentSideBar() {

    const pathname = usePathname() ;
    // var [path , setPath] = useState({ default : [ {name : "Home" , path : '/tournament' } , { name : "Servers" , path : "/tournament/servers" } ] }) ;
    const { status , data: session } = useSession() ;

    return (
      <div className="lg:block hidden border-r h-full border-secondary">
        <div className="flex h-full max-h-screen flex-col gap-2 ">
          <div className="flex h-[55px] items-center justify-between border-b px-3 w-full border-secondary">
            <Link className="flex items-center gap-2 font-semibold ml-1" href="/">
              <span className="">TickAp : Tournaments</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2 ">
            <nav className="grid items-start px-4 text-sm font-medium">
              <Link
                className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50", {
                  "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50": pathname === "/tournament"
                })}
                href="/tournament"
              >
                <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                  <HomeIcon className="h-3 w-3" />
                </div>
                Home
              </Link>
              <Link
                className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50", {
                  "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50": pathname === "/tournament/server"
                })}
                href="/tournament/server"
              >
                <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                  <Server className="h-3 w-3" />
                </div>
                Servers
              </Link>
              <Separator className="my-3" />
            </nav>
          </div>
        </div>
      </div>
    )
}
