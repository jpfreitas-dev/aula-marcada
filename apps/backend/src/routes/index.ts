import { Router } from 'express';

import { classesRoutes } from './classes-routes';
import { financialRoutes } from './financial-routes';
import { studentsRoutes } from './students-routes';

const routes = Router();

routes.get('/health', (_request, response) => {
  return response.status(200).json({
    status: 'ok',
  });
});

routes.use('/students', studentsRoutes);
routes.use('/classes', classesRoutes);
routes.use('/financial', financialRoutes);

export { routes };
