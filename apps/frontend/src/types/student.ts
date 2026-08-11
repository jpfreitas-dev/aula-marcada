export type Student = {
  id: string;
  name: string;
  guardianName: string;
  phone: string;
  email?: string;
  hourlyRate: number;
  /** Advance received via Pix that has not yet been consumed by classes. */
  advanceBalancePix: number;
  /** Advance received via Cash that has not yet been consumed by classes. */
  advanceBalanceCash: number;
  nextClassAt?: string;
  financialStatus: StudentFinancialStatus;
  active: boolean;
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

export type UpdateStudentPersonalInput = {
  name: string;
  guardianName: string;
  phone: string;
};

export type UpdateStudentSettingsInput = {
  hourlyRate: number;
  recurrences: CreateStudentRecurrenceInput[];
};
