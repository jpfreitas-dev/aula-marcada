import { mockStudents } from '@/mocks';
import type { Student } from '@/types';

export async function listStudents(): Promise<Student[]> {
  return [...mockStudents].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  );
}

export async function getStudentById(id: string): Promise<Student | null> {
  return mockStudents.find((student) => student.id === id) ?? null;
}
