import { Skeleton } from "@/components/ui/skeleton";

export default function GuildFormsLoading() {
  return (
    <div className="space-y-6">
      {/* Back Link Skeleton */}
      <div>
        <Skeleton className="h-4 w-28 rounded-md mb-3 bg-muted/60" />

        {/* Server Header Card Skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl bg-muted/70 shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-44 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-full bg-muted/60" />
                </div>
                <Skeleton className="h-3.5 w-60 rounded-md bg-muted/60" />
              </div>
            </div>

            <Skeleton className="h-9 w-28 rounded-lg bg-muted/70" />
          </div>
        </div>
      </div>

      {/* Forms Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card/40 p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-9 rounded-lg bg-muted/70" />
                <Skeleton className="h-3 w-16 rounded-md bg-muted/60" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-full rounded-md bg-muted/60" />
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <Skeleton className="h-3.5 w-20 rounded-md bg-muted/60" />
              <Skeleton className="h-3.5 w-16 rounded-md bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
