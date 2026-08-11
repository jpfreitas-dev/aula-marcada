import { useEffect, useState } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { fieldLabelClassName } from '@/components/ui/field';
import { TimeRangeInput } from '@/components/ui/time-range-input';
import { WorkdayDateInput } from '@/components/ui/workday-date-input';
import type { ClassSession } from '@/types';
import { getAvailablePeriods, rescheduleClass } from '@/services/class-service';
import { getEffectiveStartMinTime } from '@/utils/schedule-period';
import {
  addMinutesToTime,
  applyStartTimeChange,
  clampTimeToBounds,
  defaultStartTimeForPeriod,
  formatHoursLabel,
  getEffectiveEndMinTime,
  getTimeRangeBoundsForStartTime,
  MIN_CLASS_DURATION_MINUTES,
  minutesBetween,
  periodFromStartTime,
  timeToMinutes,
} from '@/utils/time';
import { addWorkdays, getDefaultAgendaDate, toDateKey } from '@/utils/workday';

type RescheduleClassModalProps = {
  open: boolean;
  onClose: () => void;
  session: ClassSession;
};

export function RescheduleClassModal({
  open,
  onClose,
  session,
}: RescheduleClassModalProps) {
  if (!open) {
    return null;
  }

  return (
    <RescheduleClassForm key={session.id} session={session} onClose={onClose} />
  );
}

type RescheduleClassFormProps = {
  session: ClassSession;
  onClose: () => void;
};

function RescheduleClassForm({ session, onClose }: RescheduleClassFormProps) {
  const [date, setDate] = useState(session.date);
  const [startTime, setStartTime] = useState(session.startTime);
  const [endTime, setEndTime] = useState(session.endTime);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const workdayDates = Array.from({ length: 20 }, (_, index) =>
    toDateKey(addWorkdays(getDefaultAgendaDate(), index)),
  );
  const dateMin = workdayDates[0];
  const dateMax = workdayDates[workdayDates.length - 1];
  const durationMinutes = minutesBetween(startTime, endTime);
  const minimumDuration = Math.max(
    session.durationMinutes,
    MIN_CLASS_DURATION_MINUTES,
  );
  const timeRangeBounds = getTimeRangeBoundsForStartTime(startTime, {
    minDurationMinutes: minimumDuration,
  });
  const effectiveStartMinTime = getEffectiveStartMinTime(
    date,
    timeRangeBounds.startMin,
  );
  const period = periodFromStartTime(startTime);

  useEffect(() => {
    let cancelled = false;

    void getAvailablePeriods(date, session.id).then((periods) => {
      if (cancelled) {
        return;
      }

      if (periods.length === 0) {
        return;
      }

      setStartTime((currentStart) => {
        const currentPeriod = periodFromStartTime(currentStart);
        if (periods.includes(currentPeriod)) {
          return currentStart;
        }

        const nextStart = defaultStartTimeForPeriod(periods[0]);
        setEndTime(addMinutesToTime(nextStart, minimumDuration));
        return nextStart;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [date, session.id, minimumDuration]);

  const handleStartTimeChange = (nextStart: string) => {
    const bounds = getTimeRangeBoundsForStartTime(nextStart, {
      minDurationMinutes: minimumDuration,
    });
    const startMin =
      timeToMinutes(effectiveStartMinTime) > timeToMinutes(bounds.startMin)
        ? effectiveStartMinTime
        : bounds.startMin;
    const { startTime: clampedStart, endTime: nextEnd } = applyStartTimeChange(
      startTime,
      endTime,
      nextStart,
      {
        startMin,
        startMax: bounds.startMax,
        endMax: bounds.endMax,
        minDurationMinutes: minimumDuration,
      },
    );

    setStartTime(clampedStart);
    setEndTime(nextEnd);
  };

  const handleSave = async () => {
    if (durationMinutes < minimumDuration) {
      setError(
        `A duração mínima é ${formatHoursLabel(minimumDuration)} de aula.`,
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await rescheduleClass(session.id, {
        date,
        period,
        startTime,
        durationMinutes,
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível alterar o horário.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      open
      tall
      title="Alterar horário"
      onClose={onClose}
      footer={
        <Button
          className="w-full"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          Salvar horário
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className={fieldLabelClassName}>Data</span>
          <WorkdayDateInput
            value={date}
            min={dateMin}
            max={dateMax}
            onChange={setDate}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className={fieldLabelClassName}>Horário</span>
          <TimeRangeInput
            startTime={startTime}
            endTime={endTime}
            startMinTime={
              timeToMinutes(effectiveStartMinTime) >
              timeToMinutes(timeRangeBounds.startMin)
                ? effectiveStartMinTime
                : timeRangeBounds.startMin
            }
            startMaxTime={timeRangeBounds.startMax}
            endMaxTime={timeRangeBounds.endMax}
            minDurationMinutes={minimumDuration}
            onStartChange={handleStartTimeChange}
            onEndChange={(nextEnd) => {
              const endMinTime = getEffectiveEndMinTime(startTime, {
                minDurationMinutes: minimumDuration,
              });
              setEndTime(
                clampTimeToBounds(nextEnd, endMinTime, timeRangeBounds.endMax),
              );
            }}
          />
        </div>

        {error ? <p className="text-sm text-status-danger">{error}</p> : null}
      </div>
    </BottomSheet>
  );
}
