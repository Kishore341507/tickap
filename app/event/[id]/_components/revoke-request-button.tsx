"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface RevokeRequestButtonProps {
  registrationId: string;
  teamName: string;
  className?: string; 
}

export function RevokeRequestButton({
  registrationId,
  teamName,
  className,
}: RevokeRequestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRevoke = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/registrations/${registrationId}/requests`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast({
        title: "Request Revoked",
        description: `Your request to join "${teamName}" has been revoked.`,
      });
      
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke request",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleRevoke} 
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <XCircle className="h-4 w-4 mr-2" />
      )}
      Revoke Request
    </Button>
  );
}
