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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Search, BadgePlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RegistrationUser , Registration , Member } from "@/types";

interface AddRegistrationDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (registration: Registration) => void;
  eventId: string;
  guildId: string;
  isSolo: boolean;
  minTeamSize: number;
  maxTeamSize: number | null;
}

export function AddRegistrationDialog({
  open,
  onClose,
  onAdd,
  eventId,
  guildId,
  isSolo,
  minTeamSize,
  maxTeamSize,
}: AddRegistrationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [teamNameError, setTeamNameError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  if(isSolo) {
    minTeamSize = 1;
    maxTeamSize = 1;
  }

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTeamName("");
      setSearchQuery("");
      setSelectedMembers([]);
      setTeamNameError("");
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
  }, [searchQuery, guildId]);

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
      setSearchResults(data);
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

  // Toggle member selection
  const toggleMemberSelection = (member: Member) => {
    if (selectedMembers.some(m => m.user.id === member.user.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.user.id !== member.user.id));
    } else {
      if (maxTeamSize && selectedMembers.length >= maxTeamSize) {
        toast({
          title: "Team size limit reached",
          description: `You can only select up to ${maxTeamSize} team members`,
          variant: "destructive",
        });
        return;
      }
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  // Validate team name
  const validateTeamName = () => {
    if (!teamName) {
      setTeamNameError("Team name is required");
      return false;
    }
    
    if (teamName.length < 3) {
      setTeamNameError("Team name must be at least 3 characters");
      return false;
    }
    
    if (teamName.length > 40) {
      setTeamNameError("Team name must be less than 40 characters");
      return false;
    }
    
    setTeamNameError("");
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateTeamName()) {
      return;
    }

    if (selectedMembers.length < minTeamSize) {
      toast({
        title: "Not enough team members",
        description: `You need at least ${minTeamSize} team members.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/events/${eventId}/register/manager`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName: teamName,
          teamMembers: selectedMembers.map(member => member.user.id),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create registration");
      }

      const newRegistration = await response.json();
      
      toast({
        title: "Registration created",
        description: isSolo 
          ? "Solo registration created successfully" 
          : `Team "${teamName}" created with ${selectedMembers.length} members`,
      });

      onAdd(newRegistration.registration);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Failed to create registration",
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
          <DialogTitle>
            {isSolo ? "Add Solo Registration" : "Create New Team"}
          </DialogTitle>
          <DialogDescription>
            {isSolo 
              ? "Add a new participant to this event."
              : `Create a new team with at least ${minTeamSize} members.`}
            {maxTeamSize ? ` Maximum team size is ${maxTeamSize}.` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">
              {isSolo ? "Participant Name" : "Team Name"}
            </Label>
            <Input
              id="teamName"
              placeholder={isSolo ? "Enter participant name" : "Enter team name (3-40 characters)"}
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                if (teamNameError) validateTeamName();
              }}
              className={teamNameError ? "border-red-500" : ""}
            />
            {teamNameError && (
              <p className="text-xs text-red-500">{teamNameError}</p>
            )}
          </div>

          {/* {!isSolo && ( */}
            <>
              <div className="space-y-2">
                <Label> {isSolo ? "Participant" : "Team Members"}</Label>
                <Command className="rounded-md border shadow-md">
                  <CommandInput
                    placeholder="Search for team members..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <ScrollArea className="h-24">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Searching...
                      </div>
                    ) : searchResults.length === 0 && searchQuery.length > 2 ? (
                      <CommandEmpty>No members found</CommandEmpty>
                    ) : <CommandEmpty>Enter at least 2 characters to search</CommandEmpty>}

                    {searchQuery.length > 0 && (
                      <CommandGroup heading="Search Results">
                        {searchResults.map((member) => (
                          <CommandItem 
                            key={member.user.id} 
                            value={`${member.user.username} ${member.nick ?? ""} ${member.user.global_name ?? ""} ${member.user.id}`}
                            className="cursor-pointer" 
                            onSelect={() => toggleMemberSelection(member)}
                          >
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage
                                src={member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : undefined}
                                alt={member.user.username}
                              />
                              <AvatarFallback>{member.user.global_name || member.user.username}</AvatarFallback>
                            </Avatar>

                            <span>{member.nick || member.user.global_name || member.user.username}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{member.user.username}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </ScrollArea>
                </Command>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium">Selected Members ({selectedMembers.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members selected yet</p>
                  ) : (
                    selectedMembers.map((member) => (
                      <Badge key={member.user.id} variant="secondary" className="flex items-center gap-1">
                        {member.user.username}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => toggleMemberSelection(member)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </>
          {/* )} */}
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
            disabled={isLoading || (!isSolo && selectedMembers.length < minTeamSize - 1)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <BadgePlus className="mr-2 h-4 w-4" />
                Create {isSolo ? "Registration" : "Team"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}