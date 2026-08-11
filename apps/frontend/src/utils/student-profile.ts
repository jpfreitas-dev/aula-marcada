import type { ClassSession } from '@/types';
import { addWorkdays, getWeekStart } from '@/utils/workday';

export type AttendancePeriod = 'week' | 'month' | 'year' | 'all';

function getSessionStartDateTime(session: ClassSession): Date {
  const [hours, minutes] = session.startTime.split(':').map(Number);
  const date = new Date(`${session.date}T12:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function isSessionInPeriod(
  session: ClassSession,
  period: AttendancePeriod,
  reference: Date,
): boolean {
  const sessionDate = new Date(`${session.date}T12:00:00`);

  if (period === 'all') {
    return true;
  }

  if (period === 'week') {
    const weekStart = getWeekStart(reference);
    const weekEnd = addWorkdays(weekStart, 4);
    weekEnd.setHours(23, 59, 59, 999);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  }

  if (period === 'month') {
    return (
      sessionDate.getFullYear() === reference.getFullYear() &&
      sessionDate.getMonth() === reference.getMonth()
    );
  }

  return sessionDate.getFullYear() === reference.getFullYear();
}

function isSessionPast(session: ClassSession, reference: Date): boolean {
  return getSessionStartDateTime(session) <= reference;
}

export function calculateAttendanceStats(
  sessions: ClassSession[],
  period: AttendancePeriod,
  reference = new Date(),
): { present: number; total: number } {
  const pastSessionsInPeriod = sessions.filter(
    (session) =>
      isSessionInPeriod(session, period, reference) &&
      isSessionPast(session, reference),
  );

  return {
    present: pastSessionsInPeriod.filter(
      (session) => session.attendance === 'attended',
    ).length,
    total: pastSessionsInPeriod.length,
  };
}

export function getAttendanceProgressPercent(
  present: number,
  total: number,
): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((present / total) * 100);
}
