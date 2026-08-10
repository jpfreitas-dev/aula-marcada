import { test, expect } from "@playwright/test";

test("home page shows agenda shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }),
  ).toBeVisible();
});
