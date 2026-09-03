import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  fieldControlClassName,
  fieldLabelClassName,
} from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { receiveStudentPayment } from '@/services/student-service';
import type { PaymentMethod, Student } from '@/types';
import {
  formatCurrencyInput,
  formatCurrencyInputFromRaw,
  parseCurrencyInput,
  type StudentPendingSummary,
} from '@/utils/class-value';
import { formatCurrency } from '@/utils/currency';
import { getStudentAdvanceBalance } from '@/utils/advance-balance';

type ReceivePaymentModalProps = {
  open: boolean;
  student: Student;
  pending: StudentPendingSummary;
  onClose: () => void;
  onSaved?: () => void;
};

export function ReceivePaymentModal({
  open,
  student,
  pending,
  onClose,
  onSaved,
}: ReceivePaymentModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ReceivePaymentForm
      key={`${student.id}-${pending.amount}-${getStudentAdvanceBalance(student)}`}
      student={student}
      pending={pending}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function ReceivePaymentForm({
  student,
  pending,
  onClose,
  onSaved,
}: {
  student: Student;
  pending: StudentPendingSummary;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const suggestedAmount = pending.amount > 0 ? pending.amount : 0;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [amountInput, setAmountInput] = useState(
    formatCurrencyInput(suggestedAmount),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const amount = parseCurrencyInput(amountInput);
  const advanceBalance = getStudentAdvanceBalance(student);

  const allocationPreview = useMemo(() => {
    if (amount <= 0) {
      return { toPending: 0, toAdvance: 0 };
    }

    const toPending = Math.min(amount, pending.amount);
    const toAdvance = Math.max(amount - pending.amount, 0);
    return { toPending, toAdvance };
  }, [amount, pending.amount]);

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);

    try {
      await receiveStudentPayment({
        studentId: student.id,
        amount,
        paymentMethod,
      });
      onSaved?.();
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível registrar o pagamento.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Receber pagamento"
      onClose={onClose}
      onSubmit={() => void handleConfirm()}
      submitDisabled={saving || amount <= 0}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          Aluno:{' '}
          <span className="font-semibold text-text-main">{student.name}</span>
        </p>

        {pending.amount > 0 ? (
          <p className="rounded-md bg-status-warning-container px-3 py-2 text-sm text-status-warning">
            Pendente: {formatCurrency(pending.amount)}. O valor quita as aulas
            mais antigas primeiro.
          </p>
        ) : (
          <p className="rounded-md bg-bg-subtle px-3 py-2 text-sm text-text-muted">
            Sem pendências. O valor entra como saldo adiantado
            {advanceBalance > 0
              ? ` (atual: ${formatCurrency(advanceBalance)})`
              : ''}
            .
          </p>
        )}

        <div className="flex flex-col gap-2">
          <span className={fieldLabelClassName}>Forma de pagamento</span>
          <div className="flex gap-2">
            {(
              [
                { value: 'pix', label: 'Pix' },
                { value: 'cash', label: 'Dinheiro' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentMethod(option.value)}
                className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium ${
                  paymentMethod === option.value
                    ? 'border-status-success/30 bg-status-success-container text-status-success'
                    : 'border-outline-variant bg-surface text-on-surface-variant'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className={fieldLabelClassName}>Valor</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-text-muted">
              R$
            </span>
            <input
              inputMode="numeric"
              value={amountInput}
              onChange={(event) =>
                setAmountInput(formatCurrencyInputFromRaw(event.target.value))
              }
              className={`${fieldControlClassName} pl-10 pr-3 font-mono`}
            />
          </div>
        </label>

        {amount > 0 ? (
          <div className="space-y-1 text-xs text-text-muted">
            {allocationPreview.toPending > 0 ? (
              <p>
                Abate em pendências:{' '}
                <span className="font-medium text-text-main">
                  {formatCurrency(allocationPreview.toPending)}
                </span>
              </p>
            ) : null}
            {allocationPreview.toAdvance > 0 ? (
              <p>
                Vai para saldo adiantado:{' '}
                <span className="font-medium text-text-main">
                  {formatCurrency(allocationPreview.toAdvance)}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="text-sm text-status-danger">{error}</p> : null}

        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={saving}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={saving || amount <= 0}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
