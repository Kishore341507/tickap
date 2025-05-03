"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Table, FileJson, Download } from "lucide-react";

interface RegistrationUser {
  user_id: bigint;
  registration_id: bigint;
  event_id: bigint;
  user_name: string | null;
  pfp: string | null;
}

interface Registration {
  id: bigint;
  event_id: bigint;
  team_name: string | null;
  registrationusers: RegistrationUser[];
}

interface ExportDataDialogProps {
  open: boolean;
  onClose: () => void;
  eventName: string;
  registrations: Registration[];
}

export function ExportDataDialog({
  open,
  onClose,
  eventName,
  registrations,
}: ExportDataDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState<"csv" | "json" | "excel">("csv");
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      let data;
      let mimeType;
      let fileName;
      
      if (format === "csv") {
        // Create CSV content
        let csvContent = "Team Name,User ID,User Name\n";
        registrations.forEach(registration => {
          registration.registrationusers.forEach(user => {
            csvContent += `"${registration.team_name || 'Unnamed Team'}",${user.user_id.toString()},"${user.user_name || 'Unknown User'}"\n`;
          });
        });
        data = csvContent;
        mimeType = 'text/csv;charset=utf-8;';
        fileName = `${eventName}-registrations.csv`;
      } else if (format === "json") {
        // Create JSON content
        data = JSON.stringify(registrations, (key, value) => {
          if (typeof value === "bigint") {
            return value.toString();
          }
          return value;
        }, 2);
        mimeType = 'application/json';
        fileName = `${eventName}-registrations.json`;
      } else {
        // For Excel, we'll just create a CSV that Excel can open
        let csvContent = "Team Name,User ID,User Name\n";
        registrations.forEach(registration => {
          registration.registrationusers.forEach(user => {
            csvContent += `"${registration.team_name || 'Unnamed Team'}",${user.user_id.toString()},"${user.user_name || 'Unknown User'}"\n`;
          });
        });
        data = csvContent;
        mimeType = 'text/csv;charset=utf-8;';
        fileName = `${eventName}-registrations.xlsx`;
      }
      
      // Create a Blob and download link
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `Registration data has been exported in ${format.toUpperCase()} format`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "There was a problem exporting the registration data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Registration Data</DialogTitle>
          <DialogDescription>
            Choose a format to export the registration data for this event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={format} onValueChange={(val) => setFormat(val as any)}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                CSV Format
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json" className="flex items-center">
                <FileJson className="h-4 w-4 mr-2" />
                JSON Format
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="excel" id="excel" />
              <Label htmlFor="excel" className="flex items-center">
                <Table className="h-4 w-4 mr-2" />
                Excel Format
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}