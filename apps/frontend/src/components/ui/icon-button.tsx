import type { ButtonHTMLAttributes } from 'react';

import { Icon } from '@/components/ui/icon';

export const iconButtonClassName =
  'flex shrink-0 cursor-pointer items-center justify-center transition-transform duration-150 hover:scale-[1.2] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100';

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  icon: string;
  filled?: boolean;
  danger?: boolean;
  size?: 'sm' | 'md';
};

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
};

export function IconButton({
  icon,
  filled = false,
  danger = false,
  size = 'sm',
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`${iconButtonClassName} ${sizeClasses[size]} ${
        danger ? 'text-status-danger' : 'text-outline'
      } ${className}`}
      {...props}
    >
      <Icon name={icon} filled={filled} />
    </button>
  );
}
