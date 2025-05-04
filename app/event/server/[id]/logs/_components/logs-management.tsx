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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{event.name} - Activity Logs</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline">
                  Total Logs: {logs.length}
                </Badge>
                <Badge variant="outline">
                  Filtered: {filteredLogs.length}
                </Badge>
              </div>
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select 
                value={logTypeFilter} 
                onValueChange={setLogTypeFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Log Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={logTargetFilter} 
                onValueChange={setLogTargetFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Targets</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="REGISTRATION">Registration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <LogsList logs={filteredLogs} />
          </div>
        </CardContent>
      </Card>

      <ExportLogsDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        eventName={event.name}
        logs={filteredLogs}
      />
    </>
  );
}