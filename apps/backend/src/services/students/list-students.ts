import { studentRepository } from '@/repositories/student-repository';
import type { StudentListFilter, StudentResponse } from '@/types/student';
import { buildStudentResponse } from '@/services/students/build-student-response';

class ListStudents {
  async execute(
    filter: StudentListFilter,
    search?: string,
  ): Promise<StudentResponse[]> {
    const students = await studentRepository.list(filter, search);
    return buildStudentResponse.executeMany(students);
  }
}

export const listStudents = new ListStudents();
