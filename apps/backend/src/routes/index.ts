import { Router } from 'express';

const routes = Router();

routes.get('/health', (_request, response) => {
  return response.status(200).json({
    status: 'ok',
  });
});

export { routes };
