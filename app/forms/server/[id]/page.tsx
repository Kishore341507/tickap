import prisma from "@/prisma/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormCard from "../../_components/form-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { checkIsManager } from "@/lib/discord";

async function fetchGuildName(guildId: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/discord/bot/guild?guild_id=${guildId}`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      return `Server ${guildId}`;
    }
    const guild = await response.json();
    return guild.name || `Server ${guildId}`;
  } catch (error) {
    console.error('Error fetching guild name:', error);
    return `Server ${guildId}`;
  }
}

export default async function ServerForms( 
  {params}: {params: Promise<{ id: string }>}
) {
  const { id } = await params;
  const guildName = await fetchGuildName(id);

  const forms = await prisma.forms.findMany({
    where: { 
      guild_id: BigInt(id),
      is_deleted: false 
    }
  });
  
  const activeForms = forms.filter((form: any) => form.is_active);
  const inactiveForms = forms.filter((form: any) => !form.is_active);

  // Check if user is manager
  let isManager = false;
  const session = await auth();
  if (session) {
    const userId = session.user.userId!;
    const guildId = id;
    const isManagerResponse = await checkIsManager(userId, guildId);
    if (isManagerResponse) {
      isManager = true;
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          {guildName} Forms
        </h4>
        {isManager && (
          <Link href={`/forms/server/${id}/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </Link>
        )}
      </div>
      
      <Tabs defaultValue="Active" >
        <TabsList className="grid grid-cols-2 lg:w-[400px] md:w-[400px] mb-5">
          <TabsTrigger value="Active" disabled={activeForms.length == 0 ? true : false}>Active ({activeForms.length})</TabsTrigger>
          <TabsTrigger value="Inactive" disabled={inactiveForms.length == 0 ? true : false}>Inactive ({inactiveForms.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="Active">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 ">
            {activeForms.map((form: any) => (
              <FormCard key={form.id} form={form} showManagementButtons={isManager} guildId={id} />
            ))}
            { activeForms.length == 0 && <div className="col-span-3">No active forms</div> }
          </div>
        </TabsContent>

        <TabsContent value="Inactive">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 ">
          {inactiveForms.map((form: any) => (
              <FormCard key={form.id} form={form} showManagementButtons={isManager} guildId={id} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}