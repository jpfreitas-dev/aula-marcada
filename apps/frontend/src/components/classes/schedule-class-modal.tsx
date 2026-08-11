import { useMemo, useState } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { LinkMakeupModal } from '@/components/classes/link-makeup-modal';
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
  addMinutesToTime,
  defaultStartTimeForPeriod,
  minutesBetween,
} from '@/utils/time';
import {
  addWorkdays,
  formatWorkdayLabel,
  getDefaultAgendaDate,
  toDateKey,
} from '@/utils/workday';
import { useEffect } from 'react';

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

type ScheduleClassFormProps = {
  initialSlot?: ScheduleSlot;
  onClose: () => void;
};

function ScheduleClassForm({ initialSlot, onClose }: ScheduleClassFormProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(
    initialSlot?.date ?? toDateKey(getDefaultAgendaDate()),
  );
  const [period, setPeriod] = useState<ClassPeriod>(
    initialSlot?.period ?? 'morning',
  );
  const [studentId, setStudentId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
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

  const selectedStudent = students.find((student) => student.id === studentId);
  const startTime = makeupDraft?.startTime ?? getDefaultScheduleStart(period);
  const endTime =
    makeupDraft?.endTime ?? addMinutesToTime(startTime, durationMinutes);
  const effectiveDuration = makeupDraft
    ? minutesBetween(makeupDraft.startTime, makeupDraft.endTime)
    : durationMinutes;

  useEffect(() => {
    void listStudents().then(setStudents);
  }, []);

  useEffect(() => {
    if (!date) {
      return;
    }

    void getAvailablePeriods(date).then((periods) => {
      setAvailablePeriods(periods);
      if (!periods.includes(period) && periods[0]) {
        setPeriod(periods[0]);
      }
    });
  }, [date, period]);

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

  const handleDurationChange = (minutes: number) => {
    setDurationMinutes(minutes);
    if (selectedStudent) {
      updateSuggestedAmount(minutes, selectedStudent);
    }
  };

  const handleSave = async () => {
    if (!selectedStudent) {
      setError('Selecione um aluno.');
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
        startTime,
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
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Data
            </span>
            <select
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-lg border border-outline bg-white px-3 py-3 text-sm shadow-sm"
            >
              {workdayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Período
            </span>
            <select
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value as ClassPeriod);
                setMakeupDraft(null);
              }}
              className="rounded-lg border border-outline bg-white px-3 py-3 text-sm shadow-sm"
            >
              {availablePeriods.map((option) => (
                <option key={option} value={option}>
                  {option === 'morning' ? 'Manhã' : 'Tarde/noite'}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Horário
          </span>
          <div className="rounded-lg border border-outline bg-white px-3 py-3 text-center font-mono text-sm shadow-sm">
            {startTime} - {endTime}
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Aluno
          </span>
          <select
            value={studentId}
            onChange={(event) => handleStudentChange(event.target.value)}
            className="rounded-lg border border-outline bg-white px-3 py-3 text-sm shadow-sm"
          >
            <option value="">Selecione...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Duração (min)
          </span>
          <input
            type="number"
            min={30}
            step={15}
            value={effectiveDuration}
            disabled={Boolean(makeupDraft)}
            onChange={(event) =>
              handleDurationChange(Number(event.target.value))
            }
            className="rounded-lg border border-outline bg-white px-3 py-3 text-sm shadow-sm disabled:bg-bg-subtle"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Valor
          </span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-text-muted">
              R$
            </span>
            <input
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              className="w-full rounded-lg border border-outline bg-white py-3 pl-10 pr-3 font-mono text-sm shadow-sm"
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

      <div className="mt-4">
        <Button
          className="w-full"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          Salvar agendamento
        </Button>
      </div>

      {selectedStudent ? (
        <LinkMakeupModal
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          isMakeupOnly
          initialStartTime={defaultStartTimeForPeriod(period)}
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

export function ScheduleClassModal({
  open,
  onClose,
  initialSlot,
}: ScheduleClassModalProps) {
  const formKey = `${initialSlot?.date ?? 'default'}-${initialSlot?.period ?? 'morning'}`;

  return (
    <BottomSheet open={open} tall title="Agendar Aula" onClose={onClose}>
      {open ? (
        <ScheduleClassForm
          key={formKey}
          initialSlot={initialSlot}
          onClose={onClose}
        />
      ) : null}
    </BottomSheet>
  );
}
