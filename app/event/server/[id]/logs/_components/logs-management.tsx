"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download } from "lucide-react";
import { LogsList } from "./logs-list";
import { ExportLogsDialog } from "./export-logs-dialog";
import { EventLogType, EventLogTarget } from "@prisma/client";
import { Event } from "@/types";

// Extended EventLog type to handle JSON serialization
interface SerializedEventLog {
  id: string;
  event_id: string | bigint;
  user_id: string | null | bigint;
  user_name: string | null;
  log_type: EventLogType;
  log_target: EventLogTarget;
  old_data?: any;
  new_data?: any;
  registration_id: string | null | bigint;
  created_at: string | Date;
}

interface LogsManagementProps {
  eventId: string,
  guildId: string;
  event: Event;
  logs: SerializedEventLog[];
}

export function LogsManagement({ eventId, guildId, event, logs }: LogsManagementProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all");
  const [logTargetFilter, setLogTargetFilter] = useState<string>("all");

  logs = logs.map(log => ({
    ...log,
    event_id: log.event_id.toString(),
    user_id: log.user_id ? log.user_id.toString() : null,
    registration_id: log.registration_id ? log.registration_id.toString() : null,
  }));

  // Apply filters for search and type/target filtering
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchQuery === "" || 
        JSON.stringify(log).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.user_name && log.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesLogType = logTypeFilter === "all" || log.log_type === logTypeFilter;
      const matchesLogTarget = logTargetFilter === "all" || log.log_target === logTargetFilter;
      
      return matchesSearch && matchesLogType && matchesLogTarget;
    });
  }, [logs, searchQuery, logTypeFilter, logTargetFilter]);

  const createCount = logs.filter(l => l.log_type === "CREATE").length;
  const updateCount = logs.filter(l => l.log_type === "UPDATE").length;
  const deleteCount = logs.filter(l => l.log_type === "DELETE").length;

  return (
    <div className="space-y-6">
      {/* Quick Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Total Records
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {logs.length}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Creations
          </p>
          <p className="text-2xl font-bold tracking-tight text-emerald-500 mt-1">
            {createCount}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Updates
          </p>
          <p className="text-2xl font-bold tracking-tight text-sky-500 mt-1">
            {updateCount}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Deletions
          </p>
          <p className="text-2xl font-bold tracking-tight text-rose-500 mt-1">
            {deleteCount}
          </p>
        </div>
      </div>

      {/* Main Logs Card */}
      <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Audit Timeline
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Showing {filteredLogs.length} of {logs.length} events
              </CardDescription>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              className="h-9 text-xs"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="h-3.5 w-3.5 mr-1.5 opacity-70" />
              Export Logs
            </Button>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user, ID, or changes..."
                className="pl-9 h-9 text-xs bg-muted/30 border-border/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            
            <Select 
              value={logTypeFilter} 
              onValueChange={setLogTypeFilter}
            >
              <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/60">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={logTargetFilter} 
              onValueChange={setLogTargetFilter}
            >
              <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/60">
                <SelectValue placeholder="Target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                <SelectItem value="EVENT">Event</SelectItem>
                <SelectItem value="REGISTRATION">Registration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <LogsList logs={filteredLogs} />
        </CardContent>
      </Card>

      <ExportLogsDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        eventName={event.name}
        logs={filteredLogs}
      />
    </div>
  );
}