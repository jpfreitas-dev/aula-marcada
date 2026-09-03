import { test, expect } from '@playwright/test';

import { loginThroughUi } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (
      window as Window & { __dispatchInstallPrompt?: () => void }
    ).__dispatchInstallPrompt = () => {
      const installEvent = Object.assign(
        new Event('beforeinstallprompt', { cancelable: true }),
        {
          prompt: async () => {},
          userChoice: Promise.resolve({
            outcome: 'dismissed',
            platform: 'web',
          }),
        },
      );

      window.dispatchEvent(installEvent);
    };
  });

  await loginThroughUi(page);
});

test('more page always shows install app card', async ({ page }) => {
  await page.getByRole('link', { name: 'Mais' }).click();

  await expect(
    page.getByRole('heading', { name: 'Instalar aplicativo' }),
  ).toBeVisible();
});

test('more page shows install button when install prompt is available', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Mais' }).click();
  await page.evaluate(() => window.__dispatchInstallPrompt?.());

  await expect(
    page.getByRole('heading', { name: 'Instalar aplicativo' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Instalar' })).toBeVisible();
});

test('more page shows browser fallback when install prompt is unavailable', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Mais' }).click();

  await expect(page.getByText(/menu do navegador/i)).toBeVisible();
});
