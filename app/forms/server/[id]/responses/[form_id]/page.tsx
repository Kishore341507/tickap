"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, FileText, User, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FormQuestion {
  id: bigint;
  question_text: string;
  question_type: string;
  question_order: number;
}

interface FormResponse {
  id: bigint;
  user_name: string | null;
  responses: any;
  submitted_at: Date;
}

interface FormData {
  id: bigint;
  title: string;
  is_active: boolean;
  form_questions: FormQuestion[];
  _count: {
    form_responses: number;
  };
}

export default function FormResponses() {
  const params = useParams();
  const guildId = params.id as string;
  const formId = params.form_id as string;
  
  const [form, setForm] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch form details
        const formResponse = await fetch(`/api/forms/${formId}`);
        if (!formResponse.ok) {
          throw new Error("Failed to fetch form");
        }
        const formData = await formResponse.json();
        setForm(formData);

        // Fetch responses
        const responsesResponse = await fetch(`/api/forms/${formId}/responses`);
        if (!responsesResponse.ok) {
          throw new Error("Failed to fetch responses");
        }
        const responsesData = await responsesResponse.json();
        setResponses(responsesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form responses");
      } finally {
        setIsLoading(false);
      }
    };

    if (formId) {
      fetchData();
    }
  }, [formId]);

  const exportToCSV = () => {
    if (!form || responses.length === 0) {
      toast.error("No data to export");
      return;
    }

    const questions = form.form_questions.sort((a, b) => a.question_order - b.question_order);
    
    // Create CSV headers
    const headers = ["Submission Date", "User Name", ...questions.map(q => q.question_text)];
    
    // Create CSV rows
    const rows = responses.map(response => {
      const parsedResponses = JSON.parse(response.responses);
      return [
        new Date(response.submitted_at).toLocaleString(),
        response.user_name || "Anonymous",
        ...questions.map(q => {
          const answer = parsedResponses[q.id.toString()];
          if (Array.isArray(answer)) {
            return answer.join(", ");
          }
          return answer || "";
        })
      ];
    });

    // Convert to CSV
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${form.title}_responses.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Form not found.</p>
      </div>
    );
  }

  const questions = form.form_questions.sort((a, b) => a.question_order - b.question_order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {form.title} - Responses
          </h1>
          <p className="text-muted-foreground mt-1">
            {responses.length} response{responses.length !== 1 ? 's' : ''} received
          </p>
        </div>
        
        {responses.length > 0 && (
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={form.is_active ? "default" : "secondary"}>
              {form.is_active ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses.length}</div>
          </CardContent>
        </Card>
      </div>

      {responses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No responses received yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Form Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User
                      </div>
                    </TableHead>
                    {questions.map((question) => (
                      <TableHead key={question.id.toString()} className="min-w-[200px]">
                        {question.question_text}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => {
                    const parsedResponses = JSON.parse(response.responses);
                    return (
                      <TableRow key={response.id.toString()}>
                        <TableCell>
                          {new Date(response.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {response.user_name || "Anonymous"}
                        </TableCell>
                        {questions.map((question) => {
                          const answer = parsedResponses[question.id.toString()];
                          let displayValue = "";
                          
                          if (Array.isArray(answer)) {
                            displayValue = answer.join(", ");
                          } else if (question.question_type === "CHECKBOX") {
                            displayValue = answer === "true" ? "Yes" : "No";
                          } else {
                            displayValue = answer || "";
                          }

                          return (
                            <TableCell key={question.id.toString()} className="max-w-xs">
                              <div className="truncate" title={displayValue}>
                                {displayValue}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}