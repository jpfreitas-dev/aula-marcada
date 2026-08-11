import { createInitialClasses } from './classes';
import { expandRecurrenceClasses } from './expand-recurrence-classes';
import { createInitialRecurrences } from './recurrences';
import { mockStudents } from './students';
import { initializeStore } from './store';

let initialized = false;

export function ensureMockStoreInitialized(): void {
  if (initialized) {
    return;
  }

  const recurrences = createInitialRecurrences();
  const seedClasses = createInitialClasses();
  const classes = expandRecurrenceClasses(
    seedClasses,
    mockStudents,
    recurrences,
  );

  initializeStore(classes, mockStudents, recurrences);
  initialized = true;
}

export { createInitialClasses } from './classes';
export { mockFinancialSummary, mockPayments } from './payments';
export { mockStudents } from './students';
export {
  getClassById,
  getClassesSnapshot,
  getRecurrencesSnapshot,
  getStudentById,
  getStudentsSnapshot,
  setClasses,
  setRecurrences,
  setStudents,
  subscribe,
} from './store';
