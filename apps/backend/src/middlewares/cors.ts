import cors from 'cors';

import { env } from '@/config/env';

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || env.frontendUrls.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
