import type { LeadStage } from "@showready/types"

const LEAD_DETAIL_MOVE_TARGETS: LeadStage[] = ["ready", "nurture", "hold", "closed"]

export function getLeadDetailMoveTargets(currentStage: LeadStage): LeadStage[] {
  return LEAD_DETAIL_MOVE_TARGETS.filter((stage) => stage !== currentStage)
}
