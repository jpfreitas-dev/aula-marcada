const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;

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

export function formatWorkdayLabel(date: Date): string {
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${weekday}, ${day}/${month}/${year}`;
}

export function formatShortDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = (date.getFullYear() % 100).toString().padStart(2, '0');

  return `${day}/${month}/${year}`;
}

export function getWeekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()];
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  while (start.getDay() !== 1) {
    start.setDate(start.getDate() - 1);
  }

  return start;
}

export function getWorkdaysOfWeek(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });
}

export const AD_HOC_SCHEDULE_LOOKBACK_MONTHS = 6;
export const AD_HOC_SCHEDULE_HORIZON_MONTHS = 3;

export function getAdHocScheduleDateBounds(reference = new Date()): {
  dateMin: string;
  dateMax: string;
} {
  const minDate = new Date(reference);
  minDate.setMonth(minDate.getMonth() - AD_HOC_SCHEDULE_LOOKBACK_MONTHS);

  const maxDate = getDefaultAgendaDate(reference);
  maxDate.setMonth(maxDate.getMonth() + AD_HOC_SCHEDULE_HORIZON_MONTHS);

  return {
    dateMin: toDateKey(minDate),
    dateMax: toDateKey(maxDate),
  };
}

export function formatWeekRange(weekStart: Date): string {
  const workdays = getWorkdaysOfWeek(weekStart);
  const firstDay = workdays[0];
  const lastDay = workdays[workdays.length - 1];

  return `${formatShortDate(firstDay)} - ${formatShortDate(lastDay)}`;
}

export function formatRelativeNextClass(dateTimeLocal?: string): string {
  if (!dateTimeLocal) {
    return 'Sem aulas agendadas';
  }

  const [dateKey, timePart = '00:00'] = dateTimeLocal.split('T');
  const time = timePart.slice(0, 5);
  const [year, month, day] = dateKey.split('-').map(Number);
  const classDay = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  classDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (classDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return `Hoje, ${time}`;
  }

  if (diffDays === 1) {
    return `Amanhã, ${time}`;
  }

  if (diffDays === 2) {
    return `Depois de amanhã, ${time}`;
  }

  if (diffDays > 2 && diffDays <= 6) {
    return `${getWeekdayLabel(classDay)}, ${time}`;
  }

  return `${formatWorkdayLabel(classDay)}, ${time}`;
}
