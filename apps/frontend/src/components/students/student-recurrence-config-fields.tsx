import { useMemo } from 'react';

import {
  StudentRecurrenceRow,
  type RecurrenceRowValue,
} from '@/components/students/student-recurrence-row';
import { Icon } from '@/components/ui/icon';
import {
  createDefaultRecurrenceRow,
  getWeekdayOptionsForRow,
  hasAvailableRecurrenceWeekdays,
} from '@/services/student-service';
import { formatCurrencyInputFromRaw } from '@/utils/class-value';
import {
  AFTERNOON_PERIOD_END,
  applyStartTimeChange,
  getMaxStartTimeForEndLimit,
  getStartTimeBounds,
  MIN_CLASS_DURATION_MINUTES,
} from '@/utils/time';

export type { RecurrenceRowValue };

export const studentConfigLabelClassName =
  'mb-1 ml-1 block text-sm text-text-muted';

export const studentConfigFieldClassName =
  'w-full rounded-lg border border-purple-100 bg-white px-3 py-2.5 text-sm text-text-main shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const recurrenceTimeBounds = getStartTimeBounds(['morning', 'afternoon']);
const recurrenceStartMaxTime = getMaxStartTimeForEndLimit(
  recurrenceTimeBounds.max,
  AFTERNOON_PERIOD_END,
);

function toRecurrenceInput(row: RecurrenceRowValue) {
  return {
    weekday: row.weekday,
    startTime: row.startTime,
    endTime: row.endTime,
  };
}

export function createRecurrenceRow(
  existingRows: RecurrenceRowValue[] = [],
  excludeStudentId?: string,
): RecurrenceRowValue {
  const defaults = createDefaultRecurrenceRow(
    existingRows.map(toRecurrenceInput),
    excludeStudentId,
  );

  return {
    id: crypto.randomUUID(),
    ...defaults,
  };
}

export function normalizeRecurrenceWeekdays(
  rows: RecurrenceRowValue[],
  excludeStudentId?: string,
): RecurrenceRowValue[] {
  return rows.map((row) => {
    const otherRows = rows
      .filter((item) => item.id !== row.id)
      .map(toRecurrenceInput);
    const options = getWeekdayOptionsForRow(
      otherRows,
      row.weekday,
      excludeStudentId,
    );
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
  return rows.map(toRecurrenceInput);
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
  const canAddRecurrence = useMemo(
    () =>
      hasAvailableRecurrenceWeekdays(
        recurrences.map(toRecurrenceInput),
        excludeStudentId,
      ),
    [excludeStudentId, recurrences],
  );

  const updateRecurrences = (
    updater: (current: RecurrenceRowValue[]) => RecurrenceRowValue[],
  ) => {
    onRecurrencesChange(
      normalizeRecurrenceWeekdays(updater(recurrences), excludeStudentId),
    );
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className={studentConfigLabelClassName}>Aulas recorrentes</span>

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
                    excludeStudentId,
                  )}
                  startMinTime={recurrenceTimeBounds.min}
                  startMaxTime={recurrenceStartMaxTime}
                  fieldClassName={studentConfigFieldClassName}
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
                createRecurrenceRow(current, excludeStudentId),
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
        <span className={studentConfigLabelClassName}>Valor por Aula (R$)</span>
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
