"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

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
    <Link href={viewUrl}>
      <Card className="border-secondary hover:scale-105 duration-500 ease-in-out cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <FileText className="h-8 w-8 text-primary mb-2" />
          </div>
          <CardTitle className="line-clamp-2">{form.title}</CardTitle>
          {form.description && (
            <CardDescription className="line-clamp-2">
              {form.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{form.questions.length} question{form.questions.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>{form.responses.length} response{form.responses.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(form.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
