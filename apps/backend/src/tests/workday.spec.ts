import { describe, expect, it } from 'vitest';

import { dateFromDateKey, toDateKey } from '@/utils/workday';

describe('workday date keys', () => {
  it('converts prisma date columns using utc calendar components', () => {
    const prismaDate = new Date('2026-08-13T00:00:00.000Z');

    expect(toDateKey(prismaDate)).toBe('2026-08-13');
  });

  it('round-trips date keys through dateFromDateKey', () => {
    const dateKey = '2026-08-13';

    expect(toDateKey(dateFromDateKey(dateKey))).toBe(dateKey);
  });

  it('matches occupied slot keys produced from prisma dates', () => {
    const prismaDate = new Date('2026-08-13T00:00:00.000Z');
    const generatedDate = dateFromDateKey('2026-08-13');

    expect(toDateKey(prismaDate)).toBe(toDateKey(generatedDate));
  });
});
