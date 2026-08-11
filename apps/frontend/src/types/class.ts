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
  paidAmount: number;
  attendance: AttendanceStatus;
  financialStatus: ClassFinancialStatus;
  isMakeup: boolean;
  linkedAbsenceId?: string;
  paymentMethod?: 'pix' | 'cash';
};

export type ClassBadgeVariant =
  'neutral' | 'danger' | 'info' | 'success' | 'warning';

export type ClassBadge = {
  label: string;
  variant: ClassBadgeVariant;
};
