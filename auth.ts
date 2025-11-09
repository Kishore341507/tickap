import NextAuth, { DefaultSession } from "next-auth"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./prisma/db"

// Extend the Session type to include userId
declare module "next-auth" {
    interface Session {
        user: {
            userId?: string;
        } & DefaultSession["user"];
    }
}


async function refreshAccessToken(token: any) {
    try {
        const response = await fetch("https://discord.com/api/v10/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID!,
                client_secret: process.env.DISCORD_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            }),
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        // Update the token in the database
        await prisma.account.updateMany({
            where: {
                userId: token.userId,
                provider: "discord"
            },
            data: {
                access_token: refreshedTokens.access_token,
                expires_at: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
                refresh_token: refreshedTokens.refresh_token ?? token.refreshToken,
            },
        });

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
    } catch (error) {
        console.error("Error refreshing access token:", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "identify guilds email guilds.join",
                    prompt: "consent",
                    access_type: "offline"
                }
            },
            token: {
                url: "https://discord.com/api/oauth2/token",
            }
        })
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            // Initial sign in
            if (account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
                    userId: user.id,
                };
            }

            // Return previous token if the access token has not expired yet
            if (Date.now() < (token.accessTokenExpires as number)) {
                return token;
            }

            // Access token has expired, try to refresh it
            return refreshAccessToken(token);
        },
        session: async ({ session, user, token }) => {
            // Get the account from the database
            const account = await prisma.account.findFirst({
                where: { userId: user.id }
            });
            
            if (account && session.user) {
                // Replace the user.id with the providerId (providerAccountId)
                session.user.userId = account.providerAccountId;
            }
            
            return session;
        }
    }
})