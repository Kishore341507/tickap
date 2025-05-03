"use client";

import { useState } from "react";
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

interface RegistrationUser {
  user_id: bigint;
  registration_id: bigint;
  event_id: bigint;
  user_name: string | null;
  pfp: string | null;
}

interface Registration {
  id: bigint;
  event_id: bigint;
  team_name: string | null;
  registrationusers: RegistrationUser[];
}

interface Event {
  id: bigint;
  name: string;
  is_solo: boolean | null;
  max_teams: number | null;
  min_team_player: number | null;
  max_team_player: number | null;
  registrations: Registration[];
  guild_id: bigint | null;
}

interface RegistrationManagementProps {
  eventId: string;
  guildId: string;
  event: Event;
}

export function RegistrationManagement({ eventId, guildId, event }: RegistrationManagementProps) {
  const [showAddRegistration, setShowAddRegistration] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showRemoveUser, setShowRemoveUser] = useState(false);
  const [showDeleteRegistration, setShowDeleteRegistration] = useState(false);
  const [showReplaceUser, setShowReplaceUser] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [selectedUser, setSelectedUser] = useState<RegistrationUser | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>(
    event.registrations as unknown as Registration[]
  );

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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline">
                  {event.is_solo ? "Solo Event" : "Team Event"}
                </Badge>
                {!event.is_solo && (
                  <>
                    {event.min_team_player && (
                      <Badge variant="outline">
                        Min {event.min_team_player} Players
                      </Badge>
                    )}
                    {event.max_team_player && (
                      <Badge variant="outline">
                        Max {event.max_team_player} Players
                      </Badge>
                    )}
                  </>
                )}
                {event.max_teams && (
                  <Badge variant="outline">
                    Max {event.max_teams} Teams
                  </Badge>
                )}
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddRegistration(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Registration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Total Registrations: {registrations.length}{event.max_teams ? `/${event.max_teams}` : ""}
          </div>
          
          <RegistrationsList 
            registrations={registrations} 
            isSolo={!!event.is_solo}
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
        maxTeamSize={event.max_team_player}
      />

      <AddUserToTeamDialog
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        onAdd={handleAddUser}
        eventId={eventId}
        guildId={guildId}
        registration={selectedRegistration}
        maxTeamSize={event.max_team_player}
      />

      <RemoveUserDialog
        open={showRemoveUser}
        onClose={() => setShowRemoveUser(false)}
        onRemove={handleRemoveUser}
        eventId={eventId}
        registration={selectedRegistration}
        user={selectedUser}
        minTeamSize={event.min_team_player || 1}
      />

      <DeleteRegistrationDialog
        open={showDeleteRegistration}
        onClose={() => setShowDeleteRegistration(false)}
        onDelete={handleDeleteRegistration}
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
    </>
  );
}