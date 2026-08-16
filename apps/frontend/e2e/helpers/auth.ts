import { expect, type Page } from '@playwright/test';

const E2E_AUTH_EMAIL = process.env.E2E_AUTH_EMAIL ?? 'e2e@example.com';
const E2E_AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD ?? 'e2e-password';

export async function loginThroughUi(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(E2E_AUTH_EMAIL);
  await page.getByLabel('Senha').fill(E2E_AUTH_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(
    page.getByRole('heading', { name: 'AULA MARCADA' }),
  ).toBeVisible();
}
