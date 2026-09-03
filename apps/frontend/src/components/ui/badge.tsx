import type { ClassBadgeVariant } from '@/types';

type BadgeProps = {
  label: string;
  variant?: ClassBadgeVariant;
  className?: string;
};

const variantClasses: Record<ClassBadgeVariant, string> = {
  success: 'bg-status-success-container text-status-success',
  warning: 'bg-status-warning-container text-status-warning',
  danger: 'bg-status-danger-container text-status-danger',
  info: 'bg-status-info-container text-status-info',
  neutral: 'bg-surface-variant text-on-surface-variant',
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
