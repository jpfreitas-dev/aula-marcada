import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildGeneratedClassData,
  getRecurrenceDates,
  getRecurrenceHorizonEnd,
  getNextClassAt,
  isRecurrenceOccurrenceUpcoming,
  RECURRENCE_GENERATION_MONTHS,
} from '@/services/students/recurrence-scheduler';
import { dateFromDateKey } from '@/utils/workday';

describe('recurrence scheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('skips same-weekday occurrences that already started today', () => {
    const reference = new Date('2026-08-17T14:00:00');

    expect(
      isRecurrenceOccurrenceUpcoming('2026-08-17', '08:00', reference),
    ).toBe(false);

    const dates = getRecurrenceDates(1, reference, '08:00');

    expect(dates[0]).toBe('2026-08-24');
    expect(dates).not.toContain('2026-08-17');
  });

  it('keeps same-weekday occurrences that have not started yet today', () => {
    const reference = new Date('2026-08-17T07:00:00');

    expect(
      isRecurrenceOccurrenceUpcoming('2026-08-17', '08:00', reference),
    ).toBe(true);

    const dates = getRecurrenceDates(1, reference, '08:00');

    expect(dates[0]).toBe('2026-08-17');
  });

  it('does not generate classes for occurrences that already started today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T14:00:00'));

    const occupiedSlots = new Set<string>();
    const generated = buildGeneratedClassData(
      'student-1',
      60,
      {
        weekday: 1,
        startTime: '08:00',
        endTime: '10:00',
      },
      occupiedSlots,
    );

    expect(
      generated.map((item) => item.date.toISOString().slice(0, 10)),
    ).not.toContain('2026-08-17');
    expect(generated[0]?.date.toISOString().slice(0, 10)).toBe('2026-08-24');
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-14T08:00:00'));

    const nextClassAt = getNextClassAt([
      {
        date: dateFromDateKey('2026-08-14'),
        startTime: '09:00',
      },
    ]);

    expect(nextClassAt).toBe('2026-08-14T09:00');
  });
});
