import { describe, expect, it } from "vitest"
import { getLeadBoardStageOptions, getLeadDetailMoveTargets } from "./lead-stage"

describe("lead-stage", () => {
  it("returns the current reviewed stage first followed by valid next moves", () => {
    expect(getLeadBoardStageOptions("nurture")).toEqual([
      "nurture",
      "ready_to_show",
      "hold",
      "closed_won",
      "closed_lost",
      "archived"
    ])
  })

  it("does not include new or appointment_booked in board move options for reviewed leads", () => {
    expect(getLeadBoardStageOptions("ready_to_show")).not.toContain("new")
    expect(getLeadBoardStageOptions("ready_to_show")).not.toContain("appointment_booked")
  })

  it("returns only the current stage for new leads so the board does not bypass review flow", () => {
    expect(getLeadBoardStageOptions("new")).toEqual(["new"])
  })

  it("returns all reviewed destinations except the current stage and appointment_booked", () => {
    expect(getLeadDetailMoveTargets("nurture")).toEqual([
      "ready_to_show",
      "hold",
      "closed_won",
      "closed_lost",
      "archived"
    ])
  })

  it("allows appointment_booked leads to move into any reviewed non-appointment stage", () => {
    expect(getLeadDetailMoveTargets("appointment_booked")).toEqual([
      "ready_to_show",
      "nurture",
      "hold",
      "closed_won",
      "closed_lost",
      "archived"
    ])
  })

  it("never includes the current stage in the destination list", () => {
    expect(getLeadDetailMoveTargets("ready_to_show")).not.toContain("ready_to_show")
    expect(getLeadDetailMoveTargets("nurture")).not.toContain("nurture")
    expect(getLeadDetailMoveTargets("hold")).not.toContain("hold")
    expect(getLeadDetailMoveTargets("closed_won")).not.toContain("closed_won")
    expect(getLeadDetailMoveTargets("closed_lost")).not.toContain("closed_lost")
    expect(getLeadDetailMoveTargets("archived")).not.toContain("archived")
  })

  it("never includes new or appointment_booked as a manual destination", () => {
    expect(getLeadDetailMoveTargets("ready_to_show")).not.toContain("new")
    expect(getLeadDetailMoveTargets("nurture")).not.toContain("new")
    expect(getLeadDetailMoveTargets("hold")).not.toContain("new")
    expect(getLeadDetailMoveTargets("closed_won")).not.toContain("new")
    expect(getLeadDetailMoveTargets("ready_to_show")).not.toContain("appointment_booked")
    expect(getLeadDetailMoveTargets("nurture")).not.toContain("appointment_booked")
    expect(getLeadDetailMoveTargets("hold")).not.toContain("appointment_booked")
    expect(getLeadDetailMoveTargets("closed_lost")).not.toContain("appointment_booked")
  })
})
