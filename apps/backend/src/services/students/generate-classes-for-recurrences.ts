import type { Prisma } from '../../../generated/prisma/client';
import { classRepository } from '@/repositories/class-repository';
import type { CreateStudentRecurrenceInput } from '@/types/student';
import type { DatabaseClient } from '@/repositories/types';
import {
  buildGeneratedClassData,
  periodFromPrisma,
} from '@/services/students/recurrence-scheduler';
import { toDateKey } from '@/utils/workday';

class GenerateClassesForRecurrences {
  async execute(
    studentId: string,
    hourlyRate: number,
    recurrences: CreateStudentRecurrenceInput[],
    db?: DatabaseClient,
    occupied?: Set<string>,
  ): Promise<void> {
    const slotKeys =
      occupied ?? (await classRepository.getAllOccupiedSlotKeys(db));
    const toCreate: Prisma.ClassCreateManyInput[] = [];

    for (const recurrence of recurrences) {
      toCreate.push(
        ...buildGeneratedClassData(studentId, hourlyRate, recurrence, slotKeys),
      );
    }

    await classRepository.createMany(toCreate, db);

    for (const item of toCreate) {
      slotKeys.add(`${toDateKey(item.date)}-${periodFromPrisma(item.period)}`);
    }
  }
}

export const generateClassesForRecurrences =
  new GenerateClassesForRecurrences();
