import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5">
      <Skeleton className="h-10 w-10 rounded-xl mb-3" />
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-6 w-28" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-2">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-14" />
    </div>
  );
}
