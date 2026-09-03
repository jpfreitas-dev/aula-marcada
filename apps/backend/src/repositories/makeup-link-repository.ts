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

  async findAbsenceIdsByMakeupClassIds(
    makeupClassIds: string[],
    db?: DatabaseClient,
  ): Promise<Map<string, string[]>> {
    if (makeupClassIds.length === 0) {
      return new Map();
    }

    const links = await client(db).makeupLink.findMany({
      where: { makeupClassId: { in: makeupClassIds } },
      select: { makeupClassId: true, absenceClassId: true },
    });

    const map = new Map<string, string[]>();
    for (const link of links) {
      const existing = map.get(link.makeupClassId) ?? [];
      existing.push(link.absenceClassId);
      map.set(link.makeupClassId, existing);
    }

    return map;
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

  async deleteByClassIds(classIds: string[], db?: DatabaseClient) {
    if (classIds.length === 0) {
      return;
    }

    await client(db).makeupLink.deleteMany({
      where: {
        OR: [
          { makeupClassId: { in: classIds } },
          { absenceClassId: { in: classIds } },
        ],
      },
    });
  }

  async createMany(
    data: Array<{
      makeupClassId: string;
      absenceClassId: string;
      coveredMinutes: number;
    }>,
    db?: DatabaseClient,
  ) {
    if (data.length === 0) {
      return;
    }

    await client(db).makeupLink.createMany({ data });
  }
}

export const makeupLinkRepository = new MakeupLinkRepository();
