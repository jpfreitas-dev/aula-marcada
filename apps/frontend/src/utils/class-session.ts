import type { ClassSession } from '@/types';

type ClassSessionTiming = {
  date: string;
  endTime: string;
};

export function isClassSessionEnded(
  session: ClassSessionTiming,
  reference = new Date(),
): boolean {
  const endAt = new Date(`${session.date}T${session.endTime}:00`);
  return reference.getTime() >= endAt.getTime();
}

export function isMakeupFullyCovered(
  session: Pick<ClassSession, 'durationMinutes' | 'pendingMakeupMinutes'>,
): boolean {
  return (session.pendingMakeupMinutes ?? session.durationMinutes) === 0;
}

export function isLockedRepostaAbsence(
  session: Pick<
    ClassSession,
    'attendance' | 'durationMinutes' | 'pendingMakeupMinutes'
  >,
): boolean {
  return session.attendance === 'absent' && isMakeupFullyCovered(session);
}
