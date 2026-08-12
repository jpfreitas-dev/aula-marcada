import { AttendanceStatus } from '../../../generated/prisma/client';
import { classRepository } from '@/repositories/class-repository';
import type { CreateStudentRecurrenceInput } from '@/types/student';
import { generateClassesForRecurrences } from '@/services/students/generate-classes-for-recurrences';
import { sessionMatchesAnyRecurrence } from '@/services/students/recurrence-scheduler';
import { calculateExpectedAmount } from '@/utils/class-value';
import { getDefaultAgendaDate, toDateKey } from '@/utils/workday';

class SyncAgendaAfterSettingsChange {
  async execute(
    studentId: string,
    hourlyRate: number,
    oldRecurrences: CreateStudentRecurrenceInput[],
    newRecurrences: CreateStudentRecurrenceInput[],
  ): Promise<void> {
    const cutoff = toDateKey(getDefaultAgendaDate());
    const filledNewRecurrences = newRecurrences.filter(
      (recurrence) => recurrence.startTime && recurrence.endTime,
    );

    const studentClasses = await classRepository.findByStudentId(studentId);
    const idsToDelete: string[] = [];
    const idsToUpdateExpected: string[] = [];

    for (const session of studentClasses) {
      const dateKey = toDateKey(session.date);
      const isPast = dateKey < cutoff;
      const isFilled = session.attendance !== AttendanceStatus.EMPTY;

      if (isPast || isFilled) {
        continue;
      }

      const matchedOld = sessionMatchesAnyRecurrence(session, oldRecurrences);
      const matchedNew = sessionMatchesAnyRecurrence(
        session,
        filledNewRecurrences,
      );

      if (matchedOld && !matchedNew) {
        idsToDelete.push(session.id);
        continue;
      }

      if (!session.hasManualAmountOverride) {
        idsToUpdateExpected.push(session.id);
      }
    }

    await classRepository.deleteManyByIds(idsToDelete);

    for (const session of studentClasses) {
      if (!idsToUpdateExpected.includes(session.id)) {
        continue;
      }

      const nextExpected = calculateExpectedAmount(
        session.durationMinutes,
        hourlyRate,
      );

      await classRepository.updateExpectedAmount(session.id, nextExpected);
    }

    await generateClassesForRecurrences.execute(
      studentId,
      hourlyRate,
      filledNewRecurrences,
    );
  }
}

export const syncAgendaAfterSettingsChange =
  new SyncAgendaAfterSettingsChange();
