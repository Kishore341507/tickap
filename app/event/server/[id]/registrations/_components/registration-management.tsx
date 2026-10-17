"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Download } from "lucide-react";
import { RegistrationsList } from "./registrations-list";
import { AddRegistrationDialog } from "./add-registration-dialog";
import { AddUserToTeamDialog } from "./add-user-dialog";
import { RemoveUserDialog } from "./remove-user-dialog";
import { DeleteRegistrationDialog } from "./delete-registration-dialog";
import { ReplaceUserDialog } from "./replace-user-dialog";
import { ExportDataDialog } from "./export-data-dialog";
import { EditInputsDialog } from "./edit-inputs-dialog";
import { DisqualifyRegistrationDialog } from "./disqualify-registration-dialog";
import { TransferWarningDialog, PendingTransfer } from "./transfer-warning-dialog";
import { RegistrationUser , Registration , Event  } from "@/types";

interface RegistrationManagementProps {
  eventId: string;
  guildId: string;
  event: Event;
}

export function RegistrationManagement({ eventId, guildId, event }: RegistrationManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showAddRegistration, setShowAddRegistration] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showRemoveUser, setShowRemoveUser] = useState(false);
  const [showDeleteRegistration, setShowDeleteRegistration] = useState(false);
  const [showDisqualifyRegistration, setShowDisqualifyRegistration] = useState(false);
  const [showReplaceUser, setShowReplaceUser] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showEditInputs, setShowEditInputs] = useState(false);
  const [showTransferWarning, setShowTransferWarning] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [selectedUser, setSelectedUser] = useState<RegistrationUser | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>(
    event.registrations as unknown as Registration[]
  );

  const handleToggleDisqualify = (updatedRegistration: Registration) => {
    setRegistrations((prev) =>
      prev.map((reg) =>
        reg.id.toString() === updatedRegistration.id.toString() ? updatedRegistration : reg
      )
    );
    setShowDisqualifyRegistration(false);
  };

  const handleEditInputs = (updatedRegistration: Registration) => {
    setRegistrations((prev) =>
      prev.map((reg) =>
        reg.id.toString() === updatedRegistration.id.toString() ? updatedRegistration : reg
      )
    );
    setShowEditInputs(false);
  };

  const handleAddRegistration = (newRegistration: Registration) => {
    setRegistrations([...registrations, newRegistration]);
    setShowAddRegistration(false);
  };

  const handleAddUser = ( updatedRegistration: Registration) => {
    setRegistrations((prev) => prev.map((reg) => (reg.id.toString() === updatedRegistration.id.toString() ? updatedRegistration : reg)));
    setShowAddUser(false);
  };

  const handleRemoveUser = (updatedRegistration: Registration | null) => {
    if (updatedRegistration) {
      setRegistrations((prev) => prev.map((reg) => (reg.id.toString() === updatedRegistration.id.toString() ? updatedRegistration : reg)));
    } else {
      setRegistrations((prev) => prev.filter((reg) => reg.id.toString() !== selectedRegistration?.id.toString()));
    }
    setShowRemoveUser(false);
  };

  const handleReplaceUser = (updatedRegistration: Registration) => {
    setRegistrations((prev) => prev.map((reg) => (reg.id.toString() === updatedRegistration.id.toString() ? updatedRegistration : reg)));
    setShowReplaceUser(false);
  };

  const handleDeleteRegistration = () => {
    if (selectedRegistration) {
      setRegistrations(registrations.filter(reg => reg.id.toString() !== selectedRegistration.id.toString()));
      setSelectedRegistration(null);
      setShowDeleteRegistration(false);
    }
  };

  const executeTransfer = async (
    sourceRegistration: Registration,
    targetRegistration: Registration,
    user: RegistrationUser,
    confirmDisband: boolean = false
  ) => {
    try {
      const response = await fetch(`/api/events/${eventId}/register/manager`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "transfer",
          user_id: user.user_id.toString(),
          source_registration_id: sourceRegistration.id.toString(),
          target_registration_id: targetRegistration.id.toString(),
          confirm_disband_source: confirmDisband,
        }),
      });

      const data = await response.json();

      if (response.status === 409 && data.requires_confirmation) {
        setPendingTransfer({
          user,
          sourceRegistration,
          targetRegistration,
          message: data.message,
          isLastMember: sourceRegistration.registrationusers.length <= 1,
        });
        setShowTransferWarning(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to transfer player");
      }

      // Single transaction succeeded! Apply both team updates to state
      setRegistrations((prev) => {
        let updated = [...prev];
        if (data.source_disbanded || !data.source_registration) {
          updated = updated.filter((r) => r.id.toString() !== sourceRegistration.id.toString());
        } else {
          updated = updated.map((r) =>
            r.id.toString() === data.source_registration.id.toString()
              ? data.source_registration
              : r
          );
        }

        if (data.target_registration) {
          updated = updated.map((r) =>
            r.id.toString() === data.target_registration.id.toString()
              ? data.target_registration
              : r
          );
        }

        return updated;
      });

      toast({
        title: "Player Moved Successfully",
        description: `Moved ${user.user_name || "player"} from "${sourceRegistration.team_name || "Source"}" to "${targetRegistration.team_name || "Target"}".`,
      });

      setShowTransferWarning(false);
      setPendingTransfer(null);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.message || "Unable to transfer player. Transaction rolled back.",
        variant: "destructive",
      });
    }
  };

  const handleTransferUser = (
    sourceRegistration: Registration,
    targetRegistration: Registration,
    user: RegistrationUser
  ) => {
    const minTeamSize = event.min_team_player || 1;
    const isLastMember = sourceRegistration.registrationusers.length <= 1;
    const wouldViolateMin =
      minTeamSize &&
      sourceRegistration.registrationusers.length <= minTeamSize &&
      !event.allow_incomplete_teams;

    if (isLastMember || wouldViolateMin) {
      setPendingTransfer({
        user,
        sourceRegistration,
        targetRegistration,
        isLastMember,
      });
      setShowTransferWarning(true);
      return;
    }

    executeTransfer(sourceRegistration, targetRegistration, user, false);
  };

  const handleConfirmDisbandTransfer = async () => {
    if (!pendingTransfer) return;
    await executeTransfer(
      pendingTransfer.sourceRegistration,
      pendingTransfer.targetRegistration,
      pendingTransfer.user,
      true
    );
  };

  const [searchQuery, setSearchQuery] = useState("");

  const totalParticipants = registrations.reduce(
    (acc, reg) => acc + (reg.registrationusers?.length || 0),
    0
  );

  const disqualifiedCount = registrations.filter((r) => r.is_disqualified).length;

  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    if (query === "disqualified" || query === "dq") return Boolean(reg.is_disqualified);
    const teamMatch = reg.team_name?.toLowerCase().includes(query);
    const userMatch = reg.registrationusers?.some(
      (u) =>
        u.user_name?.toLowerCase().includes(query) ||
        u.user_id.toString().includes(query)
    );
    return teamMatch || userMatch;
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {event.is_solo ? "Participants" : "Teams Registered"}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {registrations.length}
            {event.max_teams && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                / {event.max_teams}
              </span>
            )}
            {disqualifiedCount > 0 && (
              <span className="text-xs font-normal text-destructive ml-2 font-mono">
                ({disqualifiedCount} DQ)
              </span>
            )}
          </p>
        </div>

        {!event.is_solo && (
          <div className="rounded-xl border border-border/50 bg-card/40 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total Players
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {totalParticipants}
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Format
          </p>
          <p className="text-base font-semibold text-foreground mt-1.5 flex items-center gap-1.5">
            {event.is_solo ? "Solo Competition" : "Team Tournament"}
          </p>
          {!event.is_solo && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {event.min_team_player || 1} - {event.max_team_player || "?"} players / team
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </p>
          <div className="mt-1.5">
            <Badge
              variant={
                event.status === "Open"
                  ? "secondary"
                  : event.status === "Live"
                  ? "destructive"
                  : "outline"
              }
              className="text-xs font-medium"
            >
              {event.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Roster Card */}
      <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Registered Roster
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Showing {filteredRegistrations.length} of {registrations.length} registrations
                {disqualifiedCount > 0 && ` (${disqualifiedCount} disqualified)`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                Export CSV / JSON
              </Button>
              <Button
                size="sm"
                className="h-9 text-xs"
                onClick={() => setShowAddRegistration(true)}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                New Registration
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="pt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by team name, player username, or Discord user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg text-xs bg-muted/30 border border-border/60 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <RegistrationsList
            registrations={filteredRegistrations}
            isSolo={!!event.is_solo}
            maxTeamSize={event.max_team_player ?? null}
            minTeamSize={event.min_team_player || 1}
            allowIncompleteTeams={event.allow_incomplete_teams}
            onTransferUser={handleTransferUser}
            onAddUser={(registration) => {
              setSelectedRegistration(registration);
              setShowAddUser(true);
            }}
            onRemoveUser={(registration, user) => {
              setSelectedRegistration(registration);
              setSelectedUser(user);
              setShowRemoveUser(true);
            }}
            onReplaceUser={(registration, user) => {
              setSelectedRegistration(registration);
              setSelectedUser(user);
              setShowReplaceUser(true);
            }}
            onDeleteRegistration={(registration) => {
              setSelectedRegistration(registration);
              setShowDeleteRegistration(true);
            }}
            onDisqualifyRegistration={(registration) => {
              setSelectedRegistration(registration);
              setShowDisqualifyRegistration(true);
            }}
            onEditInputs={(registration) => {
              setSelectedRegistration(registration);
              setShowEditInputs(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Dialogs for different actions */}
      <AddRegistrationDialog 
        open={showAddRegistration} 
        onClose={() => setShowAddRegistration(false)}
        onAdd={handleAddRegistration}
        eventId={eventId}
        guildId={guildId}
        isSolo={!!event.is_solo}
        minTeamSize={event.min_team_player || 1}
        maxTeamSize={event.max_team_player ?? null}
      />

      <AddUserToTeamDialog
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        onAdd={handleAddUser}
        eventId={eventId}
        guildId={guildId}
        registration={selectedRegistration}
        maxTeamSize={event.max_team_player ?? null}
      />

      <RemoveUserDialog
        open={showRemoveUser}
        onClose={() => setShowRemoveUser(false)}
        onRemove={handleRemoveUser}
        eventId={eventId}
        registration={selectedRegistration}
        user={selectedUser}
        minTeamSize={event.min_team_player || 1}
        allowIncompleteTeams={event.allow_incomplete_teams}
      />

      <DeleteRegistrationDialog
        open={showDeleteRegistration}
        onClose={() => setShowDeleteRegistration(false)}
        onDelete={handleDeleteRegistration}
        eventId={eventId}
        registration={selectedRegistration}
      />

      <DisqualifyRegistrationDialog
        open={showDisqualifyRegistration}
        onClose={() => setShowDisqualifyRegistration(false)}
        onUpdate={handleToggleDisqualify}
        eventId={eventId}
        registration={selectedRegistration}
      />

      <ReplaceUserDialog
        open={showReplaceUser}
        onClose={() => setShowReplaceUser(false)}
        onReplace={handleReplaceUser}
        eventId={eventId}
        guildId={guildId}
        registration={selectedRegistration}
        user={selectedUser}
      />

      <ExportDataDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        eventName={event.name}
        registrations={registrations}
      />

      <EditInputsDialog
        open={showEditInputs}
        onClose={() => setShowEditInputs(false)}
        onUpdate={handleEditInputs}
        eventId={eventId}
        registration={selectedRegistration}
      />

      <TransferWarningDialog
        open={showTransferWarning}
        onClose={() => {
          setShowTransferWarning(false);
          setPendingTransfer(null);
        }}
        onConfirm={handleConfirmDisbandTransfer}
        pendingTransfer={pendingTransfer}
        minTeamSize={event.min_team_player || 1}
      />
    </div>
  );
}