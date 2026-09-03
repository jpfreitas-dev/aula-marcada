import type { ClassSession } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { getClassBadge, getStatusStripeColor } from '@/utils/class-badge';

import { Badge } from '@/components/ui/badge';

type ClassCardProps = {
  session: ClassSession;
  onClick?: () => void;
};

export function ClassCard({ session, onClick }: ClassCardProps) {
  const badge = getClassBadge(session);
  const stripeColor = getStatusStripeColor(session);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-22 w-full min-w-0 cursor-pointer items-start gap-3 overflow-hidden rounded-lg border border-outline-variant/30 bg-surface p-3 text-left shadow-sm transition-transform active:scale-[0.99] md:min-h-24 md:gap-4 md:p-card-padding"
    >
      <div
        className={`absolute bottom-0 left-0 top-0 w-1 ${stripeColor}`}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pl-2">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <span className="min-w-0 truncate font-display text-body-md font-semibold text-text-main">
            {session.studentName}
          </span>
          <Badge
            label={badge.label}
            variant={badge.variant}
            className="shrink-0"
          />
        </div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
          <span className="font-mono text-xs text-text-muted">
            {session.startTime} - {session.endTime}
          </span>
          <span className="font-mono text-sm font-medium text-text-main">
            {formatCurrency(session.expectedAmount)}
          </span>
        </div>
      </div>
    </button>
  );
}
