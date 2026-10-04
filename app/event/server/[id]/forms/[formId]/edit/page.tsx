"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp,
  ArrowDown,
  Eye, 
  FileText, 
  HelpCircle, 
  Sparkles, 
  Hash, 
  Clock, 
  Settings2, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check, 
  ChevronsUpDown, 
  Loader2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuestionType } from "@prisma/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

interface Question {
  id: string;
  text: string;
  description: string;
  placeholder: string;
  type: QuestionType;
  required: boolean;
  options: { id?: string; text: string }[];
  order: number;
  min?: number | null;
  max?: number | null;
}

interface FormData {
  title: string;
  description: string;
  questions: Question[];
  channel_id?: string;
  maxResponsesPerUser: number;
  submissionCooldown: number;
  submissionCooldownUnit: string;
  custom_response: boolean;
  accept_response: string;
  reject_response: string;
}

const QUESTION_TYPES: { type: QuestionType; label: string; desc: string }[] = [
  { type: QuestionType.SHORT_TEXT, label: "Short Text", desc: "Single line text input (up to 4,000 chars)" },
  { type: QuestionType.PARAGRAPH, label: "Paragraph", desc: "Multi-line detailed text input" },
  { type: QuestionType.MULTIPLE_CHOICE, label: "Single Select (Radio)", desc: "Choose one option from a list" },
  { type: QuestionType.CHECKBOXES, label: "Multiple Select (Checkboxes)", desc: "Select multiple options" },
  { type: QuestionType.CHECKBOX, label: "Single Checkbox", desc: "Binary acknowledgment or agreement" },
  { type: QuestionType.DROPDOWN, label: "Dropdown", desc: "Compact single choice select menu" },
  { type: QuestionType.DATE, label: "Date Picker", desc: "Calendar date selector" },
  { type: QuestionType.TIME, label: "Time Picker", desc: "Clock time selector" },
  { type: QuestionType.NUMBER, label: "Numeric Value", desc: "Constrained numeric input" },
  { type: QuestionType.USER, label: "Discord User Selection", desc: "Mention Discord server members" },
];

export default async function EditFormPage({ params }: { params: Promise<{ id: string; formId: string }> }) {
  const { id, formId } = await params;
  
  return <EditFormClient guildId={id} formId={formId} />;
}

