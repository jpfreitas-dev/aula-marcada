import { tv, type VariantProps } from 'tailwind-variants';

export const badgeVariants = tv({
  base: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
  variants: {
    variant: {
      success: 'bg-status-success-container text-status-success',
      warning: 'bg-status-warning-container text-status-warning',
      danger: 'bg-status-danger-container text-status-danger',
      info: 'bg-status-info-container text-status-info',
      neutral: 'bg-surface-variant text-on-surface-variant',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

type BadgeProps = VariantProps<typeof badgeVariants> & {
  label: string;
  className?: string;
};

export function Badge({ label, variant, className }: BadgeProps) {
  return <span className={badgeVariants({ variant, className })}>{label}</span>;
}
