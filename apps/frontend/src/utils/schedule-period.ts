import type { ClassPeriod } from '@/types';
import {
  formatTime,
  getMaxStartTimeForEndLimit,
  getPeriodTimeBounds,
  MIN_CLASS_DURATION_MINUTES,
  timeToMinutes,
} from '@/utils/time';
import { toDateKey } from '@/utils/workday';

export function getCurrentTimeRoundedUp(reference = new Date()): string {
  const total = reference.getHours() * 60 + reference.getMinutes();
  const roundedUp = Math.ceil(total / 15) * 15;
  const hours = Math.floor(roundedUp / 60) % 24;
  const minutes = roundedUp % 60;
  return formatTime(hours, minutes);
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

export function getEffectiveStartMinTime(
  date: string,
  periodMinTime: string,
  reference = new Date(),
): string {
  const todayKey = toDateKey(reference);
  if (date !== todayKey) {
    return periodMinTime;
  }

  const nowRounded = getCurrentTimeRoundedUp(reference);
  return timeToMinutes(nowRounded) > timeToMinutes(periodMinTime)
    ? nowRounded
    : periodMinTime;
}
