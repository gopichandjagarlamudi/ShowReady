import { expect, test } from "@playwright/test"

async function completeContactStep(
  page: any,
  fullName: string,
  email: string
) {
  await page.getByRole("button", { name: "Start" }).click()
  await page.getByPlaceholder("Full name").fill(fullName)
  await page.getByPlaceholder("Email address").fill(email)
  await page.getByRole("button", { name: "Continue" }).click()
}

test("buyer invite flow reaches the completion page", async ({ page }) => {
  await page.goto("/intake/37d16df0-9200-46be-9f51-cf9213d61b23")

  await expect(page.getByRole("heading", { name: /this takes about 1 minute/i })).toBeVisible()
  await completeContactStep(page, "Buyer Flow", "buyer.flow@example.com")

  await page.getByRole("button", { name: /buying a property/i }).click()
  await expect(
    page.getByRole("heading", {
      name: /buy for yourself or as an investment/i
    })
  ).toBeVisible()
  await page.getByRole("button", { name: "Myself" }).click()
  await expect(page.getByRole("heading", { name: /hoping to move or buy/i })).toBeVisible()
  await page.getByRole("button", { name: "Within 1 month" }).click()
  await expect(page.getByRole("heading", { name: /know your budget range/i })).toBeVisible()
  await page.getByRole("button", { name: "I have a rough idea" }).click()
  await expect(page.getByRole("heading", { name: /pre-approved for a mortgage/i })).toBeVisible()
  await page.getByRole("button", { name: "Not yet" }).click()
  await expect(page.getByRole("heading", { name: /neighborhoods are you interested/i })).toBeVisible()
  await page.getByPlaceholder(/Neighborhoods, areas, or cities/i).fill("Riverdale")
  await page.getByRole("button", { name: "Continue" }).click()
  await expect(page.getByRole("heading", { name: /type of property/i })).toBeVisible()
  await page.getByRole("button", { name: "Condo" }).click()

  await page.getByRole("button", { name: "Skip" }).click()
  await page.getByRole("button", { name: "Skip" }).click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByRole("button", { name: "No" }).click()
  await page.getByRole("button", { name: "Skip" }).click()
  await page.getByRole("button", { name: "Submit" }).click()

  await expect(page).toHaveURL(/\/complete$/)
  await expect(page.getByText(/your agent has what they need/i)).toBeVisible()
})

test("rental invite flow reaches the completion page", async ({ page }) => {
  await page.goto("/intake/d4487e1f-498c-4f2c-99fd-3b63e723f364")

  await expect(page.getByRole("heading", { name: /this takes about 1 minute/i })).toBeVisible()
  await completeContactStep(page, "Rental Flow", "rental.flow@example.com")

  await page.getByRole("button", { name: /^Renting$/i }).click()
  await expect(page.getByRole("heading", { name: /need to move/i })).toBeVisible()
  await page.getByRole("button", { name: "Within 1 month" }).click()
  await expect(page.getByRole("heading", { name: /monthly rent range/i })).toBeVisible()
  await page.getByPlaceholder(/\$2,000–\$2,500\/mo/i).fill("$2,200/mo")
  await page.getByRole("button", { name: "Continue" }).click()
  await expect(page.getByRole("heading", { name: /area or neighborhoods/i })).toBeVisible()
  await page.getByPlaceholder(/Neighborhoods, areas, or cities/i).fill("North York")
  await page.getByRole("button", { name: "Continue" }).click()
  await expect(page.getByRole("heading", { name: /type of place/i })).toBeVisible()
  await page.getByRole("button", { name: "Apartment" }).click()
  await expect(page.getByRole("heading", { name: /bedrooms do you need/i })).toBeVisible()
  await page.getByPlaceholder(/For example: 2/i).fill("2")
  await page.getByRole("button", { name: "Continue" }).click()
  await expect(page.getByRole("heading", { name: /have any pets/i })).toBeVisible()
  await page.getByRole("button", { name: "No" }).click()
  await expect(page.getByRole("heading", { name: /how many people/i })).toBeVisible()
  await page.getByPlaceholder(/For example: 2/i).fill("2")
  await page.getByRole("button", { name: "Continue" }).click()

  await page.getByRole("button", { name: "Yes" }).click()
  await page.getByRole("button", { name: "Skip" }).click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByRole("button", { name: "Yes" }).click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByRole("button", { name: "Submit" }).click()

  await expect(page).toHaveURL(/\/complete$/)
  await expect(page.getByText(/your agent has what they need/i)).toBeVisible()
})
