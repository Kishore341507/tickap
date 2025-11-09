import { auth } from '@/auth';
import prisma from '@/prisma/db';
import { env } from 'process';
import React from 'react'
import GuildCard from '../_components/guild-card';
import Link from 'next/link';
import { botInviteUrl, getValidAccessToken } from '@/lib/discord';
import { Guild } from '@/types';

export default async function Servers() {

  const managableGuilds: Guild[] = [] ;
  const toAddGuilds: Guild[] = [] ;
  const session = await auth() ;

  const botGuildsResponce: Response = await fetch(env.DISCORD_API_URL + '/users/@me/guilds?with_counts=true', {
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`
    }, next: {
      revalidate: 600
    }
  });
  var botGuilds : Guild[] = await botGuildsResponce.json();
  // console.log(botGuilds);

  if( botGuilds && botGuilds.length != 0 ){
    botGuilds.forEach((guild: Guild) => {
      guild.icon = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0'
    });
  }
  
  if( session && session.user.id ){
    // Get a valid (refreshed if needed) access token
    const accessToken = await getValidAccessToken(session.user.id);
    
    if (!accessToken) {
      console.error("Failed to get valid access token");
      // Return early with error message
      return (
        <div>
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Authentication Error
          </h2>
          <p className="mt-4">Please try signing out and signing in again.</p>
        </div>
      );
    }

    const userGuildsResponce: Response = await fetch(env.DISCORD_API_URL + '/users/@me/guilds?with_counts=true', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }, next: {
        revalidate: 600
      }
    });

    const userGuilds = await userGuildsResponce.json() || [] ;

    // console.log(userGuilds);

    if( userGuilds && Array.isArray(userGuilds) && userGuilds.length !== 0 ){
      userGuilds.forEach((guild: any) => {
        guild.icon = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
        guild.manager = (BigInt(guild.permissions) & BigInt(0x20)) !== BigInt(0);
        guild.mutual = (botGuilds.some((botGuild: any) => botGuild.id === guild.id));
  
        if( guild.manager && guild.mutual ){
          managableGuilds.push(guild);
          botGuilds = botGuilds.filter((botGuild : any) => botGuild.id !== guild.id);
        } else if( guild.manager && !guild.mutual ){
          toAddGuilds.push(guild);
          botGuilds = botGuilds.filter((botGuild : any) => botGuild.id !== guild.id);
        }
      });
    }

  }

  const canJoinGuilds = botGuilds ;
  canJoinGuilds.sort((a: any, b: any) => b.approximate_member_count - a.approximate_member_count);
  managableGuilds.sort((a: any, b: any) => b.approximate_member_count - a.approximate_member_count);
  toAddGuilds.sort((a: any, b: any) => b.approximate_member_count - a.approximate_member_count);

  return (
    <div>
      { managableGuilds.length > 0 && <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">Manage Server</h2> }
      { managableGuilds.length > 0 &&
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8 my-4 mx-3">
          {managableGuilds.map((guild: Guild) => (
            <Link href={`/event/server/${guild.id}`} key={guild.id}  >
              <GuildCard guild={guild} />
            </Link>
          ))}
        </div>
      }

      { toAddGuilds.length > 0 && <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">Add to Server&apos;s</h2> }
      { toAddGuilds.length > 0 &&
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8 my-4 mx-3">
          {toAddGuilds.map((guild: Guild) => (
            // <Link href={`/event/server/${guild.id}`} key={guild.id}  >
            <Link href={botInviteUrl} key={guild.id} target='_blank' >
              <GuildCard guild={guild} />
            </Link>
          ))}
        </div>
      }

      { canJoinGuilds.length > 0 && <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">We Are In</h2> }
      { canJoinGuilds.length > 0 &&
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8 my-4 mx-3">
          {canJoinGuilds.map((guild: Guild) => (
            <Link href={`/event/server/${guild.id}`} key={guild.id}  >
              <GuildCard guild={guild} />
            </Link>
          ))}
        </div>
      }

    </div>
  )
}
