import { Badge } from '@/components/ui/badge';
import type { ClassSession } from '@/types';
import { getClassBadge } from '@/utils/class-badge';
import { formatHoursLabel } from '@/utils/time';
import { formatWorkdayLabel } from '@/utils/workday';

type MakeupSelectableClassCardProps = {
  session: ClassSession;
  selected: boolean;
  showMakeupPending: boolean;
  onToggle: () => void;
};

export function MakeupSelectableClassCard({
  session,
  selected,
  showMakeupPending,
  onToggle,
}: MakeupSelectableClassCardProps) {
  const badge = getClassBadge(session);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-md border p-3 text-left shadow-sm transition-colors ${
        selected
          ? 'border-2 border-primary bg-primary-fixed/20'
          : 'border border-outline-variant/30 bg-surface'
      }`}
    >
      {session.attendance === 'absent' ? (
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-status-danger" />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1 pl-2">
        <span className="font-medium text-text-main">
          {formatWorkdayLabel(new Date(`${session.date}T12:00:00`))}
        </span>
        <span className="font-mono text-xs text-text-muted">
          {session.startTime} - {session.endTime}
        </span>
        {showMakeupPending ? (
          <span className="text-xs text-text-muted">
            Pendente:{' '}
            {formatHoursLabel(
              session.pendingMakeupMinutes ?? session.durationMinutes,
            )}
          </span>
        ) : null}
      </div>
      <Badge label={badge.label} variant={badge.variant} />
    </button>
  );
}
