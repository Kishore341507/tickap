import { auth } from '@/auth';
import React from 'react'
import { redirect } from 'next/navigation';
import { env } from 'process';
import DiscordAuth2 from '../discord-auth';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthProvider from '@/app/auth/Provider';

interface Props {
    params: { id: string }
}

export default async function page({ params: { id } }: Props) {

    const session = await auth();
    if (!session) {
        redirect(`/api/auth/signin?callbackUrl=${env.NEXTAUTH_URL}/discordAuth/${id}`);
    }

    return (
        <div>
            <AuthProvider>
                <DiscordAuth2/>
            </AuthProvider>
        </div>

    )
}
