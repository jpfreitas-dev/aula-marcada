import type { StudentPendingSummary } from '@/utils/class-value';

export type StudentFinancialStatus =
  'up_to_date' | 'pending' | 'partial' | 'advance';

type StudentBalanceInput = {
  advanceBalancePix: number;
  advanceBalanceCash: number;
  hourlyRate: number;
};

export function getStudentAdvanceBalance(student: StudentBalanceInput): number {
  return student.advanceBalancePix + student.advanceBalanceCash;
}

export function resolveStudentFinancialStatus(
  student: StudentBalanceInput,
  pending: StudentPendingSummary,
): StudentFinancialStatus {
  if (pending.amount > 0) {
    return 'pending';
  }

  if (getStudentAdvanceBalance(student) > 0) {
    return 'advance';
  }

  return 'up_to_date';
}
