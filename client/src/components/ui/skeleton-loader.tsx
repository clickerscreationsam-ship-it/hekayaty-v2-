import { Skeleton } from "./skeleton";
import { MagicLoader } from "./MagicLoader";
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
  return <MagicLoader />;
}

export function HeroSkeleton() {
  return <MagicLoader />;
}
