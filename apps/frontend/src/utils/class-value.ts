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
