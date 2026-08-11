import { useEffect, useState } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import type { ClassPeriod, ClassSession } from '@/types';
import { getAvailablePeriods, rescheduleClass } from '@/services/class-service';
import { addMinutesToTime } from '@/utils/time';
import {
  addWorkdays,
  formatWorkdayLabel,
  getDefaultAgendaDate,
  toDateKey,
} from '@/utils/workday';

type RescheduleClassModalProps = {
  open: boolean;
  onClose: () => void;
  session: ClassSession;
};

type RescheduleClassFormProps = {
  session: ClassSession;
  onClose: () => void;
};

function RescheduleClassForm({ session, onClose }: RescheduleClassFormProps) {
  const [date, setDate] = useState(session.date);
  const [period, setPeriod] = useState<ClassPeriod>(session.period);
  const [startTime, setStartTime] = useState(session.startTime);
  const [durationMinutes, setDurationMinutes] = useState(
    session.durationMinutes,
  );
  const [availablePeriods, setAvailablePeriods] = useState<ClassPeriod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const workdayOptions = Array.from({ length: 20 }, (_, index) => {
    const day = addWorkdays(getDefaultAgendaDate(), index);
    return {
      value: toDateKey(day),
      label: formatWorkdayLabel(day),
    };
  });

  useEffect(() => {
    void getAvailablePeriods(date, session.id).then(setAvailablePeriods);
  }, [date, session.id]);

  const handleSave = async () => {
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
    <>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Data
          </span>
          <select
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-lg border border-outline-variant px-3 py-2 text-sm"
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
            onChange={(event) => setPeriod(event.target.value as ClassPeriod)}
            className="rounded-lg border border-outline-variant px-3 py-2 text-sm"
          >
            {availablePeriods.map((option) => (
              <option key={option} value={option}>
                {option === 'morning' ? 'Manhã' : 'Tarde/noite'}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Início
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="rounded-lg border border-outline-variant px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Duração (min)
            </span>
            <input
              type="number"
              min={30}
              step={15}
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(Number(event.target.value))
              }
              className="rounded-lg border border-outline-variant px-3 py-2 text-sm"
            />
          </label>
        </div>

        <p className="font-mono text-sm text-text-muted">
          Novo horário: {startTime} -{' '}
          {addMinutesToTime(startTime, durationMinutes)}
        </p>

        {error ? <p className="text-sm text-status-danger">{error}</p> : null}
      </div>

      <div className="mt-4">
        <Button
          className="w-full"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          Salvar horário
        </Button>
      </div>
    </>
  );
}

export function RescheduleClassModal({
  open,
  onClose,
  session,
}: RescheduleClassModalProps) {
  return (
    <BottomSheet open={open} title="Alterar horário" onClose={onClose}>
      {open ? (
        <RescheduleClassForm
          key={session.id}
          session={session}
          onClose={onClose}
        />
      ) : null}
    </BottomSheet>
  );
}
