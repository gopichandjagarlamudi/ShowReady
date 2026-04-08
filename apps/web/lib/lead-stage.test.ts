import { describe, expect, it } from "vitest"
import { getLeadDetailMoveTargets } from "./lead-stage"

describe("lead-stage", () => {
  it("returns ready, hold, and closed for nurture leads", () => {
    expect(getLeadDetailMoveTargets("nurture")).toEqual(["ready", "hold", "closed"])
  })

  it("returns ready, nurture, and hold for closed leads", () => {
    expect(getLeadDetailMoveTargets("closed")).toEqual(["ready", "nurture", "hold"])
  })

  it("returns every manual destination for new leads", () => {
    expect(getLeadDetailMoveTargets("new")).toEqual(["ready", "nurture", "hold", "closed"])
  })

  it("never includes the current stage in the destination list", () => {
    expect(getLeadDetailMoveTargets("ready")).not.toContain("ready")
    expect(getLeadDetailMoveTargets("nurture")).not.toContain("nurture")
    expect(getLeadDetailMoveTargets("hold")).not.toContain("hold")
    expect(getLeadDetailMoveTargets("closed")).not.toContain("closed")
  })

  it("never includes new unless the current stage is new", () => {
    expect(getLeadDetailMoveTargets("ready")).not.toContain("new")
    expect(getLeadDetailMoveTargets("nurture")).not.toContain("new")
    expect(getLeadDetailMoveTargets("hold")).not.toContain("new")
    expect(getLeadDetailMoveTargets("closed")).not.toContain("new")
  })
})
