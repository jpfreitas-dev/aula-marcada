import { AttendanceStatus, Prisma } from '../../generated/prisma/client';
import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import { recurrenceAvailabilityService } from '@/services/recurrence-availability-service';
import {
  buildGeneratedClassData,
  createDefaultRecurrenceRow,
  getClassStartTimestamp,
  getNextClassAt,
  mapStudentBalances,
  mapStudentRecurrence,
  sessionMatchesAnyRecurrence,
  WEEKDAY_LABELS,
} from '@/services/recurrence-scheduler';
import type {
  CreateStudentInput,
  CreateStudentRecurrenceInput,
  RecurrenceOptionsInput,
  RecurrenceOptionsResponse,
  StudentListFilter,
  StudentResponse,
  StudentRecurrenceResponse,
  UpdateStudentPersonalInput,
  UpdateStudentSettingsInput,
} from '@/types/student';
import {
  calculateExpectedAmount,
  calculateStudentPendingSummary,
} from '@/utils/class-value';
import { isValidPhone } from '@/utils/phone';
import { decimalToNumber, roundMoney } from '@/utils/money';
import { resolveStudentFinancialStatus } from '@/utils/student-financial';
import { getDefaultAgendaDate, toDateKey } from '@/utils/workday';

function normalizeStudentName(name: string): string {
  return name.trim().toLocaleLowerCase('pt-BR');
}

