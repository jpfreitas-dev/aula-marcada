import type { ClassPeriod } from '@/types';
import {
  addMinutesToTime,
  defaultStartTimeForPeriod,
  formatTime,
  generateQuarterHourSlots,
  getMaxStartTimeForEndLimit,
  getPeriodTimeBounds,
  getTimeRangeBoundsForStartTime,
  MIN_CLASS_DURATION_MINUTES,
  minutesBetween,
  periodFromStartTime,
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

export function resolveBoundedPeriods(
  availablePeriods: ClassPeriod[],
  options?: {
    lockedPeriod?: ClassPeriod;
    respectPeriodLock?: boolean;
  },
): ClassPeriod[] {
  if (
    options?.respectPeriodLock &&
    options.lockedPeriod &&
    availablePeriods.includes(options.lockedPeriod)
  ) {
    return [options.lockedPeriod];
  }

  return availablePeriods;
}

export function getAggregatedScheduleTimeBounds(
  date: string,
  periods: ClassPeriod[],
  options?: {
    minDurationMinutes?: number;
    reference?: Date;
  },
): {
  hasAvailability: boolean;
  startMin: string;
  startMax: string;
} {
  if (periods.length === 0) {
    return {
      hasAvailability: false,
      startMin: '08:00',
      startMax: '08:00',
    };
  }

  const minDuration = options?.minDurationMinutes ?? MIN_CLASS_DURATION_MINUTES;
  const reference = options?.reference ?? new Date();

  let startMin: string | null = null;
  let startMax: string | null = null;

  for (const period of periods) {
    const periodBounds = getPeriodTimeBounds(period);
    const periodStartMax = getMaxStartTimeForEndLimit(
      periodBounds.max,
      periodBounds.max,
      minDuration,
    );
    const periodStartMin = getEffectiveStartMinTime(
      date,
      periodBounds.min,
      reference,
    );

    if (
      startMin === null ||
      timeToMinutes(periodStartMin) < timeToMinutes(startMin)
    ) {
      startMin = periodStartMin;
    }

    if (
      startMax === null ||
      timeToMinutes(periodStartMax) > timeToMinutes(startMax)
    ) {
      startMax = periodStartMax;
    }
  }

  if (
    startMin === null ||
    startMax === null ||
    timeToMinutes(startMin) > timeToMinutes(startMax)
  ) {
    return {
      hasAvailability: false,
      startMin: startMin ?? '08:00',
      startMax: startMax ?? '08:00',
    };
  }

  return {
    hasAvailability: true,
    startMin,
    startMax,
  };
}

export function isStartTimeAllowedForPeriods(
  startTime: string,
  periods: ClassPeriod[],
  options?: { minDurationMinutes?: number },
): boolean {
  const period = periodFromStartTime(startTime);
  if (!periods.includes(period)) {
    return false;
  }

  const bounds = getTimeRangeBoundsForStartTime(startTime, options);
  const startTotal = timeToMinutes(startTime);

  return (
    startTotal >= timeToMinutes(bounds.startMin) &&
    startTotal <= timeToMinutes(bounds.startMax)
  );
}

/** Next valid start at/after candidate across available periods (skips period gaps). */
export function findNextAllowedStartTime(
  candidate: string,
  date: string,
  periods: ClassPeriod[],
  aggregatedBounds: { startMin: string; startMax: string },
  options?: { minDurationMinutes?: number; reference?: Date },
): string | null {
  if (periods.length === 0) {
    return null;
  }

  const slots = generateQuarterHourSlots(
    aggregatedBounds.startMin,
    aggregatedBounds.startMax,
  );
  const candidateTotal = timeToMinutes(candidate);

  for (const slot of slots) {
    if (timeToMinutes(slot) < candidateTotal) {
      continue;
    }

    const startMin = getEffectiveStartMinTime(
      date,
      getTimeRangeBoundsForStartTime(slot, options).startMin,
      options?.reference,
    );
    if (timeToMinutes(slot) < timeToMinutes(startMin)) {
      continue;
    }

    if (isStartTimeAllowedForPeriods(slot, periods, options)) {
      return slot;
    }
  }

  return null;
}

/** Previous valid start at/before candidate across available periods. */
export function findPreviousAllowedStartTime(
  candidate: string,
  date: string,
  periods: ClassPeriod[],
  aggregatedBounds: { startMin: string; startMax: string },
  options?: { minDurationMinutes?: number; reference?: Date },
): string | null {
  if (periods.length === 0) {
    return null;
  }

  const slots = generateQuarterHourSlots(
    aggregatedBounds.startMin,
    aggregatedBounds.startMax,
  );
  const candidateTotal = timeToMinutes(candidate);

  for (let index = slots.length - 1; index >= 0; index -= 1) {
    const slot = slots[index];
    if (timeToMinutes(slot) > candidateTotal) {
      continue;
    }

    const startMin = getEffectiveStartMinTime(
      date,
      getTimeRangeBoundsForStartTime(slot, options).startMin,
      options?.reference,
    );
    if (timeToMinutes(slot) < timeToMinutes(startMin)) {
      continue;
    }

    if (isStartTimeAllowedForPeriods(slot, periods, options)) {
      return slot;
    }
  }

  return null;
}

export function getDefaultStartForPeriods(
  date: string,
  periods: ClassPeriod[],
  options?: {
    minDurationMinutes?: number;
    reference?: Date;
  },
): string | null {
  const aggregated = getAggregatedScheduleTimeBounds(date, periods, options);
  if (!aggregated.hasAvailability) {
    return null;
  }

  const preferredPeriod = periods[0];
  let candidate = defaultStartTimeForPeriod(preferredPeriod);
  const bounds = getTimeRangeBoundsForStartTime(candidate, options);
  const startMin = getEffectiveStartMinTime(
    date,
    bounds.startMin,
    options?.reference,
  );

  if (timeToMinutes(candidate) < timeToMinutes(startMin)) {
    candidate = startMin;
  }

  if (timeToMinutes(candidate) > timeToMinutes(bounds.startMax)) {
    candidate = bounds.startMax;
  }

  if (!isStartTimeAllowedForPeriods(candidate, periods, options)) {
    return aggregated.startMin;
  }

  return candidate;
}

export function resolveStartTimeChangeBounds(
  date: string,
  nextStart: string,
  aggregatedBounds: { startMin: string; startMax: string },
  options?: { minDurationMinutes?: number; reference?: Date },
): {
  startMin: string;
  startMax: string;
  endMax: string;
} {
  const bounds = getTimeRangeBoundsForStartTime(nextStart, options);
  const periodStartMin = getEffectiveStartMinTime(
    date,
    bounds.startMin,
    options?.reference,
  );

  const startMin =
    timeToMinutes(periodStartMin) > timeToMinutes(aggregatedBounds.startMin)
      ? periodStartMin
      : aggregatedBounds.startMin;

  return {
    startMin,
    startMax: bounds.startMax,
    endMax: bounds.endMax,
  };
}

/**
 * Keep the current start when it still fits an available period; otherwise
 * move to the earliest valid default. End stays inside the start's period.
 */
export function syncTimesForAvailablePeriods(
  date: string,
  periods: ClassPeriod[],
  currentStart: string,
  currentEnd: string,
  options?: {
    minDurationMinutes?: number;
    reference?: Date;
  },
): { startTime: string; endTime: string } | null {
  const minDuration = options?.minDurationMinutes ?? MIN_CLASS_DURATION_MINUTES;
  const boundOptions = { minDurationMinutes: minDuration };
  const aggregated = getAggregatedScheduleTimeBounds(date, periods, options);

  if (!aggregated.hasAvailability) {
    return null;
  }

  let startTime = currentStart;

  if (!isStartTimeAllowedForPeriods(startTime, periods, boundOptions)) {
    startTime =
      getDefaultStartForPeriods(date, periods, options) ?? aggregated.startMin;
  } else {
    const periodBounds = getTimeRangeBoundsForStartTime(
      startTime,
      boundOptions,
    );
    const startMin = getEffectiveStartMinTime(
      date,
      periodBounds.startMin,
      options?.reference,
    );

    if (timeToMinutes(startTime) < timeToMinutes(startMin)) {
      startTime = startMin;
    }

    if (timeToMinutes(startTime) > timeToMinutes(periodBounds.startMax)) {
      startTime = periodBounds.startMax;
    }
  }

  const bounds = getTimeRangeBoundsForStartTime(startTime, boundOptions);
  const desiredDuration = Math.max(
    minutesBetween(currentStart, currentEnd),
    minDuration,
  );
  const endMinTime = addMinutesToTime(startTime, minDuration);
  const preferredEnd = addMinutesToTime(startTime, desiredDuration);
  const endTime =
    timeToMinutes(preferredEnd) > timeToMinutes(bounds.endMax)
      ? bounds.endMax
      : timeToMinutes(preferredEnd) < timeToMinutes(endMinTime)
        ? endMinTime
        : preferredEnd;

  return { startTime, endTime };
}
