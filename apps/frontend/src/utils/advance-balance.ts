import type { PaymentMethod, Student } from '@/types';

export type AdvanceBuckets = {
  advanceBalancePix: number;
  advanceBalanceCash: number;
};

export type AdvanceConsumption = {
  usedPix: number;
  usedCash: number;
  usedTotal: number;
  remainingPix: number;
  remainingCash: number;
  remainingTotal: number;
};

export function getAdvanceBalanceTotal(buckets: AdvanceBuckets): number {
  return roundMoney(buckets.advanceBalancePix + buckets.advanceBalanceCash);
}

export function getStudentAdvanceBalance(
  student: Pick<Student, 'advanceBalancePix' | 'advanceBalanceCash'>,
): number {
  return getAdvanceBalanceTotal(student);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Consume advance FIFO: Pix credits first, then Cash. */
export function consumeAdvanceBalance(
  buckets: AdvanceBuckets,
  amount: number,
): AdvanceConsumption {
  const target = Math.max(0, roundMoney(amount));
  const usedPix = Math.min(Math.max(buckets.advanceBalancePix, 0), target);
  const remainingAfterPix = roundMoney(target - usedPix);
  const usedCash = Math.min(
    Math.max(buckets.advanceBalanceCash, 0),
    remainingAfterPix,
  );
  const usedTotal = roundMoney(usedPix + usedCash);

  return {
    usedPix: roundMoney(usedPix),
    usedCash: roundMoney(usedCash),
    usedTotal,
    remainingPix: roundMoney(Math.max(buckets.advanceBalancePix, 0) - usedPix),
    remainingCash: roundMoney(
      Math.max(buckets.advanceBalanceCash, 0) - usedCash,
    ),
    remainingTotal: roundMoney(
      Math.max(buckets.advanceBalancePix, 0) +
        Math.max(buckets.advanceBalanceCash, 0) -
        usedTotal,
    ),
  };
}

export function addAdvanceByMethod(
  buckets: AdvanceBuckets,
  amount: number,
  method: PaymentMethod,
): AdvanceBuckets {
  const credit = Math.max(0, roundMoney(amount));
  if (credit <= 0) {
    return {
      advanceBalancePix: roundMoney(Math.max(buckets.advanceBalancePix, 0)),
      advanceBalanceCash: roundMoney(Math.max(buckets.advanceBalanceCash, 0)),
    };
  }

  if (method === 'pix') {
    return {
      advanceBalancePix: roundMoney(
        Math.max(buckets.advanceBalancePix, 0) + credit,
      ),
      advanceBalanceCash: roundMoney(Math.max(buckets.advanceBalanceCash, 0)),
    };
  }

  return {
    advanceBalancePix: roundMoney(Math.max(buckets.advanceBalancePix, 0)),
    advanceBalanceCash: roundMoney(
      Math.max(buckets.advanceBalanceCash, 0) + credit,
    ),
  };
}

export function resolvePaymentMethodFromParts(
  paidPix: number,
  paidCash: number,
): PaymentMethod | undefined {
  const pix = paidPix > 0;
  const cash = paidCash > 0;
  if (pix && cash) {
    return undefined;
  }
  if (pix) {
    return 'pix';
  }
  if (cash) {
    return 'cash';
  }
  return undefined;
}

export function allocateMethodPayment(
  amount: number,
  method: PaymentMethod | undefined,
): { paidPix: number; paidCash: number } {
  const value = Math.max(0, roundMoney(amount));
  if (value <= 0 || !method) {
    return { paidPix: 0, paidCash: 0 };
  }

  return method === 'pix'
    ? { paidPix: value, paidCash: 0 }
    : { paidPix: 0, paidCash: value };
}

export function getAdvanceAppliedTotal(session: {
  advanceAppliedPix?: number;
  advanceAppliedCash?: number;
}): number {
  return roundMoney(
    (session.advanceAppliedPix ?? 0) + (session.advanceAppliedCash ?? 0),
  );
}

export function getDirectPaidAmount(session: {
  paidAmount: number;
  advanceAppliedPix?: number;
  advanceAppliedCash?: number;
}): number {
  return roundMoney(
    Math.max(session.paidAmount - getAdvanceAppliedTotal(session), 0),
  );
}

export function resolveDirectPaymentMethod(session: {
  paidPix?: number;
  paidCash?: number;
  advanceAppliedPix?: number;
  advanceAppliedCash?: number;
}): PaymentMethod | undefined {
  const directPix = roundMoney(
    Math.max((session.paidPix ?? 0) - (session.advanceAppliedPix ?? 0), 0),
  );
  const directCash = roundMoney(
    Math.max((session.paidCash ?? 0) - (session.advanceAppliedCash ?? 0), 0),
  );
  return resolvePaymentMethodFromParts(directPix, directCash);
}
