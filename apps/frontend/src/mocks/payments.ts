import type { FinancialSummary, Payment } from '@/types';

export const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    studentId: 'student-joao',
    amount: 50,
    method: 'pix',
    paidAt: '2023-07-20T08:30:00',
  },
  {
    id: 'payment-2',
    studentId: 'student-pedro',
    amount: 25,
    method: 'cash',
    paidAt: '2023-07-21T11:00:00',
  },
];

export const mockFinancialSummary: FinancialSummary = {
  expected: 290,
  realized: 75,
  realizedPix: 50,
  realizedCash: 25,
  absenceImpact: 65,
};
