import { describe, expect, it } from 'vitest';

import {
  getRecurrenceDates,
  getRecurrenceHorizonEnd,
  getNextClassAt,
  RECURRENCE_GENERATION_MONTHS,
} from '@/services/students/recurrence-scheduler';
import { dateFromDateKey } from '@/utils/workday';

describe('recurrence scheduler', () => {
  it('generates dates for three months ahead on matching weekdays', () => {
    const reference = new Date('2026-08-12T12:00:00.000Z');
    const dates = getRecurrenceDates(4, reference);

    expect(dates.length).toBeGreaterThan(12);
    expect(dates[0]).toBe('2026-08-13');
    expect(dates.at(-1)).toBe('2026-11-12');
    expect(
      dates.every(
        (dateKey) => new Date(`${dateKey}T12:00:00.000Z`).getDay() === 4,
      ),
    ).toBe(true);
  });

  it('uses a three-month horizon end date', () => {
    const reference = new Date('2026-08-12T12:00:00.000Z');
    const end = getRecurrenceHorizonEnd(reference);

    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(10);
    expect(end.getDate()).toBe(12);
    expect(RECURRENCE_GENERATION_MONTHS).toBe(3);
  });

  it('returns next class datetime without timezone shift', () => {
    const nextClassAt = getNextClassAt([
      {
        date: dateFromDateKey('2026-08-14'),
        startTime: '09:00',
      },
    ]);

    expect(nextClassAt).toBe('2026-08-14T09:00');
  });
});
