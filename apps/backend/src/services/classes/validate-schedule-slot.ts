import { AppError } from '@/lib/app-error';
import {
  classRepository,
  periodToPrisma,
} from '@/repositories/class-repository';
import { studentRecurrenceRepository } from '@/repositories/student-recurrence-repository';
import type { ClassPeriod } from '@/types/class';
import {
  formatExistingClassConflict,
  formatRecurrenceConflict,
} from '@/utils/schedule-conflict';
import { periodFromStartTime } from '@/utils/time';
import { getWeekdayFromDateKey } from '@/utils/workday';

class ValidateScheduleSlotAvailable {
  async execute(
    dateKey: string,
    period: ClassPeriod,
    excludeClassId?: string,
  ): Promise<void> {
    const existing = await classRepository.findByDateKeyAndPeriod(
      dateKey,
      periodToPrisma(period),
      excludeClassId,
    );

    if (existing) {
      const withStudent = await classRepository.findById(existing.id);

      if (!withStudent) {
        throw new AppError('Período indisponível.');
      }

      throw new AppError(
        formatExistingClassConflict(withStudent.student.name, dateKey, period),
      );
    }

    const weekday = getWeekdayFromDateKey(dateKey);
    const recurrences =
      await studentRecurrenceRepository.findAllWithStudentActive();
    const blockingRecurrence = recurrences.find(
      (recurrence) =>
        recurrence.student.active &&
        recurrence.weekday === weekday &&
        periodFromStartTime(recurrence.startTime) === period,
    );

    if (blockingRecurrence) {
      throw new AppError(
        formatRecurrenceConflict(
          blockingRecurrence.student.name,
          weekday,
          period,
        ),
      );
    }
  }
}

export const validateScheduleSlotAvailable =
  new ValidateScheduleSlotAvailable();
