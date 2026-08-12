import request from 'supertest';

import { app } from '@/app';
import { prisma } from './setup';

describe('students API', () => {
  it('creates a student without recurrences', async () => {
    const response = await request(app).post('/students').send({
      name: 'Ana Costa',
      guardianName: 'Paula Costa',
      phone: '(11) 98888-0001',
      hourlyRate: 55,
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Ana Costa');
    expect(response.body.financialStatus).toBe('up_to_date');
    expect(response.body.active).toBe(true);
  });

  it('creates a student with recurrences and generates classes', async () => {
    const response = await request(app)
      .post('/students')
      .send({
        name: 'Bruno Lima',
        guardianName: 'Rita Lima',
        phone: '(11) 98888-0002',
        hourlyRate: 50,
        recurrences: [
          {
            weekday: 2,
            startTime: '08:00',
            endTime: '09:00',
          },
        ],
      });

    expect(response.status).toBe(201);

    const classes = await prisma.class.findMany({
      where: { studentId: response.body.id },
    });

    expect(classes.length).toBeGreaterThan(0);
    expect(classes.every((item) => item.attendance === 'EMPTY')).toBe(true);
  });

  it('rejects duplicate student names', async () => {
    await request(app).post('/students').send({
      name: 'Carla Duplicada',
      guardianName: 'Responsável',
      phone: '(11) 98888-0003',
      hourlyRate: 40,
    });

    const response = await request(app).post('/students').send({
      name: 'carla duplicada',
      guardianName: 'Outro',
      phone: '(11) 98888-0004',
      hourlyRate: 40,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Já existe um aluno com esse nome.');
  });

  it('rejects recurrence conflict for the same student period', async () => {
    const response = await request(app)
      .post('/students')
      .send({
        name: 'Daniel Conflict',
        guardianName: 'Responsável',
        phone: '(11) 98888-0005',
        hourlyRate: 50,
        recurrences: [
          {
            weekday: 3,
            startTime: '08:00',
            endTime: '09:00',
          },
          {
            weekday: 3,
            startTime: '10:00',
            endTime: '11:00',
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('já tem aula nesse período');
  });

  it('lists students with search filter', async () => {
    await request(app).post('/students').send({
      name: 'Elena Search',
      guardianName: 'Responsável',
      phone: '(11) 98888-0006',
      hourlyRate: 45,
    });

    const response = await request(app).get('/students?search=elena');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Elena Search');
  });

  it('updates personal info', async () => {
    const created = await request(app).post('/students').send({
      name: 'Fernanda Edit',
      guardianName: 'Responsável',
      phone: '(11) 98888-0007',
      hourlyRate: 60,
    });

    const response = await request(app)
      .patch(`/students/${created.body.id}/personal`)
      .send({
        name: 'Fernanda Editada',
        guardianName: 'Novo Responsável',
        phone: '(11) 98888-0099',
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Fernanda Editada');
    expect(response.body.guardianName).toBe('Novo Responsável');
  });

  it('deactivates and reactivates a student', async () => {
    const created = await request(app)
      .post('/students')
      .send({
        name: 'Gustavo Status',
        guardianName: 'Responsável',
        phone: '(11) 98888-0008',
        hourlyRate: 50,
        recurrences: [
          {
            weekday: 4,
            startTime: '19:00',
            endTime: '20:00',
          },
        ],
      });

    const beforeDeactivate = await prisma.class.count({
      where: { studentId: created.body.id },
    });

    const deactivated = await request(app).post(
      `/students/${created.body.id}/deactivate`,
    );

    expect(deactivated.status).toBe(200);
    expect(deactivated.body.active).toBe(false);

    const afterDeactivate = await prisma.class.count({
      where: { studentId: created.body.id },
    });
    expect(afterDeactivate).toBeLessThan(beforeDeactivate);

    const recurrences = await prisma.studentRecurrence.count({
      where: { studentId: created.body.id },
    });
    expect(recurrences).toBe(0);

    const reactivated = await request(app).post(
      `/students/${created.body.id}/reactivate`,
    );

    expect(reactivated.status).toBe(200);
    expect(reactivated.body.active).toBe(true);
  });

  it('returns recurrence options for draft rows', async () => {
    const response = await request(app)
      .post('/students/recurrence-options')
      .send({
        draftRecurrences: [],
      });

    expect(response.status).toBe(200);
    expect(response.body.allWeekdays).toHaveLength(5);
    expect(response.body.hasAvailableWeekdays).toBe(true);
    expect(response.body.defaultRow).toBeTruthy();
  });

  it('returns 404 for unknown student', async () => {
    const response = await request(app).get(
      '/students/00000000-0000-4000-8000-000000000001',
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Aluno não encontrado.');
  });
});
