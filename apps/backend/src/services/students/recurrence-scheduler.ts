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
  dateFromDateKey,
  formatClassDateTime,
  getClassStartTimestampFromKey,
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

export const RECURRENCE_GENERATION_MONTHS = 3;

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

export function getRecurrenceHorizonEnd(reference = new Date()): Date {
  const end = getDefaultAgendaDate(reference);
  end.setMonth(end.getMonth() + RECURRENCE_GENERATION_MONTHS);
  return end;
}

export function getRecurrenceDates(
  weekday: number,
  reference = new Date(),
): string[] {
  const base = getDefaultAgendaDate(reference);
  const end = getRecurrenceHorizonEnd(reference);
  const dates: string[] = [];
  const cursor = new Date(base);

  while (cursor <= end) {
    const dateKey = toDateKey(cursor);

    if (getWeekdayFromDateKey(dateKey) === weekday) {
      dates.push(dateKey);
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
  return getClassStartTimestampFromKey(toDateKey(date), startTime);
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
      const dateKey = toDateKey(session.date);
      const timestamp = getClassStartTimestampFromKey(
        dateKey,
        session.startTime,
      );

      return timestamp >= now
        ? formatClassDateTime(dateKey, session.startTime)
        : null;
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
