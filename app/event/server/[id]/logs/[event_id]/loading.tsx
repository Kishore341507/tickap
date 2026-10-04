import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LogsLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded-md bg-muted/60" />
        <span className="text-muted-foreground/30">/</span>
        <Skeleton className="h-4 w-28 rounded-md bg-muted/60" />
        <span className="text-muted-foreground/30">/</span>
        <Skeleton className="h-4 w-32 rounded-md bg-muted/60" />
        <span className="text-muted-foreground/30">/</span>
        <Skeleton className="h-4 w-20 rounded-md bg-muted/70" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md bg-muted/60" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2">
            <Skeleton className="h-3 w-20 rounded-md bg-muted/60" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Card Skeleton */}
      <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl border border-border/50 bg-card/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
