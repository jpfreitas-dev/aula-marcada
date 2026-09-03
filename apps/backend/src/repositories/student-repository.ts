import type { Prisma, Student } from '../../generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { DatabaseClient } from '@/repositories/types';
import type { StudentListFilter } from '@/types/student';

function client(db?: DatabaseClient): DatabaseClient {
  return db ?? prisma;
}

class StudentRepository {
  async findAllActiveWithRecurrences(db?: DatabaseClient) {
    return client(db).student.findMany({
      where: {
        active: true,
        recurrences: { some: {} },
      },
      include: {
        recurrences: {
          orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, db?: DatabaseClient): Promise<Student | null> {
    return client(db).student.findUnique({ where: { id } });
  }

  async findActiveById(
    id: string,
    db?: DatabaseClient,
  ): Promise<Student | null> {
    return client(db).student.findFirst({
      where: { id, active: true },
    });
  }

  async findByIdOrThrow(id: string, db?: DatabaseClient): Promise<Student> {
    return client(db).student.findUniqueOrThrow({ where: { id } });
  }

  async findManyNames(excludeStudentId?: string, db?: DatabaseClient) {
    return client(db).student.findMany({
      where: excludeStudentId ? { id: { not: excludeStudentId } } : undefined,
      select: { name: true },
    });
  }

  async list(filter: StudentListFilter, search?: string, db?: DatabaseClient) {
    return client(db).student.findMany({
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
  }

  async create(
    data: Prisma.StudentCreateInput,
    db?: DatabaseClient,
  ): Promise<Student> {
    return client(db).student.create({ data });
  }

  async update(
    id: string,
    data: Prisma.StudentUpdateInput,
    db?: DatabaseClient,
  ): Promise<Student> {
    return client(db).student.update({ where: { id }, data });
  }

  async restoreAdvanceBalance(
    id: string,
    advancePix: number,
    advanceCash: number,
    db?: DatabaseClient,
  ): Promise<Student> {
    const student = await this.findByIdOrThrow(id, db);

    return client(db).student.update({
      where: { id },
      data: {
        advanceBalancePix:
          Number(student.advanceBalancePix.toString()) + advancePix,
        advanceBalanceCash:
          Number(student.advanceBalanceCash.toString()) + advanceCash,
      },
    });
  }

  async delete(id: string, db?: DatabaseClient) {
    await client(db).student.delete({ where: { id } });
  }

  async updateAdvanceBalances(
    id: string,
    advanceBalancePix: number,
    advanceBalanceCash: number,
    db?: DatabaseClient,
  ): Promise<Student> {
    return client(db).student.update({
      where: { id },
      data: {
        advanceBalancePix,
        advanceBalanceCash,
      },
    });
  }
}

export const studentRepository = new StudentRepository();
