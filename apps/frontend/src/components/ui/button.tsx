import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { tv, type VariantProps } from 'tailwind-variants';

export const buttonVariants = tv({
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    variant: {
      primary: 'bg-primary-container text-white hover:bg-primary',
      secondary:
        'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed',
      ghost: 'bg-transparent text-primary hover:bg-primary-fixed/40',
      danger: 'bg-status-danger text-white hover:bg-red-600',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-base',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'lg',
  },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    children: ReactNode;
  };

export function Button({
  variant,
  size,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}
