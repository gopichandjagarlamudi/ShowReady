import { expect, test } from "@playwright/test";

test("landing page renders with the streamlined marketing structure", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /know who is ready before you book the showing/i })
  ).toBeVisible();
  await expect(
    page.getByText(/showready gives every inquiry a branded intake, a clear readiness score/i)
  ).toBeVisible();
  await expect(page.getByText(/smart buyer pre-qualification for busy agents/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /use demo account/i })).toHaveCount(0);
  await expect(page.getByText(/2 min intake/i)).toHaveCount(0);
  await expect(page.getByText(/trust the recommendation/i)).toHaveCount(0);
  await expect(page.getByText(/private agent workspace/i)).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("button", { name: /create your workspace/i }).first()
  ).toBeVisible();

  await page.getByRole("link", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /sign in to showready/i })).toBeVisible();
});
