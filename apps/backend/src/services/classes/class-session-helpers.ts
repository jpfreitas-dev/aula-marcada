import type { Class } from '../../../generated/prisma/client';
import { AttendanceStatus } from '../../../generated/prisma/client';
import { toDateKey } from '@/utils/workday';

type ClassSessionTiming = {
  date: Date;
  endTime: string;
};

type AbsenceLike = {
  attendance: AttendanceStatus | string;
  durationMinutes: number;
  pendingMakeupMinutes: number;
};

export function isClassSessionEnded(
  classRecord: ClassSessionTiming,
  reference = new Date(),
): boolean {
  const dateKey = dateKeyFromClass(classRecord);
  const endAt = new Date(`${dateKey}T${classRecord.endTime}:00`);
  return reference.getTime() >= endAt.getTime();
}

export function isMakeupFullyCovered(
  classRecord: Pick<AbsenceLike, 'durationMinutes' | 'pendingMakeupMinutes'>,
): boolean {
  return classRecord.pendingMakeupMinutes === 0;
}

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

export function mapAttendanceToPrisma(
  attendance: 'empty' | 'attended' | 'absent',
): AttendanceStatus {
  if (attendance === 'attended') {
    return AttendanceStatus.ATTENDED;
  }

  if (attendance === 'absent') {
    return AttendanceStatus.ABSENT;
  }

  return AttendanceStatus.EMPTY;
}

export function dateKeyFromClass(classRecord: Pick<Class, 'date'>): string {
  return toDateKey(classRecord.date);
}
