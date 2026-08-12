import { ClassPeriod } from '../../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import type { CreateStudentRecurrenceInput } from '@/types/student';
import {
  ALL_PERIODS,
  ALL_WEEKDAYS,
  getNextMonthSporadicCheckDates,
  getRecurrenceDates,
  periodToPrisma,
  WEEKDAY_LABELS,
} from '@/services/students/recurrence-scheduler';
import { minutesBetween, periodFromStartTime } from '@/utils/time';
import { getWeekdayFromDateKey, toDateKey } from '@/utils/workday';

export type RecurrenceAvailabilityContext = {
  classes: Array<{
    date: Date;
    period: ClassPeriod;
    studentId: string;
  }>;
  recurrences: Array<{
    studentId: string;
    weekday: number;
    startTime: string;
    endTime: string;
    studentActive: boolean;
  }>;
};

function periodFromWeekdayRecurrence(
  recurrence: CreateStudentRecurrenceInput,
): 'morning' | 'afternoon' {
  return periodFromStartTime(recurrence.startTime);
}

function isPeriodBlockedByOtherStudentRecurrence(
  context: RecurrenceAvailabilityContext,
  weekday: number,
  period: 'morning' | 'afternoon',
  excludeStudentId?: string,
): boolean {
  return context.recurrences.some((recurrence) => {
    if (
      excludeStudentId !== undefined &&
      recurrence.studentId === excludeStudentId
    ) {
      return false;
    }

    if (!recurrence.studentActive) {
      return false;
    }

    return (
      recurrence.weekday === weekday &&
      periodFromStartTime(recurrence.startTime) === period
    );
  });
}

function isWeekdayPeriodBlockedByPending(
  weekday: number,
  period: 'morning' | 'afternoon',
  pendingRecurrences: CreateStudentRecurrenceInput[],
): boolean {
  return pendingRecurrences.some(
    (recurrence) =>
      recurrence.startTime &&
      recurrence.endTime &&
      recurrence.weekday === weekday &&
      periodFromWeekdayRecurrence(recurrence) === period,
  );
}

function isSlotBlocked(
  context: RecurrenceAvailabilityContext,
  dateKey: string,
  period: 'morning' | 'afternoon',
  pendingRecurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
): boolean {
  const weekday = getWeekdayFromDateKey(dateKey);
  const prismaPeriod = periodToPrisma(period);

  if (
    isPeriodBlockedByOtherStudentRecurrence(
      context,
      weekday,
      period,
      excludeStudentId,
    )
  ) {
    return true;
  }

  const hasExistingClass = context.classes.some(
    (session) =>
      toDateKey(session.date) === dateKey && session.period === prismaPeriod,
  );

  if (hasExistingClass) {
    return true;
  }

  return isWeekdayPeriodBlockedByPending(weekday, period, pendingRecurrences);
}

function isPeriodAvailableOnWeekday(
  context: RecurrenceAvailabilityContext,
  weekday: number,
  period: 'morning' | 'afternoon',
  pendingRecurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
): boolean {
  if (
    isPeriodBlockedByOtherStudentRecurrence(
      context,
      weekday,
      period,
      excludeStudentId,
    )
  ) {
    return false;
  }

  return getRecurrenceDates(weekday).some(
    (dateKey) =>
      !isSlotBlocked(
        context,
        dateKey,
        period,
        pendingRecurrences,
        excludeStudentId,
      ),
  );
}

function hasFreePeriodOnWeekday(
  context: RecurrenceAvailabilityContext,
  weekday: number,
  pendingRecurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
): boolean {
  return ALL_PERIODS.some((period) =>
    isPeriodAvailableOnWeekday(
      context,
      weekday,
      period,
      pendingRecurrences,
      excludeStudentId,
    ),
  );
}

export function getFirstAvailableWeekday(
  context: RecurrenceAvailabilityContext,
  pendingRecurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
): number | null {
  return (
    ALL_WEEKDAYS.find((weekday) =>
      hasFreePeriodOnWeekday(
        context,
        weekday,
        pendingRecurrences,
        excludeStudentId,
      ),
    ) ?? null
  );
}

