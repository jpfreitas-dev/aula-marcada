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
      className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant bg-bg-subtle p-card-padding transition-colors hover:bg-surface-variant active:scale-[0.98] ${className}`}
      {...props}
    >
      <Icon name="add_circle" className="text-xl text-text-muted" />
      <span className="text-sm font-medium text-text-muted">{label}</span>
    </button>
  );
}
