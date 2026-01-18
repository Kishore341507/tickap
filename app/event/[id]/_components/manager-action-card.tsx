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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ManagerActionCardProps {
  eventId: string;
  currentStatus: string;
  guildId: string;
  eventName: string;
}

export default function ManagerActionCard({ eventId, currentStatus, guildId, eventName }: ManagerActionCardProps) {
  const [status, setStatus] = useState<string>(currentStatus);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [channels, setChannels] = useState<{ id: string; name: string; type: number }[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [discordForm, setDiscordForm] = useState({
    channelId: "",
    content: "",
    description: `To register in the ${eventName} event, click on the Register Button`,
    pfpUrl: "",
    username: "",
    thumbnailUrl: "",
    imageUrl: "",
    color: "#2b2c31",
  });

  const fetchChannels = async () => {
    try {
      setLoadingChannels(true);
      const response = await fetch(`/api/discord/bot/channels?guildId=${guildId}`);
      if (!response.ok) throw new Error("Failed to fetch channels");
      const data = await response.json();
      // Filter for text channels (type 0) and news channels (type 5)
      const textChannels = data.filter((c: any) => c.type === 0 || c.type === 5);
      setChannels(textChannels);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load Discord channels",
        variant: "destructive",
      });
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleDiscordModalOpen = (open: boolean) => {
    setShowDiscordModal(open);
    if (open && channels.length === 0) {
      fetchChannels();
    }
  };

  const handleSendDiscordMessage = async () => {
    if (!discordForm.channelId) {
      toast({
        title: "Error",
        description: "Please select a channel",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingMessage(true);
      const response = await fetch("/api/discord/bot/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...discordForm,
          eventId,
          eventLink: `${window.location.origin}/event/${eventId}`,
        }),
      });

      if (!response.ok) {
         const error = await response.json();
         throw new Error(error.error || "Failed to send message");
      }

      toast({
        title: "Success",
        description: "Message sent to Discord",
        variant: "success",
      });
      setShowDiscordModal(false);
      // Reset form (optional)
      setDiscordForm({
          channelId: "",
          content: "",
          description: `To register in the ${eventName} event, click on the Register Button`,
          pfpUrl: "",
          username: "",
          thumbnailUrl: "",
          imageUrl: "",
          color: "#2b2c31",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

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
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="flex-1">
                <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Live">Live</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
            <Button 
                onClick={handleStatusChange} 
                disabled={isUpdating || status === currentStatus}
            >
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/event/server/${guildId}/edit/${eventId}`} className="w-full">
            <Button variant="outline" className="w-full">
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
          </Link>
          <Link href={`/event/server/${guildId}/logs/${eventId}`} className="w-full">
                <Button variant="outline" className="w-full">
                    Logs
                </Button>
          </Link>
          <Link href={`/event/server/${guildId}/registrations/${eventId}`} className="col-span-2 w-full">
                <Button variant="outline" className="w-full">
                    Manage Registrations
                </Button>
          </Link>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="w-full pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
             <Dialog open={showDiscordModal} onOpenChange={handleDiscordModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full">
                        Send Registration Message in Discord
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Send Registration Message</DialogTitle>
                        <DialogDescription>
                            Send a customized registration embed to a Discord channel.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="channel">Channel</Label>
                            <Popover open={channelOpen} onOpenChange={setChannelOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={channelOpen}
                                        className="w-full justify-between"
                                    >
                                        {discordForm.channelId
                                            ? channels.find((channel) => channel.id === discordForm.channelId)?.name
                                            : "Select channel"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Search channel..." />
                                        <CommandList>
                                            <CommandEmpty>No channel found.</CommandEmpty>
                                            <CommandGroup>
                                                {channels.map((channel) => (
                                                    <CommandItem
                                                        key={channel.id}
                                                        value={channel.name}
                                                        onSelect={() => {
                                                            setDiscordForm({...discordForm, channelId: channel.id});
                                                            setChannelOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                discordForm.channelId === channel.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {channel.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="content">Message Content (max 1000 chars)</Label>
                            <Textarea 
                                id="content" 
                                maxLength={1000}
                                placeholder="Message content outside the embed..."
                                value={discordForm.content}
                                onChange={(e) => setDiscordForm({...discordForm, content: e.target.value})}
                            />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="description">Embed Description (max 1000 chars)</Label>
                            <Textarea 
                                id="description" 
                                maxLength={1000}
                                placeholder="Description inside the embed..."
                                value={discordForm.description}
                                onChange={(e) => setDiscordForm({...discordForm, description: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input 
                                    id="username" 
                                    placeholder="Bot Name"
                                    value={discordForm.username}
                                    onChange={(e) => setDiscordForm({...discordForm, username: e.target.value})}
                                />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="color">Color (Hex)</Label>
                                <div className="flex gap-2">
                                  <Input 
                                      id="color" 
                                      type="color"
                                      className="w-12 p-1"
                                      value={discordForm.color}
                                      onChange={(e) => setDiscordForm({...discordForm, color: e.target.value})}
                                  />
                                   <Input 
                                      value={discordForm.color}
                                      onChange={(e) => setDiscordForm({...discordForm, color: e.target.value})}
                                      placeholder="#000000"
                                  />
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="pfpUrl">Profile Picture URL</Label>
                             <Input 
                                id="pfpUrl" 
                                placeholder="https://..."
                                value={discordForm.pfpUrl}
                                onChange={(e) => setDiscordForm({...discordForm, pfpUrl: e.target.value})}
                             />
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                             <Input 
                                id="thumbnailUrl" 
                                placeholder="https://..."
                                value={discordForm.thumbnailUrl}
                                onChange={(e) => setDiscordForm({...discordForm, thumbnailUrl: e.target.value})}
                             />
                        </div>
                         <div className="grid gap-2">
                             <Label htmlFor="imageUrl">Image URL</Label>
                             <Input 
                                id="imageUrl" 
                                placeholder="https://..."
                                value={discordForm.imageUrl}
                                onChange={(e) => setDiscordForm({...discordForm, imageUrl: e.target.value})}
                             />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowDiscordModal(false)} variant="outline">Cancel</Button>
                        <Button onClick={handleSendDiscordMessage} disabled={sendingMessage}>
                            {sendingMessage ? "Sending..." : "Send Message"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}