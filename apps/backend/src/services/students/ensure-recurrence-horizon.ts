import { classRepository } from '@/repositories/class-repository';
import { studentRepository } from '@/repositories/student-repository';
import { generateClassesForRecurrences } from '@/services/students/generate-classes-for-recurrences';
import { getRecurrenceHorizonEnd } from '@/services/students/recurrence-scheduler';
import type { CreateStudentRecurrenceInput } from '@/types/student';
import { decimalToNumber } from '@/utils/money';
import { toDateKey } from '@/utils/workday';

class EnsureRecurrenceHorizon {
  private lastRunAt: number | null = null;

  async execute(options?: { force?: boolean }): Promise<void> {
    const now = Date.now();
    const students = await studentRepository.findAllActiveWithRecurrences();

    if (students.length === 0) {
      this.lastRunAt = now;
      return;
    }

    const horizonEndKey = toDateKey(getRecurrenceHorizonEnd());
    const latestDatesByStudent =
      await classRepository.findLatestDateByStudentIds(
        students.map((student) => student.id),
      );

    const needsGeneration = students.some((student) => {
      const latestDate = latestDatesByStudent.get(student.id);
      return !latestDate || toDateKey(latestDate) < horizonEndKey;
    });

    if (!needsGeneration && !options?.force) {
      this.lastRunAt = now;
      return;
    }

    const occupied = await classRepository.getAllOccupiedSlotKeys();

    for (const student of students) {
      const latestDate = latestDatesByStudent.get(student.id);

      if (latestDate && toDateKey(latestDate) >= horizonEndKey) {
        continue;
      }

      const recurrences: CreateStudentRecurrenceInput[] =
        student.recurrences.map((recurrence) => ({
          weekday:
            recurrence.weekday as CreateStudentRecurrenceInput['weekday'],
          startTime: recurrence.startTime,
          endTime: recurrence.endTime,
        }));

      await generateClassesForRecurrences.execute(
        student.id,
        decimalToNumber(student.hourlyRate),
        recurrences,
        undefined,
        occupied,
      );
    }

    this.lastRunAt = now;
  }
}

export const ensureRecurrenceHorizon = new EnsureRecurrenceHorizon();
