import { Router } from 'express';

import { studentsRoutes } from './students-routes';

const routes = Router();

routes.get('/health', (_request, response) => {
  return response.status(200).json({
    status: 'ok',
  });
});

routes.use('/students', studentsRoutes);

export { routes };
