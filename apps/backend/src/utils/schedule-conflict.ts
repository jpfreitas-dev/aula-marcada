import {
  periodFromPrisma,
  WEEKDAY_LABELS,
} from '@/services/students/recurrence-scheduler';
import type { ClassPeriod } from '@/types/class';
import type { ClassPeriod as PrismaClassPeriod } from '../../generated/prisma/client';
import { dateFromDateKey } from '@/utils/workday';

export const PERIOD_LABELS: Record<ClassPeriod, string> = {
  morning: 'manhã',
  afternoon: 'tarde/noite',
};

export function formatScheduleDateLabel(dateKey: string): string {
  const date = dateFromDateKey(dateKey);
  const weekday = WEEKDAY_LABELS[date.getDay()] ?? '';
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');

  return `${weekday}, ${day}/${month}`;
}

export function formatExistingClassConflict(
  studentName: string,
  dateKey: string,
  period: ClassPeriod,
): string {
  return `Já existe uma aula de ${studentName} em ${formatScheduleDateLabel(dateKey)} (${PERIOD_LABELS[period]}).`;
}

export function formatRecurrenceConflict(
  studentName: string,
  weekday: number,
  period: ClassPeriod,
): string {
  const weekdayLabel = WEEKDAY_LABELS[weekday] ?? '';
  return `Já existe aula recorrente de ${studentName} às ${weekdayLabel}s, ${PERIOD_LABELS[period]}.`;
}

export function formatSporadicClassConflict(
  studentName: string,
  dateKey: string,
  period: ClassPeriod,
): string {
  return `Há conflito com aula de ${studentName} em ${formatScheduleDateLabel(dateKey)} (${PERIOD_LABELS[period]}).`;
}

export function prismaPeriodToClassPeriod(
  period: PrismaClassPeriod,
): ClassPeriod {
  return periodFromPrisma(period);
}
