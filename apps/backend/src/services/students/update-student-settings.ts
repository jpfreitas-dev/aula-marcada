import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import { studentRecurrenceRepository } from '@/repositories/student-recurrence-repository';
import { studentRepository } from '@/repositories/student-repository';
import type {
  CreateStudentRecurrenceInput,
  StudentResponse,
  UpdateStudentSettingsInput,
} from '@/types/student';
import { buildStudentResponse } from '@/services/students/build-student-response';
import { syncAgendaAfterSettingsChange } from '@/services/students/sync-agenda-after-settings-change';
import { validateStudentRecurrences } from '@/services/students/validate-student-recurrences';

class UpdateStudentSettings {
  async execute(
    studentId: string,
    input: UpdateStudentSettingsInput,
  ): Promise<StudentResponse> {
    const existing = await studentRepository.findById(studentId);

    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    if (!existing.active) {
      throw new AppError(
        'Não é possível alterar configurações de aluno desativado.',
      );
    }

    if (input.hourlyRate <= 0) {
      throw new AppError('Informe o valor por hora.');
    }

    await validateStudentRecurrences.execute(
      existing.name,
      input.recurrences,
      studentId,
    );

    const oldRecurrences =
      await studentRecurrenceRepository.findByStudentId(studentId);

    await prisma.$transaction(async (tx) => {
      await studentRepository.update(
        studentId,
        { hourlyRate: input.hourlyRate },
        tx,
      );

      await studentRecurrenceRepository.deleteByStudentId(studentId, tx);

      const filledRecurrences = input.recurrences.filter(
        (recurrence) => recurrence.startTime && recurrence.endTime,
      );

      await studentRecurrenceRepository.createMany(
        filledRecurrences.map((recurrence) => ({
          studentId,
          weekday: recurrence.weekday,
          startTime: recurrence.startTime,
          endTime: recurrence.endTime,
        })),
        tx,
      );
    });

    await syncAgendaAfterSettingsChange.execute(
      studentId,
      input.hourlyRate,
      oldRecurrences.map((item) => ({
        weekday: item.weekday as CreateStudentRecurrenceInput['weekday'],
        startTime: item.startTime,
        endTime: item.endTime,
      })),
      input.recurrences,
    );

    const updated = await studentRepository.findByIdOrThrow(studentId);
    return buildStudentResponse.execute(updated);
  }
}

export const updateStudentSettings = new UpdateStudentSettings();
