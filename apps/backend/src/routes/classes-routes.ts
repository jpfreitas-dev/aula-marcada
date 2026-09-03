import { Router } from 'express';

import { classController } from '@/controllers/class-controller';
import { asyncHandler } from '@/utils/async-handler';

const classesRoutes = Router();

classesRoutes.get(
  '/available-periods',
  asyncHandler(classController.availablePeriods),
);
classesRoutes.get(
  '/pending-absences',
  asyncHandler(classController.pendingAbsences),
);
classesRoutes.get('/week', asyncHandler(classController.listByWeek));
classesRoutes.get(
  '/by-student/:studentId',
  asyncHandler(classController.listByStudent),
);
classesRoutes.get('/', asyncHandler(classController.listByDate));
classesRoutes.get('/:id', asyncHandler(classController.show));
classesRoutes.post('/', asyncHandler(classController.create));
classesRoutes.post('/link-makeup', asyncHandler(classController.linkMakeup));
classesRoutes.patch(
  '/:id/attendance',
  asyncHandler(classController.updateAttendance),
);
classesRoutes.patch(
  '/:id/reschedule',
  asyncHandler(classController.reschedule),
);
classesRoutes.delete('/:id', asyncHandler(classController.delete));

export { classesRoutes };
