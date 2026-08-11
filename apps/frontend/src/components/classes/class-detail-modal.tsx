import { useEffect, useState } from 'react';

import { LinkMakeupModal } from '@/components/classes/link-makeup-modal';
import { RescheduleClassModal } from '@/components/classes/reschedule-class-modal';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Modal } from '@/components/ui/modal';
import type { AttendanceStatus, ClassSession, PaymentMethod } from '@/types';
import {
  deleteClass,
  getClassByIdService,
  isMakeupFullyCovered,
  saveClassDetail,
} from '@/services/class-service';
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/class-value';
import { formatCurrency } from '@/utils/currency';

type ClassDetailModalProps = {
  open: boolean;
  classId: string | null;
  onClose: () => void;
};

type AttendanceDraft = AttendanceStatus;

export function ClassDetailModal({
  open,
  classId,
  onClose,
}: ClassDetailModalProps) {
  const [session, setSession] = useState<ClassSession | null>(null);
  const [attendance, setAttendance] = useState<AttendanceDraft>('empty');
  const [paidAmountInput, setPaidAmountInput] = useState('0,00');
  const [paymentMethod, setPaymentMethod] = useState<
    PaymentMethod | undefined
  >();
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !classId) {
      return;
    }

    void getClassByIdService(classId).then((loaded) => {
      if (!loaded) {
        return;
      }

      setSession(loaded);
      setAttendance(loaded.attendance);
      setPaidAmountInput(
        formatCurrencyInput(loaded.paidAmount || loaded.expectedAmount),
      );
      setPaymentMethod(loaded.paymentMethod);
      setContent(loaded.content ?? '');
      setNotes(loaded.notes ?? '');
      setError(null);
    });
  }, [open, classId]);

  if (!session) {
    return null;
  }

  const actionsBlocked = session.attendance !== 'empty';
  const makeupCovered =
    session.attendance === 'absent' && isMakeupFullyCovered(session);

  const toggleAttendance = (next: Exclude<AttendanceStatus, 'empty'>) => {
    setAttendance((current) => (current === next ? 'empty' : next));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await saveClassDetail(session.id, {
        attendance,
        paidAmount:
          attendance === 'attended' ? parseCurrencyInput(paidAmountInput) : 0,
        paymentMethod: attendance === 'attended' ? paymentMethod : undefined,
        content: attendance === 'attended' ? content : undefined,
        notes: attendance === 'attended' ? notes : undefined,
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar a aula.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteClass(session.id);
    setDeleteOpen(false);
    onClose();
  };

  return (
    <>
      <BottomSheet
        open={open}
        tall
        title={session.studentName}
        onClose={onClose}
        footer={
          <Button
            className="w-full"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            Salvar alterações
          </Button>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm text-text-muted">
                {session.startTime} - {session.endTime}
              </p>
              <p className="mt-1 font-mono text-sm font-medium text-text-main">
                {formatCurrency(session.expectedAmount)}
              </p>
            </div>
            <div className="flex items-center gap-1 text-outline">
              <button
                type="button"
                disabled={actionsBlocked}
                onClick={() => setRescheduleOpen(true)}
                className="rounded-full p-2 transition-colors hover:bg-surface-variant disabled:opacity-40"
                aria-label="Alterar horário"
              >
                <Icon name="calendar_month" />
              </button>
              <button
                type="button"
                disabled={actionsBlocked}
                onClick={() => setLinkOpen(true)}
                className="rounded-full p-2 transition-colors hover:bg-surface-variant disabled:opacity-40"
                aria-label="Vincular reposição"
              >
                <Icon name="link" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-full p-2 text-status-danger transition-colors hover:bg-error-container"
                aria-label="Excluir aula"
              >
                <Icon name="delete" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-main">Presença</span>
            <div className="flex gap-1 rounded-lg bg-surface-variant/50 p-1">
              <button
                type="button"
                onClick={() => toggleAttendance('attended')}
                className={`flex-1 rounded-md px-3 py-2 text-sm transition-all ${
                  attendance === 'attended'
                    ? 'bg-emerald-100 font-semibold text-emerald-800 shadow-sm'
                    : 'font-medium text-on-surface-variant'
                }`}
              >
                Compareceu
              </button>
              <button
                type="button"
                onClick={() => toggleAttendance('absent')}
                className={`flex-1 rounded-md px-3 py-2 text-sm transition-all ${
                  attendance === 'absent'
                    ? 'bg-red-100 font-semibold text-red-800 shadow-sm'
                    : 'font-medium text-on-surface-variant'
                }`}
              >
                Não compareceu
              </button>
            </div>
          </div>

          {attendance === 'attended' ? (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-main">
                  Pagamento
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['pix', 'cash'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                        paymentMethod === method
                          ? 'border-status-success/20 bg-emerald-100 text-emerald-800'
                          : 'border-outline-variant bg-surface text-on-surface-variant'
                      }`}
                    >
                      {method === 'pix' ? 'Pix' : 'Dinheiro'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod(undefined)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                      !paymentMethod
                        ? 'border-status-warning/20 bg-amber-100 text-amber-800'
                        : 'border-outline-variant bg-surface text-on-surface-variant'
                    }`}
                  >
                    Não pago
                  </button>
                </div>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-text-muted">
                    R$
                  </span>
                  <input
                    value={paidAmountInput}
                    onChange={(event) => setPaidAmountInput(event.target.value)}
                    className="w-full rounded-lg border border-outline-variant py-2.5 pl-10 pr-3 font-mono text-sm"
                  />
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-main">
                  Conteúdo da aula
                </span>
                <textarea
                  value={content}
                  maxLength={500}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="O que foi ensinado?"
                  className="h-24 resize-none rounded-lg border border-outline-variant p-3 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-main">
                  Observações
                </span>
                <textarea
                  value={notes}
                  maxLength={500}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Notas sobre o aluno..."
                  className="h-24 resize-none rounded-lg border border-outline-variant p-3 text-sm"
                />
              </label>
            </>
          ) : null}

          {attendance === 'absent' ? (
            <div className="rounded-lg bg-bg-subtle p-4">
              <p className="text-sm font-medium text-text-main">
                Aula reposta? {makeupCovered ? 'Sim' : 'Não'}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                A reposição é vinculada pelo fluxo de vinculação.
              </p>
            </div>
          ) : null}

          {error ? <p className="text-sm text-status-danger">{error}</p> : null}
        </div>
      </BottomSheet>

      <Modal
        open={deleteOpen}
        title="Excluir aula"
        onClose={() => setDeleteOpen(false)}
      >
        <p className="text-sm text-text-muted">
          {session.attendance === 'empty'
            ? 'Tem certeza que deseja excluir essa aula?'
            : 'Essa aula já foi realizada. Tem certeza que deseja excluir?'}
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleteOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-status-danger hover:bg-status-danger"
            onClick={() => void handleDelete()}
          >
            Excluir
          </Button>
        </div>
      </Modal>

      <LinkMakeupModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        studentId={session.studentId}
        studentName={session.studentName}
        targetClass={session}
      />

      <RescheduleClassModal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        session={session}
      />
    </>
  );
}
