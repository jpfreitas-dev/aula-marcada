import type { Prisma, StudentRecurrence } from '../../generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { DatabaseClient } from '@/repositories/types';

function client(db?: DatabaseClient): DatabaseClient {
  return db ?? prisma;
}

class StudentRecurrenceRepository {
  async findByStudentId(studentId: string, db?: DatabaseClient) {
    return client(db).studentRecurrence.findMany({
      where: { studentId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findAllWithStudentActive(db?: DatabaseClient) {
    return client(db).studentRecurrence.findMany({
      select: {
        studentId: true,
        weekday: true,
        startTime: true,
        endTime: true,
        student: {
          select: { active: true },
        },
      },
    });
  }

  async deleteByStudentId(studentId: string, db?: DatabaseClient) {
    return client(db).studentRecurrence.deleteMany({ where: { studentId } });
  }

  async createMany(
    data: Prisma.StudentRecurrenceCreateManyInput[],
    db?: DatabaseClient,
  ) {
    if (data.length === 0) {
      return;
    }

    await client(db).studentRecurrence.createMany({ data });
  }
}

export const studentRecurrenceRepository = new StudentRecurrenceRepository();

export type StudentRecurrenceWithActive = StudentRecurrence & {
  student: { active: boolean };
};
