import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import React from "react";

export default function AboutUs() {
  return (
    <div>
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        About Us
      </h1>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Tickap was founded on July 1, 2023, with a clear mission - to make event
        hosting and management easy for everyone. Our platform is designed to
        simplify the process of creating, organizing, and managing events of all
        sizes, whether it&apos;s a small gathering or a large-scale conference.
      </p>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        We understand the challenges event organizers face, and our goal is to
        provide a user-friendly, feature-rich platform that caters to the needs
        of event planners, hosts, and participants alike. With Tickap, you can
        streamline event registration, ticketing, communication, and more,
        ensuring a smooth and successful event experience for all involved.
      </p>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Our team is dedicated to continuously improving and expanding Tickap&apos;s
        features to stay up-to-date with the latest event management trends and
        technologies. We are committed to fostering a vibrant community of event
        enthusiasts and providing them with the tools they need to create
        unforgettable events.
      </p>

      <ul className="my-6 ml-6 list-disc [&>li]:mt-0 ">
        <li><Link className="text-blue-400 " href="https://youtu.be/jystuvCajyI"> Bot Tutorial </Link></li>
        <li><Link className="text-blue-400 " href="/tournament/privacy-policy" > Privacy Policy </Link></li>
        <li><Link className="text-blue-400 " href="/tournament/terms-and-conditions" > Terms and Conditions </Link></li>
        <li><Link className="text-blue-400 " href="/tournament/contact-us" > Contact Us </Link></li>
        <li><Link className="text-blue-400 " href="https://merchant.razorpay.com/policy/MJ3012NomSaIan/refund" > Cancellation & Refund Policy </Link></li>
        <li><Link className="text-blue-400 " href="https://merchant.razorpay.com/policy/MJ3012NomSaIan/shipping" > Shipping & Delivery Policy </Link></li>
      </ul>

      <Separator className="my-5"></Separator>
      <p className="text-sm text-muted-foreground text-center">
        &copy; 2023 Tickap. All rights reserved.
      </p>
    </div>
  );
}
