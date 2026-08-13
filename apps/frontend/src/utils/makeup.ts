import type { ClassSession } from '@/types';

type MakeupTargetClass = Pick<ClassSession, 'durationMinutes' | 'isMakeupOnly'>;

export function calculateRequiredMakeupMinutes(
  targetClass: MakeupTargetClass | null,
  absenceIds: string[],
  isMakeupOnly: boolean,
  absences: ClassSession[],
): number {
  const selectedAbsences = absences.filter((session) =>
    absenceIds.includes(session.id),
  );

  const absenceMinutes = selectedAbsences.reduce(
    (total, session) =>
      total + (session.pendingMakeupMinutes ?? session.durationMinutes),
    0,
  );

  if (isMakeupOnly || !targetClass) {
    return absenceMinutes;
  }

  return targetClass.durationMinutes + absenceMinutes;
}
