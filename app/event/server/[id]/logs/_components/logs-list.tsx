"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, User, Tag } from "lucide-react";
import { EventLogType, EventLogTarget } from "@prisma/client";

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

interface LogsListProps {
  logs: SerializedEventLog[];
}

export function LogsList({ logs }: LogsListProps) {
  // Helper function to format JSON for display
  const formatJson = (data: any) => {
    try {
      if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data, null, 2);
      }
      return String(data);
    } catch (error) {
      return "Unable to format data";
    }
  };

  // Style badge based on log type
  const getLogTypeBadge = (logType: EventLogType) => {
    switch (logType) {
      case "CREATE":
        return <Badge className="bg-green-500">Create</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-500">Update</Badge>;
      case "DELETE":
        return <Badge className="bg-red-500">Delete</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Style badge based on log target
  const getLogTargetBadge = (logTarget: EventLogTarget) => {
    switch (logTarget) {
      case "EVENT":
        return <Badge variant="outline">Event</Badge>;
      case "REGISTRATION":
        return <Badge variant="outline">Registration</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No logs found</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {logs.map((log) => (
            <AccordionItem key={log.id} value={log.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-2">
                    {getLogTypeBadge(log.log_type)}
                    {getLogTargetBadge(log.log_target)}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                    {log.user_name && <span>by {log.user_name}</span>}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="p-4 bg-muted/50 whitespace-pre-wrap">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(log.created_at), 'PPpp')}
                        </span>
                      </div>
                      
                      {log.user_name && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{log.user_name}</span>
                        </div>
                      )}
                      
                      {log.registration_id && (
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4" />
                          <span className="text-sm">Registration ID: {log.registration_id}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Data comparison section */}
                    <div className="space-y-2">
                      {log.log_type === "UPDATE" && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Changes:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Before:</p>
                              <pre className="text-xs overflow-auto p-2 bg-background rounded-md max-h-48">
                                {formatJson(log.old_data)}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">After:</p>
                              <pre className="text-xs overflow-auto p-2 bg-background rounded-md max-h-48">
                                {formatJson(log.new_data)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {log.log_type === "CREATE" && log.new_data && (
                        <div>
                          <h4 className="text-sm font-medium">Created Data:</h4>
                          <pre className="text-xs overflow-auto p-2 bg-background rounded-md max-h-48">
                            {formatJson(log.new_data)}
                          </pre>
                        </div>
                      )}
                      
                      {log.log_type === "DELETE" && log.old_data && (
                        <div>
                          <h4 className="text-sm font-medium">Deleted Data:</h4>
                          <pre className="text-xs overflow-auto p-2 bg-background rounded-md max-h-48">
                            {formatJson(log.old_data)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}