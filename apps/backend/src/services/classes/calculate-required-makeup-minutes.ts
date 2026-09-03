type AbsenceRecord = {
  pendingMakeupMinutes: number;
  durationMinutes: number;
};

type TargetClass = {
  durationMinutes: number;
  isMakeupOnly: boolean;
};

export function calculateRequiredMakeupMinutes(
  targetClass: TargetClass | null,
  absences: AbsenceRecord[],
  isMakeupOnly: boolean,
): number {
  const absenceMinutes = absences.reduce(
    (total, session) => total + session.pendingMakeupMinutes,
    0,
  );

  if (isMakeupOnly || !targetClass) {
    return absenceMinutes;
  }

  return targetClass.durationMinutes + absenceMinutes;
}
