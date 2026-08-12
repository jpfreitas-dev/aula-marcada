import { Router } from 'express';

import { studentController } from '@/controllers/student-controller';
import { asyncHandler } from '@/utils/async-handler';

const studentsRoutes = Router();

studentsRoutes.get('/', asyncHandler(studentController.list));
studentsRoutes.post(
  '/recurrence-options',
  asyncHandler(studentController.recurrenceOptions),
);
studentsRoutes.get('/:id', asyncHandler(studentController.show));
studentsRoutes.post('/', asyncHandler(studentController.create));
studentsRoutes.patch(
  '/:id/personal',
  asyncHandler(studentController.updatePersonal),
);
studentsRoutes.patch(
  '/:id/settings',
  asyncHandler(studentController.updateSettings),
);
studentsRoutes.post(
  '/:id/deactivate',
  asyncHandler(studentController.deactivate),
);
studentsRoutes.post(
  '/:id/reactivate',
  asyncHandler(studentController.reactivate),
);
studentsRoutes.get(
  '/:id/recurrences',
  asyncHandler(studentController.listRecurrences),
);

export { studentsRoutes };
