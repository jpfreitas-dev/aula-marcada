import type { Request, Response } from 'express';
import { z } from 'zod';

import { getFinancialDashboard } from '@/services/financial/get-financial-dashboard';

const dashboardQuerySchema = z.object({
  granularity: z.enum(['week', 'month', 'year']),
  referenceDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  studentId: z.string().uuid().optional(),
});

class FinancialController {
  async dashboard(request: Request, response: Response) {
    const query = dashboardQuerySchema.parse(request.query);
    const dashboard = await getFinancialDashboard.execute({
      granularity: query.granularity,
      referenceDate: query.referenceDate,
      studentId: query.studentId,
    });

    return response.status(200).json(dashboard);
  }
}

export const financialController = new FinancialController();
