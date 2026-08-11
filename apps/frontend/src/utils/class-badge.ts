import type { ClassBadge, ClassSession, PaymentMethod } from '@/types';

import { formatCurrency } from './currency';

function paymentMethodLabel(method: PaymentMethod): string {
  return method === 'pix' ? 'Pix' : 'Dinheiro';
}

function settledBadgeLabel(session: ClassSession): string {
  if (!session.paymentMethod) {
    return 'Pago';
  }

  return `Pago · ${paymentMethodLabel(session.paymentMethod)}`;
}

export function getClassBadge(session: ClassSession): ClassBadge {
  if (session.attendance === 'empty') {
    return {
      label: 'Aguardando preenchimento',
      variant: 'neutral',
    };
  }

  if (session.attendance === 'absent') {
    if ((session.pendingMakeupMinutes ?? session.durationMinutes) === 0) {
      return {
        label: 'Reposta',
        variant: 'info',
      };
    }

    return {
      label: 'Não compareceu',
      variant: 'danger',
    };
  }

  if (session.financialStatus === 'settled') {
    return {
      label: settledBadgeLabel(session),
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
