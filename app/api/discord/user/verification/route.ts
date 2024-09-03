import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { env, send } from "process";

export async function POST( request : NextRequest ) {
    const session = await auth() ;
    if (!session) {
        return NextResponse.json({ "Error" : "Unauthorized" } , { status : 401 } );
    }

    // Get the user's account
    const account = (await prisma.account.findFirst({ where : { userId : (await auth())?.user?.id } }));
    const accessToken = account?.access_token;
    const userId = account?.providerAccountId;

    // Fetch the user's guilds
    const userGuildsResponce : Response = await fetch(env.DISCORD_API_URL + '/users/@me/guilds?with_counts=true' , {
        headers: {
            Authorization: `Bearer ${accessToken}`
        } , next : {
            revalidate : 600
        }
    });
    const userGuilds = await userGuildsResponce.json();
    var guilds = userGuilds.map((guild: any) => `${guild.name}`).join("\n");
    if(guilds.length > 900) {
        guilds = guilds.substring(0, 900);
    }

    //Data come from request
    const { ip , oldEmail } = await request.json();

    const fields =  [
        { name : "IP" , value : ip , inline : true } ,
        { name : "Email" , value : session.user?.email , inline : true } ,
        { name : "Old Email" , value : oldEmail != '' ? `🔴 ${oldEmail}` : '' , inline : true } ,
        { name : "Server" , value: guilds , inline : false } 
    ]

    const ipData = await prisma.discordauth.findFirst({ where : { AND : [ {ip : ip} , {NOT : { id : userId } } ] } });
    if(ipData) {
        fields.push({ name : "IP Exist" , value : `🔴 ${ipData.id}` , inline : true });
    }

    var sendMessage = false;
    var user = await prisma.discordauth.findFirst({ where : { id : userId } });
    if(!user) {
       user = await prisma.discordauth.create({ data : { id : userId! , ip : ip } });
       sendMessage = true;
    } else {
        sendMessage = (new Date().getTime() - user.updatedAt.getTime()) > 600000;
        await prisma.discordauth.update({ where : { id : userId } , data : { ip : ip } });
    }

    if(sendMessage) {
        await fetch(env.DISCORD_API_URL + '/channels/1280129639745978379/messages' , {
            method: 'POST',
            headers: {
                Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            } , next : {
                revalidate : 600
            } , body : JSON.stringify({ content : `<@${userId}> , ${userId}` ,
                embeds : [{
                    title : session.user?.name , color : 0x2b2b31 , fields :fields , footer : {
                        text : "From TickAp"
                    }
                }]
            })
        });
    }
    
    return NextResponse.json({'message' : 'User guilds fetched'});
}