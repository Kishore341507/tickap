import React from "react";
import { ServerSignInButton } from "./server-sign-in-button";
import { ShieldAlert, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SignInCardProps {
  title?: string;
  description?: string;
  buttonText?: string;
  callbackUrl?: string;
  className?: string;
  variant?: "card" | "banner";
}

export function SignInCard({
  title = "Authentication Required",
  description = "Please sign in with your Discord account to access this page.",
  buttonText = "Sign in with Discord",
  callbackUrl,
  className,
  variant = "card",
}: SignInCardProps) {
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <ServerSignInButton
          text={buttonText}
          callbackUrl={callbackUrl}
          size="sm"
          className="shrink-0"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm max-w-xl mx-auto my-6",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <KeyRound className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      <ServerSignInButton
        text={buttonText}
        callbackUrl={callbackUrl}
        size="lg"
        className="w-full sm:w-auto px-6"
      />
    </div>
  );
}
