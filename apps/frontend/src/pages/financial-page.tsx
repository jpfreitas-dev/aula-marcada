import { useMemo, useState } from 'react';

import { FinancialComparisonChart } from '@/components/financial/financial-comparison-chart';
import { FinancialStudentCharts } from '@/components/financial/financial-student-charts';
import { FinancialSummaryGrid } from '@/components/financial/financial-summary-grid';
import { Icon } from '@/components/ui/icon';
import { PeriodNavigator } from '@/components/ui/period-navigator';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import {
  FINANCIAL_STUDENT_OPTIONS,
  getFinancialDemoView,
  type FinancialGranularity,
} from '@/data/financial-demo-data';
import { formatWeekRange, getWeekStart } from '@/utils/workday';

const granularityOptions: { value: FinancialGranularity; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
];

function formatPeriodLabel(
  granularity: FinancialGranularity,
  referenceDate: Date,
): string {
  if (granularity === 'week') {
    return formatWeekRange(getWeekStart(referenceDate));
  }

  if (granularity === 'month') {
    const label = referenceDate.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  return String(referenceDate.getFullYear());
}

function shiftReferenceDate(
  granularity: FinancialGranularity,
  referenceDate: Date,
  direction: -1 | 1,
): Date {
  const next = new Date(referenceDate);

  if (granularity === 'week') {
    next.setDate(next.getDate() + direction * 7);
    return next;
  }

  if (granularity === 'month') {
    next.setMonth(next.getMonth() + direction);
    return next;
  }

  next.setFullYear(next.getFullYear() + direction);
  return next;
}

function scaleAmount(amount: number, factor: number): number {
  return Math.round(amount * factor * 100) / 100;
}

export function FinancialPage() {
  const [granularity, setGranularity] = useState<FinancialGranularity>('month');
  const [referenceDate, setReferenceDate] = useState(
    () => new Date(2026, 6, 1),
  );
  const [studentFilter, setStudentFilter] = useState('all');

  const demoView = getFinancialDemoView(granularity);
  const studentFactor = studentFilter === 'all' ? 1 : 0.45;
  const showStudentCharts = studentFilter === 'all';

  const summary = useMemo(
    () => ({
      expected: scaleAmount(demoView.expected, studentFactor),
      realized: scaleAmount(demoView.realized, studentFactor),
      realizedPix: scaleAmount(demoView.realizedPix, studentFactor),
      realizedCash: scaleAmount(demoView.realizedCash, studentFactor),
      absenceImpact: scaleAmount(demoView.absenceImpact, studentFactor),
      chart: demoView.chart,
      studentPayments: demoView.studentPayments.map((item) => ({
        ...item,
        amount: scaleAmount(item.amount, studentFactor),
      })),
      studentAbsences: demoView.studentAbsences.map((item) => ({
        ...item,
        absenceValue: scaleAmount(item.absenceValue, studentFactor),
      })),
    }),
    [demoView, studentFactor],
  );

  const realizedPixPercent =
    summary.realized > 0
      ? Math.round((summary.realizedPix / summary.realized) * 100)
      : 0;
  const realizedCashPercent = 100 - realizedPixPercent;
  const periodLabel = formatPeriodLabel(granularity, referenceDate);

  return (
    <div className="flex flex-col gap-stack-md">
      <SegmentedToggle
        value={granularity}
        onChange={setGranularity}
        options={granularityOptions}
      />

      <div className="flex w-full gap-2">
        <PeriodNavigator
          className="min-w-0 flex-[3]"
          label={periodLabel}
          onPrevious={() =>
            setReferenceDate((current) =>
              shiftReferenceDate(granularity, current, -1),
            )
          }
          onNext={() =>
            setReferenceDate((current) =>
              shiftReferenceDate(granularity, current, 1),
            )
          }
        />

        <div className="relative min-w-0 flex-[2]">
          <select
            value={studentFilter}
            onChange={(event) => setStudentFilter(event.target.value)}
            className="min-h-12 w-full cursor-pointer appearance-none truncate rounded-md border border-outline-variant/30 bg-surface py-2 pl-3 pr-10 text-sm font-medium text-text-main shadow-sm focus:ring-0"
          >
            {FINANCIAL_STUDENT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon
            name="expand_more"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>
      </div>

      <FinancialSummaryGrid
        expected={summary.expected}
        realized={summary.realized}
        absenceImpact={summary.absenceImpact}
        realizedPix={summary.realizedPix}
        realizedCash={summary.realizedCash}
        realizedPixPercent={realizedPixPercent}
        realizedCashPercent={realizedCashPercent}
      />

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-base font-bold text-text-main">
          Comparativo do Período
        </h2>
        <FinancialComparisonChart
          points={summary.chart}
          compact={granularity === 'year'}
        />
      </section>

      {showStudentCharts ? (
        <FinancialStudentCharts
          payments={summary.studentPayments}
          absences={summary.studentAbsences}
        />
      ) : (
        <p className="rounded-xl border border-outline-variant/20 bg-white p-4 text-sm text-text-muted shadow-sm">
          Selecione &quot;Todos os alunos&quot; para ver as estatísticas
          comparativas por aluno.
        </p>
      )}
    </div>
  );
}
