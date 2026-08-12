import {
  dateFromDateKey,
  getWeekStart,
  getWorkdaysOfWeek,
  toDateKey,
} from '@/utils/workday';

import type { FinancialGranularity } from '@/types/financial';

export type PeriodBucket = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
};

export type FinancialPeriodRange = {
  startDate: string;
  endDate: string;
  buckets: PeriodBucket[];
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function isDateKeyInRange(
  dateKey: string,
  startDate: string,
  endDate: string,
): boolean {
  return dateKey >= startDate && dateKey <= endDate;
}

function buildMonthWeekBuckets(
  startDate: string,
  endDate: string,
): PeriodBucket[] {
  const firstDay = dateFromDateKey(startDate);
  const lastDay = dateFromDateKey(endDate);
  const buckets: PeriodBucket[] = [];
  let weekNumber = 1;
  let cursor = getWeekStart(firstDay);

  while (cursor <= lastDay && weekNumber <= 5) {
    const workdays = getWorkdaysOfWeek(cursor).filter((day) => {
      const dateKey = toDateKey(day);
      return isDateKeyInRange(dateKey, startDate, endDate);
    });

    if (workdays.length > 0) {
      buckets.push({
        key: `week-${weekNumber}`,
        label: `Sem ${weekNumber}`,
        startDate: toDateKey(workdays[0]),
        endDate: toDateKey(workdays[workdays.length - 1]),
      });
      weekNumber += 1;
    }

    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
  }

  return buckets;
}

export function resolveFinancialPeriod(
  granularity: FinancialGranularity,
  referenceDateKey: string,
): FinancialPeriodRange {
  const referenceDate = dateFromDateKey(referenceDateKey);

  if (granularity === 'week') {
    const weekStart = getWeekStart(referenceDate);
    const workdays = getWorkdaysOfWeek(weekStart);

    return {
      startDate: toDateKey(workdays[0]),
      endDate: toDateKey(workdays[workdays.length - 1]),
      buckets: workdays.map((day, index) => ({
        key: `day-${index}`,
        label: WEEKDAY_LABELS[day.getDay()],
        startDate: toDateKey(day),
        endDate: toDateKey(day),
      })),
    };
  }

  if (granularity === 'month') {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = toDateKey(firstDay);
    const endDate = toDateKey(lastDay);

    return {
      startDate,
      endDate,
      buckets: buildMonthWeekBuckets(startDate, endDate),
    };
  }

  const year = referenceDate.getFullYear();

  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    buckets: Array.from({ length: 12 }, (_, month) => {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      return {
        key: `month-${month}`,
        label: MONTH_LABELS[month],
        startDate: toDateKey(firstDay),
        endDate: toDateKey(lastDay),
      };
    }),
  };
}

export function findBucketForDateKey(
  buckets: PeriodBucket[],
  dateKey: string,
): PeriodBucket | undefined {
  return buckets.find((bucket) =>
    isDateKeyInRange(dateKey, bucket.startDate, bucket.endDate),
  );
}
