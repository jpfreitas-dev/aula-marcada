import { studentRepository } from '@/repositories/student-repository';
import { generateClassesForRecurrences } from '@/services/students/generate-classes-for-recurrences';
import type { CreateStudentRecurrenceInput } from '@/types/student';
import { decimalToNumber } from '@/utils/money';

class EnsureRecurrenceHorizon {
  async execute(): Promise<void> {
    const students = await studentRepository.findAllActiveWithRecurrences();

    for (const student of students) {
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
      );
    }
  }
}

export const ensureRecurrenceHorizon = new EnsureRecurrenceHorizon();
