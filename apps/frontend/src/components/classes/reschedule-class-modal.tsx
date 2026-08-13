import { useEffect, useMemo, useRef, useState } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { fieldLabelClassName } from '@/components/ui/field';
import { useAgendaRefresh } from '@/context/agenda-refresh-context';
import { TimeRangeInput } from '@/components/ui/time-range-input';
import { WorkdayDateInput } from '@/components/ui/workday-date-input';
import type { ClassPeriod, ClassSession } from '@/types';
import {
  getAvailablePeriods,
  getClassByIdService,
  rescheduleClass,
} from '@/services/class-service';
import { calculateRequiredMakeupMinutes } from '@/utils/makeup';
import {
  getAggregatedScheduleTimeBounds,
  findNextAllowedStartTime,
  findPreviousAllowedStartTime,
  isStartTimeAllowedForPeriods,
  resolveStartTimeChangeBounds,
  syncTimesForAvailablePeriods,
} from '@/utils/schedule-period';
import {
  applyStartTimeChange,
  clampTimeToBounds,
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
  const { refresh: refreshAgenda } = useAgendaRefresh();
  const [date, setDate] = useState(session.date);
  const [startTime, setStartTime] = useState(session.startTime);
  const [endTime, setEndTime] = useState(session.endTime);
  const [availablePeriods, setAvailablePeriods] = useState<ClassPeriod[]>([
    session.period,
  ]);
  const [linkedAbsences, setLinkedAbsences] = useState<ClassSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const timesRef = useRef({ startTime, endTime });

  useEffect(() => {
    timesRef.current = { startTime, endTime };
  }, [startTime, endTime]);

  useEffect(() => {
    if (session.linkedAbsenceIds.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      session.linkedAbsenceIds.map((id) => getClassByIdService(id)),
    ).then((loaded) => {
      if (!cancelled) {
        setLinkedAbsences(
          loaded.filter((item): item is ClassSession => item !== null),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session.linkedAbsenceIds]);

  const workdayDates = Array.from({ length: 20 }, (_, index) =>
    toDateKey(addWorkdays(getDefaultAgendaDate(), index)),
  );
  const dateMin = workdayDates[0];
  const dateMax = workdayDates[workdayDates.length - 1];
  const durationMinutes = minutesBetween(startTime, endTime);
  const resolvedLinkedAbsences =
    session.linkedAbsenceIds.length === 0 ? [] : linkedAbsences;

  const minimumDuration = useMemo(() => {
    if (session.linkedAbsenceIds.length === 0) {
      return MIN_CLASS_DURATION_MINUTES;
    }

    return calculateRequiredMakeupMinutes(
      session,
      session.linkedAbsenceIds,
      session.isMakeupOnly,
      resolvedLinkedAbsences,
    );
  }, [resolvedLinkedAbsences, session]);
  const boundOptions = useMemo(
    () => ({ minDurationMinutes: minimumDuration }),
    [minimumDuration],
  );

  const aggregatedBounds = useMemo(
    () => getAggregatedScheduleTimeBounds(date, availablePeriods, boundOptions),
    [availablePeriods, boundOptions, date],
  );

  const periodTimeBounds = useMemo(
    () => getTimeRangeBoundsForStartTime(startTime, boundOptions),
    [boundOptions, startTime],
  );

  const period = periodFromStartTime(startTime);
  const hasScheduleAvailability = aggregatedBounds.hasAvailability;

  useEffect(() => {
    let cancelled = false;
    const requestedDate = date;

    void getAvailablePeriods(requestedDate, session.id).then((periods) => {
      if (cancelled) {
        return;
      }

      setAvailablePeriods(periods);

      const synced = syncTimesForAvailablePeriods(
        requestedDate,
        periods,
        timesRef.current.startTime,
        timesRef.current.endTime,
        boundOptions,
      );

      if (!synced) {
        return;
      }

      setStartTime(synced.startTime);
      setEndTime(synced.endTime);
    });

    return () => {
      cancelled = true;
    };
  }, [boundOptions, date, session.id]);

  const handleStartTimeChange = (nextStart: string) => {
    if (!hasScheduleAvailability) {
      return;
    }

    const movingLater = timeToMinutes(nextStart) >= timeToMinutes(startTime);
    const snappedStart = (
      movingLater ? findNextAllowedStartTime : findPreviousAllowedStartTime
    )(nextStart, date, availablePeriods, aggregatedBounds, boundOptions);

    if (!snappedStart) {
      return;
    }

    const changeBounds = resolveStartTimeChangeBounds(
      date,
      snappedStart,
      aggregatedBounds,
      boundOptions,
    );
    const { startTime: clampedStart, endTime: nextEnd } = applyStartTimeChange(
      startTime,
      endTime,
      snappedStart,
      {
        ...changeBounds,
        minDurationMinutes: minimumDuration,
      },
    );

    setStartTime(clampedStart);
    setEndTime(nextEnd);
    setError(null);
  };

  const handleEndTimeChange = (nextEnd: string) => {
    if (!hasScheduleAvailability) {
      return;
    }

    const endMinTime = getEffectiveEndMinTime(startTime, {
      minDurationMinutes: minimumDuration,
    });
    setEndTime(clampTimeToBounds(nextEnd, endMinTime, periodTimeBounds.endMax));
    setError(null);
  };

  const handleSave = async () => {
    if (!hasScheduleAvailability) {
      setError('Não há períodos disponíveis nesta data.');
      return;
    }

    if (
      !isStartTimeAllowedForPeriods(startTime, availablePeriods, boundOptions)
    ) {
      setError('O horário de início está fora dos períodos disponíveis.');
      return;
    }

    if (durationMinutes < minimumDuration) {
      setError(
        `A duração mínima é ${formatHoursLabel(minimumDuration)} de aula.`,
      );
      return;
    }

    if (timeToMinutes(endTime) > timeToMinutes(periodTimeBounds.endMax)) {
      setError('O horário deve permanecer dentro do mesmo período.');
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
      refreshAgenda();
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
      onSubmit={() => void handleSave()}
      submitDisabled={saving || !hasScheduleAvailability}
      footer={
        <Button
          type="submit"
          className="w-full"
          disabled={saving || !hasScheduleAvailability}
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
            onChange={(nextDate) => {
              setError(null);
              setDate(nextDate);
            }}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className={fieldLabelClassName}>Horário</span>
          {hasScheduleAvailability ? (
            <TimeRangeInput
              startTime={startTime}
              endTime={endTime}
              startMinTime={aggregatedBounds.startMin}
              startMaxTime={aggregatedBounds.startMax}
              endMaxTime={periodTimeBounds.endMax}
              minDurationMinutes={minimumDuration}
              onStartChange={handleStartTimeChange}
              onEndChange={handleEndTimeChange}
            />
          ) : (
            <p className="rounded-md border border-outline-variant/40 bg-bg-subtle px-3 py-3 text-center text-sm text-text-muted">
              Ocupado
            </p>
          )}
        </div>

        {error ? <p className="text-sm text-status-danger">{error}</p> : null}
      </div>
    </BottomSheet>
  );
}
