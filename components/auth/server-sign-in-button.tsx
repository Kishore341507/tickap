import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { DiscordIcon } from "./discord-icon";
import { serverSignIn } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export interface ServerSignInButtonProps extends Omit<ButtonProps, "onClick"> {
  provider?: string;
  callbackUrl?: string;
  text?: string;
  showIcon?: boolean;
}

export function ServerSignInButton({
  provider = "discord",
  callbackUrl,
  text = "Sign in with Discord",
  showIcon = true,
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ServerSignInButtonProps) {
  const handleAction = serverSignIn.bind(null, provider, callbackUrl);

  return (
    <form action={handleAction} className="inline-block">
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={cn("gap-2 font-medium", className)}
        {...props}
      >
        {showIcon && <DiscordIcon className="h-4 w-4" />}
        {children ?? <span>{text}</span>}
      </Button>
    </form>
  );
}
