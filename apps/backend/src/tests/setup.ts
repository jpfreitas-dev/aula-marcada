import 'dotenv/config';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.AUTH_EMAIL = process.env.AUTH_EMAIL ?? 'test@example.com';
process.env.AUTH_PASSWORD = process.env.AUTH_PASSWORD ?? 'test-password';
process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
process.env.LOGIN_RATE_LIMIT_MAX = process.env.LOGIN_RATE_LIMIT_MAX ?? '1000';
process.env.LOGIN_RATE_LIMIT_WINDOW_MS =
  process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? '900000';

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

import request from 'supertest';

import { app } from '@/app';
import { getTestPrismaClient, resetDatabase } from './helpers/db';
import { setAuthToken } from './helpers/auth-token';

const prisma = getTestPrismaClient();
const testEmail = process.env.AUTH_EMAIL ?? 'test@example.com';
const testPassword = process.env.AUTH_PASSWORD ?? 'test-password';

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await resetDatabase(prisma);

  const loginResponse = await request(app)
    .post('/auth/login')
    .send({ email: testEmail, password: testPassword });

  if (loginResponse.status !== 200 || !loginResponse.body.token) {
    throw new Error(
      `Test login failed with status ${loginResponse.status}: ${JSON.stringify(loginResponse.body)}`,
    );
  }

  setAuthToken(loginResponse.body.token);
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
