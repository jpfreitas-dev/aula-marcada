import { formatExistingClassConflict } from '@/utils/schedule-conflict';
import {
  getFutureClassDate,
  getFutureWeekdayDate,
  getWeekStartKeyForDate,
} from './helpers/dates';
import { authRequest } from './helpers/auth-request';
import { prisma } from './setup';

async function createActiveStudent() {
  const response = await authRequest.post('/students').send({
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
    const classDate = getFutureClassDate();

    const response = await authRequest.post('/classes').send({
      studentId: student.id,
      date: classDate,
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

    const response = await authRequest.post('/classes').send({
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
    const classDate = getFutureClassDate();

    await authRequest.post('/classes').send({
      studentId: student.id,
      date: classDate,
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    const response = await authRequest.post('/classes').send({
      studentId: student.id,
      date: classDate,
      period: 'morning',
      startTime: '09:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      formatExistingClassConflict(student.name, classDate, 'morning'),
    );
  });

  it('lists classes by date and week', async () => {
    const student = await createActiveStudent();
    const classDate = getFutureClassDate();

    await authRequest.post('/classes').send({
      studentId: student.id,
      date: classDate,
      period: 'afternoon',
      startTime: '19:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    const byDate = await authRequest.get(`/classes?date=${classDate}`);
    expect(byDate.status).toBe(200);
    expect(byDate.body.length).toBe(1);

    const byWeek = await authRequest.get(
      `/classes/week?start=${getWeekStartKeyForDate(classDate)}`,
    );
    expect(byWeek.status).toBe(200);
    expect(byWeek.body.length).toBe(1);
  });

  it('lists classes by student', async () => {
    const student = await createActiveStudent();
    const classDate = getFutureClassDate(11);

    await authRequest.post('/classes').send({
      studentId: student.id,
      date: classDate,
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    const response = await authRequest.get(`/classes/by-student/${student.id}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].studentId).toBe(student.id);
  });

  it('deletes a class', async () => {
    const student = await createActiveStudent();
    const classDate = getFutureClassDate(12);

    const created = await authRequest.post('/classes').send({
      studentId: student.id,
      date: classDate,
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    const deleteResponse = await authRequest.delete(
      `/classes/${created.body.id}`,
    );
    expect(deleteResponse.status).toBe(204);

    const showResponse = await authRequest.get(`/classes/${created.body.id}`);
    expect(showResponse.status).toBe(404);

    const classesOnDate = await prisma.class.findMany({
      where: { id: created.body.id },
    });
    expect(classesOnDate).toHaveLength(0);
  });

  it('reschedules an empty class', async () => {
    const student = await createActiveStudent();
    const classDate = getFutureClassDate(11);

    const created = await authRequest.post('/classes').send({
      studentId: student.id,
      date: classDate,
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    const response = await authRequest
      .patch(`/classes/${created.body.id}/reschedule`)
      .send({
        date: classDate,
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

  it('rejects ad-hoc class in a period with recurring class', async () => {
    const classDate = getFutureWeekdayDate(4);

    const recurringStudent = await authRequest.post('/students').send({
      name: 'Aluno Recorrente',
      guardianName: 'Responsável',
      phone: '(11) 98888-1101',
      hourlyRate: 60,
      recurrences: [
        {
          weekday: 4,
          startTime: '08:00',
          endTime: '09:00',
        },
      ],
    });

    const sporadicStudent = await createActiveStudent();

    const response = await authRequest.post('/classes').send({
      studentId: sporadicStudent.id,
      date: classDate,
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      formatExistingClassConflict(
        recurringStudent.body.name,
        classDate,
        'morning',
      ),
    );
  });

  it('extends recurrence horizon when listing classes by week', async () => {
    const created = await authRequest.post('/students').send({
      name: 'Aluno Horizonte',
      guardianName: 'Responsável',
      phone: '(11) 98888-1102',
      hourlyRate: 60,
      recurrences: [
        {
          weekday: 2,
          startTime: '08:00',
          endTime: '09:00',
        },
      ],
    });

    await prisma.class.deleteMany({ where: { studentId: created.body.id } });

    const response = await authRequest.get(
      `/classes/week?start=${getWeekStartKeyForDate(getFutureClassDate())}`,
    );

    expect(response.status).toBe(200);

    const generated = await prisma.class.findMany({
      where: { studentId: created.body.id },
    });

    expect(generated.length).toBeGreaterThan(10);
  });
});
