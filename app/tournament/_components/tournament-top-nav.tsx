import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Banknote,
  CircleUser,
  Folder,
  HomeIcon,
  KeyRound,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  Server,
  Settings,
  SunMoon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggleSub } from "@/components/ui/mode-toggle-sub";
import { env } from "process";
import { List } from "postcss/lib/list";

interface Guild {
  id: string;
  name: string;
  permissions: string;
  icon: string;
  manager: boolean;
  mutual: boolean;
}

export default async function TournamentTopNav({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const mutualManagerGuilds = [];
  const toAddGuilds = [];
  
  if (session) {
    const responce = await fetch( env.API_URL + "/discord/user/mutual-guild");
    if (responce.ok){
      const data : Guild[] = await responce.json();
      data.forEach((guild: Guild) => {
        if (guild.manager && guild.mutual) {
          mutualManagerGuilds.push(guild);
        }
        if (guild.manager && !guild.mutual) {
          toAddGuilds.push(guild);
        }
      });
    }
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-14 lg:h-[55px] items-center gap-4 border-b px-3 border-secondary">
        <Dialog>
          <SheetTrigger className="min-[1024px]:hidden p-2 transition">
            <Menu />
            <Link href="/tournament">
              <span className="sr-only">Home</span>
            </Link>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <Link className="flex m-auto" href="/">
                <Image src="/tickap_dark.svg" width={30} height={30} alt="Tickap : logo" />
                <SheetTitle>TickAp</SheetTitle>
              </Link>
            </SheetHeader>
            <div className="flex flex-col space-y-3 mt-[1rem]">
              <DialogClose asChild>
                <Link href="/tournament">
                  <Button variant="outline" className="w-full">
                    <HomeIcon className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/tournament/server">
                  <Button variant="outline" className="w-full">
                    <Server className="mr-2 h-4 w-4" />
                    Servers
                  </Button>
                </Link>
              </DialogClose>
              { mutualManagerGuilds.length > 0 && 
                <div>
                  <DialogClose asChild>
                    <Link href="/tournament/guild">
                      <Button variant="outline" className="w-full">
                        <Folder className="mr-2 h-4 w-4" />
                        Guilds
                      </Button>
                    </Link>
                  </DialogClose>
                </div>
              }

              <Separator className="my-3" />
            </div>
          </SheetContent>
        </Dialog>
        <div className="flex justify-center items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                {session ? (
                  <Image
                    src={session!.user?.image ?? ""}
                    className="w-8 h-8 rounded-full"
                    alt="profile"
                    width={32}
                    height={32}
                  />
                ) : (
                  <CircleUser className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {session ? `Hi, ${session?.user?.name}` : "Guest User!"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <SunMoon className="mr-2 h-4 w-4" />
                  <span>appearance</span>
                </DropdownMenuSubTrigger>
                <ModeToggleSub />
              </DropdownMenuSub>

              <DropdownMenuItem>
                <LifeBuoy className="mr-2 h-4 w-4" />
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href={ session ? "/api/auth/signout" : "/api/auth/signin"} className="flex" >
                  {session ? (
                    <LogOut className="mr-2 h-4 w-4" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  {session ? <span className="inline-span">Sign Out</span> : <span className="inline-span">Sign In</span>}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {children}
    </div>
  );
}
