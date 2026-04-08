import { describe, expect, it } from "vitest"
import {
  buildAuthActionPath,
  buildAuthCallbackUrl,
  buildAuthRedirectPath,
  sanitizeAuthNextPath
} from "./auth-url"

describe("auth-url helpers", () => {
  it("preserves the Vercel share token on auth form actions", () => {
    expect(buildAuthActionPath("/auth/register", "share-token")).toBe(
      "/auth/register?_vercel_share=share-token"
    )
  })

  it("preserves the share token on callback URLs", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://preview.showready.test"

    expect(buildAuthCallbackUrl("share-token")).toBe(
      "https://preview.showready.test/auth/callback?_vercel_share=share-token"
    )
  })

  it("preserves the share token when redirecting back with an error", () => {
    expect(
      buildAuthRedirectPath("/register", {
        vercelShareToken: "share-token",
        error: "email rate limit exceeded"
      })
    ).toBe(
      "/register?_vercel_share=share-token&error=email+rate+limit+exceeded"
    )
  })

  it("allows safe internal next paths", () => {
    expect(sanitizeAuthNextPath("/settings?onboarding=1")).toBe(
      "/settings?onboarding=1"
    )
  })

  it("rejects external next paths", () => {
    expect(sanitizeAuthNextPath("https://evil.example/phish")).toBe("/dashboard")
  })

  it("rejects protocol-relative next paths", () => {
    expect(sanitizeAuthNextPath("//evil.example/phish")).toBe("/dashboard")
  })
})
