"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ManagerActionCardProps {
  eventId: string;
  currentStatus: string;
  guildId: string;
}

export default function ManagerActionCard({ eventId, currentStatus, guildId }: ManagerActionCardProps) {
  const [status, setStatus] = useState<string>(currentStatus);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleStatusChange = async () => {
    if (status === currentStatus) {
      toast({
        title: "No change",
        description: "Status is already set to " + status,
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      const formData = new FormData();
      formData.append("status", status);
      
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update event status");
      }

      toast({
        title: "Status updated",
        description: `Event status changed to ${status}`,
        variant: "success",
      });
      
      // Refresh the page to show updated status
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors">
      <CardHeader>
        <CardTitle className="text-center">Manager Actions</CardTitle>
        <CardDescription className="text-center">Manage this event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Event Status
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Live">Live</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href={`/event/server/${guildId}/edit/${eventId}`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Event
          </Button>
        </Link>
        <Button 
          onClick={handleStatusChange} 
          disabled={isUpdating || status === currentStatus}
        >
          <Save className="mr-2 h-4 w-4" />
          {isUpdating ? "Updating..." : "Update Status"}
        </Button>
      </CardFooter>
    </Card>
  );
}