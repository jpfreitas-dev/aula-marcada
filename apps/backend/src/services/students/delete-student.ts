import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import { classAllocationRepository } from '@/repositories/class-allocation-repository';
import { classRepository } from '@/repositories/class-repository';
import { makeupLinkRepository } from '@/repositories/makeup-link-repository';
import { paymentRepository } from '@/repositories/payment-repository';
import { studentRecurrenceRepository } from '@/repositories/student-recurrence-repository';
import { studentRepository } from '@/repositories/student-repository';

class DeleteStudent {
  async execute(studentId: string): Promise<void> {
    const existing = await studentRepository.findById(studentId);

    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    if (existing.active) {
      throw new AppError('Desative o aluno antes de excluir.', 400);
    }

    await prisma.$transaction(async (tx) => {
      const classes = await classRepository.findByStudentId(
        studentId,
        undefined,
        tx,
      );
      const classIds = classes.map((session) => session.id);
      const classIdSet = new Set(classIds);

      for (const classId of classIds) {
        const linkedAbsenceIds =
          await makeupLinkRepository.findAbsenceIdsByMakeupClassId(classId, tx);

        for (const absenceId of linkedAbsenceIds) {
          if (!classIdSet.has(absenceId)) {
            const absence = await classRepository.findById(absenceId, tx);

            if (absence) {
              await classRepository.update(
                absenceId,
                { pendingMakeupMinutes: absence.durationMinutes },
                tx,
              );
            }
          }
        }
      }

      await makeupLinkRepository.deleteByClassIds(classIds, tx);
      await classAllocationRepository.deleteByClassIds(classIds, tx);
      await paymentRepository.deleteByStudentId(studentId, tx);
      await classRepository.deleteManyByIds(classIds, tx);
      await studentRecurrenceRepository.deleteByStudentId(studentId, tx);
      await studentRepository.delete(studentId, tx);
    });
  }
}

export const deleteStudent = new DeleteStudent();
