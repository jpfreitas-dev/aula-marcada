export type SegmentedToggleOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedToggleProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  className?: string;
};

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  className = '',
}: SegmentedToggleProps<T>) {
  return (
    <div
      className={`mx-auto flex rounded-full bg-purple-100 p-1 ${className}`}
      style={{ width: `${options.length * 4.5}rem` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-full py-1.5 text-xs transition-all ${
            value === option.value
              ? 'bg-surface font-bold text-text-main shadow-sm'
              : 'font-medium text-on-surface-variant'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
