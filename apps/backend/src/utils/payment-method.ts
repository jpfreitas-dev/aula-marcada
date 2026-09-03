import { PaymentMethod as PrismaPaymentMethod } from '../../generated/prisma/client';
import type { PaymentMethod } from '@/types/class';

export function mapPaymentMethodToPrisma(
  method: PaymentMethod,
): PrismaPaymentMethod {
  return method === 'pix' ? PrismaPaymentMethod.PIX : PrismaPaymentMethod.CASH;
}
