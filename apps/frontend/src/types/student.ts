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

export type ReceiveStudentPaymentInput = {
  studentId: string;
  amount: number;
  paymentMethod: 'pix' | 'cash';
};

export type ReceiveStudentPaymentResult = {
  student: Student;
  allocatedAmount: number;
  advanceAmount: number;
  settledClassIds: string[];
};
