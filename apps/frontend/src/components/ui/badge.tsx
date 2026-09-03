import type { ClassBadgeVariant } from '@/types';

type BadgeProps = {
  label: string;
  variant?: ClassBadgeVariant;
  className?: string;
};

const variantClasses: Record<ClassBadgeVariant, string> = {
  success: 'bg-emerald-100 text-status-success',
  warning: 'bg-amber-100 text-status-warning',
  danger: 'bg-red-100 text-status-danger',
  info: 'bg-blue-100 text-status-info',
  neutral: 'bg-surface-variant text-text-muted',
};

export function Badge({
  label,
  variant = 'neutral',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${variantClasses[variant]} ${className}`}
    >
      {label}
    </span>
  );
}
