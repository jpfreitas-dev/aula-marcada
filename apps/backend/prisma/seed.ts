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

const TODAY_KEY = '2026-08-16';

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
  isMakeupOnly?: boolean;
  content?: string;
  notes?: string;
};

type SeedRecurrence = {
  weekday: number;
  startTime: string;
  endTime: string;
};

type SeedStudent = {
  name: string;
  guardianName: string;
  phone: string;
  hourlyRate: number;
  advanceBalancePix?: number;
  advanceBalanceCash?: number;
  recurrences?: SeedRecurrence[];
  classes: SeedClass[];
};

const STUDENTS: SeedStudent[] = [
  {
    name: 'Aluno 1',
    guardianName: 'Responsável Aluno 1',
    phone: '11999001001',
    hourlyRate: 60,
    recurrences: [{ weekday: 1, startTime: '08:00', endTime: '09:00' }],
    classes: [
      {
        dateKey: '2026-08-11',
        period: ClassPeriod.MORNING,
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 60,
        expectedAmount: 60,
        attendance: AttendanceStatus.ATTENDED,
        content: 'Revisão de frações',
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
    name: 'Aluno 2',
    guardianName: 'Responsável Aluno 2',
    phone: '11999001002',
    hourlyRate: 55,
    advanceBalanceCash: 20,
    recurrences: [{ weekday: 3, startTime: '14:00', endTime: '15:00' }],
    classes: [
      {
        dateKey: '2026-08-13',
        period: ClassPeriod.AFTERNOON,
        startTime: '14:00',
        endTime: '15:00',
        durationMinutes: 60,
        expectedAmount: 55,
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      },
      {
        dateKey: '2026-08-20',
        period: ClassPeriod.AFTERNOON,
        startTime: '14:00',
        endTime: '15:00',
        durationMinutes: 60,
        expectedAmount: 55,
        attendance: AttendanceStatus.EMPTY,
      },
    ],
  },
  {
    name: 'Aluno 3',
    guardianName: 'Responsável Aluno 3',
    phone: '11999001003',
    hourlyRate: 50,
    advanceBalancePix: 30,
    recurrences: [{ weekday: 4, startTime: '09:00', endTime: '10:00' }],
    classes: [
      {
        dateKey: '2026-08-14',
        period: ClassPeriod.MORNING,
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        expectedAmount: 50,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-21',
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
    name: 'Aluno 4',
    guardianName: 'Responsável Aluno 4',
    phone: '11999001004',
    hourlyRate: 58,
    recurrences: [{ weekday: 5, startTime: '19:00', endTime: '20:00' }],
    classes: [
      {
        dateKey: '2026-08-15',
        period: ClassPeriod.AFTERNOON,
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        expectedAmount: 58,
        attendance: AttendanceStatus.ATTENDED,
      },
      {
        dateKey: '2026-08-22',
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

async function allocateClass(
  classId: string,
  amount: number,
  method: PaymentMethod,
  source: AllocationSource,
  paymentId?: string,
) {
  await prisma.classAllocation.create({
    data: {
      classId,
      amount,
      method,
      source,
      paymentId,
    },
  });
}

async function payClass(
  studentId: string,
  classId: string,
  amount: number,
  method: PaymentMethod,
  paidAtKey: string,
) {
  const payment = await prisma.payment.create({
    data: {
      studentId,
      amount,
      method,
      paidAt: dateFromDateKey(paidAtKey),
    },
  });

  await allocateClass(
    classId,
    amount,
    method,
    AllocationSource.PAYMENT,
    payment.id,
  );
}

async function seedFinancials(studentIds: Record<string, string>) {
  const aluno1 = studentIds['Aluno 1'];
  const aluno3 = studentIds['Aluno 3'];
  const aluno4 = studentIds['Aluno 4'];

  const aluno1Class = await prisma.class.findFirst({
    where: {
      studentId: aluno1,
      date: dateFromDateKey('2026-08-11'),
    },
  });

  if (aluno1Class) {
    await payClass(
      aluno1,
      aluno1Class.id,
      Number(aluno1Class.expectedAmount),
      PaymentMethod.PIX,
      '2026-08-11',
    );
  }

  const aluno3Class = await prisma.class.findFirst({
    where: {
      studentId: aluno3,
      date: dateFromDateKey('2026-08-14'),
    },
  });

  if (aluno3Class) {
    await payClass(
      aluno3,
      aluno3Class.id,
      Number(aluno3Class.expectedAmount),
      PaymentMethod.PIX,
      '2026-08-14',
    );
  }

  const aluno4Class = await prisma.class.findFirst({
    where: {
      studentId: aluno4,
      date: dateFromDateKey('2026-08-15'),
    },
  });

  if (aluno4Class) {
    await payClass(
      aluno4,
      aluno4Class.id,
      30,
      PaymentMethod.CASH,
      '2026-08-15',
    );
  }
}

async function main() {
  await prisma.classAllocation.deleteMany();
  await prisma.makeupLink.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.studentRecurrence.deleteMany();
  await prisma.student.deleteMany();

  const studentIds: Record<string, string> = {};
  const occupiedSlots = new Set<string>();

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
        ...(studentData.recurrences?.length
          ? {
              recurrences: {
                create: studentData.recurrences,
              },
            }
          : {}),
      },
    });

    studentIds[studentData.name] = student.id;

    const sortedClasses = [...studentData.classes].sort((left, right) =>
      left.dateKey.localeCompare(right.dateKey),
    );

    for (const classData of sortedClasses) {
      const slot = `${classData.dateKey}:${classData.period}`;
      if (occupiedSlots.has(slot)) {
        throw new Error(
          `Schedule conflict on ${slot} while seeding ${studentData.name}`,
        );
      }
      occupiedSlots.add(slot);

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
          isMakeupOnly: classData.isMakeupOnly ?? false,
          content: classData.content,
          notes: classData.notes,
        },
      });
    }
  }

  await seedFinancials(studentIds);

  const classCount = await prisma.class.count();
  const futureCount = await prisma.class.count({
    where: { attendance: AttendanceStatus.EMPTY },
  });
  const paymentCount = await prisma.payment.count();

  console.log('Seed completed:', {
    today: TODAY_KEY,
    students: Object.keys(studentIds).length,
    classes: classCount,
    futureClasses: futureCount,
    payments: paymentCount,
    studentNames: Object.keys(studentIds),
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
