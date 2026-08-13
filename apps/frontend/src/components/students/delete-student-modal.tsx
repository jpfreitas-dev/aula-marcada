import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  studentConfigFieldClassName,
  studentConfigLabelClassName,
} from '@/components/students/student-recurrence-config-fields';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { deleteStudent } from '@/services/student-service';
import type { Student } from '@/types';

type DeleteStudentModalProps = {
  open: boolean;
  student: Student;
  onClose: () => void;
};

export function DeleteStudentModal({
  open,
  student,
  onClose,
}: DeleteStudentModalProps) {
  if (!open) {
    return null;
  }

  return (
    <DeleteStudentForm
      key={`delete-${student.id}`}
      student={student}
      onClose={onClose}
    />
  );
}

function DeleteStudentForm({
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

  const canDelete = useMemo(
    () => confirmationName === student.name,
    [confirmationName, student.name],
  );

  const handleDelete = async () => {
    if (!canDelete) {
      setError('Digite exatamente o nome do aluno para confirmar.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteStudent(student.id);
      onClose();
      navigate('/students', { replace: true });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Não foi possível excluir o aluno.',
      );
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Excluir aluno"
      onClose={onClose}
      onSubmit={() => void handleDelete()}
      submitDisabled={!canDelete || saving}
    >
      <p className="text-sm text-text-muted">
        Esta ação é <span className="font-semibold">permanente</span>. Todas as
        aulas, pagamentos, recorrências e histórico de{' '}
        <span className="font-semibold text-text-main">{student.name}</span>{' '}
        serão apagados. Para confirmar, digite exatamente o nome do aluno.
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
          variant="danger"
          className="flex-1"
          disabled={!canDelete || saving}
        >
          Excluir
        </Button>
      </div>
    </Modal>
  );
}
