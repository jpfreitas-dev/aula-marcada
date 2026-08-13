import { api } from '@/services/api';
import type { FinancialDashboard, GetFinancialDashboardInput } from '@/types';
import { toApiRequestError } from '@/utils/api-error';

export async function getFinancialDashboard(
  input: GetFinancialDashboardInput,
): Promise<FinancialDashboard> {
  try {
    const response = await api.get<FinancialDashboard>('/financial/dashboard', {
      params: {
        granularity: input.granularity,
        referenceDate: input.referenceDate,
        studentId: input.studentId,
      },
    });
    return response.data;
  } catch (error) {
    throw toApiRequestError(error, 'Não foi possível carregar o financeiro.');
  }
}
