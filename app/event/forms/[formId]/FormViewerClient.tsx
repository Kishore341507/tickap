"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { QuestionType } from "@prisma/client";

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
}

interface FormData {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

export function FormViewerClient({ formData, userName, userEmail }: { 
  formData: FormData; 
  userName: string; 
  userEmail: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleCheckboxChange = (questionId: string, optionText: string, checked: boolean) => {
    const currentAnswers = (answers[questionId] as string[]) || [];
    if (checked) {
      handleAnswerChange(questionId, [...currentAnswers, optionText]);
    } else {
      handleAnswerChange(questionId, currentAnswers.filter(a => a !== optionText));
    }
  };

  const validateForm = () => {
    if (!formData) return false;

    // Check user info
    if (!userName.trim() || !userEmail.trim()) {
      toast({ title: "Error", description: "Please provide your name and email", variant: "destructive" });
      return false;
    }

    // Check required questions
    for (const question of formData.questions) {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && !answer.trim())) {
          toast({ 
            title: "Error", 
            description: `Please answer: ${question.text}`, 
            variant: "destructive" 
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      if (!response.ok) {
        throw new Error("Failed to submit response");
      }

      toast({ title: "Success", description: "Your response has been submitted!" });
      
      // Reset answers only
      setAnswers({});
      
      // Optionally redirect
      // router.push("/event");
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit response", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{formData.title}</CardTitle>
            {formData.description && (
              <CardDescription className="text-base">{formData.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userName">Your Name *</Label>
              <Input
                id="userName"
                value={userName}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
            {/* <div>
              <Label htmlFor="userEmail">Your Email *</Label>
              <Input
                id="userEmail"
                type="email"
                value={userEmail}
                readOnly
                disabled
                className="bg-muted"
              />
            </div> */}
          </CardContent>
        </Card>

        {formData.questions.map((question, index) => (
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
                    value={(answers[question.id] as string) || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={question.placeholder || "Your answer"}
                    required={question.required}
                  />
                )}

                {question.type === QuestionType.PARAGRAPH && (
                  <Textarea
                    value={(answers[question.id] as string) || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={question.placeholder || "Your answer"}
                    rows={4}
                    required={question.required}
                  />
                )}

                {question.type === QuestionType.NUMBER && (
                  <Input
                    type="number"
                    value={(answers[question.id] as string) || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={question.placeholder || "Your answer"}
                    required={question.required}
                  />
                )}

                {question.type === QuestionType.DATE && (
                  <Input
                    type="date"
                    value={(answers[question.id] as string) || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                  />
                )}

                {question.type === QuestionType.TIME && (
                  <Input
                    type="time"
                    value={(answers[question.id] as string) || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                  />
                )}

                {question.type === QuestionType.MULTIPLE_CHOICE && (
                  <RadioGroup
                    value={(answers[question.id] as string) || ""}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    required={question.required}
                  >
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.text} id={`${question.id}-${option.id}`} />
                        <Label htmlFor={`${question.id}-${option.id}`} className="font-normal">
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
                          id={`${question.id}-${option.id}`}
                          checked={((answers[question.id] as string[]) || []).includes(option.text)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(question.id, option.text, checked as boolean)
                          }
                        />
                        <Label htmlFor={`${question.id}-${option.id}`} className="font-normal">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.DROPDOWN && (
                  <Select
                    value={(answers[question.id] as string) || ""}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    required={question.required}
                  >
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

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
