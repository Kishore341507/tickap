"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface FormQuestion {
  id: bigint;
  question_text: string;
  description: string | null;
  placeholder: string | null;
  default_value: string | null;
  question_type: string;
  is_required: boolean;
  question_order: number;
  select_options: any;
}

interface FormData {
  id: bigint;
  title: string;
  is_active: boolean;
  form_questions: FormQuestion[];
}

export default function FormSubmission() {
  const params = useParams();
  const formId = params.id as string;
  
  const [form, setForm] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch form");
        }
        const formData = await response.json();
        setForm(formData);
        
        // Initialize responses with default values
        const initialResponses: Record<string, string | string[]> = {};
        formData.form_questions.forEach((question: FormQuestion) => {
          const questionId = question.id.toString();
          if (question.question_type === "SELECT_MULTI") {
            initialResponses[questionId] = [];
          } else if (question.question_type === "CHECKBOX") {
            initialResponses[questionId] = "false";
          } else {
            initialResponses[questionId] = question.default_value || "";
          }
        });
        setResponses(initialResponses);
      } catch (error) {
        console.error("Error fetching form:", error);
        toast.error("Failed to load form");
      } finally {
        setIsLoading(false);
      }
    };

    if (formId) {
      fetchForm();
    }
  }, [formId]);

  const handleInputChange = (questionId: string, value: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultiSelectChange = (questionId: string, option: string, checked: boolean) => {
    const currentValues = (responses[questionId] as string[]) || [];
    if (checked) {
      handleInputChange(questionId, [...currentValues, option]);
    } else {
      handleInputChange(questionId, currentValues.filter(v => v !== option));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    // Validate required fields
    for (const question of form.form_questions) {
      if (question.is_required) {
        const questionId = question.id.toString();
        const response = responses[questionId];
        
        if (!response || 
            (typeof response === 'string' && response.trim() === '') ||
            (Array.isArray(response) && response.length === 0)) {
          toast.error(`Please answer the required question: ${question.question_text}`);
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/forms/${formId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses,
          user_name: userName.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      toast.success("Form submitted successfully!");
      
      // Reset form
      setResponses({});
      setUserName("");
      
      // Re-initialize with default values
      const initialResponses: Record<string, string | string[]> = {};
      form.form_questions.forEach((question: FormQuestion) => {
        const questionId = question.id.toString();
        if (question.question_type === "SELECT_MULTI") {
          initialResponses[questionId] = [];
        } else if (question.question_type === "CHECKBOX") {
          initialResponses[questionId] = "false";
        } else {
          initialResponses[questionId] = question.default_value || "";
        }
      });
      setResponses(initialResponses);
      
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: FormQuestion) => {
    const questionId = question.id.toString();
    const value = responses[questionId];

    switch (question.question_type) {
      case "SHORT_TEXT":
        return (
          <Input
            value={value as string}
            placeholder={question.placeholder || undefined}
            maxLength={45}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            required={question.is_required}
          />
        );

      case "LONG_TEXT":
        return (
          <Textarea
            value={value as string}
            placeholder={question.placeholder || undefined}
            rows={3}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            required={question.is_required}
          />
        );

      case "NUMBER":
        return (
          <Input
            type="number"
            value={value as string}
            placeholder={question.placeholder || undefined}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            required={question.is_required}
          />
        );

      case "CHECKBOX":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={(value as string) === "true"}
              onCheckedChange={(checked) => handleInputChange(questionId, checked ? "true" : "false")}
            />
            <Label>Yes</Label>
          </div>
        );

      case "SELECT_SINGLE":
        const options = question.select_options ? JSON.parse(question.select_options) : [];
        return (
          <RadioGroup
            value={value as string}
            onValueChange={(newValue) => handleInputChange(questionId, newValue)}
            required={question.is_required}
          >
            {options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${questionId}-${index}`} />
                <Label htmlFor={`${questionId}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "SELECT_MULTI":
        const multiOptions = question.select_options ? JSON.parse(question.select_options) : [];
        return (
          <div className="space-y-2">
            {multiOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  checked={(value as string[]).includes(option)}
                  onCheckedChange={(checked) => handleMultiSelectChange(questionId, option, checked as boolean)}
                />
                <Label>{option}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Form not found or is inactive.</p>
      </div>
    );
  }

  if (!form.is_active) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">This form is currently inactive.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {form.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Optional name field */}
            <div>
              <Label htmlFor="userName">Your Name (Optional)</Label>
              <Input
                id="userName"
                value={userName}
                placeholder="Enter your name"
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            {/* Render questions */}
            {form.form_questions.map((question) => (
              <div key={question.id.toString()} className="space-y-2">
                <Label className="text-base">
                  {question.question_text}
                  {question.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {question.description && (
                  <p className="text-sm text-muted-foreground">{question.description}</p>
                )}
                {renderQuestion(question)}
              </div>
            ))}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Form"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}