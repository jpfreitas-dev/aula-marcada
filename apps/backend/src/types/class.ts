export type PaymentMethod = 'pix' | 'cash';

export type ClassPeriod = 'morning' | 'afternoon';

export type AttendanceStatus = 'empty' | 'attended' | 'absent';

export type ClassFinancialStatus = 'pending' | 'partial' | 'settled';

export type ClassResponse = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  period: ClassPeriod;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  expectedAmount: number;
  paidAmount: number;
  paidPix: number;
  paidCash: number;
  advanceAppliedPix: number;
  advanceAppliedCash: number;
  attendance: AttendanceStatus;
  financialStatus: ClassFinancialStatus;
  isMakeup: boolean;
  isMakeupOnly: boolean;
  linkedAbsenceIds: string[];
  pendingMakeupMinutes?: number;
  paymentMethod?: PaymentMethod;
  content?: string;
  notes?: string;
  hasManualAmountOverride?: boolean;
};

export type CreateClassInput = {
  studentId: string;
  date: string;
  period: ClassPeriod;
  startTime: string;
  durationMinutes: number;
  expectedAmount: number;
  isMakeupOnly: boolean;
  linkedAbsenceIds: string[];
  hasManualAmountOverride?: boolean;
};

export type RescheduleClassInput = {
  date: string;
  period: ClassPeriod;
  startTime: string;
  durationMinutes: number;
};

export type UpdateClassAttendanceInput = {
  attendance: AttendanceStatus;
  content?: string;
  notes?: string;
};

export type LinkMakeupInput = {
  targetClassId?: string;
  studentId: string;
  absenceIds: string[];
  startTime: string;
  endTime: string;
  date?: string;
  period?: ClassPeriod;
};
