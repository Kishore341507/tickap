"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Button, ButtonProps } from "@/components/ui/button";
import { DiscordIcon } from "./discord-icon";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClientSignInButtonProps extends ButtonProps {
  provider?: string;
  callbackUrl?: string;
  text?: string;
  showIcon?: boolean;
}

export function ClientSignInButton({
  provider = "discord",
  callbackUrl,
  text = "Sign in with Discord",
  showIcon = true,
  className,
  variant = "default",
  size = "default",
  children,
  onClick,
  disabled,
  ...props
}: ClientSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (e.defaultPrevented) return;

    try {
      setIsLoading(true);
      await signIn(provider, callbackUrl ? { callbackUrl } : undefined);
    } catch (error) {
      console.error("Sign in failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("gap-2 font-medium", className)}
      disabled={disabled || isLoading}
      onClick={handleSignIn}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <DiscordIcon className="h-4 w-4" />
      ) : null}
      {children ?? <span>{isLoading ? "Signing in..." : text}</span>}
    </Button>
  );
}
