export type PaymentMethod = 'pix' | 'cash';

export type Payment = {
  id: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  note?: string;
};

export type FinancialSummary = {
  expected: number;
  realized: number;
  realizedPix: number;
  realizedCash: number;
  absenceImpact: number;
};
