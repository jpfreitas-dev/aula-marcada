import { useState } from 'react';

import {
  createRecurrenceRow,
  StudentRecurrenceConfigFields,
  toCreateRecurrenceInputs,
  type RecurrenceRowValue,
} from '@/components/students/student-recurrence-config-fields';
import { StudentEditorSheet } from '@/components/students/student-editor-sheet';
import {
  StudentPersonalFields,
  type StudentPersonalFieldsValue,
} from '@/components/students/student-personal-fields';
import { createStudent } from '@/services/student-service';
import { parseCurrencyInput } from '@/utils/class-value';

type CreateStudentModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateStudentModal({ open, onClose }: CreateStudentModalProps) {
  if (!open) {
    return null;
  }

  return <CreateStudentForm key="create-student" onClose={onClose} />;
}

function CreateStudentForm({ onClose }: { onClose: () => void }) {
  const [personal, setPersonal] = useState<StudentPersonalFieldsValue>({
    name: '',
    guardianName: '',
    phone: '',
  });
  const [hourlyRateInput, setHourlyRateInput] = useState('50,00');
  const [recurrences, setRecurrences] = useState<RecurrenceRowValue[]>([
    createRecurrenceRow(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await createStudent({
        ...personal,
        hourlyRate: parseCurrencyInput(hourlyRateInput),
        recurrences: toCreateRecurrenceInputs(recurrences),
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível cadastrar o aluno.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentEditorSheet
      open
      tall
      title="Novo Aluno"
      confirmLabel="Cadastrar Aluno"
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

      <section className="rounded-xl border border-purple-100 bg-bg-subtle p-4">
        <StudentRecurrenceConfigFields
          hourlyRateInput={hourlyRateInput}
          onHourlyRateChange={(value) => {
            setError(null);
            setHourlyRateInput(value);
          }}
          recurrences={recurrences}
          onRecurrencesChange={(rows) => {
            setError(null);
            setRecurrences(rows);
          }}
        />
      </section>
    </StudentEditorSheet>
  );
}
