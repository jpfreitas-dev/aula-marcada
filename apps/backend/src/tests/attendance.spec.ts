import request from 'supertest';

import { ClassPeriod } from '../../generated/prisma/client';
import { app } from '@/app';
import { dateFromDateKey } from '@/utils/workday';
import { prisma } from './setup';

async function createActiveStudent() {
  const response = await request(app)
    .post('/students')
    .send({
      name: 'Aluno Agenda',
      guardianName: 'Responsável',
      phone: `(11) 98888-${Math.floor(Math.random() * 9000 + 1000)}`,
      hourlyRate: 60,
    });

  return response.body;
}

async function createFutureClass(studentId: string, date: string) {
  const response = await request(app).post('/classes').send({
    studentId,
    date,
    period: 'morning',
    startTime: '08:00',
    durationMinutes: 60,
    expectedAmount: 60,
    isMakeupOnly: false,
    linkedAbsenceIds: [],
  });

  expect(response.status).toBe(201);
  return response.body;
}

describe('classes attendance API', () => {
  it('updates attendance to absent and attended with content', async () => {
    const student = await createActiveStudent();
    const created = await createFutureClass(student.id, '2026-08-13');

    const absentResponse = await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({ attendance: 'absent' });

    expect(absentResponse.status).toBe(200);
    expect(absentResponse.body.attendance).toBe('absent');
    expect(absentResponse.body.pendingMakeupMinutes).toBe(60);

    const attendedResponse = await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({
        attendance: 'attended',
        content: 'Revisão de matemática',
        notes: 'Aluno participativo',
      });

    expect(attendedResponse.status).toBe(200);
    expect(attendedResponse.body.attendance).toBe('attended');
    expect(attendedResponse.body.content).toBe('Revisão de matemática');
    expect(attendedResponse.body.notes).toBe('Aluno participativo');
  });

  it('allows clearing attendance before class ends', async () => {
    const student = await createActiveStudent();
    const created = await createFutureClass(student.id, '2026-12-15');

    await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({ attendance: 'attended' });

    const clearResponse = await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({ attendance: 'empty' });

    expect(clearResponse.status).toBe(200);
    expect(clearResponse.body.attendance).toBe('empty');
    expect(clearResponse.body.content).toBeUndefined();
  });

  it('rejects clearing attendance after class ended', async () => {
    const student = await createActiveStudent();
    const created = await prisma.class.create({
      data: {
        studentId: student.id,
        date: dateFromDateKey('2026-08-04'),
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
      },
    });

    await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({ attendance: 'absent' });

    const response = await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({ attendance: 'empty' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Não é possível desmarcar a presença de uma aula que já terminou.',
    );
  });
});
