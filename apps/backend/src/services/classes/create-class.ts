import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import {
  classRepository,
  periodToPrisma,
} from '@/repositories/class-repository';
import { studentRepository } from '@/repositories/student-repository';
import { applyMakeupCoverage } from '@/services/classes/apply-makeup-coverage';
import { buildClassResponse } from '@/services/classes/build-class-response';
import { calculateRequiredMakeupMinutes } from '@/services/classes/calculate-required-makeup-minutes';
import { validateMakeupAbsences } from '@/services/classes/validate-makeup-absences';
import type { CreateClassInput, ClassResponse } from '@/types/class';
import { calculateExpectedAmount } from '@/utils/class-value';
import { decimalToNumber } from '@/utils/money';
import { validateClassTimeWithinPeriod } from '@/utils/schedule-period';
import { addMinutesToTime, periodFromStartTime } from '@/utils/time';
import { dateFromDateKey, isWeekday } from '@/utils/workday';
import { getAvailablePeriods } from '@/services/classes/get-available-periods';
import { validateScheduleSlotAvailable } from '@/services/classes/validate-schedule-slot';

class CreateClass {
  async execute(input: CreateClassInput): Promise<ClassResponse> {
    if (input.isMakeupOnly && input.linkedAbsenceIds.length === 0) {
      throw new AppError('Aula de reposição exige faltas vinculadas.');
    }

    const student = await studentRepository.findActiveById(input.studentId);

    if (!student) {
      throw new AppError('Aluno não encontrado.');
    }

    if (!isWeekday(dateFromDateKey(input.date))) {
      throw new AppError('Não é possível agendar aulas no fim de semana.');
    }

    const available = await getAvailablePeriods.execute(input.date);
    if (!available.includes(input.period)) {
      await validateScheduleSlotAvailable.execute(input.date, input.period);
      throw new AppError('Período indisponível.');
    }

    if (periodFromStartTime(input.startTime) !== input.period) {
      throw new AppError(
        'O período informado não corresponde ao horário de início.',
      );
    }

    let absences: Awaited<ReturnType<typeof validateMakeupAbsences>> = [];

    if (input.linkedAbsenceIds.length > 0) {
      absences = await validateMakeupAbsences(
        input.linkedAbsenceIds,
        input.studentId,
      );

      const required = calculateRequiredMakeupMinutes(
        null,
        absences,
        input.isMakeupOnly,
      );

      validateClassTimeWithinPeriod(
        input.startTime,
        input.durationMinutes,
        required,
      );

      if (input.durationMinutes < required) {
        throw new AppError('Duração insuficiente para a reposição vinculada.');
      }
    } else {
      validateClassTimeWithinPeriod(input.startTime, input.durationMinutes);
    }

    const hourlyRate = decimalToNumber(student.hourlyRate);
    const expectedAmount = input.hasManualAmountOverride
      ? input.expectedAmount
      : calculateExpectedAmount(input.durationMinutes, hourlyRate);

    if (expectedAmount <= 0) {
      throw new AppError('Informe o valor da aula.');
    }

    const endTime = addMinutesToTime(input.startTime, input.durationMinutes);

    const created = await prisma.$transaction(async (tx) => {
      const classRecord = await classRepository.create(
        {
          student: { connect: { id: student.id } },
          date: dateFromDateKey(input.date),
          period: periodToPrisma(input.period),
          startTime: input.startTime,
          endTime,
          durationMinutes: input.durationMinutes,
          expectedAmount,
          isMakeupOnly: input.isMakeupOnly,
          hasManualAmountOverride: input.hasManualAmountOverride ?? false,
        },
        tx,
      );

      if (input.linkedAbsenceIds.length > 0) {
        const coverageMinutes = input.isMakeupOnly
          ? input.durationMinutes
          : Math.max(input.durationMinutes, 0);

        await applyMakeupCoverage(
          classRecord.id,
          absences.map((absence) => ({
            id: absence.id,
            pendingMakeupMinutes: absence.pendingMakeupMinutes,
          })),
          coverageMinutes,
          tx,
        );
      }

      return classRecord;
    });

    const classWithStudent = await classRepository.findById(created.id);

    if (!classWithStudent) {
      throw new AppError('Aula não encontrada.', 404);
    }

    return buildClassResponse.execute(classWithStudent);
  }
}

export const createClass = new CreateClass();
