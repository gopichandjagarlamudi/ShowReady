import { afterEach, describe, expect, it } from "vitest"
import { buildAppUrl } from "./utils"

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL

afterEach(() => {
  if (originalAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL
    return
  }

  process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
})

describe("buildAppUrl", () => {
  it("trims whitespace and avoids duplicate slashes in auth callback URLs", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://showready-jet.vercel.app/ \n"

    expect(buildAppUrl("/auth/callback")).toBe(
      "https://showready-jet.vercel.app/auth/callback"
    )
  })
})
