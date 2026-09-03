import {
  ClassPeriod,
  type Class,
  type Prisma,
} from '../../generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { DatabaseClient } from '@/repositories/types';
import {
  periodFromPrisma,
  periodToPrisma,
} from '@/services/students/recurrence-scheduler';
import { dateFromDateKey, toDateKey } from '@/utils/workday';

function client(db?: DatabaseClient): DatabaseClient {
  return db ?? prisma;
}

class ClassRepository {
  async findById(id: string, db?: DatabaseClient) {
    return client(db).class.findUnique({
      where: { id },
      include: { student: true },
    });
  }

  async findByDateKey(dateKey: string, db?: DatabaseClient) {
    const date = dateFromDateKey(dateKey);
    return client(db).class.findMany({
      where: { date },
      include: { student: true },
      orderBy: [{ startTime: 'asc' }],
    });
  }

  async findByDateKeys(dateKeys: string[], db?: DatabaseClient) {
    const dates = dateKeys.map((key) => dateFromDateKey(key));
    return client(db).class.findMany({
      where: { date: { in: dates } },
      include: { student: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findByDateKeyAndPeriod(
    dateKey: string,
    period: ClassPeriod,
    excludeClassId?: string,
    db?: DatabaseClient,
  ) {
    return client(db).class.findFirst({
      where: {
        date: dateFromDateKey(dateKey),
        period,
        ...(excludeClassId ? { id: { not: excludeClassId } } : {}),
      },
    });
  }

  async findOccupiedPeriodsByDateKey(
    dateKey: string,
    excludeClassId?: string,
    db?: DatabaseClient,
  ): Promise<ClassPeriod[]> {
    const classes = await client(db).class.findMany({
      where: {
        date: dateFromDateKey(dateKey),
        ...(excludeClassId ? { id: { not: excludeClassId } } : {}),
      },
      select: { period: true },
    });

    return classes.map((item) => item.period);
  }

  async findByStudentId(
    studentId: string,
    limit?: number,
    db?: DatabaseClient,
  ) {
    return client(db).class.findMany({
      where: { studentId },
      include: { student: true },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      ...(limit ? { take: limit } : {}),
    });
  }

  async findPendingAbsencesByStudentId(studentId: string, db?: DatabaseClient) {
    return client(db).class.findMany({
      where: {
        studentId,
        attendance: 'ABSENT',
        pendingMakeupMinutes: { gt: 0 },
      },
      include: { student: true },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
  }

  async findAttendedByStudentId(studentId: string, db?: DatabaseClient) {
    return client(db).class.findMany({
      where: {
        studentId,
        attendance: 'ATTENDED',
      },
      include: { student: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
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

  async findSummaryByStudentIds(studentIds: string[], db?: DatabaseClient) {
    if (studentIds.length === 0) {
      return [];
    }

    return client(db).class.findMany({
      where: { studentId: { in: studentIds } },
      select: {
        id: true,
        studentId: true,
        date: true,
        startTime: true,
        attendance: true,
        expectedAmount: true,
      },
    });
  }

  async findLatestDateByStudentIds(
    studentIds: string[],
    db?: DatabaseClient,
  ): Promise<Map<string, Date>> {
    if (studentIds.length === 0) {
      return new Map();
    }

    const rows = await client(db).class.groupBy({
      by: ['studentId'],
      where: { studentId: { in: studentIds } },
      _max: { date: true },
    });

    const map = new Map<string, Date>();
    for (const row of rows) {
      if (row._max.date) {
        map.set(row.studentId, row._max.date);
      }
    }

    return map;
  }

  async findScheduleSlots(db?: DatabaseClient) {
    return client(db).class.findMany({
      select: {
        date: true,
        period: true,
        studentId: true,
        student: {
          select: { name: true },
        },
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
          `${toDateKey(session.date)}-${periodFromPrisma(session.period)}`,
      ),
    );
  }

  async create(
    data: Prisma.ClassCreateInput,
    db?: DatabaseClient,
  ): Promise<Class> {
    return client(db).class.create({ data });
  }

  async createMany(data: Prisma.ClassCreateManyInput[], db?: DatabaseClient) {
    if (data.length === 0) {
      return;
    }

    await client(db).class.createMany({ data });
  }

  async update(
    id: string,
    data: Prisma.ClassUpdateInput,
    db?: DatabaseClient,
  ): Promise<Class> {
    return client(db).class.update({ where: { id }, data });
  }

  async deleteById(id: string, db?: DatabaseClient) {
    await client(db).class.delete({ where: { id } });
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

export { periodToPrisma };
