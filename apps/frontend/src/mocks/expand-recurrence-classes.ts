import type { ClassSession, Student } from '@/types';
import type { StudentRecurrence, StudentWeekday } from '@/types/student';
import { calculateExpectedAmount } from '@/utils/class-value';
import { minutesBetween, periodFromStartTime } from '@/utils/time';
import { addWorkdays, getDefaultAgendaDate, toDateKey } from '@/utils/workday';

/** Same horizon as student-service recurrence generation (~4 weeks of workdays). */
const RECURRENCE_GENERATION_WORKDAYS = 20;

function getRecurrenceDates(weekday: StudentWeekday): string[] {
  const base = getDefaultAgendaDate();
  const dates: string[] = [];

  for (let index = 0; index < RECURRENCE_GENERATION_WORKDAYS; index += 1) {
    const date = addWorkdays(base, index);
    if (date.getDay() === weekday) {
      dates.push(toDateKey(date));
    }
  }

  return dates;
}

/**
 * Fills the agenda horizon with empty classes from active students' recurrences,
 * without overwriting seed classes already occupying a date+period slot.
 */
export function expandRecurrenceClasses(
  seed: ClassSession[],
  students: Student[],
  recurrences: StudentRecurrence[],
): ClassSession[] {
  const occupied = new Set(
    seed.map((session) => `${session.date}-${session.period}`),
  );
  const studentById = new Map(students.map((student) => [student.id, student]));
  const generated: ClassSession[] = [];

  for (const recurrence of recurrences) {
    const student = studentById.get(recurrence.studentId);
    if (!student?.active) {
      continue;
    }

    const durationMinutes = minutesBetween(
      recurrence.startTime,
      recurrence.endTime,
    );
    const period = periodFromStartTime(recurrence.startTime);
    const expectedAmount = calculateExpectedAmount(
      durationMinutes,
      student.hourlyRate,
    );

    for (const date of getRecurrenceDates(recurrence.weekday)) {
      const slotKey = `${date}-${period}`;
      if (occupied.has(slotKey)) {
        continue;
      }

      occupied.add(slotKey);
      generated.push({
        id: `class-recurrence-${recurrence.id}-${date}`,
        studentId: student.id,
        studentName: student.name,
        date,
        period,
        startTime: recurrence.startTime,
        endTime: recurrence.endTime,
        durationMinutes,
        expectedAmount,
        paidAmount: 0,
        paidPix: 0,
        paidCash: 0,
        advanceAppliedPix: 0,
        advanceAppliedCash: 0,
        attendance: 'empty',
        financialStatus: 'pending',
        isMakeup: false,
        isMakeupOnly: false,
        linkedAbsenceIds: [],
      });
    }
  }

  return [...seed, ...generated];
}
