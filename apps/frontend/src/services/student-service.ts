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
  UpdateStudentPersonalInput,
  UpdateStudentSettingsInput,
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
  return getRecurrencesSnapshot().some((recurrence) => {
    if (
      excludeStudentId !== undefined &&
      recurrence.studentId === excludeStudentId
    ) {
      return false;
    }

    const owner = getStudentById(recurrence.studentId);
    if (!owner?.active) {
      return false;
    }

    return (
      recurrence.weekday === weekday &&
      periodFromStartTime(recurrence.startTime) === period
    );
  });
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
  excludeStudentId?: string,
): boolean {
  const weekday = getWeekdayFromDateKey(date);

  if (
    isPeriodBlockedByOtherStudentRecurrence(weekday, period, excludeStudentId)
  ) {
    return true;
  }

  const hasExistingClass = getClassesSnapshot().some(
    (session) =>
      session.date === date &&
      session.period === period &&
      (excludeStudentId === undefined ||
        session.studentId !== excludeStudentId),
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
  excludeStudentId?: string,
): boolean {
  if (
    isPeriodBlockedByOtherStudentRecurrence(weekday, period, excludeStudentId)
  ) {
    return false;
  }

  return getRecurrenceDates(weekday).some(
    (date) =>
      !isSlotBlocked(date, period, pendingRecurrences, excludeStudentId),
  );
}

function hasFreePeriodOnWeekday(
  weekday: StudentWeekday,
  pendingRecurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
): boolean {
  return ALL_PERIODS.some((period) =>
    isPeriodAvailableOnWeekday(
      weekday,
      period,
      pendingRecurrences,
      excludeStudentId,
    ),
  );
}

function getFirstAvailableWeekday(
  pendingRecurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
): StudentWeekday | null {
  return (
    ALL_WEEKDAYS.find((weekday) =>
      hasFreePeriodOnWeekday(weekday, pendingRecurrences, excludeStudentId),
    ) ?? null
  );
}

function getFirstAvailablePeriodForWeekday(
  weekday: StudentWeekday,
  pendingRecurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
): ClassPeriod | null {
  return (
    ALL_PERIODS.find((period) =>
      isPeriodAvailableOnWeekday(
        weekday,
        period,
        pendingRecurrences,
        excludeStudentId,
      ),
    ) ?? null
  );
}

function validateDuplicateStudent(
  name: string,
  excludeStudentId?: string,
): void {
  const normalizedName = normalizeStudentName(name);
  const duplicate = getStudentsSnapshot().some(
    (student) =>
      student.id !== excludeStudentId &&
      normalizeStudentName(student.name) === normalizedName,
  );

  if (duplicate) {
    throw new Error('Já existe um aluno com esse nome.');
  }
}

function validateRecurrences(
  studentName: string,
  recurrences: CreateStudentRecurrenceInput[],
  excludeStudentId?: string,
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
      !isPeriodAvailableOnWeekday(
        recurrence.weekday,
        period,
        otherRecurrences,
        excludeStudentId,
      )
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
  return [...getStudentsSnapshot()]
    .filter((student) => student.active)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
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
  excludeStudentId?: string,
): Array<{ value: StudentWeekday; label: string }> {
  ensureMockStoreInitialized();

  const availableWeekdays = ALL_WEEKDAYS.filter((weekday) =>
    hasFreePeriodOnWeekday(weekday, otherRecurrences, excludeStudentId),
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
  excludeStudentId?: string,
): Pick<CreateStudentRecurrenceInput, 'weekday' | 'startTime' | 'endTime'> {
  ensureMockStoreInitialized();

  const weekday = getFirstAvailableWeekday(existingRows, excludeStudentId) ?? 1;
  const period =
    getFirstAvailablePeriodForWeekday(
      weekday,
      existingRows,
      excludeStudentId,
    ) ?? 'afternoon';
  const startTime = defaultStartTimeForPeriod(period);

  return {
    weekday,
    startTime,
    endTime: addMinutesToTime(startTime, DEFAULT_CLASS_DURATION_MINUTES),
  };
}

export function hasAvailableRecurrenceWeekdays(
  existingRows: CreateStudentRecurrenceInput[] = [],
  excludeStudentId?: string,
): boolean {
  ensureMockStoreInitialized();
  return getFirstAvailableWeekday(existingRows, excludeStudentId) !== null;
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
    active: true,
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

export async function updateStudentPersonalInfo(
  studentId: string,
  input: UpdateStudentPersonalInput,
): Promise<Student> {
  ensureMockStoreInitialized();

  const existing = getStudentById(studentId);
  if (!existing) {
    throw new Error('Aluno não encontrado.');
  }

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

  validateDuplicateStudent(name, studentId);

  const updatedStudent: Student = {
    ...existing,
    name,
    guardianName,
    phone,
  };

  setStudents((current) =>
    current.map((student) =>
      student.id === studentId ? updatedStudent : student,
    ),
  );

  if (existing.name !== name) {
    setClasses((current) =>
      current.map((session) =>
        session.studentId === studentId
          ? { ...session, studentName: name }
          : session,
      ),
    );
  }

  return updatedStudent;
}

export async function updateStudentSettings(
  studentId: string,
  input: UpdateStudentSettingsInput,
): Promise<Student> {
  ensureMockStoreInitialized();

  const existing = getStudentById(studentId);
  if (!existing) {
    throw new Error('Aluno não encontrado.');
  }

  if (input.hourlyRate <= 0) {
    throw new Error('Informe o valor por aula.');
  }

  validateRecurrences(existing.name, input.recurrences, studentId);

  const savedRecurrences: StudentRecurrence[] = input.recurrences
    .filter((recurrence) => recurrence.startTime && recurrence.endTime)
    .map((recurrence) => ({
      id: createId('recurrence'),
      studentId,
      weekday: recurrence.weekday,
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
    }));

  const updatedStudent: Student = {
    ...existing,
    hourlyRate: input.hourlyRate,
  };

  setStudents((current) =>
    current.map((student) =>
      student.id === studentId ? updatedStudent : student,
    ),
  );
  setRecurrences((current) => [
    ...current.filter((recurrence) => recurrence.studentId !== studentId),
    ...savedRecurrences,
  ]);

  return updatedStudent;
}

export async function listRecurrencesByStudent(
  studentId: string,
): Promise<StudentRecurrence[]> {
  ensureMockStoreInitialized();

  return getRecurrencesSnapshot().filter(
    (recurrence) => recurrence.studentId === studentId,
  );
}

export function formatStudentRecurrenceLabel(
  recurrence: StudentRecurrence,
): string {
  return `${WEEKDAY_LABELS[recurrence.weekday]}, ${recurrence.startTime} - ${recurrence.endTime}`;
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
