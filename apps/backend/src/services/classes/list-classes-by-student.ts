import { classRepository } from '@/repositories/class-repository';
import { buildClassResponse } from '@/services/classes/build-class-response';
import type { ClassResponse } from '@/types/class';

class ListClassesByStudent {
  async execute(studentId: string, limit?: number): Promise<ClassResponse[]> {
    const classes = await classRepository.findByStudentId(studentId, limit);

    return buildClassResponse.executeMany(classes);
  }
}

export const listClassesByStudent = new ListClassesByStudent();
