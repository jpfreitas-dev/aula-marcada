import {
  ensureMockStoreInitialized,
  getClassesSnapshot,
  getRecurrencesSnapshot,
  getStudentById,
  getStudentsSnapshot,
  setClasses,
  setRecurrences,
  setStudents,
} from '@/mocks';
import type {
  ClassPeriod,
  ClassSession,
  CreateStudentInput,
  CreateStudentRecurrenceInput,
  Student,
  StudentRecurrence,
  StudentWeekday,
} from '@/types';
import { calculateExpectedAmount } from '@/utils/class-value';
import { isValidPhone } from '@/utils/phone';
import {
  addMinutesToTime,
  DEFAULT_CLASS_DURATION_MINUTES,
  defaultStartTimeForPeriod,
  minutesBetween,
  periodFromStartTime,
} from '@/utils/time';
import { addWorkdays, getDefaultAgendaDate, toDateKey } from '@/utils/workday';

const RECURRENCE_GENERATION_WORKDAYS = 20;
const WEEKDAY_LABELS: Record<StudentWeekday, string> = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
};
const ALL_WEEKDAYS = [1, 2, 3, 4, 5] as StudentWeekday[];
const ALL_PERIODS: ClassPeriod[] = ['morning', 'afternoon'];

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeStudentName(name: string): string {
  return name.trim().toLocaleLowerCase('pt-BR');
}

function periodFromWeekdayRecurrence(
  recurrence: CreateStudentRecurrenceInput,
): ClassPeriod {
  return periodFromStartTime(recurrence.startTime);
}

function getWeekdayFromDateKey(date: string): StudentWeekday {
  return new Date(`${date}T12:00:00`).getDay() as StudentWeekday;
}

function getRecurrenceDates(weekday: StudentWeekday): string[] {
  const base = getDefaultAgendaDate();
  const dates: string[] = [];

  for (let index = 0; index < RECURRENCE_GENERATION_WORKDAYS; index += 1) {
    const date = addWorkdays(base, index);
    if (date.getDay() === weekday) {
      dates.push(toDateKey(date));
    }
  }

  return dates;
}

function isPeriodBlockedByOtherStudentRecurrence(
  weekday: StudentWeekday,
  period: ClassPeriod,
  excludeStudentId?: string,
): boolean {
  return getRecurrencesSnapshot().some(
    (recurrence) =>
      recurrence.weekday === weekday &&
      periodFromStartTime(recurrence.startTime) === period &&
      (excludeStudentId === undefined ||
        recurrence.studentId !== excludeStudentId),
  );
}

function isWeekdayPeriodBlockedByPending(
  weekday: StudentWeekday,
  period: ClassPeriod,
  pendingRecurrences: CreateStudentRecurrenceInput[],
): boolean {
  return pendingRecurrences.some(
    (recurrence) =>
      recurrence.startTime &&
      recurrence.endTime &&
      recurrence.weekday === weekday &&
      periodFromWeekdayRecurrence(recurrence) === period,
  );
}

function isSlotBlocked(
  date: string,
  period: ClassPeriod,
  pendingRecurrences: CreateStudentRecurrenceInput[],
): boolean {
  const weekday = getWeekdayFromDateKey(date);

  if (isPeriodBlockedByOtherStudentRecurrence(weekday, period)) {
    return true;
  }

  const hasExistingClass = getClassesSnapshot().some(
    (session) => session.date === date && session.period === period,
  );

  if (hasExistingClass) {
    return true;
  }

  return isWeekdayPeriodBlockedByPending(weekday, period, pendingRecurrences);
}

