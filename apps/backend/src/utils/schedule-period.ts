import { AppError } from '@/lib/app-error';
import {
  addMinutesToTime,
  getMaxDurationMinutesForStartTime,
  getTimeRangeBoundsForStartTime,
  MIN_CLASS_DURATION_MINUTES,
  timeToMinutes,
} from '@/utils/time';

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
