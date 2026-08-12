import { classRepository } from '@/repositories/class-repository';
import type { ClassPeriod } from '@/types/class';
import { isSchedulePeriodOpen } from '@/utils/schedule-period';
import { periodFromPrisma } from '@/services/students/recurrence-scheduler';

const ALL_PERIODS: ClassPeriod[] = ['morning', 'afternoon'];

class GetAvailablePeriods {
  async execute(
    dateKey: string,
    excludeClassId?: string,
  ): Promise<ClassPeriod[]> {
    const occupied = await classRepository.findOccupiedPeriodsByDateKey(
      dateKey,
      excludeClassId,
    );
    const occupiedPeriods = new Set(
      occupied.map((period) => periodFromPrisma(period)),
    );

    return ALL_PERIODS.filter(
      (period) =>
        !occupiedPeriods.has(period) && isSchedulePeriodOpen(dateKey, period),
    );
  }
}

export const getAvailablePeriods = new GetAvailablePeriods();
