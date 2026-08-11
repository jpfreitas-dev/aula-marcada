import { useMemo, useState } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  StudentRecurrenceRow,
  type RecurrenceRowValue,
} from '@/components/students/student-recurrence-row';
import {
  createDefaultRecurrenceRow,
  createStudent,
  getWeekdayOptionsForRow,
  hasAvailableRecurrenceWeekdays,
} from '@/services/student-service';
import {
  formatCurrencyInputFromRaw,
  parseCurrencyInput,
} from '@/utils/class-value';
import { formatPhoneInput } from '@/utils/phone';
import {
  AFTERNOON_PERIOD_END,
  applyStartTimeChange,
  getMaxStartTimeForEndLimit,
  getStartTimeBounds,
  MIN_CLASS_DURATION_MINUTES,
} from '@/utils/time';

type CreateStudentModalProps = {
  open: boolean;
  onClose: () => void;
};

type RecurrenceRow = RecurrenceRowValue;

const modalLabelClassName = 'mb-1 ml-1 block text-sm text-text-muted';
const modalFieldClassName =
  'w-full rounded-lg border border-purple-100 bg-white px-3 py-2.5 text-sm text-text-main shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const recurrenceTimeBounds = getStartTimeBounds(['morning', 'afternoon']);
const recurrenceStartMaxTime = getMaxStartTimeForEndLimit(
  recurrenceTimeBounds.max,
  AFTERNOON_PERIOD_END,
);

function createRecurrenceRow(
  existingRows: RecurrenceRow[] = [],
): RecurrenceRow {
  const defaults = createDefaultRecurrenceRow(
    existingRows.map(({ weekday, startTime, endTime }) => ({
      weekday,
      startTime,
      endTime,
    })),
  );

  return {
    id: crypto.randomUUID(),
    ...defaults,
  };
}

function toRecurrenceInput(row: RecurrenceRow) {
  return {
    weekday: row.weekday,
    startTime: row.startTime,
    endTime: row.endTime,
  };
}

function normalizeRecurrenceWeekdays(rows: RecurrenceRow[]): RecurrenceRow[] {
  return rows.map((row) => {
    const otherRows = rows
      .filter((item) => item.id !== row.id)
      .map(toRecurrenceInput);
    const options = getWeekdayOptionsForRow(otherRows, row.weekday);
    const isCurrentWeekdayAvailable = options.some(
      (option) => option.value === row.weekday,
    );

    if (isCurrentWeekdayAvailable || options.length === 0) {
      return row;
    }

    return {
      ...row,
      weekday: options[0].value,
    };
  });
}

export function CreateStudentModal({ open, onClose }: CreateStudentModalProps) {
  if (!open) {
    return null;
  }

  return <CreateStudentForm key="create-student" onClose={onClose} />;
}

function CreateStudentForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRateInput, setHourlyRateInput] = useState('50,00');
  const [recurrences, setRecurrences] = useState<RecurrenceRow[]>([
    createRecurrenceRow(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canAddRecurrence = useMemo(
    () => hasAvailableRecurrenceWeekdays(recurrences.map(toRecurrenceInput)),
    [recurrences],
  );

  const updateRecurrences = (
    updater: (current: RecurrenceRow[]) => RecurrenceRow[],
  ) => {
    setError(null);
    setRecurrences((current) => normalizeRecurrenceWeekdays(updater(current)));
  };

  const updateRecurrence = (
    id: string,
    patch: Partial<Omit<RecurrenceRow, 'id'>>,
  ) => {
    updateRecurrences((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const handleRecurrenceStartChange = (id: string, nextStart: string) => {
    updateRecurrences((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }

        const { startTime, endTime } = applyStartTimeChange(
          row.startTime,
          row.endTime,
          nextStart,
          {
            startMin: recurrenceTimeBounds.min,
            startMax: recurrenceStartMaxTime,
            endMax: AFTERNOON_PERIOD_END,
            minDurationMinutes: MIN_CLASS_DURATION_MINUTES,
          },
        );

        return { ...row, startTime, endTime };
      }),
    );
  };

  const handleRecurrenceEndChange = (id: string, nextEnd: string) => {
    updateRecurrence(id, { endTime: nextEnd });
  };

  const removeRecurrence = (id: string) => {
    updateRecurrences((current) => current.filter((row) => row.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await createStudent({
        name,
        guardianName,
        phone,
        hourlyRate: parseCurrencyInput(hourlyRateInput),
        recurrences: recurrences.map(toRecurrenceInput),
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível cadastrar o aluno.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      open
      tall
      title="Novo Aluno"
      onClose={onClose}
      footer={
        <Button
          className="w-full gap-2"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          <Icon name="check" className="text-xl" />
          Cadastrar Aluno
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <label className="flex flex-col">
            <span className={modalLabelClassName}>Nome do Aluno</span>
            <input
              value={name}
              onChange={(event) => {
                setError(null);
                setName(event.target.value);
              }}
              placeholder="Ex: Maria Joaquina"
              className={modalFieldClassName}
            />
          </label>

          <label className="flex flex-col">
            <span className={modalLabelClassName}>Nome do Responsável</span>
            <input
              value={guardianName}
              onChange={(event) => {
                setError(null);
                setGuardianName(event.target.value);
              }}
              placeholder="Ex: Ana Souza"
              className={modalFieldClassName}
            />
          </label>

          <label className="flex flex-col">
            <span className={modalLabelClassName}>Telefone do Responsável</span>
            <input
              value={phone}
              onChange={(event) => {
                setError(null);
                setPhone(formatPhoneInput(event.target.value));
              }}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              className={`${modalFieldClassName} font-mono`}
            />
          </label>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-purple-100 bg-bg-subtle p-4">
          <div className="flex flex-col gap-2">
            <span className={modalLabelClassName}>Aulas recorrentes</span>

            {recurrences.length > 0 ? (
              <div className="flex flex-col gap-2">
                {recurrences.map((row) => {
                  const otherRows = recurrences
                    .filter((item) => item.id !== row.id)
                    .map(toRecurrenceInput);

                  return (
                    <StudentRecurrenceRow
                      key={row.id}
                      row={row}
                      weekdayOptions={getWeekdayOptionsForRow(
                        otherRows,
                        row.weekday,
                      )}
                      startMinTime={recurrenceTimeBounds.min}
                      startMaxTime={recurrenceStartMaxTime}
                      fieldClassName={modalFieldClassName}
                      onWeekdayChange={(weekday) =>
                        updateRecurrence(row.id, { weekday })
                      }
                      onStartChange={(value) =>
                        handleRecurrenceStartChange(row.id, value)
                      }
                      onEndChange={(value) =>
                        handleRecurrenceEndChange(row.id, value)
                      }
                      onRemove={() => removeRecurrence(row.id)}
                    />
                  );
                })}
              </div>
            ) : null}

            {canAddRecurrence ? (
              <button
                type="button"
                onClick={() =>
                  updateRecurrences((current) => [
                    ...current,
                    createRecurrenceRow(current),
                  ])
                }
                className="ml-1 flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-purple-900"
              >
                <Icon name="add_circle" className="text-base" />
                Adicionar outra aula
              </button>
            ) : null}
          </div>

          <label className="flex flex-col">
            <span className={modalLabelClassName}>Valor por Aula (R$)</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-text-muted">
                R$
              </span>
              <input
                inputMode="numeric"
                value={hourlyRateInput}
                onChange={(event) =>
                  setHourlyRateInput(
                    formatCurrencyInputFromRaw(event.target.value),
                  )
                }
                className={`${modalFieldClassName} pl-10 font-mono`}
              />
            </div>
          </label>
        </section>

        {error ? <p className="text-sm text-status-danger">{error}</p> : null}
      </div>
    </BottomSheet>
  );
}
