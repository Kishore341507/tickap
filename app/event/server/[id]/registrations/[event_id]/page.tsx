import React from 'react'
import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { checkIsManager } from "@/lib/discord";
import { notFound, redirect } from "next/navigation";
import { RegistrationManagement } from "../_components/registration-management";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Event } from "@/types";

// export default async function EventRegistrationsPage({params }: { params: { id: string, event_id: string } }) {
export default async function EventRegistrationsPage( {params,}: {params: Promise<{ id: string, event_id: string }>} ) {
  const session = await auth();
  const { id, event_id } = await params;
  
  // Check if user is authenticated
  if (!session) {
    redirect("/api/auth/signin");
  }

  // Fetch event data with all registrations and users
  const event = await prisma.events.findUnique({
    where: { 
      id: BigInt(event_id),
    },
    include: {
      registrations: {
        include: {
          registrationusers: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Registration Management</h1>
      <div className="space-y-6">
        <Suspense fallback={
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <RegistrationManagement 
            eventId={event_id}
            guildId={id}
            event={event as unknown as Event}
          />
        </Suspense>
      </div>
    </div>
  );
}
