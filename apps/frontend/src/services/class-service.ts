import {
  ensureMockStoreInitialized,
  getClassById,
  getClassesSnapshot,
  getStudentById,
  setClasses,
  setStudents,
} from '@/mocks';
import type {
  ClassDetailInput,
  ClassPeriod,
  ClassSession,
  CreateClassInput,
  LinkMakeupInput,
  RescheduleClassInput,
} from '@/types';
import {
  calculateExpectedAmount,
  computeFinancialStatus,
} from '@/utils/class-value';
import {
  isClassSessionEnded,
  isLockedRepostaAbsence,
} from '@/utils/class-session';
import { isSchedulePeriodOpen } from '@/utils/schedule-period';
import {
  addMinutesToTime,
  defaultStartTimeForPeriod,
  getMaxDurationMinutesForStartTime,
  getTimeRangeBoundsForStartTime,
  minutesBetween,
  periodFromStartTime,
  timeToMinutes,
} from '@/utils/time';
import { toDateKey, isWeekday } from '@/utils/workday';

export {
  isMakeupFullyCovered,
  isLockedRepostaAbsence,
} from '@/utils/class-session';

function syncFinancialStatus(session: ClassSession): ClassSession {
  if (session.attendance !== 'attended') {
    return {
      ...session,
      financialStatus: 'pending',
    };
  }

  return {
    ...session,
    financialStatus: computeFinancialStatus(
      session.expectedAmount,
      session.paidAmount,
    ),
  };
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function listClassesByDate(date: Date): Promise<ClassSession[]> {
  ensureMockStoreInitialized();
  const dateKey = toDateKey(date);
  return getClassesSnapshot().filter((session) => session.date === dateKey);
}

export async function listClassesByWeek(
  weekStart: Date,
): Promise<ClassSession[]> {
  ensureMockStoreInitialized();
  const dates = Array.from({ length: 5 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return toDateKey(day);
  });

  return getClassesSnapshot().filter((session) => dates.includes(session.date));
}

export function getSessionForPeriod(
  sessions: ClassSession[],
  period: ClassPeriod,
): ClassSession | undefined {
  return sessions.find((session) => session.period === period);
}

export async function getClassByIdService(
  id: string,
): Promise<ClassSession | null> {
  ensureMockStoreInitialized();
  return getClassById(id) ?? null;
}

function sortClassesByRecency(sessions: ClassSession[]): ClassSession[] {
  return [...sessions].sort((left, right) => {
    const dateCompare = right.date.localeCompare(left.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return right.startTime.localeCompare(left.startTime);
  });
}

export async function listRecentClassesByStudent(
  studentId: string,
  limit = 2,
): Promise<ClassSession[]> {
  ensureMockStoreInitialized();

  return sortClassesByRecency(
    getClassesSnapshot().filter((session) => session.studentId === studentId),
  ).slice(0, limit);
}

export async function listClassesByStudent(
  studentId: string,
): Promise<ClassSession[]> {
  ensureMockStoreInitialized();

  return sortClassesByRecency(
    getClassesSnapshot().filter((session) => session.studentId === studentId),
  );
}

export async function listClasses(): Promise<ClassSession[]> {
  ensureMockStoreInitialized();

  return getClassesSnapshot();
}

export async function getAvailablePeriods(
  date: string,
  excludeClassId?: string,
): Promise<ClassPeriod[]> {
  ensureMockStoreInitialized();
  const occupied = getClassesSnapshot()
    .filter((session) => session.date === date && session.id !== excludeClassId)
    .map((session) => session.period);

  return (['morning', 'afternoon'] as ClassPeriod[]).filter(
    (period) =>
      !occupied.includes(period) && isSchedulePeriodOpen(date, period),
  );
}

function validateMakeupAbsences(absenceIds: string[]): void {
  for (const id of absenceIds) {
    const session = getClassById(id);

    if (
      !session ||
      session.attendance !== 'absent' ||
      !isClassSessionEnded(session)
    ) {
      throw new Error('Falta inválida para reposição.');
    }

    if ((session.pendingMakeupMinutes ?? session.durationMinutes) <= 0) {
      throw new Error('Esta falta já foi totalmente reposta.');
    }
  }
}

function validateMakeupScheduleTime(
  startTime: string,
  durationMinutes: number,
  requiredMinutes: number,
): void {
  const bounds = getTimeRangeBoundsForStartTime(startTime, {
    minDurationMinutes: requiredMinutes,
  });
  const endTime = addMinutesToTime(startTime, durationMinutes);
  const startTotal = timeToMinutes(startTime);
  const endTotal = timeToMinutes(endTime);

  if (
    startTotal < timeToMinutes(bounds.startMin) ||
    startTotal > timeToMinutes(bounds.startMax)
  ) {
    throw new Error('O horário de início está fora do período permitido.');
  }

  if (endTotal > timeToMinutes(bounds.endMax)) {
    throw new Error('A duração excede o limite do período.');
  }

  if (durationMinutes < requiredMinutes) {
    throw new Error('Duração insuficiente para a reposição vinculada.');
  }

  if (durationMinutes > getMaxDurationMinutesForStartTime(startTime)) {
    throw new Error('A duração excede o limite do período.');
  }
}

export async function createClass(
  input: CreateClassInput,
): Promise<ClassSession> {
  ensureMockStoreInitialized();
  const student = getStudentById(input.studentId);

  if (!student) {
    throw new Error('Aluno não encontrado.');
  }

  if (!isWeekday(new Date(`${input.date}T12:00:00`))) {
    throw new Error('Não é possível agendar aulas no fim de semana.');
  }

  const available = await getAvailablePeriods(input.date);
  if (!available.includes(input.period)) {
    throw new Error('Período indisponível.');
  }

  if (input.isMakeupOnly && input.linkedAbsenceIds.length === 0) {
    throw new Error('Aula de reposição exige faltas vinculadas.');
  }

  if (input.linkedAbsenceIds.length > 0) {
    validateMakeupAbsences(input.linkedAbsenceIds);
    const required = calculateRequiredMakeupMinutes(
      null,
      input.linkedAbsenceIds,
      input.isMakeupOnly,
    );
    validateMakeupScheduleTime(
      input.startTime,
      input.durationMinutes,
      required,
    );
  }

  const endTime = addMinutesToTime(input.startTime, input.durationMinutes);
  const session: ClassSession = syncFinancialStatus({
    id: createId('class'),
    studentId: student.id,
    studentName: student.name,
    date: input.date,
    period: input.period,
    startTime: input.startTime,
    endTime,
    durationMinutes: input.durationMinutes,
    expectedAmount: input.expectedAmount,
    paidAmount: 0,
    attendance: 'empty',
    financialStatus: 'pending',
    isMakeup: input.linkedAbsenceIds.length > 0,
    isMakeupOnly: input.isMakeupOnly,
    linkedAbsenceIds: input.linkedAbsenceIds,
    hasManualAmountOverride: input.hasManualAmountOverride,
  });

  setClasses((current) => [...current, session]);

  if (input.linkedAbsenceIds.length > 0) {
    applyMakeupCoverage(
      session.id,
      input.linkedAbsenceIds,
      session.durationMinutes,
    );
  }

  return session;
}

function applyMakeupCoverage(
  targetClassId: string,
  absenceIds: string[],
  availableMinutes: number,
): void {
  let remaining = availableMinutes;

  setClasses((current) =>
    current.map((session) => {
      if (!absenceIds.includes(session.id)) {
        return session;
      }

      const pending = session.pendingMakeupMinutes ?? session.durationMinutes;
      const covered = Math.min(pending, remaining);
      remaining -= covered;

      return {
        ...session,
        pendingMakeupMinutes: pending - covered,
      };
    }),
  );

  setClasses((current) =>
    current.map((session) =>
      session.id === targetClassId
        ? {
            ...session,
            linkedAbsenceIds: absenceIds,
            isMakeup: true,
          }
        : session,
    ),
  );
}

export async function saveClassDetail(
  id: string,
  input: ClassDetailInput,
): Promise<ClassSession> {
  ensureMockStoreInitialized();
  const existing = getClassById(id);

  if (!existing) {
    throw new Error('Aula não encontrada.');
  }

  if (isLockedRepostaAbsence(existing)) {
    throw new Error(
      'Esta falta já foi reposta e não pode ser alterada. Ela permanece apenas como referência.',
    );
  }

  let next: ClassSession = { ...existing };

  if (
    input.attendance === 'empty' &&
    existing.attendance !== 'empty' &&
    isClassSessionEnded(existing)
  ) {
    throw new Error(
      'Não é possível desmarcar a presença de uma aula que já terminou.',
    );
  }

  if (input.attendance === 'empty') {
    next = {
      ...next,
      attendance: 'empty',
      paidAmount: 0,
      paymentMethod: undefined,
      content: undefined,
      notes: undefined,
      financialStatus: 'pending',
    };
  }

  if (input.attendance === 'absent') {
    next = {
      ...next,
      attendance: 'absent',
      paidAmount: 0,
      paymentMethod: undefined,
      content: undefined,
      notes: undefined,
      financialStatus: 'pending',
      pendingMakeupMinutes: next.pendingMakeupMinutes ?? next.durationMinutes,
    };
  }

  if (input.attendance === 'attended') {
    const student = getStudentById(next.studentId);
    let paidAmount = input.paidAmount;
    let advanceBalance = student?.advanceBalance ?? 0;

    if (student && advanceBalance > 0 && paidAmount < next.expectedAmount) {
      const allocation = Math.min(
        advanceBalance,
        next.expectedAmount - paidAmount,
      );
      paidAmount += allocation;
      advanceBalance -= allocation;

      setStudents((current) =>
        current.map((item) =>
          item.id === student.id ? { ...item, advanceBalance } : item,
        ),
      );
    }

    next = syncFinancialStatus({
      ...next,
      attendance: 'attended',
      paidAmount,
      paymentMethod: input.paymentMethod,
      content: input.content,
      notes: input.notes,
    });
  }

  setClasses((current) =>
    current.map((session) => (session.id === id ? next : session)),
  );

  return next;
}

export async function deleteClass(id: string): Promise<void> {
  ensureMockStoreInitialized();
  const session = getClassById(id);

  if (!session) {
    return;
  }

  if (isLockedRepostaAbsence(session)) {
    throw new Error(
      'Esta falta já foi reposta e não pode ser excluída. Ela permanece apenas como referência.',
    );
  }

  if (session.linkedAbsenceIds.length > 0) {
    setClasses((current) =>
      current.map((item) => {
        if (!session.linkedAbsenceIds.includes(item.id)) {
          return item;
        }

        return {
          ...item,
          pendingMakeupMinutes: item.durationMinutes,
        };
      }),
    );
  }

  setClasses((current) => current.filter((item) => item.id !== id));
}

export async function getPendingAbsences(
  studentId: string,
): Promise<ClassSession[]> {
  ensureMockStoreInitialized();
  return getClassesSnapshot().filter(
    (session) =>
      session.studentId === studentId &&
      session.attendance === 'absent' &&
      isClassSessionEnded(session) &&
      (session.pendingMakeupMinutes ?? session.durationMinutes) > 0,
  );
}

export function calculateRequiredMakeupMinutes(
  targetClass: ClassSession | null,
  absenceIds: string[],
  isMakeupOnly: boolean,
): number {
  const absences = absenceIds
    .map((id) => getClassById(id))
    .filter((session): session is ClassSession => Boolean(session));

  const absenceMinutes = absences.reduce(
    (total, session) =>
      total + (session.pendingMakeupMinutes ?? session.durationMinutes),
    0,
  );

  if (isMakeupOnly || !targetClass) {
    return absenceMinutes;
  }

  return targetClass.durationMinutes + absenceMinutes;
}

export async function linkMakeup(
  input: LinkMakeupInput,
): Promise<ClassSession> {
  ensureMockStoreInitialized();
  const durationMinutes = minutesBetween(input.startTime, input.endTime);
  const student = getStudentById(input.studentId);

  if (!student) {
    throw new Error('Aluno não encontrado.');
  }

  if (input.absenceIds.length === 0) {
    throw new Error('Selecione pelo menos uma falta.');
  }

  validateMakeupAbsences(input.absenceIds);

  if (input.targetClassId) {
    const target = getClassById(input.targetClassId);

    if (!target) {
      throw new Error('Aula não encontrada.');
    }

    if (target.attendance !== 'empty') {
      throw new Error(
        'Não é possível vincular reposição a uma aula já preenchida.',
      );
    }

    const required = calculateRequiredMakeupMinutes(
      target,
      input.absenceIds,
      false,
    );

    validateMakeupScheduleTime(input.startTime, durationMinutes, required);

    const expectedAmount = target.hasManualAmountOverride
      ? Math.round(
          (durationMinutes / target.durationMinutes) *
            target.expectedAmount *
            100,
        ) / 100
      : calculateExpectedAmount(durationMinutes, student.hourlyRate);

    const updated: ClassSession = {
      ...target,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes,
      expectedAmount,
      period: periodFromStartTime(input.startTime),
      linkedAbsenceIds: input.absenceIds,
      isMakeup: true,
    };

    setClasses((current) =>
      current.map((session) => (session.id === updated.id ? updated : session)),
    );

    applyMakeupCoverage(
      updated.id,
      input.absenceIds,
      Math.max(durationMinutes - target.durationMinutes, 0),
    );

    return updated;
  }

  if (!input.date || !input.period) {
    throw new Error('Informe data e período para a nova aula de reposição.');
  }

  const required = calculateRequiredMakeupMinutes(null, input.absenceIds, true);

  validateMakeupScheduleTime(input.startTime, durationMinutes, required);

  const expectedAmount = calculateExpectedAmount(
    durationMinutes,
    student.hourlyRate,
  );

  return createClass({
    studentId: student.id,
    date: input.date,
    period: input.period,
    startTime: input.startTime,
    durationMinutes,
    expectedAmount,
    isMakeupOnly: true,
    linkedAbsenceIds: input.absenceIds,
  });
}

export async function rescheduleClass(
  id: string,
  input: RescheduleClassInput,
): Promise<ClassSession> {
  ensureMockStoreInitialized();
  const existing = getClassById(id);

  if (!existing) {
    throw new Error('Aula não encontrada.');
  }

  if (existing.attendance !== 'empty') {
    throw new Error('Não é possível reagendar uma aula já preenchida.');
  }

  const available = await getAvailablePeriods(input.date, id);
  if (!available.includes(input.period)) {
    throw new Error('Período indisponível.');
  }

  const student = getStudentById(existing.studentId);
  const endTime = addMinutesToTime(input.startTime, input.durationMinutes);
  const linkedAbsences = getClassesSnapshot().filter((session) =>
    existing.linkedAbsenceIds.includes(session.id),
  );
  const requiredMakeup = linkedAbsences.reduce(
    (total, session) =>
      total + (session.pendingMakeupMinutes ?? session.durationMinutes),
    0,
  );
  const minimumDuration = existing.durationMinutes + requiredMakeup;

  if (
    existing.linkedAbsenceIds.length > 0 &&
    input.durationMinutes < minimumDuration
  ) {
    throw new Error('Duração insuficiente para a reposição vinculada.');
  }

  const expectedAmount = existing.hasManualAmountOverride
    ? Math.round(
        (input.durationMinutes / existing.durationMinutes) *
          existing.expectedAmount *
          100,
      ) / 100
    : calculateExpectedAmount(input.durationMinutes, student?.hourlyRate ?? 0);

  const updated: ClassSession = {
    ...existing,
    date: input.date,
    period: input.period,
    startTime: input.startTime,
    endTime,
    durationMinutes: input.durationMinutes,
    expectedAmount,
  };

  setClasses((current) =>
    current.map((session) => (session.id === id ? updated : session)),
  );

  return updated;
}

export function getDefaultScheduleStart(period: ClassPeriod): string {
  return defaultStartTimeForPeriod(period);
}
