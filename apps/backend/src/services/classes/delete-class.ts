import { AttendanceStatus } from '../../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import { classAllocationRepository } from '@/repositories/class-allocation-repository';
import { classRepository } from '@/repositories/class-repository';
import { makeupLinkRepository } from '@/repositories/makeup-link-repository';
import { studentRepository } from '@/repositories/student-repository';
import { isLockedRepostaAbsenceClass } from '@/services/classes/class-session-helpers';

class DeleteClass {
  async execute(id: string): Promise<void> {
    const existing = await classRepository.findById(id);

    if (!existing) {
      return;
    }

    if (isLockedRepostaAbsenceClass(existing)) {
      throw new AppError(
        'Esta falta já foi reposta e não pode ser excluída. Ela permanece apenas como referência.',
      );
    }

    await prisma.$transaction(async (tx) => {
      if (existing.attendance === AttendanceStatus.ATTENDED) {
        const { advancePix, advanceCash } =
          await classAllocationRepository.sumAdvanceByClassId(id, tx);

        if (advancePix > 0 || advanceCash > 0) {
          await studentRepository.restoreAdvanceBalance(
            existing.studentId,
            advancePix,
            advanceCash,
            tx,
          );
        }
      }

      const linkedAbsenceIds =
        await makeupLinkRepository.findAbsenceIdsByMakeupClassId(id, tx);

      for (const absenceId of linkedAbsenceIds) {
        const absence = await classRepository.findById(absenceId, tx);

        if (!absence) {
          continue;
        }

        await classRepository.update(
          absenceId,
          { pendingMakeupMinutes: absence.durationMinutes },
          tx,
        );
      }

      await makeupLinkRepository.deleteByMakeupClassId(id, tx);
      await classRepository.deleteById(id, tx);
    });
  }
}

export const deleteClass = new DeleteClass();
