export const QUARTER_MINUTES = [0, 15, 30, 45] as const;

export const MORNING_PERIOD_START = '08:00';
export const EARLY_MORNING_CUTOFF = '08:00';
export const MORNING_PERIOD_END = '12:00';
export const AFTERNOON_PERIOD_START = '12:00';
export const AFTERNOON_PERIOD_END = '22:00';
export const DEFAULT_CLASS_DURATION_MINUTES = 60;
export const MIN_CLASS_DURATION_MINUTES = 60;

export function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}

export function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function timeToMinutes(time: string): number {
  const { hours, minutes } = parseTime(time);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return formatTime(hours, minutes);
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const { hours, minutes } = parseTime(time);
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(total / 60) % 24;
  const nextMinutes = total % 60;
  return formatTime(nextHours, nextMinutes);
}

export function minutesBetween(start: string, end: string): number {
  const startTotal = parseTime(start).hours * 60 + parseTime(start).minutes;
  const endTotal = parseTime(end).hours * 60 + parseTime(end).minutes;
  return endTotal - startTotal;
}

export function periodFromStartTime(
  startTime: string,
): 'morning' | 'afternoon' {
  return parseTime(startTime).hours < 12 ? 'morning' : 'afternoon';
}

export function defaultStartTimeForPeriod(
  period: 'morning' | 'afternoon',
): string {
  return period === 'morning' ? '08:00' : '19:00';
}

export function getPeriodTimeBounds(period: 'morning' | 'afternoon'): {
  min: string;
  max: string;
} {
  return period === 'morning'
    ? { min: MORNING_PERIOD_START, max: MORNING_PERIOD_END }
    : { min: AFTERNOON_PERIOD_START, max: AFTERNOON_PERIOD_END };
}

export function getStartTimeBounds(
  availablePeriods: Array<'morning' | 'afternoon'>,
): { min: string; max: string } {
  if (availablePeriods.length === 0) {
    return { min: MORNING_PERIOD_START, max: AFTERNOON_PERIOD_END };
  }

  if (availablePeriods.length === 2) {
    return { min: MORNING_PERIOD_START, max: AFTERNOON_PERIOD_END };
  }

  return getPeriodTimeBounds(availablePeriods[0]);
}

export function generateQuarterHourSlots(
  minTime: string,
  maxTime: string,
): string[] {
  const minTotal = timeToMinutes(minTime);
  const maxTotal = timeToMinutes(maxTime);
  const slots: string[] = [];

  for (let total = minTotal; total <= maxTotal; total += 15) {
    slots.push(minutesToTime(total));
  }

  return slots;
}

export function getAvailableHours(minTime: string, maxTime: string): number[] {
  const slots = generateQuarterHourSlots(minTime, maxTime);
  const hours = new Set(slots.map((slot) => parseTime(slot).hours));
  return Array.from(hours).sort((a, b) => a - b);
}

export function getAvailableMinutesForHour(
  hour: number,
  minTime: string,
  maxTime: string,
): number[] {
  const minTotal = timeToMinutes(minTime);
  const maxTotal = timeToMinutes(maxTime);

  return QUARTER_MINUTES.filter((minute) => {
    const total = hour * 60 + minute;
    return total >= minTotal && total <= maxTotal;
  });
}

export function clampTimeToBounds(
  time: string,
  minTime: string,
  maxTime: string,
): string {
  const total = timeToMinutes(time);
  const minTotal = timeToMinutes(minTime);
  const maxTotal = timeToMinutes(maxTime);
  const clamped = Math.min(Math.max(total, minTotal), maxTotal);
  return minutesToTime(clamped);
}

export function getMinimumEndTime(startTime: string): string {
  return minutesToTime(timeToMinutes(startTime) + MIN_CLASS_DURATION_MINUTES);
}

export function getEffectiveEndMinTime(
  startTime: string,
  options?: {
    floorTime?: string;
    minDurationMinutes?: number;
  },
): string {
  const minDuration = options?.minDurationMinutes ?? MIN_CLASS_DURATION_MINUTES;
  const minimumEnd = addMinutesToTime(startTime, minDuration);
  const floorTime = options?.floorTime;

  if (!floorTime) {
    return minimumEnd;
  }

  if (timeToMinutes(minimumEnd) < timeToMinutes(floorTime)) {
    return floorTime;
  }

  return minimumEnd;
}

export function shiftEndTimeForStartChange(
  previousStart: string,
  previousEnd: string,
  newStart: string,
  endMinTime: string,
  endMaxTime: string,
  linkedDurationMinutes = MIN_CLASS_DURATION_MINUTES,
): string {
  const previousDuration = minutesBetween(previousStart, previousEnd);

  if (previousDuration === linkedDurationMinutes) {
    const startDelta = timeToMinutes(newStart) - timeToMinutes(previousStart);
    const shiftedEnd = addMinutesToTime(previousEnd, startDelta);

    return clampTimeToBounds(shiftedEnd, endMinTime, endMaxTime);
  }

  if (timeToMinutes(previousEnd) < timeToMinutes(endMinTime)) {
    return clampTimeToBounds(endMinTime, endMinTime, endMaxTime);
  }

  return clampTimeToBounds(previousEnd, endMinTime, endMaxTime);
}

export type TimeRangeBounds = {
  startMin: string;
  startMax: string;
  endMax: string;
  endFloor?: string;
  minDurationMinutes?: number;
};

export function applyStartTimeChange(
  previousStart: string,
  previousEnd: string,
  nextStart: string,
  bounds: TimeRangeBounds,
): { startTime: string; endTime: string } {
  const startTime = clampTimeToBounds(
    nextStart,
    bounds.startMin,
    bounds.startMax,
  );
  const endMinTime = getEffectiveEndMinTime(startTime, {
    floorTime: bounds.endFloor,
    minDurationMinutes: bounds.minDurationMinutes,
  });
  const endTime = shiftEndTimeForStartChange(
    previousStart,
    previousEnd,
    startTime,
    endMinTime,
    bounds.endMax,
  );

  return { startTime, endTime };
}

export function getMaxStartTimeForEndLimit(
  startMaxTime: string,
  endMaxTime: string,
  minDurationMinutes = MIN_CLASS_DURATION_MINUTES,
): string {
  const endLimit = timeToMinutes(endMaxTime) - minDurationMinutes;
  const periodMax = timeToMinutes(startMaxTime);

  return minutesToTime(Math.min(periodMax, endLimit));
}

export function getTimeRangeBoundsForStartTime(
  startTime: string,
  options?: { minDurationMinutes?: number },
): {
  startMin: string;
  startMax: string;
  endMax: string;
} {
  const period = periodFromStartTime(startTime);
  const bounds = getPeriodTimeBounds(period);
  const minDuration = options?.minDurationMinutes ?? MIN_CLASS_DURATION_MINUTES;
  const startMax = getMaxStartTimeForEndLimit(
    bounds.max,
    bounds.max,
    minDuration,
  );

  return {
    startMin: bounds.min,
    startMax,
    endMax: bounds.max,
  };
}

export function getMaxDurationMinutesForStartTime(startTime: string): number {
  const bounds = getTimeRangeBoundsForStartTime(startTime);
  return minutesBetween(startTime, bounds.endMax);
}

export function formatHoursLabel(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours)
    ? `${hours}h`
    : `${hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h`;
}
