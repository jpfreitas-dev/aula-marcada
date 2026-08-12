import { classRepository } from '@/repositories/class-repository';
import { buildClassResponse } from '@/services/classes/build-class-response';
import type { ClassResponse } from '@/types/class';
import { getWeekStart, getWorkdaysOfWeek, toDateKey } from '@/utils/workday';

class ListClassesByWeek {
  async execute(weekStartKey: string): Promise<ClassResponse[]> {
    const weekStart = getWeekStart(new Date(`${weekStartKey}T12:00:00`));
    const dateKeys = getWorkdaysOfWeek(weekStart).map((date) =>
      toDateKey(date),
    );
    const classes = await classRepository.findByDateKeys(dateKeys);

    return buildClassResponse.executeMany(classes);
  }
}

export const listClassesByWeek = new ListClassesByWeek();
