import { useState } from 'react';

import { StudentEditorSheet } from '@/components/students/student-editor-sheet';
import {
  StudentPersonalFields,
  type StudentPersonalFieldsValue,
} from '@/components/students/student-personal-fields';
import { updateStudentPersonalInfo } from '@/services/student-service';
import type { Student } from '@/types';

type EditStudentPersonalModalProps = {
  open: boolean;
  student: Student;
  onClose: () => void;
  onSaved?: () => void;
};

export function EditStudentPersonalModal({
  open,
  student,
  onClose,
  onSaved,
}: EditStudentPersonalModalProps) {
  if (!open) {
    return null;
  }

  return (
    <EditStudentPersonalForm
      key={`edit-personal-${student.id}`}
      student={student}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function EditStudentPersonalForm({
  student,
  onClose,
  onSaved,
}: {
  student: Student;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [personal, setPersonal] = useState<StudentPersonalFieldsValue>({
    name: student.name,
    guardianName: student.guardianName,
    phone: student.phone,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await updateStudentPersonalInfo(student.id, personal);
      onSaved?.();
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível atualizar o aluno.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentEditorSheet
      open
      title="Editar Aluno"
      confirmLabel="Salvar"
      saving={saving}
      error={error}
      onClose={onClose}
      onConfirm={() => void handleSave()}
    >
      <StudentPersonalFields
        value={personal}
        onChange={setPersonal}
        onClearError={() => setError(null)}
      />
    </StudentEditorSheet>
  );
}
