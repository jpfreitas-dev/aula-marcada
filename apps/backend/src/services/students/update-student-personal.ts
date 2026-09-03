import { AppError } from '@/lib/app-error';
import { studentRepository } from '@/repositories/student-repository';
import type {
  StudentResponse,
  UpdateStudentPersonalInput,
} from '@/types/student';
import { buildStudentResponse } from '@/services/students/build-student-response';
import { validateDuplicateStudentName } from '@/services/students/validate-duplicate-student-name';
import { isValidPhone } from '@/utils/phone';

class UpdateStudentPersonal {
  async execute(
    studentId: string,
    input: UpdateStudentPersonalInput,
  ): Promise<StudentResponse> {
    const existing = await studentRepository.findById(studentId);

    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    const name = input.name.trim();
    const guardianName = input.guardianName.trim();
    const phone = input.phone.trim();

    if (!name) {
      throw new AppError('Informe o nome do aluno.');
    }

    if (!guardianName) {
      throw new AppError('Informe o nome do responsável.');
    }

    if (!isValidPhone(phone)) {
      throw new AppError('Informe um telefone válido.');
    }

    await validateDuplicateStudentName.execute(name, studentId);

    const updated = await studentRepository.update(studentId, {
      name,
      guardianName,
      phone,
    });

    return buildStudentResponse.execute(updated);
  }
}

export const updateStudentPersonal = new UpdateStudentPersonal();
