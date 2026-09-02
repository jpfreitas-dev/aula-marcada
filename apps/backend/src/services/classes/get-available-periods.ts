import { classRepository } from '@/repositories/class-repository';
import { studentRecurrenceRepository } from '@/repositories/student-recurrence-repository';
import type { ClassPeriod } from '@/types/class';
import {
  isRecurrenceOccurrenceUpcoming,
  periodFromPrisma,
} from '@/services/students/recurrence-scheduler';
import { periodFromStartTime } from '@/utils/time';
import { getWeekdayFromDateKey } from '@/utils/workday';

const ALL_PERIODS: ClassPeriod[] = ['morning', 'afternoon'];

class GetAvailablePeriods {
  async execute(
    dateKey: string,
    excludeClassId?: string,
  ): Promise<ClassPeriod[]> {
    const occupied = await classRepository.findOccupiedPeriodsByDateKey(
      dateKey,
      excludeClassId,
    );
    const occupiedPeriods = new Set(
      occupied.map((period) => periodFromPrisma(period)),
    );
    const weekday = getWeekdayFromDateKey(dateKey);
    const recurrences =
      await studentRecurrenceRepository.findAllWithStudentActive();
    const blockedByRecurrence = new Set<ClassPeriod>(
      recurrences
        .filter(
          (recurrence) =>
            recurrence.student.active &&
            recurrence.weekday === weekday &&
            isRecurrenceOccurrenceUpcoming(dateKey, recurrence.startTime),
        )
        .map((recurrence) => periodFromStartTime(recurrence.startTime)),
    );

    return ALL_PERIODS.filter(
      (period) =>
        !occupiedPeriods.has(period) && !blockedByRecurrence.has(period),
    );
  }
}

export const getAvailablePeriods = new GetAvailablePeriods();
