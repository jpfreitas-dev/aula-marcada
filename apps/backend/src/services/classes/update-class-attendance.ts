import { AttendanceStatus } from '../../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import { classRepository } from '@/repositories/class-repository';
import { buildClassResponse } from '@/services/classes/build-class-response';
import {
  isClassSessionEnded,
  isLockedRepostaAbsenceClass,
} from '@/services/classes/class-session-helpers';
import { applyAttendancePayment } from '@/services/payments/apply-attendance-payment';
import { clearClassPaymentState } from '@/services/payments/clear-class-payment-state';
import type { ClassResponse, UpdateClassAttendanceInput } from '@/types/class';

class UpdateClassAttendance {
  async execute(
    id: string,
    input: UpdateClassAttendanceInput,
  ): Promise<ClassResponse> {
    const existing = await classRepository.findById(id);

    if (!existing) {
      throw new AppError('Aula não encontrada.', 404);
    }

    if (isLockedRepostaAbsenceClass(existing)) {
      throw new AppError(
        'Esta falta já foi reposta e não pode ser alterada. Ela permanece apenas como referência.',
      );
    }

    if (
      input.attendance === 'empty' &&
      existing.attendance !== AttendanceStatus.EMPTY &&
      isClassSessionEnded(existing)
    ) {
      throw new AppError(
        'Não é possível excluir o registro de uma aula que já terminou.',
      );
    }

    const wasAlreadyAttended =
      existing.attendance === AttendanceStatus.ATTENDED;

    await prisma.$transaction(async (tx) => {
      if (input.attendance === 'empty') {
        if (existing.attendance === AttendanceStatus.ATTENDED) {
          await clearClassPaymentState(id, existing.studentId, tx);
        }

        await classRepository.update(
          id,
          {
            attendance: AttendanceStatus.EMPTY,
            content: null,
            notes: null,
          },
          tx,
        );
        return;
      }

      if (input.attendance === 'absent') {
        if (existing.attendance === AttendanceStatus.ATTENDED) {
          await clearClassPaymentState(id, existing.studentId, tx);
        }

        const pendingMakeupMinutes =
          existing.attendance === AttendanceStatus.ABSENT
            ? existing.pendingMakeupMinutes
            : existing.durationMinutes;

        await classRepository.update(
          id,
          {
            attendance: AttendanceStatus.ABSENT,
            content: null,
            notes: null,
            pendingMakeupMinutes,
          },
          tx,
        );
        return;
      }

      if (input.attendance === 'attended') {
        await classRepository.update(
          id,
          {
            attendance: AttendanceStatus.ATTENDED,
            content: input.content ?? null,
            notes: input.notes ?? null,
          },
          tx,
        );

        await applyAttendancePayment(
          existing,
          existing.student,
          input.paidAmount ?? 0,
          input.paymentMethod,
          wasAlreadyAttended,
          tx,
        );
      }
    });

    const updated = await classRepository.findById(id);

    if (!updated) {
      throw new AppError('Aula não encontrada.', 404);
    }

    return buildClassResponse.execute(updated);
  }
}

export const updateClassAttendance = new UpdateClassAttendance();
