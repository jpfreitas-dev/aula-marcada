import { useRef } from 'react';

import { Icon } from '@/components/ui/icon';
import { fieldControlClassName } from '@/components/ui/field';
import { isWeekday } from '@/utils/workday';

type WorkdayDateInputProps = {
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  onWeekendAttempt?: () => void;
};

function formatDateInputLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

export function WorkdayDateInput({
  value,
  min,
  max,
  onChange,
  onWeekendAttempt,
}: WorkdayDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    inputRef.current?.showPicker();
  };

  const handleChange = (nextValue: string) => {
    if (!nextValue) {
      return;
    }

    const selected = new Date(`${nextValue}T12:00:00`);
    if (!isWeekday(selected)) {
      onWeekendAttempt?.();
      return;
    }

    onChange(nextValue);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => handleChange(event.target.value)}
        className={`${fieldControlClassName} text-transparent [&::-webkit-calendar-picker-indicator]:hidden`}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute inset-0 flex items-center justify-between px-3 text-left"
        aria-label="Selecionar data"
      >
        <span className="font-mono text-sm text-text-main">
          {formatDateInputLabel(value)}
        </span>
        <Icon name="calendar_today" className="text-sm text-secondary" />
      </button>
    </div>
  );
}
