import { classRepository } from '@/repositories/class-repository';
import { buildClassResponse } from '@/services/classes/build-class-response';
import { isClassSessionEnded } from '@/services/classes/class-session-helpers';
import type { ClassResponse } from '@/types/class';

class ListPendingAbsences {
  async execute(studentId: string): Promise<ClassResponse[]> {
    const absences =
      await classRepository.findPendingAbsencesByStudentId(studentId);

    const pending = absences.filter((absence) => isClassSessionEnded(absence));

    return buildClassResponse.executeMany(pending);
  }
}

export const listPendingAbsences = new ListPendingAbsences();
