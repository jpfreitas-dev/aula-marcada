export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

export function getDefaultAgendaDate(reference = new Date()): Date {
  const date = new Date(reference);
  date.setHours(0, 0, 0, 0);

  const day = date.getDay();
  if (day === 6) {
    date.setDate(date.getDate() + 2);
  } else if (day === 0) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

export function addWorkdays(date: Date, amount: number): Date {
  const next = new Date(date);
  let remaining = Math.abs(amount);
  const direction = amount >= 0 ? 1 : -1;

  while (remaining > 0) {
    next.setDate(next.getDate() + direction);
    if (isWeekday(next)) {
      remaining -= 1;
    }
  }

  return next;
}

export function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

export function getWeekdayFromDateKey(dateKey: string): number {
  return dateFromDateKey(dateKey).getDay();
}

export function getWeekStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  while (start.getDay() !== 1) {
    start.setDate(start.getDate() - 1);
  }

  return start;
}

export function formatClassDateTime(
  dateKey: string,
  startTime: string,
): string {
  return `${dateKey}T${startTime}`;
}

export function getClassStartTimestampFromKey(
  dateKey: string,
  startTime: string,
): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

export function getWorkdaysOfWeek(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });
}
