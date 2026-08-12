import { ClassPeriod } from '../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import type { CreateStudentRecurrenceInput } from '@/types/student';
import { prisma } from '@/lib/prisma';
import {
  ALL_PERIODS,
  ALL_WEEKDAYS,
  getNextMonthSporadicCheckDates,
  getRecurrenceDates,
  periodFromPrisma,
  periodToPrisma,
  WEEKDAY_LABELS,
} from '@/services/recurrence-scheduler';
import { minutesBetween, periodFromStartTime } from '@/utils/time';
import { getWeekdayFromDateKey } from '@/utils/workday';

type AvailabilityContext = {
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

async function loadAvailabilityContext(
  excludeStudentId?: string,
): Promise<AvailabilityContext> {
  const [classes, recurrences] = await Promise.all([
    prisma.class.findMany({
      select: {
        date: true,
        period: true,
        studentId: true,
      },
    }),
    prisma.studentRecurrence.findMany({
      select: {
        studentId: true,
        weekday: true,
        startTime: true,
        endTime: true,
        student: {
          select: { active: true },
        },
      },
    }),
  ]);

  return {
    classes: excludeStudentId
      ? classes.filter((item) => item.studentId !== excludeStudentId)
      : classes,
    recurrences: recurrences.map((item) => ({
      studentId: item.studentId,
      weekday: item.weekday,
      startTime: item.startTime,
      endTime: item.endTime,
      studentActive: item.student.active,
    })),
  };
}

function periodFromWeekdayRecurrence(
  recurrence: CreateStudentRecurrenceInput,
): 'morning' | 'afternoon' {
  return periodFromStartTime(recurrence.startTime);
}

function isPeriodBlockedByOtherStudentRecurrence(
  context: AvailabilityContext,
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
  context: AvailabilityContext,
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
      session.date.toISOString().slice(0, 10) === dateKey &&
      session.period === prismaPeriod,
  );

  if (hasExistingClass) {
    return true;
  }

  return isWeekdayPeriodBlockedByPending(weekday, period, pendingRecurrences);
}

function isPeriodAvailableOnWeekday(
  context: AvailabilityContext,
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
  context: AvailabilityContext,
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

function getFirstAvailableWeekday(
  context: AvailabilityContext,
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

function getFirstAvailablePeriodForWeekday(
  context: AvailabilityContext,
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
  context: AvailabilityContext,
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
          session.date.toISOString().slice(0, 10) === dateKey &&
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

class RecurrenceAvailabilityService {
  async validateRecurrences(
    studentName: string,
    recurrences: CreateStudentRecurrenceInput[],
    excludeStudentId?: string,
  ): Promise<void> {
    const context = await loadAvailabilityContext(excludeStudentId);
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

  async getRecurrenceOptions(
    draftRecurrences: CreateStudentRecurrenceInput[],
    excludeStudentId?: string,
    currentWeekday?: number,
  ): Promise<{
    allWeekdays: Array<{ value: number; label: string }>;
    weekdayOptions: Array<{ value: number; label: string }>;
    hasAvailableWeekdays: boolean;
    getFirstAvailableWeekday: (
      draft: CreateStudentRecurrenceInput[],
    ) => number | null;
    getFirstAvailablePeriod: (
      weekday: number,
      draft: CreateStudentRecurrenceInput[],
    ) => 'morning' | 'afternoon' | null;
  }> {
    const context = await loadAvailabilityContext(excludeStudentId);

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
        getFirstAvailableWeekday(
          context,
          draftRecurrences,
          excludeStudentId,
        ) !== null,
      getFirstAvailableWeekday: (draft) =>
        getFirstAvailableWeekday(context, draft, excludeStudentId),
      getFirstAvailablePeriod: (weekday, draft) =>
        getFirstAvailablePeriodForWeekday(
          context,
          weekday,
          draft,
          excludeStudentId,
        ),
    };
  }

  async getAllOccupiedSlots(): Promise<Set<string>> {
    const classes = await prisma.class.findMany({
      select: {
        date: true,
        period: true,
      },
    });

    return new Set(
      classes.map(
        (session) =>
          `${session.date.toISOString().slice(0, 10)}-${periodFromPrisma(session.period)}`,
      ),
    );
  }

  async getOccupiedSlots(excludeStudentId?: string): Promise<Set<string>> {
    const classes = await prisma.class.findMany({
      where: excludeStudentId
        ? { studentId: { not: excludeStudentId } }
        : undefined,
      select: {
        date: true,
        period: true,
      },
    });

    return new Set(
      classes.map(
        (session) =>
          `${session.date.toISOString().slice(0, 10)}-${periodFromPrisma(session.period)}`,
      ),
    );
  }
}

export const recurrenceAvailabilityService =
  new RecurrenceAvailabilityService();
