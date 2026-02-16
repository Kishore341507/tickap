import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Event Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Banner */}
          <Skeleton className="h-64 w-full rounded-lg" />

          {/* Event Title and Status */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Date */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
                {/* Location */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
                {/* Team Size */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-36" />
                </div>
                {/* Prize */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                {/* Category Badge */}
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Mobile Registration Card (visible on mobile only) */}
          <div className="lg:hidden">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-48" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Description */}
          <div className="relative border rounded-lg p-6 mt-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Info - for desktop view */}
          <div className="hidden lg:block">
            <Card>
              <CardHeader>
                <CardTitle>
                   <Skeleton className="h-6 w-48" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Info */}
          <Card>
            <CardHeader>
              <CardTitle>
                 <Skeleton className="h-6 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <Skeleton className="h-4 w-16" />
                   <Skeleton className="h-4 w-24" />
                </div>
                {/* Guild Info */}
                <div className="flex items-center gap-4">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                   </div>
                </div>
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
