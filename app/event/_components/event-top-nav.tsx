import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CircleUser,
  FileText,
  KeyRound,
  LifeBuoy,
  LogOut,
  Menu,
  Server,
  Settings,
  SunMoon,
  Calendar,
  ShieldCheck,
  Info,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggleSub } from "@/components/ui/mode-toggle-sub";
import { revalidatePath } from "next/cache";

export default async function EventTopNav({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
        {/* Mobile Nav Trigger & Brand */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="Open mobile menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b border-border/40 text-left">
                <Link className="flex items-center gap-2.5" href="/event">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 p-1">
                    <Image
                      src="/tickap_dark.svg"
                      width={22}
                      height={22}
                      alt="Tickap Logo"
                      className="dark:block hidden"
                    />
                    <Image
                      src="/tickap_light.svg"
                      width={22}
                      height={22}
                      alt="Tickap Logo"
                      className="dark:hidden block"
                    />
                  </div>
                  <SheetTitle className="font-bold text-base tracking-tight">TickAp</SheetTitle>
                </Link>
              </SheetHeader>

              {/* Mobile Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase mb-2">
                    Discover
                  </p>
                  <SheetClose asChild>
                    <Link
                      href="/event"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Browse Events
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/event/server"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Server className="h-4 w-4 text-muted-foreground" />
                      Servers
                    </Link>
                  </SheetClose>
                </div>

                {session && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase mb-2">
                      Organizer
                    </p>
                    <SheetClose asChild>
                      <Link
                        href="/event/forms"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Forms & Applications
                      </Link>
                    </SheetClose>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase mb-2">
                    About
                  </p>
                  <SheetClose asChild>
                    <Link
                      href="/event/aboutus"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                      About TickAp
                    </Link>
                  </SheetClose>
                </div>
              </div>

              {/* Mobile Auth Button */}
              <div className="p-4 border-t border-border/40">
                {session ? (
                  <form
                    action={async () => {
                      "use server";
                      await signOut();
                      revalidatePath("/");
                    }}
                  >
                    <Button variant="outline" className="w-full justify-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </form>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await signIn("discord");
                      revalidatePath("/");
                    }}
                  >
                    <Button variant="outline" className="w-full justify-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      Sign In
                    </Button>
                  </form>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Right Action Deck */}
        <div className="flex items-center gap-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full ring-1 ring-border/50 hover:ring-border transition-all"
                aria-label="User menu"
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    className="h-8 w-8 rounded-full object-cover"
                    alt={session.user.name || "profile"}
                    width={32}
                    height={32}
                  />
                ) : (
                  <CircleUser className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg border border-border/60">
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {session ? (session.user?.name || "Attendee") : "Guest User!"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session ? (session.user?.email || "Connected via Discord") : "Not signed in"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />

              {session && (
                <DropdownMenuItem asChild>
                  <Link href="/event/server" className="cursor-pointer">
                    <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>My Servers</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <SunMoon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <ModeToggleSub />
              </DropdownMenuSub>

              <DropdownMenuItem asChild>
                <a
                  href="https://discord.gg/pkVxQU2ae9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  <LifeBuoy className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Discord Support</span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              {session ? (
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={async () => {
                    "use server";
                    await signOut();
                    revalidatePath("/");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={async () => {
                    "use server";
                    await signIn("discord");
                    revalidatePath("/");
                  }}
                >
                  <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Sign In</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}