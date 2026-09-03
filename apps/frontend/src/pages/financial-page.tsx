import { useEffect, useMemo, useState } from 'react';

import { FinancialComparisonChart } from '@/components/financial/financial-comparison-chart';
import { FinancialPendingList } from '@/components/financial/financial-pending-list';
import { FinancialStudentCharts } from '@/components/financial/financial-student-charts';
import { FinancialSummaryGrid } from '@/components/financial/financial-summary-grid';
import { Icon } from '@/components/ui/icon';
import { PeriodNavigator } from '@/components/ui/period-navigator';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { useAgendaRefresh } from '@/context/agenda-refresh-context';
import { getFinancialDashboard } from '@/services/financial-service';
import { listStudents } from '@/services/student-service';
import type { FinancialDashboard, FinancialGranularity } from '@/types';
import {
  formatWeekRange,
  getDefaultAgendaDate,
  getWeekStart,
  toDateKey,
} from '@/utils/workday';

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

export function FinancialPage() {
  const { version: agendaVersion } = useAgendaRefresh();
  const [granularity, setGranularity] = useState<FinancialGranularity>('month');
  const [referenceDate, setReferenceDate] = useState(() =>
    getDefaultAgendaDate(),
  );
  const [studentFilter, setStudentFilter] = useState('all');
  const [studentOptions, setStudentOptions] = useState<
    Array<{ id: string; label: string }>
  >([{ id: 'all', label: 'Todos os alunos' }]);
  const [dashboard, setDashboard] = useState<FinancialDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const referenceDateKey = toDateKey(referenceDate);
  const selectedStudentId = studentFilter === 'all' ? undefined : studentFilter;
  const showStudentCharts = studentFilter === 'all';

  useEffect(() => {
    void listStudents('active').then((students) => {
      setStudentOptions([
        { id: 'all', label: 'Todos os alunos' },
        ...students.map((student) => ({
          id: student.id,
          label: student.name,
        })),
      ]);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Loading state is reset when filters change before fetching dashboard data.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch lifecycle
    setLoading(true);
    setError(null);

    void getFinancialDashboard({
      granularity,
      referenceDate: referenceDateKey,
      studentId: selectedStudentId,
    })
      .then((loaded) => {
        if (!cancelled) {
          setDashboard(loaded);
          setLoading(false);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar o financeiro.',
          );
          setDashboard(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [agendaVersion, granularity, referenceDateKey, selectedStudentId]);

  const summary = useMemo(() => dashboard, [dashboard]);

  const realizedPixPercent =
    summary && summary.realized > 0
      ? Math.round((summary.realizedPix / summary.realized) * 100)
      : 0;
  const realizedCashPercent = 100 - realizedPixPercent;
  const periodLabel = formatPeriodLabel(granularity, referenceDate);

  if (loading && !summary) {
    return (
      <p className="text-sm text-text-muted">
        Carregando informações financeiras...
      </p>
    );
  }

  if (error && !summary) {
    return <p className="text-sm text-status-danger">{error}</p>;
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="flex flex-col gap-stack-md">
      <SegmentedToggle
        value={granularity}
        onChange={setGranularity}
        options={granularityOptions}
      />

      <div className="flex w-full flex-col gap-2 md:flex-row">
        <PeriodNavigator
          className="w-full md:min-w-0 md:flex-1"
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

        <div className="relative w-full md:min-w-0 md:flex-1">
          <select
            value={studentFilter}
            onChange={(event) => setStudentFilter(event.target.value)}
            className="h-12 w-full cursor-pointer appearance-none rounded-md border border-outline-variant/30 bg-surface py-0 pl-3 pr-10 text-sm font-medium leading-none text-text-main shadow-sm focus:ring-0"
          >
            {studentOptions.map((option) => (
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

      <FinancialPendingList items={summary.pending} />
    </div>
  );
}
