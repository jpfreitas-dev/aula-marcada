import { tv, type VariantProps } from 'tailwind-variants';

const skeletonVariants = tv({
  base: 'animate-pulse rounded-md bg-surface-variant/60',
  variants: {
    shape: {
      line: 'h-4',
      circle: 'rounded-full',
      card: 'h-22 md:h-24',
      badge: 'h-5 w-16 rounded-full',
    },
  },
  defaultVariants: {
    shape: 'line',
  },
});

type SkeletonProps = VariantProps<typeof skeletonVariants> & {
  className?: string;
};

export function Skeleton({ shape, className }: SkeletonProps) {
  return <div className={skeletonVariants({ shape, className })} />;
}

export function ClassCardSkeleton() {
  return (
    <div className="flex min-h-22 w-full items-start gap-3 rounded-lg border border-outline-variant/30 bg-surface p-3 shadow-sm md:min-h-24 md:gap-4 md:p-card-padding">
      <div className="absolute left-0 top-0 bottom-0 w-1 animate-pulse rounded-l bg-surface-variant/60" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 pl-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton shape="badge" />
        </div>
        <div className="flex items-end justify-between gap-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PeriodSectionSkeleton() {
  return (
    <div className="flex flex-col gap-stack-sm">
      <Skeleton className="mx-2 h-3 w-16" />
      <ClassCardSkeleton />
    </div>
  );
}

export function AgendaDaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
      <PeriodSectionSkeleton />
      <PeriodSectionSkeleton />
    </div>
  );
}

export function AgendaWeekSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-outline-variant/20 bg-surface p-3 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex flex-col gap-2">
            <PeriodSectionSkeleton />
            <PeriodSectionSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudentCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface p-3 shadow-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      <Skeleton shape="badge" />
    </div>
  );
}

export function StudentListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <StudentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FinancialSkeleton() {
  return (
    <div className="flex flex-col gap-stack-md">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-outline-variant/30 bg-surface p-card-padding shadow-sm"
          >
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

export function StudentProfileSkeleton() {
  return (
    <div className="flex flex-col gap-stack-md">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="rounded-md border border-outline-variant/30 bg-surface p-card-padding shadow-sm">
        <Skeleton className="mb-3 h-4 w-20" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="rounded-md border border-outline-variant/30 bg-surface p-card-padding shadow-sm">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
