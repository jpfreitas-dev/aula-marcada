import type { Prisma } from '../../generated/prisma/client';
import type { prisma } from '@/lib/prisma';

export type DatabaseClient = Prisma.TransactionClient | typeof prisma;
