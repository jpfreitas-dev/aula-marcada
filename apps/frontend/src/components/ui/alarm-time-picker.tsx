import { Icon } from '@/components/ui/icon';
import { iconButtonClassName } from '@/components/ui/icon-button';
import {
  formatTime,
  getAvailableHours,
  getAvailableMinutesForHour,
  parseTime,
} from '@/utils/time';

const LABEL_CLASS =
  'text-[10px] font-medium uppercase tracking-wider text-text-muted';

type AlarmTimePickerProps = {
  value: string;
  minTime: string;
  maxTime: string;
  onChange: (value: string) => void;
};

export function AlarmTimePicker({
  value,
  minTime,
  maxTime,
  onChange,
}: AlarmTimePickerProps) {
  const { hours, minutes } = parseTime(value);
  const availableHours = getAvailableHours(minTime, maxTime);
  const availableMinutes = getAvailableMinutesForHour(hours, minTime, maxTime);

  const handleHourChange = (nextHour: number) => {
    const minuteOptions = getAvailableMinutesForHour(
      nextHour,
      minTime,
      maxTime,
    );
    const nextMinutes = minuteOptions.includes(minutes)
      ? minutes
      : minuteOptions[0];

    onChange(formatTime(nextHour, nextMinutes));
  };

  const handleMinuteChange = (nextMinute: number) => {
    onChange(formatTime(hours, nextMinute));
  };

  return (
    <div className="w-full overflow-hidden rounded-md border border-outline-variant/40 bg-white p-3 shadow-lg">
      <div className="flex items-center justify-center gap-3">
        <TimeStepper
          label="Hora"
          value={hours.toString().padStart(2, '0')}
          canDecrease={availableHours.indexOf(hours) > 0}
          canIncrease={
            availableHours.indexOf(hours) < availableHours.length - 1
          }
          onDecrease={() => {
            const index = availableHours.indexOf(hours);
            if (index > 0) {
              handleHourChange(availableHours[index - 1]);
            }
          }}
          onIncrease={() => {
            const index = availableHours.indexOf(hours);
            if (index < availableHours.length - 1) {
              handleHourChange(availableHours[index + 1]);
            }
          }}
        />

        <span className="self-center font-mono text-lg font-bold text-text-muted">
          :
        </span>

        <TimeStepper
          label="Min"
          value={minutes.toString().padStart(2, '0')}
          canDecrease={availableMinutes.indexOf(minutes) > 0}
          canIncrease={
            availableMinutes.indexOf(minutes) < availableMinutes.length - 1
          }
          onDecrease={() => {
            const index = availableMinutes.indexOf(minutes);
            if (index > 0) {
              handleMinuteChange(availableMinutes[index - 1]);
            }
          }}
          onIncrease={() => {
            const index = availableMinutes.indexOf(minutes);
            if (index < availableMinutes.length - 1) {
              handleMinuteChange(availableMinutes[index + 1]);
            }
          }}
        />
      </div>
    </div>
  );
}

type TimeStepperProps = {
  label: string;
  value: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
};

function TimeStepper({
  label,
  value,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
}: TimeStepperProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={LABEL_CLASS}>{label}</span>

      <div className="flex flex-col items-center">
        <StepperButton
          direction="up"
          disabled={!canIncrease}
          onClick={onIncrease}
        />

        <span className="min-w-[2.5rem] py-0.5 text-center font-mono text-xl font-semibold text-text-main">
          {value}
        </span>

        <StepperButton
          direction="down"
          disabled={!canDecrease}
          onClick={onDecrease}
        />
      </div>
    </div>
  );
}

type StepperButtonProps = {
  direction: 'up' | 'down';
  disabled: boolean;
  onClick: () => void;
};

function StepperButton({ direction, disabled, onClick }: StepperButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === 'up' ? 'Aumentar' : 'Diminuir'}
      className={`${iconButtonClassName} h-7 w-7 text-primary`}
    >
      <Icon
        name={direction === 'up' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
        className="text-[22px] text-primary"
      />
    </button>
  );
}
