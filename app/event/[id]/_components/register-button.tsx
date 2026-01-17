"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, UserPlus, X, UserMinus, LogOut, Crown, Plus, Mail, Trash2 } from "lucide-react";
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
    CommandList,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession, signIn } from "next-auth/react";
import { 
    AlertDialog, 
    AlertDialogContent, 
    AlertDialogHeader, 
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Member , RegistrationUser , Registration} from "@/types";

interface RegisterButtonProps {
    eventId: string;
    eventStatus: string;
    isRegistered: boolean;
    redirectUrl?: string | null | undefined;
    isSolo: boolean | null;
    maxTeamPlayer: number | null;
    minTeamPlayer: number | null;
    guildId: bigint | null;
    session: boolean;
    userRegistration: Registration | null | undefined;
    eventExtra?: any; // Added prop for custom questions
    allowIncompleteTeams?: boolean | null;
    registerForOther?: boolean | null;
    enableTeamInvites?: boolean | null;
}

// Type for custom question
interface CustomQuestion {
    question: string;
    placeholder: string;
    default: string;
    type: 1 | 2; // 1 for short, 2 for long
    required: boolean;
}

// Type for custom question response
interface CustomQuestionResponse {
    [key: string]: string;
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
    userRegistration,
    eventExtra,
    allowIncompleteTeams,
    registerForOther,
    enableTeamInvites
}: RegisterButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
    const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false);
    const [isUnregisterDialogOpen, setIsUnregisterDialogOpen] = useState(false);
    const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const [isInviteMemberDialogOpen, setIsInviteMemberDialogOpen] = useState(false);
    
    // New state for revocation
    const [inviteToRevoke, setInviteToRevoke] = useState<string | null>(null);
    const [isRevokeInviteDialogOpen, setIsRevokeInviteDialogOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Member[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [teamNameError, setTeamNameError] = useState("");
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
    const [customResponses, setCustomResponses] = useState<CustomQuestionResponse>({});
    const [customQuestionsError, setCustomQuestionsError] = useState<{[key: string]: string}>({});
    const router = useRouter();
    const { toast } = useToast();

    const { data: sessionData } = useSession();

     // Helper to get current user role
     const currentUserRole = userRegistration?.registrationusers.find(
        u => u.user_id.toString() === sessionData?.user?.userId
    )?.role;

    const isLeaderOrManager = currentUserRole === "LEADER" || currentUserRole === "MANAGER";

    const handleAddMember = async (member: Member) => {
        if (!userRegistration) return;
        try {
            setIsLoading(true);
            const response = await fetch(`/api/registrations/${userRegistration.id}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: member.user.id,
                    username: member.user.global_name || member.user.username,
                    pfp: member.user.avatar 
                        ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
                        : undefined
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            toast({ title: "Member added", variant: "success" });
            setIsAddMemberDialogOpen(false);
            setSearchQuery("");
            setSearchResults([]);
            router.refresh();
        } catch (error: any) {
            toast({ title: "Failed to add member", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteMember = async (member: Member) => {
        if (!userRegistration) return;
        try {
            setIsLoading(true);
            const response = await fetch(`/api/registrations/${userRegistration.id}/invites`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: member.user.id,
                    username: member.user.global_name || member.user.username,
                    pfp: member.user.avatar 
                        ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
                        : undefined
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            toast({ title: "Invite sent", variant: "success" });
            setIsInviteMemberDialogOpen(false);
            setSearchQuery("");
            setSearchResults([]);
            router.refresh();
        } catch (error: any) {
            toast({ title: "Failed to invite", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!userRegistration) return;
        
        // Don't remove self through this function (use unregister instead)
        if (userId === sessionData?.user?.userId) {
            setIsUnregisterDialogOpen(true);
            return;
        }

        setMemberToRemove(userId);
        setIsRemoveMemberDialogOpen(true);
    };

    const confirmRemoveMember = async () => {
        if (!userRegistration || !memberToRemove) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/api/registrations/${userRegistration.id}/members`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: memberToRemove }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            toast({ title: "Member removed", variant: "success" });
            router.refresh();
        } catch (error: any) {
            toast({ title: "Failed to remove member", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
            setIsRemoveMemberDialogOpen(false);
            setMemberToRemove(null);
        }
    };
    
    // Parse custom questions from eventExtra on component mount
    useEffect(() => {
        if (eventExtra) {
            try {
                const parsedExtra = typeof eventExtra === 'string' 
                    ? JSON.parse(eventExtra) 
                    : eventExtra;
                
                const questionsList: CustomQuestion[] = [];
                
                // Convert from object format to array format for the UI
                Object.entries(parsedExtra).forEach(([question, details]: [string, any]) => {
                    questionsList.push({
                        question,
                        placeholder: details.placeholder || '',
                        default: details.default || '',
                        type: details.type || 1,
                        required: details.required || false
                    });
                    
                    // Initialize responses with default values
                    setCustomResponses(prev => ({
                        ...prev,
                        [question]: details.default || ''
                    }));
                });
                
                setCustomQuestions(questionsList);
            } catch (error) {
                console.error('Error parsing custom questions:', error);
            }
        }
    }, [eventExtra]);

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
            const filteredData = data.filter((member: Member) => member.user.id !== sessionData?.user.userId);
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

    const handleRevokeInvite = async () => {
        if (!userRegistration || !inviteToRevoke) return;
        try {
            setIsLoading(true);
            const response = await fetch(`/api/registrations/${userRegistration.id}/invites/${inviteToRevoke}`, {
                method: "DELETE",
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to revoke invite");
            }

            toast({ title: "Invite revoked", variant: "success" });
            router.refresh(); 
        } catch (error: any) {
            toast({ title: "Failed to revoke invite", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
            setIsRevokeInviteDialogOpen(false);
            setInviteToRevoke(null);
        }
    };

    // Handle team member selection
    const toggleMemberSelection = (member: Member) => {
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

        // For solo events, if there are custom questions, show the questions dialog
        if (customQuestions.length > 0) {
            setIsQuestionsDialogOpen(true);
            return;
        }

        // Otherwise, proceed with direct registration
        try {
            setIsLoading(true);
            const response = await fetch(`/api/events/${eventId}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    teamName: null,
                    teamMembers: null,
                    questionResponses: undefined
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

    const handleUnregister = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/events/${eventId}/register`, {
                method: "DELETE",
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to unregister from event");
            }

            toast({
                title: "Unregistered successfully",
                description: "You have been removed from this event.",
                variant: "success",
            });

            // Refresh the page to show updated registration status
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Unregister failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setIsUnregisterDialogOpen(false);
        }
    };
    
    // Handle Discord login
    const handleLogin = async () => {
        signIn("discord", { callbackUrl: window.location.href });
        return Promise.resolve();
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

    // Validate custom question responses
    const validateCustomQuestions = () => {
        const errors: {[key: string]: string} = {};
        let hasError = false;
        
        customQuestions.forEach(question => {
            if (question.required && (!customResponses[question.question] || customResponses[question.question].trim() === '')) {
                errors[question.question] = 'This question is required';
                hasError = true;
            }
        });
        
        setCustomQuestionsError(errors);
        return !hasError;
    };

    // Handle team information submission - now a separate step before questions
    const handleTeamSubmit = () => {
        if (!validateTeamName()) {
            return;
        }

        if (minTeamPlayer && selectedMembers.length < minTeamPlayer - 1 && !allowIncompleteTeams) {
            toast({
                title: "Not enough team members",
                description: `You need at least ${minTeamPlayer - 1} more team members to register.`,
                variant: "destructive",
            });
            return;
        }

        // If there are custom questions, proceed to the questions dialog
        if (customQuestions.length > 0) {
            setIsTeamDialogOpen(false);
            setIsQuestionsDialogOpen(true);
        } else {
            // Otherwise submit the team registration
            submitRegistration();
        }
    };

    // Submit registration with team info and questions (if any)
    const submitRegistration = async () => {
        // Validate custom questions if they exist
        if (customQuestions.length > 0 && !validateCustomQuestions()) {
            toast({
                title: "Missing required information",
                description: "Please answer all required questions",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`/api/events/${eventId}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    teamName: isSolo ? null : teamName,
                    teamMembers: isSolo ? null : selectedMembers.map(member => member.user.id),
                    questionResponses: customQuestions.length > 0 ? customResponses : undefined
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to register for event");
            }

            toast({
                title: isSolo ? "Registration successful" : "Team registration successful",
                description: isSolo 
                    ? "You have successfully registered for this event!" 
                    : `Team "${teamName}" with you and ${selectedMembers.length} teammates have been registered for this event!`,
                variant: "success",
            });

            setIsTeamDialogOpen(false);
            setIsQuestionsDialogOpen(false);
            router.refresh();
        } catch (error: any) {
            toast({
                title: isSolo ? "Registration failed" : "Team registration failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle input change for custom questions
    const handleQuestionChange = (question: string, value: string) => {
        setCustomResponses(prev => ({
            ...prev,
            [question]: value
        }));
        
        // Clear error when user types
        if (customQuestionsError[question]) {
            setCustomQuestionsError(prev => {
                const newErrors = {...prev};
                delete newErrors[question];
                return newErrors;
            });
        }    };
    
    // Determine button text based on status
    let buttonText = "Register for Event";
    let buttonVariant: "default" | "secondary" | "destructive" | "outline" = "default";
    let disabled = false;
    let handleClick = handleRegistration;

    // If not logged in, show Discord login button 
    if (!session) {
        buttonText = "Login to Register";
        buttonVariant = "outline";
        handleClick = handleLogin;
    }
    // If loading, show loading state
    else if (isLoading) {
        buttonText = isRegistered ? "Processing Unregistration..." : "Submitting Registration...";
        disabled = true;
    } 
    // If event is not open, show appropriate text
    else if (eventStatus === "Closed") {
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
    
    // If the user is registered, show current registration details
    if (isRegistered && userRegistration) {
        const memberCount = userRegistration.registrationusers.length;
        const isTeamIncomplete = !isSolo && minTeamPlayer && memberCount < minTeamPlayer;
        
        return (
            <div className="space-y-4">
                <Card className={`border-2 ${isTeamIncomplete ? "border-red-500" : "border-green-500"}`}>
                    <CardContent className="pt-4 pb-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    {isSolo && userRegistration.registrationusers.length > 0 ? (
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage 
                                                    src={userRegistration.registrationusers[0].pfp ? userRegistration.registrationusers[0].pfp : undefined} 
                                                    alt={userRegistration.registrationusers[0].user_name || "User"} 
                                                />
                                                <AvatarFallback>{userRegistration.registrationusers[0].user_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                            </Avatar>
                                            <h3 className="font-semibold text-lg">{userRegistration.registrationusers[0].user_name || "Registered User"}</h3>
                                        </div>
                                    ) : (
                                        <h3 className="font-semibold text-lg">{userRegistration.team_name || "Your Registration"}</h3>
                                    )}
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge 
                                            variant={isTeamIncomplete ? "destructive" : "outline"} 
                                            className={!isTeamIncomplete ? "bg-green-500 text-white hover:bg-green-600 border-green-600" : ""}
                                        >
                                            {isTeamIncomplete 
                                                ? "Required Members Missing" 
                                                : (isSolo ? "Registered" : "Team Registered")
                                            }
                                        </Badge>
                                    </div>
                                </div>
                                {isTeamIncomplete && (
                                    <p className="text-xs text-red-500 font-medium">
                                        You need {(minTeamPlayer || 0) - memberCount} more members to complete the team.
                                    </p>
                                )}
                            </div>
                            
                            {!isSolo && (
                                <div className="space-y-2">
                                    {/* <p className="text-sm font-medium text-muted-foreground">Team Members</p> */}
                                    <div className="grid gap-2">
                                        {userRegistration.registrationusers.map(user => (
                                            <div 
                                                key={user.user_id.toString()} 
                                                className="flex items-center gap-3 p-2 rounded-lg border bg-card/50"
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage 
                                                        src={user.pfp ? user.pfp : undefined} 
                                                        alt={user.user_name || "User"} 
                                                    />
                                                    <AvatarFallback>{user.user_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium leading-none">
                                                        {user.user_name || "Unknown User"}
                                                    </span>
                                                </div>
                                                <div className="ml-auto flex items-center gap-2">
                                                    {user.role === "LEADER" && (
                                                        <Crown className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    {isLeaderOrManager && user.user_id.toString() !== sessionData?.user?.userId && user.role !== "LEADER" && (user.role !== "MANAGER" || currentUserRole === "LEADER") && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveMember(user.user_id.toString())}
                                                            disabled={isLoading}
                                                        >
                                                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3" />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {!isSolo && (
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {memberCount} / {maxTeamPlayer || "∞"} Members
                                            </span>
                                        )}
                                    </div>
                                    
                                    {userRegistration.join_requests && userRegistration.join_requests.length > 0 && (
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="invited" className="border-b-0">
                                                <AccordionTrigger className="py-2 hover:no-underline">
                                                    <span className="text-sm font-medium">Invited Members ({userRegistration.join_requests.length})</span>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-2 pt-1">
                                                        {userRegistration.join_requests.map((request) => (
                                                            <div 
                                                                key={request.id} 
                                                                className="flex items-center gap-3 p-2 rounded-lg border bg-card/50"
                                                            >
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage 
                                                                        src={request.user_pfp ? request.user_pfp : undefined} 
                                                                        alt={request.user_name || "User"} 
                                                                    />
                                                                    <AvatarFallback>{request.user_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium leading-none">
                                                                        {request.user_name || "Unknown User"}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Invited
                                                                    </span>
                                                                </div>
                                                                {isLeaderOrManager && (
                                                                    <div className="ml-auto">
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            onClick={() => {
                                                                                setInviteToRevoke(request.id);
                                                                                setIsRevokeInviteDialogOpen(true);
                                                                            }}
                                                                            disabled={isLoading}
                                                                        >
                                                                            {isLoading && inviteToRevoke === request.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <X className="h-3 w-3" />}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )}
                                    
                                    {isLeaderOrManager && (
                                        <div className="flex gap-2 mt-4">
                                            {registerForOther && (!maxTeamPlayer || memberCount < maxTeamPlayer) && (
                                                <Button size="sm" variant="outline" onClick={() => {
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                    console.log("Opening add member dialog");
                                                    setIsAddMemberDialogOpen(true);
                                                }} className="flex-1">
                                                    <Plus className="w-4 h-4 mr-2" /> Add Member
                                                </Button>
                                            )}
                                            {enableTeamInvites && (!maxTeamPlayer || memberCount < maxTeamPlayer) && (
                                                 <Button size="sm" variant="outline" onClick={() => {
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                    setIsInviteMemberDialogOpen(true);
                                                 }} className="flex-1">
                                                    <Mail className="w-4 h-4 mr-2" /> Invite Member
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </CardContent>
                </Card>
                
                <Button
                    onClick={() => setIsUnregisterDialogOpen(true)}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
                    Unregister
                </Button>

                <AlertDialog open={isUnregisterDialogOpen} onOpenChange={setIsUnregisterDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {isSolo 
                                    ? "This will remove your registration from this event." 
                                    : userRegistration.registrationusers.length === 1
                                        ? "This will remove your registration from this event."
                                        : userRegistration.registrationusers.length <= (minTeamPlayer || 1) && !allowIncompleteTeams
                                            ? "This will remove you and your entire team from this event."
                                            : "This will remove you from this team."
                                }
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUnregister} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Confirm
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={isRevokeInviteDialogOpen} onOpenChange={setIsRevokeInviteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to revoke this invitation? The user will not be able to join the team via this invite.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRevokeInvite} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Revoke
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Add Member Dialog */}
                <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Team Member</DialogTitle>
                            <DialogDescription>
                                Search and add a member to your team immediately.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Command className="rounded-md border shadow-md">
                                    <CommandInput
                                        placeholder="Search for users..."
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    <CommandList className="h-64">
                                        {isSearching ? (
                                            <div className="flex items-center justify-center py-2">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Searching...
                                            </div>
                                        ) : searchResults.length > 0 ? null : searchQuery.length > 2 ? (
                                            <CommandEmpty>No users found</CommandEmpty>
                                        ) : (
                                            <CommandEmpty>Enter at least 2 characters to search</CommandEmpty>
                                        )}
                                        {searchQuery.length > 0 && (
                                            <CommandGroup heading="Search Results">
                                                {searchResults.map((member) => (
                                                    <CommandItem 
                                                        key={member.user.username} 
                                                        value={`${member.user.username} ${member.nick ?? ""} ${member.user.global_name ?? ""} ${member.user.id}`}
                                                        className="cursor-pointer flex items-center justify-between" 
                                                        onSelect={() => handleAddMember(member)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage
                                                                    src={member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : undefined}
                                                                    alt={member.user.username}
                                                                />
                                                                <AvatarFallback>{member.user.global_name || member.user.username}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span>{member.nick || member.user.global_name || member.user.username}</span>
                                                                <span className="text-xs text-muted-foreground">{member.user.username}</span>
                                                            </div>
                                                        </div>
                                                        <Button size="sm" variant="ghost" disabled={isLoading} className="pointer-events-none">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Invite Member Dialog */}
                <Dialog open={isInviteMemberDialogOpen} onOpenChange={setIsInviteMemberDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                                Send an invitation to join your team. They must accept to join.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Command className="rounded-md border shadow-md">
                                    <CommandInput
                                        placeholder="Search for users..."
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    <CommandList className="h-64">
                                        {isSearching ? (
                                            <div className="flex items-center justify-center py-2">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Searching...
                                            </div>
                                        ) : searchResults.length > 0 ? null : searchQuery.length > 2 ? (
                                            <CommandEmpty>No users found</CommandEmpty>
                                        ) : (
                                            <CommandEmpty>Enter at least 2 characters to search</CommandEmpty>
                                        )}
                                        {searchQuery.length > 0 && (
                                            <CommandGroup heading="Search Results">
                                                {searchResults.map((member) => (
                                                    <CommandItem 
                                                        key={member.user.username} 
                                                        value={`${member.user.username} ${member.nick ?? ""} ${member.user.global_name ?? ""} ${member.user.id}`}
                                                        className="cursor-pointer flex items-center justify-between" 
                                                        onSelect={() => handleInviteMember(member)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage
                                                                    src={member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : undefined}
                                                                    alt={member.user.username}
                                                                />
                                                                <AvatarFallback>{member.user.global_name || member.user.username}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span>{member.nick || member.user.global_name || member.user.username}</span>
                                                                <span className="text-xs text-muted-foreground">{member.user.username}</span>
                                                            </div>
                                                        </div>
                                                        <Button size="sm" variant="ghost" disabled={isLoading} className="pointer-events-none">
                                                            <Mail className="h-4 w-4" />
                                                        </Button>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Remove Member Dialog */}
                <AlertDialog open={isRemoveMemberDialogOpen} onOpenChange={setIsRemoveMemberDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {userRegistration && !allowIncompleteTeams && minTeamPlayer && (userRegistration.registrationusers.length - 1) < minTeamPlayer
                                    ? "Removing this member will make the team incomplete and the ENTIRE registration will be deleted. This action cannot be undone."
                                    : "Are you sure you want to remove this member from the team? This action cannot be undone."
                                }
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmRemoveMember} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Remove
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }    return (
        <>
            <Button
                onClick={handleClick}
                disabled={disabled}
                variant={buttonVariant}
                className="w-full mt-2"
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {buttonText}
            </Button>

            {/* Team Selection Dialog */}
            <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Team Members</DialogTitle>
                        <DialogDescription>
                            {minTeamPlayer && !allowIncompleteTeams ? `You need at least ${minTeamPlayer - 1} team members.` : 'Add team members for this event.'}
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

                        {registerForOther !== false && (
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
                                    ) : searchResults.length > 0 ? null : searchQuery.length > 2 ? (
                                        <CommandEmpty>No members found</CommandEmpty>
                                    ) : (
                                        <CommandEmpty>Enter at least 2 characters to search</CommandEmpty>
                                    )}
                                    {searchQuery.length > 0 && (
                                        <CommandGroup heading="Search Results">
                                            {searchResults.map((member) => (
                                                <CommandItem 
                                                    key={member.user.username} 
                                                    value={`${member.user.username} ${member.nick ?? ""} ${member.user.global_name ?? ""} ${member.user.id}`}
                                                    className="cursor-pointer" 
                                                    onSelect={() => toggleMemberSelection(member)}
                                                >
                                                    <Avatar className="h-8 w-8">
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
                        )}

                        {registerForOther !== false && (
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
                        )}
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
                            onClick={handleTeamSubmit}
                            disabled={isLoading || !!(minTeamPlayer && selectedMembers.length < minTeamPlayer - 1 && !allowIncompleteTeams)}
                        >
                            {isLoading && customQuestions.length === 0 ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                customQuestions.length > 0 ? "Next" : "Register Team"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Custom Questions Dialog */}
            <Dialog open={isQuestionsDialogOpen} onOpenChange={setIsQuestionsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Additional Information</DialogTitle>
                        <DialogDescription>
                            Please provide the following information to complete your registration.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-2">
                        {customQuestions.map((question, index) => (
                            <div key={index} className="space-y-2">
                                <Label className="text-sm font-medium flex items-center">
                                    {question.question} 
                                    {question.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                {question.type === 1 ? (
                                    <Input 
                                        placeholder={question.placeholder} 
                                        value={customResponses[question.question] || ''}
                                        onChange={(e) => handleQuestionChange(question.question, e.target.value)}
                                        className={customQuestionsError[question.question] ? "border-red-500" : ""}
                                    />
                                ) : (
                                    <Textarea
                                        placeholder={question.placeholder}
                                        value={customResponses[question.question] || ''}
                                        onChange={(e) => handleQuestionChange(question.question, e.target.value)}
                                        className={customQuestionsError[question.question] ? "border-red-500" : ""}
                                        rows={3}
                                    />
                                )}
                                {customQuestionsError[question.question] && (
                                    <p className="text-xs text-red-500">{customQuestionsError[question.question]}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsQuestionsDialogOpen(false);
                                // If coming from team selection, go back to team dialog
                                if (!isSolo) {
                                    setIsTeamDialogOpen(true);
                                }
                            }}
                        >
                            {isSolo ? "Cancel" : "Back"}
                        </Button>
                        <Button
                            type="button"
                            onClick={submitRegistration}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                "Register"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Unregister Dialog - kept unchanged */}
            <AlertDialog open={isUnregisterDialogOpen} onOpenChange={setIsUnregisterDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isSolo 
                                ? "This will remove your registration from this event." 
                                : userRegistration?.registrationusers.length! <= (minTeamPlayer || 1)
                                    ? "This will remove you and your entire team from this event."
                                    : "This will remove you from this team."
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUnregister} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}