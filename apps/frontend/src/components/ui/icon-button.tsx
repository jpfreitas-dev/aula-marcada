import type { ButtonHTMLAttributes } from 'react';

import { tv, type VariantProps } from 'tailwind-variants';

import { Icon } from '@/components/ui/icon';

export const iconButtonVariants = tv({
  base: 'flex shrink-0 cursor-pointer items-center justify-center transition-transform duration-150 hover:scale-[1.2] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100',
  variants: {
    size: {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
    },
    color: {
      default: 'text-outline',
      danger: 'text-status-danger',
    },
  },
  defaultVariants: {
    size: 'sm',
    color: 'default',
  },
});

export const iconButtonClassName = iconButtonVariants.base;

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> &
  VariantProps<typeof iconButtonVariants> & {
    icon: string;
    filled?: boolean;
    /** @deprecated Use color="danger" instead */
    danger?: boolean;
  };

export function IconButton({
  icon,
  filled = false,
  danger = false,
  size,
  color,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const resolvedColor = color ?? (danger ? 'danger' : 'default');

  return (
    <button
      type={type}
      className={iconButtonVariants({
        size,
        color: resolvedColor,
        className,
      })}
      {...props}
    >
      <Icon name={icon} filled={filled} />
    </button>
  );
}
