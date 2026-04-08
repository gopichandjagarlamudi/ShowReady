import { expect, test } from "@playwright/test"

test("auth forms preserve the Vercel share token through the signup error redirect", async ({
  page
}) => {
  await page.goto("/register?_vercel_share=test-share")

  await expect(page.getByRole("link", { name: /sign in/i })).toHaveAttribute(
    "href",
    "/login?_vercel_share=test-share"
  )

  const forms = page.locator("form")
  await expect(forms.nth(0)).toHaveAttribute(
    "action",
    "/auth/register?_vercel_share=test-share"
  )
  await expect(forms.nth(0)).toHaveAttribute("method", "post")
  await expect(forms.nth(1)).toHaveAttribute(
    "action",
    "/auth/google?_vercel_share=test-share"
  )

  await page.getByLabel("Full name").fill("Share Token User")
  await page.getByLabel("Work email").fill("share-token-e2e@gmail.com")
  await page.getByLabel("Password").fill("secret1234")
  await page.getByRole("button", { name: /create account/i }).click()

  await expect(page).toHaveURL(/_vercel_share=test-share/)
  await expect(
    page.getByText(/email signups are temporarily rate-limited/i)
  ).toBeVisible()
})
