import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  AllocationSource,
  AttendanceStatus,
  ClassPeriod,
  PaymentMethod,
  PrismaClient,
} from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function dateFromDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

type SeedClass = {
  dateKey: string;
  period: ClassPeriod;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  expectedAmount: number;
  attendance: AttendanceStatus;
  pendingMakeupMinutes?: number;
  content?: string;
  notes?: string;
};

type SeedStudent = {
  name: string;
  guardianName: string;
  phone: string;
  hourlyRate: number;
  advanceBalancePix?: number;
  advanceBalanceCash?: number;
  recurrence?: {
    weekday: number;
    startTime: string;
    endTime: string;
  };
  classes: SeedClass[];
};

const STUDENTS: SeedStudent[] = [
  {
    name: 'Bryan',
    guardianName: 'Responsável Bryan',
    phone: '11999001001',
    hourlyRate: 60,
    recurrence: {
      weekday: 1,
      startTime: '08:00',
      endTime: '09:00',
    },
    classes: [
      {
        dateKey: '2026-07-07',
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ATTENDED,
        content: 'Revisão de frações',
      },
      {
        dateKey: '2026-07-14',
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-07-21',
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      },
      {
        dateKey: '2026-07-28',
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-04',
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-11',
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-18',
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.EMPTY,
      },
    ],
  },
  {
    name: 'Gael',
    guardianName: 'Responsável Gael',
    phone: '11999001002',
    hourlyRate: 55,
    recurrence: {
      weekday: 3,
      startTime: '19:00',
      endTime: '20:00',
    },
    classes: [
      {
        dateKey: '2026-07-09',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 55,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-07-16',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 55,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-07-23',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 55,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-07-30',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 55,
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      },
      {
        dateKey: '2026-08-06',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 55,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-20',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 55,
        attendance: AttendanceStatus.EMPTY,
      },
    ],
  },
  {
    name: 'Eloah',
    guardianName: 'Responsável Eloah',
    phone: '11999001003',
    hourlyRate: 50,
    recurrence: {
      weekday: 4,
      startTime: '09:00',
      endTime: '10:00',
    },
    classes: [
      {
        dateKey: '2026-07-10',
        period: ClassPeriod.MORNING,
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-07-17',
        period: ClassPeriod.MORNING,
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-07-24',
        period: ClassPeriod.MORNING,
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-07-31',
        period: ClassPeriod.MORNING,
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      },
      {
        dateKey: '2026-08-07',
        period: ClassPeriod.MORNING,
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-14',
        period: ClassPeriod.MORNING,
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: AttendanceStatus.EMPTY,
      },
    ],
  },
  {
    name: 'Aylon',
    guardianName: 'Responsável Aylon',
    phone: '11999001004',
    hourlyRate: 65,
    advanceBalancePix: 30,
    classes: [
      {
        dateKey: '2026-07-08',
        period: ClassPeriod.AFTERNOON,
        startTime: '14:00',
        endTime: '15:00',
        durationMinutes: 60,
        expectedAmount: 65,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-07-22',
        period: ClassPeriod.AFTERNOON,
        startTime: '14:00',
        endTime: '15:00',
        durationMinutes: 60,
        expectedAmount: 65,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-05',
        period: ClassPeriod.AFTERNOON,
        startTime: '14:00',
        endTime: '15:00',
        durationMinutes: 60,
        expectedAmount: 65,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-19',
        period: ClassPeriod.AFTERNOON,
        startTime: '14:00',
        endTime: '15:00',
        durationMinutes: 60,
        expectedAmount: 65,
        attendance: AttendanceStatus.EMPTY,
      },
    ],
  },
  {
    name: 'Daniel',
    guardianName: 'Responsável Daniel',
    phone: '11999001005',
    hourlyRate: 58,
    recurrence: {
      weekday: 5,
      startTime: '19:00',
      endTime: '20:00',
    },
    classes: [
      {
        dateKey: '2026-07-11',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 58,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-07-18',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 58,
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      },
      {
        dateKey: '2026-07-25',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 58,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-01',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 58,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-08',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 58,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-15',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 58,
        attendance: AttendanceStatus.EMPTY,
      },
    ],
  },
];

