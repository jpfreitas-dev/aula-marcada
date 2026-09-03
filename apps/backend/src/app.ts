import express from 'express';

import { env } from '@/config/env';
import { corsMiddleware } from '@/middlewares/cors';
import { errorHandling } from '@/middlewares/error-handling';
import { helmetMiddleware } from '@/middlewares/helmet';
import { routes } from '@/routes';

const app = express();

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: env.jsonBodyLimit }));

app.use(routes);

app.use((_request, response) => {
  response.status(404).json({
    message: 'Recurso não encontrado.',
  });
});

app.use(errorHandling);

export { app };
