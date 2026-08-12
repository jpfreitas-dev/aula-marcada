import { AppError } from '@/lib/app-error';
import type { ClassPeriod } from '@/types/class';
import {
  addMinutesToTime,
  defaultStartTimeForPeriod,
  getMaxDurationMinutesForStartTime,
  getMaxStartTimeForEndLimit,
  getPeriodTimeBounds,
  getTimeRangeBoundsForStartTime,
  MIN_CLASS_DURATION_MINUTES,
  timeToMinutes,
} from '@/utils/time';
import { toDateKey } from '@/utils/workday';

export function getCurrentTimeRoundedUp(reference = new Date()): string {
  const total = reference.getHours() * 60 + reference.getMinutes();
  const roundedUp = Math.ceil(total / 15) * 15;
  const hours = Math.floor(roundedUp / 60) % 24;
  const minutes = roundedUp % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function getLatestSchedulableStart(
  period: ClassPeriod,
  minDurationMinutes = MIN_CLASS_DURATION_MINUTES,
): string {
  const bounds = getPeriodTimeBounds(period);
  return getMaxStartTimeForEndLimit(bounds.max, bounds.max, minDurationMinutes);
}

function getEarliestSchedulableStart(
  date: string,
  period: ClassPeriod,
  reference = new Date(),
): string | null {
  const todayKey = toDateKey(reference);
  const bounds = getPeriodTimeBounds(period);
  const latestStart = getLatestSchedulableStart(period);

  let earliest = bounds.min;

  if (date === todayKey) {
    const nowRounded = getCurrentTimeRoundedUp(reference);
    if (timeToMinutes(nowRounded) > timeToMinutes(earliest)) {
      earliest = nowRounded;
    }
  }

  if (timeToMinutes(earliest) > timeToMinutes(latestStart)) {
    return null;
  }

  return earliest;
}

export function isSchedulePeriodOpen(
  date: string,
  period: ClassPeriod,
  reference = new Date(),
): boolean {
  const todayKey = toDateKey(reference);
  if (date < todayKey) {
    return false;
  }

  if (date > todayKey) {
    return true;
  }

  return getEarliestSchedulableStart(date, period, reference) !== null;
}

export function validateClassTimeWithinPeriod(
  startTime: string,
  durationMinutes: number,
  minDurationMinutes = MIN_CLASS_DURATION_MINUTES,
): void {
  const bounds = getTimeRangeBoundsForStartTime(startTime, {
    minDurationMinutes,
  });
  const endTime = addMinutesToTime(startTime, durationMinutes);
  const startTotal = timeToMinutes(startTime);
  const endTotal = timeToMinutes(endTime);

  if (
    startTotal < timeToMinutes(bounds.startMin) ||
    startTotal > timeToMinutes(bounds.startMax)
  ) {
    throw new AppError('O horário de início está fora do período permitido.');
  }

  if (endTotal > timeToMinutes(bounds.endMax) || endTotal <= startTotal) {
    throw new AppError(
      'O horário de início e término devem permanecer no mesmo período.',
    );
  }

  if (durationMinutes > getMaxDurationMinutesForStartTime(startTime)) {
    throw new AppError('A duração excede o limite do período.');
  }
}

export function getDefaultScheduleStart(period: ClassPeriod): string {
  return defaultStartTimeForPeriod(period);
}
