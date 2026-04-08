import { expect, test } from "@playwright/test"

test("auth pages use concise copy and parallel signup methods", async ({ page }) => {
  await page.goto("/register")

  await expect(
    page.getByRole("heading", { name: "Create your ShowReady account" })
  ).toBeVisible()
  await expect(
    page.getByText("Create your workspace", { exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByText(/start qualifying buyers with more confidence/i)
  ).toHaveCount(0)
  await expect(
    page.getByText(/use your email or google to get started/i)
  ).toBeVisible()

  const forms = page.locator("form")
  await expect(forms.nth(0)).toHaveAttribute("action", "/auth/google")
  await expect(forms.nth(1)).toHaveAttribute("action", "/auth/register")
  await expect(
    page.getByRole("button", { name: "Continue with Google" })
  ).toBeVisible()
  await expect(page.getByText("Or continue with email")).toBeVisible()
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible()

  await page.goto("/login")

  await expect(
    page.getByRole("heading", { name: "Sign in to ShowReady" })
  ).toBeVisible()
  await expect(page.getByText(/back to your lead desk/i)).toHaveCount(0)
  await expect(
    page.getByText(/use your email or google to continue/i)
  ).toBeVisible()
  await expect(
    page.getByText(/demo access:/i)
  ).toBeVisible()
  await expect(page.getByText("Or continue with email")).toBeVisible()
})

test("register page turns auth rate-limit errors into actionable guidance", async ({
  page
}) => {
  await page.goto("/register?error=email%20rate%20limit%20exceeded")

  await expect(
    page.getByText(/email signups are temporarily rate-limited/i)
  ).toBeVisible()
  await expect(
    page.getByText(/continue with google or try again in a few minutes/i)
  ).toBeVisible()
  await expect(page.getByText(/email rate limit exceeded/i)).toHaveCount(0)
})
