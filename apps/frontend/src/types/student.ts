export type Student = {
  id: string;
  name: string;
  guardianName: string;
  phone: string;
  email?: string;
  hourlyRate: number;
  advanceBalance: number;
  nextClassAt?: string;
  financialStatus: StudentFinancialStatus;
};

export type StudentFinancialStatus =
  'up_to_date' | 'pending' | 'partial' | 'advance';

export type StudentWeekday = 1 | 2 | 3 | 4 | 5;

export type StudentRecurrence = {
  id: string;
  studentId: string;
  weekday: StudentWeekday;
  startTime: string;
  endTime: string;
};

export type CreateStudentRecurrenceInput = {
  weekday: StudentWeekday;
  startTime: string;
  endTime: string;
};

export type CreateStudentInput = {
  name: string;
  guardianName: string;
  phone: string;
  hourlyRate: number;
  recurrences?: CreateStudentRecurrenceInput[];
};
