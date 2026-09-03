import { useEffect, useMemo, useState } from 'react';

import { MakeupSelectableClassCard } from '@/components/classes/makeup-selectable-class-card';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useAgendaRefresh } from '@/context/agenda-refresh-context';
import { TimeRangeInput } from '@/components/ui/time-range-input';
import type { ClassSession } from '@/types';
import { getPendingAbsences, linkMakeup } from '@/services/class-service';
import { calculateRequiredMakeupMinutes } from '@/utils/makeup';
import {
  addMinutesToTime,
  applyStartTimeChange,
  clampTimeToBounds,
  formatHoursLabel,
  getEffectiveEndMinTime,
  getMaxDurationMinutesForStartTime,
  getTimeRangeBoundsForStartTime,
  MIN_CLASS_DURATION_MINUTES,
  minutesBetween,
} from '@/utils/time';

function resolveRequiredMakeupMinutes(
  targetClass: ClassSession | null | undefined,
  selectedIds: string[],
  isMakeupOnly: boolean,
  absences: ClassSession[],
  initialDurationMinutes: number,
): number {
  if (selectedIds.length === 0) {
    return Math.max(initialDurationMinutes, MIN_CLASS_DURATION_MINUTES);
  }

  return Math.max(
    calculateRequiredMakeupMinutes(
      targetClass ?? null,
      selectedIds,
      isMakeupOnly,
      absences,
    ),
    MIN_CLASS_DURATION_MINUTES,
  );
}

type LinkMakeupModalProps = {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  targetClass?: ClassSession | null;
  isMakeupOnly?: boolean;
  initialStartTime?: string;
  initialDurationMinutes?: number;
  onConfirm?: (result: {
    absenceIds: string[];
    startTime: string;
    endTime: string;
  }) => void;
};

export function LinkMakeupModal({
  open,
  onClose,
  studentId,
  studentName,
  targetClass,
  isMakeupOnly = false,
  initialStartTime = '08:00',
  initialDurationMinutes = 60,
  onConfirm,
}: LinkMakeupModalProps) {
  if (!open) {
    return null;
  }

  const resolvedStartTime = targetClass?.startTime ?? initialStartTime;
  const resolvedDurationMinutes =
    targetClass?.durationMinutes ?? initialDurationMinutes;

  return (
    <LinkMakeupForm
      key={`${studentId}-${resolvedStartTime}-${resolvedDurationMinutes}-${targetClass?.id ?? 'new'}`}
      onClose={onClose}
      studentId={studentId}
      studentName={studentName}
      targetClass={targetClass}
      isMakeupOnly={isMakeupOnly}
      initialStartTime={resolvedStartTime}
      initialDurationMinutes={resolvedDurationMinutes}
      onConfirm={onConfirm}
    />
  );
}

type LinkMakeupFormProps = Omit<LinkMakeupModalProps, 'open'>;

