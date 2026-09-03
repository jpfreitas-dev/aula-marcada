import type { PaymentMethod } from './payment';

export type AttendanceStatus = 'empty' | 'attended' | 'absent';

export type ClassFinancialStatus = 'pending' | 'partial' | 'settled';

export type ClassPeriod = 'morning' | 'afternoon';

export type ClassSession = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  period: ClassPeriod;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  expectedAmount: number;
  /** Total paid toward this class (paidPix + paidCash). */
  paidAmount: number;
  /** Portion paid/attributed as Pix (includes advance originally received as Pix). */
  paidPix: number;
  /** Portion paid/attributed as Cash (includes advance originally received as Cash). */
  paidCash: number;
  /** Advance (Pix origin) applied to this class when Compareceu was first saved. */
  advanceAppliedPix: number;
  /** Advance (Cash origin) applied to this class when Compareceu was first saved. */
  advanceAppliedCash: number;
  attendance: AttendanceStatus;
  financialStatus: ClassFinancialStatus;
  isMakeup: boolean;
  isMakeupOnly: boolean;
  linkedAbsenceIds: string[];
  pendingMakeupMinutes?: number;
  /** Single method when only one form contributed; omitted when mixed. */
  paymentMethod?: PaymentMethod;
  content?: string;
  notes?: string;
  hasManualAmountOverride?: boolean;
};

export type ClassBadgeVariant =
  'neutral' | 'danger' | 'info' | 'success' | 'warning';

export type ClassBadge = {
  label: string;
  variant: ClassBadgeVariant;
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

export type ClassDetailInput = {
  attendance: AttendanceStatus;
  paidAmount: number;
  paymentMethod?: PaymentMethod;
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

export type RescheduleClassInput = {
  date: string;
  period: ClassPeriod;
  startTime: string;
  durationMinutes: number;
};
