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
  Edit,
  ChevronRight,
  ChevronLeft,
  Filter,
  FileText,
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
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Header skeleton */}
      <div className="flex justify-between items-center pb-6 border-b border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-7 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Toolbar skeleton */}
      <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </Card>

      {/* Table skeleton */}
      <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-2 border-b border-border/30 last:border-0">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-8 rounded" />
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");
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

  // Stats summary calculation
  const stats = useMemo(() => {
    if (!formData) return { total: 0, accepted: 0, pending: 0, rejected: 0 };
    const total = formData.responses.length;
    const accepted = formData.responses.filter((r) => r.status === "ACCEPTED").length;
    const rejected = formData.responses.filter((r) => r.status === "REJECTED").length;
    const pending = formData.responses.filter((r) => !r.status || r.status === "PENDING").length;
    return { total, accepted, pending, rejected };
  }, [formData]);

  // Derived Data (Filtering & Sorting)
  const filteredResponses = useMemo(() => {
    if (!formData) return [];

    let result = [...formData.responses];

    // Filter by search query (username or userId)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.userName?.toLowerCase().includes(q) ||
          r.userId?.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      result = result.filter((r) => {
        if (statusFilter === "PENDING") {
          return !r.status || r.status === "PENDING";
        }
        return r.status === statusFilter;
      });
    }

    // Filter by Date Range
    if (dateRange.from) {
      result = result.filter((r) => {
        const date = new Date(r.createdAt);
        if (date < dateRange.from!) return false;
        if (dateRange.to) {
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
  }, [formData, searchQuery, statusFilter, dateRange, sortOrder]);

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
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full rounded-2xl border border-border/60 bg-card/40 shadow-sm text-center p-6">
          <CardContent className="pt-2 space-y-4">
            <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto text-destructive">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Access Denied</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Only server managers can view questionnaire responses.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => router.push(`/event/server/${guildId}`)} className="text-xs">
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back to Server
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-md">
        <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm text-center p-6">
          <CardContent className="pt-2 space-y-3">
            <p className="text-sm text-muted-foreground">Form not found</p>
            <Button size="sm" variant="outline" onClick={() => router.push(`/event/server/${guildId}`)} className="text-xs">
              Back to Server
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSerialNumber = (index: number) => {
    return (currentPage - 1) * itemsPerPage + index + 1;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/event" className="hover:text-foreground transition-colors">
            Events
          </Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <Link href={`/event/server/${guildId}`} className="hover:text-foreground transition-colors font-mono">
            {guildId.slice(0, 10)}...
          </Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <Link href={`/event/forms/guild/${guildId}`} className="hover:text-foreground transition-colors">
            Forms
          </Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="text-foreground font-medium truncate max-w-[140px] sm:max-w-xs">{formData.title}</span>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="text-foreground font-medium">Responses</span>
        </div>

        <Button variant="outline" size="sm" onClick={() => router.push(`/event/server/${guildId}`)} className="h-8 text-xs">
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Back to Server
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{formData.title}</h1>
            <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary">
              Responses
            </Badge>
          </div>
          {formData.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl line-clamp-2">
              {formData.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild className="h-9 text-xs">
            <Link href={`/event/server/${guildId}/forms/${formId}/edit`}>
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Edit Form
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="h-9 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Responses</p>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Accepted</p>
          <p className="text-2xl font-bold tracking-tight text-green-500 mt-1">{stats.accepted}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pending Review</p>
          <p className="text-2xl font-bold tracking-tight text-amber-500 mt-1">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold tracking-tight text-destructive mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by participant name or Discord ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 bg-muted/20 border-border/60 h-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="w-full md:w-[150px] bg-muted/20 border-border/60 h-9 text-xs">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full md:w-[220px] justify-start text-left font-normal bg-muted/20 border-border/60 h-9 text-xs",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Filter Date Range</span>
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
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Sort Dropdown */}
            <Select value={sortOrder} onValueChange={(v: "newest" | "oldest") => setSortOrder(v)}>
              <SelectTrigger className="w-full md:w-[150px] bg-muted/20 border-border/60 h-9 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Selection Bar */}
          {selectedResponses.size > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
              <span className="font-semibold text-destructive">
                {selectedResponses.size} response{selectedResponses.size === 1 ? "" : "s"} selected
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-7 text-xs">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedResponses.size} responses?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. These responses will be permanently removed from this form.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/40 bg-muted/20 hover:bg-muted/20">
                  <TableHead className="w-[45px] pl-4">
                    <Checkbox 
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="hidden md:table-cell w-[60px] text-xs">#</TableHead>
                  <TableHead className="text-xs">
                    <Button variant="ghost" size="sm" className="-ml-3 h-8 hover:bg-transparent px-3 text-xs font-semibold" onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}>
                      Submitted At
                      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-xs">Participant</TableHead>
                  <TableHead className="hidden md:table-cell text-xs">User ID</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right pr-4 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No responses found matching current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedResponses.map((response, index) => (
                    <TableRow 
                      key={response.id} 
                      data-state={selectedResponses.has(response.id) && "selected"}
                      className="cursor-pointer hover:bg-muted/30 border-b border-border/30 transition-colors"
                      onClick={() => setViewingResponseId(response.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()} className="pl-4 py-3">
                        <Checkbox 
                          checked={selectedResponses.has(response.id)}
                          onCheckedChange={(checked) => handleSelectOne(response.id, checked as boolean)}
                          aria-label="Select row"
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3 text-xs font-mono text-muted-foreground">
                        {getSerialNumber(index)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">
                            {format(new Date(response.createdAt), "MMM d, yyyy")}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(response.createdAt), "h:mm a")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 ring-1 ring-border/40">
                            <AvatarFallback className="text-[10px]">
                              {response.userName?.substring(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-xs text-foreground truncate max-w-[140px]">
                            {response.userName || "Unknown Participant"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3 font-mono text-[11px] text-muted-foreground">
                        {response.userId || "-"}
                      </TableCell>
                      <TableCell className="py-3">
                        {(!response.status || response.status === "PENDING") && (
                          <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
                            <Clock className="h-3 w-3 text-amber-500" /> Pending
                          </Badge>
                        )}
                        {response.status === "ACCEPTED" && (
                          <Badge variant="outline" className="gap-1 text-[10px] font-medium border-green-500/30 text-green-500 bg-green-500/10">
                            <CheckCircle2 className="h-3 w-3" /> Accepted
                          </Badge>
                        )}
                        {response.status === "REJECTED" && (
                          <Badge variant="outline" className="gap-1 text-[10px] font-medium border-destructive/30 text-destructive bg-destructive/10">
                            <XCircle className="h-3 w-3" /> Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(response.id, "ACCEPTED")}>
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-green-500" /> Accept
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(response.id, "REJECTED")}>
                              <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(response.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-2 gap-4">
        <div className="text-xs text-muted-foreground order-2 sm:order-1">
          Showing {filteredResponses.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredResponses.length)} of {filteredResponses.length} entries
        </div>

        <div className="flex items-center gap-4 order-1 sm:order-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[65px] text-xs bg-muted/20 border-border/60">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
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
                    className={cn("cursor-pointer h-8 text-xs", currentPage <= 1 && "pointer-events-none opacity-50")}
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
                        className="cursor-pointer h-8 text-xs"
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
                    className={cn("cursor-pointer h-8 text-xs", currentPage >= totalPages ? "pointer-events-none opacity-50" : "")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>

      {/* Response Detail Inspection Drawer (Sheet) */}
      {selectedResponse && (
        <Sheet open={!!viewingResponseId} onOpenChange={(open) => !open && setViewingResponseId(null)}>
          <SheetContent className="flex flex-col h-full w-full sm:max-w-xl p-0 gap-0">
            <SheetHeader className="p-5 sm:p-6 pb-4 border-b border-border/40 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SheetTitle className="text-lg font-bold">Response Details</SheetTitle>
                  <SheetDescription className="text-xs">
                    Review submitted questionnaire answers
                  </SheetDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs shrink-0"
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
                    toast({ title: "Copied", description: "Full response details copied to clipboard" });
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy All
                </Button>
              </div>

              {/* Submitter Info Card */}
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
                <Avatar className="h-10 w-10 ring-1 ring-border/50 bg-background">
                  <AvatarImage />
                  <AvatarFallback className="text-xs font-semibold">
                    {selectedResponse.userName?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-semibold truncate text-xs text-foreground">
                    {selectedResponse.userName || "Unknown Participant"}
                  </span>
                  <div 
                    className="flex items-center text-[11px] text-muted-foreground font-mono mt-0.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => {
                      if (selectedResponse.userId) {
                        navigator.clipboard.writeText(selectedResponse.userId);
                        toast({ title: "Copied", description: "Discord User ID copied" });
                      }
                    }}
                    title="Click to copy User ID"
                  >
                    <span className="truncate max-w-[180px]">{selectedResponse.userId}</span>
                    <CopyAction text={selectedResponse.userId || ""} className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
                <div className="text-right text-[11px] text-muted-foreground whitespace-nowrap pl-3 border-l border-border/40">
                  {format(new Date(selectedResponse.createdAt), "MMM d, y")}
                  <br />
                  {format(new Date(selectedResponse.createdAt), "h:mm a")}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                  {(!selectedResponse.status || selectedResponse.status === "PENDING") && (
                    <Badge variant="secondary" className="gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-amber-500" /> Pending Review
                    </Badge>
                  )}
                  {selectedResponse.status === "ACCEPTED" && (
                    <Badge variant="outline" className="gap-1 text-[11px] border-green-500/30 text-green-500 bg-green-500/10">
                      <CheckCircle2 className="h-3 w-3" /> Accepted
                    </Badge>
                  )}
                  {selectedResponse.status === "REJECTED" && (
                    <Badge variant="outline" className="gap-1 text-[11px] border-destructive/30 text-destructive bg-destructive/10">
                      <XCircle className="h-3 w-3" /> Rejected
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedResponse.status !== "ACCEPTED" && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-xs border-green-500/40 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                      onClick={() => handleUpdateStatus(selectedResponse.id, "ACCEPTED")}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Accept
                    </Button>
                  )}
                  {selectedResponse.status !== "REJECTED" && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => handleUpdateStatus(selectedResponse.id, "REJECTED")}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>
            
            <ScrollArea className="flex-1 px-5 sm:px-6">
              <div className="space-y-4 py-5">
                {formData?.questions.map((question, qIdx) => {
                  const answer = selectedResponse.answers.find(a => a.questionId === question.id);
                  const answerText = answer?.value || "";
                  return (
                    <div key={question.id} className="space-y-1.5 group/item p-3 rounded-xl border border-border/40 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {qIdx + 1}. {question.text}
                        </span>
                        {answerText && (
                          <CopyAction text={answerText} className="opacity-0 group-hover/item:opacity-100 transition-opacity h-5 w-5" />
                        )}
                      </div>
                      <div className="text-xs p-2.5 bg-background/60 rounded-lg border border-border/30 text-foreground whitespace-pre-wrap font-mono">
                        {answerText || <span className="text-muted-foreground italic font-sans">No answer submitted</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Bottom Sheet Pagination */}
            <div className="p-4 border-t border-border/40 bg-card/60 mt-auto">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevResponse}
                  disabled={selectedIdx <= 0}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Response {selectedIdx + 1} of {filteredResponses.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextResponse}
                  disabled={selectedIdx >= filteredResponses.length - 1}
                  className="h-8 text-xs"
                >
                  Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
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
            <DialogTitle className="text-base font-bold">
              {statusDialog.newStatus === "ACCEPTED" ? "Accept Response" : "Reject Response"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attach a custom decision notification message sent to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="custom-message" className="text-xs font-semibold">Reply Message</Label>
              <Textarea
                id="custom-message"
                value={statusDialog.message}
                onChange={(e) => setStatusDialog({ ...statusDialog, message: e.target.value })}
                placeholder="Enter feedback or congratulatory notes here..."
                rows={4}
                className="bg-muted/20 border-border/60 text-xs resize-y"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setStatusDialog({ ...statusDialog, open: false })}
              disabled={isUpdatingStatus}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              variant={statusDialog.newStatus === "ACCEPTED" ? "default" : "destructive"}
              onClick={() => confirmStatusUpdate(statusDialog.responseId, statusDialog.newStatus, statusDialog.message)}
              disabled={isUpdatingStatus}
              className="text-xs h-8"
            >
              {isUpdatingStatus && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {statusDialog.newStatus === "ACCEPTED" ? "Accept Response" : "Reject Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
