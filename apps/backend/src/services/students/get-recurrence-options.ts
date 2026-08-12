import type {
  RecurrenceOptionsInput,
  RecurrenceOptionsResponse,
} from '@/types/student';
import {
  buildWeekdayOptions,
  getFirstAvailablePeriodForWeekday,
  getFirstAvailableWeekday,
} from '@/services/students/recurrence-availability';
import { loadRecurrenceAvailabilityContext } from '@/services/students/load-recurrence-availability-context';
import { createDefaultRecurrenceRow } from '@/services/students/recurrence-scheduler';

class GetRecurrenceOptions {
  async execute(
    input: RecurrenceOptionsInput,
  ): Promise<RecurrenceOptionsResponse> {
    const context = await loadRecurrenceAvailabilityContext.execute(
      input.studentId,
    );

    const weekdayData = buildWeekdayOptions(
      context,
      input.draftRecurrences,
      input.studentId,
      input.currentWeekday,
    );

    const defaultRow = weekdayData.hasAvailableWeekdays
      ? createDefaultRecurrenceRow(input.draftRecurrences, {
          getFirstAvailableWeekday: (draft) =>
            getFirstAvailableWeekday(context, draft, input.studentId),
          getFirstAvailablePeriod: (weekday, draft) =>
            getFirstAvailablePeriodForWeekday(
              context,
              weekday,
              draft,
              input.studentId,
            ),
        })
      : null;

    return {
      allWeekdays: weekdayData.allWeekdays.map((item) => ({
        value:
          item.value as RecurrenceOptionsResponse['allWeekdays'][number]['value'],
        label: item.label,
      })),
      weekdayOptions: weekdayData.weekdayOptions.map((item) => ({
        value:
          item.value as RecurrenceOptionsResponse['weekdayOptions'][number]['value'],
        label: item.label,
      })),
      defaultRow,
      hasAvailableWeekdays: weekdayData.hasAvailableWeekdays,
    };
  }
}

export const getRecurrenceOptions = new GetRecurrenceOptions();
