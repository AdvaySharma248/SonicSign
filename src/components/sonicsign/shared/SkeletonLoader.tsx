'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SkeletonVariant = 'card' | 'table-row' | 'stats';

interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  count?: number;
  className?: string;
}

/* ─── Card Skeleton ────────────────────────────────────────────── */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-4',
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Body lines */}
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-4/5 rounded-md" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/* ─── Table Row Skeleton ───────────────────────────────────────── */
function TableRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 border-b border-[#E5E7EB]/60',
        className
      )}
    >
      <Skeleton className="size-9 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-3/5 rounded-md" />
        <Skeleton className="h-3 w-2/5 rounded-md" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full shrink-0" />
      <Skeleton className="h-3 w-20 rounded-md shrink-0" />
      <Skeleton className="size-7 rounded-lg shrink-0" />
    </div>
  );
}

/* ─── Stats Skeleton ───────────────────────────────────────────── */
function StatsSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 md:grid-cols-4 gap-4',
        className
      )}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-3 w-10 rounded-md" />
          </div>
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-3 w-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/* ─── Main SkeletonLoader ──────────────────────────────────────── */
export function SkeletonLoader({
  variant,
  count = 3,
  className,
}: SkeletonLoaderProps) {
  if (variant === 'stats') {
    return <StatsSkeleton className={className} />;
  }

  if (variant === 'card') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={cn('rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden', className)}>
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <Skeleton className="size-9 rounded-lg shrink-0" />
          <Skeleton className="h-3 w-1/4 rounded-md" />
          <div className="flex-1" />
          <Skeleton className="h-3 w-16 rounded-md shrink-0" />
          <Skeleton className="h-3 w-20 rounded-md shrink-0" />
          <Skeleton className="size-7 rounded-lg shrink-0" />
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  return null;
}
