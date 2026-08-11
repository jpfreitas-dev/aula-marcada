import { IconButton } from '@/components/ui/icon-button';
import type { StudentRecurrence } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatStudentRecurrenceLabel } from '@/services/student-service';

type StudentSettingsCardProps = {
  hourlyRate: number;
  recurrences: StudentRecurrence[];
  onEdit?: () => void;
};

export function StudentSettingsCard({
  hourlyRate,
  recurrences,
  onEdit,
}: StudentSettingsCardProps) {
  return (
    <section className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Valor e recorrência
        </h3>
        {onEdit ? (
          <IconButton
            icon="edit"
            size="sm"
            aria-label="Editar valor e recorrência"
            onClick={onEdit}
          />
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <p className="text-sm text-text-main">
          Valor por hora:{' '}
          <span className="font-medium">{formatCurrency(hourlyRate)}</span>
        </p>

        {recurrences.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {recurrences.map((recurrence) => (
              <li key={recurrence.id} className="text-sm text-text-main">
                Aula recorrente:{' '}
                <span className="font-medium">
                  {formatStudentRecurrenceLabel(recurrence)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">
            Nenhuma aula recorrente cadastrada.
          </p>
        )}
      </div>
    </section>
  );
}
