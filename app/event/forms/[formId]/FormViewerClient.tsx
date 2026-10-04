"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Loader2, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  AtSign, 
  ArrowLeft,
  Calendar,
  Send,
  AlertCircle
} from "lucide-react";
import { QuestionType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  description?: string | null;
  placeholder?: string | null;
  type: QuestionType;
  required: boolean;
  options: Option[];
  order: number;
  min?: number | null;
  max?: number | null;
}

interface FormData {
  id: string;
  title: string;
  description: string | null;
  maxResponsesPerUser: number;
  submissionCooldown: number;
  guild_id: string;
  channel_id: string | null;
  questions: Question[];
}

export function FormViewerClient({ 
  formData, 
  userName, 
  userEmail,
  userImage,
  userSubmissionCount = 0,
  lastSubmissionDate = null,
}: { 
  formData: FormData; 
  userName: string; 
  userEmail: string;
  userImage: string | null;
  userSubmissionCount?: number;
  lastSubmissionDate?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (submissionError) setSubmissionError(null);
  };

  const handleCheckboxChange = (questionId: string, optionText: string, checked: boolean) => {
    const currentAnswers = (answers[questionId] as string[]) || [];
    if (checked) {
      handleAnswerChange(questionId, [...currentAnswers, optionText]);
    } else {
      handleAnswerChange(questionId, currentAnswers.filter((a) => a !== optionText));
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "a moment";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSecs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    if (days === 0 && hours === 0 && remainingSecs > 0) {
      parts.push(`${remainingSecs} second${remainingSecs > 1 ? "s" : ""}`);
    }
    return parts.join(", ") || `${seconds} seconds`;
  };

  const validateForm = () => {
    if (!formData) return false;

    // Check required questions and constraints
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      const answer = answers[question.id];
      const isEmpty = !answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === "string" && !answer.trim());

      if (question.required && isEmpty) {
        const errorMsg = `Please answer required question: "${question.text}"`;
        setSubmissionError(errorMsg);
        toast({ 
          title: "Required Field Missing", 
          description: errorMsg, 
          variant: "destructive" 
        });
        return false;
      }

      // Check min/max constraints when value is provided
      if (!isEmpty) {
        if (question.type === QuestionType.SHORT_TEXT || question.type === QuestionType.PARAGRAPH) {
          const textVal = (answer as string) || "";
          if (question.min !== null && question.min !== undefined && textVal.length < question.min) {
            const errorMsg = `"${question.text}" requires at least ${question.min} characters`;
            setSubmissionError(errorMsg);
            toast({
              title: "Validation Error",
              description: errorMsg,
              variant: "destructive",
            });
            return false;
          }
          if (question.max !== null && question.max !== undefined && textVal.length > question.max) {
            const errorMsg = `"${question.text}" cannot exceed ${question.max} characters`;
            setSubmissionError(errorMsg);
            toast({
              title: "Validation Error",
              description: errorMsg,
              variant: "destructive",
            });
            return false;
          }
        }

        if (question.type === QuestionType.NUMBER) {
          const numVal = parseFloat(answer as string);
          if (!isNaN(numVal)) {
            if (question.min !== null && question.min !== undefined && numVal < question.min) {
              const errorMsg = `"${question.text}" must be at least ${question.min}`;
              setSubmissionError(errorMsg);
              toast({
                title: "Validation Error",
                description: errorMsg,
                variant: "destructive",
              });
              return false;
            }
            if (question.max !== null && question.max !== undefined && numVal > question.max) {
              const errorMsg = `"${question.text}" cannot exceed ${question.max}`;
              setSubmissionError(errorMsg);
              toast({
                title: "Validation Error",
                description: errorMsg,
                variant: "destructive",
              });
              return false;
            }
          }
        }

        if (question.type === QuestionType.CHECKBOXES) {
          const selected = (answer as string[]) || [];
          if (question.min !== null && question.min !== undefined && selected.length < question.min) {
            const errorMsg = `Please select at least ${question.min} option(s) for "${question.text}"`;
            setSubmissionError(errorMsg);
            toast({
              title: "Validation Error",
              description: errorMsg,
              variant: "destructive",
            });
            return false;
          }
          if (question.max !== null && question.max !== undefined && selected.length > question.max) {
            const errorMsg = `Please select at most ${question.max} option(s) for "${question.text}"`;
            setSubmissionError(errorMsg);
            toast({
              title: "Validation Error",
              description: errorMsg,
              variant: "destructive",
            });
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    // 1. Check max submission limit if configured (> 0 means limited, 0 means unlimited)
    if (formData.maxResponsesPerUser > 0 && userSubmissionCount >= formData.maxResponsesPerUser) {
      const errorMsg = `Submission limit reached: You have already submitted ${userSubmissionCount} of ${formData.maxResponsesPerUser} allowed response(s) for this form.`;
      setSubmissionError(errorMsg);
      toast({
        title: "Submission Limit Exceeded",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // 2. Check cooldown calculated from old response and submitted date
    if (formData.submissionCooldown > 0 && lastSubmissionDate) {
      const lastSubmittedTime = new Date(lastSubmissionDate).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastSubmittedTime) / 1000);
      
      if (elapsedSeconds < formData.submissionCooldown) {
        const remainingSeconds = formData.submissionCooldown - elapsedSeconds;
        const waitFormatted = formatTimeRemaining(remainingSeconds);
        const errorMsg = `Submission cooldown active: Please wait ${waitFormatted} before submitting again (last response submitted on ${new Date(lastSubmissionDate).toLocaleDateString()} at ${new Date(lastSubmissionDate).toLocaleTimeString()}).`;
        setSubmissionError(errorMsg);
        toast({
          title: "Cooldown Active",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
    }

    // 3. Question validation
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/forms/${formData.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          userEmail,
          answers: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value: Array.isArray(value) ? value.join(", ") : value,
          })),
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        const errorMsg = resData?.error || "Failed to submit response";
        setSubmissionError(errorMsg);
        throw new Error(errorMsg);
      }

      toast({ 
        title: "Response Submitted", 
        description: "Your answers have been securely recorded." 
      });
      setIsSubmitted(true);
    } catch (error: any) {
      toast({ 
        title: "Submission Failed", 
        description: error.message || "Failed to submit response", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (isSubmitted) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-2xl space-y-6">
        <Card className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md shadow-xl overflow-hidden text-center p-8 sm:p-12 space-y-6">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold px-3 py-1 rounded-full">
              Submitted Successfully
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Thank You, {userName}!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your response to <strong className="text-foreground">{formData.title}</strong> has been received and recorded.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 text-xs text-muted-foreground max-w-sm mx-auto space-y-1">
            <div className="flex items-center justify-between">
              <span>Submitted as</span>
              <span className="font-semibold text-foreground font-mono">@{userName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="text-emerald-500 font-medium">Pending Review</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-xl border-border/60 text-xs font-semibold">
              <Link href="/event/forms">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Browse More Forms
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto rounded-xl text-xs font-semibold">
              <Link href="/event">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                Explore Events
              </Link>
            </Button>
            {formData.maxResponsesPerUser !== 1 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setAnswers({});
                  setSubmissionError(null);
                  setIsSubmitted(false);
                }}
                className="w-full sm:w-auto rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Submit Another Response
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/event" className="hover:text-foreground transition-colors">
          Events
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        <Link href="/event/forms" className="hover:text-foreground transition-colors">
          Forms
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
        <span className="text-foreground font-medium truncate max-w-[220px]">
          {formData.title}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Header Card - Clean & uncluttered */}
        <Card className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden">
          <div className="p-8 border-b border-border/40 bg-muted/20 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {formData.title}
            </h1>
            {formData.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {formData.description}
              </p>
            ) : null}
          </div>

          {/* Respondent Identity Strip */}
          <div className="p-4 sm:p-5 bg-muted/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {userImage ? (
                <div className="relative h-9 w-9 rounded-full overflow-hidden border border-border/60">
                  <Image 
                    src={userImage} 
                    alt={userName} 
                    fill 
                    className="object-cover" 
                  />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground leading-tight flex items-center gap-1.5">
                  @{userName}
                  <span className="text-[10px] text-muted-foreground font-normal">
                    (Verified Discord User)
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{userEmail}</p>
              </div>
            </div>

            <Badge variant="outline" className="hidden sm:inline-flex border-border/60 text-[10px] text-muted-foreground gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Authenticated
            </Badge>
          </div>
        </Card>

        {/* Validation Failure Alert */}
        {submissionError && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3 text-xs leading-relaxed animate-in fade-in-50">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-destructive" />
            <div className="space-y-0.5">
              <p className="font-semibold text-sm">Submission Validation Failed</p>
              <p className="text-destructive/90">{submissionError}</p>
            </div>
          </div>
        )}

        {/* Questions Section */}
        <div className="space-y-4">
          {formData.questions.map((question, index) => {
            const currentAnswer = answers[question.id];

            return (
              <Card 
                key={question.id} 
                className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm p-6 space-y-3.5 transition-all duration-200 hover:border-border/80"
              >
                <div>
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span>{question.text}</span>
                    {question.required && (
                      <span className="text-destructive font-bold" title="Required">*</span>
                    )}
                  </Label>
                  {question.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 ml-8 leading-relaxed">
                      {question.description}
                    </p>
                  )}
                </div>

                <div className="ml-8 pt-1">
                  {/* Short Text */}
                  {question.type === QuestionType.SHORT_TEXT && (
                    <div className="space-y-1">
                      <Input
                        value={(currentAnswer as string) || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder={question.placeholder || "Your answer"}
                        maxLength={question.max || undefined}
                        className="bg-muted/20 border-border/60 h-10 text-sm"
                      />
                      {(question.min || question.max) && (
                        <p className="text-[11px] text-muted-foreground text-right">
                          {((currentAnswer as string) || "").length} / {question.max || "No max"} chars
                          {question.min ? ` (min ${question.min})` : ""}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Paragraph */}
                  {question.type === QuestionType.PARAGRAPH && (
                    <div className="space-y-1">
                      <Textarea
                        value={(currentAnswer as string) || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder={question.placeholder || "Type your detailed response..."}
                        rows={4}
                        maxLength={question.max || undefined}
                        className="bg-muted/20 border-border/60 text-sm resize-none"
                      />
                      {(question.min || question.max) && (
                        <p className="text-[11px] text-muted-foreground text-right">
                          {((currentAnswer as string) || "").length} / {question.max || "No max"} chars
                          {question.min ? ` (min ${question.min})` : ""}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Number */}
                  {question.type === QuestionType.NUMBER && (
                    <div className="space-y-1 max-w-xs">
                      <Input
                        type="number"
                        value={(currentAnswer as string) || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder={question.placeholder || "Enter a numeric value"}
                        min={question.min ?? undefined}
                        max={question.max ?? undefined}
                        className="bg-muted/20 border-border/60 h-10 text-sm"
                      />
                      {(question.min !== null && question.min !== undefined || question.max !== null && question.max !== undefined) && (
                        <p className="text-[11px] text-muted-foreground">
                          {question.min !== null ? `Min: ${question.min}` : ""}
                          {question.min !== null && question.max !== null ? " • " : ""}
                          {question.max !== null ? `Max: ${question.max}` : ""}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  {question.type === QuestionType.DATE && (
                    <div className="max-w-xs">
                      <Input
                        type="date"
                        value={(currentAnswer as string) || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="bg-muted/20 border-border/60 h-10 text-sm"
                      />
                    </div>
                  )}

                  {/* Time */}
                  {question.type === QuestionType.TIME && (
                    <div className="max-w-xs">
                      <Input
                        type="time"
                        value={(currentAnswer as string) || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="bg-muted/20 border-border/60 h-10 text-sm"
                      />
                    </div>
                  )}

                  {/* Multiple Choice (Radio) */}
                  {question.type === QuestionType.MULTIPLE_CHOICE && (
                    <RadioGroup
                      value={(currentAnswer as string) || ""}
                      onValueChange={(val) => handleAnswerChange(question.id, val)}
                      className="space-y-2"
                    >
                      {question.options.map((option) => (
                        <div 
                          key={option.id} 
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-xl border transition-colors cursor-pointer",
                            currentAnswer === option.text
                              ? "border-primary/60 bg-primary/5 text-foreground"
                              : "border-border/40 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => handleAnswerChange(question.id, option.text)}
                        >
                          <RadioGroupItem value={option.text} id={`${question.id}-${option.id}`} />
                          <Label htmlFor={`${question.id}-${option.id}`} className="text-xs font-normal cursor-pointer flex-1">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {/* Checkboxes (Multiple Select) */}
                  {question.type === QuestionType.CHECKBOXES && (
                    <div className="space-y-2">
                      {question.options.map((option) => {
                        const isChecked = ((currentAnswer as string[]) || []).includes(option.text);
                        return (
                          <div 
                            key={option.id} 
                            className={cn(
                              "flex items-center space-x-3 p-3 rounded-xl border transition-colors cursor-pointer",
                              isChecked
                                ? "border-primary/60 bg-primary/5 text-foreground"
                                : "border-border/40 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => handleCheckboxChange(question.id, option.text, !isChecked)}
                          >
                            <Checkbox
                              id={`${question.id}-${option.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(question.id, option.text, checked as boolean)
                              }
                            />
                            <Label htmlFor={`${question.id}-${option.id}`} className="text-xs font-normal cursor-pointer flex-1">
                              {option.text}
                            </Label>
                          </div>
                        );
                      })}
                      {(question.min || question.max) && (
                        <p className="text-[11px] text-muted-foreground pt-1">
                          {question.min ? `Select at least ${question.min}` : ""}
                          {question.min && question.max ? " • " : ""}
                          {question.max ? `Select at most ${question.max}` : ""}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Single Checkbox (Agreement) */}
                  {question.type === QuestionType.CHECKBOX && (
                    <div 
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-xl border transition-colors cursor-pointer max-w-md",
                        currentAnswer === "true"
                          ? "border-primary/60 bg-primary/5 text-foreground"
                          : "border-border/40 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handleAnswerChange(question.id, currentAnswer === "true" ? "false" : "true")}
                    >
                      <Checkbox
                        id={`cb-${question.id}`}
                        checked={currentAnswer === "true"}
                        onCheckedChange={(checked) => 
                          handleAnswerChange(question.id, checked ? "true" : "false")
                        }
                      />
                      <Label htmlFor={`cb-${question.id}`} className="text-xs font-medium cursor-pointer">
                        {question.placeholder || "I agree and confirm the above"}
                      </Label>
                    </div>
                  )}

                  {/* Dropdown */}
                  {question.type === QuestionType.DROPDOWN && (
                    <div className="max-w-md">
                      <Select
                        value={(currentAnswer as string) || ""}
                        onValueChange={(val) => handleAnswerChange(question.id, val)}
                      >
                        <SelectTrigger className="bg-muted/20 border-border/60 h-10 text-xs">
                          <SelectValue placeholder={question.placeholder || "Choose an option"} />
                        </SelectTrigger>
                        <SelectContent>
                          {question.options.map((option) => (
                            <SelectItem key={option.id} value={option.text} className="text-xs">
                              {option.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Discord User Selection */}
                  {question.type === QuestionType.USER && (
                    <div className="space-y-1 max-w-md">
                      <div className="relative">
                        <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={(currentAnswer as string) || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder={question.placeholder || "username#0000 or Discord User ID"}
                          className="pl-9 bg-muted/20 border-border/60 h-10 text-sm font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Enter the Discord username, mention, or user ID.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Sticky Action Strip */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/60 shadow-lg">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/event/forms")}
            className="rounded-xl border-border/60 text-xs font-medium"
          >
            Cancel
          </Button>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="rounded-xl text-xs font-semibold px-6 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Response...
              </>
            ) : (
              <>
                <Send className="mr-2 h-3.5 w-3.5" />
                Submit Response
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
