export type FinancialGranularity = 'week' | 'month' | 'year';

export type FinancialChartPoint = {
  label: string;
  expected: number;
  realized: number;
};

export type FinancialPendingItem = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  amount: number;
};

export type FinancialStudentPaymentStat = {
  studentId: string;
  studentName: string;
  amount: number;
};

export type FinancialStudentAbsenceStat = {
  studentId: string;
  studentName: string;
  absenceValue: number;
};

export type FinancialDashboardResponse = {
  expected: number;
  realized: number;
  realizedPix: number;
  realizedCash: number;
  absenceImpact: number;
  chart: FinancialChartPoint[];
  pending: FinancialPendingItem[];
  studentPayments: FinancialStudentPaymentStat[];
  studentAbsences: FinancialStudentAbsenceStat[];
};