function LinkMakeupForm({
  onClose,
  studentId,
  studentName,
  targetClass,
  isMakeupOnly = false,
  initialStartTime = '08:00',
  initialDurationMinutes = 60,
  onConfirm,
}: LinkMakeupFormProps) {
  const [absences, setAbsences] = useState<ClassSession[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(
    addMinutesToTime(initialStartTime, initialDurationMinutes),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { refresh: refreshAgenda } = useAgendaRefresh();

  useEffect(() => {
    let cancelled = false;

    void getPendingAbsences(studentId).then((loadedAbsences) => {
      if (!cancelled) {
        setAbsences(loadedAbsences);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const resolveRequiredMinutes = (ids: string[]) =>
    resolveRequiredMakeupMinutes(
      targetClass,
      ids,
      isMakeupOnly,
      absences,
      initialDurationMinutes,
    );

  const applyMinimumEndTime = (
    nextStart: string,
    nextEnd: string,
    minMinutes: number,
  ) => {
    const bounds = getTimeRangeBoundsForStartTime(nextStart, {
      minDurationMinutes: minMinutes,
    });
    const endMinTime = getEffectiveEndMinTime(nextStart, {
      minDurationMinutes: minMinutes,
    });
    const duration = minutesBetween(nextStart, nextEnd);

    if (duration >= minMinutes) {
      return clampTimeToBounds(nextEnd, endMinTime, bounds.endMax);
    }

    return clampTimeToBounds(
      addMinutesToTime(nextStart, minMinutes),
      endMinTime,
      bounds.endMax,
    );
  };

  const requiredMinutes = useMemo(
    () =>
      resolveRequiredMakeupMinutes(
        targetClass,
        selectedIds,
        isMakeupOnly,
        absences,
        initialDurationMinutes,
      ),
    [absences, targetClass, selectedIds, isMakeupOnly, initialDurationMinutes],
  );

  const currentMinutes = minutesBetween(startTime, endTime);
  const missingMinutes = Math.max(requiredMinutes - currentMinutes, 0);
  const maxPeriodMinutes = getMaxDurationMinutesForStartTime(startTime);
  const exceedsPeriodCapacity = requiredMinutes > maxPeriodMinutes;
  const timeRangeBounds = getTimeRangeBoundsForStartTime(startTime, {
    minDurationMinutes: requiredMinutes,
  });
  const canConfirm =
    selectedIds.length > 0 &&
    missingMinutes === 0 &&
    !exceedsPeriodCapacity &&
    !saving;

  const toggleSelection = (id: string) => {
    setError(null);
    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];
    const nextRequired = resolveRequiredMinutes(nextIds);

    setSelectedIds(nextIds);
    setEndTime(applyMinimumEndTime(startTime, endTime, nextRequired));
  };

  const handleStartTimeChange = (nextStart: string) => {
    const bounds = getTimeRangeBoundsForStartTime(nextStart, {
      minDurationMinutes: requiredMinutes,
    });
    const { startTime: clampedStart, endTime: nextEnd } = applyStartTimeChange(
      startTime,
      endTime,
      nextStart,
      {
        startMin: bounds.startMin,
        startMax: bounds.startMax,
        endMax: bounds.endMax,
        minDurationMinutes: requiredMinutes,
      },
    );

    setStartTime(clampedStart);
    setEndTime(applyMinimumEndTime(clampedStart, nextEnd, requiredMinutes));
  };

  const handleEndTimeChange = (nextEnd: string) => {
    const bounds = getTimeRangeBoundsForStartTime(startTime, {
      minDurationMinutes: requiredMinutes,
    });
    const endMinTime = getEffectiveEndMinTime(startTime, {
      minDurationMinutes: requiredMinutes,
    });
    setEndTime(clampTimeToBounds(nextEnd, endMinTime, bounds.endMax));
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      setError('Selecione ao menos uma falta.');
      return;
    }

    if (exceedsPeriodCapacity) {
      setError(
        `A reposição excede o limite do período (${formatHoursLabel(maxPeriodMinutes)}).`,
      );
      return;
    }

    if (missingMinutes > 0) {
      setError(`Necessário mais ${formatHoursLabel(missingMinutes)} de aula.`);
      return;
    }

    if (onConfirm) {
      onConfirm({ absenceIds: selectedIds, startTime, endTime });
      onClose();
      return;
    }

    if (!targetClass) {
      setError('Aula de destino não encontrada.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await linkMakeup({
        targetClassId: targetClass.id,
        studentId,
        absenceIds: selectedIds,
        startTime,
        endTime,
      });
      refreshAgenda();
      onClose();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Não foi possível confirmar a reposição.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      open
      tall
      title="Vincular reposição"
      onClose={onClose}
      onSubmit={() => void handleConfirm()}
      submitDisabled={!canConfirm}
      footer={
        absences.length > 0 ? (
          <Button type="submit" className="w-full" disabled={!canConfirm}>
            Confirmar reposição
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          Falta(s) do aluno(a){' '}
          <span className="font-semibold text-text-main">{studentName}</span>
        </p>

        {absences.length === 0 ? (
          <p className="rounded-md bg-bg-subtle p-4 text-sm text-text-muted">
            Não há faltas pendentes de reposição para este aluno.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="scroll-area max-h-56 space-y-3 pr-1">
              {absences.map((session) => (
                <MakeupSelectableClassCard
                  key={session.id}
                  session={session}
                  selected={selectedIds.includes(session.id)}
                  showMakeupPending
                  onToggle={() => toggleSelection(session.id)}
                />
              ))}
            </div>
          </div>
        )}

        {absences.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Horário
            </span>
            <TimeRangeInput
              startTime={startTime}
              endTime={endTime}
              startMinTime={timeRangeBounds.startMin}
              startMaxTime={timeRangeBounds.startMax}
              endMaxTime={timeRangeBounds.endMax}
              minDurationMinutes={requiredMinutes}
              onStartChange={handleStartTimeChange}
              onEndChange={handleEndTimeChange}
            />
          </div>
        ) : null}

        {absences.length > 0 && selectedIds.length > 0 ? (
          <p className="text-xs text-text-muted">
            Duração necessária: {formatHoursLabel(requiredMinutes)}
            {!isMakeupOnly && targetClass
              ? ` (aula ${formatHoursLabel(targetClass.durationMinutes)} + reposição ${formatHoursLabel(requiredMinutes - targetClass.durationMinutes)})`
              : null}
          </p>
        ) : null}

        {absences.length > 0 && missingMinutes > 0 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-status-warning">
            Necessário mais {formatHoursLabel(missingMinutes)} de aula.
          </p>
        ) : null}

        {absences.length > 0 && exceedsPeriodCapacity ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-status-warning">
            A reposição excede o limite do período (
            {formatHoursLabel(maxPeriodMinutes)}).
          </p>
        ) : null}

        {error ? <p className="text-sm text-status-danger">{error}</p> : null}
      </div>
    </BottomSheet>
  );
}
