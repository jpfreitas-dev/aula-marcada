import { AppError } from '@/lib/app-error';
import { studentRepository } from '@/repositories/student-repository';
import type { StudentResponse } from '@/types/student';
import { buildStudentResponse } from '@/services/students/build-student-response';

class ShowStudent {
  async execute(id: string): Promise<StudentResponse> {
    const student = await studentRepository.findById(id);

    if (!student) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    return buildStudentResponse.execute(student);
  }
}

export const showStudent = new ShowStudent();
