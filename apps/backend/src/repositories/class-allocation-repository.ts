import { prisma } from '@/lib/prisma';
import { roundMoney } from '@/utils/money';
import type { DatabaseClient } from '@/repositories/types';

function client(db?: DatabaseClient): DatabaseClient {
  return db ?? prisma;
}

class ClassAllocationRepository {
  async sumPaidAmountsByClassIds(
    classIds: string[],
    db?: DatabaseClient,
  ): Promise<Map<string, number>> {
    if (classIds.length === 0) {
      return new Map();
    }

    const allocations = await client(db).classAllocation.groupBy({
      by: ['classId'],
      where: { classId: { in: classIds } },
      _sum: { amount: true },
    });

    return new Map(
      allocations.map((item) => [
        item.classId,
        roundMoney(Number(item._sum.amount?.toString() ?? '0')),
      ]),
    );
  }
}

export const classAllocationRepository = new ClassAllocationRepository();
