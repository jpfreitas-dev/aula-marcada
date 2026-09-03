import { classRepository } from '@/repositories/class-repository';
import { studentRecurrenceRepository } from '@/repositories/student-recurrence-repository';
import type { RecurrenceAvailabilityContext } from '@/services/students/recurrence-availability';

class LoadRecurrenceAvailabilityContext {
  async execute(
    excludeStudentId?: string,
  ): Promise<RecurrenceAvailabilityContext> {
    const [classes, recurrences] = await Promise.all([
      classRepository.findScheduleSlots(),
      studentRecurrenceRepository.findAllWithStudentActive(),
    ]);

    return {
      classes: (excludeStudentId
        ? classes.filter((item) => item.studentId !== excludeStudentId)
        : classes
      ).map((item) => ({
        date: item.date,
        period: item.period,
        studentId: item.studentId,
        studentName: item.student.name,
      })),
      recurrences: recurrences.map((item) => ({
        studentId: item.studentId,
        studentName: item.student.name,
        weekday: item.weekday,
        startTime: item.startTime,
        endTime: item.endTime,
        studentActive: item.student.active,
      })),
    };
  }
}

export const loadRecurrenceAvailabilityContext =
  new LoadRecurrenceAvailabilityContext();
