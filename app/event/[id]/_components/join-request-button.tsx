"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface JoinRequestButtonProps {
  registrationId: string;
  eventName: string;
  teamName: string;
  className?: string;
}

export function JoinRequestButton({
  registrationId,
  eventName,
  teamName,
  className,
}: JoinRequestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRequest = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/registrations/${registrationId}/requests`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast({
        title: "Request Sent",
        description: `Your request to join "${teamName}" has been sent.`,
      });
      
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send request",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRequest} 
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      Request
    </Button>
  );
}
