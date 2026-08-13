import { classRepository } from '@/repositories/class-repository';
import { buildClassResponse } from '@/services/classes/build-class-response';
import { ensureRecurrenceHorizon } from '@/services/students/ensure-recurrence-horizon';
import type { ClassResponse } from '@/types/class';

class ListClassesByDate {
  async execute(dateKey: string): Promise<ClassResponse[]> {
    await ensureRecurrenceHorizon.execute();

    const classes = await classRepository.findByDateKey(dateKey);

    return buildClassResponse.executeMany(classes);
  }
}

export const listClassesByDate = new ListClassesByDate();
