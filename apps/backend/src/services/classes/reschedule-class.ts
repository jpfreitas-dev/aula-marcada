import { AppError } from '@/lib/app-error';
import { classRepository } from '@/repositories/class-repository';
import {
  buildClassResponse,
  recalculateExpectedAmount,
} from '@/services/classes/build-class-response';
import { calculateRequiredMakeupMinutes } from '@/services/classes/calculate-required-makeup-minutes';
import { getAvailablePeriods } from '@/services/classes/get-available-periods';
import type { ClassResponse, RescheduleClassInput } from '@/types/class';
import { validateClassTimeWithinPeriod } from '@/utils/schedule-period';
import {
  addMinutesToTime,
  MIN_CLASS_DURATION_MINUTES,
  periodFromStartTime,
} from '@/utils/time';
import { dateFromDateKey, isWeekday } from '@/utils/workday';
import { periodToPrisma } from '@/repositories/class-repository';
import { makeupLinkRepository } from '@/repositories/makeup-link-repository';
import { decimalToNumber } from '@/utils/money';

class RescheduleClass {
  async execute(
    id: string,
    input: RescheduleClassInput,
  ): Promise<ClassResponse> {
    const existing = await classRepository.findById(id);

    if (!existing) {
      throw new AppError('Aula não encontrada.', 404);
    }

    if (existing.attendance !== 'EMPTY') {
      throw new AppError('Não é possível reagendar uma aula já preenchida.');
    }

    if (!isWeekday(dateFromDateKey(input.date))) {
      throw new AppError('Não é possível agendar aulas no fim de semana.');
    }

    const available = await getAvailablePeriods.execute(input.date, id);
    if (!available.includes(input.period)) {
      throw new AppError('Período indisponível.');
    }

    if (periodFromStartTime(input.startTime) !== input.period) {
      throw new AppError(
        'O período informado não corresponde ao horário de início.',
      );
    }

    const linkedAbsenceIds =
      await makeupLinkRepository.findAbsenceIdsByMakeupClassId(id);
    let minimumDuration = MIN_CLASS_DURATION_MINUTES;

    if (linkedAbsenceIds.length > 0) {
      const absences = await Promise.all(
        linkedAbsenceIds.map(async (absenceId) => {
          const absence = await classRepository.findById(absenceId);
          if (!absence) {
            throw new AppError('Falta vinculada não encontrada.');
          }

          return absence;
        }),
      );

      minimumDuration = calculateRequiredMakeupMinutes(
        existing,
        absences,
        existing.isMakeupOnly,
      );
    }

    if (input.durationMinutes < minimumDuration) {
      throw new AppError(
        linkedAbsenceIds.length > 0
          ? 'Duração insuficiente para a reposição vinculada.'
          : 'A duração informada é menor que o mínimo permitido.',
      );
    }

    validateClassTimeWithinPeriod(
      input.startTime,
      input.durationMinutes,
      minimumDuration,
    );

    const hourlyRate = decimalToNumber(existing.student.hourlyRate);
    const endTime = addMinutesToTime(input.startTime, input.durationMinutes);
    const expectedAmount = recalculateExpectedAmount(
      existing,
      input.durationMinutes,
      hourlyRate,
    );

    await classRepository.update(id, {
      date: dateFromDateKey(input.date),
      period: periodToPrisma(input.period),
      startTime: input.startTime,
      endTime,
      durationMinutes: input.durationMinutes,
      expectedAmount,
    });

    const updated = await classRepository.findById(id);

    if (!updated) {
      throw new AppError('Aula não encontrada.', 404);
    }

    return buildClassResponse.execute(updated);
  }
}

export const rescheduleClass = new RescheduleClass();
