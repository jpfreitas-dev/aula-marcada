import type { Prisma, Student } from '../../generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { DatabaseClient } from '@/repositories/types';
import type { StudentListFilter } from '@/types/student';

function client(db?: DatabaseClient): DatabaseClient {
  return db ?? prisma;
}

class StudentRepository {
  async findById(id: string, db?: DatabaseClient): Promise<Student | null> {
    return client(db).student.findUnique({ where: { id } });
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
}

export const studentRepository = new StudentRepository();
