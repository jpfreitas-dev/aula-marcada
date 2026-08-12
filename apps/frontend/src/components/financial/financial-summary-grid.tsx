import type { ReactNode } from 'react';

import { formatCurrency } from '@/utils/currency';

type FinancialSummaryGridProps = {
  expected: number;
  realized: number;
  absenceImpact: number;
  realizedPix: number;
  realizedCash: number;
  realizedPixPercent: number;
  realizedCashPercent: number;
};

const cardClassName =
  'flex min-w-0 flex-col items-start justify-start gap-1 rounded-xl border border-outline-variant/20 bg-white px-3 py-2.5 shadow-sm';

const labelClassName = 'w-full truncate text-sm font-medium text-text-muted';

const valueClassName =
  'w-full truncate font-mono font-bold leading-tight tabular-nums [font-size:clamp(0.8rem,3.2vw,1rem)]';

function SummaryCard({
  label,
  value,
  valueColorClassName = 'text-text-main',
  children,
}: {
  label: string;
  value: string;
  valueColorClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cardClassName}>
      <span className={labelClassName}>{label}</span>
      <span className={`${valueClassName} ${valueColorClassName}`}>
        {value}
      </span>
      {children}
    </div>
  );
}

export function FinancialSummaryGrid({
  expected,
  realized,
  absenceImpact,
  realizedPix,
  realizedCash,
  realizedPixPercent,
  realizedCashPercent,
}: FinancialSummaryGridProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <SummaryCard label="Esperado" value={formatCurrency(expected)} />

        <SummaryCard
          label="Realizado"
          value={formatCurrency(realized)}
          valueColorClassName="text-status-success"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SummaryCard
          label="Impacto de Faltas"
          value={`- ${formatCurrency(absenceImpact)}`}
          valueColorClassName="text-status-danger"
        />

        <SummaryCard
          label={`Pix • ${realizedPixPercent}%`}
          value={formatCurrency(realizedPix)}
          valueColorClassName="text-status-success"
        />

        <SummaryCard
          label={`Dinheiro • ${realizedCashPercent}%`}
          value={formatCurrency(realizedCash)}
          valueColorClassName="text-status-success"
        />
      </div>
    </div>
  );
}
