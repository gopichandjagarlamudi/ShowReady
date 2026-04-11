import { describe, expect, it } from "vitest"
import { getLeadReviewState, getSuggestedStage } from "./lead-review"

describe("lead-review", () => {
  it("maps a show recommendation to the ready_to_show pipeline stage", () => {
    expect(getSuggestedStage("show")).toBe("ready_to_show")
    expect(getSuggestedStage("nurture")).toBe("nurture")
    expect(getSuggestedStage("hold")).toBe("hold")
  })

  it("returns an unreviewed state for new leads that only have a suggestion", () => {
    expect(
      getLeadReviewState({
        pipelineStage: "new",
        recommendation: "show"
      })
    ).toEqual({
      suggestedStage: "ready_to_show",
      reviewedAt: undefined,
      reviewedStage: undefined,
      isReviewed: false,
      isOverride: false
    })
  })

  it("marks the review as an override when the confirmed stage differs from the suggestion", () => {
    expect(
      getLeadReviewState({
        pipelineStage: "nurture",
        recommendation: "show",
        reviewedAt: "2026-04-09T14:00:00.000Z",
        reviewedStage: "nurture"
      })
    ).toEqual({
      suggestedStage: "ready_to_show",
      reviewedAt: "2026-04-09T14:00:00.000Z",
      reviewedStage: "nurture",
      isReviewed: true,
      isOverride: true
    })
  })
})
