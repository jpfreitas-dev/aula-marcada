import type { Request, Response } from 'express';
import { z } from 'zod';

import { studentService } from '@/services/student-service';

const studentWeekdaySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const recurrenceInputSchema = z.object({
  weekday: studentWeekdaySchema,
  startTime: z.string().trim(),
  endTime: z.string().trim(),
});

const createStudentSchema = z.object({
  name: z.string().trim().min(1),
  guardianName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  hourlyRate: z.coerce.number().positive(),
  recurrences: z.array(recurrenceInputSchema).optional(),
});

const updatePersonalSchema = z.object({
  name: z.string().trim().min(1),
  guardianName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
});

const updateSettingsSchema = z.object({
  hourlyRate: z.coerce.number().positive(),
  recurrences: z.array(recurrenceInputSchema),
});

const recurrenceOptionsSchema = z.object({
  studentId: z.string().uuid().optional(),
  draftRecurrences: z.array(recurrenceInputSchema),
  currentWeekday: studentWeekdaySchema.optional(),
});

const listQuerySchema = z.object({
  filter: z.enum(['active', 'inactive']).default('active'),
  search: z.string().trim().optional(),
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

class StudentController {
  async list(request: Request, response: Response) {
    const query = listQuerySchema.parse(request.query);
    const students = await studentService.list(query.filter, query.search);

    return response.status(200).json(students);
  }

  async show(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    const student = await studentService.show(params.id);

    return response.status(200).json(student);
  }

  async create(request: Request, response: Response) {
    const body = createStudentSchema.parse(request.body);
    const student = await studentService.create(body);

    return response.status(201).json(student);
  }

  async updatePersonal(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    const body = updatePersonalSchema.parse(request.body);
    const student = await studentService.updatePersonal(params.id, body);

    return response.status(200).json(student);
  }

  async updateSettings(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    const body = updateSettingsSchema.parse(request.body);
    const student = await studentService.updateSettings(params.id, body);

    return response.status(200).json(student);
  }

  async deactivate(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    const student = await studentService.deactivate(params.id);

    return response.status(200).json(student);
  }

  async reactivate(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    const student = await studentService.reactivate(params.id);

    return response.status(200).json(student);
  }

  async listRecurrences(request: Request, response: Response) {
    const params = idParamsSchema.parse(request.params);
    const recurrences = await studentService.listRecurrences(params.id);

    return response.status(200).json(recurrences);
  }

  async recurrenceOptions(request: Request, response: Response) {
    const body = recurrenceOptionsSchema.parse(request.body);
    const options = await studentService.getRecurrenceOptions(body);

    return response.status(200).json(options);
  }
}

export const studentController = new StudentController();
