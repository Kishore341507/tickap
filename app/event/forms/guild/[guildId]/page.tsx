import { auth } from '@/auth';
import prisma from '@/prisma/db';
import { checkIsManager } from '@/lib/discord';
import { env } from 'process';
import FormCard from '../../../_components/form-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import clsx from 'clsx';

export default async function GuildFormsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div>
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Forms
        </h2>
        <p className="mt-4 text-muted-foreground">Please sign in to manage forms.</p>
      </div>
    );
  }

  const isManager = await checkIsManager(session.user.userId!, guildId);

  if (!isManager) {
    return (
      <div>
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Access Denied
        </h2>
        <p className="mt-4 text-muted-foreground">
          You need Manage Server permission in this server to view forms.
        </p>
      </div>
    );
  }

  const [guildRes, forms] = await Promise.all([
    fetch(env.DISCORD_API_URL + `/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
    }),
    prisma.form.findMany({
      where: { guild_id: BigInt(guildId), is_deleted: false },
      include: { questions: true, responses: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const guild = await guildRes.json();
  const guildName: string = guild?.name ?? 'Server';

  return (
    <div>
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {guildName} — Forms
      </h2>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 mt-4">
        {forms.map((form) => (
          <FormCard key={form.id} form={form} showActions={true} guildId={guildId} />
        ))}
        {forms.length === 0 && (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            No forms created yet
          </div>
        )}
      </div>

      <Link
        href={`/event/server/${guildId}/forms/create`}
        className="absolute right-2 bottom-2 z-99"
      >
        <Button className={clsx({ 'animate-bounce': forms.length === 0 })}>
          <FileText className="mr-2 h-4 w-4" />
          Create Form
        </Button>
      </Link>
    </div>
  );
}
