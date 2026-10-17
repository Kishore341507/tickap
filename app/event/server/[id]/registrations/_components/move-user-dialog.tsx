"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRightLeft, Check, Users } from "lucide-react";
import { Registration, RegistrationUser } from "@/types";

interface MoveUserToTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onMove: (
    sourceRegistration: Registration,
    targetRegistration: Registration,
    user: RegistrationUser
  ) => void;
  sourceRegistration: Registration | null;
  user: RegistrationUser | null;
  registrations: Registration[];
  maxTeamSize?: number | null;
}

export function MoveUserToTeamDialog({
  open,
  onClose,
  onMove,
  sourceRegistration,
  user,
  registrations,
  maxTeamSize,
}: MoveUserToTeamDialogProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  if (!sourceRegistration || !user) return null;

  // Filter out the source team
  const availableTeams = registrations.filter(
    (reg) => reg.id.toString() !== sourceRegistration.id.toString()
  );

  const handleSelect = (targetId: string) => {
    setSelectedTargetId(targetId);
  };

  const handleConfirmMove = () => {
    if (!selectedTargetId) return;
    const target = availableTeams.find((r) => r.id.toString() === selectedTargetId);
    if (!target) return;

    onMove(sourceRegistration, target, user);
    onClose();
    setSelectedTargetId("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ArrowRightLeft className="h-5 w-5" />
            <DialogTitle>Move Player to Another Team</DialogTitle>
          </div>
          <DialogDescription>
            Select a destination team to transfer{" "}
            <strong>{user.user_name || "this player"}</strong> from{" "}
            <strong>{sourceRegistration.team_name || "Current Team"}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Player preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 my-2">
          <Avatar className="h-9 w-9 ring-1 ring-border/50">
            <AvatarImage src={user.pfp || undefined} alt={user.user_name || "User"} />
            <AvatarFallback className="text-xs">
              {user.user_name?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">
              {user.user_name || "Unknown Player"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              From: {sourceRegistration.team_name || "Current Team"}
            </p>
          </div>
        </div>

        {/* Target Teams List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Available Teams ({availableTeams.length})
          </p>

          {availableTeams.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No other teams available to move to.
            </p>
          ) : (
            availableTeams.map((team, idx) => {
              const currentPlayersCount = team.registrationusers?.length || 0;
              const isFull = maxTeamSize ? currentPlayersCount >= maxTeamSize : false;
              const isSelected = selectedTargetId === team.id.toString();

              return (
                <div
                  key={team.id.toString()}
                  onClick={() => !isFull && handleSelect(team.id.toString())}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isFull
                      ? "opacity-50 border-border/40 bg-muted/10 cursor-not-allowed"
                      : isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary cursor-pointer"
                      : "border-border/60 hover:border-primary/50 hover:bg-card/90 cursor-pointer"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {team.team_name || `Team #${team.local_id ?? idx + 1}`}
                      </p>
                      {team.is_disqualified && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                          DQ
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {currentPlayersCount} {currentPlayersCount === 1 ? "player" : "players"}
                      {maxTeamSize ? ` / ${maxTeamSize} max` : ""}
                    </p>
                  </div>

                  <div className="shrink-0 ml-3">
                    {isFull ? (
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                        Full
                      </Badge>
                    ) : isSelected ? (
                      <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-border/80" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmMove}
            disabled={!selectedTargetId}
          >
            Move Player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
