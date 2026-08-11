import { mockFinancialSummary } from '@/mocks';
import type { FinancialSummary } from '@/types';

export async function getFinancialSummary(): Promise<FinancialSummary> {
  return mockFinancialSummary;
}
