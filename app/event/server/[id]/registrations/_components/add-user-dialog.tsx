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
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserPlus } from "lucide-react";
import { Registration , Member } from "@/types";

interface AddUserToTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (registration: Registration) => void;
  eventId: string;
  guildId: string;
  registration: Registration | null;
  maxTeamSize: number | null;
}

export function AddUserToTeamDialog({
  open,
  onClose,
  onAdd,
  eventId,
  guildId,
  registration,
  maxTeamSize,
}: AddUserToTeamDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedMember(null);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchMembers(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search for members
  const searchMembers = async (query: string) => {
    if (!guildId || query.length < 2) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/discord/bot/members/search?query=${encodeURIComponent(query)}&guildId=${guildId}&limit=6`);

      if (!response.ok) {
        throw new Error("Failed to search for members");
      }

      const data = await response.json();
      
      // Filter out already registered users
      // const existingUserIds = registration?.registrationusers.map(u => u.user_id.toString()) || [];
      const existingUserIds : any[] = [] ;
      const filteredResults = data.filter((member: Member) => {
        return !existingUserIds.includes(member.user.id);
      });
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching members:", error);
      toast({
        title: "Search failed",
        description: "Could not search for members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Select a member
  const selectMember = (member: Member) => {
    setSelectedMember(member);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedMember) {
      toast({
        title: "No member selected",
        description: "Please select a member to add to the team.",
        variant: "destructive",
      });
      return;
    }
    
    if (!registration) {
      toast({
        title: "No team selected",
        description: "Please select a team to add members to.",
        variant: "destructive",
      });
      return;
    }

    // Check if max team size would be exceeded
    const currentTeamSize = registration.registrationusers.length;
    if (maxTeamSize && currentTeamSize >= maxTeamSize) {
      toast({
        title: "Team size limit reached",
        description: `Teams can have a maximum of ${maxTeamSize} members.`,
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
          user_id: selectedMember.user.id,
          action: "add"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add user to team");
      }

      toast({
        title: "User added",
        description: `${selectedMember.user.global_name || selectedMember.user.username} has been added to the team.`,
      });

      const newRegistration = await response.json();
      onAdd(newRegistration.registration)
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Failed to add user",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member to Team</DialogTitle>
          <DialogDescription>
            Search and select a Discord user to add to{' '}
            <strong>{registration?.team_name || "the team"}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Command className="rounded-md border shadow-md">
              <CommandInput
                placeholder="Search for Discord users..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <ScrollArea className="h-72">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Searching...
                  </div>
                ) : searchResults.length === 0 && searchQuery.length > 2 ? (
                  <CommandEmpty>No eligible users found</CommandEmpty>
                ) : searchQuery.length < 2 ? (
                  <CommandEmpty>Enter at least 2 characters to search</CommandEmpty>
                ) : null}

                {searchQuery.length > 0 && searchResults.length > 0 && (
                  <CommandGroup heading="Search Results">
                    {searchResults.map((member) => (
                      <div key={member.user.id} className={`flex items-center space-x-2 px-1 py-1 cursor-pointer bg-none hover:bg-muted ${
                            selectedMember?.user.id === member.user.id 
                              ? "bg-muted" 
                              : ""
                          }`} onClick={() => selectMember(member)}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : undefined}
                              alt={member.user.username}
                            />
                            <AvatarFallback>{member.user.global_name || member.user.username}</AvatarFallback>
                          </Avatar>
                        <CommandItem
                          className="cursor-pointer data-[selected='true']:bg-black"
                        >
                          {member.user.global_name || member.user.username}
                        </CommandItem>
                      </div>
                    ))}
                  </CommandGroup>
                )}
              </ScrollArea>
            </Command>
          </div>
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
            onClick={handleSubmit}
            disabled={isLoading || !selectedMember}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add to Team
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}