import { classAllocationRepository } from '@/repositories/class-allocation-repository';
import { paymentRepository } from '@/repositories/payment-repository';
import { studentRepository } from '@/repositories/student-repository';
import type { DatabaseClient } from '@/repositories/types';

export async function clearClassPaymentState(
  classId: string,
  studentId: string,
  db: DatabaseClient,
): Promise<void> {
  const { advancePix, advanceCash } =
    await classAllocationRepository.sumAdvanceByClassId(classId, db);

  if (advancePix > 0 || advanceCash > 0) {
    await studentRepository.restoreAdvanceBalance(
      studentId,
      advancePix,
      advanceCash,
      db,
    );
  }

  const paymentIds = await classAllocationRepository.deleteByClassId(
    classId,
    db,
  );
  await paymentRepository.deleteOrphanedByIds(paymentIds, db);
}
