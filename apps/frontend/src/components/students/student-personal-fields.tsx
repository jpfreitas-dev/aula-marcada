import {
  studentConfigFieldClassName,
  studentConfigLabelClassName,
} from '@/components/students/student-recurrence-config-fields';
import { formatPhoneInput } from '@/utils/phone';

export type StudentPersonalFieldsValue = {
  name: string;
  guardianName: string;
  phone: string;
};

type StudentPersonalFieldsProps = {
  value: StudentPersonalFieldsValue;
  onChange: (value: StudentPersonalFieldsValue) => void;
  onClearError?: () => void;
};

export function StudentPersonalFields({
  value,
  onChange,
  onClearError,
}: StudentPersonalFieldsProps) {
  const updateField = <K extends keyof StudentPersonalFieldsValue>(
    field: K,
    nextValue: StudentPersonalFieldsValue[K],
  ) => {
    onClearError?.();
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <section className="flex flex-col gap-3">
      <label className="flex flex-col">
        <span className={studentConfigLabelClassName}>Nome do Aluno</span>
        <input
          value={value.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="Ex: Maria Joaquina"
          className={studentConfigFieldClassName}
        />
      </label>

      <label className="flex flex-col">
        <span className={studentConfigLabelClassName}>Nome do Responsável</span>
        <input
          value={value.guardianName}
          onChange={(event) => updateField('guardianName', event.target.value)}
          placeholder="Ex: Ana Souza"
          className={studentConfigFieldClassName}
        />
      </label>

      <label className="flex flex-col">
        <span className={studentConfigLabelClassName}>
          Telefone do Responsável
        </span>
        <input
          value={value.phone}
          onChange={(event) =>
            updateField('phone', formatPhoneInput(event.target.value))
          }
          placeholder="(00) 00000-0000"
          inputMode="tel"
          className={`${studentConfigFieldClassName} font-mono`}
        />
      </label>
    </section>
  );
}
