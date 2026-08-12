import { Link } from 'react-router-dom';

import type { FinancialPendingItem } from '@/data/financial-demo-data';
import { formatCurrency } from '@/utils/currency';

type FinancialPendingListProps = {
  items: FinancialPendingItem[];
};

export function FinancialPendingList({ items }: FinancialPendingListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg bg-white p-4 text-sm text-text-muted shadow-sm">
        Nenhuma pendência no período selecionado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/students/${item.studentId}`}
          className="flex items-center justify-between rounded-lg border-l-4 border-l-status-danger bg-white p-3 shadow-sm transition-colors hover:bg-surface-container-low"
        >
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold text-text-main">
              {item.studentName}
            </span>
            <span className="mt-0.5 text-xs text-text-muted">
              {item.dateLabel}
            </span>
          </div>
          <span className="font-mono text-sm font-bold text-text-main">
            {formatCurrency(item.amount)}
          </span>
        </Link>
      ))}
    </div>
  );
}
