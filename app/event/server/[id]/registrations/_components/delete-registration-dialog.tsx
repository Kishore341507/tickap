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
import { Loader2 } from "lucide-react";

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

interface DeleteRegistrationDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  eventId: string;
  registration: Registration | null;
}

export function DeleteRegistrationDialog({
  open,
  onClose,
  onDelete,
  eventId,
  registration,
}: DeleteRegistrationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the default dialog close behavior
    
    if (!registration) {
      toast({
        title: "Error",
        description: "Missing registration information.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/events/${eventId}/register/manager?registration_id=${registration.id.toString()}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete registration");
      }

      toast({
        title: "Registration deleted",
        description: `Team "${registration.team_name || 'Unnamed Team'}" has been removed from the event.`,
      });

      onDelete();
      router.refresh();
      onClose(); // Manually close the dialog after successful deletion
    } catch (error: any) {
      toast({
        title: "Failed to delete registration",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete Registration
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to delete the registration for{' '}
              <strong>{registration?.team_name || 'Unnamed Team'}</strong>?
            </p>
            
            <div className="mt-2">
              <p className="text-sm font-medium mb-2">Team members ({registration?.registrationusers.length || 0}):</p>
              <div className="flex flex-wrap gap-2">
                {registration?.registrationusers.map((user) => (
                  <Badge key={user.user_id.toString()} variant="outline">
                    {user.user_name || "Unknown User"}
                  </Badge>
                ))}

                {!registration?.registrationusers.length && (
                  <span className="text-sm text-muted-foreground">No members</span>
                )}
              </div>
            </div>
            
            <p className="text-red-500 mt-4">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Registration"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}