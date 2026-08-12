import { prisma } from '@/lib/prisma';
import type { DatabaseClient } from '@/repositories/types';
import { AllocationSource } from '../../generated/prisma/client';

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
        Number(item._sum.amount?.toString() ?? '0'),
      ]),
    );
  }

  async getPaymentBreakdownByClassIds(
    classIds: string[],
    db?: DatabaseClient,
  ): Promise<
    Map<
      string,
      {
        paidPix: number;
        paidCash: number;
        advanceAppliedPix: number;
        advanceAppliedCash: number;
      }
    >
  > {
    if (classIds.length === 0) {
      return new Map();
    }

    const allocations = await client(db).classAllocation.findMany({
      where: { classId: { in: classIds } },
    });

    const map = new Map<
      string,
      {
        paidPix: number;
        paidCash: number;
        advanceAppliedPix: number;
        advanceAppliedCash: number;
      }
    >();

    for (const allocation of allocations) {
      const current = map.get(allocation.classId) ?? {
        paidPix: 0,
        paidCash: 0,
        advanceAppliedPix: 0,
        advanceAppliedCash: 0,
      };
      const amount = Number(allocation.amount.toString());

      if (allocation.source === AllocationSource.ADVANCE_PIX) {
        current.advanceAppliedPix += amount;
        current.paidPix += amount;
      } else if (allocation.source === AllocationSource.ADVANCE_CASH) {
        current.advanceAppliedCash += amount;
        current.paidCash += amount;
      } else if (allocation.method === 'PIX') {
        current.paidPix += amount;
      } else {
        current.paidCash += amount;
      }

      map.set(allocation.classId, current);
    }

    return map;
  }

  async sumAdvanceByClassId(classId: string, db?: DatabaseClient) {
    const allocations = await client(db).classAllocation.findMany({
      where: {
        classId,
        source: {
          in: [AllocationSource.ADVANCE_PIX, AllocationSource.ADVANCE_CASH],
        },
      },
    });

    let advancePix = 0;
    let advanceCash = 0;

    for (const allocation of allocations) {
      const amount = Number(allocation.amount.toString());
      if (allocation.source === AllocationSource.ADVANCE_PIX) {
        advancePix += amount;
      } else {
        advanceCash += amount;
      }
    }

    return { advancePix, advanceCash };
  }

  async deleteByClassId(classId: string, db?: DatabaseClient) {
    const allocations = await client(db).classAllocation.findMany({
      where: { classId },
      select: { paymentId: true },
    });

    const paymentIds = [
      ...new Set(
        allocations
          .map((item) => item.paymentId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    await client(db).classAllocation.deleteMany({ where: { classId } });

    return paymentIds;
  }

  async create(
    data: {
      classId: string;
      amount: number;
      method: import('../../generated/prisma/client').PaymentMethod;
      source: AllocationSource;
      paymentId?: string;
    },
    db?: DatabaseClient,
  ) {
    return client(db).classAllocation.create({
      data: {
        classId: data.classId,
        amount: data.amount,
        method: data.method,
        source: data.source,
        paymentId: data.paymentId,
      },
    });
  }
}

export const classAllocationRepository = new ClassAllocationRepository();
