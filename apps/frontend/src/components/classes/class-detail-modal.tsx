import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { LinkMakeupModal } from '@/components/classes/link-makeup-modal';
import { RescheduleClassModal } from '@/components/classes/reschedule-class-modal';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Modal } from '@/components/ui/modal';
import type { AttendanceStatus, ClassSession, PaymentMethod } from '@/types';
import {
  deleteClass,
  getClassByIdService,
  isLockedRepostaAbsence,
  isMakeupFullyCovered,
  saveClassDetail,
} from '@/services/class-service';
import {
  formatCurrencyInput,
  formatCurrencyInputFromRaw,
  parseCurrencyInput,
} from '@/utils/class-value';
import { isClassSessionEnded } from '@/utils/class-session';
import { formatCurrency } from '@/utils/currency';
import { formatWorkdayLabel } from '@/utils/workday';

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

  const applySession = (loaded: ClassSession) => {
    setSession(loaded);
    setAttendance(loaded.attendance);
    setPaidAmountInput(
      formatCurrencyInput(loaded.paidAmount || loaded.expectedAmount),
    );
    setPaymentMethod(loaded.paymentMethod);
    setContent(loaded.content ?? '');
    setNotes(loaded.notes ?? '');
    setError(null);
  };

  const reloadSession = async () => {
    if (!classId) {
      return;
    }

    const loaded = await getClassByIdService(classId);
    if (loaded) {
      applySession(loaded);
    }
  };

  useEffect(() => {
    if (!open || !classId) {
      return;
    }

    let cancelled = false;

    void getClassByIdService(classId).then((loaded) => {
      if (!cancelled && loaded) {
        applySession(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, classId]);

  if (!open || !classId) {
    return null;
  }

  if (!session || session.id !== classId) {
    return null;
  }

  const actionsBlocked = session.attendance !== 'empty';
  const lockedReposta = isLockedRepostaAbsence(session);
  const makeupCovered =
    session.attendance === 'absent' && isMakeupFullyCovered(session);
  const paidAmount = parseCurrencyInput(paidAmountInput);
  const paymentRemaining = Math.max(session.expectedAmount - paidAmount, 0);
  const classEnded = isClassSessionEnded(session);
  const attendanceLocked = lockedReposta;
  const deleteBlocked = lockedReposta;

  const toggleAttendance = (next: Exclude<AttendanceStatus, 'empty'>) => {
    if (attendanceLocked) {
      return;
    }

    setAttendance((current) => {
      if (current === next) {
        return classEnded ? current : 'empty';
      }

      return next;
    });
  };

  const handleSave = async () => {
    if (lockedReposta) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveClassDetail(session.id, {
        attendance,
        paidAmount:
          attendance === 'attended' && paymentMethod
            ? parseCurrencyInput(paidAmountInput)
            : 0,
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
    setError(null);

    try {
      await deleteClass(session.id);
      setDeleteOpen(false);
      onClose();
    } catch (deleteError) {
      setDeleteOpen(false);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Não foi possível excluir a aula.',
      );
    }
  };

  return (
    <>
      <BottomSheet
        open={open}
        tall
        title={session.studentName}
        onClose={onClose}
        footer={
          lockedReposta ? undefined : (
            <Button
              className="w-full"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              Salvar alterações
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex flex-col gap-1">
              <p className="flex h-8 items-center text-sm text-text-muted">
                {formatWorkdayLabel(new Date(`${session.date}T12:00:00`))}
              </p>
              <p className="font-mono text-sm font-medium text-text-main">
                {session.startTime} - {session.endTime}
              </p>
            </div>
            <div className="flex h-8 shrink-0 items-center gap-1">
              <IconButton
                icon="calendar_month"
                disabled={actionsBlocked}
                onClick={() => setRescheduleOpen(true)}
                aria-label="Alterar horário"
              />
              <IconButton
                icon="link"
                disabled={actionsBlocked}
                onClick={() => setLinkOpen(true)}
                aria-label="Vincular reposição"
              />
              <IconButton
                icon="delete"
                danger
                disabled={deleteBlocked}
                onClick={() => setDeleteOpen(true)}
                aria-label="Excluir aula"
              />
            </div>
          </div>

          {lockedReposta ? (
            <p className="rounded-md bg-bg-subtle px-3 py-2 text-sm text-text-muted">
              Esta falta já foi reposta e permanece apenas como referência. Não
              pode ser alterada nem excluída.
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-main">Presença</span>
            <div className="flex gap-1 rounded-md bg-surface-variant/50 p-1">
              <button
                type="button"
                disabled={attendanceLocked}
                onClick={() => toggleAttendance('attended')}
                className={`flex-1 rounded-md px-3 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  attendance === 'attended'
                    ? 'bg-emerald-100 font-semibold text-emerald-800 shadow-sm'
                    : 'font-medium text-on-surface-variant'
                }`}
              >
                Compareceu
              </button>
              <button
                type="button"
                disabled={attendanceLocked}
                onClick={() => toggleAttendance('absent')}
                className={`flex-1 rounded-md px-3 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
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
                {paymentMethod ? (
                  <>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-text-muted">
                        R$
                      </span>
                      <input
                        inputMode="numeric"
                        value={paidAmountInput}
                        onChange={(event) =>
                          setPaidAmountInput(
                            formatCurrencyInputFromRaw(
                              event.target.value,
                              session.expectedAmount,
                            ),
                          )
                        }
                        className="w-full rounded-md border border-outline-variant py-2.5 pl-10 pr-3 font-mono text-sm"
                      />
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      Valor da aula:{' '}
                      <span className="font-mono font-medium text-text-main">
                        {formatCurrency(session.expectedAmount)}
                      </span>
                    </p>
                    {paymentRemaining > 0 ? (
                      <div className="mt-2">
                        <Badge
                          label={`Falta ${formatCurrency(paymentRemaining)}`}
                          variant="warning"
                        />
                      </div>
                    ) : null}
                  </>
                ) : null}
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
                  className="h-24 resize-none rounded-md border border-outline-variant p-3 text-sm"
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
                  className="h-24 resize-none rounded-md border border-outline-variant p-3 text-sm"
                />
              </label>
            </>
          ) : null}

          {attendance === 'absent' ? (
            <div className="rounded-md bg-bg-subtle p-4">
              <p className="text-sm font-medium text-text-main">
                Aula reposta? {makeupCovered ? 'Sim' : 'Não'}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {makeupCovered
                  ? 'Registro mantido apenas como referência da falta reposta. Contagem e pagamento ficam na aula atual de reposição.'
                  : 'A reposição é vinculada pelo fluxo de vinculação.'}
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
        onClose={() => {
          setLinkOpen(false);
          void reloadSession();
        }}
        studentId={session.studentId}
        studentName={session.studentName}
        targetClass={session}
        initialStartTime={session.startTime}
        initialDurationMinutes={session.durationMinutes}
      />

      <RescheduleClassModal
        open={rescheduleOpen}
        onClose={() => {
          setRescheduleOpen(false);
          void reloadSession();
        }}
        session={session}
      />
    </>
  );
}
