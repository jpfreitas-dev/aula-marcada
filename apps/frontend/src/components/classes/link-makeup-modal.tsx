import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import type { ClassSession } from '@/types';
import {
  calculateRequiredMakeupMinutes,
  getPendingAbsences,
  linkMakeup,
} from '@/services/class-service';
import { formatWorkdayLabel } from '@/utils/workday';
import {
  addMinutesToTime,
  formatHoursLabel,
  minutesBetween,
} from '@/utils/time';

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

  useEffect(() => {
    void getPendingAbsences(studentId).then(setAbsences);
  }, [studentId]);

  const requiredMinutes = useMemo(
    () =>
      calculateRequiredMakeupMinutes(
        targetClass ?? null,
        selectedIds,
        isMakeupOnly,
      ),
    [targetClass, selectedIds, isMakeupOnly],
  );

  const currentMinutes = minutesBetween(startTime, endTime);
  const missingMinutes = Math.max(requiredMinutes - currentMinutes, 0);

  const toggleAbsence = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      setError('Selecione ao menos uma falta.');
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
    <>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          Falta(s) do aluno(a){' '}
          <span className="font-semibold text-text-main">{studentName}</span>
        </p>

        {absences.length === 0 ? (
          <p className="rounded-lg bg-bg-subtle p-4 text-sm text-text-muted">
            Não há faltas pendentes de reposição para este aluno.
          </p>
        ) : (
          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
            {absences.map((absence) => {
              const selected = selectedIds.includes(absence.id);
              return (
                <button
                  key={absence.id}
                  type="button"
                  onClick={() => toggleAbsence(absence.id)}
                  className={`relative flex w-full items-center gap-3 overflow-hidden rounded-card border p-3 text-left shadow-sm transition-colors ${
                    selected
                      ? 'border-primary bg-primary-fixed/20'
                      : 'border-outline-variant/30 bg-white'
                  }`}
                >
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-status-danger" />
                  <div className="flex flex-1 flex-col gap-1 pl-2">
                    <span className="font-medium text-text-main">
                      {formatWorkdayLabel(new Date(`${absence.date}T12:00:00`))}
                    </span>
                    <span className="font-mono text-xs text-text-muted">
                      {absence.startTime} - {absence.endTime}
                    </span>
                    <span className="text-xs text-text-muted">
                      Pendente:{' '}
                      {formatHoursLabel(
                        absence.pendingMakeupMinutes ?? absence.durationMinutes,
                      )}
                    </span>
                  </div>
                  <Badge label="Não compareceu" variant="danger" />
                </button>
              );
            })}
          </div>
        )}

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
              Fim
            </span>
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="rounded-lg border border-outline-variant px-3 py-2 text-sm"
            />
          </label>
        </div>

        {missingMinutes > 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-status-warning">
            Necessário mais {formatHoursLabel(missingMinutes)} de aula.
          </p>
        ) : null}

        {error ? <p className="text-sm text-status-danger">{error}</p> : null}
      </div>

      <div className="mt-4">
        <Button
          className="w-full"
          disabled={saving || selectedIds.length === 0 || missingMinutes > 0}
          onClick={() => void handleConfirm()}
        >
          Confirmar reposição
        </Button>
      </div>
    </>
  );
}

export function LinkMakeupModal({
  open,
  onClose,
  studentId,
  studentName,
  targetClass,
  isMakeupOnly,
  initialStartTime,
  initialDurationMinutes,
  onConfirm,
}: LinkMakeupModalProps) {
  return (
    <BottomSheet open={open} tall title="Vincular reposição" onClose={onClose}>
      {open ? (
        <LinkMakeupForm
          key={`${studentId}-${targetClass?.id ?? 'schedule'}`}
          onClose={onClose}
          studentId={studentId}
          studentName={studentName}
          targetClass={targetClass}
          isMakeupOnly={isMakeupOnly}
          initialStartTime={initialStartTime}
          initialDurationMinutes={initialDurationMinutes}
          onConfirm={onConfirm}
        />
      ) : null}
    </BottomSheet>
  );
}
