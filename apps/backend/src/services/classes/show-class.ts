import { AppError } from '@/lib/app-error';
import { classRepository } from '@/repositories/class-repository';
import { buildClassResponse } from '@/services/classes/build-class-response';
import type { ClassResponse } from '@/types/class';

class ShowClass {
  async execute(id: string): Promise<ClassResponse> {
    const classRecord = await classRepository.findById(id);

    if (!classRecord) {
      throw new AppError('Aula não encontrada.', 404);
    }

    return buildClassResponse.execute(classRecord);
  }
}

export const showClass = new ShowClass();
