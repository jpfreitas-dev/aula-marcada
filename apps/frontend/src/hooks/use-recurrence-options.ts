import { useEffect, useState } from 'react';

import type { RecurrenceRowValue } from '@/components/students/student-recurrence-row';
import {
  fetchRecurrenceOptions,
  toRecurrenceInputs,
} from '@/services/student-service';
import type { CreateStudentRecurrenceInput, WeekdayOption } from '@/types';

type UseRecurrenceOptionsResult = {
  optionsByRowId: Record<string, WeekdayOption[]>;
  hasAvailableWeekdays: boolean;
  defaultRow: Pick<
    CreateStudentRecurrenceInput,
    'weekday' | 'startTime' | 'endTime'
  > | null;
  loading: boolean;
};

const EMPTY_RESULT: UseRecurrenceOptionsResult = {
  optionsByRowId: {},
  hasAvailableWeekdays: false,
  defaultRow: null,
  loading: false,
};

export function useRecurrenceOptions(
  recurrences: RecurrenceRowValue[],
  excludeStudentId?: string,
): UseRecurrenceOptionsResult {
  const [result, setResult] =
    useState<UseRecurrenceOptionsResult>(EMPTY_RESULT);

  useEffect(() => {
    let cancelled = false;

    const draftRecurrences = toRecurrenceInputs(recurrences);

    const baseRequest = fetchRecurrenceOptions({
      studentId: excludeStudentId,
      draftRecurrences,
    });

    const rowRequests = recurrences.map((row) => {
      const otherRows = recurrences
        .filter((item) => item.id !== row.id)
        .map((item) => ({
          weekday: item.weekday,
          startTime: item.startTime,
          endTime: item.endTime,
        }));

      return fetchRecurrenceOptions({
        studentId: excludeStudentId,
        draftRecurrences: otherRows,
        currentWeekday: row.weekday,
      }).then((options) => ({
        rowId: row.id,
        weekdayOptions: options.weekdayOptions,
      }));
    });

    void Promise.all([baseRequest, ...rowRequests])
      .then(([baseOptions, ...rowOptions]) => {
        if (cancelled) {
          return;
        }

        setResult({
          optionsByRowId: Object.fromEntries(
            rowOptions.map((item) => [item.rowId, item.weekdayOptions]),
          ),
          hasAvailableWeekdays: baseOptions.hasAvailableWeekdays,
          defaultRow: baseOptions.defaultRow,
          loading: false,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({
            optionsByRowId: {},
            hasAvailableWeekdays: false,
            defaultRow: null,
            loading: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [excludeStudentId, recurrences]);

  return result;
}
