export function calculateExpectedAmount(
  durationMinutes: number,
  hourlyRate: number,
): number {
  return Math.round((durationMinutes / 60) * hourlyRate * 100) / 100;
}

export function computeFinancialStatus(
  expectedAmount: number,
  paidAmount: number,
): 'pending' | 'partial' | 'settled' {
  if (paidAmount >= expectedAmount) {
    return 'settled';
  }

  if (paidAmount > 0) {
    return 'partial';
  }

  return 'pending';
}

export type StudentPendingSummary = {
  amount: number;
  lessonCount: number;
};

export function calculateStudentPendingSummary(
  sessions: Array<{
    attendance: string;
    expectedAmount: number;
    paidAmount: number;
  }>,
): StudentPendingSummary {
  return sessions.reduce<StudentPendingSummary>(
    (summary, session) => {
      if (session.attendance !== 'attended') {
        return summary;
      }

      const pending = Math.max(session.expectedAmount - session.paidAmount, 0);
      if (pending <= 0) {
        return summary;
      }

      return {
        amount: summary.amount + pending,
        lessonCount: summary.lessonCount + 1,
      };
    },
    { amount: 0, lessonCount: 0 },
  );
}
