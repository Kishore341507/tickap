'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import React, { use, useEffect, useState } from 'react'

export default function DiscordAuth2() {

    const { data } = useSession();
    const [ip , setIp] = useState("");
    const [oldId , setOldId] = useState("");


    useEffect(() => {
        if(data){
            fetch('https://api.ipify.org/?format=json')
            .then(response => response.json())
            .then(res => {
                setIp(res.ip);
                var oldEmail = '';
                if( typeof window !== 'undefined') {
                    const discord_email = localStorage.getItem('discord_email');
                    if( discord_email === null || discord_email === undefined || discord_email === "") {
                        localStorage.setItem('discord_email', data.user?.email || "");
                    } else if (discord_email !== data.user?.email) {
                        oldEmail = discord_email;
                    }
                }
                console.log(res.ip , oldEmail);

                fetch('/api/discord/user/verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ip: res.ip,
                        email: data.user?.email,
                        oldEmail: oldEmail
                    })
                }).then(res => res.json())
            })
        }
    },[data]);


    return (
        <div className="flex justify-center items-center min-h-screen">
            <Card className="w-[350px] border-green-500 ">
                <CardHeader>
                    <CardTitle>Thank you for verification</CardTitle>
                    <CardDescription>Now you can close the tab.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild>
                        <Link href='/api/auth/signout' >Log Out</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
