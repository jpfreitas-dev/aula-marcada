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
