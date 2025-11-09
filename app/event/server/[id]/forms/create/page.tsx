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
  options: string[];
  order: number;
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
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentOption, setCurrentOption] = useState("");

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
    if (questions.length >= 30) {
      toast({ 
        title: "Error", 
        description: "Maximum 30 questions allowed per form", 
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
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id).map((q, idx) => ({ ...q, order: idx })));
  };

  const addOption = (questionId: string) => {
    if (!currentOption.trim()) return;
    const question = questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, "options", [...question.options, currentOption]);
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
          questions: questions.map(q => ({
            text: q.text,
            description: q.description,
            placeholder: q.placeholder,
            type: q.type,
            required: q.required,
            options: q.options,
            order: q.order,
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
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-8">
                    <Switch
                      checked={question.required}
                      onCheckedChange={(checked) => updateQuestion(question.id, "required", checked)}
                    />
                    <Label>Required</Label>
                  </div>
                </div>

                {needsOptions(question.type) && (
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} className="flex gap-2">
                          <Input value={option} disabled />
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
                
                {question.type === QuestionType.SHORT_TEXT && <Input placeholder={question.placeholder || "Your answer"} disabled />}
                {question.type === QuestionType.PARAGRAPH && <Textarea placeholder={question.placeholder || "Your answer"} disabled rows={3} />}
                {question.type === QuestionType.NUMBER && <Input type="number" placeholder={question.placeholder || "Your answer"} disabled />}
                {question.type === QuestionType.DATE && <Input type="date" disabled />}
                {question.type === QuestionType.TIME && <Input type="time" disabled />}
                
                {question.type === QuestionType.MULTIPLE_CHOICE && (
                  <div className="space-y-2">
                    {question.options.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="radio" name={`question-${question.id}`} disabled />
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.type === QuestionType.CHECKBOXES && (
                  <div className="space-y-2">
                    {question.options.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="checkbox" disabled />
                        <span>{option}</span>
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
                        <SelectItem key={idx} value={option}>{option}</SelectItem>
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
