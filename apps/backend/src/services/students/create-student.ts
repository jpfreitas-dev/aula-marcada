import type { Prisma } from '../../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import { classRepository } from '@/repositories/class-repository';
import { studentRecurrenceRepository } from '@/repositories/student-recurrence-repository';
import { studentRepository } from '@/repositories/student-repository';
import type { CreateStudentInput, StudentResponse } from '@/types/student';
import { buildStudentResponse } from '@/services/students/build-student-response';
import { validateDuplicateStudentName } from '@/services/students/validate-duplicate-student-name';
import { validateStudentRecurrences } from '@/services/students/validate-student-recurrences';
import { buildGeneratedClassData } from '@/services/students/recurrence-scheduler';
import { isValidPhone } from '@/utils/phone';

class CreateStudent {
  async execute(input: CreateStudentInput): Promise<StudentResponse> {
    const name = input.name.trim();
    const guardianName = input.guardianName.trim();
    const phone = input.phone.trim();

    if (!name) {
      throw new AppError('Informe o nome do aluno.');
    }

    if (!guardianName) {
      throw new AppError('Informe o nome do responsável.');
    }

    if (!isValidPhone(phone)) {
      throw new AppError('Informe um telefone válido.');
    }

    if (input.hourlyRate <= 0) {
      throw new AppError('Informe o valor por hora.');
    }

    await validateDuplicateStudentName.execute(name);

    const recurrences = input.recurrences ?? [];
    await validateStudentRecurrences.execute(name, recurrences);

    const student = await prisma.$transaction(async (tx) => {
      const created = await studentRepository.create(
        {
          name,
          guardianName,
          phone,
          hourlyRate: input.hourlyRate,
        },
        tx,
      );

      const filledRecurrences = recurrences.filter(
        (recurrence) => recurrence.startTime && recurrence.endTime,
      );

      if (filledRecurrences.length > 0) {
        await studentRecurrenceRepository.createMany(
          filledRecurrences.map((recurrence) => ({
            studentId: created.id,
            weekday: recurrence.weekday,
            startTime: recurrence.startTime,
            endTime: recurrence.endTime,
          })),
          tx,
        );
      }

      const occupied = await classRepository.getAllOccupiedSlotKeys(tx);
      const classesToCreate: Prisma.ClassCreateManyInput[] = [];

      for (const recurrence of filledRecurrences) {
        classesToCreate.push(
          ...buildGeneratedClassData(
            created.id,
            input.hourlyRate,
            recurrence,
            occupied,
          ),
        );
      }

      await classRepository.createMany(classesToCreate, tx);

      return created;
    });

    return buildStudentResponse.execute(student);
  }
}

export const createStudent = new CreateStudent();
