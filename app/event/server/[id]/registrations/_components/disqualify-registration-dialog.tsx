"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Ban, CheckCircle2, ShieldAlert } from "lucide-react";
import { Registration } from "@/types";

interface DisqualifyRegistrationDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (updatedRegistration: Registration) => void;
  eventId: string;
  registration: Registration | null;
}

export function DisqualifyRegistrationDialog({
  open,
  onClose,
  onUpdate,
  eventId,
  registration,
}: DisqualifyRegistrationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (!registration) return null;

  const isDq = Boolean(registration.is_disqualified);
  const actionText = isDq ? "re-qualify" : "disqualify";
  const actionTitle = isDq ? "Re-qualify Registration" : "Disqualify Registration";

  const handleToggleDisqualify = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const response = await fetch(`/api/events/${eventId}/register/manager`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "disqualify",
          registration_id: registration.id.toString(),
          is_disqualified: !isDq,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${actionText} registration`);
      }

      const data = await response.json();

      toast({
        title: isDq ? "Registration Re-qualified" : "Registration Disqualified",
        description: isDq
          ? `Team "${registration.team_name || "Team"}" has been restored to active status.`
          : `Team "${registration.team_name || "Team"}" has been marked as disqualified.`,
      });

      if (data.registration) {
        onUpdate(data.registration);
      }
      router.refresh();
      onClose();
    } catch (error: any) {
      toast({
        title: `Failed to ${actionText} registration`,
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isDq
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {isDq ? <CheckCircle2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
            </div>
            <div>
              <AlertDialogTitle className="text-base font-semibold">
                {actionTitle}
              </AlertDialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isDq ? "Restore team participation" : "Temporarily disqualify team"}
              </p>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription asChild>
          <div className="space-y-3.5 text-xs text-foreground/80 pt-1">
            <p>
              Are you sure you want to <strong>{actionText}</strong> team{" "}
              <strong className="text-foreground">{registration.team_name || "Unnamed Team"}</strong>?
            </p>

            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2">
              <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                Affected Members ({registration.registrationusers?.length || 0})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {registration.registrationusers?.map((u) => (
                  <Badge
                    key={u.user_id.toString()}
                    variant="secondary"
                    className="gap-1.5 py-1 px-2 text-xs font-normal"
                  >
                    <Avatar className="h-3.5 w-3.5">
                      <AvatarImage src={u.pfp || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {(u.user_name || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{u.user_name || u.user_id.toString()}</span>
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {isDq
                ? "This will restore the team to the active leaderboard and re-grant any tournament Discord roles."
                : "This will revoke tournament Discord roles and mark the team as disqualified on the roster and bracket."}
            </p>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
          <AlertDialogCancel disabled={isLoading} className="text-xs h-9">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggleDisqualify}
            disabled={isLoading}
            className={`text-xs h-9 gap-1.5 ${
              isDq
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isDq ? "Confirm Re-qualify" : "Confirm Disqualify"}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
