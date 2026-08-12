export type FinancialGranularity = 'week' | 'month' | 'year';

export type FinancialChartPoint = {
  label: string;
  expectedRatio: number;
  realizedRatio: number;
};

export type FinancialPendingItem = {
  id: string;
  studentId: string;
  studentName: string;
  dateLabel: string;
  amount: number;
};

export type FinancialStudentOption = {
  id: string;
  label: string;
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

export type FinancialDemoView = {
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

const WEEK_CHART: FinancialChartPoint[] = [
  { label: 'Seg', expectedRatio: 0.8, realizedRatio: 0.8 },
  { label: 'Ter', expectedRatio: 1, realizedRatio: 0.7 },
  { label: 'Qua', expectedRatio: 0.6, realizedRatio: 0.6 },
  { label: 'Qui', expectedRatio: 0.9, realizedRatio: 0.3 },
  { label: 'Sex', expectedRatio: 0.5, realizedRatio: 0.4 },
];

const MONTH_CHART: FinancialChartPoint[] = [
  { label: 'Sem 1', expectedRatio: 0.8, realizedRatio: 0.8 },
  { label: 'Sem 2', expectedRatio: 1, realizedRatio: 0.7 },
  { label: 'Sem 3', expectedRatio: 0.6, realizedRatio: 0.6 },
  { label: 'Sem 4', expectedRatio: 0.9, realizedRatio: 0.3 },
];

const YEAR_CHART: FinancialChartPoint[] = [
  { label: 'Jan', expectedRatio: 0.8, realizedRatio: 0.8 },
  { label: 'Fev', expectedRatio: 1, realizedRatio: 0.7 },
  { label: 'Mar', expectedRatio: 0.6, realizedRatio: 0.6 },
  { label: 'Abr', expectedRatio: 0.9, realizedRatio: 0.3 },
  { label: 'Mai', expectedRatio: 0.7, realizedRatio: 0.5 },
  { label: 'Jun', expectedRatio: 0.6, realizedRatio: 0.6 },
  { label: 'Jul', expectedRatio: 0.8, realizedRatio: 0.7 },
  { label: 'Ago', expectedRatio: 0.75, realizedRatio: 0.65 },
  { label: 'Set', expectedRatio: 0.8, realizedRatio: 0.7 },
  { label: 'Out', expectedRatio: 0.85, realizedRatio: 0.75 },
  { label: 'Nov', expectedRatio: 0.7, realizedRatio: 0.6 },
  { label: 'Dez', expectedRatio: 0.95, realizedRatio: 0.85 },
];

const PENDING_ITEMS: FinancialPendingItem[] = [
  {
    id: 'pending-1',
    studentId: 'student-joao',
    studentName: 'João',
    dateLabel: '13/07',
    amount: 50,
  },
  {
    id: 'pending-2',
    studentId: 'student-ana',
    studentName: 'Ana',
    dateLabel: '06/07',
    amount: 100,
  },
  {
    id: 'pending-3',
    studentId: 'student-pedro',
    studentName: 'Pedro',
    dateLabel: '28/07',
    amount: 30,
  },
];

export const FINANCIAL_STUDENT_OPTIONS: FinancialStudentOption[] = [
  { id: 'all', label: 'Todos os alunos' },
  { id: 'student-joao', label: 'João' },
  { id: 'student-ana', label: 'Ana' },
  { id: 'student-pedro', label: 'Pedro' },
  { id: 'student-maria', label: 'Maria' },
];

const STUDENT_PAYMENTS: FinancialStudentPaymentStat[] = [
  { studentId: 'student-joao', studentName: 'João', amount: 520 },
  { studentId: 'student-ana', studentName: 'Ana', amount: 380 },
  { studentId: 'student-pedro', studentName: 'Pedro', amount: 210 },
  { studentId: 'student-maria', studentName: 'Maria', amount: 140 },
];

const STUDENT_ABSENCES: FinancialStudentAbsenceStat[] = [
  {
    studentId: 'student-joao',
    studentName: 'João',
    absenceValue: 80,
  },
  {
    studentId: 'student-ana',
    studentName: 'Ana',
    absenceValue: 60,
  },
  {
    studentId: 'student-pedro',
    studentName: 'Pedro',
    absenceValue: 70,
  },
  {
    studentId: 'student-maria',
    studentName: 'Maria',
    absenceValue: 40,
  },
];

export function getFinancialDemoView(
  granularity: FinancialGranularity,
): FinancialDemoView {
  const chart =
    granularity === 'week'
      ? WEEK_CHART
      : granularity === 'month'
        ? MONTH_CHART
        : YEAR_CHART;

  return {
    expected: 1500,
    realized: 1250,
    realizedPix: 750,
    realizedCash: 500,
    absenceImpact: 250,
    chart,
    pending: PENDING_ITEMS,
    studentPayments: STUDENT_PAYMENTS,
    studentAbsences: STUDENT_ABSENCES,
  };
}
