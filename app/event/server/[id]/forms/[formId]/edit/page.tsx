"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, ArrowLeft, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuestionType } from "@prisma/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface Question {
  id: string;
  text: string;
  description: string;
  placeholder: string;
  type: QuestionType;
  required: boolean;
  options: { id?: string; text: string }[];
  order: number;
  min?: number;
  max?: number;
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

export default async function EditFormPage({ params }: { params: Promise<{ id: string; formId: string }> }) {
  const { id, formId } = await params;
  
  return <EditFormClient guildId={id} formId={formId} />;
}

function EditFormClient({ guildId, formId }: { guildId: string; formId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [channels, setChannels] = useState<{ id: string; name: string; position: number }[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  
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
  const [currentOption, setCurrentOption] = useState("");

  useEffect(() => {
    fetchForm();
    fetchChannels();
  }, [formId]);

  const fetchForm = async () => {
    try {
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
        title: data.title,
        description: data.description || "",
        questions: data.questions,
        channel_id: data.channel_id ? data.channel_id.toString() : "",
        maxResponsesPerUser: data.maxResponsesPerUser ?? 1,
        submissionCooldown: cooldown,
        submissionCooldownUnit: unit,
        custom_response: data.custom_response || false,
        accept_response: data.accept_response || "",
        reject_response: data.reject_response || "",
      });
      
      setQuestions(data.questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        description: q.description || "",
        placeholder: q.placeholder || "",
        type: q.type,
        required: q.required,
        options: q.options.map((o: any) => ({ id: o.id, text: o.text })),
        order: q.order,
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
      // Filter for text channels and sort by position
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
              if (updated.min === undefined || updated.min === null) updated.min = 1;
              if (updated.max === undefined || updated.max === null) updated.max = 1;
          } else {
               // clear mins/maxes when switching to non-constrained types
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
    if (!currentOption.trim()) return;
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOption = { 
        id: `new-${Math.random().toString(36).substring(7)}`, 
        text: currentOption 
      };
      updateQuestion(questionId, "options", [...question.options, newOption]);
      setCurrentOption("");
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

    if (formData.title.length > 200) {
      toast({ title: "Error", description: "Form title must be 200 characters or less", variant: "destructive" });
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

    if (questions.length > 30) {
      toast({ title: "Error", description: "Maximum 30 questions allowed per form", variant: "destructive" });
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.text.trim()) {
        toast({ title: "Error", description: `Question ${i + 1} text is required`, variant: "destructive" });
        return;
      }

      if (q.text.length > 200) {
        toast({ title: "Error", description: `Question ${i + 1} text must be 200 characters or less`, variant: "destructive" });
        return;
      }

      if (q.description.length > 400) {
        toast({ title: "Error", description: `Question ${i + 1} description must be 400 characters or less`, variant: "destructive" });
        return;
      }

      if (q.placeholder.length > 400) {
        toast({ title: "Error", description: `Question ${i + 1} placeholder must be 400 characters or less`, variant: "destructive" });
        return;
      }

      if (needsOptions(q.type) && q.options.length < 2) {
        toast({ title: "Error", description: `Question ${i + 1} must have at least 2 options`, variant: "destructive" });
        return;
      }

      // Options validation or User Selection validation
      if (needsOptions(q.type) || q.type === QuestionType.USER) {
          if (q.min !== undefined && q.min !== null) {
              if (q.min < 0 || q.min > 25) {
                  toast({ title: "Error", description: `Question ${i + 1} min selection must be between 0 and 25`, variant: "destructive" });
                  return;
              }
              if (needsOptions(q.type) && q.min > q.options.length) {
                   toast({ title: "Error", description: `Question ${i + 1} min selection cannot exceed number of options`, variant: "destructive" });
                   return;
              }
          }
          if (q.max !== undefined && q.max !== null) {
               if (q.max < 1 || q.max > 25) {
                   toast({ title: "Error", description: `Question ${i + 1} max selection must be between 1 and 25`, variant: "destructive" });
                   return;
               }
               if (needsOptions(q.type) && q.max > q.options.length) {
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

  const needsOptions = (type: QuestionType) => {
    return [QuestionType.MULTIPLE_CHOICE, QuestionType.CHECKBOXES, QuestionType.DROPDOWN].includes(type as any);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Form</h1>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "edit" ? "default" : "outline"}
            onClick={() => setActiveTab("edit")}
            size="sm"
          >
            Edit
          </Button>
          <Button
            variant={activeTab === "preview" ? "default" : "outline"}
            onClick={() => setActiveTab("preview")}
            size="sm"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      {activeTab === "edit" ? (
        <>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Form Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter form title"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter form description (optional)"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxResponses">Max Submissions per User</Label>
                  <Input 
                    id="maxResponses"
                    type="number" 
                    min="0"
                    value={formData.maxResponsesPerUser}
                    onChange={(e) => setFormData({...formData, maxResponsesPerUser: parseInt(e.target.value) || 0})}
                  />
                  <p className="text-xs text-muted-foreground">Set to 0 for unlimited submissions.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cooldown">Submission Cooldown</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="cooldown"
                      type="number" 
                      min="0"
                      value={formData.submissionCooldown}
                      onChange={(e) => setFormData({...formData, submissionCooldown: parseInt(e.target.value) || 0})}
                      placeholder="No cooldown"
                    />
                    <Select 
                      value={formData.submissionCooldownUnit} 
                      onValueChange={(value) => setFormData({...formData, submissionCooldownUnit: value})}
                    >
                      <SelectTrigger className="w-[110px]">
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
                  <p className="text-xs text-muted-foreground">Wait time between submissions.</p>
                </div>
              </div>

              <div>
                <Label htmlFor="channel">Discord Channel (Optional)</Label>
                <Popover open={channelOpen} onOpenChange={setChannelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={channelOpen}
                      className="w-full justify-between"
                      disabled={isLoadingChannels}
                    >
                      {isLoadingChannels ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : formData.channel_id ? (
                        channels.find((channel) => channel.id === formData.channel_id)?.name || "Select a channel"
                      ) : (
                        "Select a channel"
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command className="max-h-[300px] overflow-y-auto">
                      <CommandInput placeholder="Search channels..." />
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
                            # {channel.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a text channel to associate this form with (optional)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Response Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="custom_response" 
                  checked={formData.custom_response}
                  onCheckedChange={(checked: boolean) => setFormData({...formData, custom_response: checked})}
                />
                <div>
                  <Label htmlFor="custom_response">Enable Custom Response Dialog</Label>
                  <p className="text-sm text-muted-foreground">
                    If enabled, you will be prompted to edit the response message before sending.
                  </p>
                </div>
              </div>
              
              <div className="grid gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="accept_response">Default Acceptance Message</Label>
                    <Textarea 
                      id="accept_response"
                      value={formData.accept_response} 
                      onChange={(e) => setFormData({...formData, accept_response: e.target.value})}
                      placeholder="Message sent when response is accepted..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reject_response">Default Rejection Message</Label>
                    <Textarea 
                      id="reject_response"
                      value={formData.reject_response} 
                      onChange={(e) => setFormData({...formData, reject_response: e.target.value})}
                      placeholder="Message sent when response is rejected..."
                      rows={3}
                    />
                  </div>
              </div>
            </CardContent>
          </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            {questions.length}/30 questions
          </p>
        </div>
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveQuestion(index, "up")}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveQuestion(index, "down")}
                    disabled={index === questions.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Question Text *</Label>
                <Input
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                  placeholder="Enter your question"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {question.text.length}/200 characters
                </p>
              </div>
              
              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  value={question.description}
                  onChange={(e) => updateQuestion(question.id, "description", e.target.value)}
                  placeholder="Add a description or help text for this question"
                  rows={2}
                  maxLength={400}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {question.description.length}/400 characters
                </p>
              </div>
              
              <div>
                <Label>Placeholder (Optional)</Label>
                <Input
                  value={question.placeholder}
                  onChange={(e) => updateQuestion(question.id, "placeholder", e.target.value)}
                  placeholder="Enter placeholder text for the answer field"
                  maxLength={400}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {question.placeholder.length}/400 characters
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) => updateQuestion(question.id, "type", value as QuestionType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={QuestionType.SHORT_TEXT}>Short Text</SelectItem>
                      <SelectItem value={QuestionType.PARAGRAPH}>Paragraph</SelectItem>
                      <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Single select</SelectItem>
                      <SelectItem value={QuestionType.CHECKBOXES}>Checkboxes</SelectItem>
                      <SelectItem value={QuestionType.CHECKBOX}>Checkbox</SelectItem>
                      <SelectItem value={QuestionType.DROPDOWN}>Dropdown</SelectItem>
                      <SelectItem value={QuestionType.DATE}>Date</SelectItem>
                      <SelectItem value={QuestionType.TIME}>Time</SelectItem>
                      <SelectItem value={QuestionType.NUMBER}>Number</SelectItem>
                      <SelectItem value={QuestionType.USER}>User Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 pt-8">
                  <Switch
                    checked={question.required}
                    disabled={question.type === QuestionType.CHECKBOX}
                    onCheckedChange={(checked) => updateQuestion(question.id, "required", checked)}
                  />
                  <Label>Required</Label>
                </div>
              </div>

              {/* Min/Max Settings */}
              <div className="grid grid-cols-2 gap-4">
                 {(question.type === QuestionType.SHORT_TEXT || question.type === QuestionType.PARAGRAPH || question.type === QuestionType.NUMBER) && (
                   <>
                      <div>
                        <Label>{question.type === QuestionType.NUMBER ? "Min Value" : "Min Length"}</Label>
                        <Input 
                          type="number" 
                          value={question.min ?? ''} 
                          onChange={(e) => updateQuestion(question.id, "min", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={question.type === QuestionType.NUMBER ? "Optional" : "Optional (Max 4000)"}
                        />
                      </div>
                      <div>
                        <Label>{question.type === QuestionType.NUMBER ? "Max Value" : "Max Length"}</Label>
                        <Input 
                          type="number" 
                          value={question.max ?? ''} 
                          onChange={(e) => updateQuestion(question.id, "max", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={question.type === QuestionType.NUMBER ? "Optional" : "Optional (Max 4000)"}
                        />
                      </div>
                   </>
                 )}
                 
                 {(needsOptions(question.type) || question.type === QuestionType.USER) && (
                   <>
                      <div>
                        <Label>Min Selection</Label>
                        <Input 
                          type="number" 
                          value={question.min ?? ''} 
                          onChange={(e) => updateQuestion(question.id, "min", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={question.required ? "Default 1" : "Default 0"}
                          max={25}
                        />
                      </div>
                      <div>
                        <Label>Max Selection</Label>
                        <Input 
                          type="number" 
                          value={question.max ?? ''} 
                          onChange={(e) => updateQuestion(question.id, "max", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Default 1 (Max 25)"
                          max={25}
                        />
                      </div>
                   </>
                 )}
              </div>

              {needsOptions(question.type) && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {question.options.map((option, optIdx) => (
                      <div key={optIdx} className="flex gap-2">
                        <Input value={option.text} disabled />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeOption(question.id, optIdx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={currentOption}
                        onChange={(e) => setCurrentOption(e.target.value)}
                        placeholder="Add an option"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOption(question.id);
                          }
                        }}
                      />
                      <Button onClick={() => addOption(question.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        <Button onClick={addQuestion} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Question {questions.length >= 30 && "(Max 30 reached)"}
        </Button>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </>
      ) : (
        // Preview Mode
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-3xl">{formData.title}</CardTitle>
              {formData.description && (
                <CardDescription className="text-base">{formData.description}</CardDescription>
              )}
            </CardHeader>
          </Card>

          {questions.map((question, index) => (
            <Card key={question.id} className="mb-4">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Label className="text-base">
                    {index + 1}. {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {question.description && (
                    <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                  )}

                  {question.type === QuestionType.SHORT_TEXT && (
                    <Input
                      placeholder={question.placeholder || "Your answer"}
                      disabled
                    />
                  )}

                  {question.type === QuestionType.PARAGRAPH && (
                    <Textarea
                      placeholder={question.placeholder || "Your answer"}
                      rows={4}
                      disabled
                    />
                  )}

                  {question.type === QuestionType.NUMBER && (
                    <Input
                      type="number"
                      placeholder={question.placeholder || "Your answer"}
                      disabled
                    />
                  )}

                  {question.type === QuestionType.DATE && (
                    <Input type="date" disabled />
                  )}

                  {question.type === QuestionType.TIME && (
                    <Input type="time" disabled />
                  )}

                  {question.type === QuestionType.MULTIPLE_CHOICE && (
                    <RadioGroup disabled>
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.text} id={`preview-${question.id}-${option.id}`} />
                          <Label htmlFor={`preview-${question.id}-${option.id}`} className="font-normal">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === QuestionType.CHECKBOXES && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`preview-${question.id}-${option.id}`}
                            disabled
                          />
                          <Label htmlFor={`preview-${question.id}-${option.id}`} className="font-normal">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === QuestionType.CHECKBOX && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`preview-${question.id}`}
                        disabled
                      />
                      <Label htmlFor={`preview-${question.id}`} className="font-normal">
                        Yes
                      </Label>
                    </div>
                  )}

                  {question.type === QuestionType.DROPDOWN && (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options.map((option) => (
                          <SelectItem key={option.id} value={option.text}>
                            {option.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end gap-4 mt-6">
            <Button disabled>
              Submit (Preview Only)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
