import {
  AttendanceStatus,
  type Student,
} from '../../../generated/prisma/client';
import { classAllocationRepository } from '@/repositories/class-allocation-repository';
import { classRepository } from '@/repositories/class-repository';
import type { StudentResponse } from '@/types/student';
import {
  getNextClassAt,
  mapStudentBalances,
} from '@/services/students/recurrence-scheduler';
import { calculateStudentPendingSummary } from '@/utils/class-value';
import { decimalToNumber } from '@/utils/money';
import { resolveStudentFinancialStatus } from '@/utils/student-financial';

class BuildStudentResponse {
  async execute(student: Student): Promise<StudentResponse> {
    const balances = mapStudentBalances(student);
    const classes = await classRepository.findSummaryByStudentId(student.id);
    const paidAmounts =
      await classAllocationRepository.sumPaidAmountsByClassIds(
        classes.map((item) => item.id),
      );

    const classSummaries = classes.map((session) => ({
      attendance:
        session.attendance === AttendanceStatus.ATTENDED ? 'attended' : 'other',
      expectedAmount: decimalToNumber(session.expectedAmount),
      paidAmount: paidAmounts.get(session.id) ?? 0,
    }));

    const pending = calculateStudentPendingSummary(classSummaries);

    return {
      id: student.id,
      name: student.name,
      guardianName: student.guardianName,
      phone: student.phone,
      hourlyRate: balances.hourlyRate,
      advanceBalancePix: balances.advanceBalancePix,
      advanceBalanceCash: balances.advanceBalanceCash,
      nextClassAt: getNextClassAt(classes),
      financialStatus: resolveStudentFinancialStatus(balances, pending),
      active: student.active,
    };
  }
}

export const buildStudentResponse = new BuildStudentResponse();
