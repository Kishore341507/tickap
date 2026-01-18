"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface RespondInviteButtonProps {
  requestId: string; // The join request ID
  teamName: string;
}

export function RespondInviteButton({
  requestId,
  teamName,
}: RespondInviteButtonProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRespond = async (action: "accept" | "decline") => {
    try {
      if (action === "accept") setIsAccepting(true);
      else setIsDeclining(true);

      const response = await fetch(`/api/join-requests/${requestId}/respond`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast({
        title: action === "accept" ? "Joined Team" : "Invite Declined",
        description: action === "accept" 
            ? `You have successfully joined "${teamName}".` 
            : `You declined the invitation to join "${teamName}".`,
      });
      
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
      });
    } finally {
      setIsAccepting(false);
      setIsDeclining(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="default" 
        size="sm" 
        onClick={() => handleRespond("accept")} 
        disabled={isAccepting || isDeclining}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isAccepting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {/* Accept */}
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleRespond("decline")} 
        disabled={isAccepting || isDeclining}
        className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
      >
        {isDeclining ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
        {/* Decline */}
      </Button>
    </div>
  );
}
