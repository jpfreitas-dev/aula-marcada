import { AttendanceStatus, ClassPeriod } from '../../generated/prisma/client';
import { prisma } from './setup';
import { dateFromDateKey } from '@/utils/workday';
import { resolveFinancialPeriod } from '@/utils/financial-period';
import {
  addWorkdays,
  getWeekStart,
  getWorkdaysOfWeek,
  toDateKey,
} from '@/utils/workday';
import { authRequest } from './helpers/auth-request';
import { getFutureClassDate, getPastClassDate } from './helpers/dates';

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

async function createActiveStudent(name = 'Aluno Financeiro') {
  const response = await authRequest.post('/students').send({
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
  const response = await authRequest.post('/classes').send({
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
  const response = await authRequest
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
  const response = await authRequest
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

    const response = await authRequest.get('/financial/dashboard').query({
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

    const response = await authRequest.get('/financial/dashboard').query({
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
    const {
      monday: olderDay,
      tuesday: newerDay,
      wednesday: settledDay,
      reference,
    } = futureWeekDates();
    const student = await createActiveStudent();
    const olderPending = await createClass(student.id, olderDay);
    const newerPending = await createClass(student.id, newerDay);
    const settled = await createClass(student.id, settledDay);

    await markAttended(olderPending.id, 20, 'pix');
    await markAttended(newerPending.id, 10, 'pix');
    await markAttended(settled.id, 60, 'cash');

    const response = await authRequest.get('/financial/dashboard').query({
      granularity: 'month',
      referenceDate: reference,
    });

    expect(response.status).toBe(200);
    expect(response.body.pending).toHaveLength(2);
    expect(response.body.pending[0]).toMatchObject({
      id: newerPending.id,
      studentId: student.id,
      studentName: student.name,
      date: newerDay,
      amount: 50,
    });
    expect(response.body.pending[1]).toMatchObject({
      id: olderPending.id,
      date: olderDay,
      amount: 40,
    });
  });

  it('numbers february 2026 month weeks sequentially from 1 to 4', async () => {
    const period = resolveFinancialPeriod('month', '2026-02-15');

    expect(period.startDate).toBe('2026-02-01');
    expect(period.endDate).toBe('2026-02-28');
    expect(period.buckets.map((bucket) => bucket.label)).toEqual([
      'Sem 1',
      'Sem 2',
      'Sem 3',
      'Sem 4',
    ]);
    expect(period.buckets[0]).toMatchObject({
      startDate: '2026-02-02',
      endDate: '2026-02-06',
    });

    const response = await authRequest.get('/financial/dashboard').query({
      granularity: 'month',
      referenceDate: '2026-02-15',
    });

    expect(response.status).toBe(200);
    expect(
      response.body.chart.map((point: { label: string }) => point.label),
    ).toEqual(['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']);
  });

  it('numbers september 2026 month weeks sequentially from 1 to 5', async () => {
    const period = resolveFinancialPeriod('month', '2026-09-10');

    expect(period.startDate).toBe('2026-09-01');
    expect(period.endDate).toBe('2026-09-30');
    expect(period.buckets.map((bucket) => bucket.label)).toEqual([
      'Sem 1',
      'Sem 2',
      'Sem 3',
      'Sem 4',
      'Sem 5',
    ]);
    expect(period.buckets[0]).toMatchObject({
      startDate: '2026-09-01',
      endDate: '2026-09-04',
    });
    expect(period.buckets[4]).toMatchObject({
      startDate: '2026-09-28',
      endDate: '2026-09-30',
    });

    const response = await authRequest.get('/financial/dashboard').query({
      granularity: 'month',
      referenceDate: '2026-09-10',
    });

    expect(response.status).toBe(200);
    expect(
      response.body.chart.map((point: { label: string }) => point.label),
    ).toEqual(['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5']);
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

    const response = await authRequest.get('/financial/dashboard').query({
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

  it('excludes fully made-up absences from impact and student absence stats', async () => {
    const absenceDate = getPastClassDate(10);
    const student = await createActiveStudent('Aluno Reposição');
    const absence = await prisma.class.create({
      data: {
        studentId: student.id,
        date: dateFromDateKey(absenceDate),
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      },
    });

    const beforeMakeup = await authRequest.get('/financial/dashboard').query({
      granularity: 'week',
      referenceDate: absenceDate,
    });

    expect(beforeMakeup.status).toBe(200);
    expect(beforeMakeup.body.absenceImpact).toBe(60);
    expect(beforeMakeup.body.studentAbsences).toEqual([
      {
        studentId: student.id,
        studentName: student.name,
        absenceValue: 60,
      },
    ]);

    const makeupResponse = await authRequest.post('/classes').send({
      studentId: student.id,
      date: getFutureClassDate(15),
      period: 'morning',
      startTime: '08:00',
      durationMinutes: 60,
      expectedAmount: 60,
      isMakeupOnly: true,
      linkedAbsenceIds: [absence.id],
    });

    expect(makeupResponse.status).toBe(201);

    const afterMakeup = await authRequest.get('/financial/dashboard').query({
      granularity: 'week',
      referenceDate: absenceDate,
    });

    expect(afterMakeup.status).toBe(200);
    expect(afterMakeup.body.absenceImpact).toBe(0);
    expect(afterMakeup.body.studentAbsences).toEqual([]);
  });

  it('rejects invalid query parameters', async () => {
    const response = await authRequest.get('/financial/dashboard').query({
      granularity: 'week',
      referenceDate: 'invalid-date',
    });

    expect(response.status).toBe(400);
  });
});
