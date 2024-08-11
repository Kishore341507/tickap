import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardImage, CardTitle } from "@/components/ui/card";
import prisma from "@/prisma/db";
import Image from "next/image";
import { env } from "process";

interface Guild {
  id: string;
  name: string;
  permissions: string;
  icon: string;
}

export default async function Tournaments() {

  const response = await fetch( env.API_URL  +"/discord/user/guild" );
  if (response.ok) {
    var guilds : Guild[] = await response.json();
  } else {
    guilds = [];
  }

  return (
  <>
    <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-3 " >
      {guilds.map((guild: Guild) => (
        <Card key={guild.id}>
          <CardImage src={guild.icon} alt={guild.name} /> 
          <CardHeader>
            <CardTitle>{guild.name}</CardTitle>
            <CardDescription>{guild.permissions}</CardDescription>
          </CardHeader>
          <CardContent>
            This is A Tournament
          </CardContent>
        </Card>
      ))}
    </div>
    </>
  );
}