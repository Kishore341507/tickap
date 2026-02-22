"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { 
  Loader2, 
  Trash2, 
  Download, 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  MoreHorizontal,
  ArrowUpDown,
  Search,
  ShieldAlert,
  Copy,
  Check,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";  
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

// Interfaces
interface Answer {
  id: string;
  questionId: string;
  value: string;
}

interface Response {
  id: string;
  userName: string | null;
  userId: string | null;
  createdAt: string;
  answers: Answer[];
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  custom_message: string | null;
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
  custom_response: boolean;
  accept_response: string | null;
  reject_response: string | null;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Helper Components
function ResponsesSkeleton() {
  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
                 <Skeleton className="h-10 w-32" />
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mb-6">
        <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* Date Range Filter */}
                    <Skeleton className="h-10 w-[240px]" />

                    {/* Sort */}
                    <Skeleton className="h-10 w-[180px]" />
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">      
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                              <Skeleton className="h-4 w-4" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[60px]">S.No</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[180px]">
                              Submitted At
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[150px]">Name</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[150px]">User ID</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[120px]">Status</th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                      {Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                              <td className="p-4 py-1 align-middle"><Skeleton className="h-4 w-4" /></td>
                              <td className="p-4 py-1 align-middle"><Skeleton className="h-4 w-8" /></td>
                              <td className="p-4 py-1 align-middle">
                                  <div className="flex flex-col gap-1">
                                      <Skeleton className="h-4 w-24" />
                                      <Skeleton className="h-3 w-16" />
                                  </div>
                              </td>
                              <td className="p-4 py-1 align-middle"><Skeleton className="h-4 w-24" /></td>
                              <td className="p-4 py-1 align-middle"><Skeleton className="h-4 w-32" /></td>
                              <td className="p-4 py-1 align-middle"><Skeleton className="h-5 w-20 rounded-full" /></td>
                              <td className="p-4 py-1 align-middle text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CopyAction({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className={cn("h-6 w-6 ml-2 hover:bg-muted", className)} 
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500 animate-in zoom-in spin-in-180" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
      <span className="sr-only">Copy</span>
    </Button>
  );
}

export default function ResponsesViewerPage({
  params,
}: {
  params: Promise<{ id: string; formId: string }>;
}) {
  const { id, formId } = use(params);

  return (
    <ResponsesViewerClient
      guildId={id}
      formId={formId}
    />
  );
}

