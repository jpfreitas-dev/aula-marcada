export const QUARTER_MINUTES = [0, 15, 30, 45] as const;

export const MORNING_PERIOD_START = '08:00';
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
  return minutesToTime(total);
}

export function minutesBetween(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
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

export function clampTimeToBounds(
  time: string,
  minTime: string,
  maxTime: string,
): string {
  const total = timeToMinutes(time);
  const minTotal = timeToMinutes(minTime);
  const maxTotal = timeToMinutes(maxTime);
  return minutesToTime(Math.min(Math.max(total, minTotal), maxTotal));
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
