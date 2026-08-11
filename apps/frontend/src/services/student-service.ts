import {
  ensureMockStoreInitialized,
  getStudentById,
  getStudentsSnapshot,
} from '@/mocks';
import type { Student } from '@/types';

export async function listStudents(): Promise<Student[]> {
  ensureMockStoreInitialized();
  return [...getStudentsSnapshot()].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  );
}

export async function getStudentByIdService(
  id: string,
): Promise<Student | null> {
  ensureMockStoreInitialized();
  return getStudentById(id) ?? null;
}
