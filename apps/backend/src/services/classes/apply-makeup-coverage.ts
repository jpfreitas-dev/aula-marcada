import type { DatabaseClient } from '@/repositories/types';
import { classRepository } from '@/repositories/class-repository';
import { makeupLinkRepository } from '@/repositories/makeup-link-repository';

type AbsenceRecord = {
  id: string;
  pendingMakeupMinutes: number;
};

export async function restoreMakeupLinksForClass(
  makeupClassId: string,
  db: DatabaseClient,
): Promise<void> {
  const links = await makeupLinkRepository.findByMakeupClassId(
    makeupClassId,
    db,
  );

  for (const link of links) {
    const absence = await classRepository.findById(link.absenceClassId, db);

    if (!absence) {
      continue;
    }

    const restoredPending = Math.min(
      absence.durationMinutes,
      absence.pendingMakeupMinutes + link.coveredMinutes,
    );

    await classRepository.update(
      link.absenceClassId,
      { pendingMakeupMinutes: restoredPending },
      db,
    );
  }

  await makeupLinkRepository.deleteByMakeupClassId(makeupClassId, db);
}

export async function applyMakeupCoverage(
  makeupClassId: string,
  absences: AbsenceRecord[],
  availableMinutes: number,
  db: DatabaseClient,
): Promise<void> {
  let remaining = availableMinutes;
  const links: Array<{
    makeupClassId: string;
    absenceClassId: string;
    coveredMinutes: number;
  }> = [];

  for (const absence of absences) {
    const pending = absence.pendingMakeupMinutes;
    const covered = Math.min(pending, remaining);
    remaining -= covered;

    if (covered > 0) {
      links.push({
        makeupClassId,
        absenceClassId: absence.id,
        coveredMinutes: covered,
      });

      await classRepository.update(
        absence.id,
        { pendingMakeupMinutes: pending - covered },
        db,
      );
    }
  }

  await makeupLinkRepository.createMany(links, db);
}
