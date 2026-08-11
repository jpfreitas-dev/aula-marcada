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

export function formatRelativeNextClass(dateIso?: string): string {
  if (!dateIso) {
    return 'Sem aula agendada';
  }

  const date = new Date(dateIso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return 'Hoje';
  }

  if (diffDays === 1) {
    return 'Amanhã';
  }

  if (diffDays > 1 && diffDays <= 7) {
    return `Em ${diffDays} dias`;
  }

  return formatWorkdayLabel(date);
}

export function getStudentFinancialLabel(
  status: 'up_to_date' | 'pending' | 'partial' | 'advance',
): string {
  switch (status) {
    case 'up_to_date':
      return 'Em dia';
    case 'pending':
      return 'Pendente';
    case 'partial':
      return 'Parcial';
    case 'advance':
      return 'Saldo adiantado';
  }
}
