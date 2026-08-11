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
  getDefaultScheduleStart,
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
  AFTERNOON_PERIOD_END,
  addMinutesToTime,
  applyStartTimeChange,
  DEFAULT_CLASS_DURATION_MINUTES,
  defaultStartTimeForPeriod,
  EARLY_MORNING_CUTOFF,
  getMaxStartTimeForEndLimit,
  getStartTimeBounds,
  minutesBetween,
  periodFromStartTime,
} from '@/utils/time';
import {
  addWorkdays,
  formatWorkdayLabel,
  getDefaultAgendaDate,
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

export function ScheduleClassModal({
  open,
  onClose,
  initialSlot,
}: ScheduleClassModalProps) {
  if (!open) {
    return null;
  }

  const formKey = `${initialSlot?.date ?? 'default'}-${initialSlot?.period ?? 'morning'}`;

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
  const initialPeriod = initialSlot?.period ?? 'morning';
  const initialStart = getDefaultScheduleStart(initialPeriod);

  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(
    initialSlot?.date ?? toDateKey(getDefaultAgendaDate()),
  );
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(
    addMinutesToTime(initialStart, DEFAULT_CLASS_DURATION_MINUTES),
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

  const selectedStudent = students.find((student) => student.id === studentId);
  const period = periodFromStartTime(startTime);
  const morningPeriodOccupied = !availablePeriods.includes('morning');
  const effectiveStartTime = makeupDraft?.startTime ?? startTime;
  const effectiveEndTime = makeupDraft?.endTime ?? endTime;
  const effectiveDuration = minutesBetween(
    effectiveStartTime,
    effectiveEndTime,
  );
  const startTimeBounds = getStartTimeBounds(availablePeriods);
  const startMaxTime = getMaxStartTimeForEndLimit(
    startTimeBounds.max,
    AFTERNOON_PERIOD_END,
  );
  const timesLocked = Boolean(makeupDraft);

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

      if (periods.length === 0) {
        return;
      }

      setStartTime((currentStart) => {
        const currentPeriod = periodFromStartTime(currentStart);
        if (periods.includes(currentPeriod)) {
          return currentStart;
        }

        setMakeupDraft(null);
        const nextStart = defaultStartTimeForPeriod(periods[0]);
        setEndTime(addMinutesToTime(nextStart, DEFAULT_CLASS_DURATION_MINUTES));
        return nextStart;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [date]);

  const updateSuggestedAmount = (minutes: number, student: Student) => {
    setAmountInput(
      formatCurrencyInput(calculateExpectedAmount(minutes, student.hourlyRate)),
    );
  };

  const handleStudentChange = (nextStudentId: string) => {
    setStudentId(nextStudentId);
    setMakeupDraft(null);
    const student = students.find((item) => item.id === nextStudentId);
    if (student) {
      updateSuggestedAmount(effectiveDuration, student);
    }
  };

  const handleStartTimeChange = (nextStart: string) => {
    const { startTime: clampedStart, endTime: nextEnd } = applyStartTimeChange(
      startTime,
      endTime,
      nextStart,
      {
        startMin: startTimeBounds.min,
        startMax: startMaxTime,
        endMax: AFTERNOON_PERIOD_END,
        endFloor: morningPeriodOccupied ? EARLY_MORNING_CUTOFF : undefined,
      },
    );

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
    setEndTime(nextEnd);
    setMakeupDraft(null);

    if (selectedStudent) {
      updateSuggestedAmount(
        minutesBetween(startTime, nextEnd),
        selectedStudent,
      );
    }
  };

  const handleSave = async () => {
    if (!selectedStudent) {
      setError('Selecione um aluno.');
      return;
    }

    if (availablePeriods.length === 0) {
      setError('Não há períodos disponíveis nesta data.');
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
            disabled={saving}
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
                onChange={(nextDate) => {
                  setDate(nextDate);
                  setMakeupDraft(null);
                }}
              />
            </label>

            <div className="flex min-w-0 flex-col gap-2">
              <span className={fieldLabelClassName}>Horário</span>
              <TimeRangeInput
                startTime={effectiveStartTime}
                endTime={effectiveEndTime}
                startMinTime={startTimeBounds.min}
                startMaxTime={startMaxTime}
                endMaxTime={AFTERNOON_PERIOD_END}
                endFloorTime={
                  morningPeriodOccupied ? EARLY_MORNING_CUTOFF : undefined
                }
                disabled={timesLocked}
                onStartChange={handleStartTimeChange}
                onEndChange={handleEndTimeChange}
              />
            </div>
          </div>

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
                disabled={!selectedStudent}
              >
                Vincular reposição
              </Button>
              {makeupDraft ? (
                <p className="text-sm text-text-muted">
                  {makeupDraft.absenceIds.length} falta(s) vinculada(s). Duração
                  necessária: {requiredMakeupMinutes} min.
                </p>
              ) : (
                <p className="text-sm text-status-danger">
                  Vincule ao menos uma falta para continuar.
                </p>
              )}
            </div>
          ) : null}

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