async function main() {
  await prisma.classAllocation.deleteMany();
  await prisma.makeupLink.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.studentRecurrence.deleteMany();
  await prisma.student.deleteMany();

  const createdStudents: Array<{ id: string; name: string }> = [];

  for (const studentData of STUDENTS) {
    const student = await prisma.student.create({
      data: {
        name: studentData.name,
        guardianName: studentData.guardianName,
        phone: studentData.phone,
        hourlyRate: studentData.hourlyRate,
        advanceBalancePix: studentData.advanceBalancePix ?? 0,
        advanceBalanceCash: studentData.advanceBalanceCash ?? 0,
        active: true,
        ...(studentData.recurrence
          ? {
              recurrences: {
                create: [studentData.recurrence],
              },
            }
          : {}),
      },
    });

    createdStudents.push({ id: student.id, name: student.name });

    for (const classData of studentData.classes) {
      await prisma.class.create({
        data: {
          studentId: student.id,
          date: dateFromDateKey(classData.dateKey),
          period: classData.period,
          startTime: classData.startTime,
          endTime: classData.endTime,
          durationMinutes: classData.durationMinutes,
          expectedAmount: classData.expectedAmount,
          attendance: classData.attendance,
          pendingMakeupMinutes: classData.pendingMakeupMinutes ?? 0,
          content: classData.content,
          notes: classData.notes,
        },
      });
    }
  }

  const bryan = createdStudents.find((item) => item.name === 'Bryan');
  const gael = createdStudents.find((item) => item.name === 'Gael');
  const aylon = createdStudents.find((item) => item.name === 'Aylon');

  if (bryan) {
    const pendingClass = await prisma.class.findFirst({
      where: {
        studentId: bryan.id,
        date: dateFromDateKey('2026-08-11'),
      },
    });

    if (pendingClass) {
      const payment = await prisma.payment.create({
        data: {
          studentId: bryan.id,
          amount: 30,
          method: PaymentMethod.PIX,
          paidAt: dateFromDateKey('2026-08-11'),
        },
      });

      await prisma.classAllocation.create({
        data: {
          classId: pendingClass.id,
          amount: 30,
          method: PaymentMethod.PIX,
          source: AllocationSource.PAYMENT,
          paymentId: payment.id,
        },
      });
    }
  }

  if (gael) {
    const attendedClass = await prisma.class.findFirst({
      where: {
        studentId: gael.id,
        date: dateFromDateKey('2026-08-06'),
      },
    });

    if (attendedClass) {
      const payment = await prisma.payment.create({
        data: {
          studentId: gael.id,
          amount: 55,
          method: PaymentMethod.CASH,
          paidAt: dateFromDateKey('2026-08-06'),
        },
      });

      await prisma.classAllocation.create({
        data: {
          classId: attendedClass.id,
          amount: 55,
          method: PaymentMethod.CASH,
          source: AllocationSource.PAYMENT,
          paymentId: payment.id,
        },
      });
    }
  }

  if (aylon) {
    const attendedClass = await prisma.class.findFirst({
      where: {
        studentId: aylon.id,
        date: dateFromDateKey('2026-08-05'),
      },
    });

    if (attendedClass) {
      await prisma.classAllocation.create({
        data: {
          classId: attendedClass.id,
          amount: 30,
          method: PaymentMethod.PIX,
          source: AllocationSource.ADVANCE_PIX,
        },
      });

      await prisma.student.update({
        where: { id: aylon.id },
        data: { advanceBalancePix: 0 },
      });
    }
  }

  const classCount = await prisma.class.count();
  const futureCount = await prisma.class.count({
    where: { attendance: AttendanceStatus.EMPTY },
  });

  console.log('Seed completed:', {
    students: createdStudents.length,
    classes: classCount,
    futureClasses: futureCount,
    studentNames: createdStudents.map((item) => item.name),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
