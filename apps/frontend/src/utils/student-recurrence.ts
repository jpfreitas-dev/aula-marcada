import type { StudentRecurrence, StudentWeekday } from '@/types';

const WEEKDAY_LABELS: Record<StudentWeekday, string> = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
};

export function formatStudentRecurrenceLabel(
  recurrence: StudentRecurrence,
): string {
  return `${WEEKDAY_LABELS[recurrence.weekday]}, ${recurrence.startTime} - ${recurrence.endTime}`;
}
