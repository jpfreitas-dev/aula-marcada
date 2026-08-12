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
  PaymentMethod,
  Student,
  StudentRecurrence,
  StudentWeekday,
  UpdateStudentPersonalInput,
  UpdateStudentSettingsInput,
} from '@/types';
import {
  addAdvanceByMethod,
  resolvePaymentMethodFromParts,
  roundMoney,
} from '@/utils/advance-balance';
import {
  calculateExpectedAmount,
  calculateStudentPendingSummary,
  computeFinancialStatus,
} from '@/utils/class-value';
import { resolveStudentFinancialView } from '@/utils/student-financial';
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
        paidPix: 0,
        paidCash: 0,
        advanceAppliedPix: 0,
        advanceAppliedCash: 0,
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
    .filter((value): value is string => Boolean(value))
    .sort();

  return upcoming[0];
}

function sessionMatchesRecurrence(
  session: ClassSession,
  recurrence: CreateStudentRecurrenceInput | StudentRecurrence,
): boolean {
  if (!recurrence.startTime || !recurrence.endTime) {
    return false;
  }

  return (
    getWeekdayFromDateKey(session.date) === recurrence.weekday &&
    session.startTime === recurrence.startTime &&
    session.endTime === recurrence.endTime
  );
}

function sessionMatchesAnyRecurrence(
  session: ClassSession,
  recurrences: Array<CreateStudentRecurrenceInput | StudentRecurrence>,
): boolean {
  return recurrences.some((recurrence) =>
    sessionMatchesRecurrence(session, recurrence),
  );
}

/**
 * Sync agenda after settings change:
 * - never touch past or filled classes;
 * - remove empty classes from cutoff onward that matched the old recurrence
 *   pattern but no longer match the new one;
 * - keep sporadic empty future classes (never matched old recurrence);
 * - recalculate expectedAmount on kept empty future without manual override;
 * - generate missing recurrence slots in the horizon.
 */
function syncAgendaAfterSettingsChange(
  student: Student,
  oldRecurrences: StudentRecurrence[],
  newRecurrences: CreateStudentRecurrenceInput[],
): ClassSession[] {
  const cutoff = toDateKey(getDefaultAgendaDate());
  const filledNewRecurrences = newRecurrences.filter(
    (recurrence) => recurrence.startTime && recurrence.endTime,
  );

  setClasses((current) => {
    const preserved = current.filter((session) => {
      if (session.studentId !== student.id) {
        return true;
      }

      const isPast = session.date < cutoff;
      const isFilled = session.attendance !== 'empty';
      if (isPast || isFilled) {
        return true;
      }

      const matchedOld = sessionMatchesAnyRecurrence(session, oldRecurrences);
      const matchedNew = sessionMatchesAnyRecurrence(
        session,
        filledNewRecurrences,
      );

      if (matchedOld && !matchedNew) {
        return false;
      }

      return true;
    });

    const withUpdatedRates = preserved.map((session) => {
      if (
        session.studentId !== student.id ||
        session.attendance !== 'empty' ||
        session.date < cutoff ||
        session.hasManualAmountOverride
      ) {
        return session;
      }

      return {
        ...session,
        expectedAmount: calculateExpectedAmount(
          session.durationMinutes,
          student.hourlyRate,
        ),
      };
    });

    return withUpdatedRates;
  });

  const generated = buildGeneratedClasses(student, filledNewRecurrences);
  if (generated.length > 0) {
    setClasses((current) => [...current, ...generated]);
  }

  return getClassesSnapshot().filter(
    (session) => session.studentId === student.id,
  );
}

export type StudentListFilter = 'active' | 'inactive';

export async function listStudents(
  filter: StudentListFilter = 'active',
): Promise<Student[]> {
  ensureMockStoreInitialized();
  return [...getStudentsSnapshot()]
    .filter((student) =>
      filter === 'active' ? student.active : !student.active,
    )
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
    throw new Error('Informe o valor por hora.');
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
    advanceBalancePix: 0,
    advanceBalanceCash: 0,
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

  if (!existing.active) {
    throw new Error(
      'Não é possível alterar configurações de aluno desativado.',
    );
  }

  if (input.hourlyRate <= 0) {
    throw new Error('Informe o valor por hora.');
  }

  validateRecurrences(existing.name, input.recurrences, studentId);

  const oldRecurrences = getRecurrencesSnapshot().filter(
    (recurrence) => recurrence.studentId === studentId,
  );

  const savedRecurrences: StudentRecurrence[] = input.recurrences
    .filter((recurrence) => recurrence.startTime && recurrence.endTime)
    .map((recurrence) => ({
      id: createId('recurrence'),
      studentId,
      weekday: recurrence.weekday,
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
    }));

  const updatedStudentBase: Student = {
    ...existing,
    hourlyRate: input.hourlyRate,
  };

  setRecurrences((current) => [
    ...current.filter((recurrence) => recurrence.studentId !== studentId),
    ...savedRecurrences,
  ]);

  const studentClasses = syncAgendaAfterSettingsChange(
    updatedStudentBase,
    oldRecurrences,
    input.recurrences,
  );

  const updatedStudent: Student = {
    ...updatedStudentBase,
    nextClassAt: getNextClassAt(studentClasses),
  };

  setStudents((current) =>
    current.map((student) =>
      student.id === studentId ? updatedStudent : student,
    ),
  );

  return updatedStudent;
}

