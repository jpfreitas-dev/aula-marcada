import { test, expect } from '@playwright/test';

test('home page shows agenda shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'AULAS DE REFORÇO' }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Navegação principal' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dia' })).toBeVisible();
  await expect(page.getByText('MANHÃ')).toBeVisible();
});

test('bottom navigation routes between main screens', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Alunos' }).click();
  await expect(page.getByPlaceholder('Buscar aluno...')).toBeVisible();

  await page.getByRole('link', { name: 'Financeiro' }).click();
  await expect(page.getByRole('button', { name: 'Semana' })).toBeVisible();

  await page.getByRole('link', { name: 'Mais' }).click();
  await expect(page.getByRole('heading', { name: 'Mais' })).toBeVisible();

  await page.getByRole('link', { name: 'Início' }).click();
  await expect(page.getByRole('button', { name: 'Dia' })).toBeVisible();
});
