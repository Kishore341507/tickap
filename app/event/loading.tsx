import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function Loading() {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Events
        </h4>
      </div>
      
      {/* Tabs List Skeleton */}
      <div className="grid grid-cols-3 lg:w-[400px] md:w-[400px] mb-5 gap-2">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      {/* Grid of Event Card Skeletons */}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="border-secondary h-full overflow-hidden">
            {/* Image Skeleton matching CardImage aspect ratio */}
            <div>
              <AspectRatio ratio={21 / 9}>
                <Skeleton className="h-full w-full rounded-t-lg" />
              </AspectRatio>
            </div>
            
            <CardContent>
              <CardHeader className="text-center pb-3 px-0 flex flex-col items-center space-y-4 pt-4">
                {/* Title Skeleton */}
                <Skeleton className="h-6 w-3/4 rounded-md" />
                
                {/* Category Skeleton */}
                <div className="flex items-center justify-center gap-2 w-full">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-1/3 rounded-md" />
                </div>
                
                {/* Date Skeleton */}
                <div className="flex items-center justify-center gap-2 w-full">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-1/3 rounded-md" />
                </div>
              </CardHeader>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
