import type { CreateStudentRecurrenceInput } from '@/types/student';
import { validateRecurrencesInContext } from '@/services/students/recurrence-availability';
import { loadRecurrenceAvailabilityContext } from '@/services/students/load-recurrence-availability-context';

class ValidateStudentRecurrences {
  async execute(
    studentName: string,
    recurrences: CreateStudentRecurrenceInput[],
    excludeStudentId?: string,
  ): Promise<void> {
    const context =
      await loadRecurrenceAvailabilityContext.execute(excludeStudentId);
    validateRecurrencesInContext(
      context,
      studentName,
      recurrences,
      excludeStudentId,
    );
  }
}

export const validateStudentRecurrences = new ValidateStudentRecurrences();
