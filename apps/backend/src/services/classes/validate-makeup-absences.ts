import { AttendanceStatus } from '../../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import { classRepository } from '@/repositories/class-repository';
import { isClassSessionEnded } from '@/services/classes/class-session-helpers';

type AbsenceRecord = NonNullable<
  Awaited<ReturnType<typeof classRepository.findById>>
>;

export async function validateMakeupAbsences(
  absenceIds: string[],
  studentId: string,
): Promise<AbsenceRecord[]> {
  const absences: AbsenceRecord[] = [];

  for (const absenceId of absenceIds) {
    const absence = await classRepository.findById(absenceId);

    if (
      !absence ||
      absence.studentId !== studentId ||
      absence.attendance !== AttendanceStatus.ABSENT ||
      !isClassSessionEnded(absence)
    ) {
      throw new AppError('Falta inválida para reposição.');
    }

    if (absence.pendingMakeupMinutes <= 0) {
      throw new AppError('Esta falta já foi totalmente reposta.');
    }

    absences.push(absence);
  }

  return absences;
}
