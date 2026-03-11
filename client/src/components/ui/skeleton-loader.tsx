import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

export function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 glass-card rounded-2xl animate-pulse">
      <Skeleton className="h-[200px] w-full rounded-xl bg-white/5" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px] bg-white/5" />
        <Skeleton className="h-4 w-[200px] bg-white/5" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      <div className="space-y-4">
        <Skeleton className="h-12 w-[300px] bg-white/10 rounded-xl" />
        <Skeleton className="h-6 w-[500px] bg-white/5 rounded-lg" />
      </div>
      <GridSkeleton />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8 animate-pulse">
      <Skeleton className="h-12 w-[250px] rounded-full bg-white/10" />
      <Skeleton className="h-32 w-[80%] max-w-4xl bg-white/20 rounded-3xl" />
      <Skeleton className="h-8 w-[60%] max-w-2xl bg-white/10 rounded-xl" />
      <div className="flex gap-4">
        <Skeleton className="h-14 w-40 rounded-xl bg-white/20" />
        <Skeleton className="h-14 w-40 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}
