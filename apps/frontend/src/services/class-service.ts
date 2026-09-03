import axios from 'axios';

import { api } from '@/services/api';
import type {
  ClassDetailInput,
  ClassPeriod,
  ClassSession,
  CreateClassInput,
  LinkMakeupInput,
  RescheduleClassInput,
} from '@/types';
import { toApiRequestError } from '@/utils/api-error';
import { defaultStartTimeForPeriod } from '@/utils/time';
import { toDateKey } from '@/utils/workday';

export {
  isMakeupFullyCovered,
  isLockedRepostaAbsence,
} from '@/utils/class-session';

export async function listClassesByDate(date: Date): Promise<ClassSession[]> {
  try {
    const response = await api.get<ClassSession[]>('/classes', {
      params: { date: toDateKey(date) },
    });
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível carregar as aulas.');
  }
}

export async function listClassesByWeek(
  weekStart: Date,
): Promise<ClassSession[]> {
  try {
    const response = await api.get<ClassSession[]>('/classes/week', {
      params: { start: toDateKey(weekStart) },
    });
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível carregar as aulas.');
  }
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
  try {
    const response = await api.get<ClassSession>(`/classes/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toApiRequestError(error, 'Não foi possível carregar a aula.');
  }
}

export async function listRecentClassesByStudent(
  studentId: string,
  limit = 2,
): Promise<ClassSession[]> {
  try {
    const response = await api.get<ClassSession[]>(
      `/classes/by-student/${studentId}`,
      { params: { limit } },
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível carregar as aulas.');
  }
}

export async function listClassesByStudent(
  studentId: string,
): Promise<ClassSession[]> {
  try {
    const response = await api.get<ClassSession[]>(
      `/classes/by-student/${studentId}`,
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível carregar as aulas.');
  }
}

export async function getAvailablePeriods(
  date: string,
  excludeClassId?: string,
): Promise<ClassPeriod[]> {
  try {
    const response = await api.get<ClassPeriod[]>(
      '/classes/available-periods',
      {
        params: { date, excludeClassId },
      },
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(
      error,
      'Não foi possível carregar os períodos disponíveis.',
    );
  }
}

export async function createClass(
  input: CreateClassInput,
): Promise<ClassSession> {
  try {
    const response = await api.post<ClassSession>('/classes', input);
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível agendar a aula.');
  }
}

export async function saveClassDetail(
  id: string,
  input: ClassDetailInput,
): Promise<ClassSession> {
  try {
    const response = await api.patch<ClassSession>(
      `/classes/${id}/attendance`,
      {
        attendance: input.attendance,
        paidAmount: input.paidAmount,
        paymentMethod: input.paymentMethod,
        content: input.content,
        notes: input.notes,
      },
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível salvar a aula.');
  }
}

export async function deleteClass(id: string): Promise<void> {
  try {
    await api.delete(`/classes/${id}`);
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível excluir a aula.');
  }
}

export async function getPendingAbsences(
  studentId: string,
): Promise<ClassSession[]> {
  try {
    const response = await api.get<ClassSession[]>(
      '/classes/pending-absences',
      {
        params: { studentId },
      },
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível carregar as faltas.');
  }
}

export async function linkMakeup(
  input: LinkMakeupInput,
): Promise<ClassSession> {
  try {
    const response = await api.post<ClassSession>(
      '/classes/link-makeup',
      input,
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível vincular a reposição.');
  }
}

export async function rescheduleClass(
  id: string,
  input: RescheduleClassInput,
): Promise<ClassSession> {
  try {
    const response = await api.patch<ClassSession>(
      `/classes/${id}/reschedule`,
      input,
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível reagendar a aula.');
  }
}

export function getDefaultScheduleStart(period: ClassPeriod): string {
  return defaultStartTimeForPeriod(period);
}
