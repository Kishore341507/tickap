import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TickAp",
  description: "Tickap:Event was founded on July 1, 2023, with a clear mission - to make event hosting and management easy for everyone. Our platform is designed to simplify the process of creating, organizing, and managing events of all sizes, whether it&apos;s a small gathering or a large-scale conference." ,
  authors : [ {name : "Tickap Team" , url : "https://tickap.com/event/aboutus"} ],
  keywords: ["Tickap", "Event", "About Us", "Event Management", "Event Hosting", "Event Platform", "Event Registration", "Event Ticketing", "Event Communication", "Event Experience", "Event Enthusiasts", "Event Community", "Event Organizers", "Event Planners", "Event Hosts", "Event Participants", "Event Management Trends", "Event Management Technologies", "Event Management Features", "Event Management Tools", "Event Management Challenges", "Event Management Solutions", "Event Management Services", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform", "Event Management System", "Event Management Company", "Event Management Website", "Event Management App", "Event Management Program", "Event Management Application", "Event Management Tool", "Event Management Solution", "Event Management Service", "Event Management Software", "Event Management Platform","Discord Bot","Bot Tutorial","Privacy Policy","Terms and Conditions","Contact Us","Cancellation & Refund Policy","Shipping & Delivery Policy"],
  creator : "Kamal Kisore",

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
