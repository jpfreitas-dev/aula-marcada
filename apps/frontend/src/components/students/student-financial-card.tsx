import { Button } from '@/components/ui/button';
import type { StudentFinancialTone } from '@/utils/student-financial';

type StudentFinancialCardProps = {
  label: string;
  tone: StudentFinancialTone;
  onReceivePayment?: () => void;
};

const toneClasses: Record<StudentFinancialTone, string> = {
  success: 'text-status-success',
  warning: 'text-status-warning',
  info: 'text-status-info',
};

export function StudentFinancialCard({
  label,
  tone,
  onReceivePayment,
}: StudentFinancialCardProps) {
  return (
    <section className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Financeiro
      </h3>
      <p className={`mt-3 text-base font-bold ${toneClasses[tone]}`}>{label}</p>
      {onReceivePayment ? (
        <Button
          type="button"
          className="mt-4 w-full"
          onClick={onReceivePayment}
        >
          + Receber pagamento
        </Button>
      ) : null}
    </section>
  );
}
