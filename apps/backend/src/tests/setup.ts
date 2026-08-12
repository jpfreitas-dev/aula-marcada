import 'dotenv/config';

import { getTestPrismaClient, resetDatabase } from './helpers/db';

const prisma = getTestPrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await resetDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
