"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  MessageSquare, 
  ArrowRight, 
  Trash2, 
  MoreVertical, 
  Edit, 
  ExternalLink, 
  Loader2 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FormCardProps {
  form: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date | string;
    questions: any[];
    responses: any[];
    userId?: string | null;
    is_deleted?: boolean | null;
  };
  showActions?: boolean;
  guildId?: string;
  onDeleted?: (formId: string) => void;
}

export default function FormCard({ 
  form, 
  showActions = false, 
  guildId,
  onDeleted 
}: FormCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  if (isDeleted) {
    return null;
  }

  const viewUrl = showActions && guildId 
    ? `/event/server/${guildId}/forms/${form.id}/responses` 
    : `/event/forms/${form.id}`;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete form");
      }

      toast({
        title: "Form Deleted",
        description: `"${form.title}" was soft deleted successfully.`,
      });

      setIsDeleted(true);
      setDeleteDialogOpen(false);
      onDeleted?.(form.id);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Failed to delete form",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="relative group h-full focus-visible:outline-none">
        <Card 
          onClick={() => router.push(viewUrl)}
          className="cursor-pointer rounded-xl border border-border/60 bg-card/40 hover:bg-card/80 hover:border-border hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between overflow-hidden relative"
        >
          {/* Working / Deleting State Overlay */}
          {isDeleting && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/85 backdrop-blur-xs rounded-xl transition-all">
              <Loader2 className="h-6 w-6 animate-spin text-destructive mb-2" />
              <span className="text-xs font-medium text-foreground">Working...</span>
            </div>
          )}

          <CardHeader className="p-5 pb-3">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>

              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {new Date(form.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>

                {showActions && guildId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        title="Form actions"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem 
                        onClick={() => router.push(`/event/server/${guildId}/forms/${form.id}/responses`)}
                        className="text-xs cursor-pointer"
                      >
                        <MessageSquare className="mr-2 h-3.5 w-3.5 opacity-70" />
                        Responses
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => router.push(`/event/server/${guildId}/forms/${form.id}/edit`)}
                        className="text-xs cursor-pointer"
                      >
                        <Edit className="mr-2 h-3.5 w-3.5 opacity-70" />
                        Edit Form
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => router.push(`/event/forms/${form.id}`)}
                        className="text-xs cursor-pointer"
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5 opacity-70" />
                        Fill Form
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete Form
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <CardTitle className="text-base font-semibold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {form.title}
            </CardTitle>
            {form.description && (
              <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {form.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="p-5 pt-0">
            <div className="flex items-center gap-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium">
                <FileText className="h-3.5 w-3.5 opacity-70" />
                {form.questions.length} question{form.questions.length !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                {form.responses.length} response{form.responses.length !== 1 ? "s" : ""}
              </span>
              <span className="ml-auto text-xs font-medium text-foreground/80 group-hover:text-foreground flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                {showActions ? "Responses" : "Fill Form"}
                <ArrowRight className="h-3 w-3 opacity-60" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog for Soft Deleting the Form */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !isDeleting && setDeleteDialogOpen(open)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Delete Form</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{form.title}&quot;</span>? This form will be soft deleted and will no longer be visible or accessible on TickAp to anyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel 
              disabled={isDeleting} 
              className="rounded-xl text-xs font-medium"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Working...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Form</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
