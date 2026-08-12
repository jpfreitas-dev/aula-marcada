import { Icon } from '@/components/ui/icon';
import { iconButtonClassName } from '@/components/ui/icon-button';

type PeriodNavigatorProps = {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
};

export function PeriodNavigator({
  label,
  onPrevious,
  onNext,
  className = '',
}: PeriodNavigatorProps) {
  return (
    <div
      className={`flex min-h-12 items-center justify-between gap-0.5 rounded-md border border-outline-variant/30 bg-surface px-1.5 py-2 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={onPrevious}
        className={`${iconButtonClassName} h-8 w-8 shrink-0 text-primary`}
        aria-label="Período anterior"
      >
        <Icon name="chevron_left" />
      </button>
      <span className="min-w-0 flex-1 truncate px-2 text-center text-sm font-bold text-text-main">
        {label}
      </span>
      <button
        type="button"
        onClick={onNext}
        className={`${iconButtonClassName} h-8 w-8 shrink-0 text-primary`}
        aria-label="Próximo período"
      >
        <Icon name="chevron_right" />
      </button>
    </div>
  );
}
