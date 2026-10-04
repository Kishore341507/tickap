import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card/60">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-52 rounded" />
            <Skeleton className="h-3.5 w-72 sm:w-96 rounded" />
          </div>
        </div>
        <Skeleton className="h-9 w-36 rounded-md shrink-0" />
      </div>

      {/* Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 w-44 rounded" />
          </div>
        </div>

        {/* Server Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="rounded-xl border border-border/60 bg-card/40 p-4 sm:p-5 h-full flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-3/4 rounded" />
                <div className="flex items-center gap-1.5 mt-1">
                  <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                <Skeleton className="h-3 w-10 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
