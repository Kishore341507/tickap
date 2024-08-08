import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"


export const authOptions = {
    providers: [
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
        })
    ]
}


export const { handlers, signIn, signOut, auth } = NextAuth(authOptions)