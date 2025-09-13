"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
});

// Type for our form values
type FormValues = z.infer<typeof formSchema>;

// Type for questions
type Question = {
  question_text: string;
  description: string;
  placeholder: string;
  default_value: string;
  question_type: "SHORT_TEXT" | "LONG_TEXT" | "SELECT_SINGLE" | "SELECT_MULTI" | "NUMBER" | "CHECKBOX";
  is_required: boolean;
  select_options: string[];
};

export default function CreateForm() {
  const router = useRouter();
  const params = useParams();  
  const guildId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const addQuestion = () => {
    if (questions.length >= 15) {
      toast.error("You can add a maximum of 15 questions.");
      return;
    }
    setQuestions([
      ...questions,
      {
        question_text: "",
        description: "",
        placeholder: "",
        default_value: "",
        question_type: "SHORT_TEXT",
        is_required: false,
        select_options: []
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addSelectOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].select_options.push("");
    setQuestions(newQuestions);
  };

  const updateSelectOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].select_options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const removeSelectOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].select_options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);

      // Validate questions
      const invalidQuestions = questions.filter(q => !q.question_text.trim());
      if (invalidQuestions.length > 0) {
        toast.error("All questions must have question text");
        return;
      }

      // Validate select questions have options
      const invalidSelectQuestions = questions.filter(q => 
        (q.question_type === "SELECT_SINGLE" || q.question_type === "SELECT_MULTI") && 
        q.select_options.filter(opt => opt.trim()).length === 0
      );
      if (invalidSelectQuestions.length > 0) {
        toast.error("Select questions must have at least one option");
        return;
      }

      const response = await fetch(`/api/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          guild_id: guildId,
          questions: questions.map((q, index) => ({
            ...q,
            question_order: index + 1,
            select_options: (q.question_type === "SELECT_SINGLE" || q.question_type === "SELECT_MULTI") 
              ? q.select_options.filter(opt => opt.trim()) 
              : null
          }))
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create form");
      }

      toast.success("Form created successfully!");
      router.push(`/forms/server/${guildId}`);
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error("Failed to create form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Form</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter form title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Form"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Questions ({questions.length}/15)</CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              disabled={questions.length >= 15}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed rounded-md py-8 px-4">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">
                No questions added yet. Add up to 15 questions for your form.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Question Text *</label>
                        <Input
                          value={question.question_text}
                          placeholder="Enter question (max 45 chars)"
                          maxLength={45}
                          onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {question.question_text.length}/45 characters
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Question Type</label>
                        <Select
                          value={question.question_type}
                          onValueChange={(value) => updateQuestion(index, "question_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SHORT_TEXT">Short Text</SelectItem>
                            <SelectItem value="LONG_TEXT">Long Text</SelectItem>
                            <SelectItem value="SELECT_SINGLE">Select (Single)</SelectItem>
                            <SelectItem value="SELECT_MULTI">Select (Multi)</SelectItem>
                            <SelectItem value="NUMBER">Number</SelectItem>
                            <SelectItem value="CHECKBOX">Checkbox (Yes/No)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={question.description}
                          placeholder="Enter description (max 100 chars)"
                          maxLength={100}
                          rows={2}
                          onChange={(e) => updateQuestion(index, "description", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {question.description.length}/100 characters
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Placeholder</label>
                        <Input
                          value={question.placeholder}
                          placeholder="Enter placeholder (max 100 chars)"
                          maxLength={100}
                          onChange={(e) => updateQuestion(index, "placeholder", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {question.placeholder.length}/100 characters
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Default Value</label>
                      <Input
                        value={question.default_value}
                        placeholder="Enter default value"
                        onChange={(e) => updateQuestion(index, "default_value", e.target.value)}
                      />
                    </div>

                    {(question.question_type === "SELECT_SINGLE" || question.question_type === "SELECT_MULTI") && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Options</label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSelectOption(index)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {question.select_options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                placeholder={`Option ${optionIndex + 1}`}
                                onChange={(e) => updateSelectOption(index, optionIndex, e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSelectOption(index, optionIndex)}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={question.is_required}
                        onCheckedChange={(checked) => updateQuestion(index, "is_required", checked)}
                      />
                      <label className="text-sm font-medium">Required question</label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}