import { useState } from 'react';

import {
  StudentRecurrenceConfigFields,
  toCreateRecurrenceInputs,
  type RecurrenceRowValue,
} from '@/components/students/student-recurrence-config-fields';
import { StudentEditorSheet } from '@/components/students/student-editor-sheet';
import { updateStudentSettings } from '@/services/student-service';
import type { Student, StudentRecurrence } from '@/types';
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/class-value';

type EditStudentSettingsModalProps = {
  open: boolean;
  student: Student;
  recurrences: StudentRecurrence[];
  onClose: () => void;
  onSaved?: () => void;
};

function toDraftRows(recurrences: StudentRecurrence[]): RecurrenceRowValue[] {
  return recurrences.map((recurrence) => ({
    id: recurrence.id,
    weekday: recurrence.weekday,
    startTime: recurrence.startTime,
    endTime: recurrence.endTime,
  }));
}

export function EditStudentSettingsModal({
  open,
  student,
  recurrences,
  onClose,
  onSaved,
}: EditStudentSettingsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <EditStudentSettingsForm
      key={`edit-settings-${student.id}`}
      student={student}
      recurrences={recurrences}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function EditStudentSettingsForm({
  student,
  recurrences,
  onClose,
  onSaved,
}: {
  student: Student;
  recurrences: StudentRecurrence[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [hourlyRateInput, setHourlyRateInput] = useState(
    formatCurrencyInput(student.hourlyRate),
  );
  const [draftRecurrences, setDraftRecurrences] = useState<
    RecurrenceRowValue[]
  >(() => toDraftRows(recurrences));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await updateStudentSettings(student.id, {
        hourlyRate: parseCurrencyInput(hourlyRateInput),
        recurrences: toCreateRecurrenceInputs(draftRecurrences),
      });
      onSaved?.();
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível atualizar as configurações.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentEditorSheet
      open
      tall
      title="Valor e Recorrência"
      confirmLabel="Salvar"
      saving={saving}
      error={error}
      onClose={onClose}
      onConfirm={() => void handleSave()}
    >
      <section className="rounded-xl border border-purple-100 bg-bg-subtle p-4">
        <StudentRecurrenceConfigFields
          excludeStudentId={student.id}
          hourlyRateInput={hourlyRateInput}
          onHourlyRateChange={(value) => {
            setError(null);
            setHourlyRateInput(value);
          }}
          recurrences={draftRecurrences}
          onRecurrencesChange={(rows) => {
            setError(null);
            setDraftRecurrences(rows);
          }}
        />
      </section>
    </StudentEditorSheet>
  );
}
