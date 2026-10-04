import { Skeleton } from "@/components/ui/skeleton";

export default function ServerLoading() {
  return (
    <div className="space-y-6">
      {/* Back Link Skeleton */}
      <div>
        <Skeleton className="h-4 w-24 rounded-md mb-3 bg-muted/60" />

        {/* Server Header Card Skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* Server Icon Skeleton */}
              <Skeleton className="h-14 w-14 rounded-2xl bg-muted/70 shrink-0" />
              <div className="space-y-2">
                {/* Server Title Skeleton */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-44 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-full bg-muted/60" />
                </div>
                {/* Meta Row Skeleton */}
                <Skeleton className="h-3.5 w-56 rounded-md bg-muted/60" />
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-24 rounded-lg bg-muted/70" />
              <Skeleton className="h-9 w-28 rounded-lg bg-muted/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Filter Bar Skeleton */}
      <div className="h-10 p-1 bg-muted/40 border border-border/40 rounded-lg inline-flex items-center gap-1">
        <Skeleton className="h-8 w-28 rounded-md bg-muted/70" />
        <Skeleton className="h-8 w-20 rounded-md bg-muted/70" />
        <Skeleton className="h-8 w-24 rounded-md bg-muted/70" />
        <Skeleton className="h-8 w-24 rounded-md bg-muted/70" />
      </div>

      {/* Grid of Event Card Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col h-full rounded-xl border border-border/60 bg-card overflow-hidden"
          >
            {/* 16:9 Aspect Ratio Hero Banner Skeleton with Badges */}
            <div className="relative aspect-video w-full bg-muted/30 p-3 flex items-start justify-between">
              <Skeleton className="h-5 w-20 rounded-full bg-muted/60" />
              <Skeleton className="h-5 w-14 rounded-full bg-muted/60" />
            </div>

            {/* Card Body Skeleton */}
            <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
              <div>
                <Skeleton className="h-5 w-3/4 rounded-md mb-2.5" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3.5 w-24 rounded-md bg-muted/60" />
                  <Skeleton className="h-3.5 w-28 rounded-md bg-muted/60" />
                </div>
              </div>

              {/* Card Footer Divider Skeleton */}
              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <Skeleton className="h-3.5 w-20 rounded-md bg-muted/60" />
                <Skeleton className="h-3.5 w-16 rounded-md bg-muted/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
