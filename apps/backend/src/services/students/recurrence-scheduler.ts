import {
  AttendanceStatus,
  ClassPeriod,
  type Class,
  type StudentRecurrence,
} from '../../../generated/prisma/client';
import type { CreateStudentRecurrenceInput } from '@/types/student';
import { calculateExpectedAmount } from '@/utils/class-value';
import { decimalToNumber } from '@/utils/money';
import {
  addWorkdays,
  dateFromDateKey,
  getDefaultAgendaDate,
  getWeekdayFromDateKey,
  toDateKey,
} from '@/utils/workday';
import {
  DEFAULT_CLASS_DURATION_MINUTES,
  addMinutesToTime,
  defaultStartTimeForPeriod,
  minutesBetween,
  periodFromStartTime,
} from '@/utils/time';

export const RECURRENCE_GENERATION_WORKDAYS = 20;

export const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
};

export const ALL_WEEKDAYS = [1, 2, 3, 4, 5] as const;
export const ALL_PERIODS: Array<'morning' | 'afternoon'> = [
  'morning',
  'afternoon',
];

export function periodToPrisma(period: 'morning' | 'afternoon'): ClassPeriod {
  return period === 'morning' ? ClassPeriod.MORNING : ClassPeriod.AFTERNOON;
}

export function periodFromPrisma(period: ClassPeriod): 'morning' | 'afternoon' {
  return period === ClassPeriod.MORNING ? 'morning' : 'afternoon';
}

export function getRecurrenceDates(weekday: number): string[] {
  const base = getDefaultAgendaDate();
  const dates: string[] = [];

  for (let index = 0; index < RECURRENCE_GENERATION_WORKDAYS; index += 1) {
    const date = addWorkdays(base, index);
    if (date.getDay() === weekday) {
      dates.push(toDateKey(date));
    }
  }

  return dates;
}

export function getNextMonthSporadicCheckDates(weekday: number): string[] {
  const today = getDefaultAgendaDate();
  const horizonDates = new Set(getRecurrenceDates(weekday));
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const dates: string[] = [];
  const cursor = new Date(nextMonthStart);

  while (cursor <= nextMonthEnd) {
    if (cursor.getDay() === weekday) {
      const dateKey = toDateKey(cursor);

      if (!horizonDates.has(dateKey)) {
        dates.push(dateKey);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

type ClassSlot = Pick<
  Class,
  'date' | 'period' | 'studentId' | 'startTime' | 'endTime' | 'attendance'
> & {
  id?: string;
};

type RecurrenceLike =
  | CreateStudentRecurrenceInput
  | Pick<StudentRecurrence, 'weekday' | 'startTime' | 'endTime'>;

export function sessionMatchesRecurrence(
  session: ClassSlot,
  recurrence: RecurrenceLike,
): boolean {
  if (!recurrence.startTime || !recurrence.endTime) {
    return false;
  }

  const sessionDateKey = toDateKey(session.date);

  return (
    getWeekdayFromDateKey(sessionDateKey) === recurrence.weekday &&
    session.startTime === recurrence.startTime &&
    session.endTime === recurrence.endTime
  );
}

export function sessionMatchesAnyRecurrence(
  session: ClassSlot,
  recurrences: RecurrenceLike[],
): boolean {
  return recurrences.some((recurrence) =>
    sessionMatchesRecurrence(session, recurrence),
  );
}

export function getClassStartTimestamp(date: Date, startTime: string): number {
  const [hours, minutes] = startTime.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  return start.getTime();
}

export function buildGeneratedClassData(
  studentId: string,
  hourlyRate: number,
  recurrence: CreateStudentRecurrenceInput,
  occupiedSlots: Set<string>,
): Array<{
  studentId: string;
  date: Date;
  period: ClassPeriod;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  expectedAmount: number;
  attendance: AttendanceStatus;
}> {
  if (!recurrence.startTime || !recurrence.endTime) {
    return [];
  }

  const durationMinutes = minutesBetween(
    recurrence.startTime,
    recurrence.endTime,
  );
  const periodLabel = periodFromStartTime(recurrence.startTime);
  const period = periodToPrisma(periodLabel);
  const expectedAmount = calculateExpectedAmount(durationMinutes, hourlyRate);
  const generated: Array<{
    studentId: string;
    date: Date;
    period: ClassPeriod;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    expectedAmount: number;
    attendance: AttendanceStatus;
  }> = [];

  for (const dateKey of getRecurrenceDates(recurrence.weekday)) {
    const slotKey = `${dateKey}-${periodLabel}`;
    if (occupiedSlots.has(slotKey)) {
      continue;
    }

    occupiedSlots.add(slotKey);
    generated.push({
      studentId,
      date: dateFromDateKey(dateKey),
      period,
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
      durationMinutes,
      expectedAmount,
      attendance: AttendanceStatus.EMPTY,
    });
  }

  return generated;
}

export function getNextClassAt(
  classes: Array<{ date: Date; startTime: string }>,
): string | undefined {
  const now = Date.now();
  const upcoming = classes
    .map((session) => {
      const timestamp = getClassStartTimestamp(session.date, session.startTime);
      return timestamp >= now ? new Date(timestamp).toISOString() : null;
    })
    .filter((value): value is string => Boolean(value))
    .sort();

  return upcoming[0];
}

export function createDefaultRecurrenceRow(
  draftRecurrences: CreateStudentRecurrenceInput[],
  availability: {
    getFirstAvailableWeekday: (
      draft: CreateStudentRecurrenceInput[],
    ) => number | null;
    getFirstAvailablePeriod: (
      weekday: number,
      draft: CreateStudentRecurrenceInput[],
    ) => 'morning' | 'afternoon' | null;
  },
): Pick<CreateStudentRecurrenceInput, 'weekday' | 'startTime' | 'endTime'> {
  const weekday = availability.getFirstAvailableWeekday(draftRecurrences) ?? 1;
  const period =
    availability.getFirstAvailablePeriod(weekday, draftRecurrences) ??
    'afternoon';
  const startTime = defaultStartTimeForPeriod(period);

  return {
    weekday: weekday as CreateStudentRecurrenceInput['weekday'],
    startTime,
    endTime: addMinutesToTime(startTime, DEFAULT_CLASS_DURATION_MINUTES),
  };
}

export function mapStudentRecurrence(recurrence: StudentRecurrence): {
  id: string;
  studentId: string;
  weekday: number;
  startTime: string;
  endTime: string;
} {
  return {
    id: recurrence.id,
    studentId: recurrence.studentId,
    weekday: recurrence.weekday,
    startTime: recurrence.startTime,
    endTime: recurrence.endTime,
  };
}

export function mapStudentBalances(student: {
  hourlyRate: { toString(): string };
  advanceBalancePix: { toString(): string };
  advanceBalanceCash: { toString(): string };
}): {
  hourlyRate: number;
  advanceBalancePix: number;
  advanceBalanceCash: number;
} {
  return {
    hourlyRate: decimalToNumber(student.hourlyRate),
    advanceBalancePix: decimalToNumber(student.advanceBalancePix),
    advanceBalanceCash: decimalToNumber(student.advanceBalanceCash),
  };
}
