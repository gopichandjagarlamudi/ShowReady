import { describe, expect, test } from "vitest"
import {
  canCreateLeadFromDraft,
  getOptionalQuestionsForIntent,
  getRequiredQuestionsForIntent,
  intentToIntakeType,
  type IntakeDraft
} from "../src/index.ts"

describe("intake draft helpers", () => {
  test("requires full name, intent, and one contact method before lead creation", () => {
    const incomplete: IntakeDraft = {
      contact: {
        fullName: "Taylor Brooks"
      }
    }

    expect(canCreateLeadFromDraft(incomplete)).toBe(false)

    const ready: IntakeDraft = {
      contact: {
        fullName: "Taylor Brooks",
        email: "taylor@example.com"
      },
      intent: "buy"
    }

    expect(canCreateLeadFromDraft(ready)).toBe(true)
  })

  test("maps public intake intent to the persisted intake type", () => {
    expect(intentToIntakeType("buy")).toBe("sale")
    expect(intentToIntakeType("rent")).toBe("rental")
  })

  test("exposes the fixed buyer and rental questionnaire sections", () => {
    expect(getRequiredQuestionsForIntent("buy")).toHaveLength(6)
    expect(getOptionalQuestionsForIntent("buy")).toHaveLength(5)
    expect(getRequiredQuestionsForIntent("rent")).toHaveLength(7)
    expect(getOptionalQuestionsForIntent("rent")).toHaveLength(5)
  })
})
