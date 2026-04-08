import { expect, test } from "@playwright/test"

test("sale intake tokens render the sale questionnaire copy", async ({ page }) => {
  await page.goto("/intake/87cb75ad-a9c7-4bd2-b4af-b0c5dcb63af1")

  await expect(
    page.getByRole("heading", { name: /a quick step before your first showing/i })
  ).toBeVisible()
  await expect(page.getByText(/prepared for sofia chen/i)).toBeVisible()
})

test("rental intake tokens render the rental questionnaire copy", async ({
  page
}) => {
  await page.goto("/intake/4cbca64a-4699-4cb4-81fd-d0ea6fcb8748")

  await expect(
    page.getByRole("heading", { name: /a quick step before your rental tour/i })
  ).toBeVisible()
  await expect(page.getByText(/prepared for marcus hall/i)).toBeVisible()
})
