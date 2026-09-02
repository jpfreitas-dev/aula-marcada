import {
  dateFromDateKey,
  getWeekStart,
  getWorkdaysOfWeek,
  toDateKey,
} from '@/utils/workday';

import type { FinancialGranularity } from '@/types/financial';

function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = dateFromDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

function mondayDateKeyOf(dateKey: string): string {
  const date = dateFromDateKey(dateKey);
  const weekday = date.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDaysToDateKey(dateKey, offset);
}

function monthDateBounds(
  year: number,
  month: number,
): {
  startDate: string;
  endDate: string;
} {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    startDate: `${year}-${padDatePart(month)}-01`,
    endDate: `${year}-${padDatePart(month)}-${padDatePart(lastDay)}`,
  };
}

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
  const buckets: PeriodBucket[] = [];
  let weekNumber = 0;
  let mondayKey = mondayDateKeyOf(startDate);

  while (mondayKey <= endDate) {
    const workdays = [0, 1, 2, 3, 4]
      .map((offset) => addDaysToDateKey(mondayKey, offset))
      .filter((dateKey) => isDateKeyInRange(dateKey, startDate, endDate));

    if (workdays.length > 0) {
      weekNumber += 1;
      buckets.push({
        key: `week-${weekNumber}`,
        label: `Sem ${weekNumber}`,
        startDate: workdays[0],
        endDate: workdays[workdays.length - 1],
      });
    }

    mondayKey = addDaysToDateKey(mondayKey, 7);
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
    const [year, month] = referenceDateKey.split('-').map(Number);
    const { startDate, endDate } = monthDateBounds(year, month);

    return {
      startDate,
      endDate,
      buckets: buildMonthWeekBuckets(startDate, endDate),
    };
  }

  const year = Number(referenceDateKey.slice(0, 4));

  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    buckets: Array.from({ length: 12 }, (_, monthIndex) => {
      const { startDate, endDate } = monthDateBounds(year, monthIndex + 1);

      return {
        key: `month-${monthIndex}`,
        label: MONTH_LABELS[monthIndex],
        startDate,
        endDate,
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
