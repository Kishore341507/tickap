import prisma from "@/prisma/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormCard from "./_components/form-card";

export default async function Forms() {

  const forms = await prisma.forms.findMany({
    where: { is_deleted: false }
  });
  
  const activeForms = forms.filter((form: any) => form.is_active);
  const inactiveForms = forms.filter((form: any) => !form.is_active);

  return (
    <>
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Forms
      </h4>
      <Tabs defaultValue="Active" >
        <TabsList className="grid grid-cols-2 lg:w-[400px] md:w-[400px] mb-5">
          <TabsTrigger value="Active" disabled={activeForms.length == 0 ? true : false}>Active ({activeForms.length})</TabsTrigger>
          <TabsTrigger value="Inactive" disabled={inactiveForms.length == 0 ? true : false}>Inactive ({inactiveForms.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="Active">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 ">
            {activeForms.map((form: any) => (
              <FormCard key={form.id} form={form} />
            ))}
            { activeForms.length == 0 && <div className="col-span-3">No active forms</div> }
          </div>
        </TabsContent>

        <TabsContent value="Inactive">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 ">
          {inactiveForms.map((form: any) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}