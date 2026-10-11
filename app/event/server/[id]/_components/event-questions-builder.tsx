"use client";

import { useState } from "react";
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
  ArrowUp, 
  ArrowDown, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  AtSign, 
  List, 
  CheckSquare, 
  Calendar, 
  Clock, 
  Hash, 
  Type, 
  AlignLeft, 
  ChevronsUpDown,
  AlertCircle
} from "lucide-react";
import { EventQuestion, EventQuestionOption, QuestionType } from "@/types";
import { cn } from "@/lib/utils";

export const QUESTION_TYPES: { type: QuestionType; label: string; desc: string; icon: any }[] = [
  { type: QuestionType.SHORT_TEXT, label: "Short Text", desc: "Single line text input (up to 4,000 chars)", icon: Type },
  { type: QuestionType.PARAGRAPH, label: "Paragraph", desc: "Multi-line detailed text input", icon: AlignLeft },
  { type: QuestionType.MULTIPLE_CHOICE, label: "Single Select (Radio)", desc: "Choose one option from a list", icon: List },
  { type: QuestionType.CHECKBOXES, label: "Multiple Select (Checkboxes)", desc: "Select multiple options", icon: CheckSquare },
  { type: QuestionType.CHECKBOX, label: "Single Checkbox", desc: "Binary acknowledgment or agreement", icon: CheckSquare },
  { type: QuestionType.DROPDOWN, label: "Dropdown", desc: "Compact single choice select menu", icon: ChevronsUpDown },
  { type: QuestionType.DATE, label: "Date Picker", desc: "Calendar date selector", icon: Calendar },
  { type: QuestionType.TIME, label: "Time Picker", desc: "Clock time selector", icon: Clock },
  { type: QuestionType.NUMBER, label: "Numeric Value", desc: "Constrained numeric input", icon: Hash },
  { type: QuestionType.USER, label: "Discord User Selection", desc: "Mention Discord server members", icon: AtSign },
];

export function normalizeEventQuestions(extra: any): EventQuestion[] {
  if (!extra) return [];
  try {
    const parsed = typeof extra === "string" ? JSON.parse(extra) : extra;
    if (Array.isArray(parsed)) {
      return parsed.map((q, idx) => ({
        id: q.id || `q_${idx}_${Date.now()}`,
        text: q.text || q.question || "",
        description: q.description || "",
        placeholder: q.placeholder || "",
        type: q.type || QuestionType.SHORT_TEXT,
        required: q.required ?? false,
        options: (q.options || []).map((opt: any, optIdx: number) => ({
          id: opt.id || `opt_${optIdx}`,
          text: typeof opt === "string" ? opt : (opt.text || "")
        })),
        min: q.min ?? null,
        max: q.max ?? null,
        order: q.order ?? idx,
      }));
    }
    if (typeof parsed === "object") {
      // Legacy dictionary format: { "Question 1": { placeholder, default, type, required } }
      return Object.entries(parsed).map(([questionText, details]: [string, any], idx) => ({
        id: `q_${idx}_${Date.now()}`,
        text: questionText,
        description: "",
        placeholder: details?.placeholder || "",
        type: details?.type === 2 || details?.type === 3 ? QuestionType.PARAGRAPH : QuestionType.SHORT_TEXT,
        required: details?.required ?? false,
        options: [],
        min: null,
        max: null,
        order: idx,
      }));
    }
  } catch (e) {
    console.error("Failed to parse event questions:", e);
  }
  return [];
}

interface EventQuestionsBuilderProps {
  questions: EventQuestion[];
  onChange: (questions: EventQuestion[]) => void;
  maxQuestions: number;
}

