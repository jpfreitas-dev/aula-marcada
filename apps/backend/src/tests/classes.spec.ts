import request from 'supertest';

import { app } from '@/app';
import { prisma } from './setup';

async function createActiveStudent() {
  const response = await request(app).post('/students').send({
    name: 'Aluno Agenda',
    guardianName: 'Responsável',
    phone: '(11) 98888-1000',
    hourlyRate: 60,
  });

  return response.body;
}

describe('classes API', () => {
  it('creates an ad-hoc class on a weekday', async () => {
    const student = await createActiveStudent();

    const response = await request(app).post('/classes').send({
      studentId: student.id,
      date: '2026-08-13',
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    expect(response.status).toBe(201);
    expect(response.body.studentId).toBe(student.id);
    expect(response.body.period).toBe('morning');
    expect(response.body.attendance).toBe('empty');
    expect(response.body.expectedAmount).toBe(60);
  });

  it('rejects scheduling on weekends', async () => {
    const student = await createActiveStudent();

    const response = await request(app).post('/classes').send({
      studentId: student.id,
      date: '2026-08-15',
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Não é possível agendar aulas no fim de semana.',
    );
  });

  it('rejects period conflict on the same day', async () => {
    const student = await createActiveStudent();

    await request(app).post('/classes').send({
      studentId: student.id,
      date: '2026-08-14',
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    const response = await request(app).post('/classes').send({
      studentId: student.id,
      date: '2026-08-14',
      period: 'morning',
      startTime: '09:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Período indisponível.');
  });

  it('lists classes by date and week', async () => {
    const student = await createActiveStudent();

    await request(app).post('/classes').send({
      studentId: student.id,
      date: '2026-08-13',
      period: 'afternoon',
      startTime: '19:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    const byDate = await request(app).get('/classes?date=2026-08-13');
    expect(byDate.status).toBe(200);
    expect(byDate.body.length).toBe(1);

    const byWeek = await request(app).get('/classes/week?start=2026-08-10');
    expect(byWeek.status).toBe(200);
    expect(byWeek.body.length).toBe(1);
  });

  it('deletes a class', async () => {
    const student = await createActiveStudent();

    const created = await request(app).post('/classes').send({
      studentId: student.id,
      date: '2026-08-17',
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    const deleteResponse = await request(app).delete(
      `/classes/${created.body.id}`,
    );
    expect(deleteResponse.status).toBe(204);

    const showResponse = await request(app).get(`/classes/${created.body.id}`);
    expect(showResponse.status).toBe(404);

    const classesOnDate = await prisma.class.findMany({
      where: { id: created.body.id },
    });
    expect(classesOnDate).toHaveLength(0);
  });

  it('reschedules an empty class', async () => {
    const student = await createActiveStudent();

    const created = await request(app).post('/classes').send({
      studentId: student.id,
      date: '2026-08-18',
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    const response = await request(app)
      .patch(`/classes/${created.body.id}/reschedule`)
      .send({
        date: '2026-08-18',
        period: 'afternoon',
        startTime: '19:00',
        durationMinutes: 90,
        expectedAmount: 90,
      });

    expect(response.status).toBe(200);
    expect(response.body.period).toBe('afternoon');
    expect(response.body.startTime).toBe('19:00');
    expect(response.body.durationMinutes).toBe(90);
    expect(response.body.expectedAmount).toBe(90);
  });
});
