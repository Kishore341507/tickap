import React from "react";
import EventSideBar from "./_components/event-side-bar";
import EventTopNav from "./_components/event-top-nav";
import AuthProvider from "../auth/Provider";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TickAp",
  description: "Tickap:Event was founded on July 1, 2023, with a clear mission - to make event hosting and management easy for everyone. Our platform is designed to simplify the process of creating, organizing, and managing events of all sizes, whether it&apos;s a small gathering or a large-scale conference." ,
  authors : [ {name : "Tickap Team" , url : "https://tickap.com/event/aboutus"} ],
  keywords: ["Tickap", "Event", "About Us", "Event Management", "Event Hosting", "Event Platform", "Event Registration", "Event Ticketing", "Event Communication", "Event Experience", "Event Enthusiasts", "Event Community", "Event Organizers", "Event Planners", "Event Hosts", "Event Participants", "Event Management Trends", "Event Management Technologies", "Event Management Features", "Event Management Tools", "Event Management Challenges", "Event Management Solutions", "Event Management Services", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform","Discord Bot","Bot Tutorial","Privacy Policy","Terms and Conditions","Contact Us","Cancellation & Refund Policy","Shipping & Delivery Policy"],
  creator : "Kamal Kisore",
};





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
