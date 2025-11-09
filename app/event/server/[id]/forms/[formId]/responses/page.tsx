"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, ArrowLeft, Eye, Trash2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Answer {
  id: string;
  questionId: string;
  value: string;
}

interface Response {
  id: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  answers: Answer[];
}

interface Question {
  id: string;
  text: string;
  order: number;
}

interface FormData {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
  responses: Response[];
}

export default async function ResponsesViewerPage({ params }: { params: Promise<{ id: string; formId: string }> }) {
  const { id, formId } = await params;
  
  return <ResponsesViewerClient guildId={id} formId={formId} />;
}

function ResponsesViewerClient({ guildId, formId }: { guildId: string; formId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is authenticated and is a manager
  useEffect(() => {
    const checkAuthorization = async () => {
      if (status === "loading") {
        return;
      }

      if (status === "unauthenticated" || !session?.user?.userId) {
        router.push("/api/auth/signin");
        return;
      }

      try {
        const response = await fetch(`/api/discord/check-manager?userId=${session.user.userId}&guildId=${guildId}`);
        const data = await response.json();
        
        if (!data.isManager) {
          toast({ 
            title: "Access Denied", 
            description: "Only server managers can view form responses", 
            variant: "destructive" 
          });
          router.push(`/event/server/${guildId}`);
          return;
        }
        
        setIsManager(true);
      } catch (error) {
        toast({ 
          title: "Error", 
          description: "Failed to verify permissions", 
          variant: "destructive" 
        });
        router.push(`/event/server/${guildId}`);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthorization();
  }, [session, status, guildId, router, toast]);

  useEffect(() => {
    if (isManager) {
      fetchResponses();
    }
  }, [formId, isManager]);

  const fetchResponses = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`);
      if (!response.ok) throw new Error("Failed to fetch responses");
      
      const data = await response.json();
      setFormData(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load responses", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!formData) return;

    // Create CSV header
    const headers = ["Submitted At", "Name", "Email", ...formData.questions.map(q => q.text)];
    
    // Create CSV rows
    const rows = formData.responses.map(response => {
      const answerMap = new Map(response.answers.map(a => [a.questionId, a.value]));
      
      return [
        new Date(response.createdAt).toLocaleString(),
        response.userName || "",
        response.userEmail || "",
        ...formData.questions.map(q => answerMap.get(q.id) || ""),
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${formData.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Success", description: "Responses exported to CSV" });
  };

  const deleteForm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete form");
      }

      toast({ title: "Success", description: "Form deleted successfully" });
      router.push(`/event/server/${guildId}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete form", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  const getAnswerForQuestion = (response: Response, questionId: string) => {
    const answer = response.answers.find(a => a.questionId === questionId);
    return answer?.value || "-";
  };

  if (isCheckingAuth || status === "loading") {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Only server managers can view form responses
            </p>
            <Button onClick={() => router.push(`/event/server/${guildId}`)}>
              Back to Server
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Form not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{formData.title}</h1>
          <p className="text-muted-foreground">
            {formData.responses.length} response{formData.responses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/event/server/${guildId}/forms/${formId}/edit`}>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Edit Form
            </Button>
          </Link>
          <Button onClick={exportToCSV} disabled={formData.responses.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Form
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the form &quot;{formData.title}&quot;. All responses ({formData.responses.length}) will be preserved but the form will no longer be accessible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isDeleting ? "Deleting..." : "Delete Form"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Responses</CardTitle>
          <CardDescription>View all form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {formData.responses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No responses yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Submitted</TableHead>
                    <TableHead className="w-[150px]">Name</TableHead>
                    <TableHead className="w-[200px]">Email</TableHead>
                    {formData.questions.map((question) => (
                      <TableHead key={question.id} className="min-w-[200px]">
                        {question.text}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        {new Date(response.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{response.userName || "-"}</TableCell>
                      <TableCell>{response.userEmail || "-"}</TableCell>
                      {formData.questions.map((question) => (
                        <TableCell key={question.id}>
                          {getAnswerForQuestion(response, question.id)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push(`/event/server/${guildId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Server
        </Button>
      </div>
    </div>
  );
}
