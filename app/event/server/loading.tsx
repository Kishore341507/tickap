import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/image-card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Section 1 Skeleton: Manage Server */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <Skeleton className="h-9 w-48 rounded-md" />
        </div>
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

      {/* Section 2 Skeleton: Add to Server's */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <Skeleton className="h-9 w-48 rounded-md" />
        </div>
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

      {/* Section 3 Skeleton: We Are In */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <Skeleton className="h-9 w-48 rounded-md" />
        </div>
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
