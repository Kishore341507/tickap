import { auth } from "@/auth";
import prisma from "@/prisma/db";
import { checkIsManager } from "@/lib/discord";
import { env } from "process";
import FormCard from "../../../_components/form-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, FileText, Plus, ShieldAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { SignInCard } from "@/components/auth";

export default async function GuildFormsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Server Forms
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in with Discord to access managed forms.
          </p>
        </div>
        <SignInCard
          title="Sign in to View Forms"
          description="Sign in with your Discord account to verify your permissions and manage forms for this server."
          callbackUrl={`/event/forms/guild/${guildId}`}
        />
      </div>
    );
  }

  const isManager = await checkIsManager(session.user.userId!, guildId);

  if (!isManager) {
    return (
      <div className="space-y-6">
        <Link
          href="/event/forms"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>All Managed Servers</span>
        </Link>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-base mb-1">Access Denied</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            You need Manage Server or Administrator permissions in this Discord server to view and manage its forms.
          </p>
          <Link href="/event/forms">
            <Button size="sm" variant="outline" className="text-xs">
              Back to Managed Servers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const [guildRes, forms] = await Promise.all([
    fetch(env.DISCORD_API_URL + `/guilds/${guildId}?with_counts=true`, {
      headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
      next: { revalidate: 120 },
    }),
    prisma.form.findMany({
      where: {
        guild_id: BigInt(guildId),
        OR: [
          { is_deleted: false },
          { is_deleted: null },
        ],
      },
      include: { questions: true, responses: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let guildName = "Server";
  let guildIcon: string | null = null;
  let memberCount: number | null = null;

  if (guildRes.ok) {
    const guild = await guildRes.json();
    if (guild?.name) {
      guildName = guild.name;
      guildIcon = guild.icon
        ? `https://cdn.discordapp.com/icons/${guildId}/${guild.icon}.png`
        : null;
      memberCount = guild.approximate_member_count || null;
    }
  }

  const totalResponses = forms.reduce((acc, f) => acc + (f.responses?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          href="/event/forms"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>All Managed Servers</span>
        </Link>

        {/* Server Header Card */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-5 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              {guildIcon ? (
                <Image
                  src={guildIcon}
                  alt={guildName}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-2xl object-cover ring-1 ring-border/60 shadow-sm shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-muted ring-1 ring-border/60 flex items-center justify-center font-bold text-lg text-foreground shrink-0">
                  {guildName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                    {guildName}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5">
                    Forms
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  {memberCount !== null && (
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Users className="h-3.5 w-3.5 opacity-70" />
                      {memberCount.toLocaleString()} members
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    {forms.length} form{forms.length !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span>
                    {totalResponses} submission{totalResponses !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <Link
                    href={`/event/server/${guildId}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>View Events</span>
                  </Link>
                </div>
              </div>
            </div>

            <Link href={`/event/server/${guildId}/forms/create`}>
              <Button size="sm" className="h-9 gap-1.5 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Form</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Forms Content */}
      {forms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <FormCard key={form.id} form={form} showActions={true} guildId={guildId} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
          <FileText className="h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-base mb-1">No Forms Created Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Create registration forms, application questionnaires, or feedback surveys for {guildName}.
          </p>
          <Link href={`/event/server/${guildId}/forms/create`}>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Form</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
