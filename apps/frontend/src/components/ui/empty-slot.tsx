import type { ButtonHTMLAttributes } from 'react';

import { Icon } from '@/components/ui/icon';

type EmptySlotProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export function EmptySlot({
  label = 'Adicionar aula',
  className = '',
  ...props
}: EmptySlotProps) {
  return (
    <button
      type="button"
      className={`flex min-h-22 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant bg-bg-subtle p-3 transition-colors hover:bg-surface-variant active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-bg-subtle disabled:active:scale-100 md:min-h-24 md:p-card-padding ${className}`}
      {...props}
    >
      <Icon name="add_circle" className="shrink-0 text-xl text-text-muted" />
      <span className="text-center text-sm font-medium text-text-muted">
        {label}
      </span>
    </button>
  );
}
