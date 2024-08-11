import React from "react";
import EventSideBar from "./_components/event-side-bar";
import EventTopNav from "./_components/event-top-nav";
import AuthProvider from "../auth/Provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function EventLayout({
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
