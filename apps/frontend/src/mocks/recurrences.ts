import type { StudentRecurrence } from '@/types/student';
import { addWorkdays, getDefaultAgendaDate } from '@/utils/workday';

function weekdayFromWorkdayOffset(
  offset: number,
): StudentRecurrence['weekday'] {
  return addWorkdays(
    getDefaultAgendaDate(),
    offset,
  ).getDay() as StudentRecurrence['weekday'];
}

/**
 * Recurrences aligned with mock classes:
 * - João: today (offset 0) morning 08:00–09:00 (today's class is already filled;
 *   horizon still generates future same-weekday empties).
 * - Pedro: tomorrow morning 10:00–11:00.
 * - Ana: tomorrow afternoon 14:00–15:00.
 * Lucas (ex-aluno) has no recurrence.
 */
export function createInitialRecurrences(): StudentRecurrence[] {
  return [
    {
      id: 'recurrence-joao-morning',
      studentId: 'student-joao',
      weekday: weekdayFromWorkdayOffset(0),
      startTime: '08:00',
      endTime: '09:00',
    },
    {
      id: 'recurrence-pedro-morning',
      studentId: 'student-pedro',
      weekday: weekdayFromWorkdayOffset(1),
      startTime: '10:00',
      endTime: '11:00',
    },
    {
      id: 'recurrence-ana-afternoon',
      studentId: 'student-ana',
      weekday: weekdayFromWorkdayOffset(1),
      startTime: '14:00',
      endTime: '15:00',
    },
  ];
}