function ResponsesViewerClient({
  guildId,
  formId,
}: {
  guildId: string;
  formId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();

  // State
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Filter & Sort State
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [selectedResponses, setSelectedResponses] = useState<Set<string>>(
    new Set()
  );
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Response Detail View State
  const [viewingResponseId, setViewingResponseId] = useState<string | null>(null);

  // Status Change State
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    responseId: string | null;
    newStatus: "ACCEPTED" | "REJECTED" | null;
    message: string;
  }>({
    open: false,
    responseId: null,
    newStatus: null,
    message: "",
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Initialize auth check
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

  // Fetch Data
  useEffect(() => {
    if (isManager) {
      fetchResponses();
    }
  }, [formId, isManager]);

  const fetchResponses = async () => {
    try {
      // Don't reset loading to true on refetch to avoid flicker, only on initial load
      if (!formData) setIsLoading(true);
      
      const res = await fetch(`/api/forms/${formId}`);
      if (!res.ok) throw new Error("Failed to fetch form");
      const data = await res.json();
      setFormData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load responses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Derived Data (Filtering & Sorting)
  const filteredResponses = useMemo(() => {
    if (!formData) return [];

    let result = [...formData.responses];

    // Filter by Date Range
    if (dateRange.from) {
      result = result.filter((r) => {
        const date = new Date(r.createdAt);
        if (date < dateRange.from!) return false;
        if (dateRange.to) {
            // Add 1 day to include the end date fully
            const endDate = new Date(dateRange.to);
            endDate.setHours(23, 59, 59, 999);
            if (date > endDate) return false;
        }
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [formData, dateRange, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);
  
  // Adjust current page if it exceeds total pages after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedResponses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResponses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResponses, currentPage, itemsPerPage]);

  // Navigate Responses Logic
  const selectedResponse = useMemo(() => {
    if (!viewingResponseId) return null;
    return filteredResponses.find(r => r.id === viewingResponseId);
  }, [filteredResponses, viewingResponseId]);

  const selectedIdx = useMemo(() => {
    if (!viewingResponseId) return -1;
    return filteredResponses.findIndex(r => r.id === viewingResponseId);
  }, [filteredResponses, viewingResponseId]);

  const handleNextResponse = () => {
    if (selectedIdx !== -1 && selectedIdx < filteredResponses.length - 1) {
      setViewingResponseId(filteredResponses[selectedIdx + 1].id);
    }
  };

  const handlePrevResponse = () => {
    if (selectedIdx > 0) {
      setViewingResponseId(filteredResponses[selectedIdx - 1].id);
    }
  };

  // Keyboard navigation for dialog
  useEffect(() => {
    if (!viewingResponseId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevResponse();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextResponse();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingResponseId, selectedIdx, filteredResponses]);

  // Auto-open newest response on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && filteredResponses.length > 0 && !viewingResponseId) {
      setViewingResponseId(filteredResponses[0].id);
    }
  }, [filteredResponses]);

  // Selection Logic
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all filtered responses
      const allIds = new Set(filteredResponses.map((r) => r.id));
      setSelectedResponses(allIds);
    } else {
      setSelectedResponses(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedResponses);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedResponses(newSelected);
  };

  const isAllSelected = filteredResponses.length > 0 && selectedResponses.size === filteredResponses.length;
  const isIndeterminate = selectedResponses.size > 0 && selectedResponses.size < filteredResponses.length;

  // Pagination Helper
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        // Always show first page
        pages.push(1);
        
        if (currentPage > 3) pages.push('...');
        
        // Show pages around current
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
             pages.push(i);
        }
        
        if (currentPage < totalPages - 2) pages.push('...');
        
        // Always show last page
        if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  // Actions
  const handleUpdateStatus = (
    id: string, 
    newStatus: "PENDING" | "ACCEPTED" | "REJECTED"
  ) => {
    // If pending, just update directly
    if (newStatus === "PENDING") {
      confirmStatusUpdate(id, newStatus, null);
      return;
    }

    // Determine the default message based on status
    const defaultMsg = newStatus === "ACCEPTED" 
      ? formData?.accept_response 
      : formData?.reject_response;

    // If custom_response is enabled, always open dialog
    // It will be pre-filled with default message if available
    if (formData?.custom_response) {
      setStatusDialog({
        open: true,
        responseId: id,
        newStatus: newStatus,
        message: defaultMsg || "",
      });
      return;
    }

    // If custom_response is disabled, update directly
    // Use default message if available, otherwise use generic message
    const finalMsg = defaultMsg || (newStatus === "ACCEPTED" 
      ? "Your submission has been accepted." 
      : "Your submission has been rejected.");

    confirmStatusUpdate(id, newStatus, finalMsg);
  };

  const confirmStatusUpdate = async (
    id: string | null, 
    status: "PENDING" | "ACCEPTED" | "REJECTED" | null, 
    message: string | null
  ) => {
    if (!id || !status) return;

    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`/api/forms/${formId}/responses/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: status,
          custom_message: message 
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      const updatedResponse = await res.json();
      
      // Update local state
      if (formData) {
        setFormData({
            ...formData,
            responses: formData.responses.map(r => 
                r.id === id ? { ...r, status: status, custom_message: message } : r
            )
        });
      }

      toast({ title: "Success", description: `Response marked as ${status.toLowerCase()}` });
      setStatusDialog({ open: false, responseId: null, newStatus: null, message: "" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/forms/${formId}/responses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseIds: [id] }),
      });

      if (!res.ok) throw new Error("Failed to delete");
      
      toast({ title: "Success", description: "Response deleted" });
      
      // Update local state
      if (formData) {
        setFormData({
            ...formData,
            responses: formData.responses.filter(r => r.id !== id)
        });
        // Remove from selection if selected
        if (selectedResponses.has(id)) {
            const newSelected = new Set(selectedResponses);
            newSelected.delete(id);
            setSelectedResponses(newSelected);
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete response", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedResponses.size === 0) return;
    
    try {
      const idsToDelete = Array.from(selectedResponses);
      const res = await fetch(`/api/forms/${formId}/responses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseIds: idsToDelete }),
      });

      if (!res.ok) throw new Error("Failed to delete");
      
      toast({ title: "Success", description: `${idsToDelete.length} responses deleted` });
      
      // Update local state
      if (formData) {
        setFormData({
            ...formData,
            responses: formData.responses.filter(r => !selectedResponses.has(r.id))
        });
        setSelectedResponses(new Set());
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete responses", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    if (!formData) return;

    // Use filtered responses for export? Or all? Usually current view.
    // Let's use filteredResponses so user can filter by date then export.
    const dataToExport = filteredResponses;

    // Create CSV header
    const headers = ["Submitted At", "Name", "User ID", ...formData.questions.map(q => q.text)];
    
    // Create CSV rows
    const rows = dataToExport.map(response => {
      const answerMap = new Map(response.answers.map(a => [a.questionId, a.value]));
      
      return [
        new Date(response.createdAt).toLocaleString(),
        response.userName || "",
        response.userId || "",
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

  // Render Helpers
  if (isCheckingAuth || status === "loading" || isLoading) {
    return <ResponsesSkeleton />;
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

  // Get start serial number
  // If Newest -> Oldest, current page starts from 1? No, usually 1 is the 1st row shown.
  // Requirement: "responses with serial numbers starting from 1 to the end"
  // If I have 100 responses, sorted newest to oldest. Page 1 shows 1-10. Row 1 is Serial 1.
  const getSerialNumber = (index: number) => {
    return (currentPage - 1) * itemsPerPage + index + 1;
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 mb-2">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-3xl font-bold break-words">{formData.title}</h1>
                    <p className="text-muted-foreground text-sm">
                        {formData.responses.length} total responses
                    </p>
                </div>
                <Button variant="outline" className="hidden md:flex shrink-0" onClick={() => router.push(`/event/server/${guildId}`)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Server
                </Button>
            </div>
            <Button variant="outline" className="md:hidden w-full" onClick={() => router.push(`/event/server/${guildId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Server
            </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mb-6">
        <CardContent className="p-4">
            <div className="flex flex-col gap-4">
                {/* Delete Button Row (Mobile Only - When Selected) */}
                {selectedResponses.size > 0 && (
                    <div className="md:hidden">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete ({selectedResponses.size})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete {selectedResponses.size} responses?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. These responses will be permanently deleted.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:w-auto">
                        {/* Date Range Filter */}
                        <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !dateRange.from && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? (
                                dateRange.to ? (
                                    <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                                ) : (
                                <span>Filter by Date</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange.from}
                                selected={dateRange}
                                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
                        {(dateRange.from || dateRange.to) && (
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setDateRange({ from: undefined, to: undefined })}
                             >
                                Clear
                             </Button>
                        )}
                    </div>

                    {/* Sort */}
                    <Select value={sortOrder} onValueChange={(v: "newest" | "oldest") => setSortOrder(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest → Oldest</SelectItem>
                            <SelectItem value="oldest">Oldest → Newest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        {/* Delete Button (Desktop Only) */}
                        {selectedResponses.size > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="hidden md:flex">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete ({selectedResponses.size})
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete {selectedResponses.size} responses?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. These responses will be permanently deleted.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        
                        <Button variant="outline" size="sm" asChild>
                        <Link href={`/event/server/${guildId}/forms/${formId}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="block">
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                checked={isAllSelected}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead className="hidden md:table-cell w-[60px]">S.No</TableHead>
                        <TableHead className="w-[180px]">
                            <Button variant="ghost" size="sm" className="-ml-3 h-8 hover:bg-transparent px-3" onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}>
                                Submitted At
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell w-[150px]">Name</TableHead>
                        <TableHead className="hidden md:table-cell w-[150px]">User ID</TableHead>
                        <TableHead className="hidden md:table-cell w-[120px]">Status</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedResponses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No results found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedResponses.map((response, index) => (
                            <TableRow 
                                key={response.id} 
                                data-state={selectedResponses.has(response.id) && "selected"}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setViewingResponseId(response.id)}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()} className="py-1" >
                                    <Checkbox 
                                        checked={selectedResponses.has(response.id)}
                                        onCheckedChange={(checked) => handleSelectOne(response.id, checked as boolean)}
                                        aria-label="Select row"
                                    />
                                </TableCell>
                                <TableCell className="hidden md:table-cell py-1" >{getSerialNumber(index)}</TableCell>
                                <TableCell className="py-1" >
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {format(new Date(response.createdAt), "MMM d, yyyy")}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                             {format(new Date(response.createdAt), "h:mm a")}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell py-1">{response.userName || "-"}</TableCell>
                                <TableCell className="hidden md:table-cell py-1 font-mono text-xs">{response.userId || "-"}</TableCell>
                                <TableCell className="hidden md:table-cell py-1">
                                  {(!response.status || response.status === "PENDING") && (
                                    <Badge variant="secondary" className="gap-1">
                                      <Clock className="h-3 w-3" /> Pending
                                    </Badge>
                                  )}
                                  {response.status === "ACCEPTED" && (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> Accepted
                                    </Badge>
                                  )}
                                  {response.status === "REJECTED" && (
                                    <Badge variant="destructive" className="gap-1">
                                      <XCircle className="h-3 w-3" /> Rejected
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-right py-1" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(response.id, "ACCEPTED")}>
                                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Accept Response
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(response.id, "REJECTED")}>
                                              <XCircle className="mr-2 h-4 w-4 text-destructive" /> Reject Response
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => {
                                                const ids = new Set([response.id]);
                                                setSelectedResponses(ids);
                                            }} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Response
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between px-2 py-4 gap-4">
        <div className="flex-1 text-sm text-muted-foreground order-2 md:order-1">
            Showing {filteredResponses.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredResponses.length)} of {filteredResponses.length} entries
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8 order-1 md:order-2">
            <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[10, 20, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                                className={cn("cursor-pointer", currentPage <= 1 && "pointer-events-none opacity-50")}
                            />
                        </PaginationItem>
                        
                        {getPageNumbers().map((page, i) => (
                            <PaginationItem key={i}>
                                {page === '...' ? (
                                    <PaginationEllipsis />
                                ) : (
                                    <PaginationLink 
                                        href="#" 
                                        isActive={currentPage === page}
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(page as number); }}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext 
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                                className={cn("cursor-pointer", currentPage >= totalPages ? "pointer-events-none opacity-50" : "")}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
      </div>

      {selectedResponse && (
        <Sheet open={!!viewingResponseId} onOpenChange={(open) => !open && setViewingResponseId(null)}>
          <SheetContent className="flex flex-col h-full w-full sm:max-w-xl">
            <SheetHeader className="pb-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                   <SheetTitle>Response Details</SheetTitle>
                   <SheetDescription>Review submitted answers</SheetDescription>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 shrink-0"
                    onClick={() => {
                        const lines = [
                            `User: ${selectedResponse.userName || "Unknown"}`,
                            `User ID: ${selectedResponse.userId}`,
                            `Submitted: ${new Date(selectedResponse.createdAt).toLocaleString()}`,
                            `--------------------`,
                        ];
                        
                        formData?.questions.forEach(q => {
                            const answer = selectedResponse.answers.find(a => a.questionId === q.id);
                            lines.push(`Q: ${q.text}`);
                            lines.push(`A: ${answer?.value || "No answer"}`);
                            lines.push(``);
                        });
                        
                        navigator.clipboard.writeText(lines.join('\n'));
                        toast({ title: "Copied", description: "Full response details copied" });
                    }}
                >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy All
                </Button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
                <Avatar className="h-10 w-10 border bg-background">
                  <AvatarImage />
                  <AvatarFallback>{selectedResponse.userName?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium truncate text-sm">{selectedResponse.userName || "Unknown User"}</span>
                  <div className="flex items-center text-xs text-muted-foreground font-mono mt-0.5 group cursor-pointer hover:text-foreground transition-colors"
                       onClick={() => navigator.clipboard.writeText(selectedResponse.userId || "")}
                       title="Click to copy User ID"
                  >
                      <span className="truncate max-w-[180px]">{selectedResponse.userId}</span>
                      <CopyAction text={selectedResponse.userId || ""} className="h-4 w-4 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground whitespace-nowrap pl-2 border-l ml-2">
                    {format(new Date(selectedResponse.createdAt), "MMM d, y")}
                    <br />
                    {format(new Date(selectedResponse.createdAt), "h:mm a")}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-muted/40 rounded-lg border">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    {(!selectedResponse.status || selectedResponse.status === "PENDING") && (
                        <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" /> Pending
                        </Badge>
                    )}
                    {selectedResponse.status === "ACCEPTED" && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Accepted
                        </Badge>
                    )}
                    {selectedResponse.status === "REJECTED" && (
                        <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" /> Rejected
                        </Badge>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {selectedResponse.status !== "ACCEPTED" && (
                        <Button size="sm" variant="outline" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 w-full sm:w-auto" onClick={() => handleUpdateStatus(selectedResponse.id, "ACCEPTED")}>
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Accept
                        </Button>
                    )}
                    {selectedResponse.status !== "REJECTED" && (
                        <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto" onClick={() => handleUpdateStatus(selectedResponse.id, "REJECTED")}>
                            <XCircle className="mr-2 h-3.5 w-3.5" /> Reject
                        </Button>
                    )}
                </div>
              </div>
            </SheetHeader>
            <Separator />
            
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6 py-6">
                {formData?.questions.map((question) => {
                  const answer = selectedResponse.answers.find(a => a.questionId === question.id);
                  const answerText = answer?.value || "";
                  return (
                    <div key={question.id} className="space-y-1.5 group/item">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">{question.text}</h4>
                        {answerText && (
                            <CopyAction text={answerText} className="opacity-0 group-hover/item:opacity-100 transition-opacity h-6 w-6" />
                        )}
                      </div>
                      <div className="text-sm p-3 bg-card rounded-md border text-card-foreground whitespace-pre-wrap">
                        {answerText || <span className="text-muted-foreground italic">No answer</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t mt-auto">
                <Pagination>
                    <PaginationContent className="w-full justify-between">
                        <PaginationItem>
                            <PaginationPrevious 
                                href="#"
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    handlePrevResponse(); 
                                }}
                                className={cn("cursor-pointer", selectedIdx <= 0 && "pointer-events-none opacity-50")}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <span className="text-sm text-muted-foreground">
                                Response {selectedIdx + 1} of {filteredResponses.length}
                            </span>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext 
                                href="#"
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    handleNextResponse(); 
                                }}
                                className={cn("cursor-pointer", selectedIdx >= filteredResponses.length - 1 && "pointer-events-none opacity-50")}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Status Update Dialog */}
      <Dialog 
        open={statusDialog.open} 
        onOpenChange={(open) => !open && setStatusDialog({ ...statusDialog, open: false })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusDialog.newStatus === "ACCEPTED" ? "Accept Response" : "Reject Response"}
            </DialogTitle>
            <DialogDescription>
              Custom message to be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="custom-message">Reply Message</Label>
              <Textarea
                id="custom-message"
                value={statusDialog.message}
                onChange={(e) => setStatusDialog({ ...statusDialog, message: e.target.value })}
                placeholder="Enter your message here..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStatusDialog({ ...statusDialog, open: false })}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button 
              variant={statusDialog.newStatus === "ACCEPTED" ? "default" : "destructive"}
              onClick={() => confirmStatusUpdate(statusDialog.responseId, statusDialog.newStatus, statusDialog.message)}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {statusDialog.newStatus === "ACCEPTED" ? "Accept" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
