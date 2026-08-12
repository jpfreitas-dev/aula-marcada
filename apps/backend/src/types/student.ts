export type StudentWeekday = 1 | 2 | 3 | 4 | 5;

export type StudentFinancialStatus =
  'up_to_date' | 'pending' | 'partial' | 'advance';

export type StudentResponse = {
  id: string;
  name: string;
  guardianName: string;
  phone: string;
  hourlyRate: number;
  advanceBalancePix: number;
  advanceBalanceCash: number;
  nextClassAt?: string;
  financialStatus: StudentFinancialStatus;
  active: boolean;
};

export type StudentRecurrenceResponse = {
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

export type RecurrenceOptionsInput = {
  studentId?: string;
  draftRecurrences: CreateStudentRecurrenceInput[];
  currentWeekday?: StudentWeekday;
};

export type WeekdayOption = {
  value: StudentWeekday;
  label: string;
};

export type RecurrenceOptionsResponse = {
  allWeekdays: WeekdayOption[];
  weekdayOptions: WeekdayOption[];
  defaultRow: Pick<
    CreateStudentRecurrenceInput,
    'weekday' | 'startTime' | 'endTime'
  > | null;
  hasAvailableWeekdays: boolean;
};

export type StudentListFilter = 'active' | 'inactive';
