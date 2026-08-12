import { AttendanceStatus } from '../../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import {
  classRepository,
  periodToPrisma,
} from '@/repositories/class-repository';
import {
  applyMakeupCoverage,
  restoreMakeupLinksForClass,
} from '@/services/classes/apply-makeup-coverage';
import {
  buildClassResponse,
  recalculateExpectedAmount,
} from '@/services/classes/build-class-response';
import { calculateRequiredMakeupMinutes } from '@/services/classes/calculate-required-makeup-minutes';
import { createClass } from '@/services/classes/create-class';
import { validateMakeupAbsences } from '@/services/classes/validate-makeup-absences';
import type { ClassResponse, LinkMakeupInput } from '@/types/class';
import { validateClassTimeWithinPeriod } from '@/utils/schedule-period';
import {
  addMinutesToTime,
  minutesBetween,
  periodFromStartTime,
} from '@/utils/time';
import { decimalToNumber } from '@/utils/money';

class LinkMakeup {
  async execute(input: LinkMakeupInput): Promise<ClassResponse> {
    if (input.absenceIds.length === 0) {
      throw new AppError('Selecione pelo menos uma falta.');
    }

    const absences = await validateMakeupAbsences(
      input.absenceIds,
      input.studentId,
    );

    const durationMinutes = minutesBetween(input.startTime, input.endTime);

    if (input.targetClassId) {
      return this.linkToExistingClass(input, absences, durationMinutes);
    }

    if (!input.date || !input.period) {
      throw new AppError(
        'Informe data e período para a nova aula de reposição.',
      );
    }

    const required = calculateRequiredMakeupMinutes(null, absences, true);
    this.validateMakeupScheduleTime(input.startTime, durationMinutes, required);

    const created = await createClass.execute({
      studentId: input.studentId,
      date: input.date,
      period: input.period,
      startTime: input.startTime,
      durationMinutes,
      expectedAmount: 0,
      isMakeupOnly: true,
      linkedAbsenceIds: input.absenceIds,
    });

    return created;
  }

  private async linkToExistingClass(
    input: LinkMakeupInput,
    absences: Awaited<ReturnType<typeof validateMakeupAbsences>>,
    durationMinutes: number,
  ): Promise<ClassResponse> {
    const targetId = input.targetClassId!;
    const target = await classRepository.findById(targetId);

    if (!target) {
      throw new AppError('Aula não encontrada.', 404);
    }

    if (target.studentId !== input.studentId) {
      throw new AppError('Falta inválida para reposição.');
    }

    if (target.attendance !== AttendanceStatus.EMPTY) {
      throw new AppError(
        'Não é possível vincular reposição a uma aula já preenchida.',
      );
    }

    const required = calculateRequiredMakeupMinutes(target, absences, false);
    this.validateMakeupScheduleTime(input.startTime, durationMinutes, required);

    const period = periodFromStartTime(input.startTime);
    const endTime = addMinutesToTime(input.startTime, durationMinutes);
    const hourlyRate = decimalToNumber(target.student.hourlyRate);
    const expectedAmount = recalculateExpectedAmount(
      target,
      durationMinutes,
      hourlyRate,
    );
    const coverageMinutes = Math.max(
      durationMinutes - target.durationMinutes,
      0,
    );

    await prisma.$transaction(async (tx) => {
      await restoreMakeupLinksForClass(targetId, tx);

      await classRepository.update(
        targetId,
        {
          startTime: input.startTime,
          endTime,
          durationMinutes,
          expectedAmount,
          period: periodToPrisma(period),
          date: target.date,
        },
        tx,
      );

      await applyMakeupCoverage(
        targetId,
        absences.map((absence) => ({
          id: absence.id,
          pendingMakeupMinutes: absence.pendingMakeupMinutes,
        })),
        coverageMinutes,
        tx,
      );
    });

    const updated = await classRepository.findById(targetId);

    if (!updated) {
      throw new AppError('Aula não encontrada.', 404);
    }

    return buildClassResponse.execute(updated);
  }

  private validateMakeupScheduleTime(
    startTime: string,
    durationMinutes: number,
    requiredMinutes: number,
  ): void {
    validateClassTimeWithinPeriod(startTime, durationMinutes, requiredMinutes);

    if (durationMinutes < requiredMinutes) {
      throw new AppError('Duração insuficiente para a reposição vinculada.');
    }
  }
}

export const linkMakeup = new LinkMakeup();
