import { Router } from 'express';

import { financialController } from '@/controllers/financial-controller';
import { asyncHandler } from '@/utils/async-handler';

const financialRoutes = Router();

financialRoutes.get('/dashboard', asyncHandler(financialController.dashboard));

export { financialRoutes };
