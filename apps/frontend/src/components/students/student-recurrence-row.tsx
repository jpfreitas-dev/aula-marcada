import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { TimeRangeInput } from '@/components/ui/time-range-input';
import type { StudentWeekday } from '@/types';
import {
  clampTimeToBounds,
  getEffectiveEndMinTime,
  getTimeRangeBoundsForStartTime,
  MIN_CLASS_DURATION_MINUTES,
} from '@/utils/time';

export type RecurrenceRowValue = {
  id: string;
  weekday: StudentWeekday;
  startTime: string;
  endTime: string;
};

type StudentRecurrenceRowProps = {
  row: RecurrenceRowValue;
  weekdayOptions: Array<{ value: StudentWeekday; label: string }>;
  fieldClassName: string;
  onWeekdayChange: (weekday: StudentWeekday) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onRemove: () => void;
};

export function StudentRecurrenceRow({
  row,
  weekdayOptions,
  fieldClassName,
  onWeekdayChange,
  onStartChange,
  onEndChange,
  onRemove,
}: StudentRecurrenceRowProps) {
  const timeRangeBounds = getTimeRangeBoundsForStartTime(row.startTime);

  return (
    <div className={`${fieldClassName} flex min-w-0 items-center gap-1 px-1`}>
      <div className="relative min-w-0 w-[30%]">
        <select
          value={row.weekday}
          onChange={(event) =>
            onWeekdayChange(Number(event.target.value) as StudentWeekday)
          }
          className="w-full appearance-none truncate border-none bg-transparent py-0 pl-2 pr-6 text-sm text-text-main focus:ring-0"
        >
          {weekdayOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-base text-secondary"
        />
      </div>

      <div className="h-6 w-px shrink-0 bg-purple-100" />

      <TimeRangeInput
        variant="plain"
        pickerPlacement="above"
        className="min-w-0 flex-1"
        startTime={row.startTime}
        endTime={row.endTime}
        startMinTime={timeRangeBounds.startMin}
        startMaxTime={timeRangeBounds.startMax}
        endMaxTime={timeRangeBounds.endMax}
        minDurationMinutes={MIN_CLASS_DURATION_MINUTES}
        onStartChange={onStartChange}
        onEndChange={(nextEnd) => {
          const endMinTime = getEffectiveEndMinTime(row.startTime, {
            minDurationMinutes: MIN_CLASS_DURATION_MINUTES,
          });
          onEndChange(
            clampTimeToBounds(nextEnd, endMinTime, timeRangeBounds.endMax),
          );
        }}
      />

      <div className="h-6 w-px shrink-0 bg-purple-100" />

      <IconButton
        icon="delete"
        danger
        aria-label="Excluir aula recorrente"
        className="h-7 w-7 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        onClick={onRemove}
      />
    </div>
  );
}
