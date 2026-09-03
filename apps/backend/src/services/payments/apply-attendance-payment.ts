import {
  AllocationSource,
  AttendanceStatus,
} from '../../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import { classAllocationRepository } from '@/repositories/class-allocation-repository';
import { paymentRepository } from '@/repositories/payment-repository';
import { studentRepository } from '@/repositories/student-repository';
import type { DatabaseClient } from '@/repositories/types';
import type { PaymentMethod } from '@/types/class';
import {
  allocateMethodPayment,
  consumeAdvanceBalance,
} from '@/utils/advance-balance';
import { decimalToNumber, roundMoney } from '@/utils/money';
import { mapPaymentMethodToPrisma } from '@/utils/payment-method';

type ClassRecord = {
  id: string;
  studentId: string;
  expectedAmount: { toString(): string };
  attendance: AttendanceStatus;
};

type StudentRecord = {
  advanceBalancePix: { toString(): string };
  advanceBalanceCash: { toString(): string };
};

export async function applyAttendancePayment(
  classRecord: ClassRecord,
  student: StudentRecord,
  paidAmount: number,
  paymentMethod: PaymentMethod | undefined,
  wasAlreadyAttended: boolean,
  db: DatabaseClient,
): Promise<void> {
  let methodPaid = roundMoney(Math.max(paidAmount, 0));

  if (methodPaid > 0 && !paymentMethod) {
    throw new AppError(
      'Selecione Pix ou Dinheiro para o valor recebido agora.',
    );
  }

  const expectedAmount = decimalToNumber(classRecord.expectedAmount);
  let advanceBalancePix = decimalToNumber(student.advanceBalancePix);
  let advanceBalanceCash = decimalToNumber(student.advanceBalanceCash);

  if (!wasAlreadyAttended) {
    const consumption = consumeAdvanceBalance(
      {
        advanceBalancePix,
        advanceBalanceCash,
      },
      expectedAmount,
    );

    advanceBalancePix = consumption.remainingPix;
    advanceBalanceCash = consumption.remainingCash;

    if (consumption.usedPix > 0) {
      await classAllocationRepository.create(
        {
          classId: classRecord.id,
          amount: consumption.usedPix,
          method: mapPaymentMethodToPrisma('pix'),
          source: AllocationSource.ADVANCE_PIX,
        },
        db,
      );
    }

    if (consumption.usedCash > 0) {
      await classAllocationRepository.create(
        {
          classId: classRecord.id,
          amount: consumption.usedCash,
          method: mapPaymentMethodToPrisma('cash'),
          source: AllocationSource.ADVANCE_CASH,
        },
        db,
      );
    }

    const maxNewMoney = roundMoney(
      Math.max(expectedAmount - consumption.usedTotal, 0),
    );
    methodPaid = Math.min(methodPaid, maxNewMoney);
  } else {
    const breakdownMap =
      await classAllocationRepository.getPaymentBreakdownByClassIds(
        [classRecord.id],
        db,
      );
    const breakdown = breakdownMap.get(classRecord.id) ?? {
      paidPix: 0,
      paidCash: 0,
      advanceAppliedPix: 0,
      advanceAppliedCash: 0,
    };
    const currentPaid = roundMoney(breakdown.paidPix + breakdown.paidCash);
    const remainingDue = roundMoney(Math.max(expectedAmount - currentPaid, 0));

    if (remainingDue > 0) {
      methodPaid = Math.min(methodPaid, remainingDue);
    } else {
      if (paymentMethod) {
        await classAllocationRepository.updateExclusivePaymentMethod(
          classRecord.id,
          mapPaymentMethodToPrisma(paymentMethod),
          db,
        );
      }
      methodPaid = 0;
    }
  }

  if (methodPaid > 0 && paymentMethod) {
    const prismaMethod = mapPaymentMethodToPrisma(paymentMethod);
    const payment = await paymentRepository.create(
      {
        student: { connect: { id: classRecord.studentId } },
        amount: methodPaid,
        method: prismaMethod,
        paidAt: new Date(),
      },
      db,
    );

    const allocation = allocateMethodPayment(methodPaid, paymentMethod);

    if (allocation.paidPix > 0) {
      await classAllocationRepository.create(
        {
          classId: classRecord.id,
          amount: allocation.paidPix,
          method: mapPaymentMethodToPrisma('pix'),
          source: AllocationSource.PAYMENT,
          paymentId: payment.id,
        },
        db,
      );
    }

    if (allocation.paidCash > 0) {
      await classAllocationRepository.create(
        {
          classId: classRecord.id,
          amount: allocation.paidCash,
          method: mapPaymentMethodToPrisma('cash'),
          source: AllocationSource.PAYMENT,
          paymentId: payment.id,
        },
        db,
      );
    }
  }

  await studentRepository.updateAdvanceBalances(
    classRecord.studentId,
    advanceBalancePix,
    advanceBalanceCash,
    db,
  );
}
