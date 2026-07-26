import { HTMLAttributes } from 'react';

export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-zinc-800/60 border border-zinc-700/30 ${className}`}
      {...props}
    />
  );
}

export function CarCardSkeleton() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card p-0 shadow-md">
      {/* Image Skeleton */}
      <Skeleton className="aspect-[16/10] w-full rounded-none border-none bg-zinc-900" />

      {/* Content Body Skeleton */}
      <div className="flex flex-1 flex-col p-5 space-y-4">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 bg-zinc-800" />

        {/* Spec Pills */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 bg-zinc-800/80 rounded-xl" />
          <Skeleton className="h-6 w-24 bg-zinc-800/80 rounded-xl" />
          <Skeleton className="h-6 w-16 bg-zinc-800/80 rounded-xl" />
        </div>

        {/* Footer info: Bid & Timer */}
        <div className="mt-auto border-t border-border/80 pt-4 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 bg-zinc-800/60" />
            <Skeleton className="h-7 w-28 bg-emerald-500/20" />
          </div>
          <Skeleton className="h-5 w-24 bg-zinc-800/80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function DashboardBannerSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
      <div className="flex items-center gap-4 w-full">
        <Skeleton className="h-14 w-14 rounded-2xl bg-zinc-800 flex-shrink-0" />
        <div className="space-y-2 w-48">
          <Skeleton className="h-7 w-full bg-zinc-800" />
          <Skeleton className="h-4 w-32 bg-zinc-800/60" />
        </div>
      </div>
    </div>
  );
}
