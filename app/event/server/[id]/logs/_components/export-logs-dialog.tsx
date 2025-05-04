"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { EventLogType, EventLogTarget } from "@prisma/client";
import { format as formatDate } from "date-fns";

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

interface ExportLogsDialogProps {
  open: boolean;
  onClose: () => void;
  eventName: string;
  logs: SerializedEventLog[];
}

export function ExportLogsDialog({ open, onClose, eventName, logs }: ExportLogsDialogProps) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        let data: string;
        let fileName: string;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        
        if (format === "json") {
          data = JSON.stringify(logs, null, 2);
          fileName = `${eventName.replace(/\s+/g, "_")}_logs_${timestamp}.json`;
          downloadFile(data, fileName, "application/json");
        } else {
          data = convertToCSV(logs);
          fileName = `${eventName.replace(/\s+/g, "_")}_logs_${timestamp}.csv`;
          downloadFile(data, fileName, "text/csv");
        }
        
        onClose();
      } catch (error) {
        console.error("Export failed:", error);
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const downloadFile = (data: string, fileName: string, contentType: string) => {
    const blob = new Blob([data], { type: contentType });
    const link = document.createElement("a");
    link.download = fileName;
    link.href = window.URL.createObjectURL(blob);
    link.click();
  };

  const convertToCSV = (logs: SerializedEventLog[]): string => {
    // Define CSV headers
    const headers = [
      "ID",
      "Event ID",
      "User ID",
      "User Name",
      "Log Type",
      "Log Target",
      "Registration ID",
      "Created At",
      "Old Data",
      "New Data"
    ];
    
    // Convert logs to CSV rows
    const rows = logs.map(log => [
      log.id,
      log.event_id,
      log.user_id || "",
      log.user_name || "",
      log.log_type,
      log.log_target,
      log.registration_id || "",
      formatDate(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      JSON.stringify(log.old_data || ""),
      JSON.stringify(log.new_data || "")
    ]);
    
    // Join headers and rows
    return [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
  };

  return (
    <Dialog open={open} onOpenChange={() => !isExporting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Event Logs</DialogTitle>
          <DialogDescription>
            Export event logs in your preferred format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup
            value={format}
            onValueChange={(value) => setFormat(value as "json" | "csv")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json">
                JSON Format
                <span className="block text-xs text-muted-foreground">
                  Exports complete log data in JSON format
                </span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv">
                CSV Format
                <span className="block text-xs text-muted-foreground">
                  Exports log data in CSV format for spreadsheet programs
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {logs.length} Logs
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}