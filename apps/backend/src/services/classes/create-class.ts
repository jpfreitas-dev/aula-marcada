import { AppError } from '@/lib/app-error';
import { classRepository } from '@/repositories/class-repository';
import { studentRepository } from '@/repositories/student-repository';
import { buildClassResponse } from '@/services/classes/build-class-response';
import type { CreateClassInput, ClassResponse } from '@/types/class';
import { calculateExpectedAmount } from '@/utils/class-value';
import { decimalToNumber } from '@/utils/money';
import { validateClassTimeWithinPeriod } from '@/utils/schedule-period';
import { addMinutesToTime, periodFromStartTime } from '@/utils/time';
import { dateFromDateKey, isWeekday } from '@/utils/workday';
import { getAvailablePeriods } from '@/services/classes/get-available-periods';
import { periodToPrisma } from '@/repositories/class-repository';

class CreateClass {
  async execute(input: CreateClassInput): Promise<ClassResponse> {
    if (input.isMakeupOnly || input.linkedAbsenceIds.length > 0) {
      throw new AppError(
        'O fluxo de reposição no agendamento ainda não está disponível nesta versão.',
      );
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
      throw new AppError('Período indisponível.');
    }

    if (periodFromStartTime(input.startTime) !== input.period) {
      throw new AppError(
        'O período informado não corresponde ao horário de início.',
      );
    }

    validateClassTimeWithinPeriod(input.startTime, input.durationMinutes);

    const hourlyRate = decimalToNumber(student.hourlyRate);
    const expectedAmount = input.hasManualAmountOverride
      ? input.expectedAmount
      : calculateExpectedAmount(input.durationMinutes, hourlyRate);

    if (expectedAmount <= 0) {
      throw new AppError('Informe o valor da aula.');
    }

    const endTime = addMinutesToTime(input.startTime, input.durationMinutes);

    const created = await classRepository.create({
      student: { connect: { id: student.id } },
      date: dateFromDateKey(input.date),
      period: periodToPrisma(input.period),
      startTime: input.startTime,
      endTime,
      durationMinutes: input.durationMinutes,
      expectedAmount,
      hasManualAmountOverride: input.hasManualAmountOverride ?? false,
    });

    const classWithStudent = await classRepository.findById(created.id);

    if (!classWithStudent) {
      throw new AppError('Aula não encontrada.', 404);
    }

    return buildClassResponse.execute(classWithStudent);
  }
}

export const createClass = new CreateClass();
