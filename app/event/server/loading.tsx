import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Manage Server Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-9 w-48 rounded-md" /> { /* Header */ }
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 my-4 mx-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-secondary overflow-hidden">
               {/* Square Image Skeleton */}
              <div className="w-full">
                <AspectRatio ratio={1}>
                  <Skeleton className="h-full w-full rounded-t-lg" />
                </AspectRatio>
              </div>
              <div className="p-2 flex justify-center">
                 <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>

       {/* Second Section Skeleton (e.g. Add to Server/We Are In) */}
       <div className="space-y-4">
        <Skeleton className="h-9 w-48 rounded-md" /> { /* Header */ }
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 my-4 mx-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-secondary overflow-hidden">
               {/* Square Image Skeleton */}
              <div className="w-full">
                <AspectRatio ratio={1}>
                  <Skeleton className="h-full w-full rounded-t-lg" />
                </AspectRatio>
              </div>
              <div className="p-2 flex justify-center">
                 <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
