import request from 'supertest';

import { ClassPeriod } from '../../generated/prisma/client';
import { app } from '@/app';
import { dateFromDateKey } from '@/utils/workday';
import { prisma } from './setup';

async function createActiveStudent(hourlyRate = 60) {
  const response = await request(app)
    .post('/students')
    .send({
      name: 'Aluno Pagamento',
      guardianName: 'Responsável',
      phone: `(11) 97777-${Math.floor(Math.random() * 9000 + 1000)}`,
      hourlyRate,
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

describe('payments API', () => {
  it('records partial payment when marking attended', async () => {
    const student = await createActiveStudent();
    const created = await createFutureClass(student.id, '2026-08-13');

    const response = await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({
        attendance: 'attended',
        paidAmount: 40,
        paymentMethod: 'pix',
      });

    expect(response.status).toBe(200);
    expect(response.body.attendance).toBe('attended');
    expect(response.body.paidAmount).toBe(40);
    expect(response.body.financialStatus).toBe('partial');
    expect(response.body.paymentMethod).toBe('pix');
  });

  it('settles class with full payment on attended', async () => {
    const student = await createActiveStudent();
    const created = await createFutureClass(student.id, '2026-08-14');

    const response = await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({
        attendance: 'attended',
        paidAmount: 60,
        paymentMethod: 'cash',
      });

    expect(response.status).toBe(200);
    expect(response.body.paidAmount).toBe(60);
    expect(response.body.financialStatus).toBe('settled');
    expect(response.body.paymentMethod).toBe('cash');
  });

  it('consumes advance balance automatically when marking attended', async () => {
    const student = await createActiveStudent(90);
    await prisma.student.update({
      where: { id: student.id },
      data: { advanceBalancePix: 100 },
    });

    const created = await createFutureClass(student.id, '2026-08-17');

    const response = await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({
        attendance: 'attended',
        paidAmount: 0,
      });

    expect(response.status).toBe(200);
    expect(response.body.paidAmount).toBe(90);
    expect(response.body.advanceAppliedPix).toBe(90);
    expect(response.body.financialStatus).toBe('settled');

    const updatedStudent = await request(app).get(`/students/${student.id}`);
    expect(updatedStudent.body.advanceBalancePix).toBe(10);
  });

  it('allows additional payment on already attended class', async () => {
    const student = await createActiveStudent();
    const created = await createFutureClass(student.id, '2026-08-18');

    await request(app).patch(`/classes/${created.id}/attendance`).send({
      attendance: 'attended',
      paidAmount: 30,
      paymentMethod: 'pix',
    });

    const response = await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({
        attendance: 'attended',
        paidAmount: 30,
        paymentMethod: 'cash',
      });

    expect(response.status).toBe(200);
    expect(response.body.paidAmount).toBe(60);
    expect(response.body.paidPix).toBe(30);
    expect(response.body.paidCash).toBe(30);
    expect(response.body.financialStatus).toBe('settled');
    expect(response.body.paymentMethod).toBeUndefined();
  });

  it('rejects payment above remaining due on class modal', async () => {
    const student = await createActiveStudent();
    const created = await createFutureClass(student.id, '2026-08-20');

    const response = await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({
        attendance: 'attended',
        paidAmount: 80,
        paymentMethod: 'pix',
      });

    expect(response.status).toBe(200);
    expect(response.body.paidAmount).toBe(60);
    expect(response.body.financialStatus).toBe('settled');
  });

  it('allocates profile payment to oldest pending classes first', async () => {
    const student = await createActiveStudent();

    const older = await prisma.class.create({
      data: {
        studentId: student.id,
        date: dateFromDateKey('2026-08-04'),
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: 'ATTENDED',
      },
    });

    const newer = await prisma.class.create({
      data: {
        studentId: student.id,
        date: dateFromDateKey('2026-08-05'),
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: 'ATTENDED',
      },
    });

    const response = await request(app)
      .post(`/students/${student.id}/payments`)
      .send({ amount: 100, paymentMethod: 'pix' });

    expect(response.status).toBe(200);
    expect(response.body.allocatedAmount).toBe(100);
    expect(response.body.advanceAmount).toBe(0);
    expect(response.body.settledClassIds).toEqual([older.id, newer.id]);

    const olderClass = await request(app).get(`/classes/${older.id}`);
    const newerClass = await request(app).get(`/classes/${newer.id}`);
    expect(olderClass.body.financialStatus).toBe('settled');
    expect(newerClass.body.financialStatus).toBe('settled');
    expect(olderClass.body.paidPix).toBe(50);
    expect(newerClass.body.paidPix).toBe(50);
  });

  it('stores remaining profile payment as advance balance', async () => {
    const student = await createActiveStudent();

    await prisma.class.create({
      data: {
        studentId: student.id,
        date: dateFromDateKey('2026-08-06'),
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: 'ATTENDED',
      },
    });

    const response = await request(app)
      .post(`/students/${student.id}/payments`)
      .send({ amount: 100, paymentMethod: 'cash' });

    expect(response.status).toBe(200);
    expect(response.body.allocatedAmount).toBe(50);
    expect(response.body.advanceAmount).toBe(50);
    expect(response.body.student.advanceBalanceCash).toBe(50);
  });

  it('stores full profile payment as advance when there are no pending classes', async () => {
    const student = await createActiveStudent();

    const response = await request(app)
      .post(`/students/${student.id}/payments`)
      .send({ amount: 75, paymentMethod: 'pix' });

    expect(response.status).toBe(200);
    expect(response.body.allocatedAmount).toBe(0);
    expect(response.body.advanceAmount).toBe(75);
    expect(response.body.settledClassIds).toEqual([]);
    expect(response.body.student.advanceBalancePix).toBe(75);
    expect(response.body.student.financialStatus).toBe('advance');
  });

  it('restores advance balance when clearing attended class', async () => {
    const student = await createActiveStudent();
    await prisma.student.update({
      where: { id: student.id },
      data: { advanceBalancePix: 100 },
    });

    const created = await createFutureClass(student.id, '2026-12-10');

    await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({ attendance: 'attended', paidAmount: 0 });

    await request(app)
      .patch(`/classes/${created.id}/attendance`)
      .send({ attendance: 'empty' });

    const updatedStudent = await request(app).get(`/students/${student.id}`);
    expect(updatedStudent.body.advanceBalancePix).toBe(100);
  });
});
