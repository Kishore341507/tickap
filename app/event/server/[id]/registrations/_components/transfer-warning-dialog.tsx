"use client";

import { useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, ArrowRight, Loader2, Users } from "lucide-react";
import { Registration, RegistrationUser } from "@/types";

export interface PendingTransfer {
  user: RegistrationUser;
  sourceRegistration: Registration;
  targetRegistration: Registration;
  message?: string;
  isLastMember?: boolean;
}

interface TransferWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  pendingTransfer: PendingTransfer | null;
  minTeamSize?: number | null;
}

export function TransferWarningDialog({
  open,
  onClose,
  onConfirm,
  pendingTransfer,
  minTeamSize,
}: TransferWarningDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!pendingTransfer) return null;

  const { user, sourceRegistration, targetRegistration, isLastMember } = pendingTransfer;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isLoading && !isOpen && onClose()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle className="text-foreground">
              Disband Source Team Warning
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-4 pt-1">
            {/* Player Transfer Summary Card */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 ring-1 ring-border/50">
                  <AvatarImage src={user.pfp || undefined} alt={user.user_name || "User"} />
                  <AvatarFallback className="text-xs">
                    {user.user_name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user.user_name || "Player"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    ID: {user.user_id.toString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/40 gap-2">
                <span className="font-medium text-muted-foreground truncate">
                  {sourceRegistration.team_name || "Source Team"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground truncate">
                  {targetRegistration.team_name || "Target Team"}
                </span>
              </div>
            </div>

            {/* Alert Box */}
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold uppercase tracking-wider">
                {isLastMember ? "Team will be deleted" : "Below Minimum Team Size"}
              </AlertTitle>
              <AlertDescription className="text-xs mt-1 leading-relaxed">
                {isLastMember ? (
                  <>
                    <strong>{user.user_name || "This player"}</strong> is the only member in{" "}
                    <strong>{sourceRegistration.team_name || "this team"}</strong>. Moving them will disband and permanently delete the team registration.
                  </>
                ) : (
                  <>
                    Moving this player will leave <strong>{sourceRegistration.team_name || "this team"}</strong> with fewer than the required {minTeamSize || 2} players.
                    The team will be disbanded and removed from the tournament.
                  </>
                )}
              </AlertDescription>
            </Alert>

            <p className="text-xs text-muted-foreground">
              Are you sure you want to proceed with this transfer? All remaining team slots for the source team will be removed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex sm:justify-end gap-2 pt-2">
          <AlertDialogCancel disabled={isLoading} onClick={onClose} className="text-xs h-9">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="text-xs h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Transferring...
              </>
            ) : (
              "Confirm & Disband Team"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
