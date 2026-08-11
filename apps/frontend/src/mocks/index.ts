import { createInitialClasses } from './classes';
import { mockStudents } from './students';
import { initializeStore } from './store';

let initialized = false;

export function ensureMockStoreInitialized(): void {
  if (initialized) {
    return;
  }

  initializeStore(createInitialClasses(), mockStudents);
  initialized = true;
}

export { createInitialClasses } from './classes';
export { mockFinancialSummary, mockPayments } from './payments';
export { mockStudents } from './students';
export {
  getClassById,
  getClassesSnapshot,
  getStudentById,
  getStudentsSnapshot,
  setClasses,
  setStudents,
  subscribe,
} from './store';
