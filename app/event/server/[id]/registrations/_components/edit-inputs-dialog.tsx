"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { Registration } from "@/types";

interface EditInputsDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (registration: Registration) => void;
  eventId: string;
  registration: Registration | null;
}

interface FormFieldItem {
  id: string | number;
  label: string;
  value: string;
  isLong: boolean;
}

export function EditInputsDialog({
  open,
  onClose,
  onUpdate,
  eventId,
  registration,
}: EditInputsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [originalExtraType, setOriginalExtraType] = useState<"dict" | "array" | "other">("dict");
  const [rawParsedExtra, setRawParsedExtra] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !registration?.extra) {
      setFields([]);
      setRawParsedExtra(null);
      return;
    }

    try {
      let data = typeof registration.extra === "string"
        ? JSON.parse(registration.extra)
        : registration.extra;

      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {}
      }

      setRawParsedExtra(data);

      if (Array.isArray(data)) {
        setOriginalExtraType("array");
        const parsedFields: FormFieldItem[] = data.map((item, idx) => {
          let label = `Question ${idx + 1}`;
          let val = "";
          if (item && typeof item === "object") {
            label = item.text || item.question || item.label || `Question ${idx + 1}`;
            val = item.value ?? item.answer ?? item.val ?? "";
          } else {
            val = String(item ?? "");
          }
          const valStr = Array.isArray(val) ? val.join(", ") : String(val);
          return {
            id: idx,
            label,
            value: valStr,
            isLong: valStr.length > 60 || valStr.includes("\n"),
          };
        });
        setFields(parsedFields);
      } else if (data && typeof data === "object") {
        setOriginalExtraType("dict");
        const parsedFields: FormFieldItem[] = Object.entries(data).map(([key, val]) => {
          const valStr = Array.isArray(val)
            ? val.join(", ")
            : typeof val === "boolean"
            ? (val ? "true" : "false")
            : String(val ?? "");
          return {
            id: key,
            label: key,
            value: valStr,
            isLong: valStr.length > 60 || valStr.includes("\n"),
          };
        });
        setFields(parsedFields);
      } else {
        setOriginalExtraType("other");
        setFields([]);
      }
    } catch {
      setFields([]);
    }
  }, [open, registration]);

  const handleFieldChange = (id: string | number, newValue: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value: newValue } : f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) return;

    setIsLoading(true);

    try {
      let updatedExtra: any = null;

      if (originalExtraType === "dict") {
        updatedExtra = {};
        for (const f of fields) {
          const originalVal = rawParsedExtra ? rawParsedExtra[f.id] : undefined;
          if (typeof originalVal === "boolean") {
            updatedExtra[f.id] = f.value.toLowerCase() === "true" || f.value.toLowerCase() === "yes";
          } else if (Array.isArray(originalVal)) {
            updatedExtra[f.id] = f.value.split(",").map((s) => s.trim()).filter(Boolean);
          } else {
            updatedExtra[f.id] = f.value;
          }
        }
      } else if (originalExtraType === "array") {
        const cloned = JSON.parse(JSON.stringify(rawParsedExtra || []));
        for (const f of fields) {
          const idx = Number(f.id);
          if (cloned[idx] && typeof cloned[idx] === "object") {
            if ("value" in cloned[idx]) {
              cloned[idx].value = f.value;
            } else if ("answer" in cloned[idx]) {
              cloned[idx].answer = f.value;
            } else {
              cloned[idx].value = f.value;
            }
          } else {
            cloned[idx] = f.value;
          }
        }
        updatedExtra = cloned;
      } else {
        updatedExtra = rawParsedExtra;
      }

      const response = await fetch(`/api/events/${eventId}/register/manager`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_inputs",
          registration_id: registration.id.toString(),
          extra: updatedExtra,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update custom answers");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: "Custom answers updated successfully",
      });

      onUpdate(data.registration);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update answers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-semibold text-foreground">
            Edit Custom Answers
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Update responses for {registration?.team_name || "this registration"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {fields.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No custom questions found for this registration.
              </p>
            ) : (
              fields.map((field) => (
                <div key={String(field.id)} className="space-y-1.5">
                  <Label htmlFor={`field-${field.id}`} className="text-xs font-medium text-foreground">
                    {field.label}
                  </Label>
                  {field.isLong ? (
                    <Textarea
                      id={`field-${field.id}`}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      rows={3}
                      className="text-xs bg-muted/20 border-border/60 resize-none focus-visible:ring-1"
                    />
                  ) : (
                    <Input
                      id={`field-${field.id}`}
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="text-xs h-9 bg-muted/20 border-border/60 focus-visible:ring-1"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border/40 bg-muted/10 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || fields.length === 0}
              className="text-xs h-9"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
