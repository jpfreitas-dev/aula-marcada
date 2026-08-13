import type { ClassBadgeVariant, Student } from '@/types';
import type { StudentPendingSummary } from '@/utils/class-value';
import { getStudentAdvanceBalance } from '@/utils/advance-balance';
import { formatCurrency } from '@/utils/currency';

export type StudentFinancialView = 'pending' | 'advance' | 'up_to_date';

export type StudentFinancialTone = 'success' | 'warning' | 'info';

export type StudentFinancialDisplay = {
  view: StudentFinancialView;
  label: string;
  tone: StudentFinancialTone;
  badgeVariant: ClassBadgeVariant;
};

type StudentBalanceInput = Pick<
  Student,
  'advanceBalancePix' | 'advanceBalanceCash' | 'hourlyRate'
>;

function formatHourCount(count: number): string {
  return `${count} hora${count === 1 ? '' : 's'}`;
}

function formatHoursWithAmount(hours: number, amount: number): string {
  if (hours > 0) {
    return `${formatHourCount(hours)} (${formatCurrency(amount)})`;
  }

  return formatCurrency(amount);
}

export function resolveAdvanceHours(student: StudentBalanceInput): number {
  if (student.hourlyRate <= 0) {
    return 0;
  }

  return Math.floor(getStudentAdvanceBalance(student) / student.hourlyRate);
}

function resolvePendingHours(
  student: StudentBalanceInput,
  pending: StudentPendingSummary,
): number {
  if (student.hourlyRate <= 0) {
    return 0;
  }

  return Math.floor(pending.amount / student.hourlyRate);
}

export function resolveStudentFinancialView(
  student: StudentBalanceInput,
  pending: StudentPendingSummary,
): StudentFinancialView {
  if (pending.amount > 0) {
    return 'pending';
  }

  if (getStudentAdvanceBalance(student) > 0) {
    return 'advance';
  }

  return 'up_to_date';
}

export function getStudentFinancialDisplay(
  student: StudentBalanceInput,
  pending: StudentPendingSummary,
): StudentFinancialDisplay {
  const view = resolveStudentFinancialView(student, pending);

  if (view === 'pending') {
    const hours = resolvePendingHours(student, pending);
    const detail = formatHoursWithAmount(hours, pending.amount);

    return {
      view,
      label: `Pendente: ${detail}`,
      tone: 'warning',
      badgeVariant: 'warning',
    };
  }

  if (view === 'advance') {
    const hours = resolveAdvanceHours(student);
    const detail = formatHoursWithAmount(
      hours,
      getStudentAdvanceBalance(student),
    );

    return {
      view,
      label: `Adiantado: ${detail}`,
      tone: 'success',
      badgeVariant: 'success',
    };
  }

  return {
    view,
    label: 'Em dia',
    tone: 'info',
    badgeVariant: 'info',
  };
}

export function getStudentFinancialBadge(
  student: StudentBalanceInput,
  pending: StudentPendingSummary,
): { label: string; variant: ClassBadgeVariant } {
  const display = getStudentFinancialDisplay(student, pending);

  if (display.view === 'pending') {
    const hours = resolvePendingHours(student, pending);

    if (hours > 0) {
      return {
        label: `Pendente: ${formatHourCount(hours)}`,
        variant: display.badgeVariant,
      };
    }

    return { label: 'Pendente', variant: display.badgeVariant };
  }

  if (display.view === 'advance') {
    const hours = resolveAdvanceHours(student);

    if (hours > 0) {
      return {
        label: `Saldo: ${formatHourCount(hours)}`,
        variant: display.badgeVariant,
      };
    }

    return { label: 'Saldo adiantado', variant: display.badgeVariant };
  }

  return { label: 'Em dia', variant: display.badgeVariant };
}

export function getStudentListFinancialBadge(
  student: StudentBalanceInput & Pick<Student, 'financialStatus'>,
): { label: string; variant: ClassBadgeVariant } {
  if (
    student.financialStatus === 'pending' ||
    student.financialStatus === 'partial'
  ) {
    return { label: 'Pendente', variant: 'warning' };
  }

  if (student.financialStatus === 'advance') {
    const hours = resolveAdvanceHours(student);

    if (hours > 0) {
      return {
        label: `Saldo: ${formatHourCount(hours)}`,
        variant: 'success',
      };
    }

    return { label: 'Saldo adiantado', variant: 'success' };
  }

  return { label: 'Em dia', variant: 'info' };
}

export function getStudentFinancialCardContent(
  student: StudentBalanceInput,
  pending: StudentPendingSummary,
): { label: string; tone: StudentFinancialTone } {
  const display = getStudentFinancialDisplay(student, pending);

  return {
    label: display.label,
    tone: display.tone,
  };
}
