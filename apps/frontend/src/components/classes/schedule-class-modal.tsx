import { useEffect, useMemo, useState } from 'react';

import { LinkMakeupModal } from '@/components/classes/link-makeup-modal';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import {
  fieldControlClassName,
  fieldLabelClassName,
} from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { TimeRangeInput } from '@/components/ui/time-range-input';
import { WorkdayDateInput } from '@/components/ui/workday-date-input';
import type { ClassPeriod } from '@/types';
import {
  calculateRequiredMakeupMinutes,
  createClass,
  getAvailablePeriods,
} from '@/services/class-service';
import { listStudents } from '@/services/student-service';
import type { Student } from '@/types';
import {
  calculateExpectedAmount,
  formatCurrencyInput,
  parseCurrencyInput,
} from '@/utils/class-value';
import { formatCurrency } from '@/utils/currency';
import {
  getAggregatedScheduleTimeBounds,
  getDefaultStartForPeriods,
  isStartTimeAllowedForPeriods,
  resolveBoundedPeriods,
  resolveStartTimeChangeBounds,
} from '@/utils/schedule-period';
import {
  addMinutesToTime,
  applyStartTimeChange,
  clampTimeToBounds,
  DEFAULT_CLASS_DURATION_MINUTES,
  defaultStartTimeForPeriod,
  getEffectiveEndMinTime,
  getTimeRangeBoundsForStartTime,
  minutesBetween,
  periodFromStartTime,
} from '@/utils/time';
import {
  addWorkdays,
  formatWorkdayLabel,
  getDefaultAgendaDate,
  isWeekday,
  toDateKey,
} from '@/utils/workday';

export type ScheduleSlot = {
  date: string;
  period: ClassPeriod;
};

type ScheduleClassModalProps = {
  open: boolean;
  onClose: () => void;
  initialSlot?: ScheduleSlot;
};

type MakeupDraft = {
  absenceIds: string[];
  startTime: string;
  endTime: string;
};

const OCCUPIED_LABEL = 'Ocupado';
const WEEKEND_MESSAGE = 'Não é possível agendar aulas no fim de semana.';

function resolveInitialDate(initialSlot?: ScheduleSlot): string {
  return initialSlot?.date ?? toDateKey(getDefaultAgendaDate());
}

function resolveInitialSchedulePeriods(
  initialSlot?: ScheduleSlot,
): ClassPeriod[] {
  return initialSlot ? [initialSlot.period] : ['morning', 'afternoon'];
}

function resolveInitialStartTime(date: string, periods: ClassPeriod[]): string {
  return (
    getDefaultStartForPeriods(date, periods) ??
    defaultStartTimeForPeriod(periods[0] ?? 'morning')
  );
}

function syncScheduleTimes(
  date: string,
  periods: ClassPeriod[],
  currentStart: string,
): { startTime: string; endTime: string } | null {
  const nextStart =
    getDefaultStartForPeriods(date, periods) ??
    (isStartTimeAllowedForPeriods(currentStart, periods) ? currentStart : null);

  if (!nextStart) {
    return null;
  }

  const bounds = getTimeRangeBoundsForStartTime(nextStart);
  const endTime = clampTimeToBounds(
    addMinutesToTime(nextStart, DEFAULT_CLASS_DURATION_MINUTES),
    getEffectiveEndMinTime(nextStart),
    bounds.endMax,
  );

  return { startTime: nextStart, endTime };
}

export function ScheduleClassModal({
  open,
  onClose,
  initialSlot,
}: ScheduleClassModalProps) {
  if (!open) {
    return null;
  }

  const formKey = `${initialSlot?.date ?? 'default'}-${initialSlot?.period ?? 'any'}`;

  return (
    <ScheduleClassForm
      key={formKey}
      onClose={onClose}
      initialSlot={initialSlot}
    />
  );
}

