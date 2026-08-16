import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.spec.ts'],
    setupFiles: ['./src/tests/setup.ts'],
    fileParallelism: false,
    env: {
      DATABASE_URL: 'postgresql://app:app@localhost:5432/app_test',
      DATABASE_URL_TEST: 'postgresql://app:app@localhost:5432/app_test',
      JWT_SECRET: 'test-jwt-secret',
      AUTH_EMAIL: 'test@example.com',
      AUTH_PASSWORD: 'test-password',
      FRONTEND_URL: 'http://localhost:5173',
      LOGIN_RATE_LIMIT_MAX: '5',
      LOGIN_RATE_LIMIT_WINDOW_MS: '900000',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
