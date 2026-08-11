export type Student = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  hourlyRate: number;
  advanceBalance: number;
  nextClassAt?: string;
  financialStatus: StudentFinancialStatus;
};

export type StudentFinancialStatus =
  'up_to_date' | 'pending' | 'partial' | 'advance';
