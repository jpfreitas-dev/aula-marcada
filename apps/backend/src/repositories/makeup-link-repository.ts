import { prisma } from '@/lib/prisma';
import type { DatabaseClient } from '@/repositories/types';

function client(db?: DatabaseClient): DatabaseClient {
  return db ?? prisma;
}

class MakeupLinkRepository {
  async findAbsenceIdsByMakeupClassId(
    makeupClassId: string,
    db?: DatabaseClient,
  ) {
    const links = await client(db).makeupLink.findMany({
      where: { makeupClassId },
      select: { absenceClassId: true },
    });

    return links.map((link) => link.absenceClassId);
  }

  async findByMakeupClassId(makeupClassId: string, db?: DatabaseClient) {
    return client(db).makeupLink.findMany({ where: { makeupClassId } });
  }

  async deleteByMakeupClassId(makeupClassId: string, db?: DatabaseClient) {
    await client(db).makeupLink.deleteMany({ where: { makeupClassId } });
  }

  async deleteByAbsenceClassId(absenceClassId: string, db?: DatabaseClient) {
    await client(db).makeupLink.deleteMany({ where: { absenceClassId } });
  }
}

export const makeupLinkRepository = new MakeupLinkRepository();
