"use client";

import { useState } from "react";
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
import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  description: string;
  placeholder: string;
  type: QuestionType;
  required: boolean;
  options: { text: string; description: string }[];
  order: number;
  min?: number;
  max?: number;
}

export default async function CreateFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return <CreateFormClient guildId={id} />;
}

function CreateFormClient({ guildId }: { guildId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [channels, setChannels] = useState<{ id: string; name: string; position: number }[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    channel_id: "",
    maxResponsesPerUser: "",
    submissionCooldown: "",
    submissionCooldownUnit: "seconds",
    custom_response: false,
    accept_response: "",
    reject_response: "",
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentOptionText, setCurrentOptionText] = useState("");
  const [currentOptionDesc, setCurrentOptionDesc] = useState("");

  // Fetch channels when component mounts
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setIsLoadingChannels(true);
        const channelsResponse = await fetch(`/api/discord/bot/channels?guildId=${guildId}`);
        if (!channelsResponse.ok) {
          throw new Error('Failed to fetch channels');
        }
        const channelsData = await channelsResponse.json();
        // Filter for text channels and sort by position
        const textChannels = channelsData
          .filter((channel: any) => channel.type === 0)
          .sort((a: any, b: any) => a.position - b.position);
        setChannels(textChannels || []);
      } catch (error) {
        console.error('Error fetching channels:', error);
        toast({
          title: "Warning",
          description: "Failed to fetch Discord channels",
          variant: "destructive",
        });
      } finally {
        setIsLoadingChannels(false);
      }
    };

    fetchChannels();
  }, [guildId, toast]);

  const addQuestion = () => {
    if (questions.length >= 25) {
      toast({ 
        title: "Error", 
        description: "Maximum 25 questions allowed per form", 
        variant: "destructive" 
      });
      return;
    }
    
    const newQuestion: Question = {
      id: Math.random().toString(36).substring(7),
      text: "",
      description: "",
      placeholder: "",
      type: QuestionType.SHORT_TEXT,
      required: false,
      options: [],
      order: questions.length,
      min: undefined,
      max: undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => {
        if (q.id !== id) return q;
        
        const updated = { ...q, [field]: value };
        
        // Handle defaults when switching types
        if (field === "type") {
            const isSelectOrUser = ["MULTIPLE_CHOICE", "CHECKBOXES", "USER"].includes(value as string);
            if (isSelectOrUser) {
                if (updated.min === undefined) updated.min = 1;
                if (updated.max === undefined) updated.max = 1;
            } else {
                 // clear mins/maxes when switching to non-constrained types?? 
                 // Or leave them if they switch back. 
                 // User wants specific behavior for select types.
                 updated.min = undefined;
                 updated.max = undefined;
            }
            if (value === "CHECKBOX") {
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
    if (!currentOptionText.trim()) return;

    if (currentOptionText.length > 100) {
      toast({ title: "Error", description: "Option text must be 100 characters or less", variant: "destructive" });
      return;
    }
    if (currentOptionDesc.length > 100) {
      toast({ title: "Error", description: "Option description must be 100 characters or less", variant: "destructive" });
      return;
    }

    const question = questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, "options", [...question.options, { text: currentOptionText, description: currentOptionDesc }]);
      setCurrentOptionText("");
      setCurrentOptionDesc("");
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

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Please enter a form title", variant: "destructive" });
      return;
    }

    if (formData.title.length > 25) {
      toast({ title: "Error", description: "Form title must be 25 characters or less", variant: "destructive" });
      return;
    }

    if (formData.description.length > 1000) {
      toast({ title: "Error", description: "Form description must be 1000 characters or less", variant: "destructive" });
      return;
    }

    if (questions.length === 0) {
      toast({ title: "Error", description: "Please add at least one question", variant: "destructive" });
      return;
    }

    if (questions.length > 25) {
      toast({ title: "Error", description: "Maximum 25 questions allowed per form", variant: "destructive" });
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.text.trim()) {
        toast({ title: "Error", description: `Question ${i + 1} text is required`, variant: "destructive" });
        return;
      }

      if (q.text.length > 45) {
        toast({ title: "Error", description: `Question ${i + 1} text must be 45 characters or less`, variant: "destructive" });
        return;
      }

      if (q.description.length > 100) {
        toast({ title: "Error", description: `Question ${i + 1} description must be 100 characters or less`, variant: "destructive" });
        return;
      }

      if (q.placeholder.length > 100) {
        toast({ title: "Error", description: `Question ${i + 1} placeholder must be 100 characters or less`, variant: "destructive" });
        return;
      }

      const needsOpts = needsOptions(q.type);
      if (needsOpts && q.options.length < 2) {
        toast({ title: "Error", description: `Question ${i + 1} must have at least 2 options`, variant: "destructive" });
        return;
      }

      // Options validation or User Selection validation
      if (needsOpts || q.type === QuestionType.USER) {
          if (q.min !== undefined && q.min !== null) {
              if (q.min < 0 || q.min > 25) {
                  toast({ title: "Error", description: `Question ${i + 1} min selection must be between 0 and 25`, variant: "destructive" });
                  return;
              }
              if (needsOpts && q.min > q.options.length) {
                   toast({ title: "Error", description: `Question ${i + 1} min selection cannot exceed number of options`, variant: "destructive" });
                   return;
              }
          }
          if (q.max !== undefined && q.max !== null) {
               if (q.max < 1 || q.max > 25) {
                   toast({ title: "Error", description: `Question ${i + 1} max selection must be between 1 and 25`, variant: "destructive" });
                   return;
               }
               if (needsOpts && q.max > q.options.length) {
                   toast({ title: "Error", description: `Question ${i + 1} max selection cannot exceed number of options`, variant: "destructive" });
                   return;
               }
          }
          if (q.min !== undefined && q.min !== null && q.max !== undefined && q.max !== null && q.min > q.max) {
              toast({ title: "Error", description: `Question ${i + 1}: min selection cannot be greater than max selection`, variant: "destructive" });
              return;
          }
      } else {
        // Text/Number validation
        if (q.min !== undefined && q.min !== null && q.min < 0) {
            toast({ title: "Error", description: `Question ${i + 1} min value invalid`, variant: "destructive" });
            return;
        }
        if (q.type !== QuestionType.NUMBER) {
             if (q.max !== undefined && q.max !== null && q.max > 4000) {
                 toast({ title: "Error", description: `Question ${i + 1} max length cannot exceed 4000`, variant: "destructive" });
                 return;
             }
        }
        if (q.min !== undefined && q.min !== null && q.max !== undefined && q.max !== null && q.min > q.max) {
            toast({ title: "Error", description: `Question ${i + 1}: min value cannot be greater than max value`, variant: "destructive" });
            return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          guild_id: guildId,
          channel_id: formData.channel_id || null,
          maxResponsesPerUser: formData.maxResponsesPerUser ? parseInt(formData.maxResponsesPerUser) : null,
          submissionCooldown: formData.submissionCooldown ? (
            parseInt(formData.submissionCooldown) * (
              formData.submissionCooldownUnit === "minutes" ? 60 :
              formData.submissionCooldownUnit === "hours" ? 3600 :
              formData.submissionCooldownUnit === "days" ? 86400 : 1
            )
          ) : null,
          custom_response: formData.custom_response,
          accept_response: formData.accept_response,
          reject_response: formData.reject_response,
          questions: questions.map(q => ({
            text: q.text,
            description: q.description,
            placeholder: q.placeholder,
            type: q.type,
            required: q.required,
            options: q.options,
            order: q.order,
            min: q.min || null,
            max: q.max || null,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create form");
      }

      toast({ title: "Success", description: "Form created successfully" });
      router.push(`/event/server/${guildId}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create form", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsOptions = (type: QuestionType) => {
    return [QuestionType.MULTIPLE_CHOICE, QuestionType.CHECKBOXES, QuestionType.DROPDOWN].includes(type as any);
  };
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
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
          <span className="text-foreground font-medium">Create</span>
        </div>

        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 text-xs">
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Create New Form</h1>
            <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-primary/30 text-primary">
              Builder
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Build custom forms, surveys, and applications with Discord text channel integration.
          </p>
        </div>
      </div>

      {/* Stepped Progress Bar */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl border border-border/60 bg-muted/20">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={cn(
            "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all",
            step === 1
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          )}
        >
          <FileText className={cn("h-4 w-4", step === 1 ? "text-primary" : "text-muted-foreground")} />
          <span>1. Form Details</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (formData.title.trim()) setStep(2);
            else toast({ title: "Required", description: "Please enter a form title first", variant: "destructive" });
          }}
          className={cn(
            "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all",
            step === 2
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          )}
        >
          <HelpCircle className={cn("h-4 w-4", step === 2 ? "text-primary" : "text-muted-foreground")} />
          <span>2. Questions ({questions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (formData.title.trim()) setStep(3);
            else toast({ title: "Required", description: "Please enter a form title first", variant: "destructive" });
          }}
          className={cn(
            "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all",
            step === 3
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          )}
        >
          <Eye className={cn("h-4 w-4", step === 3 ? "text-primary" : "text-muted-foreground")} />
          <span>3. Preview</span>
        </button>
      </div>

      {/* Step 1: Form Details */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Form Basic Information */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Form Title & Description</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Essential identity displayed to respondents.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">Form Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Tournament Moderator Application"
                  maxLength={25}
                  className="bg-muted/20 border-border/60 h-10"
                />
                <p className="text-[11px] text-muted-foreground text-right">
                  {formData.title.length}/25 characters
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain the purpose of this form, eligibility guidelines, or completion expectations..."
                  rows={4}
                  maxLength={1000}
                  className="bg-muted/20 border-border/60 resize-y"
                />
                <p className="text-[11px] text-muted-foreground text-right">
                  {formData.description.length}/1000 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submission & Capacity Settings */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Submission Limits & Discord Channel</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Configure respondent limits, cooldown timers, and text channel delivery.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="maxResponses" className="text-xs font-semibold">Max Responses Per User</Label>
                  <Input
                    id="maxResponses"
                    type="number"
                    min="1"
                    value={formData.maxResponsesPerUser}
                    onChange={(e) => setFormData({ ...formData, maxResponsesPerUser: e.target.value })}
                    placeholder="Unlimited"
                    className="bg-muted/20 border-border/60 h-10"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave blank to allow respondents unlimited submissions.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cooldown" className="text-xs font-semibold">Submission Cooldown</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cooldown"
                      type="number"
                      min="0"
                      value={formData.submissionCooldown}
                      onChange={(e) => setFormData({ ...formData, submissionCooldown: e.target.value })}
                      placeholder="No cooldown"
                      className="bg-muted/20 border-border/60 h-10 flex-1"
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
                    Enforce minimum waiting time between multiple submissions.
                  </p>
                </div>
              </div>

              {/* Discord Channel Selector */}
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="channel" className="text-xs font-semibold">Discord Text Channel (Optional)</Label>
                <Popover open={channelOpen} onOpenChange={setChannelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={channelOpen}
                      className="w-full justify-between bg-muted/20 border-border/60 h-10 font-normal"
                      disabled={isLoadingChannels}
                    >
                      {isLoadingChannels ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : formData.channel_id ? (
                        <span className="flex items-center gap-1.5 font-medium truncate">
                          <Hash className="h-3.5 w-3.5 opacity-50" />
                          {channels.find((channel) => channel.id === formData.channel_id)?.name || "Select a channel"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Select a text channel</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command className="max-h-[300px] overflow-y-auto">
                      <CommandInput placeholder="Search text channels..." />
                      <CommandEmpty>No channels found.</CommandEmpty>
                      <CommandGroup className="overflow-y-auto">
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setFormData({ ...formData, channel_id: "" });
                            setChannelOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.channel_id === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {channels.map((channel) => (
                          <CommandItem
                            key={channel.id}
                            value={channel.name}
                            onSelect={() => {
                              setFormData({ ...formData, channel_id: channel.id });
                              setChannelOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.channel_id === channel.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            #{channel.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-[11px] text-muted-foreground">
                  Channel where submission logs and applicant alerts will be sent.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Response Review Settings */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Decision Response Templates</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Configure default messages sent to applicants upon acceptance or rejection.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="space-y-0.5 pr-2">
                  <Label htmlFor="custom_response" className="text-xs font-semibold cursor-pointer">
                    Enable Custom Response Dialog
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Prompt managers to customize the outgoing notification before accepting or rejecting.
                  </p>
                </div>
                <Switch 
                  id="custom_response" 
                  checked={formData.custom_response}
                  onCheckedChange={(checked: boolean) => setFormData({...formData, custom_response: checked})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="accept_response" className="text-xs font-semibold">
                    Default Acceptance Message
                  </Label>
                  <Textarea 
                    id="accept_response"
                    value={formData.accept_response} 
                    onChange={(e) => setFormData({...formData, accept_response: e.target.value})}
                    placeholder="Congratulations! Your application has been approved. Welcome aboard!"
                    rows={3}
                    className="bg-muted/20 border-border/60 resize-y text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reject_response" className="text-xs font-semibold">
                    Default Rejection Message
                  </Label>
                  <Textarea 
                    id="reject_response"
                    value={formData.reject_response} 
                    onChange={(e) => setFormData({...formData, reject_response: e.target.value})}
                    placeholder="Thank you for your interest. Unfortunately, we are unable to accept your application at this time."
                    rows={3}
                    className="bg-muted/20 border-border/60 resize-y text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Question Builder */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Form Questions</h2>
              <p className="text-xs text-muted-foreground">
                Build questionnaires with custom validation and multiple choice options ({questions.length}/25).
              </p>
            </div>
            <Button
              onClick={addQuestion}
              size="sm"
              className="h-8 text-xs font-medium"
              disabled={questions.length >= 25}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>

          {questions.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-10 text-center">
              <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                <div className="p-3 rounded-full bg-muted/40">
                  <HelpCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold">No questions added yet</h3>
                <p className="text-xs text-muted-foreground">
                  Add questions to gather text responses, numbers, dropdown choices, dates, or Discord user tags from respondents.
                </p>
                <Button onClick={addQuestion} size="sm" variant="outline" className="mt-2 text-xs">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add First Question
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="rounded-2xl border border-border/60 bg-card/40 shadow-sm overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground opacity-60" />
                      <Badge variant="outline" className="text-xs font-mono font-medium bg-background/50">
                        #{index + 1}
                      </Badge>
                      <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                        {question.text || "Untitled Question"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => moveQuestion(index, "up")}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => moveQuestion(index, "down")}
                        disabled={index === questions.length - 1}
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteQuestion(question.id)}
                        title="Delete Question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Question Text *</Label>
                      <Input
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                        placeholder="e.g. What is your competitive experience?"
                        maxLength={45}
                        className="bg-muted/20 border-border/60 h-9 text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground text-right">
                        {question.text.length}/45
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Description / Subtitle (Optional)</Label>
                        <Input
                          value={question.description}
                          onChange={(e) => updateQuestion(question.id, "description", e.target.value)}
                          placeholder="Help text or clarifying details"
                          maxLength={100}
                          className="bg-muted/20 border-border/60 h-9 text-xs"
                        />
                        <p className="text-[11px] text-muted-foreground text-right">
                          {question.description.length}/100
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Placeholder Text (Optional)</Label>
                        <Input
                          value={question.placeholder}
                          onChange={(e) => updateQuestion(question.id, "placeholder", e.target.value)}
                          placeholder="Placeholder shown inside the input"
                          maxLength={100}
                          className="bg-muted/20 border-border/60 h-9 text-xs"
                        />
                        <p className="text-[11px] text-muted-foreground text-right">
                          {question.placeholder.length}/100
                        </p>
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
                        <Label className="text-xs font-semibold">Configured Options ({question.options.length})</Label>
                        {question.options.length > 0 && (
                          <div className="space-y-2">
                            {question.options.map((option, optIdx) => (
                              <div key={optIdx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/20 border border-border/40 text-xs">
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-foreground">{option.text}</span>
                                  {option.description && (
                                    <p className="text-[11px] text-muted-foreground truncate">{option.description}</p>
                                  )}
                                </div>
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              value={currentOptionText}
                              onChange={(e) => setCurrentOptionText(e.target.value)}
                              placeholder="Option Label (e.g. Diamond / Master)"
                              maxLength={100}
                              className="bg-muted/20 border-border/60 h-8 text-xs"
                            />
                            <Input
                              value={currentOptionDesc}
                              onChange={(e) => setCurrentOptionDesc(e.target.value)}
                              placeholder="Option subtitle/hint (Optional)"
                              maxLength={100}
                              className="bg-muted/20 border-border/60 h-8 text-xs"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addOption(question.id);
                                }
                              }}
                            />
                          </div>
                          <Button 
                            onClick={() => addOption(question.id)} 
                            className="w-full h-8 text-xs font-medium" 
                            variant="secondary"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button onClick={addQuestion} variant="outline" className="w-full rounded-2xl h-11 border-dashed text-xs">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Question {questions.length >= 25 && "(Max 25 reached)"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Live Preview */}
      {step === 3 && (
        <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-border/40 bg-muted/15">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-primary/30 text-primary">
                Live Participant Preview
              </Badge>
              <span className="text-xs text-muted-foreground">{questions.length} questions</span>
            </div>
            <CardTitle className="text-xl font-bold">{formData.title || "Untitled Form"}</CardTitle>
            {formData.description && (
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                {formData.description}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No questions have been added to this form yet. Return to Step 2 to add questions.
              </p>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="space-y-2 p-4 rounded-xl border border-border/40 bg-muted/10">
                  <div className="flex items-start justify-between gap-2">
                    <Label className="text-sm font-semibold">
                      {index + 1}. {question.text || "Untitled Question"} {question.required && <span className="text-primary">*</span>}
                    </Label>
                    <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                      {question.type}
                    </Badge>
                  </div>
                  {question.description && (
                    <p className="text-xs text-muted-foreground">{question.description}</p>
                  )}
                  
                  {question.type === QuestionType.SHORT_TEXT && (
                    <Input placeholder={question.placeholder || "Your answer..."} disabled className="bg-muted/30 border-border/60 h-9 text-xs" />
                  )}
                  {question.type === QuestionType.PARAGRAPH && (
                    <Textarea placeholder={question.placeholder || "Type your detailed answer here..."} disabled rows={3} className="bg-muted/30 border-border/60 text-xs" />
                  )}
                  {question.type === QuestionType.NUMBER && (
                    <Input type="number" placeholder={question.placeholder || "Enter a number"} disabled className="bg-muted/30 border-border/60 h-9 text-xs" />
                  )}
                  {question.type === QuestionType.DATE && (
                    <Input type="date" disabled className="bg-muted/30 border-border/60 h-9 text-xs" />
                  )}
                  {question.type === QuestionType.TIME && (
                    <Input type="time" disabled className="bg-muted/30 border-border/60 h-9 text-xs" />
                  )}
                  {question.type === QuestionType.USER && (
                    <Button variant="outline" className="w-full justify-start text-muted-foreground bg-muted/20 border-border/60 h-9 text-xs" disabled>
                      <span className="mr-2 font-mono">@</span> Search Discord Member...
                    </Button>
                  )}
                  
                  {question.type === QuestionType.MULTIPLE_CHOICE && (
                    <div className="space-y-2 pt-1">
                      {question.options.map((option, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg border border-border/30 bg-background/50">
                          <input type="radio" name={`question-${question.id}`} disabled className="mt-0.5" />
                          <div className="text-xs">
                            <span className="font-semibold text-foreground">{option.text}</span>
                            {option.description && <p className="text-[11px] text-muted-foreground mt-0.5">{option.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === QuestionType.CHECKBOXES && (
                    <div className="space-y-2 pt-1">
                      {question.options.map((option, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg border border-border/30 bg-background/50">
                          <input type="checkbox" disabled className="mt-0.5" />
                          <div className="text-xs">
                            <span className="font-semibold text-foreground">{option.text}</span>
                            {option.description && <p className="text-[11px] text-muted-foreground mt-0.5">{option.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === QuestionType.CHECKBOX && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/30 bg-background/50">
                      <input type="checkbox" disabled />
                      <span className="text-xs font-medium">I agree to the terms above</span>
                    </div>
                  )}
                  
                  {question.type === QuestionType.DROPDOWN && (
                    <Select disabled>
                      <SelectTrigger className="bg-muted/30 border-border/60 h-9 text-xs">
                        <SelectValue placeholder="Select an option from list" />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options.map((option, idx) => (
                          <SelectItem key={idx} value={option.text}>{option.text}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="text-xs h-9"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        
        <div className="text-xs text-muted-foreground hidden sm:block">
          Step {step} of 3
        </div>

        {step < 3 ? (
          <Button 
            size="sm"
            onClick={() => setStep(step + 1)} 
            disabled={step === 1 && !formData.title.trim()}
            className="text-xs h-9"
          >
            Continue
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button 
            size="sm"
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[130px] text-xs h-9"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Form"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
