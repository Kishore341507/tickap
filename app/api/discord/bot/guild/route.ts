// Get discord bot guild

import { NextRequest, NextResponse } from "next/server";
import { env } from "process";

export async function GET( request : NextRequest ) {

    const responce : Response = await fetch(env.DISCORD_API_URL + '/users/@me/guilds' , {
        headers: {
            Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`
        } , next : {
            revalidate : 600
        }
    });
    return NextResponse.json(await responce.json() , { status : responce.status } );
}