export function getFirstAvailablePeriodForWeekday(
  context: RecurrenceAvailabilityContext,
  weekday: number,
  pendingRecurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
): 'morning' | 'afternoon' | null {
  return (
    ALL_PERIODS.find((period) =>
      isPeriodAvailableOnWeekday(
        context,
        weekday,
        period,
        pendingRecurrences,
        excludeStudentId,
      ),
    ) ?? null
  );
}

function validateSporadicConflictsInNextMonth(
  context: RecurrenceAvailabilityContext,
  recurrences: CreateStudentRecurrenceInput[],
): void {
  for (const recurrence of recurrences) {
    if (!recurrence.startTime || !recurrence.endTime) {
      continue;
    }

    const period = periodFromWeekdayRecurrence(recurrence);
    const prismaPeriod = periodToPrisma(period);
    const sporadicDates = getNextMonthSporadicCheckDates(recurrence.weekday);
    const hasConflict = sporadicDates.some((dateKey) =>
      context.classes.some(
        (session) =>
          toDateKey(session.date) === dateKey &&
          session.period === prismaPeriod,
      ),
    );

    if (hasConflict) {
      throw new AppError(
        'Há aulas avulsas agendadas neste período no próximo mês. Verifique a agenda antes de continuar.',
      );
    }
  }
}

export function validateRecurrencesInContext(
  context: RecurrenceAvailabilityContext,
  studentName: string,
  recurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
): void {
  const filled = recurrences.filter(
    (recurrence) => recurrence.startTime && recurrence.endTime,
  );

  for (const recurrence of filled) {
    if (minutesBetween(recurrence.startTime, recurrence.endTime) <= 0) {
      throw new AppError('O horário de fim deve ser posterior ao início.');
    }
  }

  const exactSlotKeys = new Set<string>();
  for (const recurrence of filled) {
    const exactKey = `${recurrence.weekday}-${recurrence.startTime}-${recurrence.endTime}`;
    if (exactSlotKeys.has(exactKey)) {
      throw new AppError(
        'Não é possível cadastrar aulas recorrentes com o mesmo horário.',
      );
    }
    exactSlotKeys.add(exactKey);
  }

  const studentPeriodKeys = new Set<string>();
  for (const recurrence of filled) {
    const key = `${recurrence.weekday}-${periodFromWeekdayRecurrence(recurrence)}`;
    if (studentPeriodKeys.has(key)) {
      throw new AppError(`O aluno ${studentName} já tem aula nesse período.`);
    }
    studentPeriodKeys.add(key);
  }

  for (const recurrence of filled) {
    const period = periodFromWeekdayRecurrence(recurrence);
    const otherRecurrences = filled.filter((item) => item !== recurrence);

    if (
      !isPeriodAvailableOnWeekday(
        context,
        recurrence.weekday,
        period,
        otherRecurrences,
        excludeStudentId,
      )
    ) {
      throw new AppError('Já existe uma aula nesse período.');
    }
  }

  validateSporadicConflictsInNextMonth(context, filled);
}

export function buildWeekdayOptions(
  context: RecurrenceAvailabilityContext,
  draftRecurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
  currentWeekday?: number,
): {
  allWeekdays: Array<{ value: number; label: string }>;
  weekdayOptions: Array<{ value: number; label: string }>;
  hasAvailableWeekdays: boolean;
} {
  const allWeekdays = ALL_WEEKDAYS.map((value) => ({
    value,
    label: WEEKDAY_LABELS[value],
  }));

  const availableWeekdays = ALL_WEEKDAYS.filter((weekday) =>
    hasFreePeriodOnWeekday(
      context,
      weekday,
      draftRecurrences,
      excludeStudentId,
    ),
  );
  const weekdaySet = new Set<number>(availableWeekdays);

  if (currentWeekday !== undefined) {
    weekdaySet.add(currentWeekday);
  }

  const weekdayOptions = [...weekdaySet]
    .sort((left, right) => left - right)
    .map((value) => ({
      value,
      label: allWeekdays.find((item) => item.value === value)?.label ?? '',
    }));

  return {
    allWeekdays,
    weekdayOptions,
    hasAvailableWeekdays:
      getFirstAvailableWeekday(context, draftRecurrences, excludeStudentId) !==
      null,
  };
}
