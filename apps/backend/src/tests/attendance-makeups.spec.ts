import request from 'supertest';

import { AttendanceStatus, ClassPeriod } from '../../generated/prisma/client';
import { app } from '@/app';
import { dateFromDateKey } from '@/utils/workday';
import { getFutureClassDate } from './helpers/dates';
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

async function createPastClassRecord(
  studentId: string,
  dateKey: string,
  options?: {
    attendance?: AttendanceStatus;
    pendingMakeupMinutes?: number;
  },
) {
  return prisma.class.create({
    data: {
      studentId,
      date: dateFromDateKey(dateKey),
      period: ClassPeriod.MORNING,
      startTime: '08:00',
      endTime: '09:00',
      durationMinutes: 60,
      expectedAmount: 60,
      attendance: options?.attendance ?? AttendanceStatus.EMPTY,
      pendingMakeupMinutes: options?.pendingMakeupMinutes ?? 0,
    },
  });
}

describe('classes attendance and makeups API', () => {
  it('updates attendance to absent and attended with content', async () => {
    const student = await createActiveStudent();
    const created = await createFutureClass(student.id, getFutureClassDate());

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
    const created = await createPastClassRecord(student.id, '2026-08-04');

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

  it('creates makeup-only class and covers absences', async () => {
    const student = await createActiveStudent();
    const absence = await createPastClassRecord(student.id, '2026-08-04', {
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: 60,
    });

    const makeupResponse = await request(app)
      .post('/classes')
      .send({
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
    expect(makeupResponse.body.isMakeupOnly).toBe(true);
    expect(makeupResponse.body.linkedAbsenceIds).toEqual([absence.id]);

    const absenceRecord = await prisma.class.findUnique({
      where: { id: absence.id },
    });
    expect(absenceRecord?.pendingMakeupMinutes).toBe(0);

    const showAbsence = await request(app).get(`/classes/${absence.id}`);
    expect(showAbsence.body.pendingMakeupMinutes).toBe(0);
  });

  it('links makeup to existing class with partial coverage', async () => {
    const student = await createActiveStudent();
    const absence = await createPastClassRecord(student.id, '2026-08-05', {
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: 30,
    });

    const target = await createFutureClass(student.id, getFutureClassDate(16));

    const linkResponse = await request(app)
      .post('/classes/link-makeup')
      .send({
        targetClassId: target.id,
        studentId: student.id,
        absenceIds: [absence.id],
        startTime: '08:00',
        endTime: '09:30',
      });

    expect(linkResponse.status).toBe(200);
    expect(linkResponse.body.durationMinutes).toBe(90);
    expect(linkResponse.body.linkedAbsenceIds).toEqual([absence.id]);
    expect(linkResponse.body.expectedAmount).toBe(90);

    const absenceRecord = await prisma.class.findUnique({
      where: { id: absence.id },
    });
    expect(absenceRecord?.pendingMakeupMinutes).toBe(0);
  });

  it('lists pending absences for a student', async () => {
    const student = await createActiveStudent();
    const absence = await createPastClassRecord(student.id, '2026-08-06', {
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: 60,
    });

    const response = await request(app).get(
      `/classes/pending-absences?studentId=${student.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(absence.id);
  });

  it('blocks linking makeup to filled class', async () => {
    const student = await createActiveStudent();
    const absence = await createPastClassRecord(student.id, '2026-08-07', {
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: 60,
    });
    const target = await createFutureClass(student.id, getFutureClassDate(17));

    await request(app)
      .patch(`/classes/${target.id}/attendance`)
      .send({ attendance: 'attended' });

    const response = await request(app)
      .post('/classes/link-makeup')
      .send({
        targetClassId: target.id,
        studentId: student.id,
        absenceIds: [absence.id],
        startTime: '08:00',
        endTime: '09:00',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Não é possível vincular reposição a uma aula já preenchida.',
    );
  });

  it('blocks modifying locked reposta absence', async () => {
    const student = await createActiveStudent();
    const absence = await createPastClassRecord(student.id, '2026-08-08', {
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: 60,
    });

    const makeup = await request(app)
      .post('/classes')
      .send({
        studentId: student.id,
        date: getFutureClassDate(18),
        period: 'morning',
        startTime: '08:00',
        durationMinutes: 60,
        expectedAmount: 60,
        isMakeupOnly: true,
        linkedAbsenceIds: [absence.id],
      });

    expect(makeup.status).toBe(201);

    const response = await request(app)
      .patch(`/classes/${absence.id}/attendance`)
      .send({ attendance: 'empty' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Esta falta já foi reposta e não pode ser alterada. Ela permanece apenas como referência.',
    );
  });

  it('rejects makeup with insufficient duration', async () => {
    const student = await createActiveStudent();
    const absence = await createPastClassRecord(student.id, '2026-08-09', {
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: 60,
    });

    const response = await request(app)
      .post('/classes')
      .send({
        studentId: student.id,
        date: getFutureClassDate(17),
        period: 'morning',
        startTime: '08:00',
        durationMinutes: 30,
        expectedAmount: 30,
        isMakeupOnly: true,
        linkedAbsenceIds: [absence.id],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Duração insuficiente para a reposição vinculada.',
    );
  });
});
