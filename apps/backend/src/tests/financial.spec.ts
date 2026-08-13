import request from 'supertest';

import {
  addWorkdays,
  getWeekStart,
  getWorkdaysOfWeek,
  toDateKey,
} from '@/utils/workday';
import { app } from '@/app';
import { getFutureClassDate } from './helpers/dates';

function futureWeekDates() {
  const anchor = addWorkdays(new Date(), 10);
  const workdays = getWorkdaysOfWeek(getWeekStart(anchor));

  return {
    monday: toDateKey(workdays[0]),
    tuesday: toDateKey(workdays[1]),
    wednesday: toDateKey(workdays[2]),
    reference: toDateKey(workdays[1]),
  };
}

function futureDate(offsetWorkdays: number): string {
  return getFutureClassDate(10 + offsetWorkdays);
}

async function createActiveStudent(name = 'Aluno Financeiro') {
  const response = await request(app)
    .post('/students')
    .send({
      name,
      guardianName: 'Responsável',
      phone: `(11) 96666-${Math.floor(Math.random() * 9000 + 1000)}`,
      hourlyRate: 60,
    });

  expect(response.status).toBe(201);
  return response.body;
}

async function createClass(
  studentId: string,
  date: string,
  expectedAmount = 60,
  options?: { hasManualAmountOverride?: boolean },
) {
  const response = await request(app)
    .post('/classes')
    .send({
      studentId,
      date,
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount,
      hasManualAmountOverride: options?.hasManualAmountOverride ?? false,
      isMakeupOnly: false,
      linkedAbsenceIds: [],
    });

  expect(response.status).toBe(201);
  return response.body;
}

async function markAttended(
  classId: string,
  paidAmount: number,
  paymentMethod: 'pix' | 'cash',
) {
  const response = await request(app)
    .patch(`/classes/${classId}/attendance`)
    .send({
      attendance: 'attended',
      paidAmount,
      paymentMethod,
    });

  expect(response.status).toBe(200);
  return response.body;
}

async function markAbsent(classId: string) {
  const response = await request(app)
    .patch(`/classes/${classId}/attendance`)
    .send({ attendance: 'absent' });

  expect(response.status).toBe(200);
  return response.body;
}

describe('financial API', () => {
  it('returns expected, realized and absence impact for a week', async () => {
    const { monday, tuesday, wednesday, reference } = futureWeekDates();
    const student = await createActiveStudent();
    await createClass(student.id, monday);
    const attended = await createClass(student.id, tuesday);
    const absent = await createClass(student.id, wednesday);

    await markAttended(attended.id, 60, 'pix');
    await markAbsent(absent.id);

    const response = await request(app).get('/financial/dashboard').query({
      granularity: 'week',
      referenceDate: reference,
    });

    expect(response.status).toBe(200);
    expect(response.body.expected).toBe(120);
    expect(response.body.realized).toBe(60);
    expect(response.body.realizedPix).toBe(60);
    expect(response.body.realizedCash).toBe(0);
    expect(response.body.absenceImpact).toBe(60);
    expect(response.body.chart).toHaveLength(5);
  });

  it('filters dashboard metrics by student', async () => {
    const { monday, tuesday, reference } = futureWeekDates();
    const firstStudent = await createActiveStudent('Aluno A');
    const secondStudent = await createActiveStudent('Aluno B');
    const firstClass = await createClass(firstStudent.id, monday);
    const secondClass = await createClass(secondStudent.id, tuesday);

    await markAttended(firstClass.id, 60, 'pix');
    await markAttended(secondClass.id, 60, 'cash');

    const response = await request(app).get('/financial/dashboard').query({
      granularity: 'week',
      referenceDate: reference,
      studentId: firstStudent.id,
    });

    expect(response.status).toBe(200);
    expect(response.body.expected).toBe(60);
    expect(response.body.realized).toBe(60);
    expect(response.body.realizedPix).toBe(60);
    expect(response.body.studentPayments).toEqual([]);
    expect(response.body.studentAbsences).toEqual([]);
  });

  it('lists pending attended classes in the selected period', async () => {
    const firstDay = futureDate(1);
    const secondDay = futureDate(2);
    const student = await createActiveStudent();
    const partial = await createClass(student.id, firstDay);
    const settled = await createClass(student.id, secondDay);

    await markAttended(partial.id, 20, 'pix');
    await markAttended(settled.id, 60, 'cash');

    const response = await request(app).get('/financial/dashboard').query({
      granularity: 'month',
      referenceDate: firstDay,
    });

    expect(response.status).toBe(200);
    expect(response.body.pending).toHaveLength(1);
    expect(response.body.pending[0]).toMatchObject({
      id: partial.id,
      studentId: student.id,
      date: firstDay,
      amount: 40,
    });
  });

  it('returns student payment and absence stats when no student filter is set', async () => {
    const { monday, tuesday, wednesday, reference } = futureWeekDates();
    const firstStudent = await createActiveStudent('João');
    const secondStudent = await createActiveStudent('Ana');
    const firstAttended = await createClass(firstStudent.id, monday);
    const secondAttended = await createClass(secondStudent.id, tuesday);
    const secondAbsent = await createClass(secondStudent.id, wednesday, 80, {
      hasManualAmountOverride: true,
    });

    await markAttended(firstAttended.id, 60, 'pix');
    await markAttended(secondAttended.id, 40, 'cash');
    await markAbsent(secondAbsent.id);

    const response = await request(app).get('/financial/dashboard').query({
      granularity: 'week',
      referenceDate: reference,
    });

    expect(response.status).toBe(200);
    expect(response.body.studentPayments).toEqual([
      {
        studentId: firstStudent.id,
        studentName: 'João',
        amount: 60,
      },
      {
        studentId: secondStudent.id,
        studentName: 'Ana',
        amount: 40,
      },
    ]);
    expect(response.body.studentAbsences).toEqual([
      {
        studentId: secondStudent.id,
        studentName: 'Ana',
        absenceValue: 80,
      },
    ]);
  });

  it('rejects invalid query parameters', async () => {
    const response = await request(app).get('/financial/dashboard').query({
      granularity: 'week',
      referenceDate: 'invalid-date',
    });

    expect(response.status).toBe(400);
  });
});
