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
const PAST_WEEKS = 18;
const DURATION_MINUTES = 60;

type HistoryKind =
  | 'paid_pix'
  | 'paid_cash'
  | 'partial'
  | 'absent_pending'
  | 'absent_reposta'
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
  recurrences: SeedRecurrence[];
  contents: string[];
};

/**
 * Five students at R$45 / R$50, eight weekly slots filled, two mornings
 * left free for make-up lessons. History spans several months.
 */
const STUDENTS: SeedStudent[] = [
  {
    name: 'Ana Souza',
    guardianName: 'Márcia Souza',
    phone: '11999001001',
    hourlyRate: 50,
    recurrences: [
      { weekday: 1, startTime: '08:00', endTime: '09:00' },
      { weekday: 3, startTime: '14:00', endTime: '15:00' },
    ],
    contents: ['Revisão de frações', 'Equações do 1º grau'],
  },
  {
    name: 'Bruno Lima',
    guardianName: 'Paulo Lima',
    phone: '11999001002',
    hourlyRate: 45,
    advanceBalancePix: 45,
    recurrences: [
      { weekday: 2, startTime: '14:00', endTime: '15:00' },
      { weekday: 5, startTime: '08:00', endTime: '09:00' },
    ],
    contents: ['Geometria plana', 'Potenciação'],
  },
  {
    name: 'Carla Mendes',
    guardianName: 'Rita Mendes',
    phone: '11999001003',
    hourlyRate: 50,
    recurrences: [
      { weekday: 3, startTime: '08:00', endTime: '09:00' },
      { weekday: 5, startTime: '15:00', endTime: '16:00' },
    ],
    contents: ['Leitura e interpretação', 'Produção de texto'],
  },
  {
    name: 'Diego Rocha',
    guardianName: 'Sérgio Rocha',
    phone: '11999001004',
    hourlyRate: 45,
    recurrences: [
      { weekday: 4, startTime: '15:00', endTime: '16:00' },
      { weekday: 1, startTime: '16:00', endTime: '17:00' },
    ],
    contents: ['Tabuada e operações', 'Problemas de lógica'],
  },
  {
    name: 'Fernanda Alves',
    guardianName: 'Cláudia Alves',
    phone: '11999001005',
    hourlyRate: 50,
    recurrences: [{ weekday: 4, startTime: '18:00', endTime: '19:00' }],
    contents: ['Gramática e acentuação'],
  },
];

function slotKey(dateKey: string, period: 'morning' | 'afternoon'): string {
  return `${dateKey}-${period}`;
}

function historyKindFor(name: string, index: number): HistoryKind {
  if (name === 'Fernanda Alves') {
    const cycle = [
      'absent_pending',
      'absent_reposta',
      'paid_pix',
      'absent_pending',
      'partial',
      'attended_pending',
    ] as const;
    return cycle[index % cycle.length];
  }

  if (name === 'Ana Souza') {
    const cycle = [
      'paid_pix',
      'paid_cash',
      'paid_pix',
      'partial',
      'paid_pix',
      'paid_cash',
    ] as const;
    return cycle[index % cycle.length];
  }

  if (name === 'Diego Rocha') {
    const cycle = [
      'attended_pending',
      'paid_pix',
      'partial',
      'attended_pending',
      'paid_cash',
      'absent_pending',
    ] as const;
    return cycle[index % cycle.length];
  }

  if (name === 'Carla Mendes') {
    const cycle = [
      'paid_cash',
      'partial',
      'paid_pix',
      'absent_reposta',
      'paid_cash',
      'attended_pending',
    ] as const;
    return cycle[index % cycle.length];
  }

  const cycle = [
    'paid_pix',
    'paid_cash',
    'absent_reposta',
    'partial',
    'paid_pix',
    'attended_pending',
  ] as const;
  return cycle[index % cycle.length];
}