function dateKeyFromDatabase(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function getClassPaidAmounts(
  classIds: string[],
): Promise<Map<string, number>> {
  if (classIds.length === 0) {
    return new Map();
  }

  const allocations = await prisma.classAllocation.groupBy({
    by: ['classId'],
    where: { classId: { in: classIds } },
    _sum: { amount: true },
  });

  return new Map(
    allocations.map((item) => [
      item.classId,
      roundMoney(Number(item._sum.amount?.toString() ?? '0')),
    ]),
  );
}

async function buildStudentResponse(student: {
  id: string;
  name: string;
  guardianName: string;
  phone: string;
  hourlyRate: Prisma.Decimal;
  advanceBalancePix: Prisma.Decimal;
  advanceBalanceCash: Prisma.Decimal;
  active: boolean;
}): Promise<StudentResponse> {
  const balances = mapStudentBalances(student);
  const classes = await prisma.class.findMany({
    where: { studentId: student.id },
    select: {
      id: true,
      date: true,
      startTime: true,
      attendance: true,
      expectedAmount: true,
    },
  });

  const paidAmounts = await getClassPaidAmounts(classes.map((item) => item.id));
  const classSummaries = classes.map((session) => ({
    attendance:
      session.attendance === AttendanceStatus.ATTENDED ? 'attended' : 'other',
    expectedAmount: decimalToNumber(session.expectedAmount),
    paidAmount: paidAmounts.get(session.id) ?? 0,
  }));

  const pending = calculateStudentPendingSummary(classSummaries);
  const futureClasses = classes.map((session) => ({
    date: session.date,
    startTime: session.startTime,
  }));

  return {
    id: student.id,
    name: student.name,
    guardianName: student.guardianName,
    phone: student.phone,
    hourlyRate: balances.hourlyRate,
    advanceBalancePix: balances.advanceBalancePix,
    advanceBalanceCash: balances.advanceBalanceCash,
    nextClassAt: getNextClassAt(futureClasses),
    financialStatus: resolveStudentFinancialStatus(balances, pending),
    active: student.active,
  };
}

async function validateDuplicateStudent(
  name: string,
  excludeStudentId?: string,
): Promise<void> {
  const normalizedName = normalizeStudentName(name);

  const allStudents = await prisma.student.findMany({
    where: excludeStudentId ? { id: { not: excludeStudentId } } : undefined,
    select: { name: true },
  });

  const hasDuplicate = allStudents.some(
    (item) => normalizeStudentName(item.name) === normalizedName,
  );

  if (hasDuplicate) {
    throw new AppError('Já existe um aluno com esse nome.');
  }
}

async function generateClassesForRecurrences(
  studentId: string,
  hourlyRate: number,
  recurrences: CreateStudentRecurrenceInput[],
): Promise<void> {
  const occupied = await recurrenceAvailabilityService.getAllOccupiedSlots();
  const toCreate: Prisma.ClassCreateManyInput[] = [];

  for (const recurrence of recurrences) {
    const generated = buildGeneratedClassData(
      studentId,
      hourlyRate,
      recurrence,
      occupied,
    );
    toCreate.push(
      ...generated.map((item) => ({
        ...item,
        expectedAmount: item.expectedAmount,
      })),
    );
  }

  if (toCreate.length > 0) {
    await prisma.class.createMany({ data: toCreate });
  }
}

async function syncAgendaAfterSettingsChange(
  studentId: string,
  hourlyRate: number,
  oldRecurrences: CreateStudentRecurrenceInput[],
  newRecurrences: CreateStudentRecurrenceInput[],
): Promise<void> {
  const cutoff = toDateKey(getDefaultAgendaDate());
  const filledNewRecurrences = newRecurrences.filter(
    (recurrence) => recurrence.startTime && recurrence.endTime,
  );

  const studentClasses = await prisma.class.findMany({
    where: { studentId },
  });

  const idsToDelete: string[] = [];
  const idsToUpdateExpected: string[] = [];

  for (const session of studentClasses) {
    const dateKey = dateKeyFromDatabase(session.date);
    const isPast = dateKey < cutoff;
    const isFilled = session.attendance !== AttendanceStatus.EMPTY;

    if (isPast || isFilled) {
      continue;
    }

    const matchedOld = sessionMatchesAnyRecurrence(session, oldRecurrences);
    const matchedNew = sessionMatchesAnyRecurrence(
      session,
      filledNewRecurrences,
    );

    if (matchedOld && !matchedNew) {
      idsToDelete.push(session.id);
      continue;
    }

    if (!session.hasManualAmountOverride) {
      idsToUpdateExpected.push(session.id);
    }
  }

  if (idsToDelete.length > 0) {
    await prisma.class.deleteMany({ where: { id: { in: idsToDelete } } });
  }

  for (const session of studentClasses) {
    if (!idsToUpdateExpected.includes(session.id)) {
      continue;
    }

    const nextExpected = calculateExpectedAmount(
      session.durationMinutes,
      hourlyRate,
    );

    await prisma.class.update({
      where: { id: session.id },
      data: { expectedAmount: nextExpected },
    });
  }

  await generateClassesForRecurrences(
    studentId,
    hourlyRate,
    filledNewRecurrences,
  );
}

class StudentService {
  async list(
    filter: StudentListFilter,
    search?: string,
  ): Promise<StudentResponse[]> {
    const students = await prisma.student.findMany({
      where: {
        active: filter === 'active',
        ...(search
          ? {
              name: {
                contains: search.trim(),
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      students.map((student) => buildStudentResponse(student)),
    );
  }

  async show(id: string): Promise<StudentResponse> {
    const student = await prisma.student.findUnique({ where: { id } });

    if (!student) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    return buildStudentResponse(student);
  }

  async create(input: CreateStudentInput): Promise<StudentResponse> {
    const name = input.name.trim();
    const guardianName = input.guardianName.trim();
    const phone = input.phone.trim();

    if (!name) {
      throw new AppError('Informe o nome do aluno.');
    }

    if (!guardianName) {
      throw new AppError('Informe o nome do responsável.');
    }

    if (!isValidPhone(phone)) {
      throw new AppError('Informe um telefone válido.');
    }

    if (input.hourlyRate <= 0) {
      throw new AppError('Informe o valor por hora.');
    }

    await validateDuplicateStudent(name);

    const recurrences = input.recurrences ?? [];
    await recurrenceAvailabilityService.validateRecurrences(name, recurrences);

    const student = await prisma.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: {
          name,
          guardianName,
          phone,
          hourlyRate: input.hourlyRate,
        },
      });

      const filledRecurrences = recurrences.filter(
        (recurrence) => recurrence.startTime && recurrence.endTime,
      );

      if (filledRecurrences.length > 0) {
        await tx.studentRecurrence.createMany({
          data: filledRecurrences.map((recurrence) => ({
            studentId: created.id,
            weekday: recurrence.weekday,
            startTime: recurrence.startTime,
            endTime: recurrence.endTime,
          })),
        });
      }

      const occupied =
        await recurrenceAvailabilityService.getAllOccupiedSlots();
      const classesToCreate: Prisma.ClassCreateManyInput[] = [];

      for (const recurrence of filledRecurrences) {
        classesToCreate.push(
          ...buildGeneratedClassData(
            created.id,
            input.hourlyRate,
            recurrence,
            occupied,
          ),
        );
      }

      if (classesToCreate.length > 0) {
        await tx.class.createMany({ data: classesToCreate });
      }

      return created;
    });

    return buildStudentResponse(student);
  }

  async updatePersonal(
    studentId: string,
    input: UpdateStudentPersonalInput,
  ): Promise<StudentResponse> {
    const existing = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    const name = input.name.trim();
    const guardianName = input.guardianName.trim();
    const phone = input.phone.trim();

    if (!name) {
      throw new AppError('Informe o nome do aluno.');
    }

    if (!guardianName) {
      throw new AppError('Informe o nome do responsável.');
    }

    if (!isValidPhone(phone)) {
      throw new AppError('Informe um telefone válido.');
    }

    await validateDuplicateStudent(name, studentId);

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { name, guardianName, phone },
    });

    return buildStudentResponse(updated);
  }

  async updateSettings(
    studentId: string,
    input: UpdateStudentSettingsInput,
  ): Promise<StudentResponse> {
    const existing = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    if (!existing.active) {
      throw new AppError(
        'Não é possível alterar configurações de aluno desativado.',
      );
    }

    if (input.hourlyRate <= 0) {
      throw new AppError('Informe o valor por hora.');
    }

    await recurrenceAvailabilityService.validateRecurrences(
      existing.name,
      input.recurrences,
      studentId,
    );

    const oldRecurrences = await prisma.studentRecurrence.findMany({
      where: { studentId },
    });

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId },
        data: { hourlyRate: input.hourlyRate },
      });

      await tx.studentRecurrence.deleteMany({ where: { studentId } });

      const filledRecurrences = input.recurrences.filter(
        (recurrence) => recurrence.startTime && recurrence.endTime,
      );

      if (filledRecurrences.length > 0) {
        await tx.studentRecurrence.createMany({
          data: filledRecurrences.map((recurrence) => ({
            studentId,
            weekday: recurrence.weekday,
            startTime: recurrence.startTime,
            endTime: recurrence.endTime,
          })),
        });
      }
    });

    await syncAgendaAfterSettingsChange(
      studentId,
      input.hourlyRate,
      oldRecurrences.map((item) => ({
        weekday: item.weekday as CreateStudentRecurrenceInput['weekday'],
        startTime: item.startTime,
        endTime: item.endTime,
      })),
      input.recurrences,
    );

    const updated = await prisma.student.findUniqueOrThrow({
      where: { id: studentId },
    });

    return buildStudentResponse(updated);
  }

  async deactivate(studentId: string): Promise<StudentResponse> {
    const existing = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    if (!existing.active) {
      throw new AppError('Este aluno já está desativado.');
    }

    const now = Date.now();
    const classes = await prisma.class.findMany({ where: { studentId } });
    const futureClassIds = classes
      .filter(
        (session) =>
          getClassStartTimestamp(session.date, session.startTime) > now,
      )
      .map((session) => session.id);

    await prisma.$transaction(async (tx) => {
      if (futureClassIds.length > 0) {
        await tx.class.deleteMany({ where: { id: { in: futureClassIds } } });
      }

      await tx.studentRecurrence.deleteMany({ where: { studentId } });
      await tx.student.update({
        where: { id: studentId },
        data: { active: false },
      });
    });

    const updated = await prisma.student.findUniqueOrThrow({
      where: { id: studentId },
    });

    return buildStudentResponse(updated);
  }

  async reactivate(studentId: string): Promise<StudentResponse> {
    const existing = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    if (existing.active) {
      throw new AppError('Este aluno já está ativo.');
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { active: true },
    });

    return buildStudentResponse(updated);
  }

  async listRecurrences(
    studentId: string,
  ): Promise<StudentRecurrenceResponse[]> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    const recurrences = await prisma.studentRecurrence.findMany({
      where: { studentId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });

    return recurrences.map((item) => ({
      ...mapStudentRecurrence(item),
      weekday: item.weekday as StudentRecurrenceResponse['weekday'],
    }));
  }

  async getRecurrenceOptions(
    input: RecurrenceOptionsInput,
  ): Promise<RecurrenceOptionsResponse> {
    const options = await recurrenceAvailabilityService.getRecurrenceOptions(
      input.draftRecurrences,
      input.studentId,
      input.currentWeekday,
    );

    const defaultRow = options.hasAvailableWeekdays
      ? createDefaultRecurrenceRow(input.draftRecurrences, {
          getFirstAvailableWeekday: options.getFirstAvailableWeekday,
          getFirstAvailablePeriod: options.getFirstAvailablePeriod,
        })
      : null;

    return {
      allWeekdays: options.allWeekdays.map((item) => ({
        value:
          item.value as RecurrenceOptionsResponse['allWeekdays'][number]['value'],
        label: item.label,
      })),
      weekdayOptions: options.weekdayOptions.map((item) => ({
        value:
          item.value as RecurrenceOptionsResponse['weekdayOptions'][number]['value'],
        label: item.label,
      })),
      defaultRow,
      hasAvailableWeekdays: options.hasAvailableWeekdays,
    };
  }

  formatRecurrenceLabel(recurrence: StudentRecurrenceResponse): string {
    return `${WEEKDAY_LABELS[recurrence.weekday]}, ${recurrence.startTime} - ${recurrence.endTime}`;
  }
}

export const studentService = new StudentService();
