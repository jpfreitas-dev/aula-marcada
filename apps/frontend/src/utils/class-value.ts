import type { ClassFinancialStatus } from '@/types';

export function calculateExpectedAmount(
  durationMinutes: number,
  hourlyRate: number,
): number {
  return Math.round((durationMinutes / 60) * hourlyRate * 100) / 100;
}

export function computeFinancialStatus(
  expectedAmount: number,
  paidAmount: number,
): ClassFinancialStatus {
  if (paidAmount >= expectedAmount) {
    return 'settled';
  }

  if (paidAmount > 0) {
    return 'partial';
  }

  return 'pending';
}

export type StudentPendingSummary = {
  amount: number;
  lessonCount: number;
};

export function calculateStudentPendingSummary(
  sessions: Array<{
    attendance: string;
    expectedAmount: number;
    paidAmount: number;
  }>,
): StudentPendingSummary {
  return sessions.reduce<StudentPendingSummary>(
    (summary, session) => {
      if (session.attendance !== 'attended') {
        return summary;
      }

      const pending = Math.max(session.expectedAmount - session.paidAmount, 0);
      if (pending <= 0) {
        return summary;
      }

      return {
        amount: summary.amount + pending,
        lessonCount: summary.lessonCount + 1,
      };
    },
    { amount: 0, lessonCount: 0 },
  );
}

export function calculateStudentPendingAmount(
  sessions: Array<{
    attendance: string;
    expectedAmount: number;
    paidAmount: number;
  }>,
): number {
  return calculateStudentPendingSummary(sessions).amount;
}

export function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/[^\d,]/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrencyInput(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencyInputFromRaw(
  raw: string,
  maxAmount?: number,
): string {
  const digits = raw.replace(/\D/g, '');
  const cents = digits === '' ? 0 : Number(digits);
  let amount = cents / 100;

  if (maxAmount !== undefined) {
    amount = Math.min(amount, maxAmount);
  }

  return formatCurrencyInput(amount);
}
