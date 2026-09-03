import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import { classRepository } from '@/repositories/class-repository';
import { studentRecurrenceRepository } from '@/repositories/student-recurrence-repository';
import { studentRepository } from '@/repositories/student-repository';
import type { StudentResponse } from '@/types/student';
import { buildStudentResponse } from '@/services/students/build-student-response';
import { getClassStartTimestamp } from '@/services/students/recurrence-scheduler';

class DeactivateStudent {
  async execute(studentId: string): Promise<StudentResponse> {
    const existing = await studentRepository.findById(studentId);

    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    if (!existing.active) {
      throw new AppError('Este aluno já está desativado.');
    }

    const now = Date.now();
    const classes = await classRepository.findByStudentId(studentId);
    const futureClassIds = classes
      .filter(
        (session) =>
          getClassStartTimestamp(session.date, session.startTime) > now,
      )
      .map((session) => session.id);

    await prisma.$transaction(async (tx) => {
      await classRepository.deleteManyByIds(futureClassIds, tx);
      await studentRecurrenceRepository.deleteByStudentId(studentId, tx);
      await studentRepository.update(studentId, { active: false }, tx);
    });

    const updated = await studentRepository.findByIdOrThrow(studentId);
    return buildStudentResponse.execute(updated);
  }
}

export const deactivateStudent = new DeactivateStudent();
