import type { PaymentMethod } from '@/types/class';
import type { StudentResponse } from '@/types/student';

export type ReceiveStudentPaymentInput = {
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
};

export type ReceiveStudentPaymentResult = {
  student: StudentResponse;
  allocatedAmount: number;
  advanceAmount: number;
  settledClassIds: string[];
};
