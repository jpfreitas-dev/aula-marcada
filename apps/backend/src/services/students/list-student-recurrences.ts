import { AppError } from '@/lib/app-error';
import { studentRecurrenceRepository } from '@/repositories/student-recurrence-repository';
import { studentRepository } from '@/repositories/student-repository';
import type { StudentRecurrenceResponse } from '@/types/student';
import { mapStudentRecurrence } from '@/services/students/recurrence-scheduler';

class ListStudentRecurrences {
  async execute(studentId: string): Promise<StudentRecurrenceResponse[]> {
    const student = await studentRepository.findById(studentId);

    if (!student) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    const recurrences =
      await studentRecurrenceRepository.findByStudentId(studentId);

    return recurrences.map((item) => ({
      ...mapStudentRecurrence(item),
      weekday: item.weekday as StudentRecurrenceResponse['weekday'],
    }));
  }
}

export const listStudentRecurrences = new ListStudentRecurrences();
