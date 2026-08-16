import { defineConfig, devices } from '@playwright/test';

const e2eAuthEmail = process.env.E2E_AUTH_EMAIL ?? 'e2e@example.com';
const e2eAuthPassword = process.env.E2E_AUTH_PASSWORD ?? 'e2e-password';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev --workspace @aula-marcada/backend',
      url: 'http://localhost:3333/health',
      reuseExistingServer: !process.env.CI,
      env: {
        JWT_SECRET: 'e2e-jwt-secret',
        AUTH_EMAIL: e2eAuthEmail,
        AUTH_PASSWORD: e2eAuthPassword,
        FRONTEND_URL: 'http://localhost:5173',
        DATABASE_URL:
          process.env.DATABASE_URL ?? 'postgresql://app:app@localhost:5432/app',
      },
    },
    {
      command: 'npm run dev --workspace @aula-marcada/frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: 'http://localhost:3333',
      },
    },
  ],
});
