"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Calendar,
  Users,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

interface DiscordEvent {
  id: string;
  name: string;
  description: string;
  scheduled_start_time: string;
  scheduled_end_time?: string | null;
  status: number;
  entity_type: number;
  location?: string | null;
  banner: string;
  user_count: number;
}

export default function CreateEventAction({ guildId }: { guildId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [discordEvents, setDiscordEvents] = useState<DiscordEvent[]>([]);

  const handleCreateClick = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/discord/guild/${guildId}/scheduled-events`);
      if (res.ok) {
        const data = await res.json();
        const events: DiscordEvent[] = data.events || [];
        if (events.length > 0) {
          setDiscordEvents(events);
          setIsOpen(true);
          return;
        }
      }
      // If no unlinked events exist, navigate directly to create page
      router.push(`/event/server/${guildId}/create`);
    } catch (err) {
      console.error("Error checking discord events:", err);
      router.push(`/event/server/${guildId}/create`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDiscordEvent = async (event: DiscordEvent) => {
    try {
      setImportingId(event.id);
      const res = await fetch(`/api/events/import-discord`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          discordEventId: event.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import event");
      }

      toast({
        title: "Event Imported!",
        description: `"${event.name}" was imported from Discord. You can now configure registration settings.`,
      });

      setIsOpen(false);
      router.push(`/event/server/${guildId}/edit/${data.eventId}`);
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.message || "Failed to import Discord event",
        variant: "destructive",
      });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <>
      <Button
        size="sm"
        className="h-9 gap-1.5 text-xs font-medium shadow-sm transition-all"
        onClick={handleCreateClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        <span>Create Event</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="p-6 pb-4">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
                  <Sparkles className="h-4 w-4" />
                </span>
                <DialogTitle className="text-xl font-bold">
                  Create or Import Event
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                We detected upcoming Discord Scheduled Events in this server. You can import one directly or create a custom event from scratch.
              </DialogDescription>
            </DialogHeader>

            {/* Option 1: Custom Event */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/event/server/${guildId}/create`);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-dashed border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold group-hover:scale-105 transition-transform">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      + Create Custom Event
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Start fresh with custom rules, teams, and tournament settings
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* Option 2: Unlinked Discord Events */}
          <div className="border-t border-border/40 bg-muted/10 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Discord Scheduled Events ({discordEvents.length})
              </span>
              <Badge variant="outline" className="text-[10px] font-normal border-indigo-500/30 text-indigo-400">
                Auto-sync ready
              </Badge>
            </div>

            <ScrollArea className="max-h-[300px] pr-3">
              <div className="space-y-2.5">
                {discordEvents.map((event) => {
                  const isImporting = importingId === event.id;
                  const startDate = event.scheduled_start_time
                    ? new Date(event.scheduled_start_time)
                    : null;

                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40">
                          <Image
                            src={event.banner}
                            alt={event.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {event.name}
                          </h4>
                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-0.5">
                            {startDate && (
                              <span className="inline-flex items-center gap-1 font-medium">
                                <Calendar className="h-3 w-3 opacity-70" />
                                {format(startDate, "MMM d, h:mm a")}
                              </span>
                            )}
                            {event.user_count > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3 w-3 opacity-70" />
                                {event.user_count} interested
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs font-medium shrink-0 gap-1.5"
                        onClick={() => handleImportDiscordEvent(event)}
                        disabled={isImporting || importingId !== null}
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <span>Import</span>
                            <ArrowRight className="h-3 w-3" />
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
