import {
  AttendanceStatus,
  ClassPeriod,
  PaymentMethod,
} from '../../generated/prisma/client';

import { prisma } from './setup';

describe('database schema', () => {
  it('creates student with recurrence and class allocations', async () => {
    const student = await prisma.student.create({
      data: {
        name: 'Test Student',
        guardianName: 'Guardian',
        phone: '11999990000',
        hourlyRate: 60,
        recurrences: {
          create: {
            weekday: 2,
            startTime: '10:00',
            endTime: '11:00',
          },
        },
      },
      include: { recurrences: true },
    });

    expect(student.recurrences).toHaveLength(1);
    expect(student.recurrences[0].weekday).toBe(2);

    const classDate = new Date('2026-08-12');

    const session = await prisma.class.create({
      data: {
        studentId: student.id,
        date: classDate,
        period: ClassPeriod.MORNING,
        startTime: '10:00',
        endTime: '11:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ATTENDED,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: 60,
        method: PaymentMethod.CASH,
        paidAt: new Date('2026-08-12T11:00:00'),
      },
    });

    await prisma.classAllocation.create({
      data: {
        classId: session.id,
        amount: 60,
        method: PaymentMethod.CASH,
        source: 'PAYMENT',
        paymentId: payment.id,
      },
    });

    const absence = await prisma.class.create({
      data: {
        studentId: student.id,
        date: new Date('2026-08-11'),
        period: ClassPeriod.AFTERNOON,
        startTime: '14:00',
        endTime: '15:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      },
    });

    await prisma.makeupLink.create({
      data: {
        makeupClassId: session.id,
        absenceClassId: absence.id,
        coveredMinutes: 60,
      },
    });

    const makeupLinks = await prisma.makeupLink.findMany({
      where: { makeupClassId: session.id },
    });

    expect(makeupLinks).toHaveLength(1);
    expect(makeupLinks[0].coveredMinutes).toBe(60);
  });

  it('enforces one class per period per day on the teacher agenda', async () => {
    const studentA = await prisma.student.create({
      data: {
        name: 'Student A',
        guardianName: 'Guardian A',
        phone: '11999990001',
        hourlyRate: 50,
      },
    });

    const studentB = await prisma.student.create({
      data: {
        name: 'Student B',
        guardianName: 'Guardian B',
        phone: '11999990002',
        hourlyRate: 50,
      },
    });

    const classDate = new Date('2026-08-13');

    await prisma.class.create({
      data: {
        studentId: studentA.id,
        date: classDate,
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 50,
      },
    });

    await expect(
      prisma.class.create({
        data: {
          studentId: studentB.id,
          date: classDate,
          period: ClassPeriod.MORNING,
          startTime: '09:00',
          endTime: '10:00',
          durationMinutes: 60,
          expectedAmount: 50,
        },
      }),
    ).rejects.toThrow();
  });
});
