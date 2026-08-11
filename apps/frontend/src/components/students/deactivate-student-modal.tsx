import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  studentConfigFieldClassName,
  studentConfigLabelClassName,
} from '@/components/students/student-recurrence-config-fields';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { deactivateStudent } from '@/services/student-service';
import type { Student } from '@/types';

type DeactivateStudentModalProps = {
  open: boolean;
  student: Student;
  onClose: () => void;
};

export function DeactivateStudentModal({
  open,
  student,
  onClose,
}: DeactivateStudentModalProps) {
  if (!open) {
    return null;
  }

  return (
    <DeactivateStudentForm
      key={`deactivate-${student.id}`}
      student={student}
      onClose={onClose}
    />
  );
}

function DeactivateStudentForm({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [confirmationName, setConfirmationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canDeactivate = useMemo(
    () => confirmationName === student.name,
    [confirmationName, student.name],
  );

  const handleDeactivate = async () => {
    if (!canDeactivate) {
      setError('Digite exatamente o nome do aluno para confirmar.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deactivateStudent(student.id);
      onClose();
      navigate('/students?view=former', { replace: true });
    } catch (deactivateError) {
      setError(
        deactivateError instanceof Error
          ? deactivateError.message
          : 'Não foi possível desativar o aluno.',
      );
      setSaving(false);
    }
  };

  return (
    <Modal open title="Desativar aluno" onClose={onClose}>
      <p className="text-sm text-text-muted">
        O aluno passará para <span className="font-semibold">Ex-alunos</span>.
        Aulas futuras saem da agenda; o histórico permanece para consulta. Para
        confirmar, digite exatamente o nome{' '}
        <span className="font-semibold text-text-main">{student.name}</span>.
      </p>

      <label className="mt-4 flex flex-col">
        <span className={studentConfigLabelClassName}>Nome do aluno</span>
        <input
          value={confirmationName}
          onChange={(event) => {
            setError(null);
            setConfirmationName(event.target.value);
          }}
          placeholder={student.name}
          className={studentConfigFieldClassName}
          autoComplete="off"
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm text-status-danger">{error}</p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={saving}
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          disabled={!canDeactivate || saving}
          onClick={() => void handleDeactivate()}
        >
          Desativar
        </Button>
      </div>
    </Modal>
  );
}
