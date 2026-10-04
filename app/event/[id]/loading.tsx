import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EventDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded-md bg-muted/60" />
        <span className="text-muted-foreground/30">/</span>
        <Skeleton className="h-4 w-28 rounded-md bg-muted/60" />
        <span className="text-muted-foreground/30">/</span>
        <Skeleton className="h-4 w-36 rounded-md bg-muted/70" />
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Hero, Title, Highlights, Details */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Hero Banner Skeleton */}
          <div className="relative aspect-[21/9] sm:aspect-[2.2/1] w-full rounded-2xl overflow-hidden border border-border/50 bg-muted/40 p-3 flex items-start justify-between">
            <Skeleton className="h-5 w-24 rounded-full bg-muted/60" />
            <Skeleton className="h-5 w-20 rounded-full bg-muted/60" />
          </div>

          {/* Title Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-3/4 rounded-lg" />
          </div>

          {/* Key Info Highlights Strip Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card/40 p-3.5 space-y-2"
              >
                <Skeleton className="h-3 w-16 rounded-md bg-muted/60" />
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-3 w-14 rounded-md bg-muted/60" />
              </div>
            ))}
          </div>

          {/* Mobile Registration Skeleton */}
          <div className="lg:hidden">
            <Card className="rounded-xl border border-border/60 bg-card/50">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-28 rounded-md" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-14 w-full rounded-xl bg-muted/40" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* Details Card Skeleton */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <Skeleton className="h-4 w-4 rounded-md bg-muted/60" />
              <Skeleton className="h-5 w-36 rounded-md" />
            </div>
            <div className="space-y-2.5 pt-1">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          </div>
        </div>

        {/* Right Column: Registration Card & Host Community Card */}
        <div className="space-y-6">
          {/* Desktop Registration Card Skeleton */}
          <div className="hidden lg:block">
            <Card className="rounded-2xl border border-border/60 bg-card/50 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <Skeleton className="h-5 w-28 rounded-md" />
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Skeleton className="h-16 w-full rounded-xl bg-muted/40" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* Host Community Card Skeleton */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <Skeleton className="h-5 w-32 rounded-md" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl bg-muted/60 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md bg-muted/60" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded-lg bg-muted/40" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
