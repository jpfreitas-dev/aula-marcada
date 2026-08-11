import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { getFinancialSummary } from '@/services/financial-service';
import type { FinancialSummary } from '@/types';
import { formatCurrency } from '@/utils/currency';

type FinancialGranularity = 'week' | 'month' | 'year';

const granularityLabels: Record<FinancialGranularity, string> = {
  week: 'Semana',
  month: 'Mês',
  year: 'Ano',
};

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold text-text-main">
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-text-muted">{detail}</p> : null}
    </div>
  );
}

export function FinancialPage() {
  const [granularity, setGranularity] = useState<FinancialGranularity>('week');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    void getFinancialSummary().then(setSummary);
  }, []);

  if (!summary) {
    return (
      <p className="text-sm text-text-muted">Carregando resumo financeiro...</p>
    );
  }

  return (
    <div className="flex flex-col gap-stack-md">
      <div className="flex w-full rounded-lg bg-bg-subtle p-1">
        {(Object.keys(granularityLabels) as FinancialGranularity[]).map(
          (option) => (
            <button
              key={option}
              type="button"
              onClick={() => setGranularity(option)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                granularity === option
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-text-muted'
              }`}
            >
              {granularityLabels[option]}
            </button>
          ),
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <SummaryCard
          label="Esperado"
          value={formatCurrency(summary.expected)}
        />
        <SummaryCard
          label="Realizado"
          value={formatCurrency(summary.realized)}
          detail={`Pix ${formatCurrency(summary.realizedPix)} · Dinheiro ${formatCurrency(summary.realizedCash)}`}
        />
        <SummaryCard
          label="Impacto de faltas"
          value={formatCurrency(summary.absenceImpact)}
        />
      </div>

      <section className="rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-body-md font-semibold text-purple-900">
            Pendências
          </h2>
          <Badge label="Compareceu" variant="warning" />
        </div>
        <p className="text-sm text-text-muted">
          Lista detalhada e gráficos serão implementados na próxima fase. Os
          totais acima já vêm dos mocks compartilhados.
        </p>
        <Link
          to="/students/student-maria"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container transition-colors hover:bg-secondary-fixed"
        >
          Ver aluno com pendência
        </Link>
      </section>
    </div>
  );
}
