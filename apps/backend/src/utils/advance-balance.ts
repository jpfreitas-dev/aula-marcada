import type { PaymentMethod } from '@/types/class';
import { roundMoney } from '@/utils/money';

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
};

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
