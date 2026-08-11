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
      className="relative flex w-full items-start gap-4 overflow-hidden rounded-card border border-outline-variant/30 bg-white p-card-padding text-left shadow-sm transition-transform active:scale-[0.99]"
    >
      <div
        className={`absolute bottom-0 left-0 top-0 w-1 ${stripeColor}`}
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col gap-2 pl-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-display text-body-md font-semibold text-text-main">
            {session.studentName}
          </span>
          <Badge label={badge.label} variant={badge.variant} />
        </div>
        <div className="mt-1 flex items-end justify-between">
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
