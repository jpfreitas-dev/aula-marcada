import type { Student } from '../../../generated/prisma/client';
import { classAllocationRepository } from '@/repositories/class-allocation-repository';
import { makeupLinkRepository } from '@/repositories/makeup-link-repository';
import type { ClassResponse } from '@/types/class';
import {
  dateKeyFromClass,
  mapAttendanceFromPrisma,
} from '@/services/classes/class-session-helpers';
import { periodFromPrisma } from '@/services/students/recurrence-scheduler';
import {
  computeFinancialStatus,
  calculateExpectedAmount,
} from '@/utils/class-value';
import { decimalToNumber, roundMoney } from '@/utils/money';

type ClassWithStudent = {
  id: string;
  studentId: string;
  date: Date;
  period: import('../../../generated/prisma/client').ClassPeriod;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  expectedAmount: { toString(): string };
  attendance: import('../../../generated/prisma/client').AttendanceStatus;
  isMakeupOnly: boolean;
  pendingMakeupMinutes: number;
  content: string | null;
  notes: string | null;
  hasManualAmountOverride: boolean;
  student: Student;
};

function resolvePaymentMethod(
  paidPix: number,
  paidCash: number,
): 'pix' | 'cash' | undefined {
  if (paidPix > 0 && paidCash > 0) {
    return undefined;
  }

  if (paidPix > 0) {
    return 'pix';
  }

  if (paidCash > 0) {
    return 'cash';
  }

  return undefined;
}

class BuildClassResponse {
  async execute(classRecord: ClassWithStudent): Promise<ClassResponse> {
    const [linkedAbsenceIds, breakdownMap] = await Promise.all([
      makeupLinkRepository.findAbsenceIdsByMakeupClassId(classRecord.id),
      classAllocationRepository.getPaymentBreakdownByClassIds([classRecord.id]),
    ]);

    const breakdown = breakdownMap.get(classRecord.id) ?? {
      paidPix: 0,
      paidCash: 0,
      advanceAppliedPix: 0,
      advanceAppliedCash: 0,
    };
    const paidAmount = roundMoney(breakdown.paidPix + breakdown.paidCash);
    const attendance = mapAttendanceFromPrisma(classRecord.attendance);
    const expectedAmount = decimalToNumber(classRecord.expectedAmount);

    let financialStatus = computeFinancialStatus(expectedAmount, paidAmount);
    if (attendance !== 'attended') {
      financialStatus = 'pending';
    }

    return {
      id: classRecord.id,
      studentId: classRecord.studentId,
      studentName: classRecord.student.name,
      date: dateKeyFromClass(classRecord),
      period: periodFromPrisma(classRecord.period),
      startTime: classRecord.startTime,
      endTime: classRecord.endTime,
      durationMinutes: classRecord.durationMinutes,
      expectedAmount,
      paidAmount,
      paidPix: breakdown.paidPix,
      paidCash: breakdown.paidCash,
      advanceAppliedPix: breakdown.advanceAppliedPix,
      advanceAppliedCash: breakdown.advanceAppliedCash,
      attendance,
      financialStatus,
      isMakeup: linkedAbsenceIds.length > 0,
      isMakeupOnly: classRecord.isMakeupOnly,
      linkedAbsenceIds,
      pendingMakeupMinutes:
        attendance === 'absent' ? classRecord.pendingMakeupMinutes : undefined,
      paymentMethod: resolvePaymentMethod(
        breakdown.paidPix,
        breakdown.paidCash,
      ),
      content: classRecord.content ?? undefined,
      notes: classRecord.notes ?? undefined,
      hasManualAmountOverride: classRecord.hasManualAmountOverride,
    };
  }

  async executeMany(
    classRecords: ClassWithStudent[],
  ): Promise<ClassResponse[]> {
    const classIds = classRecords.map((item) => item.id);
    const breakdownMap =
      await classAllocationRepository.getPaymentBreakdownByClassIds(classIds);

    const linkedAbsenceIdsMap =
      await makeupLinkRepository.findAbsenceIdsByMakeupClassIds(classIds);

    return classRecords.map((classRecord) => {
      const linkedAbsenceIds = linkedAbsenceIdsMap.get(classRecord.id) ?? [];
      const breakdown = breakdownMap.get(classRecord.id) ?? {
        paidPix: 0,
        paidCash: 0,
        advanceAppliedPix: 0,
        advanceAppliedCash: 0,
      };
      const paidAmount = roundMoney(breakdown.paidPix + breakdown.paidCash);
      const attendance = mapAttendanceFromPrisma(classRecord.attendance);
      const expectedAmount = decimalToNumber(classRecord.expectedAmount);

      let financialStatus = computeFinancialStatus(expectedAmount, paidAmount);
      if (attendance !== 'attended') {
        financialStatus = 'pending';
      }

      return {
        id: classRecord.id,
        studentId: classRecord.studentId,
        studentName: classRecord.student.name,
        date: dateKeyFromClass(classRecord),
        period: periodFromPrisma(classRecord.period),
        startTime: classRecord.startTime,
        endTime: classRecord.endTime,
        durationMinutes: classRecord.durationMinutes,
        expectedAmount,
        paidAmount,
        paidPix: breakdown.paidPix,
        paidCash: breakdown.paidCash,
        advanceAppliedPix: breakdown.advanceAppliedPix,
        advanceAppliedCash: breakdown.advanceAppliedCash,
        attendance,
        financialStatus,
        isMakeup: linkedAbsenceIds.length > 0,
        isMakeupOnly: classRecord.isMakeupOnly,
        linkedAbsenceIds,
        pendingMakeupMinutes:
          attendance === 'absent'
            ? classRecord.pendingMakeupMinutes
            : undefined,
        paymentMethod: resolvePaymentMethod(
          breakdown.paidPix,
          breakdown.paidCash,
        ),
        content: classRecord.content ?? undefined,
        notes: classRecord.notes ?? undefined,
        hasManualAmountOverride: classRecord.hasManualAmountOverride,
      };
    });
  }
}

export const buildClassResponse = new BuildClassResponse();

export function recalculateExpectedAmount(
  classRecord: Pick<
    ClassWithStudent,
    'durationMinutes' | 'expectedAmount' | 'hasManualAmountOverride'
  >,
  nextDurationMinutes: number,
  hourlyRate: number,
): number {
  if (classRecord.hasManualAmountOverride) {
    const currentExpected = decimalToNumber(classRecord.expectedAmount);
    return roundMoney(
      (nextDurationMinutes / classRecord.durationMinutes) * currentExpected,
    );
  }

  return calculateExpectedAmount(nextDurationMinutes, hourlyRate);
}
