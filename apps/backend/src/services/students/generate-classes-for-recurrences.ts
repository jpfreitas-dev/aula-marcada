import type { Prisma } from '../../../generated/prisma/client';
import { classRepository } from '@/repositories/class-repository';
import type { CreateStudentRecurrenceInput } from '@/types/student';
import type { DatabaseClient } from '@/repositories/types';
import { buildGeneratedClassData } from '@/services/students/recurrence-scheduler';

class GenerateClassesForRecurrences {
  async execute(
    studentId: string,
    hourlyRate: number,
    recurrences: CreateStudentRecurrenceInput[],
    db?: DatabaseClient,
  ): Promise<void> {
    const occupied = await classRepository.getAllOccupiedSlotKeys(db);
    const toCreate: Prisma.ClassCreateManyInput[] = [];

    for (const recurrence of recurrences) {
      toCreate.push(
        ...buildGeneratedClassData(studentId, hourlyRate, recurrence, occupied),
      );
    }

    await classRepository.createMany(toCreate, db);
  }
}

export const generateClassesForRecurrences =
  new GenerateClassesForRecurrences();