function getPastOccurrenceDates(
  weekday: number,
  startTime: string,
  weeksBack = PAST_WEEKS,
  reference = new Date(),
): string[] {
  const dates: string[] = [];

  for (let dayOffset = 0; dayOffset < weeksBack * 7 + 6; dayOffset++) {
    const candidate = new Date(reference);
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(candidate.getDate() - dayOffset);

    const dateKey = toDateKey(candidate);
    if (getWeekdayFromDateKey(dateKey) !== weekday) {
      continue;
    }

    const endedAt =
      getClassStartTimestampFromKey(dateKey, startTime) +
      DURATION_MINUTES * 60_000;

    if (endedAt <= reference.getTime()) {
      dates.push(dateKey);
    }
  }

  return dates.reverse();
}

function getPastFreeSlot(
  weekday: number,
  startTime: string,
  occupied: Set<string>,
  reference = new Date(),
): { dateKey: string; period: 'morning' | 'afternoon' } | null {
  const period = periodFromStartTime(startTime);

  for (const dateKey of getPastOccurrenceDates(
    weekday,
    startTime,
    PAST_WEEKS,
    reference,
  ).reverse()) {
    const key = slotKey(dateKey, period);
    if (!occupied.has(key)) {
      return { dateKey, period };
    }
  }

  return null;
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

async function seedOccurrence(input: {
  student: SeedStudent;
  studentId: string;
  recurrence: SeedRecurrence;
  dateKey: string;
  history: HistoryKind;
  content?: string;
  occupied: Set<string>;
}) {
  const { student, studentId, recurrence, dateKey, history, occupied } = input;
  const expectedAmount = calculateExpectedAmount(
    DURATION_MINUTES,
    student.hourlyRate,
  );
  const periodLabel = periodFromStartTime(recurrence.startTime);
  const key = slotKey(dateKey, periodLabel);

  if (occupied.has(key)) {
    return;
  }
  occupied.add(key);

  if (history === 'absent_pending') {
    await createHistoryClass({
      studentId,
      dateKey,
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
      durationMinutes: DURATION_MINUTES,
      expectedAmount,
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: DURATION_MINUTES,
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
      durationMinutes: DURATION_MINUTES,
      expectedAmount,
      attendance: AttendanceStatus.ABSENT,
      pendingMakeupMinutes: 0,
      notes: 'Falta já reposta',
    });

    const makeupSlot =
      getPastFreeSlot(2, '08:00', occupied) ??
      getPastFreeSlot(4, '08:00', occupied);

    if (!makeupSlot) {
      await prisma.class.update({
        where: { id: absence.id },
        data: {
          pendingMakeupMinutes: DURATION_MINUTES,
          notes: 'Falta com reposição pendente',
        },
      });
      return;
    }

    occupied.add(slotKey(makeupSlot.dateKey, makeupSlot.period));

    const makeup = await createHistoryClass({
      studentId,
      dateKey: makeupSlot.dateKey,
      startTime: makeupSlot.period === 'morning' ? '08:00' : '14:00',
      endTime: makeupSlot.period === 'morning' ? '09:00' : '15:00',
      durationMinutes: DURATION_MINUTES,
      expectedAmount,
      attendance: AttendanceStatus.ATTENDED,
      isMakeupOnly: true,
      content: 'Reposição de conteúdo',
    });

    await prisma.makeupLink.create({
      data: {
        makeupClassId: makeup.id,
        absenceClassId: absence.id,
        coveredMinutes: DURATION_MINUTES,
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
    durationMinutes: DURATION_MINUTES,
    expectedAmount,
    attendance: AttendanceStatus.ATTENDED,
    content: input.content,
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
          create: studentData.recurrences,
        },
      },
    });

    studentIds[studentData.name] = student.id;

    let occurrenceIndex = 0;
    for (const recurrence of studentData.recurrences) {
      const pastDates = getPastOccurrenceDates(
        recurrence.weekday,
        recurrence.startTime,
      );

      for (const dateKey of pastDates) {
        await seedOccurrence({
          student: studentData,
          studentId: student.id,
          recurrence,
          dateKey,
          history: historyKindFor(studentData.name, occurrenceIndex),
          content:
            studentData.contents[occurrenceIndex % studentData.contents.length],
          occupied: occupiedSlots,
        });
        occurrenceIndex += 1;
      }

      generatedRows.push(
        ...buildGeneratedClassData(
          student.id,
          studentData.hourlyRate,
          recurrence,
          occupiedSlots,
        ),
      );
    }
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
