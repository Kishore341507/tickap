import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import prisma from "@/prisma/db";
import { FormViewerClient } from "./FormViewerClient";

export default async function FormViewerPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const session = await auth();
  
  // Redirect to signin if not authenticated
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  // Fetch form data
  const formData = await prisma.form.findUnique({
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

  if (!formData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Form not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userName = session.user.name || "";
  const userEmail = session.user.email || "";
  
  return <FormViewerClient formData={formData} userName={userName} userEmail={userEmail} />;
}
