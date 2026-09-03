import { tv } from 'tailwind-variants';

export type SegmentedToggleOption<T extends string> = {
  value: T;
  label: string;
};

const toggleRoot = tv({
  base: 'flex select-none rounded-full bg-purple-100 p-1',
  variants: {
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    fullWidth: false,
  },
});

const toggleButton = tv({
  base: 'flex-1 rounded-full py-1.5 text-xs transition-all',
  variants: {
    active: {
      true: 'bg-surface font-bold text-text-main shadow-sm',
      false: 'font-medium text-on-surface-variant',
    },
  },
});

type SegmentedToggleProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  className?: string;
  fullWidth?: boolean;
};

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  className,
  fullWidth = false,
}: SegmentedToggleProps<T>) {
  return (
    <div
      className={toggleRoot({ fullWidth, className })}
      style={fullWidth ? undefined : { width: `${options.length * 4.5}rem` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={toggleButton({ active: value === option.value })}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
