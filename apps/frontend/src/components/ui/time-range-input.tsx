import { useEffect, useRef, useState } from 'react';

import { AlarmTimePicker } from '@/components/ui/alarm-time-picker';
import { fieldControlClassName } from '@/components/ui/field';
import { clampTimeToBounds, getEffectiveEndMinTime } from '@/utils/time';

type ActiveField = 'start' | 'end' | null;

export type TimeRangeInputVariant = 'default' | 'plain';
export type TimeRangePickerPlacement = 'above' | 'below';

type TimeRangeInputProps = {
  startTime: string;
  endTime: string;
  startMinTime: string;
  startMaxTime: string;
  endMaxTime: string;
  endFloorTime?: string;
  minDurationMinutes?: number;
  disabled?: boolean;
  variant?: TimeRangeInputVariant;
  pickerPlacement?: TimeRangePickerPlacement;
  className?: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
};

const pickerPlacementClasses: Record<TimeRangePickerPlacement, string> = {
  below: 'top-[calc(100%+0.25rem)]',
  above: 'bottom-[calc(100%+0.25rem)]',
};

const controlVariants: Record<TimeRangeInputVariant, string> = {
  default: `${fieldControlClassName} flex items-center justify-center`,
  plain: 'flex min-w-0 flex-1 items-center justify-center',
};

export function TimeRangeInput({
  startTime,
  endTime,
  startMinTime,
  startMaxTime,
  endMaxTime,
  endFloorTime,
  minDurationMinutes,
  disabled = false,
  variant = 'default',
  pickerPlacement = 'below',
  className = '',
  onStartChange,
  onEndChange,
}: TimeRangeInputProps) {
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const endMinTime = getEffectiveEndMinTime(startTime, {
    floorTime: endFloorTime,
    minDurationMinutes,
  });

  const handleStartChange = (value: string) => {
    onStartChange(clampTimeToBounds(value, startMinTime, startMaxTime));
  };

  const handleEndChange = (value: string) => {
    onEndChange(clampTimeToBounds(value, endMinTime, endMaxTime));
  };

  const toggleField = (field: 'start' | 'end') => {
    if (disabled) {
      return;
    }

    setActiveField((current) => (current === field ? null : field));
  };

  useEffect(() => {
    if (!activeField) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target)) {
        setActiveField(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [activeField]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`${controlVariants[variant]} ${
          disabled ? 'opacity-70' : ''
        } ${disabled ? '' : 'cursor-pointer'}`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => toggleField('start')}
          className={`font-mono text-sm font-medium transition-colors disabled:cursor-not-allowed ${
            activeField === 'start'
              ? 'text-primary'
              : 'text-text-main hover:text-primary'
          }`}
        >
          {startTime}
        </button>
        <span className="mx-1 font-mono text-sm text-text-muted">-</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => toggleField('end')}
          className={`font-mono text-sm font-medium transition-colors disabled:cursor-not-allowed ${
            activeField === 'end'
              ? 'text-primary'
              : 'text-text-main hover:text-primary'
          }`}
        >
          {endTime}
        </button>
      </div>

      {activeField === 'start' ? (
        <div
          className={`absolute left-0 right-0 z-30 min-w-0 ${pickerPlacementClasses[pickerPlacement]}`}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <AlarmTimePicker
            value={startTime}
            minTime={startMinTime}
            maxTime={startMaxTime}
            onChange={handleStartChange}
          />
        </div>
      ) : null}

      {activeField === 'end' ? (
        <div
          className={`absolute left-0 right-0 z-30 min-w-0 ${pickerPlacementClasses[pickerPlacement]}`}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <AlarmTimePicker
            value={endTime}
            minTime={endMinTime}
            maxTime={endMaxTime}
            onChange={handleEndChange}
          />
        </div>
      ) : null}
    </div>
  );
}
