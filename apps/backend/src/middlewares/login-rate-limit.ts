import rateLimit from 'express-rate-limit';

import { env } from '@/config/env';

export const loginRateLimit = rateLimit({
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message:
      'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
  },
});
