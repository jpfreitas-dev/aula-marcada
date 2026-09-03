import { tv, type VariantProps } from 'tailwind-variants';

export const svgIconVariants = tv({
  base: 'shrink-0',
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
    },
    animate: {
      false: '',
      true: 'animate-spin',
    },
  },
  defaultVariants: {
    size: 'md',
    animate: false,
  },
});

type SvgIconProps = React.ComponentProps<'svg'> &
  VariantProps<typeof svgIconVariants> & {
    svg: React.FC<React.ComponentProps<'svg'>>;
  };

export function SvgIcon({
  svg: SvgComponent,
  size,
  animate,
  className,
  ...props
}: SvgIconProps) {
  return (
    <SvgComponent
      className={svgIconVariants({ size, animate, className })}
      aria-hidden="true"
      {...props}
    />
  );
}