export async function deactivateStudent(studentId: string): Promise<Student> {
  ensureMockStoreInitialized();

  const existing = getStudentById(studentId);
  if (!existing) {
    throw new Error('Aluno não encontrado.');
  }

  if (!existing.active) {
    throw new Error('Este aluno já está desativado.');
  }

  const now = Date.now();

  setClasses((current) =>
    current.filter((session) => {
      if (session.studentId !== studentId) {
        return true;
      }

      const [hours, minutes] = session.startTime.split(':').map(Number);
      const start = new Date(`${session.date}T12:00:00`);
      start.setHours(hours, minutes, 0, 0);
      return start.getTime() <= now;
    }),
  );

  setRecurrences((current) =>
    current.filter((recurrence) => recurrence.studentId !== studentId),
  );

  const deactivatedStudent: Student = {
    ...existing,
    active: false,
    nextClassAt: undefined,
  };

  setStudents((current) =>
    current.map((student) =>
      student.id === studentId ? deactivatedStudent : student,
    ),
  );

  return deactivatedStudent;
}

export async function reactivateStudent(studentId: string): Promise<Student> {
  ensureMockStoreInitialized();

  const existing = getStudentById(studentId);
  if (!existing) {
    throw new Error('Aluno não encontrado.');
  }

  if (existing.active) {
    throw new Error('Este aluno já está ativo.');
  }

  const studentClasses = getClassesSnapshot().filter(
    (session) => session.studentId === studentId,
  );

  const reactivatedStudent: Student = {
    ...existing,
    active: true,
    nextClassAt: getNextClassAt(studentClasses),
  };

  setStudents((current) =>
    current.map((student) =>
      student.id === studentId ? reactivatedStudent : student,
    ),
  );

  return reactivatedStudent;
}

export type ReceiveStudentPaymentInput = {
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
};

export type ReceiveStudentPaymentResult = {
  student: Student;
  allocatedAmount: number;
  advanceAmount: number;
  settledClassIds: string[];
};

export async function receiveStudentPayment(
  input: ReceiveStudentPaymentInput,
): Promise<ReceiveStudentPaymentResult> {
  ensureMockStoreInitialized();

  const student = getStudentById(input.studentId);
  if (!student) {
    throw new Error('Aluno não encontrado.');
  }

  if (!student.active) {
    throw new Error('Não é possível receber pagamento de aluno desativado.');
  }

  if (input.amount <= 0) {
    throw new Error('Informe um valor maior que zero.');
  }

  if (input.paymentMethod !== 'pix' && input.paymentMethod !== 'cash') {
    throw new Error('Selecione a forma de pagamento.');
  }

  const pendingClasses = getClassesSnapshot()
    .filter(
      (session) =>
        session.studentId === input.studentId &&
        session.attendance === 'attended' &&
        session.paidAmount < session.expectedAmount,
    )
    .sort((left, right) => {
      const dateCompare = left.date.localeCompare(right.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      return left.startTime.localeCompare(right.startTime);
    });

  let remaining = roundMoney(input.amount);
  let allocatedAmount = 0;
  const settledClassIds: string[] = [];
  const paidUpdates = new Map<
    string,
    { paidAmount: number; paidPix: number; paidCash: number }
  >();

  for (const session of pendingClasses) {
    if (remaining <= 0) {
      break;
    }

    const due = roundMoney(session.expectedAmount - session.paidAmount);
    const allocation = Math.min(due, remaining);
    const nextPaidPix =
      input.paymentMethod === 'pix'
        ? roundMoney((session.paidPix ?? 0) + allocation)
        : (session.paidPix ?? 0);
    const nextPaidCash =
      input.paymentMethod === 'cash'
        ? roundMoney((session.paidCash ?? 0) + allocation)
        : (session.paidCash ?? 0);
    const nextPaid = roundMoney(nextPaidPix + nextPaidCash);

    paidUpdates.set(session.id, {
      paidAmount: nextPaid,
      paidPix: nextPaidPix,
      paidCash: nextPaidCash,
    });
    remaining = roundMoney(remaining - allocation);
    allocatedAmount = roundMoney(allocatedAmount + allocation);

    if (nextPaid >= session.expectedAmount) {
      settledClassIds.push(session.id);
    }
  }

  const advanceAmount = Math.max(remaining, 0);
  const nextBuckets = addAdvanceByMethod(
    {
      advanceBalancePix: student.advanceBalancePix,
      advanceBalanceCash: student.advanceBalanceCash,
    },
    advanceAmount,
    input.paymentMethod,
  );

  setClasses((current) =>
    current.map((session) => {
      const update = paidUpdates.get(session.id);
      if (!update) {
        return session;
      }

      return {
        ...session,
        paidAmount: update.paidAmount,
        paidPix: update.paidPix,
        paidCash: update.paidCash,
        paymentMethod: resolvePaymentMethodFromParts(
          update.paidPix,
          update.paidCash,
        ),
        financialStatus: computeFinancialStatus(
          session.expectedAmount,
          update.paidAmount,
        ),
      };
    }),
  );

  const studentClasses = getClassesSnapshot().filter(
    (session) => session.studentId === input.studentId,
  );
  const pending = calculateStudentPendingSummary(studentClasses);
  const financialStatus = resolveStudentFinancialView(
    { ...student, ...nextBuckets },
    pending,
  );

  const updatedStudent: Student = {
    ...student,
    ...nextBuckets,
    financialStatus:
      financialStatus === 'pending'
        ? 'pending'
        : financialStatus === 'advance'
          ? 'advance'
          : 'up_to_date',
  };

  setStudents((current) =>
    current.map((item) =>
      item.id === input.studentId ? updatedStudent : item,
    ),
  );

  return {
    student: updatedStudent,
    allocatedAmount,
    advanceAmount,
    settledClassIds,
  };
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
