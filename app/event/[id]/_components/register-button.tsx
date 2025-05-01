"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

interface TeamMember {
    avatar?: string;
    user: {
        id: string;
        username: string;
        avatar: string;
        global_name: string;
    }

}

interface RegisterButtonProps {
    eventId: string;
    eventStatus: string;
    isRegistered: boolean;
    redirectUrl?: string | null | undefined;
    isSolo: boolean | null;
    maxTeamPlayer: number | null;
    minTeamPlayer: number | null;
    guildId: bigint | null;
    session: boolean ;
}

export function RegisterButton({
    eventId,
    eventStatus,
    isRegistered,
    redirectUrl,
    isSolo,
    maxTeamPlayer,
    minTeamPlayer,
    guildId,
    session,
}: RegisterButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [teamNameError, setTeamNameError] = useState("");
    const router = useRouter();
    const { toast } = useToast();

    const { data: sessionData } = useSession();
    console.log("Session data:", sessionData);
    // session = sessionData?.user ? true : false; // Check if user is logged in

    // Debounce search query
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                console.log("Searching for members:", searchQuery);
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
            const filteredData = data.filter((member: TeamMember) => member.user.id !== sessionData?.user.userId);
            setSearchResults(filteredData);
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

    // Handle team member selection
    const toggleMemberSelection = (member: TeamMember) => {
        if (selectedMembers.some(m => m.user.id === member.user.id)) {
            setSelectedMembers(selectedMembers.filter(m => m.user.id !== member.user.id));
        } else {
            if (maxTeamPlayer && selectedMembers.length >= maxTeamPlayer - 1) {
                toast({
                    title: "Team size limit reached",
                    description: `You can only select up to ${maxTeamPlayer - 1} team members`,
                    variant: "destructive",
                });
                return;
            }
            setSelectedMembers([...selectedMembers, member]);
        }
    };

    const handleRegistration = async () => {
        // If there's a redirect URL, use that instead of our registration system
        // if (redirectUrl) {
        //     window.open(redirectUrl, "_blank");
        //     return;
        // }

        if (eventStatus !== "Open") {
            toast({
                title: "Registration closed",
                description: `This event is currently ${eventStatus.toLowerCase()}.`,
                variant: "destructive",
            });
            return;
        }

        // If it's not a solo event, open team selection dialog
        if (isSolo === false) {
            setIsTeamDialogOpen(true);
            return;
        }

        try {
            setIsLoading(true);
            // Uncomment and modify this code when API is ready:
            const response = await fetch(`/api/events/${eventId}/register`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
                body: JSON.stringify({ 
                    teamName: null,
                    teamMembers: null 
                }),
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || "Failed to register for event");
            }

            toast({
                title: "Registration successful",
                description: "You have successfully registered for this event!",
                variant: "success",
            });

            // Refresh the page to show updated registration status
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Registration failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

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

    const submitTeamRegistration = async () => {
        if (!validateTeamName()) {
            return;
        }

        if (minTeamPlayer && selectedMembers.length < minTeamPlayer - 1) {
            toast({
                title: "Not enough team members",
                description: `You need at least ${minTeamPlayer - 1} more team members to register.`,
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            // Uncomment and modify this code when API is ready:
            const response = await fetch(`/api/events/${eventId}/register`, {
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
              throw new Error(error.message || "Failed to register for event");
            }

            toast({
                title: "Team registration successful",
                description: `Team "${teamName}" with you and ${selectedMembers.length} teammates have been registered for this event!`,
                variant: "success",
            });

            setIsTeamDialogOpen(false);
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Team registration failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Determine button text based on status
    let buttonText = "Register for Event";
    let buttonVariant: "default" | "secondary" | "destructive" | "outline" = "default";
    let disabled = false;

    if (!session) {
        buttonText = "Login to Register";
        buttonVariant = "outline";
        disabled = true;
    }
    else if (isLoading) {
        buttonText = "Registering...";
        disabled = true;
    } else if (isRegistered) {
        buttonText = "Already Registered";
        buttonVariant = "secondary";
        disabled = true;
    } else if (eventStatus === "Closed") {
        buttonText = "Registration Closed";
        buttonVariant = "destructive";
        disabled = true;
    } else if (eventStatus === "Cancelled") {
        buttonText = "Event Cancelled";
        buttonVariant = "destructive";
        disabled = true;
    } else if (eventStatus !== "Open") {
        buttonText = "Registration Closed";
        buttonVariant = "destructive";
        disabled = true;
    }

    return (
        <>
            <Button
                onClick={handleRegistration}
                disabled={disabled}
                variant={buttonVariant}
                className="w-full mt-2"
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {buttonText}
            </Button>

            <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Team Members</DialogTitle>
                        <DialogDescription>
                            {minTeamPlayer ? `You need at least ${minTeamPlayer - 1} team members.` : 'Add team members for this event.'}
                            {maxTeamPlayer ? ` Maximum team size is ${maxTeamPlayer}.` : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 pb-4">
                        <div className="space-y-2">
                            <Label htmlFor="teamName" className="text-sm font-medium">
                                Team Name
                            </Label>
                            <Input
                                id="teamName"
                                placeholder="Enter team name (3-40 characters)"
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

                        <div className="space-y-2">
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
                                                <div key={member.user.username} className="flex items-center space-x-2 px-1 py-1 cursor-pointer bg-none hover:bg-muted" onClick={() => toggleMemberSelection(member)}>
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage
                                                            src={member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : undefined}
                                                            alt={member.user.username}
                                                        />
                                                        <AvatarFallback>{member.user.global_name || member.user.username}</AvatarFallback>
                                                    </Avatar>

                                                    <CommandItem
                                                        // onSelect={() => toggleMemberSelection(member)}
                                                        className="cursor-pointer data-[selected='true']:bg-black"
                                                    >
                                                        {member.user.username}
                                                    </CommandItem>
                                                </div>
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
                    </div>

                    <DialogFooter className="flex">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsTeamDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitTeamRegistration}
                            disabled={isLoading || !!(minTeamPlayer && selectedMembers.length < minTeamPlayer - 1)}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                "Register Team"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}