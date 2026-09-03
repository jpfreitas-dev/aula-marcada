import {
  addWorkdays,
  getWeekStart,
  getWeekdayFromDateKey,
  toDateKey,
} from '@/utils/workday';

function toUtcWeekdayDate(cursor: Date): string {
  let next = new Date(cursor);

  while (true) {
    const weekday = getWeekdayFromDateKey(toDateKey(next));

    if (weekday >= 1 && weekday <= 5) {
      return toDateKey(next);
    }

    next = addWorkdays(next, 1);
  }
}

export function getFutureClassDate(workdaysAhead = 10): string {
  return toUtcWeekdayDate(addWorkdays(new Date(), workdaysAhead));
}

export function getPastClassDate(workdaysBehind = 10): string {
  return toUtcWeekdayDate(addWorkdays(new Date(), -workdaysBehind));
}

export function getFutureWeekdayDate(
  weekday: number,
  minWorkdaysAhead = 10,
): string {
  let cursor = addWorkdays(new Date(), minWorkdaysAhead);

  while (getWeekdayFromDateKey(toDateKey(cursor)) !== weekday) {
    cursor = addWorkdays(cursor, 1);
  }

  return toDateKey(cursor);
}

export function getPastWeekdayDate(
  weekday: number,
  minWorkdaysBehind = 10,
): string {
  let cursor = addWorkdays(new Date(), -minWorkdaysBehind);

  while (getWeekdayFromDateKey(toDateKey(cursor)) !== weekday) {
    cursor = addWorkdays(cursor, -1);
  }

  return toDateKey(cursor);
}

export function getWeekStartKeyForDate(dateKey: string): string {
  return toDateKey(getWeekStart(new Date(`${dateKey}T12:00:00`)));
}