function ScheduleClassForm({
  onClose,
  initialSlot,
}: {
  onClose: () => void;
  initialSlot?: ScheduleSlot;
}) {
  const initialDate = resolveInitialDate(initialSlot);
  const initialSchedulePeriods = resolveInitialSchedulePeriods(initialSlot);

  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(() =>
    resolveInitialStartTime(initialDate, initialSchedulePeriods),
  );
  const [endTime, setEndTime] = useState(() =>
    addMinutesToTime(
      resolveInitialStartTime(initialDate, initialSchedulePeriods),
      DEFAULT_CLASS_DURATION_MINUTES,
    ),
  );
  const [studentId, setStudentId] = useState('');
  const [amountInput, setAmountInput] = useState('0,00');
  const [isMakeupOnly, setIsMakeupOnly] = useState(false);
  const [makeupDraft, setMakeupDraft] = useState<MakeupDraft | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<ClassPeriod[]>([
    'morning',
    'afternoon',
  ]);
  const [hasUserChangedDate, setHasUserChangedDate] = useState(false);
  const [weekendBlocked, setWeekendBlocked] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const workdayOptions = useMemo(() => {
    const base = getDefaultAgendaDate();
    return Array.from({ length: 20 }, (_, index) => {
      const day = addWorkdays(base, index);
      return {
        value: toDateKey(day),
        label: formatWorkdayLabel(day),
      };
    });
  }, []);
  const dateMin = workdayOptions[0]?.value;
  const dateMax = workdayOptions[workdayOptions.length - 1]?.value;

  const boundedPeriods = useMemo(
    () =>
      resolveBoundedPeriods(availablePeriods, {
        lockedPeriod: initialSlot?.period,
        respectPeriodLock:
          Boolean(initialSlot) && !hasUserChangedDate && date === initialDate,
      }),
    [availablePeriods, date, hasUserChangedDate, initialDate, initialSlot],
  );

  const aggregatedBounds = useMemo(
    () => getAggregatedScheduleTimeBounds(date, boundedPeriods),
    [boundedPeriods, date],
  );

  const currentTimeBounds = useMemo(
    () => getTimeRangeBoundsForStartTime(startTime),
    [startTime],
  );

  const hasScheduleAvailability = aggregatedBounds.hasAvailability;
  const formBlocked = weekendBlocked;
  const selectedStudent = students.find((student) => student.id === studentId);
  const period = periodFromStartTime(startTime);
  const effectiveStartTime = makeupDraft?.startTime ?? startTime;
  const effectiveEndTime = makeupDraft?.endTime ?? endTime;
  const effectiveDuration = minutesBetween(
    effectiveStartTime,
    effectiveEndTime,
  );
  const timesLocked =
    Boolean(makeupDraft) || !hasScheduleAvailability || formBlocked;

  const startMinTime = aggregatedBounds.startMin;
  const startMaxTime = aggregatedBounds.startMax;

  useEffect(() => {
    void listStudents().then(setStudents);
  }, []);

  useEffect(() => {
    if (!date) {
      return;
    }

    let cancelled = false;

    void getAvailablePeriods(date).then((periods) => {
      if (cancelled) {
        return;
      }

      setAvailablePeriods(periods);

      const nextBoundedPeriods = resolveBoundedPeriods(periods, {
        lockedPeriod: initialSlot?.period,
        respectPeriodLock:
          Boolean(initialSlot) && !hasUserChangedDate && date === initialDate,
      });

      setStartTime((currentStart) => {
        const synced = syncScheduleTimes(
          date,
          nextBoundedPeriods,
          currentStart,
        );
        if (!synced) {
          setMakeupDraft(null);
          return currentStart;
        }

        setMakeupDraft(null);
        setEndTime(synced.endTime);
        return synced.startTime;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [date, hasUserChangedDate, initialDate, initialSlot]);

  const updateSuggestedAmount = (minutes: number, student: Student) => {
    setAmountInput(
      formatCurrencyInput(calculateExpectedAmount(minutes, student.hourlyRate)),
    );
  };

  const handleDateChange = (nextDate: string) => {
    setDateError(null);
    setWeekendBlocked(false);
    setError(null);
    setDate(nextDate);
    setHasUserChangedDate(nextDate !== initialDate);
    setMakeupDraft(null);
  };

  const handleWeekendAttempt = () => {
    setWeekendBlocked(true);
    setDateError(WEEKEND_MESSAGE);
    setError(null);
    setMakeupDraft(null);
  };

  const handleStudentChange = (nextStudentId: string) => {
    if (formBlocked) {
      return;
    }

    setStudentId(nextStudentId);
    setMakeupDraft(null);
    const student = students.find((item) => item.id === nextStudentId);
    if (student) {
      updateSuggestedAmount(effectiveDuration, student);
    }
  };

  const handleStartTimeChange = (nextStart: string) => {
    if (!hasScheduleAvailability) {
      return;
    }

    const changeBounds = resolveStartTimeChangeBounds(
      date,
      nextStart,
      aggregatedBounds,
    );

    const { startTime: clampedStart, endTime: nextEnd } = applyStartTimeChange(
      startTime,
      endTime,
      nextStart,
      changeBounds,
    );

    if (!isStartTimeAllowedForPeriods(clampedStart, boundedPeriods)) {
      return;
    }

    setStartTime(clampedStart);
    setEndTime(nextEnd);
    setMakeupDraft(null);

    if (selectedStudent) {
      updateSuggestedAmount(
        minutesBetween(clampedStart, nextEnd),
        selectedStudent,
      );
    }
  };

  const handleEndTimeChange = (nextEnd: string) => {
    if (!hasScheduleAvailability) {
      return;
    }

    const bounds = getTimeRangeBoundsForStartTime(startTime);
    const endMinTime = getEffectiveEndMinTime(startTime);
    const clampedEnd = clampTimeToBounds(nextEnd, endMinTime, bounds.endMax);
    setEndTime(clampedEnd);
    setMakeupDraft(null);

    if (selectedStudent) {
      updateSuggestedAmount(
        minutesBetween(startTime, clampedEnd),
        selectedStudent,
      );
    }
  };

  const handleSave = async () => {
    if (formBlocked || !isWeekday(new Date(`${date}T12:00:00`))) {
      setError(WEEKEND_MESSAGE);
      return;
    }

    if (!selectedStudent) {
      setError('Selecione um aluno.');
      return;
    }

    if (!hasScheduleAvailability) {
      setError(OCCUPIED_LABEL);
      return;
    }

    if (!boundedPeriods.includes(period)) {
      setError('O horário selecionado não está disponível nesta data.');
      return;
    }

    if (isMakeupOnly && !makeupDraft) {
      setError('É necessário vincular a reposição antes de salvar.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createClass({
        studentId: selectedStudent.id,
        date,
        period,
        startTime: effectiveStartTime,
        durationMinutes: effectiveDuration,
        expectedAmount: parseCurrencyInput(amountInput),
        isMakeupOnly,
        linkedAbsenceIds: makeupDraft?.absenceIds ?? [],
        hasManualAmountOverride:
          parseCurrencyInput(amountInput) !==
          calculateExpectedAmount(
            effectiveDuration,
            selectedStudent.hourlyRate,
          ),
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o agendamento.',
      );
    } finally {
      setSaving(false);
    }
  };

  const requiredMakeupMinutes =
    selectedStudent && isMakeupOnly && makeupDraft
      ? calculateRequiredMakeupMinutes(null, makeupDraft.absenceIds, true)
      : 0;

  return (
    <>
      <BottomSheet
        open
        tall
        title="Agendar Aula"
        onClose={onClose}
        footer={
          <Button
            className="w-full"
            onClick={() => void handleSave()}
            disabled={saving || !hasScheduleAvailability || formBlocked}
          >
            Salvar agendamento
          </Button>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex min-w-0 flex-col gap-2">
              <span className={fieldLabelClassName}>Data</span>
              <WorkdayDateInput
                value={date}
                min={dateMin}
                max={dateMax}
                onChange={handleDateChange}
                onWeekendAttempt={handleWeekendAttempt}
              />
              {dateError ? (
                <p className="text-xs text-status-danger">{dateError}</p>
              ) : null}
            </label>

            <div className="flex min-w-0 flex-col gap-2">
              <span className={fieldLabelClassName}>Horário</span>
              {hasScheduleAvailability && !formBlocked ? (
                <TimeRangeInput
                  startTime={effectiveStartTime}
                  endTime={effectiveEndTime}
                  startMinTime={startMinTime}
                  startMaxTime={startMaxTime}
                  endMaxTime={currentTimeBounds.endMax}
                  disabled={timesLocked}
                  onStartChange={handleStartTimeChange}
                  onEndChange={handleEndTimeChange}
                />
              ) : (
                <div
                  className={`${fieldControlClassName} flex h-12 items-center justify-center text-sm text-text-muted`}
                >
                  {formBlocked ? '—' : OCCUPIED_LABEL}
                </div>
              )}
            </div>
          </div>

          <fieldset
            disabled={formBlocked}
            className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0 disabled:opacity-60"
          >
            <label className="flex flex-col gap-2">
              <span className={fieldLabelClassName}>Aluno</span>
              <div className="relative">
                <select
                  value={studentId}
                  onChange={(event) => handleStudentChange(event.target.value)}
                  className={`${fieldControlClassName} appearance-none px-3 pr-10`}
                >
                  <option value="">Selecione...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
                <Icon
                  name="expand_more"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className={fieldLabelClassName}>Valor</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-text-muted">
                  R$
                </span>
                <input
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  className={`${fieldControlClassName} pl-10 pr-3 font-mono`}
                />
              </div>
              {selectedStudent ? (
                <span className="text-xs text-text-muted">
                  Sugerido:{' '}
                  {formatCurrency(
                    calculateExpectedAmount(
                      effectiveDuration,
                      selectedStudent.hourlyRate,
                    ),
                  )}
                </span>
              ) : null}
            </label>

            <div className="flex items-center justify-between border-t border-surface-variant/50 pt-2">
              <span className="font-medium text-text-main">
                Marcar como reposição
              </span>
              <button
                type="button"
                onClick={() => {
                  if (formBlocked) {
                    return;
                  }

                  setIsMakeupOnly((current) => !current);
                  setMakeupDraft(null);
                }}
                className={`flex h-6 w-12 items-center rounded-full px-1 transition-colors ${
                  isMakeupOnly ? 'bg-primary-container' : 'bg-surface-variant'
                }`}
                aria-pressed={isMakeupOnly}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isMakeupOnly ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isMakeupOnly ? (
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setLinkModalOpen(true)}
                  disabled={
                    !selectedStudent || !hasScheduleAvailability || formBlocked
                  }
                >
                  Vincular reposição
                </Button>
                {makeupDraft ? (
                  <p className="text-sm text-text-muted">
                    {makeupDraft.absenceIds.length} falta(s) vinculada(s).
                    Duração necessária: {requiredMakeupMinutes} min.
                  </p>
                ) : (
                  <p className="text-sm text-status-danger">
                    Vincule ao menos uma falta para continuar.
                  </p>
                )}
              </div>
            ) : null}
          </fieldset>

          {error ? <p className="text-sm text-status-danger">{error}</p> : null}
        </div>
      </BottomSheet>

      {selectedStudent ? (
        <LinkMakeupModal
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          isMakeupOnly
          initialStartTime={startTime}
          initialDurationMinutes={effectiveDuration}
          onConfirm={(result) => {
            setMakeupDraft(result);
            setLinkModalOpen(false);
            updateSuggestedAmount(
              minutesBetween(result.startTime, result.endTime),
              selectedStudent,
            );
          }}
        />
      ) : null}
    </>
  );
}
