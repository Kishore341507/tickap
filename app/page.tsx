"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Code,
  MessageSquare,
  Calendar,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Globe,
  Send
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] bg-background px-4">
      <div className="max-w-7xl w-full flex flex-col items-center justify-center gap-12">
        {/* Logo and Name */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20 sm:w-28 sm:h-28">
            <Image 
              src="/tickap_dark.svg" 
              alt="TickAp Logo" 
              fill
              className="dark:block hidden"
              priority
            />
            <Image 
              src="/tickap_light.svg" 
              alt="TickAp Logo" 
              fill
              className="dark:hidden block"
              priority
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-center">TickAp</h1>
          <p className="text-muted-foreground text-center max-w-md">Your comprehensive ticketing and event management solution</p>
        </div>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Events Card */}
          <Link href="/event" className="group">
            <Card className="transition-all duration-300 hover:shadow-lg h-full">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3 mb-2">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-center">Events</h2>
                <p className="text-muted-foreground text-center">Discover and manage upcoming events</p>
                <Button variant="outline" className="mt-auto group-hover:bg-primary group-hover:text-primary-foreground">
                  Explore Events <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
          
          {/* Services Card */}
          <Link href="/services" className="group">
            <Card className="transition-all duration-300 hover:shadow-lg h-full">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3 mb-2">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-center">Services</h2>
                <p className="text-muted-foreground text-center">Explore our comprehensive service offerings</p>
                <Button variant="outline" className="mt-auto group-hover:bg-primary group-hover:text-primary-foreground">
                  View Services <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}