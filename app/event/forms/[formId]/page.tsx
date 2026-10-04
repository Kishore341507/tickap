import { auth } from "@/auth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileQuestion, ArrowLeft, AlertTriangle } from "lucide-react";
import prisma from "@/prisma/db";
import { SignInCard } from "@/components/auth/sign-in-card";
import { FormViewerClient } from "./FormViewerClient";

export default async function FormViewerPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const session = await auth();

  // Fetch form data
  const rawForm = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!rawForm || rawForm.is_deleted) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-lg text-center space-y-6">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted/40 border border-border/60 text-muted-foreground">
          <FileQuestion className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Form Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This form does not exist, has been removed, or is no longer accepting responses.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-border/60 text-xs font-semibold">
          <Link href="/event/forms">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to All Forms
          </Link>
        </Button>
      </div>
    );
  }

  // If user is not authenticated, display login prompt on page
  if (!session || !session.user) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl space-y-6">
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
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {rawForm.title}
          </span>
        </div>

        {/* Form Teaser Card */}
        <Card className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden">
          <div className="p-8 border-b border-border/40 bg-muted/20 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {rawForm.title}
            </h1>
            {rawForm.description && (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {rawForm.description}
              </p>
            )}
          </div>

          <div className="p-4 mx-8 mt-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-start gap-3.5 text-xs leading-relaxed">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-0.5">
              <p className="font-semibold text-sm">Notice</p>
              <p className="text-amber-700/90 dark:text-amber-300/90">
                This form can be filled from the server only. Web submissions are currently disabled.
              </p>
            </div>
          </div>

          <CardContent className="p-8">
            <SignInCard
              title="Sign in with Discord to Submit"
              description="To fill out and submit your response to this form, please sign in with your Discord account so your responses can be recorded and verified."
              buttonText="Sign in with Discord"
              callbackUrl={`/event/forms/${formId}`}
              className="border-0 bg-transparent p-0 my-0 shadow-none"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check user previous submissions and latest submission date
  let userSubmissionCount = 0;
  let lastSubmissionDate: string | null = null;

  if (session.user.userId) {
    const userBigInt = BigInt(session.user.userId);
    userSubmissionCount = await prisma.response.count({
      where: {
        formId,
        userId: userBigInt,
      },
    });

    const lastResp = await prisma.response.findFirst({
      where: {
        formId,
        userId: userBigInt,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    if (lastResp) {
      lastSubmissionDate = lastResp.createdAt.toISOString();
    }
  }

  // Serialize BigInt fields safely for Client Component
  const formData = {
    id: rawForm.id,
    title: rawForm.title,
    description: rawForm.description,
    maxResponsesPerUser: rawForm.maxResponsesPerUser,
    submissionCooldown: rawForm.submissionCooldown,
    guild_id: rawForm.guild_id.toString(),
    channel_id: rawForm.channel_id ? rawForm.channel_id.toString() : null,
    questions: rawForm.questions.map((q) => ({
      id: q.id,
      text: q.text,
      description: q.description,
      placeholder: q.placeholder,
      type: q.type,
      required: q.required,
      order: q.order,
      min: q.min,
      max: q.max,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
      })),
    })),
  };

  const userName = session.user.name || session.user.email?.split("@")[0] || "Discord User";
  const userEmail = session.user.email || `${session.user.userId || "user"}@discord.tickap`;
  const userImage = session.user.image || null;

  return (
    <FormViewerClient 
      formData={formData} 
      userName={userName} 
      userEmail={userEmail}
      userImage={userImage}
      userSubmissionCount={userSubmissionCount}
      lastSubmissionDate={lastSubmissionDate}
    />
  );
}
