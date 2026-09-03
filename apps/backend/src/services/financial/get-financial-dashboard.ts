import { classAllocationRepository } from '@/repositories/class-allocation-repository';
import { financialRepository } from '@/repositories/financial-repository';
import {
  dateKeyFromClass,
  isLockedRepostaAbsenceClass,
  mapAttendanceFromPrisma,
} from '@/services/classes/class-session-helpers';
import type {
  FinancialDashboardResponse,
  FinancialGranularity,
} from '@/types/financial';
import {
  findBucketForDateKey,
  resolveFinancialPeriod,
} from '@/utils/financial-period';
import { decimalToNumber, roundMoney } from '@/utils/money';

type GetFinancialDashboardInput = {
  granularity: FinancialGranularity;
  referenceDate: string;
  studentId?: string;
};

type ClassMetrics = {
  id: string;
  studentId: string;
  studentName: string;
  dateKey: string;
  attendance: 'empty' | 'attended' | 'absent';
  countsAsAbsenceImpact: boolean;
  expectedAmount: number;
  paidAmount: number;
  paidPix: number;
  paidCash: number;
};

function sortByAmountDesc<T extends { amount: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => right.amount - left.amount);
}

function sortByAbsenceValueDesc(
  items: Array<{ absenceValue: number }>,
): Array<{ absenceValue: number }> {
  return [...items].sort(
    (left, right) => right.absenceValue - left.absenceValue,
  );
}

class GetFinancialDashboard {
  async execute(
    input: GetFinancialDashboardInput,
  ): Promise<FinancialDashboardResponse> {
    const period = resolveFinancialPeriod(
      input.granularity,
      input.referenceDate,
    );
    const classes = await financialRepository.findClassesInPeriod(
      period.startDate,
      period.endDate,
      input.studentId,
    );
    const breakdownMap =
      await classAllocationRepository.getPaymentBreakdownByClassIds(
        classes.map((item) => item.id),
      );

    const metrics: ClassMetrics[] = classes.map((classRecord) => {
      const breakdown = breakdownMap.get(classRecord.id) ?? {
        paidPix: 0,
        paidCash: 0,
        advanceAppliedPix: 0,
        advanceAppliedCash: 0,
      };

      const attendance = mapAttendanceFromPrisma(classRecord.attendance);

      return {
        id: classRecord.id,
        studentId: classRecord.studentId,
        studentName: classRecord.student.name,
        dateKey: dateKeyFromClass(classRecord),
        attendance,
        countsAsAbsenceImpact:
          attendance === 'absent' && !isLockedRepostaAbsenceClass(classRecord),
        expectedAmount: decimalToNumber(classRecord.expectedAmount),
        paidAmount: roundMoney(breakdown.paidPix + breakdown.paidCash),
        paidPix: breakdown.paidPix,
        paidCash: breakdown.paidCash,
      };
    });

    let expected = 0;
    let realized = 0;
    let realizedPix = 0;
    let realizedCash = 0;
    let absenceImpact = 0;

    const chartTotals = new Map(
      period.buckets.map((bucket) => [
        bucket.key,
        { expected: 0, realized: 0 },
      ]),
    );
    const studentPaymentTotals = new Map<
      string,
      { studentName: string; amount: number }
    >();
    const studentAbsenceTotals = new Map<
      string,
      { studentName: string; absenceValue: number }
    >();

    for (const session of metrics) {
      const bucket = findBucketForDateKey(period.buckets, session.dateKey);
      const chartEntry = bucket ? chartTotals.get(bucket.key) : undefined;

      if (session.attendance !== 'absent') {
        expected = roundMoney(expected + session.expectedAmount);

        if (chartEntry) {
          chartEntry.expected = roundMoney(
            chartEntry.expected + session.expectedAmount,
          );
        }
      }

      if (session.countsAsAbsenceImpact) {
        absenceImpact = roundMoney(absenceImpact + session.expectedAmount);

        const currentAbsence = studentAbsenceTotals.get(session.studentId) ?? {
          studentName: session.studentName,
          absenceValue: 0,
        };
        currentAbsence.absenceValue = roundMoney(
          currentAbsence.absenceValue + session.expectedAmount,
        );
        studentAbsenceTotals.set(session.studentId, currentAbsence);
      }

      if (session.attendance === 'attended') {
        realized = roundMoney(realized + session.paidAmount);
        realizedPix = roundMoney(realizedPix + session.paidPix);
        realizedCash = roundMoney(realizedCash + session.paidCash);

        if (chartEntry) {
          chartEntry.realized = roundMoney(
            chartEntry.realized + session.paidAmount,
          );
        }

        const currentPayment = studentPaymentTotals.get(session.studentId) ?? {
          studentName: session.studentName,
          amount: 0,
        };
        currentPayment.amount = roundMoney(
          currentPayment.amount + session.paidAmount,
        );
        studentPaymentTotals.set(session.studentId, currentPayment);
      }
    }

    const pending = metrics
      .filter(
        (session) =>
          session.attendance === 'attended' &&
          session.paidAmount < session.expectedAmount,
      )
      .map((session) => ({
        id: session.id,
        studentId: session.studentId,
        studentName: session.studentName,
        date: session.dateKey,
        amount: roundMoney(session.expectedAmount - session.paidAmount),
      }))
      .sort((left, right) => {
        const dateCompare = right.date.localeCompare(left.date);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return right.id.localeCompare(left.id);
      });

    const includeStudentStats = input.studentId === undefined;

    return {
      expected,
      realized,
      realizedPix,
      realizedCash,
      absenceImpact,
      chart: period.buckets.map((bucket) => {
        const totals = chartTotals.get(bucket.key) ?? {
          expected: 0,
          realized: 0,
        };

        return {
          label: bucket.label,
          expected: totals.expected,
          realized: totals.realized,
        };
      }),
      pending,
      studentPayments: includeStudentStats
        ? sortByAmountDesc(
            [...studentPaymentTotals.entries()].map(([studentId, item]) => ({
              studentId,
              studentName: item.studentName,
              amount: item.amount,
            })),
          )
        : [],
      studentAbsences: includeStudentStats
        ? sortByAbsenceValueDesc(
            [...studentAbsenceTotals.entries()].map(([studentId, item]) => ({
              studentId,
              studentName: item.studentName,
              absenceValue: item.absenceValue,
            })),
          )
        : [],
    };
  }
}

export const getFinancialDashboard = new GetFinancialDashboard();
