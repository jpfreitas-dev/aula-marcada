import type { ClassSession } from '@/types';
import { addWorkdays, getDefaultAgendaDate, toDateKey } from '@/utils/workday';

function mockDate(offsetWorkdays: number): string {
  const base = getDefaultAgendaDate();
  return toDateKey(addWorkdays(base, offsetWorkdays));
}

function mockDateAfterRecurrenceHorizon(weekday: number): string {
  const today = getDefaultAgendaDate();
  const afterHorizon = addWorkdays(today, 21);
  const date = new Date(afterHorizon);

  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() + 1);
  }

  return toDateKey(date);
}

export function createInitialClasses(): ClassSession[] {
  return [
    {
      id: 'class-joao-morning',
      studentId: 'student-joao',
      studentName: 'João',
      date: mockDate(0),
      period: 'morning',
      startTime: '08:00',
      endTime: '09:00',
      durationMinutes: 60,
      expectedAmount: 50,
      paidAmount: 50,
      attendance: 'attended',
      financialStatus: 'settled',
      isMakeup: false,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
      paymentMethod: 'pix',
    },
    {
      id: 'class-maria-recent-1',
      studentId: 'student-maria',
      studentName: 'Maria',
      date: mockDate(-1),
      period: 'morning',
      startTime: '08:00',
      endTime: '09:00',
      durationMinutes: 60,
      expectedAmount: 60,
      paidAmount: 0,
      attendance: 'absent',
      financialStatus: 'pending',
      isMakeup: false,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
      pendingMakeupMinutes: 60,
    },
    {
      id: 'class-maria-recent-2',
      studentId: 'student-maria',
      studentName: 'Maria',
      date: mockDate(-2),
      period: 'afternoon',
      startTime: '19:00',
      endTime: '20:00',
      durationMinutes: 60,
      expectedAmount: 60,
      paidAmount: 0,
      attendance: 'absent',
      financialStatus: 'pending',
      isMakeup: false,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
      pendingMakeupMinutes: 60,
    },
    {
      id: 'class-pedro-morning',
      studentId: 'student-pedro',
      studentName: 'Pedro',
      date: mockDate(1),
      period: 'morning',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      expectedAmount: 55,
      paidAmount: 25,
      attendance: 'attended',
      financialStatus: 'partial',
      isMakeup: false,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
      paymentMethod: 'cash',
    },
    {
      id: 'class-ana-afternoon',
      studentId: 'student-ana',
      studentName: 'Ana',
      date: mockDate(1),
      period: 'afternoon',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      expectedAmount: 65,
      paidAmount: 0,
      attendance: 'absent',
      financialStatus: 'pending',
      isMakeup: false,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
      pendingMakeupMinutes: 60,
    },
    {
      id: 'class-carlos-afternoon',
      studentId: 'student-carlos',
      studentName: 'Carlos',
      date: mockDate(2),
      period: 'afternoon',
      startTime: '18:00',
      endTime: '19:30',
      durationMinutes: 90,
      expectedAmount: 75,
      paidAmount: 0,
      attendance: 'absent',
      financialStatus: 'pending',
      isMakeup: false,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
      pendingMakeupMinutes: 90,
    },
    {
      id: 'class-maria-sporadic-next-month',
      studentId: 'student-maria',
      studentName: 'Maria',
      date: mockDateAfterRecurrenceHorizon(5),
      period: 'afternoon',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      expectedAmount: 60,
      paidAmount: 0,
      attendance: 'empty',
      financialStatus: 'pending',
      isMakeup: false,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    },
  ];
}
