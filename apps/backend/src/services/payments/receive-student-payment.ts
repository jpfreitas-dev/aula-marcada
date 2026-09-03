import { AllocationSource } from '../../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import { classAllocationRepository } from '@/repositories/class-allocation-repository';
import { classRepository } from '@/repositories/class-repository';
import { paymentRepository } from '@/repositories/payment-repository';
import { studentRepository } from '@/repositories/student-repository';
import { buildStudentResponse } from '@/services/students/build-student-response';
import type {
  ReceiveStudentPaymentInput,
  ReceiveStudentPaymentResult,
} from '@/types/payment';
import { addAdvanceByMethod } from '@/utils/advance-balance';
import { computeFinancialStatus } from '@/utils/class-value';
import { decimalToNumber, roundMoney } from '@/utils/money';
import { mapPaymentMethodToPrisma } from '@/utils/payment-method';

class ReceiveStudentPayment {
  async execute(
    input: ReceiveStudentPaymentInput,
  ): Promise<ReceiveStudentPaymentResult> {
    const student = await studentRepository.findById(input.studentId);

    if (!student) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    if (!student.active) {
      throw new AppError(
        'Não é possível receber pagamento de aluno desativado.',
      );
    }

    if (input.amount <= 0) {
      throw new AppError('Informe um valor maior que zero.');
    }

    const prismaMethod = mapPaymentMethodToPrisma(input.paymentMethod);
    let remaining = roundMoney(input.amount);
    let allocatedAmount = 0;
    const settledClassIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      const payment = await paymentRepository.create(
        {
          student: { connect: { id: student.id } },
          amount: input.amount,
          method: prismaMethod,
          paidAt: new Date(),
        },
        tx,
      );

      const attendedClasses = await classRepository.findAttendedByStudentId(
        student.id,
        tx,
      );
      const classIds = attendedClasses.map((item) => item.id);
      const paidAmounts =
        await classAllocationRepository.sumPaidAmountsByClassIds(classIds, tx);

      for (const classRecord of attendedClasses) {
        if (remaining <= 0) {
          break;
        }

        const expectedAmount = decimalToNumber(classRecord.expectedAmount);
        const paidAmount = paidAmounts.get(classRecord.id) ?? 0;
        const due = roundMoney(expectedAmount - paidAmount);

        if (due <= 0) {
          continue;
        }

        const allocation = Math.min(due, remaining);

        await classAllocationRepository.create(
          {
            classId: classRecord.id,
            amount: allocation,
            method: prismaMethod,
            source: AllocationSource.PAYMENT,
            paymentId: payment.id,
          },
          tx,
        );

        remaining = roundMoney(remaining - allocation);
        allocatedAmount = roundMoney(allocatedAmount + allocation);

        const nextPaid = roundMoney(paidAmount + allocation);
        if (computeFinancialStatus(expectedAmount, nextPaid) === 'settled') {
          settledClassIds.push(classRecord.id);
        }
      }

      const advanceAmount = Math.max(remaining, 0);
      const currentPix = decimalToNumber(student.advanceBalancePix);
      const currentCash = decimalToNumber(student.advanceBalanceCash);
      const nextBuckets = addAdvanceByMethod(
        {
          advanceBalancePix: currentPix,
          advanceBalanceCash: currentCash,
        },
        advanceAmount,
        input.paymentMethod,
      );

      await studentRepository.updateAdvanceBalances(
        student.id,
        nextBuckets.advanceBalancePix,
        nextBuckets.advanceBalanceCash,
        tx,
      );
    });

    const updatedStudent = await studentRepository.findById(input.studentId);

    if (!updatedStudent) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    const studentResponse = await buildStudentResponse.execute(updatedStudent);
    const advanceAmount = roundMoney(input.amount - allocatedAmount);

    return {
      student: studentResponse,
      allocatedAmount,
      advanceAmount,
      settledClassIds,
    };
  }
}

export const receiveStudentPayment = new ReceiveStudentPayment();
