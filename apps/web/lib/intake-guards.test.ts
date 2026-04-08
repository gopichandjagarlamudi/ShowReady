import { describe, expect, it } from "vitest"
import {
  assertLeadIntakeMutable,
  assertRequiredAnswerValue
} from "./intake-guards"

describe("intake guards", () => {
  it("rejects autosave or submit after a lead is already submitted", () => {
    expect(() => assertLeadIntakeMutable("submitted")).toThrow(
      "This intake has already been submitted."
    )
  })

  it("allows pending lead intake changes", () => {
    expect(() => assertLeadIntakeMutable("pending")).not.toThrow()
  })

  it("rejects empty arrays for required answers", () => {
    expect(() => assertRequiredAnswerValue("Move reasons", [])).toThrow(
      "Missing answers for: Move reasons"
    )
  })

  it("accepts populated arrays for required answers", () => {
    expect(() =>
      assertRequiredAnswerValue("Move reasons", ["job_change"])
    ).not.toThrow()
  })
})
