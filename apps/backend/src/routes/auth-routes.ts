import { Router } from 'express';

import { authController } from '@/controllers/auth-controller';
import { loginRateLimit } from '@/middlewares/login-rate-limit';
import { asyncHandler } from '@/utils/async-handler';

const authRoutes = Router();

authRoutes.post('/login', loginRateLimit, asyncHandler(authController.login));

export { authRoutes };
