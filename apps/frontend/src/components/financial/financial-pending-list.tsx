import { Link } from 'react-router-dom';

import type { FinancialPendingItem } from '@/types';
import { formatCurrency } from '@/utils/currency';

type FinancialPendingListProps = {
  items: FinancialPendingItem[];
};

function formatPendingDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

export function FinancialPendingList({ items }: FinancialPendingListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-base font-bold text-text-main">
        Pagamentos pendentes
      </h2>
      <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <Link
              to={`/students/${item.studentId}`}
              className="flex h-full items-center justify-between gap-3 rounded-xl border border-outline-variant/20 bg-surface p-4 shadow-sm transition-transform active:scale-[0.99]"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-text-main">
                  {item.studentName}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  {formatPendingDate(item.date)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-status-warning">
                {formatCurrency(item.amount)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