export function EventQuestionsBuilder({
  questions,
  onChange,
  maxQuestions,
}: EventQuestionsBuilderProps) {
  // Collapsed by default!
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    questions.forEach((q) => {
      next[q.id] = true;
    });
    setExpandedQuestions(next);
  };

  const collapseAll = () => {
    setExpandedQuestions({});
  };

  const addQuestion = () => {
    if (questions.length >= maxQuestions) return;

    const newId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newQuestion: EventQuestion = {
      id: newId,
      text: "",
      description: "",
      placeholder: "",
      type: QuestionType.SHORT_TEXT,
      required: false,
      options: [],
      min: null,
      max: null,
      order: questions.length,
    };

    onChange([...questions, newQuestion]);
    // Automatically open newly created question so user can configure it
    setExpandedQuestions((prev) => ({
      ...prev,
      [newId]: true,
    }));
  };

  const updateQuestion = (id: string, field: keyof EventQuestion, value: any) => {
    onChange(
      questions.map((q) => {
        if (q.id !== id) return q;

        const updated = { ...q, [field]: value };

        // Handle type switch side effects
        if (field === "type") {
          const newType = value as QuestionType;
          if (needsOptions(newType) && (!updated.options || updated.options.length === 0)) {
            updated.options = [
              { id: "opt_1", text: "Option 1" },
              { id: "opt_2", text: "Option 2" },
            ];
          }
          if (newType === QuestionType.CHECKBOX) {
            updated.required = false;
          }
        }

        return updated;
      })
    );
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const reordered = [...questions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update order property
    onChange(reordered.map((q, idx) => ({ ...q, order: idx })));
  };

  const needsOptions = (type: QuestionType) => {
    return (
      type === QuestionType.MULTIPLE_CHOICE ||
      type === QuestionType.CHECKBOXES ||
      type === QuestionType.DROPDOWN
    );
  };

  const addOption = (questionId: string) => {
    const draft = (optionDrafts[questionId] || "").trim();
    if (!draft) return;

    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const currentOptions = question.options || [];
    if (currentOptions.length >= 25) return;

    const newOption: EventQuestionOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: draft,
    };

    updateQuestion(questionId, "options", [...currentOptions, newOption]);
    setOptionDrafts((prev) => ({ ...prev, [questionId]: "" }));
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    updateQuestion(
      questionId,
      "options",
      (question.options || []).filter((opt) => opt.id !== optionId)
    );
  };

  const getTypeMeta = (type: QuestionType) => {
    return QUESTION_TYPES.find((t) => t.type === type) || QUESTION_TYPES[0];
  };

  const allCollapsed = Object.values(expandedQuestions).every((v) => !v);

  return (
    <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
      <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Custom Registration Questions</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Ask participants for in-game IDs, server roles, ranks, or verification during registration ({questions.length}/{maxQuestions} used).
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {questions.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={allCollapsed ? expandAll : collapseAll}
              >
                {allCollapsed ? "Expand All" : "Collapse All"}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs shrink-0"
              onClick={addQuestion}
              disabled={questions.length >= maxQuestions}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-muted/10">
            <HelpCircle className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">No custom questions added</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Click &ldquo;Add Question&rdquo; to add text, single/multi select, dropdown, user mention, or date fields.
            </p>
          </div>
        ) : (
          questions.map((question, index) => {
            const isExpanded = !!expandedQuestions[question.id];
            const meta = getTypeMeta(question.type);
            const Icon = meta.icon;

            return (
              <div
                key={question.id}
                className={cn(
                  "border rounded-xl transition-all duration-200 overflow-hidden shadow-xs",
                  isExpanded ? "border-primary/40 bg-card/70" : "border-border/60 bg-card/40 hover:border-border"
                )}
              >
                {/* Collapsible Header Strip */}
                <div 
                  className={cn(
                    "flex items-center justify-between p-3.5 select-none cursor-pointer gap-2 transition-colors",
                    isExpanded ? "bg-muted/30 border-b border-border/40" : "hover:bg-muted/10"
                  )}
                  onClick={() => toggleExpand(question.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="outline" className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted/40 shrink-0">
                      #{index + 1}
                    </Badge>

                    <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <Icon className="h-3 w-3" />
                      <span>{meta.label}</span>
                    </Badge>

                    <span className="text-xs font-semibold text-foreground truncate max-w-[180px] sm:max-w-[320px]">
                      {question.text || "Untitled Question"}
                    </span>

                    {question.required && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      type="button"
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
                      type="button"
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
                      type="button"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteQuestion(question.id)}
                      title="Delete Question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      type="button"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground ml-1"
                      onClick={() => toggleExpand(question.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Question Configuration Form */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Prompt Text (Max 45 chars) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-medium text-foreground">
                          Question Prompt <span className="text-destructive">*</span>
                        </Label>
                        <span className={cn(
                          "text-[10px]",
                          question.text.length >= 45 ? "text-destructive font-semibold" : "text-muted-foreground"
                        )}>
                          {question.text.length}/45
                        </span>
                      </div>
                      <Input
                        value={question.text}
                        placeholder="e.g. In-Game Name & Tag"
                        maxLength={45}
                        className="bg-muted/20 border-border/60 h-9 text-xs font-medium"
                        onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Description / Subtitle (Max 100 chars) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs font-medium text-foreground">Description / Note (Optional)</Label>
                          <span className={cn(
                            "text-[10px]",
                            (question.description?.length || 0) >= 100 ? "text-destructive font-semibold" : "text-muted-foreground"
                          )}>
                            {(question.description || "").length}/100
                          </span>
                        </div>
                        <Input
                          value={question.description || ""}
                          placeholder="Help text or clarifying details"
                          maxLength={100}
                          className="bg-muted/20 border-border/60 h-9 text-xs"
                          onChange={(e) => updateQuestion(question.id, "description", e.target.value)}
                        />
                      </div>

                      {/* Placeholder (Max 100 chars) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs font-medium text-foreground">Placeholder Text (Optional)</Label>
                          <span className={cn(
                            "text-[10px]",
                            (question.placeholder?.length || 0) >= 100 ? "text-destructive font-semibold" : "text-muted-foreground"
                          )}>
                            {(question.placeholder || "").length}/100
                          </span>
                        </div>
                        <Input
                          value={question.placeholder || ""}
                          placeholder="Placeholder shown inside the input"
                          maxLength={100}
                          className="bg-muted/20 border-border/60 h-9 text-xs"
                          onChange={(e) => updateQuestion(question.id, "placeholder", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Question Type & Required Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <Label className="text-xs font-medium text-foreground block mb-1">Question Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(val) => updateQuestion(question.id, "type", val as QuestionType)}
                        >
                          <SelectTrigger className="bg-muted/20 border-border/60 h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUESTION_TYPES.map((t) => (
                              <SelectItem key={t.type} value={t.type} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <t.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{t.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-border/40 p-2.5 bg-muted/15 h-9 mt-auto">
                        <Label htmlFor={`req-${question.id}`} className="text-xs font-medium cursor-pointer">
                          Required for Registration
                        </Label>
                        <Switch
                          id={`req-${question.id}`}
                          checked={question.required}
                          disabled={question.type === QuestionType.CHECKBOX}
                          onCheckedChange={(checked) => updateQuestion(question.id, "required", checked)}
                        />
                      </div>
                    </div>

                    {/* Min/Max Length for Text / Paragraph */}
                    {(question.type === QuestionType.SHORT_TEXT || question.type === QuestionType.PARAGRAPH) && (
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <Label className="text-xs font-medium text-foreground block mb-1">Min Length (chars)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={4000}
                            value={question.min ?? ""}
                            onChange={(e) => updateQuestion(question.id, "min", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Optional"
                            className="bg-muted/20 border-border/60 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-foreground block mb-1">Max Length (chars)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={4000}
                            value={question.max ?? ""}
                            onChange={(e) => updateQuestion(question.id, "max", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder={question.type === QuestionType.PARAGRAPH ? "Default 4000" : "Default 100"}
                            className="bg-muted/20 border-border/60 h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Min/Max Value for Numbers */}
                    {question.type === QuestionType.NUMBER && (
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <Label className="text-xs font-medium text-foreground block mb-1">Min Value</Label>
                          <Input
                            type="number"
                            value={question.min ?? ""}
                            onChange={(e) => updateQuestion(question.id, "min", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Optional"
                            className="bg-muted/20 border-border/60 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-foreground block mb-1">Max Value</Label>
                          <Input
                            type="number"
                            value={question.max ?? ""}
                            onChange={(e) => updateQuestion(question.id, "max", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Optional"
                            className="bg-muted/20 border-border/60 h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Min/Max Selections for User & Checkboxes */}
                    {(question.type === QuestionType.USER || question.type === QuestionType.CHECKBOXES) && (
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <Label className="text-xs font-medium text-foreground block mb-1">Min Selections</Label>
                          <Input
                            type="number"
                            min={0}
                            max={25}
                            value={question.min ?? ""}
                            onChange={(e) => updateQuestion(question.id, "min", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder={question.required ? "Default 1" : "Default 0"}
                            className="bg-muted/20 border-border/60 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-foreground block mb-1">Max Selections</Label>
                          <Input
                            type="number"
                            min={1}
                            max={25}
                            value={question.max ?? ""}
                            onChange={(e) => updateQuestion(question.id, "max", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Default 1 (Max 25)"
                            className="bg-muted/20 border-border/60 h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Options Builder for Select / Radio / Checkboxes / Dropdown */}
                    {needsOptions(question.type) && (
                      <div className="space-y-3 pt-3 border-t border-border/40">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-foreground">
                            Options ({(question.options || []).length})
                          </Label>
                          {(!question.options || question.options.length < 2) && (
                            <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              At least 2 options required
                            </span>
                          )}
                        </div>

                        {/* List of current options */}
                        {question.options && question.options.length > 0 && (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {question.options.map((opt, optIdx) => (
                              <div
                                key={opt.id}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20 border border-border/40 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] text-muted-foreground w-4">{optIdx + 1}.</span>
                                  <span className="font-medium text-foreground truncate">{opt.text}</span>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  type="button"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => removeOption(question.id, opt.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Option Input */}
                        <div className="flex items-center gap-2">
                          <Input
                            value={optionDrafts[question.id] || ""}
                            onChange={(e) => setOptionDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addOption(question.id);
                              }
                            }}
                            placeholder="Type an option and press Add (or Enter)..."
                            maxLength={100}
                            className="bg-muted/20 border-border/60 h-8 text-xs"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs shrink-0"
                            onClick={() => addOption(question.id)}
                            disabled={!(optionDrafts[question.id] || "").trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
