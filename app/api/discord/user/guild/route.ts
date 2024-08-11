import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { env } from "process";

export async function GET( request : NextRequest ) {
    const session = await auth() ;
    console.log(session);
    if (!session) {
        return NextResponse.json({ "Error" : "Unauthorized" } , { status : 401 } );
    }

    const botGuildsResponce : Response = await fetch(env.DISCORD_API_URL + '/users/@me/guilds' , {
        headers: {
            Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`
        } , next : {
            revalidate : 600
        }
    });
    const botGuilds = await botGuildsResponce.json();

    const accessToken = (await prisma.account.findFirst({ where : { userId : (await auth())?.user?.id } }))?.access_token
    const userGuildsResponce : Response = await fetch(env.DISCORD_API_URL + '/users/@me/guilds' , {
        headers: {
            Authorization: `Bearer ${accessToken}`
        } , next : {
            revalidate : 600
        }
    });
    const userGuilds = await userGuildsResponce.json();
    userGuilds.forEach((guild : any) => {
        guild.icon = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
        guild.manager = (BigInt(guild.permissions) & BigInt(0x20)) !== BigInt(0);
        guild.mutual = (botGuilds.some((botGuild : any) => botGuild.id === guild.id));
    });

    return NextResponse.json(userGuilds);
}