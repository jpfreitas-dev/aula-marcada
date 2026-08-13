import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { reactivateStudent } from '@/services/student-service';
import type { Student } from '@/types';

type ReactivateStudentModalProps = {
  open: boolean;
  student: Student;
  onClose: () => void;
};

export function ReactivateStudentModal({
  open,
  student,
  onClose,
}: ReactivateStudentModalProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) {
    return null;
  }

  const handleReactivate = async () => {
    setSaving(true);
    setError(null);

    try {
      await reactivateStudent(student.id);
      onClose();
      navigate(`/students/${student.id}`, { replace: true });
    } catch (reactivateError) {
      setError(
        reactivateError instanceof Error
          ? reactivateError.message
          : 'Não foi possível ativar o aluno.',
      );
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Ativar aluno"
      onClose={onClose}
      onSubmit={() => void handleReactivate()}
      submitDisabled={saving}
    >
      <p className="text-sm text-text-muted">
        <span className="font-semibold text-text-main">{student.name}</span>{' '}
        voltará para a lista de alunos e poderá ser agendado novamente.
        Histórico, financeiro e valor por hora permanecem. Não haverá aulas
        recorrentes até você cadastrar novas.
      </p>

      {error ? (
        <p className="mt-3 text-sm text-status-danger">{error}</p>
      ) : null}

      <div className="mt-4 flex gap-2">
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
          variant="primary"
          className="flex-1"
          disabled={saving}
        >
          Ativar
        </Button>
      </div>
    </Modal>
  );
}
