import axios from 'axios';

import { api } from '@/services/api';
import type {
  CreateStudentInput,
  CreateStudentRecurrenceInput,
  RecurrenceOptionsInput,
  RecurrenceOptionsResponse,
  ReceiveStudentPaymentInput,
  ReceiveStudentPaymentResult,
  Student,
  StudentListFilter,
  StudentRecurrence,
  UpdateStudentPersonalInput,
  UpdateStudentSettingsInput,
} from '@/types';
import { toApiRequestError } from '@/utils/api-error';

export type { StudentListFilter } from '@/types';

export async function listStudents(
  filter: StudentListFilter = 'active',
  search?: string,
): Promise<Student[]> {
  try {
    const response = await api.get<Student[]>('/students', {
      params: { filter, search },
    });
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível carregar os alunos.');
  }
}

export async function getStudentByIdService(
  id: string,
): Promise<Student | null> {
  try {
    const response = await api.get<Student>(`/students/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw toApiRequestError(error, 'Não foi possível carregar o aluno.');
  }
}

export async function createStudent(
  input: CreateStudentInput,
): Promise<Student> {
  try {
    const response = await api.post<Student>('/students', input);
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível cadastrar o aluno.');
  }
}

export async function updateStudentPersonalInfo(
  studentId: string,
  input: UpdateStudentPersonalInput,
): Promise<Student> {
  try {
    const response = await api.patch<Student>(
      `/students/${studentId}/personal`,
      input,
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível atualizar o aluno.');
  }
}

export async function updateStudentSettings(
  studentId: string,
  input: UpdateStudentSettingsInput,
): Promise<Student> {
  try {
    const response = await api.patch<Student>(
      `/students/${studentId}/settings`,
      input,
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(
      error,
      'Não foi possível atualizar as configurações.',
    );
  }
}

export async function deactivateStudent(studentId: string): Promise<Student> {
  try {
    const response = await api.post<Student>(
      `/students/${studentId}/deactivate`,
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível desativar o aluno.');
  }
}

export async function reactivateStudent(studentId: string): Promise<Student> {
  try {
    const response = await api.post<Student>(
      `/students/${studentId}/reactivate`,
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível ativar o aluno.');
  }
}

export async function deleteStudent(studentId: string): Promise<void> {
  try {
    await api.delete(`/students/${studentId}`);
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível excluir o aluno.');
  }
}

export async function receiveStudentPayment(
  input: ReceiveStudentPaymentInput,
): Promise<ReceiveStudentPaymentResult> {
  try {
    const response = await api.post<ReceiveStudentPaymentResult>(
      `/students/${input.studentId}/payments`,
      {
        amount: input.amount,
        paymentMethod: input.paymentMethod,
      },
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível registrar o pagamento.');
  }
}

export async function listRecurrencesByStudent(
  studentId: string,
): Promise<StudentRecurrence[]> {
  try {
    const response = await api.get<StudentRecurrence[]>(
      `/students/${studentId}/recurrences`,
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(
      error,
      'Não foi possível carregar as recorrências.',
    );
  }
}

export async function fetchRecurrenceOptions(
  input: RecurrenceOptionsInput,
): Promise<RecurrenceOptionsResponse> {
  try {
    const response = await api.post<RecurrenceOptionsResponse>(
      '/students/recurrence-options',
      input,
    );
    return response.data;
  } catch (error) {
    throw toApiRequestError(
      error,
      'Não foi possível carregar as opções de recorrência.',
    );
  }
}

export function toRecurrenceInputs(
  rows: Array<
    Pick<CreateStudentRecurrenceInput, 'weekday' | 'startTime' | 'endTime'>
  >,
): CreateStudentRecurrenceInput[] {
  return rows.map((row) => ({
    weekday: row.weekday,
    startTime: row.startTime,
    endTime: row.endTime,
  }));
}
