import { useEffect } from 'react';

import {
  StudentRecurrenceRow,
  type RecurrenceRowValue,
} from '@/components/students/student-recurrence-row';
import { Icon } from '@/components/ui/icon';
import { useRecurrenceOptions } from '@/hooks/use-recurrence-options';
import { toRecurrenceInputs } from '@/services/student-service';
import { formatCurrencyInputFromRaw } from '@/utils/class-value';
import {
  applyStartTimeChange,
  getRecurrenceTimeRangeBounds,
  MIN_CLASS_DURATION_MINUTES,
} from '@/utils/time';

export type { RecurrenceRowValue };

export const studentConfigLabelClassName =
  'mb-1 ml-1 block text-sm text-text-muted';

export const studentConfigFieldClassName =
  'w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm text-text-main shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

/** Recurrence row wrapper — no focus ring (focus lives on inner controls). */
export const studentConfigRowClassName =
  'w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2.5 text-sm text-text-main shadow-sm';

function createRecurrenceRow(
  defaultRow: Pick<
    RecurrenceRowValue,
    'weekday' | 'startTime' | 'endTime'
  > | null,
): RecurrenceRowValue {
  const defaults = defaultRow ?? {
    weekday: 1,
    startTime: '14:00',
    endTime: '15:00',
  };

  return {
    id: crypto.randomUUID(),
    ...defaults,
  };
}

function normalizeRecurrenceWeekdays(
  rows: RecurrenceRowValue[],
  optionsByRowId: Record<
    string,
    Array<{ value: RecurrenceRowValue['weekday']; label: string }>
  >,
): RecurrenceRowValue[] {
  return rows.map((row) => {
    const options = optionsByRowId[row.id] ?? [];
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

export function toCreateRecurrenceInputs(rows: RecurrenceRowValue[]) {
  return toRecurrenceInputs(rows);
}

type StudentRecurrenceConfigFieldsProps = {
  hourlyRateInput: string;
  onHourlyRateChange: (value: string) => void;
  recurrences: RecurrenceRowValue[];
  onRecurrencesChange: (rows: RecurrenceRowValue[]) => void;
  excludeStudentId?: string;
};

export function StudentRecurrenceConfigFields({
  hourlyRateInput,
  onHourlyRateChange,
  recurrences,
  onRecurrencesChange,
  excludeStudentId,
}: StudentRecurrenceConfigFieldsProps) {
  const { optionsByRowId, hasAvailableWeekdays, defaultRow, loading } =
    useRecurrenceOptions(recurrences, excludeStudentId);

  useEffect(() => {
    if (loading) {
      return;
    }

    const normalized = normalizeRecurrenceWeekdays(recurrences, optionsByRowId);
    const hasChanges = normalized.some(
      (row, index) => row.weekday !== recurrences[index]?.weekday,
    );

    if (hasChanges) {
      onRecurrencesChange(normalized);
    }
  }, [loading, optionsByRowId, onRecurrencesChange, recurrences]);

  const updateRecurrences = (
    updater: (current: RecurrenceRowValue[]) => RecurrenceRowValue[],
  ) => {
    onRecurrencesChange(updater(recurrences));
  };

  const updateRecurrence = (
    id: string,
    patch: Partial<Omit<RecurrenceRowValue, 'id'>>,
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

        const bounds = getRecurrenceTimeRangeBounds(nextStart);
        const { startTime, endTime } = applyStartTimeChange(
          row.startTime,
          row.endTime,
          nextStart,
          {
            startMin: bounds.startMin,
            startMax: bounds.startMax,
            endMax: bounds.endMax,
            minDurationMinutes: MIN_CLASS_DURATION_MINUTES,
          },
        );

        return { ...row, startTime, endTime };
      }),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className={studentConfigLabelClassName}>Aulas recorrentes</span>

        {recurrences.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recurrences.map((row) => (
              <StudentRecurrenceRow
                key={row.id}
                row={row}
                weekdayOptions={optionsByRowId[row.id] ?? []}
                fieldClassName={studentConfigRowClassName}
                onWeekdayChange={(weekday) =>
                  updateRecurrence(row.id, { weekday })
                }
                onStartChange={(value) =>
                  handleRecurrenceStartChange(row.id, value)
                }
                onEndChange={(value) =>
                  updateRecurrence(row.id, { endTime: value })
                }
                onRemove={() =>
                  updateRecurrences((current) =>
                    current.filter((item) => item.id !== row.id),
                  )
                }
              />
            ))}
          </div>
        ) : null}

        {hasAvailableWeekdays ? (
          <button
            type="button"
            onClick={() =>
              updateRecurrences((current) => [
                ...current,
                createRecurrenceRow(defaultRow),
              ])
            }
            className="ml-1 flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-purple-900"
          >
            <Icon name="add_circle" className="text-base" />
            {recurrences.length === 0
              ? 'Adicionar aula'
              : 'Adicionar outra aula'}
          </button>
        ) : null}
      </div>

      <label className="flex flex-col">
        <span className={studentConfigLabelClassName}>Valor por hora (R$)</span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-text-muted">
            R$
          </span>
          <input
            inputMode="numeric"
            value={hourlyRateInput}
            onChange={(event) =>
              onHourlyRateChange(formatCurrencyInputFromRaw(event.target.value))
            }
            className={`${studentConfigFieldClassName} pl-10 font-mono`}
          />
        </div>
      </label>
    </div>
  );
}
