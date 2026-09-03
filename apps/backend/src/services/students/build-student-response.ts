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

type ClassSummary = {
  id: string;
  date: Date;
  startTime: string;
  attendance: AttendanceStatus;
  expectedAmount: { toString(): string };
};

class BuildStudentResponse {
  async execute(student: Student): Promise<StudentResponse> {
    const [classes] = await Promise.all([
      classRepository.findSummaryByStudentId(student.id),
    ]);

    return this.buildFromSummaries(student, classes);
  }

  async executeMany(students: Student[]): Promise<StudentResponse[]> {
    if (students.length === 0) {
      return [];
    }

    const studentIds = students.map((student) => student.id);
    const classes = await classRepository.findSummaryByStudentIds(studentIds);
    const paidAmounts =
      await classAllocationRepository.sumPaidAmountsByClassIds(
        classes.map((item) => item.id),
      );

    const classesByStudent = new Map<string, ClassSummary[]>();
    for (const session of classes) {
      const existing = classesByStudent.get(session.studentId) ?? [];
      existing.push(session);
      classesByStudent.set(session.studentId, existing);
    }

    return students.map((student) => {
      const studentClasses = classesByStudent.get(student.id) ?? [];
      const classSummaries = studentClasses.map((session) => ({
        attendance:
          session.attendance === AttendanceStatus.ATTENDED
            ? ('attended' as const)
            : ('other' as const),
        expectedAmount: decimalToNumber(session.expectedAmount),
        paidAmount: paidAmounts.get(session.id) ?? 0,
      }));
      const pending = calculateStudentPendingSummary(classSummaries);
      const balances = mapStudentBalances(student);

      return {
        id: student.id,
        name: student.name,
        guardianName: student.guardianName,
        phone: student.phone,
        hourlyRate: balances.hourlyRate,
        advanceBalancePix: balances.advanceBalancePix,
        advanceBalanceCash: balances.advanceBalanceCash,
        nextClassAt: getNextClassAt(studentClasses),
        financialStatus: resolveStudentFinancialStatus(balances, pending),
        active: student.active,
      };
    });
  }

  private async buildFromSummaries(
    student: Student,
    classes: ClassSummary[],
  ): Promise<StudentResponse> {
    const paidAmounts =
      await classAllocationRepository.sumPaidAmountsByClassIds(
        classes.map((item) => item.id),
      );

    const classSummaries = classes.map((session) => ({
      attendance:
        session.attendance === AttendanceStatus.ATTENDED
          ? ('attended' as const)
          : ('other' as const),
      expectedAmount: decimalToNumber(session.expectedAmount),
      paidAmount: paidAmounts.get(session.id) ?? 0,
    }));

    const pending = calculateStudentPendingSummary(classSummaries);
    const balances = mapStudentBalances(student);

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
