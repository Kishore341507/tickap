import React from "react";
import EventSideBar from "../event/_components/event-side-bar";
import EventTopNav from "../event/_components/event-top-nav";
import AuthProvider from "../auth/Provider";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TickAp - Forms",
  description: "Create and manage custom forms for your Discord server.",
  keywords: ["Forms", "Custom Forms", "Survey", "Data Collection", "Discord Forms"],
  creator: "Kamal Kisore",
};

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="grid min-h-screen w-full lg:grid-cols-[240px_1fr]">
        <EventSideBar></EventSideBar>

        <EventTopNav>
          <main className="flex flex-col gap-4 p-4 lg:gap-6">{children}</main>
        </EventTopNav>
      </div>
    </AuthProvider>
  );
}