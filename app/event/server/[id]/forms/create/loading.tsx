import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      {/* Header skeleton */}
      <div className="pb-6 border-b border-border/40 space-y-2">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      {/* Stepped Progress Bar skeleton */}
      <Skeleton className="h-12 w-full rounded-2xl" />

      {/* Form Details Card skeleton */}
      <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
        <CardHeader className="p-6 border-b border-border/40 space-y-2">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3 w-64 rounded" />
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
        <CardHeader className="p-6 border-b border-border/40 space-y-2">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-3 w-72 rounded" />
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
