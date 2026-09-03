import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';

function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getTestPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL_TEST;

  if (!connectionString) {
    throw new Error('DATABASE_URL_TEST is not defined');
  }

  return createPrismaClient(connectionString);
}

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.classAllocation.deleteMany();
  await prisma.makeupLink.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.studentRecurrence.deleteMany();
  await prisma.student.deleteMany();
}
