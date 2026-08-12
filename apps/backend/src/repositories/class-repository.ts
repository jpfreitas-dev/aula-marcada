import type { Class, Prisma } from '../../generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { DatabaseClient } from '@/repositories/types';
import { periodFromPrisma } from '@/services/students/recurrence-scheduler';

function client(db?: DatabaseClient): DatabaseClient {
  return db ?? prisma;
}

class ClassRepository {
  async findByStudentId(studentId: string, db?: DatabaseClient) {
    return client(db).class.findMany({ where: { studentId } });
  }

  async findSummaryByStudentId(studentId: string, db?: DatabaseClient) {
    return client(db).class.findMany({
      where: { studentId },
      select: {
        id: true,
        date: true,
        startTime: true,
        attendance: true,
        expectedAmount: true,
      },
    });
  }

  async findScheduleSlots(db?: DatabaseClient) {
    return client(db).class.findMany({
      select: {
        date: true,
        period: true,
        studentId: true,
      },
    });
  }

  async findPeriodSlots(db?: DatabaseClient) {
    return client(db).class.findMany({
      select: {
        date: true,
        period: true,
      },
    });
  }

  async getAllOccupiedSlotKeys(db?: DatabaseClient): Promise<Set<string>> {
    const classes = await this.findPeriodSlots(db);

    return new Set(
      classes.map(
        (session) =>
          `${session.date.toISOString().slice(0, 10)}-${periodFromPrisma(session.period)}`,
      ),
    );
  }

  async createMany(data: Prisma.ClassCreateManyInput[], db?: DatabaseClient) {
    if (data.length === 0) {
      return;
    }

    await client(db).class.createMany({ data });
  }

  async deleteManyByIds(ids: string[], db?: DatabaseClient) {
    if (ids.length === 0) {
      return;
    }

    await client(db).class.deleteMany({ where: { id: { in: ids } } });
  }

  async updateExpectedAmount(
    id: string,
    expectedAmount: number,
    db?: DatabaseClient,
  ): Promise<Class> {
    return client(db).class.update({
      where: { id },
      data: { expectedAmount },
    });
  }
}

export const classRepository = new ClassRepository();
