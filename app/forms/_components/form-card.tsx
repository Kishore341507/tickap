import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, FileText, Edit, BarChart3 } from "lucide-react";
import Link from "next/link";

interface FormCardProps {
  form: {
    id: bigint;
    title: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    guild_id: bigint | null;
  };
  showManagementButtons?: boolean;
  guildId?: string;
}

export default function FormCard({ form, showManagementButtons = false, guildId }: FormCardProps) {
  return (
    <Card className="transition-all hover:shadow-md border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg line-clamp-1">{form.title}</CardTitle>
          </div>
          <Badge variant={form.is_active ? "default" : "secondary"}>
            {form.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 mr-2" />
              Created: {new Date(form.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Updated: {new Date(form.updated_at).toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Link href={`/forms/${form.id}`} className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                View Form
              </Button>
            </Link>
            
            {showManagementButtons && guildId && (
              <div className="flex gap-2">
                <Link href={`/forms/server/${guildId}/edit/${form.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/forms/server/${guildId}/responses/${form.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Responses
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}