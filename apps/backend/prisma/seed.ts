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

async function main() {
  await prisma.classAllocation.deleteMany();
  await prisma.makeupLink.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.studentRecurrence.deleteMany();
  await prisma.student.deleteMany();

  const joao = await prisma.student.create({
    data: {
      name: 'João Silva',
      guardianName: 'Maria Silva',
      phone: '11999990001',
      hourlyRate: 50,
      advanceBalancePix: 0,
      advanceBalanceCash: 0,
      active: true,
      recurrences: {
        create: [
          {
            weekday: 1,
            startTime: '08:00',
            endTime: '09:00',
          },
          {
            weekday: 3,
            startTime: '14:00',
            endTime: '15:00',
          },
        ],
      },
    },
  });

  const pedro = await prisma.student.create({
    data: {
      name: 'Pedro Santos',
      guardianName: 'Ana Santos',
      phone: '11999990002',
      hourlyRate: 45,
      advanceBalancePix: 25,
      advanceBalanceCash: 0,
      active: true,
    },
  });

  const maria = await prisma.student.create({
    data: {
      name: 'Maria Oliveira',
      guardianName: 'Carlos Oliveira',
      phone: '11999990003',
      hourlyRate: 55,
      advanceBalancePix: 0,
      advanceBalanceCash: 0,
      active: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const day = monday.getDay();
  const diff = day === 0 ? 1 : day === 6 ? 2 : day === 1 ? 0 : 1 - day;
  monday.setDate(monday.getDate() + diff);

  const wednesday = new Date(monday);
  wednesday.setDate(wednesday.getDate() + 2);

  await prisma.class.create({
    data: {
      studentId: joao.id,
      date: monday,
      period: ClassPeriod.MORNING,
      startTime: '08:00',
      endTime: '09:00',
      durationMinutes: 60,
      expectedAmount: 50,
      attendance: AttendanceStatus.EMPTY,
    },
  });

  await prisma.class.create({
    data: {
      studentId: pedro.id,
      date: monday,
      period: ClassPeriod.AFTERNOON,
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      expectedAmount: 45,
      attendance: AttendanceStatus.ATTENDED,
    },
  });

  const attendedClass = await prisma.class.findFirst({
    where: { studentId: pedro.id },
  });

  if (attendedClass) {
    const payment = await prisma.payment.create({
      data: {
        studentId: pedro.id,
        amount: 45,
        method: PaymentMethod.PIX,
        paidAt: new Date(),
      },
    });

    await prisma.classAllocation.create({
      data: {
        classId: attendedClass.id,
        amount: 45,
        method: PaymentMethod.PIX,
        source: AllocationSource.PAYMENT,
        paymentId: payment.id,
      },
    });
  }

  await prisma.class.create({
    data: {
      studentId: maria.id,
      date: wednesday,
      period: ClassPeriod.MORNING,
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      expectedAmount: 55,
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: 60,
    },
  });

  console.log('Seed completed:', {
    students: 3,
    anchorMonday: monday.toISOString().slice(0, 10),
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
