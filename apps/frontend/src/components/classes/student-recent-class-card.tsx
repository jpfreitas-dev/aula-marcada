import { Badge } from '@/components/ui/badge';
import type { ClassSession } from '@/types';
import { getClassBadge } from '@/utils/class-badge';
import { formatWorkdayLabel } from '@/utils/workday';

type StudentRecentClassCardProps = {
  session: ClassSession;
  onClick?: () => void;
};

export function StudentRecentClassCard({
  session,
  onClick,
}: StudentRecentClassCardProps) {
  const badge = getClassBadge(session);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-md border border-outline-variant/30 bg-surface p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-medium text-text-main">
          {formatWorkdayLabel(new Date(`${session.date}T12:00:00`))}
        </span>
        <span className="font-mono text-xs text-text-muted">
          {session.startTime} - {session.endTime}
        </span>
      </div>
      <Badge label={badge.label} variant={badge.variant} />
    </button>
  );
}
