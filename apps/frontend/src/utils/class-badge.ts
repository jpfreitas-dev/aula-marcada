import type { ClassBadge, ClassSession } from '@/types';

import { formatCurrency } from './currency';

export function getClassBadge(session: ClassSession): ClassBadge {
  if (session.attendance === 'empty') {
    return {
      label: 'Aguardando preenchimento',
      variant: 'neutral',
    };
  }

  if (session.attendance === 'absent') {
    return {
      label: 'Não compareceu',
      variant: 'danger',
    };
  }

  if (session.linkedAbsenceIds.length > 0) {
    return {
      label: 'Aula reposta',
      variant: 'info',
    };
  }

  if (session.financialStatus === 'settled') {
    return {
      label: 'Pago',
      variant: 'success',
    };
  }

  if (session.financialStatus === 'partial') {
    const pending = session.expectedAmount - session.paidAmount;
    return {
      label: `Falta ${formatCurrency(pending)}`,
      variant: 'warning',
    };
  }

  return {
    label: 'Pendente',
    variant: 'warning',
  };
}

export function getStatusStripeColor(session: ClassSession): string {
  const badge = getClassBadge(session);

  switch (badge.variant) {
    case 'success':
      return 'bg-status-success';
    case 'danger':
      return 'bg-status-danger';
    case 'info':
      return 'bg-status-info';
    case 'warning':
      return 'bg-status-warning';
    default:
      return 'bg-status-neutral';
  }
}
