import {
  FinancialPieChart,
  FinancialPieLegend,
  type FinancialPieSlice,
} from '@/components/financial/financial-pie-chart';
import type {
  FinancialStudentAbsenceStat,
  FinancialStudentPaymentStat,
} from '@/types';
import { formatCurrency } from '@/utils/currency';
import {
  aggregateSlicesForPie,
  buildAbsenceValueSlices,
  buildPaymentSlices,
} from '@/utils/financial-chart-slices';

type FinancialStudentChartsProps = {
  payments: FinancialStudentPaymentStat[];
  absences: FinancialStudentAbsenceStat[];
};

type ChartSectionProps = {
  title: string;
  slices: FinancialPieSlice[];
  legendValueClassName?: string;
  formatOthersLegend?: (value: number) => string;
};

function ChartSection({
  title,
  slices,
  legendValueClassName = 'text-text-muted',
  formatOthersLegend,
}: ChartSectionProps) {
  const chartSlices = aggregateSlicesForPie(slices, { formatOthersLegend });

  return (
    <section className="flex h-full flex-1 flex-col gap-3 rounded-xl border border-outline-variant/20 bg-white p-4 shadow-sm md:p-5">
      <h3 className="font-display text-sm font-bold text-text-main">{title}</h3>
      <div className="flex w-full flex-col items-center gap-4 overflow-visible md:gap-5">
        <FinancialPieChart slices={chartSlices} />
        <FinancialPieLegend
          slices={chartSlices}
          valueClassName={legendValueClassName}
        />
      </div>
    </section>
  );
}

export function FinancialStudentCharts({
  payments,
  absences,
}: FinancialStudentChartsProps) {
  const paymentSlices = buildPaymentSlices(payments);
  const absenceValueSlices = buildAbsenceValueSlices(absences);

  return (
    <div className="grid grid-cols-1 items-stretch gap-stack-md lg:grid-cols-2">
      <section className="flex h-full min-h-0 flex-col gap-2">
        <h2 className="font-display text-base font-bold text-text-main">
          Quem mais paga
        </h2>
        <ChartSection title="Pagamentos por aluno" slices={paymentSlices} />
      </section>

      <section className="flex h-full min-h-0 flex-col gap-2">
        <h2 className="font-display text-base font-bold text-text-main">
          Quem mais falta
        </h2>
        <ChartSection
          title="Por valor (impacto de faltas)"
          slices={absenceValueSlices}
          legendValueClassName="font-semibold text-status-danger"
          formatOthersLegend={(value) => `- ${formatCurrency(value)}`}
        />
      </section>
    </div>
  );
}
