import { AppError } from '@/lib/app-error';
import { studentRepository } from '@/repositories/student-repository';
import type { StudentResponse } from '@/types/student';
import { buildStudentResponse } from '@/services/students/build-student-response';

class ReactivateStudent {
  async execute(studentId: string): Promise<StudentResponse> {
    const existing = await studentRepository.findById(studentId);

    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    if (existing.active) {
      throw new AppError('Este aluno já está ativo.');
    }

    const updated = await studentRepository.update(studentId, { active: true });
    return buildStudentResponse.execute(updated);
  }
}

export const reactivateStudent = new ReactivateStudent();
