"use server";

import { signIn, signOut } from "@/auth";

export async function serverSignIn(provider = "discord", redirectTo?: string) {
  await signIn(provider, redirectTo ? { redirectTo } : undefined);
}

export async function serverSignOut() {
  await signOut();
}
