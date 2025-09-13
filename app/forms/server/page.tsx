import prisma from '@/prisma/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Guild } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

async function fetchGuildName(guildId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/discord/bot/guild?guild_id=${guildId}`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      return `Server ${guildId}`;
    }
    const guild = await response.json();
    return guild.name || `Server ${guildId}`;
  } catch (error) {
    console.error('Error fetching guild name:', error);
    return `Server ${guildId}`;
  }
}

export default async function ServerForms() {
  
  // Get all unique guild_ids that have forms
  const formsWithGuilds = await prisma.forms.findMany({
    where: { 
      is_deleted: false,
      guild_id: { not: null }
    },
    select: {
      guild_id: true
    },
    distinct: ['guild_id']
  });

  const guildIds = formsWithGuilds.map(f => f.guild_id?.toString()).filter(Boolean);
  
  // Get guild names for each guild_id
  const guildsWithNames = await Promise.all(
    guildIds.map(async (guildId) => ({
      id: guildId,
      name: await fetchGuildName(guildId!)
    }))
  );

  return (
    <>
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Server Forms
      </h4>
      
      {guildsWithNames.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No server forms found.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
          {guildsWithNames.map((guild) => (
            <Link key={guild.id} href={`/forms/server/${guild.id}`}>
              <Card className="cursor-pointer transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 bg-white p-1">
                      <Image
                        src="/tickap_dark.svg"
                        width={20}
                        height={20}
                        alt={guild.name}
                        className="rounded-lg"
                      />
                    </div>
                    {guild.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    View and manage forms for this server
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}