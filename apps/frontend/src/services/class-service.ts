import { mockClasses } from '@/mocks';
import type { ClassPeriod, ClassSession } from '@/types';
import { toDateKey } from '@/utils/workday';

export async function listClassesByDate(date: Date): Promise<ClassSession[]> {
  const dateKey = toDateKey(date);
  return mockClasses.filter((session) => session.date === dateKey);
}

export async function listClassesByWeek(
  weekStart: Date,
): Promise<ClassSession[]> {
  const dates = Array.from({ length: 5 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return toDateKey(day);
  });

  return mockClasses.filter((session) => dates.includes(session.date));
}

export function getSessionForPeriod(
  sessions: ClassSession[],
  period: ClassPeriod,
): ClassSession | undefined {
  return sessions.find((session) => session.period === period);
}

export async function getClassById(id: string): Promise<ClassSession | null> {
  return mockClasses.find((session) => session.id === id) ?? null;
}
