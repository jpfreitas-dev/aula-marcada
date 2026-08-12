import {
  PaymentMethod,
  type Payment,
  type Prisma,
} from '../../generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { DatabaseClient } from '@/repositories/types';

function client(db?: DatabaseClient): DatabaseClient {
  return db ?? prisma;
}

class PaymentRepository {
  async create(
    data: Prisma.PaymentCreateInput,
    db?: DatabaseClient,
  ): Promise<Payment> {
    return client(db).payment.create({ data });
  }

  async deleteById(id: string, db?: DatabaseClient) {
    await client(db).payment.delete({ where: { id } });
  }

  async deleteOrphanedByIds(ids: string[], db?: DatabaseClient) {
    for (const id of ids) {
      const remaining = await client(db).classAllocation.count({
        where: { paymentId: id },
      });

      if (remaining === 0) {
        await this.deleteById(id, db);
      }
    }
  }
}

export const paymentRepository = new PaymentRepository();

export { PaymentMethod };
