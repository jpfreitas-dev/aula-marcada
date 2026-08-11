import type { ClassBadgeVariant, Student } from '@/types';
import type { StudentPendingSummary } from '@/utils/class-value';
import { formatCurrency } from '@/utils/currency';

export type StudentFinancialView = 'pending' | 'advance' | 'up_to_date';

export type StudentFinancialTone = 'success' | 'warning' | 'info';

export type StudentFinancialDisplay = {
  view: StudentFinancialView;
  label: string;
  tone: StudentFinancialTone;
  badgeVariant: ClassBadgeVariant;
};

type StudentBalanceInput = Pick<Student, 'advanceBalance' | 'hourlyRate'>;

function formatLessonCount(count: number): string {
  return `${count} aula${count === 1 ? '' : 's'}`;
}

function formatLessonsWithAmount(lessons: number, amount: number): string {
  if (lessons > 0) {
    return `${formatLessonCount(lessons)} (${formatCurrency(amount)})`;
  }

  return formatCurrency(amount);
}

function resolveAdvanceLessons(student: StudentBalanceInput): number {
  if (student.hourlyRate <= 0) {
    return 0;
  }

  return Math.floor(student.advanceBalance / student.hourlyRate);
}

export function resolveStudentFinancialView(
  student: StudentBalanceInput,
  pending: StudentPendingSummary,
): StudentFinancialView {
  if (pending.amount > 0) {
    return 'pending';
  }

  if (student.advanceBalance > 0) {
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
    const detail = formatLessonsWithAmount(pending.lessonCount, pending.amount);

    return {
      view,
      label: `Pendente: ${detail}`,
      tone: 'warning',
      badgeVariant: 'warning',
    };
  }

  if (view === 'advance') {
    const lessons = resolveAdvanceLessons(student);
    const detail = formatLessonsWithAmount(lessons, student.advanceBalance);

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
    if (pending.lessonCount > 0) {
      return {
        label: `Pendente: ${formatLessonCount(pending.lessonCount)}`,
        variant: display.badgeVariant,
      };
    }

    return { label: 'Pendente', variant: display.badgeVariant };
  }

  if (display.view === 'advance') {
    const lessons = resolveAdvanceLessons(student);

    if (lessons > 0) {
      return {
        label: `Saldo: ${formatLessonCount(lessons)}`,
        variant: display.badgeVariant,
      };
    }

    return { label: 'Saldo adiantado', variant: display.badgeVariant };
  }

  return { label: 'Em dia', variant: display.badgeVariant };
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
