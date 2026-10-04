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
        return (
          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[11px] font-semibold">
            CREATE
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge variant="outline" className="bg-sky-500/15 text-sky-500 border-sky-500/30 text-[11px] font-semibold">
            UPDATE
          </Badge>
        );
      case "DELETE":
        return (
          <Badge variant="outline" className="bg-rose-500/15 text-rose-500 border-rose-500/30 text-[11px] font-semibold">
            DELETE
          </Badge>
        );
      default:
        return <Badge variant="outline">{logType}</Badge>;
    }
  };

  // Style badge based on log target
  const getLogTargetBadge = (logTarget: EventLogTarget) => {
    switch (logTarget) {
      case "EVENT":
        return (
          <Badge variant="outline" className="bg-muted/50 text-foreground border-border/60 text-[11px]">
            Event
          </Badge>
        );
      case "REGISTRATION":
        return (
          <Badge variant="outline" className="bg-muted/50 text-foreground border-border/60 text-[11px]">
            Registration
          </Badge>
        );
      default:
        return <Badge variant="outline">{logTarget}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-muted/10">
          <p className="text-sm font-medium text-foreground">No logs found</p>
          <p className="text-xs text-muted-foreground mt-1">
            No audit records match your current filter selection.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-2.5">
          {logs.map((log) => (
            <AccordionItem 
              key={log.id} 
              value={log.id}
              className="border border-border/50 bg-card/30 rounded-xl px-4 py-0.5 data-[state=open]:border-border/80 transition-colors"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-3 gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getLogTypeBadge(log.log_type)}
                    {getLogTargetBadge(log.log_target)}
                    <span className="text-xs font-mono text-muted-foreground">
                      {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {log.user_name ? (
                      <span className="bg-muted/40 px-2 py-0.5 rounded border border-border/40 font-medium text-foreground">
                        {log.user_name}
                      </span>
                    ) : (
                      <span>System</span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 border-t border-border/30 mt-1">
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pb-2 border-b border-border/40">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 opacity-70" />
                      <span>{format(new Date(log.created_at), 'PPpp')}</span>
                    </div>
                    
                    {log.user_name && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 opacity-70" />
                        <span>Action by: <strong className="text-foreground">{log.user_name}</strong></span>
                      </div>
                    )}
                    
                    {log.registration_id && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <Tag className="h-3.5 w-3.5 opacity-70" />
                        <span>Registration #{log.registration_id}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Data comparison section */}
                  <div>
                    {log.log_type === "UPDATE" && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          State Diff
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Previous Values</p>
                            <pre className="text-[11px] overflow-auto p-3 bg-background/80 rounded-lg border border-border/50 font-mono text-muted-foreground max-h-56 leading-relaxed">
                              {formatJson(log.old_data)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1">New Values</p>
                            <pre className="text-[11px] overflow-auto p-3 bg-background/80 rounded-lg border border-border/50 font-mono text-foreground max-h-56 leading-relaxed">
                              {formatJson(log.new_data)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {log.log_type === "CREATE" && log.new_data && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Created Record
                        </h4>
                        <pre className="text-[11px] overflow-auto p-3 bg-background/80 rounded-lg border border-border/50 font-mono text-foreground max-h-56 leading-relaxed">
                          {formatJson(log.new_data)}
                        </pre>
                      </div>
                    )}
                    
                    {log.log_type === "DELETE" && log.old_data && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-500">
                          Deleted Record
                        </h4>
                        <pre className="text-[11px] overflow-auto p-3 bg-background/80 rounded-lg border border-border/50 font-mono text-muted-foreground max-h-56 leading-relaxed">
                          {formatJson(log.old_data)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}