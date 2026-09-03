import { ClassCardSkeleton } from '@/components/classes/class-card';
import { EmptySlotSkeleton } from '@/components/ui/empty-slot';
import { tv, type VariantProps } from 'tailwind-variants';

const skeletonVariants = tv({
  base: 'animate-pulse rounded-md bg-surface-variant/60',
  defaultVariants: {
    shape: 'line',
  },
});

type SkeletonProps = VariantProps<typeof skeletonVariants> & {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={skeletonVariants({ className })} />;
}

const periodSectionClassName = 'flex min-w-0 flex-col gap-stack-sm';

const periodLabelClassName =
  'px-2 text-xs font-medium uppercase tracking-wider text-text-muted';

function PeriodSectionSkeleton({ label }: { label: string }) {
  return (
    <section className={periodSectionClassName}>
      <h3 className={periodLabelClassName}>{label}</h3>
      <ClassCardSkeleton />
    </section>
  );
}

export function AgendaDaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
      <PeriodSectionSkeleton label="MANHÃ" />
      <PeriodSectionSkeleton label="TARDE/NOITE" />
    </div>
  );
}

const weekDaySectionClassName =
  'min-w-0 rounded-lg border border-outline-variant/20 bg-surface p-3 shadow-sm';

export function AgendaWeekSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <section key={index} className={weekDaySectionClassName}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex flex-col gap-2">
            <PeriodSectionSkeleton label="MANHÃ" />
            <PeriodSectionSkeleton label="TARDE/NOITE" />
          </div>
        </section>
      ))}
    </div>
  );
}

export const studentListItemClassName =
  'block h-full rounded-xl border border-outline-variant bg-surface p-4';

type StudentCardSkeletonProps = {
  showingFormer?: boolean;
};

export function StudentCardSkeleton({
  showingFormer = false,
}: StudentCardSkeletonProps) {
  return (
    <li className="min-w-0">
      <div className={studentListItemClassName} aria-hidden="true">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-2/5 max-w-40" />
          <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
        </div>
        {showingFormer ? (
          <Skeleton className="mt-2 h-4 w-52" />
        ) : (
          <div className="mt-2 flex min-w-0 items-center gap-1.5">
            <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
        )}
      </div>
    </li>
  );
}

export function StudentListSkeleton({
  count = 3,
  showingFormer = false,
}: {
  count?: number;
  showingFormer?: boolean;
}) {
  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <StudentCardSkeleton key={index} showingFormer={showingFormer} />
      ))}
    </ul>
  );
}

const financialSummaryCardClassName =
  'flex min-w-0 flex-col items-start justify-start gap-1 rounded-xl border border-outline-variant/20 bg-surface px-3 py-2.5 shadow-sm';

function FinancialSummaryCardSkeleton() {
  return (
    <div className={financialSummaryCardClassName}>
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="mt-1 h-5 w-24" />
    </div>
  );
}

function FinancialChartSectionSkeleton({ title }: { title: string }) {
  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <h2 className="font-display text-base font-bold text-text-main">
        {title}
      </h2>
      <section className="flex h-full flex-1 flex-col gap-3 rounded-xl border border-outline-variant/20 bg-surface p-4 shadow-sm md:p-5">
        <Skeleton className="h-4 w-36" />
        <div className="flex w-full flex-col items-center gap-4 md:gap-5">
          <Skeleton className="h-40 w-40 rounded-full" />
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      </section>
    </section>
  );
}

export function FinancialContentSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <FinancialSummaryCardSkeleton />
          <FinancialSummaryCardSkeleton />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <FinancialSummaryCardSkeleton />
          <FinancialSummaryCardSkeleton />
          <FinancialSummaryCardSkeleton />
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-base font-bold text-text-main">
          Comparativo do Período
        </h2>
        <div className="rounded-xl bg-surface p-4 shadow-sm md:p-6">
          <div className="mb-4 flex justify-center gap-4 md:mb-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </section>

      <div className="grid grid-cols-1 items-stretch gap-stack-md lg:grid-cols-2">
        <FinancialChartSectionSkeleton title="Quem mais paga" />
        <FinancialChartSectionSkeleton title="Quem mais falta" />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-base font-bold text-text-main">
          Pagamentos pendentes
        </h2>
        <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <li key={index} className="min-w-0">
              <div className="flex h-full items-center justify-between gap-3 rounded-xl border border-outline-variant/20 bg-surface p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-1 h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-16 shrink-0" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function FinancialSkeleton() {
  return (
    <div className="flex flex-col gap-stack-md">
      <Skeleton className="mx-auto h-9 w-56 rounded-full" />
      <div className="flex w-full flex-col gap-2 md:flex-row">
        <Skeleton className="h-12 w-full rounded-md md:flex-1" />
        <Skeleton className="h-12 w-full rounded-md md:flex-1" />
      </div>
      <FinancialContentSkeleton />
    </div>
  );
}

const profileCardClassName =
  'rounded-xl border border-outline-variant/30 bg-surface p-4 shadow-sm';

export function StudentProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <section className="border-b border-outline-variant/30 pb-4">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
        </div>
        <Skeleton className="mt-1 h-4 w-64 max-w-full" />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={profileCardClassName}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-5 w-40" />
          <Skeleton className="mt-4 h-12 w-full rounded-md" />
        </section>

        <section className={profileCardClassName}>
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
          </div>
          <Skeleton className="mt-3 h-4 w-40" />
          <Skeleton className="mt-3 h-4 w-56" />
        </section>

        <section className={`${profileCardClassName} lg:col-span-2`}>
          <Skeleton className="h-3 w-20" />
          <div className="mt-3 flex border-b border-outline-variant/30">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="mx-1 mb-2 h-8 flex-1" />
            ))}
          </div>
          <Skeleton className="mt-4 h-4 w-44" />
          <Skeleton className="mt-3 h-2 w-full rounded-full" />
        </section>
      </div>

      <Skeleton className="h-12 w-full rounded-md" />
    </div>
  );
}

export { EmptySlotSkeleton };
