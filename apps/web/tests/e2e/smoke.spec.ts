import { expect, test } from "@playwright/test";

test("landing page renders and demo login reaches the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /decide who is ready for a showing/i })).toBeVisible();

  await page.getByRole("link", { name: /sign in/i }).click();
  await page.getByLabel("Email").fill("demo@showready.local");
  await page.getByLabel("Password").fill("demo12345");
  await page.getByRole("button", { name: /^sign in$/i }).click();

  await expect(page.getByRole("heading", { name: /good morning/i })).toBeVisible();
  await expect(page.getByText(/recent leads/i)).toBeVisible();
});
