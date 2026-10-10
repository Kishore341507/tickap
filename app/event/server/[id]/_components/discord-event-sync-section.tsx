"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Sparkles,
  Link as LinkIcon,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

export interface DiscordScheduledEventOption {
  id: string;
  name: string;
  description?: string;
  scheduled_start_time: string;
  status: number;
  banner: string;
  user_count?: number;
}

interface DiscordEventSyncSectionProps {
  guildId: string;
  mode: "create" | "edit";
  currentDiscordEventId?: string | null;
  action: "create" | "link" | "none" | "unlink";
  selectedEventId?: string;
  onActionChange: (action: "create" | "link" | "none" | "unlink") => void;
  onSelectEventId: (id: string) => void;
  onImportValues?: (event: DiscordScheduledEventOption) => void;
}

export default function DiscordEventSyncSection({
  guildId,
  mode,
  currentDiscordEventId,
  action,
  selectedEventId,
  onActionChange,
  onSelectEventId,
  onImportValues,
}: DiscordEventSyncSectionProps) {
  const [events, setEvents] = useState<DiscordScheduledEventOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (action === "link" && events.length === 0) {
      const fetchEvents = async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/discord/guild/${guildId}/scheduled-events`);
          if (res.ok) {
            const data = await res.json();
            setEvents(data.events || []);
          }
        } catch (err) {
          console.error("Failed to load discord events", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEvents();
    }
  }, [action, guildId, events.length]);

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-semibold text-foreground">
              Discord Scheduled Event Integration
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Synchronize event information between TickAp and your Discord server.
            </p>
          </div>
        </div>
        {currentDiscordEventId && action !== "unlink" ? (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Synced</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] border-border/60 text-muted-foreground">
            Optional
          </Badge>
        )}
      </div>

      {mode === "edit" && currentDiscordEventId ? (
        <div className="space-y-3 pt-1">
          {action === "unlink" ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>This event will be unlinked from Discord upon saving.</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-foreground"
                onClick={() => onActionChange("none")}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-card/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <LinkIcon className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Linked Discord Event ID:</span>
                  <code className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono">
                    {currentDiscordEventId}
                  </code>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Updates to name, description, date, status, and banner will automatically sync to Discord.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20"
                  onClick={() => onActionChange("unlink")}
                >
                  <Unlink className="h-3.5 w-3.5 mr-1" />
                  <span>Unlink</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <RadioGroup
            value={action}
            onValueChange={(val) => onActionChange(val as any)}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
          >
            <div
              onClick={() => onActionChange("create")}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                action === "create"
                  ? "border-primary/60 bg-primary/10 shadow-xs"
                  : "border-border/50 bg-card/40 hover:bg-card/70"
              }`}
            >
              <RadioGroupItem value="create" id="action-create" className="mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="action-create" className="text-xs font-semibold cursor-pointer">
                  Create Discord Event
                </Label>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Publish a new scheduled event directly to your server.
                </p>
              </div>
            </div>

            <div
              onClick={() => onActionChange("link")}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                action === "link"
                  ? "border-primary/60 bg-primary/10 shadow-xs"
                  : "border-border/50 bg-card/40 hover:bg-card/70"
              }`}
            >
              <RadioGroupItem value="link" id="action-link" className="mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="action-link" className="text-xs font-semibold cursor-pointer">
                  Link Existing Event
                </Label>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Connect an existing Discord server event.
                </p>
              </div>
            </div>

            <div
              onClick={() => onActionChange("none")}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                action === "none"
                  ? "border-primary/60 bg-primary/10 shadow-xs"
                  : "border-border/50 bg-card/40 hover:bg-card/70"
              }`}
            >
              <RadioGroupItem value="none" id="action-none" className="mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="action-none" className="text-xs font-semibold cursor-pointer">
                  Don't Create / Link
                </Label>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  TickAp event only without touching Discord.
                </p>
              </div>
            </div>
          </RadioGroup>

          {action === "link" && (
            <div className="p-3 rounded-lg border border-border/60 bg-card/60 space-y-2 mt-2">
              <Label className="text-xs font-semibold">Select Discord Server Event</Label>
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading unlinked Discord events...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">
                  No unlinked upcoming Discord scheduled events found for this server.
                </div>
              ) : (
                <Select
                  value={selectedEventId || ""}
                  onValueChange={(val) => {
                    onSelectEventId(val);
                    const matched = events.find((e) => e.id === val);
                    if (matched && onImportValues) {
                      onImportValues(matched);
                    }
                  }}
                >
                  <SelectTrigger className="w-full text-xs h-10 bg-muted/20">
                    <SelectValue placeholder="Choose a Discord event..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[260px]">{ev.name}</span>
                          <span className="text-muted-foreground text-[10px]">
                            ({format(new Date(ev.scheduled_start_time), "MMM d, h:mm a")})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
