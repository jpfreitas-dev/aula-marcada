import type { Class } from '../../../generated/prisma/client';
import { AttendanceStatus } from '../../../generated/prisma/client';

type AbsenceLike = {
  attendance: AttendanceStatus | string;
  durationMinutes: number;
  pendingMakeupMinutes: number;
};

export function isLockedRepostaAbsenceClass(classRecord: AbsenceLike): boolean {
  const attendance =
    classRecord.attendance === AttendanceStatus.ABSENT ||
    classRecord.attendance === 'absent';

  if (!attendance) {
    return false;
  }

  return classRecord.pendingMakeupMinutes === 0;
}

export function mapAttendanceFromPrisma(
  attendance: AttendanceStatus,
): 'empty' | 'attended' | 'absent' {
  if (attendance === AttendanceStatus.ATTENDED) {
    return 'attended';
  }

  if (attendance === AttendanceStatus.ABSENT) {
    return 'absent';
  }

  return 'empty';
}

export function dateKeyFromClass(classRecord: Pick<Class, 'date'>): string {
  return classRecord.date.toISOString().slice(0, 10);
}
