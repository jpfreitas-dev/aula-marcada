import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  AllocationSource,
  AttendanceStatus,
  PaymentMethod,
  PrismaClient,
} from '../generated/prisma/client';
import { calculateExpectedAmount } from '../src/utils/class-value';
import { periodFromStartTime } from '../src/utils/time';
import {
  dateFromDateKey,
  getClassStartTimestampFromKey,
  getWeekdayFromDateKey,
  toDateKey,
} from '../src/utils/workday';
import {
  buildGeneratedClassData,
  periodToPrisma,
} from '../src/services/students/recurrence-scheduler';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const TODAY_KEY = toDateKey(new Date());

type HistoryKind =
  | 'paid_pix'
  | 'paid_cash'
  | 'partial'
  | 'absent_pending'
  | 'absent_reposta'
  | 'advance'
  | 'attended_pending';

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
  recurrence: SeedRecurrence;
  history: HistoryKind;
  content?: string;
};

/**
 * Demo roster: Mon–Fri morning + afternoon coverage for the current week agenda.
 * History states are applied to each student's most recent past occurrence.
 */
const STUDENTS: SeedStudent[] = [
  {
    name: 'Ana Souza',
    guardianName: 'Márcia Souza',
    phone: '11999001001',
    hourlyRate: 60,
    recurrence: { weekday: 1, startTime: '08:00', endTime: '09:00' },
    history: 'paid_pix',
    content: 'Revisão de frações',
  },
  {
    name: 'Bruno Lima',
    guardianName: 'Paulo Lima',
    phone: '11999001002',
    hourlyRate: 55,
    recurrence: { weekday: 2, startTime: '14:00', endTime: '15:00' },
    history: 'paid_cash',
    content: 'Equações do 1º grau',
  },
  {
    name: 'Carla Mendes',
    guardianName: 'Rita Mendes',
    phone: '11999001003',
    hourlyRate: 50,
    recurrence: { weekday: 3, startTime: '09:00', endTime: '10:00' },
    history: 'partial',
    content: 'Leitura e interpretação',
  },
  {
    name: 'Diego Rocha',
    guardianName: 'Sérgio Rocha',
    phone: '11999001004',
    hourlyRate: 58,
    recurrence: { weekday: 4, startTime: '15:00', endTime: '16:00' },
    history: 'absent_pending',
  },
  {
    name: 'Fernanda Alves',
    guardianName: 'Cláudia Alves',
    phone: '11999001005',
    hourlyRate: 62,
    recurrence: { weekday: 5, startTime: '10:00', endTime: '11:00' },
    history: 'absent_reposta',
  },
  {
    name: 'Gustavo Nunes',
    guardianName: 'Helena Nunes',
    phone: '11999001006',
    hourlyRate: 60,
    advanceBalancePix: 60,
    recurrence: { weekday: 1, startTime: '16:00', endTime: '17:00' },
    history: 'advance',
    content: 'Geometria plana',
  },
  {
    name: 'Helena Dias',
    guardianName: 'Roberto Dias',
    phone: '11999001007',
    hourlyRate: 55,
    recurrence: { weekday: 5, startTime: '18:00', endTime: '19:00' },
    history: 'attended_pending',
    content: 'Produção de texto',
  },
];

function slotKey(dateKey: string, period: 'morning' | 'afternoon'): string {
  return `${dateKey}-${period}`;
}

function getRecentPastOccurrence(
  weekday: number,
  startTime: string,
  durationMinutes = 60,
  reference = new Date(),
): string {
  for (let dayOffset = 0; dayOffset < 21; dayOffset++) {
    const candidate = new Date(reference);
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(candidate.getDate() - dayOffset);

    const dateKey = toDateKey(candidate);
    if (getWeekdayFromDateKey(dateKey) !== weekday) {
      continue;
    }

    const endedAt =
      getClassStartTimestampFromKey(dateKey, startTime) +
      durationMinutes * 60_000;

    if (endedAt <= reference.getTime()) {
      return dateKey;
    }
  }

  throw new Error(`No past occurrence found for weekday ${weekday}`);
}

function getPastFreeSlot(
  weekday: number,
  startTime: string,
  occupied: Set<string>,
  reference = new Date(),
): { dateKey: string; period: 'morning' | 'afternoon' } {
  const period = periodFromStartTime(startTime);

  for (let weekOffset = 0; weekOffset < 6; weekOffset++) {
    const candidate = new Date(reference);
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(candidate.getDate() - weekOffset * 7);

    const dateKey = getRecentPastOccurrence(weekday, startTime, 60, candidate);
    const key = slotKey(dateKey, period);

    if (!occupied.has(key)) {
      return { dateKey, period };
    }
  }

  throw new Error(
    `No free past slot for weekday ${weekday} ${startTime} (${period})`,
  );
}

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

