import { AppError } from '@/lib/app-error';
import { studentRepository } from '@/repositories/student-repository';

function normalizeStudentName(name: string): string {
  return name.trim().toLocaleLowerCase('pt-BR');
}

class ValidateDuplicateStudentName {
  async execute(name: string, excludeStudentId?: string): Promise<void> {
    const normalizedName = normalizeStudentName(name);
    const students = await studentRepository.findManyNames(excludeStudentId);
    const hasDuplicate = students.some(
      (item) => normalizeStudentName(item.name) === normalizedName,
    );

    if (hasDuplicate) {
      throw new AppError('Já existe um aluno com esse nome.');
    }
  }
}

export const validateDuplicateStudentName = new ValidateDuplicateStudentName();
