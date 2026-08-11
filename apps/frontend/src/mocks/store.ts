import type { ClassSession } from '@/types';
import type { Student } from '@/types/student';

type Listener = () => void;

let classes: ClassSession[] = [];
let students: Student[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initializeStore(
  initialClasses: ClassSession[],
  initialStudents: Student[],
) {
  classes = initialClasses;
  students = initialStudents;
  emit();
}

export function getClassesSnapshot(): ClassSession[] {
  return classes;
}

export function getStudentsSnapshot(): Student[] {
  return students;
}

export function setClasses(
  updater: (current: ClassSession[]) => ClassSession[],
): void {
  classes = updater(classes);
  emit();
}

export function setStudents(updater: (current: Student[]) => Student[]): void {
  students = updater(students);
  emit();
}

export function getClassById(id: string): ClassSession | undefined {
  return classes.find((session) => session.id === id);
}

export function getStudentById(id: string): Student | undefined {
  return students.find((student) => student.id === id);
}
