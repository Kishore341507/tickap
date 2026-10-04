"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface FormCardProps {
  form: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date | string;
    questions: any[];
    responses: any[];
    userId?: string | null;
  };
  showActions?: boolean;
  guildId?: string;
}

export default function FormCard({ form, showActions = false, guildId }: FormCardProps) {
  const viewUrl = showActions && guildId 
    ? `/event/server/${guildId}/forms/${form.id}/responses` 
    : `/event/forms/${form.id}`;

  return (
    <Link href={viewUrl} className="block group h-full focus-visible:outline-none">
      <Card className="rounded-xl border border-border/60 bg-card/40 hover:bg-card/80 hover:border-border hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between overflow-hidden">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {new Date(form.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
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
    </Link>
  );
}