async function createHistoryClass(input: {
  studentId: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  expectedAmount: number;
  attendance: AttendanceStatus;
  pendingMakeupMinutes?: number;
  isMakeupOnly?: boolean;
  content?: string;
  notes?: string;
}) {
  const periodLabel = periodFromStartTime(input.startTime);

  return prisma.class.create({
    data: {
      studentId: input.studentId,
      date: dateFromDateKey(input.dateKey),
      period: periodToPrisma(periodLabel),
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: input.durationMinutes,
      expectedAmount: input.expectedAmount,
      attendance: input.attendance,
      pendingMakeupMinutes: input.pendingMakeupMinutes ?? 0,
      isMakeupOnly: input.isMakeupOnly ?? false,
      content: input.content,
      notes: input.notes,
    },
  });
}

async function seedStudentHistory(
  student: SeedStudent,
  studentId: string,
  occupied: Set<string>,
) {
  const { recurrence, history } = student;
  const durationMinutes = 60;
  const expectedAmount = calculateExpectedAmount(
    durationMinutes,
    student.hourlyRate,
  );
  const dateKey = getRecentPastOccurrence(
    recurrence.weekday,
    recurrence.startTime,
    durationMinutes,
  );
  const periodLabel = periodFromStartTime(recurrence.startTime);
  const key = slotKey(dateKey, periodLabel);

  if (occupied.has(key)) {
    throw new Error(
      `Schedule conflict on ${key} while seeding ${student.name}`,
    );
  }
  occupied.add(key);

  if (history === 'absent_pending') {
    await createHistoryClass({
      studentId,
      dateKey,
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
      durationMinutes,
      expectedAmount,
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: durationMinutes,
      notes: 'Falta com reposição pendente',
    });
    return;
  }

  if (history === 'absent_reposta') {
    const absence = await createHistoryClass({
      studentId,
      dateKey,
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
      durationMinutes,
      expectedAmount,
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: 0,
      notes: 'Falta já reposta',
    });

    // Tuesday morning is free in the demo roster (Bruno is Tuesday afternoon).
    const makeupSlot = getPastFreeSlot(2, '08:00', occupied);
    occupied.add(slotKey(makeupSlot.dateKey, makeupSlot.period));

    const makeup = await createHistoryClass({
      studentId,
      dateKey: makeupSlot.dateKey,
      startTime: '08:00',
      endTime: '09:00',
      durationMinutes,
      expectedAmount,
      attendance: AttendanceStatus.ATTENDED,
      isMakeupOnly: true,
      content: 'Reposição de conteúdo',
    });

    await prisma.makeupLink.create({
      data: {
        makeupClassId: makeup.id,
        absenceClassId: absence.id,
        coveredMinutes: durationMinutes,
      },
    });

    await payClass(
      studentId,
      makeup.id,
      expectedAmount,
      PaymentMethod.PIX,
      makeupSlot.dateKey,
    );
    return;
  }

  const session = await createHistoryClass({
    studentId,
    dateKey,
    startTime: recurrence.startTime,
    endTime: recurrence.endTime,
    durationMinutes,
    expectedAmount,
    attendance: AttendanceStatus.ATTENDED,
    content: student.content,
  });

  if (history === 'paid_pix') {
    await payClass(
      studentId,
      session.id,
      expectedAmount,
      PaymentMethod.PIX,
      dateKey,
    );
    return;
  }

  if (history === 'paid_cash') {
    await payClass(
      studentId,
      session.id,
      expectedAmount,
      PaymentMethod.CASH,
      dateKey,
    );
    return;
  }

  if (history === 'partial') {
    const partialAmount = Math.round(expectedAmount * 0.5 * 100) / 100;
    await payClass(
      studentId,
      session.id,
      partialAmount,
      PaymentMethod.PIX,
      dateKey,
    );
    return;
  }

  if (history === 'advance') {
    // Class settled; leftover Pix advance remains on the student record.
    await payClass(
      studentId,
      session.id,
      expectedAmount,
      PaymentMethod.PIX,
      dateKey,
    );
    return;
  }

  // attended_pending: Compareceu with open balance (no allocation).
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
  const generatedRows: ReturnType<typeof buildGeneratedClassData> = [];

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
        recurrences: {
          create: [studentData.recurrence],
        },
      },
    });

    studentIds[studentData.name] = student.id;

    await seedStudentHistory(studentData, student.id, occupiedSlots);

    generatedRows.push(
      ...buildGeneratedClassData(
        student.id,
        studentData.hourlyRate,
        studentData.recurrence,
        occupiedSlots,
      ),
    );
  }

  if (generatedRows.length > 0) {
    await prisma.class.createMany({ data: generatedRows });
  }

  const classCount = await prisma.class.count();
  const futureCount = await prisma.class.count({
    where: { attendance: AttendanceStatus.EMPTY },
  });
  const paymentCount = await prisma.payment.count();
  const makeupLinkCount = await prisma.makeupLink.count();

  console.log('Seed completed:', {
    today: TODAY_KEY,
    students: Object.keys(studentIds).length,
    classes: classCount,
    futureClasses: futureCount,
    payments: paymentCount,
    makeupLinks: makeupLinkCount,
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
