import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Tabs List Skeleton */}
      <div className="h-10 p-1 bg-muted/40 border border-border/40 rounded-lg inline-flex items-center gap-1">
        <Skeleton className="h-8 w-28 rounded-md bg-muted/70" />
        <Skeleton className="h-8 w-20 rounded-md bg-muted/70" />
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
              {/* Category Pill Skeleton */}
              <Skeleton className="h-5 w-20 rounded-full bg-muted/60" />
              {/* Status Pill Skeleton */}
              <Skeleton className="h-5 w-14 rounded-full bg-muted/60" />
            </div>

            {/* Card Body Skeleton */}
            <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
              <div>
                {/* Title Skeleton */}
                <Skeleton className="h-5 w-3/4 rounded-md mb-2.5" />

                {/* Quick Meta Row Skeleton (Date & Location) */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3.5 w-24 rounded-md bg-muted/60" />
                  <Skeleton className="h-3.5 w-28 rounded-md bg-muted/60" />
                </div>
              </div>

              {/* Card Footer Divider Skeleton */}
              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                {/* Format Skeleton */}
                <Skeleton className="h-3.5 w-20 rounded-md bg-muted/60" />
                {/* Prize Skeleton */}
                <Skeleton className="h-3.5 w-16 rounded-md bg-muted/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
