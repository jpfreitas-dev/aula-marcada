import type { FinancialPieSlice } from '@/components/financial/financial-pie-chart';
import type {
  FinancialStudentAbsenceStat,
  FinancialStudentPaymentStat,
} from '@/data/financial-demo-data';
import { formatCurrency } from '@/utils/currency';

export const MAX_PIE_SLICES = 8;
const OTHERS_COLOR = '#94a3b8';

const STUDENT_COLORS: Record<string, string> = {
  'student-joao': '#6d28d9',
  'student-ana': '#10b981',
  'student-pedro': '#f59e0b',
  'student-maria': '#f43f5e',
};

const FALLBACK_COLORS = [
  '#6366f1',
  '#14b8a6',
  '#f97316',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#eab308',
  '#ef4444',
];

function getStudentColor(studentId: string, index: number): string {
  return (
    STUDENT_COLORS[studentId] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}

function sortByValueDesc<T extends { value: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => right.value - left.value);
}

type AggregateSlicesOptions = {
  formatOthersLegend?: (value: number) => string;
};

export function aggregateSlicesForPie(
  slices: FinancialPieSlice[],
  options: AggregateSlicesOptions = {},
): FinancialPieSlice[] {
  const sorted = sortByValueDesc(slices);

  if (sorted.length <= MAX_PIE_SLICES) {
    return sorted;
  }

  const visible = sorted.slice(0, MAX_PIE_SLICES - 1);
  const hidden = sorted.slice(MAX_PIE_SLICES - 1);
  const othersValue = hidden.reduce((sum, slice) => sum + slice.value, 0);

  return [
    ...visible,
    {
      id: 'others',
      label: 'Outros',
      value: othersValue,
      legendValue:
        options.formatOthersLegend?.(othersValue) ??
        formatCurrency(othersValue),
      color: OTHERS_COLOR,
    },
  ];
}

export function buildPaymentSlices(
  stats: FinancialStudentPaymentStat[],
): FinancialPieSlice[] {
  return sortByValueDesc(
    stats.map((stat, index) => ({
      id: stat.studentId,
      label: stat.studentName,
      value: stat.amount,
      legendValue: formatCurrency(stat.amount),
      color: getStudentColor(stat.studentId, index),
    })),
  );
}

export function buildAbsenceValueSlices(
  stats: FinancialStudentAbsenceStat[],
): FinancialPieSlice[] {
  return sortByValueDesc(
    stats.map((stat, index) => ({
      id: stat.studentId,
      label: stat.studentName,
      value: stat.absenceValue,
      legendValue: `- ${formatCurrency(stat.absenceValue)}`,
      color: getStudentColor(stat.studentId, index),
    })),
  );
}