function getNextMonthSporadicCheckDates(weekday: StudentWeekday): string[] {
  const today = getDefaultAgendaDate();
  const horizonDates = new Set(getRecurrenceDates(weekday));
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const dates: string[] = [];
  const cursor = new Date(nextMonthStart);

  while (cursor <= nextMonthEnd) {
    if (cursor.getDay() === weekday) {
      const dateKey = toDateKey(cursor);

      if (!horizonDates.has(dateKey)) {
        dates.push(dateKey);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function validateSporadicConflictsInNextMonth(
  recurrences: CreateStudentRecurrenceInput[],
): void {
  for (const recurrence of recurrences) {
    if (!recurrence.startTime || !recurrence.endTime) {
      continue;
    }

    const period = periodFromWeekdayRecurrence(recurrence);
    const sporadicDates = getNextMonthSporadicCheckDates(recurrence.weekday);
    const hasConflict = sporadicDates.some((date) =>
      getClassesSnapshot().some(
        (session) => session.date === date && session.period === period,
      ),
    );

    if (hasConflict) {
      throw new Error(
        'Há aulas avulsas agendadas neste período no próximo mês. Verifique a agenda antes de continuar.',
      );
    }
  }
}

function isPeriodAvailableOnWeekday(
  weekday: StudentWeekday,
  period: ClassPeriod,
  pendingRecurrences: CreateStudentRecurrenceInput[],
): boolean {
  if (isPeriodBlockedByOtherStudentRecurrence(weekday, period)) {
    return false;
  }

  return getRecurrenceDates(weekday).some(
    (date) => !isSlotBlocked(date, period, pendingRecurrences),
  );
}

function hasFreePeriodOnWeekday(
  weekday: StudentWeekday,
  pendingRecurrences: CreateStudentRecurrenceInput[],
): boolean {
  return ALL_PERIODS.some((period) =>
    isPeriodAvailableOnWeekday(weekday, period, pendingRecurrences),
  );
}

function getFirstAvailableWeekday(
  pendingRecurrences: CreateStudentRecurrenceInput[],
): StudentWeekday | null {
  return (
    ALL_WEEKDAYS.find((weekday) =>
      hasFreePeriodOnWeekday(weekday, pendingRecurrences),
    ) ?? null
  );
}

function getFirstAvailablePeriodForWeekday(
  weekday: StudentWeekday,
  pendingRecurrences: CreateStudentRecurrenceInput[],
): ClassPeriod | null {
  return (
    ALL_PERIODS.find((period) =>
      isPeriodAvailableOnWeekday(weekday, period, pendingRecurrences),
    ) ?? null
  );
}

function validateDuplicateStudent(name: string): void {
  const normalizedName = normalizeStudentName(name);
  const duplicate = getStudentsSnapshot().some(
    (student) => normalizeStudentName(student.name) === normalizedName,
  );

  if (duplicate) {
    throw new Error('Já existe um aluno com esse nome.');
  }
}

function validateRecurrences(
  studentName: string,
  recurrences: CreateStudentRecurrenceInput[],
): void {
  const filled = recurrences.filter(
    (recurrence) => recurrence.startTime && recurrence.endTime,
  );

  for (const recurrence of filled) {
    if (minutesBetween(recurrence.startTime, recurrence.endTime) <= 0) {
      throw new Error('O horário de fim deve ser posterior ao início.');
    }
  }

  const exactSlotKeys = new Set<string>();
  for (const recurrence of filled) {
    const exactKey = `${recurrence.weekday}-${recurrence.startTime}-${recurrence.endTime}`;
    if (exactSlotKeys.has(exactKey)) {
      throw new Error(
        'Não é possível cadastrar aulas recorrentes com o mesmo horário.',
      );
    }
    exactSlotKeys.add(exactKey);
  }

  const studentPeriodKeys = new Set<string>();
  for (const recurrence of filled) {
    const key = `${recurrence.weekday}-${periodFromWeekdayRecurrence(recurrence)}`;
    if (studentPeriodKeys.has(key)) {
      throw new Error(`O aluno ${studentName} já tem aula nesse período.`);
    }
    studentPeriodKeys.add(key);
  }

  for (const recurrence of filled) {
    const period = periodFromWeekdayRecurrence(recurrence);
    const otherRecurrences = filled.filter((item) => item !== recurrence);

    if (
      !isPeriodAvailableOnWeekday(recurrence.weekday, period, otherRecurrences)
    ) {
      throw new Error('Já existe uma aula nesse período.');
    }
  }

  validateSporadicConflictsInNextMonth(filled);
}

function buildGeneratedClasses(
  student: Student,
  recurrences: CreateStudentRecurrenceInput[],
): ClassSession[] {
  const generated: ClassSession[] = [];
  const occupied = new Set(
    getClassesSnapshot().map((session) => `${session.date}-${session.period}`),
  );

  for (const recurrence of recurrences) {
    if (!recurrence.startTime || !recurrence.endTime) {
      continue;
    }

    const durationMinutes = minutesBetween(
      recurrence.startTime,
      recurrence.endTime,
    );
    const period = periodFromWeekdayRecurrence(recurrence);
    const expectedAmount = calculateExpectedAmount(
      durationMinutes,
      student.hourlyRate,
    );

    for (const date of getRecurrenceDates(recurrence.weekday)) {
      const slotKey = `${date}-${period}`;
      if (occupied.has(slotKey)) {
        continue;
      }

      occupied.add(slotKey);
      generated.push({
        id: createId('class'),
        studentId: student.id,
        studentName: student.name,
        date,
        period,
        startTime: recurrence.startTime,
        endTime: recurrence.endTime,
        durationMinutes,
        expectedAmount,
        paidAmount: 0,
        attendance: 'empty',
        financialStatus: 'pending',
        isMakeup: false,
        isMakeupOnly: false,
        linkedAbsenceIds: [],
      });
    }
  }

  return generated;
}

function getNextClassAt(classes: ClassSession[]): string | undefined {
  const now = Date.now();
  const upcoming = classes
    .map((session) => {
      const date = new Date(`${session.date}T${session.startTime}:00`);
      return date.getTime() >= now ? date.toISOString() : null;
    })
    .filter((value): value is string => value !== null)
    .sort();

  return upcoming[0];
}

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

export function getWeekdayOptionsForRow(
  otherRecurrences: CreateStudentRecurrenceInput[],
  currentWeekday?: StudentWeekday,
): Array<{ value: StudentWeekday; label: string }> {
  ensureMockStoreInitialized();

  const availableWeekdays = ALL_WEEKDAYS.filter((weekday) =>
    hasFreePeriodOnWeekday(weekday, otherRecurrences),
  );
  const weekdays = new Set(availableWeekdays);

  if (currentWeekday !== undefined) {
    weekdays.add(currentWeekday);
  }

  return [...weekdays]
    .sort((left, right) => left - right)
    .map((value) => ({
      value,
      label: WEEKDAY_LABELS[value],
    }));
}

export function createDefaultRecurrenceRow(
  existingRows: CreateStudentRecurrenceInput[] = [],
): Pick<CreateStudentRecurrenceInput, 'weekday' | 'startTime' | 'endTime'> {
  ensureMockStoreInitialized();

  const weekday = getFirstAvailableWeekday(existingRows) ?? 1;
  const period =
    getFirstAvailablePeriodForWeekday(weekday, existingRows) ?? 'afternoon';
  const startTime = defaultStartTimeForPeriod(period);

  return {
    weekday,
    startTime,
    endTime: addMinutesToTime(startTime, DEFAULT_CLASS_DURATION_MINUTES),
  };
}

export function hasAvailableRecurrenceWeekdays(
  existingRows: CreateStudentRecurrenceInput[] = [],
): boolean {
  ensureMockStoreInitialized();
  return getFirstAvailableWeekday(existingRows) !== null;
}

export async function createStudent(
  input: CreateStudentInput,
): Promise<Student> {
  ensureMockStoreInitialized();

  const name = input.name.trim();
  const guardianName = input.guardianName.trim();
  const phone = input.phone.trim();

  if (!name) {
    throw new Error('Informe o nome do aluno.');
  }

  if (!guardianName) {
    throw new Error('Informe o nome do responsável.');
  }

  if (!isValidPhone(phone)) {
    throw new Error('Informe um telefone válido.');
  }

  if (input.hourlyRate <= 0) {
    throw new Error('Informe o valor por aula.');
  }

  validateDuplicateStudent(name);

  const recurrences = input.recurrences ?? [];
  validateRecurrences(name, recurrences);

  const student: Student = {
    id: createId('student'),
    name,
    guardianName,
    phone,
    hourlyRate: input.hourlyRate,
    advanceBalance: 0,
    financialStatus: 'up_to_date',
  };

  const savedRecurrences: StudentRecurrence[] = recurrences
    .filter((recurrence) => recurrence.startTime && recurrence.endTime)
    .map((recurrence) => ({
      id: createId('recurrence'),
      studentId: student.id,
      weekday: recurrence.weekday,
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
    }));

  const generatedClasses = buildGeneratedClasses(student, recurrences);
  const nextClassAt = getNextClassAt(generatedClasses);

  setStudents((current) => [...current, { ...student, nextClassAt }]);
  setRecurrences((current) => [...current, ...savedRecurrences]);

  if (generatedClasses.length > 0) {
    setClasses((current) => [...current, ...generatedClasses]);
  }

  return { ...student, nextClassAt };
}

export function getWeekdayOptions(): Array<{
  value: StudentWeekday;
  label: string;
}> {
  return ALL_WEEKDAYS.map((value) => ({
    value,
    label: WEEKDAY_LABELS[value],
  }));
}