function EditFormClient({ guildId, formId }: { guildId: string; formId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [channels, setChannels] = useState<{ id: string; name: string; position: number }[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    questions: [],
    channel_id: "",
    maxResponsesPerUser: 1,
    submissionCooldown: 0,
    submissionCooldownUnit: "seconds",
    custom_response: false,
    accept_response: "",
    reject_response: "",
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchForm();
    fetchChannels();
  }, [formId]);

  const fetchForm = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/forms/${formId}`);
      if (!response.ok) throw new Error("Failed to fetch form");
      
      const data = await response.json();
      
      let cooldown = data.submissionCooldown ?? 0;
      let unit = "seconds";
      
      if (cooldown > 0) {
        if (cooldown % 86400 === 0) {
          cooldown = cooldown / 86400;
          unit = "days";
        } else if (cooldown % 3600 === 0) {
          cooldown = cooldown / 3600;
          unit = "hours";
        } else if (cooldown % 60 === 0) {
          cooldown = cooldown / 60;
          unit = "minutes";
        }
      }

      setFormData({
        title: data.title || "",
        description: data.description || "",
        questions: data.questions || [],
        channel_id: data.channel_id ? data.channel_id.toString() : "",
        maxResponsesPerUser: data.maxResponsesPerUser ?? 1,
        submissionCooldown: cooldown,
        submissionCooldownUnit: unit,
        custom_response: data.custom_response || false,
        accept_response: data.accept_response || "",
        reject_response: data.reject_response || "",
      });
      
      setQuestions((data.questions || []).map((q: any) => ({
        id: q.id,
        text: q.text || "",
        description: q.description || "",
        placeholder: q.placeholder || "",
        type: q.type,
        required: q.required || false,
        options: (q.options || []).map((o: any) => ({ 
          id: o.id, 
          text: typeof o === "string" ? o : o.text 
        })),
        order: q.order ?? 0,
        min: q.min,
        max: q.max,
      })));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load form", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      setIsLoadingChannels(true);
      const channelsResponse = await fetch(`/api/discord/bot/channels?guildId=${guildId}`);
      if (!channelsResponse.ok) {
        throw new Error('Failed to fetch channels');
      }
      const channelsData = await channelsResponse.json();
      const textChannels = channelsData
        .filter((channel: any) => channel.type === 0)
        .sort((a: any, b: any) => a.position - b.position);
      setChannels(textChannels || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const addQuestion = () => {
    if (questions.length >= 30) {
      toast({ 
        title: "Error", 
        description: "Maximum 30 questions allowed per form", 
        variant: "destructive" 
      });
      return;
    }
    
    const newQuestion: Question = {
      id: `new-${Math.random().toString(36).substring(7)}`,
      text: "",
      description: "",
      placeholder: "",
      type: QuestionType.SHORT_TEXT,
      required: false,
      options: [],
      order: questions.length,
      min: null,
      max: null,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id !== id) return q;
      
      const updated = { ...q, [field]: value };
      
      // Handle defaults when switching types
      if (field === "type") {
        const isSelectOrUser = value === QuestionType.MULTIPLE_CHOICE || value === QuestionType.CHECKBOXES || value === QuestionType.USER;
        if (isSelectOrUser) {
          if (updated.min === undefined || updated.min === null) updated.min = 1;
          if (updated.max === undefined || updated.max === null) updated.max = 1;
        } else {
          updated.min = null;
          updated.max = null;
        }
        if (value === QuestionType.CHECKBOX) {
          updated.required = false;
        }
      }
      return updated;
    }));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id).map((q, idx) => ({ ...q, order: idx })));
  };

  const addOption = (questionId: string) => {
    const draft = (optionDrafts[questionId] || "").trim();
    if (!draft) return;
    if (draft.length > 100) {
      toast({ title: "Error", description: "Option text must be 100 characters or less", variant: "destructive" });
      return;
    }
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOption = { 
        id: `new-${Math.random().toString(36).substring(7)}`, 
        text: draft 
      };
      updateQuestion(questionId, "options", [...question.options, newOption]);
      setOptionDrafts(prev => ({ ...prev, [questionId]: "" }));
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, "options", question.options.filter((_, idx) => idx !== optionIndex));
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
    
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    newQuestions.forEach((q, idx) => q.order = idx);
    setQuestions(newQuestions);
  };

  const needsOptions = (type: QuestionType) => {
    return type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.CHECKBOXES || type === QuestionType.DROPDOWN;
  };

  const getTypeLabel = (type: QuestionType) => {
    const found = QUESTION_TYPES.find(t => t.type === type);
    return found ? found.label : type;
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Please enter a form title", variant: "destructive" });
      setStep(1);
      return;
    }

    if (formData.title.length > 200) {
      toast({ title: "Error", description: "Form title must be 200 characters or less", variant: "destructive" });
      setStep(1);
      return;
    }

    if (formData.description.length > 1000) {
      toast({ title: "Error", description: "Form description must be 1000 characters or less", variant: "destructive" });
      setStep(1);
      return;
    }

    if (questions.length === 0) {
      toast({ title: "Error", description: "Please add at least one question", variant: "destructive" });
      setStep(2);
      return;
    }

    if (questions.length > 30) {
      toast({ title: "Error", description: "Maximum 30 questions allowed per form", variant: "destructive" });
      setStep(2);
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.text.trim()) {
        toast({ title: "Error", description: `Question ${i + 1} text is required`, variant: "destructive" });
        setStep(2);
        return;
      }

      if (q.text.length > 45) {
        toast({ title: "Error", description: `Question ${i + 1} text must be 45 characters or less`, variant: "destructive" });
        setStep(2);
        return;
      }

      if (q.description.length > 100) {
        toast({ title: "Error", description: `Question ${i + 1} description must be 100 characters or less`, variant: "destructive" });
        setStep(2);
        return;
      }

      if (q.placeholder.length > 100) {
        toast({ title: "Error", description: `Question ${i + 1} placeholder must be 100 characters or less`, variant: "destructive" });
        setStep(2);
        return;
      }

      const needsOpts = needsOptions(q.type);
      if (needsOpts && q.options.length < 2) {
        toast({ title: "Error", description: `Question ${i + 1} must have at least 2 options`, variant: "destructive" });
        setStep(2);
        return;
      }

      // Options validation or User Selection validation
      if (needsOpts || q.type === QuestionType.USER) {
        if (q.min !== undefined && q.min !== null) {
          if (q.min < 0 || q.min > 25) {
            toast({ title: "Error", description: `Question ${i + 1} min selection must be between 0 and 25`, variant: "destructive" });
            setStep(2);
            return;
          }
          if (needsOpts && q.min > q.options.length) {
            toast({ title: "Error", description: `Question ${i + 1} min selection cannot exceed number of options`, variant: "destructive" });
            setStep(2);
            return;
          }
        }
        if (q.max !== undefined && q.max !== null) {
          if (q.max < 1 || q.max > 25) {
            toast({ title: "Error", description: `Question ${i + 1} max selection must be between 1 and 25`, variant: "destructive" });
            setStep(2);
            return;
          }
          if (needsOpts && q.max > q.options.length) {
            toast({ title: "Error", description: `Question ${i + 1} max selection cannot exceed number of options`, variant: "destructive" });
            setStep(2);
            return;
          }
        }
        if (q.min !== undefined && q.min !== null && q.max !== undefined && q.max !== null && q.min > q.max) {
          toast({ title: "Error", description: `Question ${i + 1}: min selection cannot be greater than max selection`, variant: "destructive" });
          setStep(2);
          return;
        }
      } else {
        // Text/Number validation
        if (q.min !== undefined && q.min !== null && q.min < 0) {
          toast({ title: "Error", description: `Question ${i + 1} min value invalid`, variant: "destructive" });
          setStep(2);
          return;
        }
        if (q.type !== QuestionType.NUMBER) {
          if (q.max !== undefined && q.max !== null && q.max > 4000) {
            toast({ title: "Error", description: `Question ${i + 1} max length cannot exceed 4000`, variant: "destructive" });
            setStep(2);
            return;
          }
        }
        if (q.min !== undefined && q.min !== null && q.max !== undefined && q.max !== null && q.min > q.max) {
          toast({ title: "Error", description: `Question ${i + 1}: min value cannot be greater than max value`, variant: "destructive" });
          setStep(2);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      let cooldown = formData.submissionCooldown;
      if (formData.submissionCooldownUnit === "minutes") cooldown *= 60;
      else if (formData.submissionCooldownUnit === "hours") cooldown *= 3600;
      else if (formData.submissionCooldownUnit === "days") cooldown *= 86400;

      const response = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          guild_id: guildId,
          channel_id: formData.channel_id || null,
          maxResponsesPerUser: formData.maxResponsesPerUser,
          submissionCooldown: cooldown,
          custom_response: formData.custom_response,
          accept_response: formData.accept_response,
          reject_response: formData.reject_response,
          questions: questions.map(q => ({
            id: q.id.startsWith("new-") ? undefined : q.id,
            text: q.text,
            description: q.description,
            placeholder: q.placeholder,
            type: q.type,
            required: q.required,
            options: q.options.map(o => ({ 
              id: o.id && !o.id.startsWith("new-") ? o.id : undefined,
              text: o.text || o 
            })),
            order: q.order,
            min: q.min || null,
            max: q.max || null,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update form");
      }

      toast({ title: "Success", description: "Form updated successfully" });
      router.push(`/event/server/${guildId}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update form", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="pb-6 border-b border-border/40 space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
          <CardHeader className="p-6 border-b border-border/40 space-y-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3 w-64 rounded" />
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/event/server" className="hover:text-foreground transition-colors">
            Events
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <Link href={`/event/server/${guildId}`} className="hover:text-foreground transition-colors font-mono">
            {guildId.length > 12 ? `${guildId.slice(0, 10)}...` : guildId}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-foreground font-medium">Edit Form</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-semibold tracking-wide border-border/60 bg-muted/30">
            Form Editor
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-mono">
            {questions.length}/30 Qs
          </Badge>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/event/server/${guildId}`)}
            className="rounded-xl border border-border/40 hover:bg-muted/50 h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Edit Form
              <Sparkles className="h-4 w-4 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Modify form fields, configure delivery channels, and adjust participant settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/event/server/${guildId}`)}
            className="rounded-xl border-border/60 text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-semibold shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Visual Stepper */}
      <div className="grid grid-cols-3 gap-3 p-1.5 rounded-2xl bg-muted/40 border border-border/60">
        {[
          { num: 1, label: "Form Details", desc: "Configuration & delivery", icon: FileText },
          { num: 2, label: `Questions (${questions.length})`, desc: "Fields & validation", icon: HelpCircle },
          { num: 3, label: "Live Preview", desc: "Participant view", icon: Eye },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left",
                isActive
                  ? "bg-background text-foreground shadow-sm border border-border/60 font-semibold"
                  : isDone
                  ? "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  : "text-muted-foreground/60 hover:bg-background/40 hover:text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isDone
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted/70 text-muted-foreground border border-border/40"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="hidden sm:block min-w-0 flex-1">
                <p className="text-xs font-semibold truncate leading-tight">{s.label}</p>
                <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{s.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP 1: FORM DETAILS */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Main Info Card */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm backdrop-blur-sm">
            <CardHeader className="p-6 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">General Information</CardTitle>
                  <CardDescription className="text-xs">
                    Define the form title, description, limits, and target Discord channel.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Form Title <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {formData.title.length}/200
                  </span>
                </div>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Staff Application, Event Feedback, Clan Registration"
                  maxLength={200}
                  className="bg-muted/20 border-border/60 h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Description (Optional)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {formData.description.length}/1000
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide context, instructions, or deadlines for this form..."
                  rows={3}
                  maxLength={1000}
                  className="bg-muted/20 border-border/60 text-sm resize-none"
                />
              </div>

              {/* Limits and Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="maxResponses" className="text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Max Submissions Per User
                  </Label>
                  <Input 
                    id="maxResponses"
                    type="number" 
                    min="0"
                    value={formData.maxResponsesPerUser}
                    onChange={(e) => setFormData({ ...formData, maxResponsesPerUser: parseInt(e.target.value) || 0 })}
                    className="bg-muted/20 border-border/60 h-10 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Use 0 for unlimited responses per participant. Default is 1.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cooldown" className="text-xs font-semibold flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Submission Cooldown
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      id="cooldown"
                      type="number" 
                      min="0"
                      value={formData.submissionCooldown}
                      onChange={(e) => setFormData({ ...formData, submissionCooldown: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="bg-muted/20 border-border/60 h-10 text-sm"
                    />
                    <Select 
                      value={formData.submissionCooldownUnit} 
                      onValueChange={(value) => setFormData({ ...formData, submissionCooldownUnit: value })}
                    >
                      <SelectTrigger className="w-[120px] bg-muted/20 border-border/60 h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seconds">Seconds</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Enforces waiting period between subsequent submissions.
                  </p>
                </div>
              </div>

              {/* Discord Delivery Channel Picker */}
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="channel" className="text-xs font-semibold flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Discord Notification Channel (Optional)
                </Label>
                <Popover open={channelOpen} onOpenChange={setChannelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={channelOpen}
                      className="w-full justify-between bg-muted/20 border-border/60 h-10 text-sm font-normal"
                      disabled={isLoadingChannels}
                    >
                      {isLoadingChannels ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading channels...</span>
                        </div>
                      ) : formData.channel_id ? (
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {channels.find((channel) => channel.id === formData.channel_id)?.name || formData.channel_id}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select a text channel</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px] p-0 rounded-xl shadow-lg border-border/60">
                    <Command className="max-h-[300px]">
                      <CommandInput placeholder="Search Discord channels..." className="text-xs" />
                      <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                        No text channels found.
                      </CommandEmpty>
                      <CommandGroup className="overflow-y-auto max-h-[220px]">
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setFormData({ ...formData, channel_id: "" });
                            setChannelOpen(false);
                          }}
                          className="text-xs cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              formData.channel_id === "" ? "opacity-100 text-primary" : "opacity-0"
                            )}
                          />
                          None (Do not link channel)
                        </CommandItem>
                        {channels.map((channel) => (
                          <CommandItem
                            key={channel.id}
                            value={channel.name}
                            onSelect={() => {
                              setFormData({ ...formData, channel_id: channel.id });
                              setChannelOpen(false);
                            }}
                            className="text-xs cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5",
                                formData.channel_id === channel.id ? "opacity-100 text-primary" : "opacity-0"
                              )}
                            />
                            <Hash className="mr-1.5 h-3 w-3 text-muted-foreground" />
                            {channel.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-[11px] text-muted-foreground">
                  Submissions and notifications can be routed directly to this Discord text channel.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Response Settings Card */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm backdrop-blur-sm">
            <CardHeader className="p-6 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Settings2 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Response Automation</CardTitle>
                  <CardDescription className="text-xs">
                    Customize messages sent to respondents upon approval or rejection.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between rounded-xl border border-border/60 p-4 bg-muted/10">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="custom_response" className="text-xs font-semibold cursor-pointer">
                    Enable Custom Response Dialog
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    When reviewing a submission, prompt administrators to personalize the response before sending.
                  </p>
                </div>
                <Switch 
                  id="custom_response" 
                  checked={formData.custom_response}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, custom_response: checked })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="accept_response" className="text-xs font-semibold text-emerald-500">
                    Default Acceptance Message
                  </Label>
                  <Textarea 
                    id="accept_response"
                    value={formData.accept_response} 
                    onChange={(e) => setFormData({ ...formData, accept_response: e.target.value })}
                    placeholder="Congratulations! Your submission has been approved..."
                    rows={3}
                    className="bg-muted/20 border-border/60 text-xs resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reject_response" className="text-xs font-semibold text-destructive">
                    Default Rejection Message
                  </Label>
                  <Textarea 
                    id="reject_response"
                    value={formData.reject_response} 
                    onChange={(e) => setFormData({ ...formData, reject_response: e.target.value })}
                    placeholder="Thank you for your interest. Unfortunately, your submission was declined..."
                    rows={3}
                    className="bg-muted/20 border-border/60 text-xs resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 2: QUESTION BUILDER */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Header Action Bar for Questions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card/40 border border-border/60 shadow-sm backdrop-blur-sm">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Form Questions
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Construct your form with inputs, dropdowns, and choices. Reorder with the arrow buttons.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono border-border/60 bg-muted/20">
                {questions.length} / 30 Questions
              </Badge>
              <Button
                type="button"
                size="sm"
                onClick={addQuestion}
                disabled={questions.length >= 30}
                className="rounded-xl text-xs font-semibold shadow-sm"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Question
              </Button>
            </div>
          </div>

          {/* Empty State */}
          {questions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/70 p-12 text-center bg-muted/10 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-foreground">No questions yet</h3>
                <p className="text-xs text-muted-foreground">
                  Your form requires at least one question. Click below to add your first question field.
                </p>
              </div>
              <Button onClick={addQuestion} className="rounded-xl text-xs font-semibold">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add First Question
              </Button>
            </div>
          )}

          {/* Question Cards List */}
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card 
                key={question.id} 
                className="rounded-2xl border border-border/60 bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden transition-all duration-200"
              >
                {/* Question Header Strip */}
                <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 rounded-md bg-muted/30">
                      #{index + 1}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 rounded-md">
                      {getTypeLabel(question.type)}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground truncate max-w-[220px] sm:max-w-[340px]">
                      {question.text || "Untitled Question"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg hover:bg-background/80"
                      onClick={() => moveQuestion(index, "up")}
                      disabled={index === 0}
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg hover:bg-background/80"
                      onClick={() => moveQuestion(index, "down")}
                      disabled={index === questions.length - 1}
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteQuestion(question.id)}
                      title="Delete Question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Question Config Body */}
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Question Prompt <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        {question.text.length}/45
                      </span>
                    </div>
                    <Input
                      value={question.text}
                      onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                      placeholder="e.g. What is your Minecraft IGN?"
                      maxLength={45}
                      className="bg-muted/20 border-border/60 h-10 text-sm font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Description / Subtitle (Optional)</Label>
                        <span className="text-[11px] text-muted-foreground">
                          {question.description.length}/100
                        </span>
                      </div>
                      <Input
                        value={question.description}
                        onChange={(e) => updateQuestion(question.id, "description", e.target.value)}
                        placeholder="Help text or clarifying details"
                        maxLength={100}
                        className="bg-muted/20 border-border/60 h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Placeholder Text (Optional)</Label>
                        <span className="text-[11px] text-muted-foreground">
                          {question.placeholder.length}/100
                        </span>
                      </div>
                      <Input
                        value={question.placeholder}
                        onChange={(e) => updateQuestion(question.id, "placeholder", e.target.value)}
                        placeholder="Placeholder shown inside the input"
                        maxLength={100}
                        className="bg-muted/20 border-border/60 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Question Type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value) => updateQuestion(question.id, "type", value as QuestionType)}
                      >
                        <SelectTrigger className="bg-muted/20 border-border/60 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={QuestionType.SHORT_TEXT}>Short Text</SelectItem>
                          <SelectItem value={QuestionType.PARAGRAPH}>Paragraph</SelectItem>
                          <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Single select (Radio)</SelectItem>
                          <SelectItem value={QuestionType.CHECKBOXES}>Multiple select (Checkboxes)</SelectItem>
                          <SelectItem value={QuestionType.CHECKBOX}>Single Checkbox (Agree / Yes)</SelectItem>
                          <SelectItem value={QuestionType.DROPDOWN}>Dropdown</SelectItem>
                          <SelectItem value={QuestionType.DATE}>Date</SelectItem>
                          <SelectItem value={QuestionType.TIME}>Time</SelectItem>
                          <SelectItem value={QuestionType.NUMBER}>Number</SelectItem>
                          <SelectItem value={QuestionType.USER}>Discord User Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-2.5 bg-muted/20 h-9 mt-auto">
                      <Label className="text-xs font-medium cursor-pointer">Required Question</Label>
                      <Switch
                        checked={question.required}
                        disabled={question.type === QuestionType.CHECKBOX}
                        onCheckedChange={(checked) => {
                          const newRequired = checked;
                          let updates: any = { required: newRequired };
                          if ((needsOptions(question.type) || question.type === QuestionType.USER) && 
                              (question.min === undefined || question.min === null)) {
                            updates.min = newRequired ? 1 : 0;
                          }
                          updateQuestion(question.id, "required", newRequired);
                        }}
                      />
                    </div>
                  </div>

                  {/* Min/Max Settings */}
                  {(question.type === QuestionType.SHORT_TEXT || question.type === QuestionType.PARAGRAPH || question.type === QuestionType.NUMBER) && (
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{question.type === QuestionType.NUMBER ? "Min Value" : "Min Length"}</Label>
                        <Input 
                          type="number" 
                          value={question.min ?? ''} 
                          onChange={(e) => updateQuestion(question.id, "min", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={question.type === QuestionType.NUMBER ? "Optional" : "Optional (Max 4000)"}
                          className="bg-muted/20 border-border/60 h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{question.type === QuestionType.NUMBER ? "Max Value" : "Max Length"}</Label>
                        <Input 
                          type="number" 
                          value={question.max ?? ''} 
                          onChange={(e) => updateQuestion(question.id, "max", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={question.type === QuestionType.NUMBER ? "Optional" : "Optional (Max 4000)"}
                          className="bg-muted/20 border-border/60 h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                  
                  {(needsOptions(question.type) || question.type === QuestionType.USER) && (
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Min Selection Count</Label>
                        <Input 
                          type="number" 
                          value={question.min ?? ''} 
                          onChange={(e) => updateQuestion(question.id, "min", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={question.required ? "Default 1" : "Default 0"}
                          max={25}
                          className="bg-muted/20 border-border/60 h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Max Selection Count</Label>
                        <Input 
                          type="number" 
                          value={question.max ?? ''} 
                          onChange={(e) => updateQuestion(question.id, "max", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Default 1 (Max 25)"
                          max={25}
                          className="bg-muted/20 border-border/60 h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Options Builder */}
                  {needsOptions(question.type) && (
                    <div className="space-y-3 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Configured Options ({question.options.length})</Label>
                        {question.options.length < 2 && (
                          <span className="text-[11px] text-amber-500 font-medium">
                            At least 2 options required
                          </span>
                        )}
                      </div>

                      {question.options.length > 0 && (
                        <div className="space-y-2">
                          {question.options.map((option, optIdx) => (
                            <div key={optIdx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/20 border border-border/40 text-xs">
                              <span className="font-semibold text-foreground px-1">{option.text}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => removeOption(question.id, optIdx)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-3 rounded-xl border border-dashed border-border/60 bg-muted/10 space-y-2.5">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Add Option
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={optionDrafts[question.id] || ""}
                            onChange={(e) => setOptionDrafts({ ...optionDrafts, [question.id]: e.target.value })}
                            placeholder="Enter option text..."
                            maxLength={100}
                            className="bg-muted/30 border-border/60 h-9 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addOption(question.id);
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={() => addOption(question.id)}
                            className="h-9 px-3 rounded-lg text-xs"
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {questions.length > 0 && (
            <Button 
              type="button"
              variant="outline" 
              onClick={addQuestion} 
              disabled={questions.length >= 30}
              className="w-full rounded-2xl border-dashed border-border/60 py-6 text-xs font-semibold hover:bg-muted/20"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Question ({questions.length}/30)
            </Button>
          )}
        </div>
      )}

      {/* STEP 3: LIVE PREVIEW */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Preview Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Eye className="h-4 w-4 text-primary" />
              Interactive Form Preview
            </div>
            <Badge variant="outline" className="bg-background/80 text-[11px] border-primary/30 text-primary">
              Read-Only Participant Mode
            </Badge>
          </div>

          {/* Form Container Replica */}
          <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden">
            {/* Header section */}
            <div className="p-8 border-b border-border/40 bg-muted/20 space-y-3">
              <Badge variant="secondary" className="text-[11px] font-semibold">
                Discord Community Form
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {formData.title || "Untitled Form"}
              </h2>
              {formData.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {formData.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No description provided.
                </p>
              )}

              <div className="flex items-center gap-3 pt-2 text-[11px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formData.maxResponsesPerUser === 0 ? "Unlimited submissions" : `Max ${formData.maxResponsesPerUser} response per user`}
                </span>
                {formData.submissionCooldown > 0 && (
                  <span className="flex items-center gap-1">
                    <Settings2 className="h-3 w-3" />
                    Cooldown: {formData.submissionCooldown} {formData.submissionCooldownUnit}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  {questions.length} Question{questions.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {/* Questions Replica */}
            <div className="p-8 space-y-6">
              {questions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No questions added yet. Go back to Step 2 to add questions.
                </div>
              ) : (
                questions.map((question, index) => (
                  <div key={question.id} className="p-5 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        {question.text || "Untitled Question"}
                        {question.required && <span className="text-destructive font-bold">*</span>}
                      </Label>
                      {question.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {question.description}
                        </p>
                      )}
                    </div>

                    {question.type === QuestionType.SHORT_TEXT && (
                      <Input
                        placeholder={question.placeholder || "Your answer"}
                        disabled
                        className="bg-muted/10 border-border/50 text-xs"
                      />
                    )}

                    {question.type === QuestionType.PARAGRAPH && (
                      <Textarea
                        placeholder={question.placeholder || "Type your response here..."}
                        rows={3}
                        disabled
                        className="bg-muted/10 border-border/50 text-xs resize-none"
                      />
                    )}

                    {question.type === QuestionType.NUMBER && (
                      <Input
                        type="number"
                        placeholder={question.placeholder || "Enter numeric value..."}
                        disabled
                        className="bg-muted/10 border-border/50 text-xs"
                      />
                    )}

                    {question.type === QuestionType.DATE && (
                      <Input type="date" disabled className="bg-muted/10 border-border/50 text-xs" />
                    )}

                    {question.type === QuestionType.TIME && (
                      <Input type="time" disabled className="bg-muted/10 border-border/50 text-xs" />
                    )}

                    {question.type === QuestionType.MULTIPLE_CHOICE && (
                      <RadioGroup disabled className="space-y-2 pt-1">
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2 p-2 rounded-xl bg-background/50 border border-border/30">
                            <RadioGroupItem value={option.text} id={`preview-${question.id}-${optIdx}`} />
                            <Label htmlFor={`preview-${question.id}-${optIdx}`} className="text-xs font-normal cursor-pointer">
                              {option.text}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {question.type === QuestionType.CHECKBOXES && (
                      <div className="space-y-2 pt-1">
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2 p-2 rounded-xl bg-background/50 border border-border/30">
                            <Checkbox id={`preview-cb-${question.id}-${optIdx}`} disabled />
                            <Label htmlFor={`preview-cb-${question.id}-${optIdx}`} className="text-xs font-normal cursor-pointer">
                              {option.text}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === QuestionType.CHECKBOX && (
                      <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-background/50 border border-border/30">
                        <Checkbox id={`preview-single-${question.id}`} disabled />
                        <Label htmlFor={`preview-single-${question.id}`} className="text-xs font-medium cursor-pointer">
                          I agree and confirm the above statement
                        </Label>
                      </div>
                    )}

                    {question.type === QuestionType.DROPDOWN && (
                      <Select disabled>
                        <SelectTrigger className="bg-muted/10 border-border/50 text-xs">
                          <SelectValue placeholder={question.placeholder || "Choose an option"} />
                        </SelectTrigger>
                        <SelectContent>
                          {question.options.map((option, optIdx) => (
                            <SelectItem key={optIdx} value={option.text}>
                              {option.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {question.type === QuestionType.USER && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/10 border border-border/50 text-xs text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span>Select Discord User / Member</span>
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="pt-4 border-t border-border/40">
                <Button disabled className="w-full sm:w-auto text-xs font-semibold">
                  Submit Response (Preview Mode)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Footer */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/60 shadow-lg">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/event/server/${guildId}`)}
          className="rounded-xl border-border/60 text-xs font-medium"
        >
          Cancel
        </Button>

        <div className="flex items-center gap-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="rounded-xl border-border/60 text-xs font-medium"
            >
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Previous
            </Button>
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              className="rounded-xl text-xs font-semibold"
            >
              Next Step
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}

          {step < 3 && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold shadow-sm ml-2 hidden sm:inline-flex"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
