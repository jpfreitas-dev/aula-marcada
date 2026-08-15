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

const TODAY_KEY = '2026-08-13';

function dateFromDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nthWeekdayDate(
  weekday: number,
  fromKey: string,
  index: number,
): string {
  return enumerateWeekdayDates(weekday, fromKey, '2026-12-31')[index];
}

const BRYAN_ABSENCE_KEY = nthWeekdayDate(1, '2026-05-05', 10);
const GAEL_ABSENCE_KEYS = [
  nthWeekdayDate(3, '2026-05-07', 5),
  nthWeekdayDate(3, '2026-05-07', 11),
];
const ELOAH_ABSENCE_KEYS = [
  nthWeekdayDate(4, '2026-05-01', 5),
  nthWeekdayDate(4, '2026-05-01', 10),
];
const DANIEL_ABSENCE_KEYS = [
  nthWeekdayDate(5, '2026-05-02', 2),
  nthWeekdayDate(5, '2026-05-02', 7),
  nthWeekdayDate(5, '2026-05-02', 11),
];

function enumerateWeekdayDates(
  weekday: number,
  fromKey: string,
  toKey: string,
): string[] {
  const dates: string[] = [];
  const current = dateFromDateKey(fromKey);
  const end = dateFromDateKey(toKey);

  while (current <= end) {
    if (current.getUTCDay() === weekday) {
      dates.push(toDateKey(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function isPastDate(dateKey: string): boolean {
  return dateKey < TODAY_KEY;
}

function isToday(dateKey: string): boolean {
  return dateKey === TODAY_KEY;
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

type RecurringClassTemplate = {
  weekday: number;
  period: ClassPeriod;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  hourlyRate: number;
  fromKey: string;
  toKey: string;
  attendanceForDate?: (
    dateKey: string,
    index: number,
  ) => {
    attendance: AttendanceStatus;
    pendingMakeupMinutes?: number;
    content?: string;
  };
};

function buildRecurringClasses(template: RecurringClassTemplate): SeedClass[] {
  const dates = enumerateWeekdayDates(
    template.weekday,
    template.fromKey,
    template.toKey,
  );

  return dates.map((dateKey, index) => {
    const amount =
      Math.round((template.durationMinutes / 60) * template.hourlyRate * 100) /
      100;
    const override = template.attendanceForDate?.(dateKey, index);

    let attendance = AttendanceStatus.EMPTY;
    let pendingMakeupMinutes = 0;

    if (override) {
      attendance = override.attendance;
      pendingMakeupMinutes = override.pendingMakeupMinutes ?? 0;
    } else if (isPastDate(dateKey)) {
      attendance = AttendanceStatus.ATTENDED;
    } else if (isToday(dateKey)) {
      attendance = AttendanceStatus.EMPTY;
    }

    return {
      dateKey,
      period: template.period,
      startTime: template.startTime,
      endTime: template.endTime,
      durationMinutes: template.durationMinutes,
      expectedAmount: amount,
      attendance,
      pendingMakeupMinutes,
      content: override?.content,
    };
  });
}

const BRYAN_CLASSES = buildRecurringClasses({
  weekday: 1,
  period: ClassPeriod.MORNING,
  startTime: '08:00',
  endTime: '09:00',
  durationMinutes: 60,
  hourlyRate: 60,
  fromKey: '2026-05-05',
  toKey: '2026-11-10',
  attendanceForDate: (dateKey) => {
    if (dateKey === BRYAN_ABSENCE_KEY) {
      return {
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      };
    }

    if (dateKey === '2026-08-04' || dateKey === '2026-08-11') {
      return { attendance: AttendanceStatus.ATTENDED };
    }

    if (isPastDate(dateKey)) {
      return { attendance: AttendanceStatus.ATTENDED };
    }

    return { attendance: AttendanceStatus.EMPTY };
  },
});

const GAEL_CLASSES = buildRecurringClasses({
  weekday: 3,
  period: ClassPeriod.AFTERNOON,
  startTime: '19:00',
  endTime: '20:00',
  durationMinutes: 60,
  hourlyRate: 55,
  fromKey: '2026-05-07',
  toKey: '2026-11-12',
  attendanceForDate: (dateKey) => {
    if (GAEL_ABSENCE_KEYS.includes(dateKey)) {
      return {
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      };
    }

    if (isPastDate(dateKey)) {
      return { attendance: AttendanceStatus.ATTENDED };
    }

    return { attendance: AttendanceStatus.EMPTY };
  },
});

const ELOAH_CLASSES = buildRecurringClasses({
  weekday: 4,
  period: ClassPeriod.MORNING,
  startTime: '09:00',
  endTime: '10:30',
  durationMinutes: 90,
  hourlyRate: 50,
  fromKey: '2026-05-01',
  toKey: '2026-11-13',
  attendanceForDate: (dateKey) => {
    if (dateKey === ELOAH_ABSENCE_KEYS[0]) {
      return {
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 90,
      };
    }

    if (dateKey === ELOAH_ABSENCE_KEYS[1]) {
      return {
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 45,
      };
    }

    if (isPastDate(dateKey)) {
      return { attendance: AttendanceStatus.ATTENDED };
    }

    return { attendance: AttendanceStatus.EMPTY };
  },
});

const AYLON_CLASSES = enumerateWeekdayDates(2, '2026-05-05', '2026-09-15')
  .filter((dateKey) => dateKey !== '2026-08-04')
  .slice(0, 10)
  .map((dateKey) => ({
    dateKey,
    period: ClassPeriod.AFTERNOON,
    startTime: '14:00',
    endTime: '15:30',
    durationMinutes: 90,
    expectedAmount: 97.5,
    attendance: isPastDate(dateKey)
      ? AttendanceStatus.ATTENDED
      : AttendanceStatus.EMPTY,
  }));

const DANIEL_CLASSES = buildRecurringClasses({
  weekday: 5,
  period: ClassPeriod.AFTERNOON,
  startTime: '19:00',
  endTime: '20:00',
  durationMinutes: 60,
  hourlyRate: 58,
  fromKey: '2026-05-02',
  toKey: '2026-11-14',
  attendanceForDate: (dateKey) => {
    if (DANIEL_ABSENCE_KEYS.includes(dateKey)) {
      return {
        attendance: AttendanceStatus.ABSENT,
        pendingMakeupMinutes: 60,
      };
    }

    if (isPastDate(dateKey)) {
      return { attendance: AttendanceStatus.ATTENDED };
    }

    return { attendance: AttendanceStatus.EMPTY };
  },
});

const ELOAH_MAKEUP_CLASS: SeedClass = {
  dateKey: '2026-07-02',
  period: ClassPeriod.AFTERNOON,
  startTime: '15:00',
  endTime: '16:30',
  durationMinutes: 90,
  expectedAmount: 75,
  attendance: AttendanceStatus.ATTENDED,
  isMakeupOnly: true,
  notes: `Reposição da falta de ${ELOAH_ABSENCE_KEYS[0].slice(8, 10)}/${ELOAH_ABSENCE_KEYS[0].slice(5, 7)}`,
};

const GAEL_MAKEUP_CLASS: SeedClass = {
  dateKey: '2026-08-04',
  period: ClassPeriod.AFTERNOON,
  startTime: '17:00',
  endTime: '18:00',
  durationMinutes: 60,
  expectedAmount: 55,
  attendance: AttendanceStatus.ATTENDED,
  isMakeupOnly: true,
  notes: `Reposição da falta de ${GAEL_ABSENCE_KEYS[0].slice(8, 10)}/${GAEL_ABSENCE_KEYS[0].slice(5, 7)}`,
};

const STUDENTS: SeedStudent[] = [
  {
    name: 'Bryan',
    guardianName: 'Responsável Bryan',
    phone: '11999001001',
    hourlyRate: 60,
    recurrences: [
      { weekday: 1, startTime: '08:00', endTime: '09:00' },
      { weekday: 3, startTime: '07:30', endTime: '08:30' },
    ],
    classes: [
      ...BRYAN_CLASSES,
      ...buildRecurringClasses({
        weekday: 3,
        period: ClassPeriod.MORNING,
        startTime: '07:30',
        endTime: '08:30',
        durationMinutes: 60,
        hourlyRate: 60,
        fromKey: '2026-06-04',
        toKey: '2026-09-10',
        attendanceForDate: (dateKey) => {
          if (isPastDate(dateKey)) {
            return { attendance: AttendanceStatus.ATTENDED };
          }

          return { attendance: AttendanceStatus.EMPTY };
        },
      }),
    ],
  },
  {
    name: 'Gael',
    guardianName: 'Responsável Gael',
    phone: '11999001002',
    hourlyRate: 55,
    advanceBalanceCash: 25,
    recurrences: [{ weekday: 3, startTime: '19:00', endTime: '20:00' }],
    classes: [...GAEL_CLASSES, GAEL_MAKEUP_CLASS],
  },
  {
    name: 'Eloah',
    guardianName: 'Responsável Eloah',
    phone: '11999001003',
    hourlyRate: 50,
    advanceBalancePix: 40,
    recurrences: [{ weekday: 4, startTime: '09:00', endTime: '10:30' }],
    classes: [...ELOAH_CLASSES, ELOAH_MAKEUP_CLASS],
  },
  {
    name: 'Aylon',
    guardianName: 'Responsável Aylon',
    phone: '11999001004',
    hourlyRate: 65,
    advanceBalancePix: 50,
    classes: AYLON_CLASSES,
  },
  {
    name: 'Daniel',
    guardianName: 'Responsável Daniel',
    phone: '11999001005',
    hourlyRate: 58,
    advanceBalanceCash: 15,
    recurrences: [{ weekday: 5, startTime: '19:00', endTime: '20:00' }],
    classes: DANIEL_CLASSES,
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

async function listPastClasses(
  studentId: string,
  filters: {
    startTime?: string;
    isMakeupOnly?: boolean;
  } = {},
) {
  return prisma.class.findMany({
    where: {
      studentId,
      date: { lt: dateFromDateKey(TODAY_KEY) },
      ...(filters.startTime ? { startTime: filters.startTime } : {}),
      ...(filters.isMakeupOnly !== undefined
        ? { isMakeupOnly: filters.isMakeupOnly }
        : {}),
    },
    orderBy: { date: 'asc' },
  });
}

async function seedFinancials(studentIds: Record<string, string>) {
  const Bryan = studentIds.Bryan;
  const Gael = studentIds.Gael;
  const Eloah = studentIds.Eloah;
  const Aylon = studentIds.Aylon;
  const Daniel = studentIds.Daniel;

  const bryanMondays = await listPastClasses(Bryan, { startTime: '08:00' });
  for (const [index, classItem] of bryanMondays.entries()) {
    if (classItem.attendance !== AttendanceStatus.ATTENDED) {
      continue;
    }

    const dateKey = classItem.date.toISOString().slice(0, 10);
    const amount = Number(classItem.expectedAmount);

    if (dateKey === bryanMondays.at(-1)?.date.toISOString().slice(0, 10)) {
      await payClass(Bryan, classItem.id, 30, PaymentMethod.PIX, dateKey);
      continue;
    }

    const method = index % 3 === 0 ? PaymentMethod.CASH : PaymentMethod.PIX;
    await payClass(Bryan, classItem.id, amount, method, dateKey);
  }

  const bryanWednesdays = await listPastClasses(Bryan, { startTime: '07:30' });
  for (const [index, classItem] of bryanWednesdays.entries()) {
    if (classItem.attendance !== AttendanceStatus.ATTENDED) {
      continue;
    }

    if (index >= bryanWednesdays.length - 2) {
      continue;
    }

    const dateKey = classItem.date.toISOString().slice(0, 10);
    await payClass(
      Bryan,
      classItem.id,
      Number(classItem.expectedAmount),
      PaymentMethod.PIX,
      dateKey,
    );
  }

  const gaelClasses = await listPastClasses(Gael);
  for (const [index, classItem] of gaelClasses.entries()) {
    if (classItem.attendance !== AttendanceStatus.ATTENDED) {
      continue;
    }

    if (!classItem.isMakeupOnly && index >= 6) {
      continue;
    }

    const dateKey = classItem.date.toISOString().slice(0, 10);
    const method = classItem.isMakeupOnly
      ? PaymentMethod.CASH
      : index % 2 === 0
        ? PaymentMethod.CASH
        : PaymentMethod.PIX;

    await payClass(
      Gael,
      classItem.id,
      Number(classItem.expectedAmount),
      method,
      dateKey,
    );
  }

  const eloahClasses = await listPastClasses(Eloah);
  for (const [index, classItem] of eloahClasses.entries()) {
    if (classItem.attendance !== AttendanceStatus.ATTENDED) {
      continue;
    }

    const dateKey = classItem.date.toISOString().slice(0, 10);
    const amount = Number(classItem.expectedAmount);
    const method = index % 4 === 2 ? PaymentMethod.CASH : PaymentMethod.PIX;

    if (
      !classItem.isMakeupOnly &&
      dateKey ===
        eloahClasses
          .filter((item) => !item.isMakeupOnly)
          .at(-1)
          ?.date.toISOString()
          .slice(0, 10)
    ) {
      await payClass(Eloah, classItem.id, amount, PaymentMethod.PIX, dateKey);
      await allocateClass(
        classItem.id,
        35,
        PaymentMethod.PIX,
        AllocationSource.ADVANCE_PIX,
      );
      continue;
    }

    await payClass(Eloah, classItem.id, amount, method, dateKey);
  }

  const aylonClasses = await listPastClasses(Aylon);
  for (const [index, classItem] of aylonClasses.entries()) {
    if (classItem.attendance !== AttendanceStatus.ATTENDED) {
      continue;
    }

    const dateKey = classItem.date.toISOString().slice(0, 10);
    const amount = Number(classItem.expectedAmount);

    if (index === 0 || index === 2) {
      await payClass(Aylon, classItem.id, amount, PaymentMethod.PIX, dateKey);
      continue;
    }

    if (index === 1) {
      await payClass(Aylon, classItem.id, 50, PaymentMethod.CASH, dateKey);
      continue;
    }

    if (index === 3) {
      await allocateClass(
        classItem.id,
        60,
        PaymentMethod.PIX,
        AllocationSource.ADVANCE_PIX,
      );
      continue;
    }

    if (index === 4) {
      await allocateClass(
        classItem.id,
        amount,
        PaymentMethod.PIX,
        AllocationSource.ADVANCE_PIX,
      );
      continue;
    }

    if (index === 5) {
      await payClass(Aylon, classItem.id, 40, PaymentMethod.CASH, dateKey);
    }
  }

  const danielClasses = await listPastClasses(Daniel);
  for (const [index, classItem] of danielClasses.entries()) {
    if (classItem.attendance !== AttendanceStatus.ATTENDED) {
      continue;
    }

    const dateKey = classItem.date.toISOString().slice(0, 10);
    const amount = Number(classItem.expectedAmount);

    if (index <= 1) {
      await payClass(
        Daniel,
        classItem.id,
        amount,
        index === 0 ? PaymentMethod.CASH : PaymentMethod.PIX,
        dateKey,
      );
      continue;
    }

    if (index === 4) {
      await payClass(Daniel, classItem.id, amount, PaymentMethod.PIX, dateKey);
      continue;
    }

    if (index === 5) {
      await allocateClass(
        classItem.id,
        amount,
        PaymentMethod.CASH,
        AllocationSource.ADVANCE_CASH,
      );
      continue;
    }

    if (index === 7) {
      await payClass(Daniel, classItem.id, 30, PaymentMethod.CASH, dateKey);
    }
  }

  const eloahJuneAbsence = await prisma.class.findFirst({
    where: {
      studentId: Eloah,
      date: dateFromDateKey(ELOAH_ABSENCE_KEYS[0]),
    },
  });
  const eloahJulyMakeup = await prisma.class.findFirst({
    where: {
      studentId: Eloah,
      date: dateFromDateKey('2026-07-02'),
      isMakeupOnly: true,
    },
  });

  if (eloahJuneAbsence && eloahJulyMakeup) {
    await prisma.makeupLink.create({
      data: {
        absenceClassId: eloahJuneAbsence.id,
        makeupClassId: eloahJulyMakeup.id,
        coveredMinutes: 90,
      },
    });

    await prisma.class.update({
      where: { id: eloahJuneAbsence.id },
      data: { pendingMakeupMinutes: 0 },
    });
  }

  const gaelJuneAbsence = await prisma.class.findFirst({
    where: {
      studentId: Gael,
      date: dateFromDateKey(GAEL_ABSENCE_KEYS[0]),
    },
  });
  const gaelAugustMakeup = await prisma.class.findFirst({
    where: {
      studentId: Gael,
      date: dateFromDateKey('2026-08-04'),
      isMakeupOnly: true,
    },
  });

  if (gaelJuneAbsence && gaelAugustMakeup) {
    await prisma.makeupLink.create({
      data: {
        absenceClassId: gaelJuneAbsence.id,
        makeupClassId: gaelAugustMakeup.id,
        coveredMinutes: 60,
      },
    });

    await prisma.class.update({
      where: { id: gaelJuneAbsence.id },
      data: { pendingMakeupMinutes: 0 },
    });
  }

  await prisma.student.update({
    where: { id: Aylon },
    data: { advanceBalancePix: 12.5 },
  });

  await prisma.student.update({
    where: { id: Eloah },
    data: { advanceBalancePix: 5 },
  });
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
  const makeupLinkCount = await prisma.makeupLink.count();

  console.log('Seed completed:', {
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
