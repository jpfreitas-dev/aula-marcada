import { prisma } from '@/lib/prisma';
import type { DatabaseClient } from '@/repositories/types';
import { dateFromDateKey } from '@/utils/workday';

function client(db?: DatabaseClient): DatabaseClient {
  return db ?? prisma;
}

class FinancialRepository {
  async findClassesInPeriod(
    startDate: string,
    endDate: string,
    studentId?: string,
    db?: DatabaseClient,
  ) {
    return client(db).class.findMany({
      where: {
        date: {
          gte: dateFromDateKey(startDate),
          lte: dateFromDateKey(endDate),
        },
        ...(studentId ? { studentId } : {}),
      },
      include: { student: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }
}

export const financialRepository = new FinancialRepository();
