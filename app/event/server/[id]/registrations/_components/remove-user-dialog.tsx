"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { RegistrationUser , Registration } from "@/types";

interface RemoveUserDialogProps {
  open: boolean;
  onClose: () => void;
  onRemove: (registration: Registration | null) => void;
  eventId: string;
  registration: Registration | null;
  user: RegistrationUser | null;
  minTeamSize: number | null;
  allowIncompleteTeams?: boolean | null;
}

export function RemoveUserDialog({
  open,
  onClose,
  onRemove,
  eventId,
  registration,
  user,
  minTeamSize,
  allowIncompleteTeams,
}: RemoveUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Check if removing user would violate min team size requirement
  const wouldViolateMinTeamSize = registration && 
    minTeamSize && 
    registration.registrationusers.length <= minTeamSize &&
    !allowIncompleteTeams;

  // Check if user is the last member
  const isLastMember = registration?.registrationusers.length === 1;

  // Handle user removal
  const handleRemoveUser = async () => {
    if (!registration || !user) {
      toast({
        title: "Error",
        description: "Missing registration or user information",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/events/${eventId}/register/manager`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration_id: registration.id.toString(),
          user_id: user.user_id.toString(),
          action: "remove"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove user from team");
      }

      toast({
        title: "User removed",
        description: `${user.user_name || "User"} has been removed from the team.`,
      });

      const newRegistration = await response.json();
      onRemove(newRegistration.registration);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Failed to remove user",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Member from Team</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {user?.user_name || "this user"} from{' '}
            <strong>{registration?.team_name || "this team"}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {user && (
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user.pfp || undefined}
                  alt={user.user_name || "User"}
                />
                <AvatarFallback>{user.user_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.user_name || "Unknown User"}</p>
                <p className="text-sm text-muted-foreground">User ID: {user.user_id.toString()}</p>
              </div>
            </div>
          )}

          {(wouldViolateMinTeamSize || isLastMember) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {isLastMember 
                  ? "This user is the last member of the team. Removing them will delete the entire registration."
                  : `Removing this user would leave the team below the minimum required ${minTeamSize} members. This will delete the entire team registration.`
                }
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRemoveUser}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <UserMinus className="mr-2 h-4 w-4" />
                Remove User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}