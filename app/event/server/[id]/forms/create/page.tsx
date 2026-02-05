"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuestionType } from "@prisma/client";
import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Form</h1>
        <p className="text-muted-foreground">Step {step} of 3</p>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
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
                maxLength={25}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/25 characters
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxResponses">Max Responses Per User</Label>
                <Input
                  id="maxResponses"
                  type="number"
                  min="1"
                  value={formData.maxResponsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxResponsesPerUser: e.target.value })}
                  placeholder="Unlimited"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited responses
                </p>
              </div>
              
              <div>
                <Label htmlFor="cooldown">Submission Cooldown</Label>
                <div className="flex gap-2">
                  <Input
                    id="cooldown"
                    type="number"
                    min="0"
                    value={formData.submissionCooldown}
                    onChange={(e) => setFormData({ ...formData, submissionCooldown: e.target.value })}
                    placeholder="No cooldown"
                  />
                  <Select
                    value={formData.submissionCooldownUnit}
                    onValueChange={(value) => setFormData({ ...formData, submissionCooldownUnit: value })}
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
                <p className="text-xs text-muted-foreground mt-1">
                  Wait time between submissions
                </p>
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
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
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
                  maxLength={45}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {question.text.length}/45 characters
                </p>
              </div>
              
              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  value={question.description}
                  onChange={(e) => updateQuestion(question.id, "description", e.target.value)}
                  placeholder="Add a description or help text for this question"
                  rows={2}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {question.description.length}/100 characters
                </p>
              </div>
              
              <div>
                <Label>Placeholder (Optional)</Label>
                <Input
                  value={question.placeholder}
                  onChange={(e) => updateQuestion(question.id, "placeholder", e.target.value)}
                  placeholder="Enter placeholder text for the answer field"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {question.placeholder.length}/100 characters
                </p>
              </div>                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                        <SelectItem value={QuestionType.CHECKBOXES}>Checkboxes</SelectItem>
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
                      onCheckedChange={(checked) => {
                          const newRequired = checked;
                          let updates: any = { required: newRequired };
                          // If checking required and min is 0 or undefined, set min to 1 for select/user types
                          // Only if they haven't manually set it (we can't really track "manual" easily here without more state,
                          // but typical UX is to set reasonable defaults when toggling required)
                          // However, user requirement says: "if requried min can be 0". 
                          // So we don't force it. But we should probably ensure defaults exist if they are fresh.
                          if ((needsOptions(question.type) || question.type === QuestionType.USER) && 
                              (question.min === undefined || question.min === null)) {
                                updates.min = newRequired ? 1 : 0;
                          }
                          updateQuestion(question.id, "required", newRequired);
                          // We can't update multiple fields with updateQuestion helper easily as written, 
                          // let's just update required. The defaults are handled in the validation logic.
                      }}
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
                    <div className="space-y-4">
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <Input value={option.text} disabled className="bg-muted" />
                            {option.description && (
                              <p className="text-xs text-muted-foreground truncate">{option.description}</p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeOption(question.id, optIdx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="space-y-2 border p-4 rounded-md">
                        <Label className="text-xs text-muted-foreground">Add New Option</Label>
                        <Input
                          value={currentOptionText}
                          onChange={(e) => setCurrentOptionText(e.target.value)}
                          placeholder="Option Text (Max 100)"
                          maxLength={100}
                        />
                         <p className="text-xs text-muted-foreground text-right">
                            {currentOptionText.length}/100
                         </p>
                        <Input
                          value={currentOptionDesc}
                          onChange={(e) => setCurrentOptionDesc(e.target.value)}
                          placeholder="Option Description (Optional, Max 100)"
                          maxLength={100}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addOption(question.id);
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                             {currentOptionDesc.length}/100
                        </p>
                        <Button onClick={() => addOption(question.id)} className="w-full" variant="secondary" size="sm">
                          <Plus className="h-4 w-4 mr-2" /> Add Option
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
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{formData.title}</CardTitle>
            {formData.description && <p className="text-muted-foreground">{formData.description}</p>}
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <Label>
                  {index + 1}. {question.text} {question.required && <span className="text-red-500">*</span>}
                </Label>
                {question.description && (
                  <p className="text-sm text-muted-foreground">{question.description}</p>
                )}
                
                {question.type === QuestionType.SHORT_TEXT && <Input placeholder={question.placeholder} disabled />}
                {question.type === QuestionType.PARAGRAPH && <Textarea placeholder={question.placeholder} disabled rows={3} />}
                {question.type === QuestionType.NUMBER && <Input type="number" placeholder={question.placeholder} disabled />}
                {question.type === QuestionType.DATE && <Input type="date" disabled />}
                {question.type === QuestionType.TIME && <Input type="time" disabled />}
                {question.type === QuestionType.USER && (
                  <Button variant="outline" className="w-full justify-start text-muted-foreground" disabled>
                    <span className="mr-2">@</span> Select User
                  </Button>
                )}
                
                {question.type === QuestionType.MULTIPLE_CHOICE && (
                  <div className="space-y-2">
                    {question.options.map((option, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <input type="radio" name={`question-${question.id}`} disabled className="mt-1" />
                        <div>
                           <span className="text-sm font-medium">{option.text}</span>
                           {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.type === QuestionType.CHECKBOXES && (
                  <div className="space-y-2">
                    {question.options.map((option, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <input type="checkbox" disabled className="mt-1" />
                         <div>
                           <span className="text-sm font-medium">{option.text}</span>
                           {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.type === QuestionType.DROPDOWN && (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((option, idx) => (
                        <SelectItem key={idx} value={option.text}>{option.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !formData.title.trim()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Form"}
          </Button>
        )}
      </div>
    </div>
  );
}
