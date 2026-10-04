import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl space-y-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      {/* Form Header Card skeleton */}
      <Card className="rounded-3xl border border-border/60 bg-card/40 shadow-sm overflow-hidden">
        <CardHeader className="p-8 border-b border-border/40 space-y-2 bg-muted/20">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </CardHeader>
        <CardContent className="p-5">
          <Skeleton className="h-10 w-full rounded-2xl" />
        </CardContent>
      </Card>

      {/* Question Cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl border border-border/60 bg-card/40 shadow-sm p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/2 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </Card>
        ))}
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
    </div>
  );
}
