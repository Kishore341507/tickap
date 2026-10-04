import React, { Suspense } from 'react';
import Link from 'next/link';
import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { checkIsManager, getGuild } from "@/lib/discord";
import { notFound, redirect } from "next/navigation";
import { LogsManagement } from "../_components/logs-management";
import { Loader2, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function EventLogsPage({
  params,
}: {
  params: Promise<{ id: string; event_id: string }>;
}) {
  const session = await auth();
  const { id, event_id } = await params;

  // Check if user is authenticated
  if (!session) {
    redirect("/api/auth/signin");
  }

  // Fetch event data
  const event = await prisma.events.findUnique({
    where: {
      id: BigInt(event_id),
    },
  });

  if (!event) {
    notFound();
  }

  // Fetch event logs
  const logs = await prisma.eventLog.findMany({
    where: {
      event_id: BigInt(event_id),
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // Check if the user is a manager for this guild
  let isManager = false;
  if (session?.user?.userId && event.guild_id) {
    const userId = session.user.userId;
    const guildId = event.guild_id.toString();
    isManager = await checkIsManager(userId, guildId);
  }

  // If not a manager, redirect to event page
  if (!isManager) {
    redirect(`/event/${event_id}`);
  }

  // Fetch Discord guild info for breadcrumbs & branding
  let guildInfo = null;
  try {
    guildInfo = await getGuild(id);
  } catch (e) {
    console.error("Failed to fetch guild info:", e);
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground flex-wrap">
        <Link
          href="/event"
          className="hover:text-foreground transition-colors inline-flex items-center gap-1 group"
        >
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Events</span>
        </Link>
        <ChevronRight className="h-3 w-3 opacity-40" />
        <Link
          href={`/event/server/${id}`}
          className="hover:text-foreground transition-colors truncate max-w-[160px]"
        >
          {guildInfo?.name || "Server"}
        </Link>
        <ChevronRight className="h-3 w-3 opacity-40" />
        <Link
          href={`/event/${event_id}`}
          className="hover:text-foreground transition-colors truncate max-w-[180px]"
        >
          {event.name}
        </Link>
        <ChevronRight className="h-3 w-3 opacity-40" />
        <span className="text-foreground font-semibold">Audit Logs</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Event Audit Logs
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              <Shield className="h-3 w-3 mr-1 text-primary/80" />
              Manager View
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            View immutable audit history, user actions, status changes, and registration modifications for{" "}
            <span className="text-foreground font-medium">{event.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/event/${event_id}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        <Suspense
          fallback={
            <div className="flex flex-col justify-center items-center h-48 border border-border/50 rounded-2xl bg-card/30">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Loading activity logs...</p>
            </div>
          }
        >
          <LogsManagement
            eventId={event_id}
            guildId={id}
            event={event as any}
            logs={logs as any}
          />
        </Suspense>
      </div>
    </div>
  );
}