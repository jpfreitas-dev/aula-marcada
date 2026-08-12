import type { Request, Response } from 'express';
import { z } from 'zod';

import { createClass } from '@/services/classes/create-class';
import { deleteClass } from '@/services/classes/delete-class';
import { getAvailablePeriods } from '@/services/classes/get-available-periods';
import { linkMakeup } from '@/services/classes/link-makeup';
import { listClassesByDate } from '@/services/classes/list-classes-by-date';
import { listClassesByWeek } from '@/services/classes/list-classes-by-week';
import { listPendingAbsences } from '@/services/classes/list-pending-absences';
import { rescheduleClass } from '@/services/classes/reschedule-class';
import { showClass } from '@/services/classes/show-class';
import { updateClassAttendance } from '@/services/classes/update-class-attendance';

const dateKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

const classPeriodSchema = z.union([
  z.literal('morning'),
  z.literal('afternoon'),
]);

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const listByDateQuerySchema = z.object({
  date: dateKeySchema,
});

const listByWeekQuerySchema = z.object({
  start: dateKeySchema,
});

const availablePeriodsQuerySchema = z.object({
  date: dateKeySchema,
  excludeClassId: z.string().uuid().optional(),
});

const createClassSchema = z.object({
  studentId: z.string().uuid(),
  date: dateKeySchema,
  period: classPeriodSchema,
  startTime: z.string().trim(),
  durationMinutes: z.coerce.number().int().positive(),
  expectedAmount: z.coerce.number().positive(),
  isMakeupOnly: z.boolean().default(false),
  linkedAbsenceIds: z.array(z.string().uuid()).default([]),
  hasManualAmountOverride: z.boolean().optional(),
});

const rescheduleClassSchema = z.object({
  date: dateKeySchema,
  period: classPeriodSchema,
  startTime: z.string().trim(),
  durationMinutes: z.coerce.number().int().positive(),
});

const attendanceStatusSchema = z.union([
  z.literal('empty'),
  z.literal('attended'),
  z.literal('absent'),
]);

const updateAttendanceSchema = z.object({
  attendance: attendanceStatusSchema,
  paidAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.union([z.literal('pix'), z.literal('cash')]).optional(),
  content: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

const pendingAbsencesQuerySchema = z.object({
  studentId: z.string().uuid(),
});

const linkMakeupSchema = z.object({
  targetClassId: z.string().uuid().optional(),
  studentId: z.string().uuid(),
  absenceIds: z.array(z.string().uuid()).min(1),
  startTime: z.string().trim(),
  endTime: z.string().trim(),
  date: dateKeySchema.optional(),
  period: classPeriodSchema.optional(),
});

class ClassController {
  async listByDate(request: Request, response: Response) {
    const query = listByDateQuerySchema.parse(request.query);
    const classes = await listClassesByDate.execute(query.date);

    return response.status(200).json(classes);
  }

  async listByWeek(request: Request, response: Response) {
    const query = listByWeekQuerySchema.parse(request.query);
    const classes = await listClassesByWeek.execute(query.start);

    return response.status(200).json(classes);
  }

  async availablePeriods(request: Request, response: Response) {
    const query = availablePeriodsQuerySchema.parse(request.query);
    const periods = await getAvailablePeriods.execute(
      query.date,
      query.excludeClassId,
    );

    return response.status(200).json(periods);
  }

  async show(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    const classRecord = await showClass.execute(params.id);

    return response.status(200).json(classRecord);
  }

  async create(request: Request, response: Response) {
    const body = createClassSchema.parse(request.body);
    const classRecord = await createClass.execute(body);

    return response.status(201).json(classRecord);
  }

  async reschedule(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    const body = rescheduleClassSchema.parse(request.body);
    const classRecord = await rescheduleClass.execute(params.id, body);

    return response.status(200).json(classRecord);
  }

  async delete(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    await deleteClass.execute(params.id);

    return response.status(204).send();
  }

  async updateAttendance(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    const body = updateAttendanceSchema.parse(request.body);
    const classRecord = await updateClassAttendance.execute(params.id, body);

    return response.status(200).json(classRecord);
  }

  async pendingAbsences(request: Request, response: Response) {
    const query = pendingAbsencesQuerySchema.parse(request.query);
    const absences = await listPendingAbsences.execute(query.studentId);

    return response.status(200).json(absences);
  }

  async linkMakeup(request: Request, response: Response) {
    const body = linkMakeupSchema.parse(request.body);
    const classRecord = await linkMakeup.execute(body);

    return response.status(200).json(classRecord);
  }
}

export const classController = new ClassController();
