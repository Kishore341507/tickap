import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/image-card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function FormsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-60 rounded-md" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md bg-muted/60" />
      </div>

      {/* Servers Subheader Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <Skeleton className="h-4 w-36 rounded-md bg-muted/60" />
        </div>

        {/* Guild Cards Grid Skeleton (100% matched with GuildCard) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8 my-4 mx-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-secondary overflow-hidden">
              <AspectRatio ratio={1}>
                <Skeleton className="h-full w-full rounded-t-lg bg-muted" />
              </AspectRatio>
              <div className="text-center py-2 flex items-center justify-center">
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
