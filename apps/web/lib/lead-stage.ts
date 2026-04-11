import type { LeadStage } from "@showready/types"

export const REVIEW_STAGE_OPTIONS = ["ready_to_show", "nurture", "hold"] as const

export const MANUAL_MOVE_TARGETS = [
  "ready_to_show",
  "nurture",
  "hold",
  "closed_won",
  "closed_lost",
  "archived"
] as const

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  ready_to_show: "Ready to show",
  appointment_booked: "Appointment booked",
  nurture: "Nurture",
  hold: "Hold",
  closed_won: "Closed won",
  closed_lost: "Closed lost",
  archived: "Archived"
}

export type LeadStageTone =
  | "neutral"
  | "ready"
  | "appointment"
  | "nurture"
  | "hold"
  | "won"
  | "lost"
  | "archived"

export const LEAD_STAGE_TONES: Record<LeadStage, LeadStageTone> = {
  new: "neutral",
  ready_to_show: "ready",
  appointment_booked: "appointment",
  nurture: "nurture",
  hold: "hold",
  closed_won: "won",
  closed_lost: "lost",
  archived: "archived"
}

export function getLeadStageLabel(stage: LeadStage) {
  return LEAD_STAGE_LABELS[stage]
}

export function getLeadStageTone(stage: LeadStage): LeadStageTone {
  return LEAD_STAGE_TONES[stage]
}

export function isOutcomeStage(stage: LeadStage) {
  return stage === "closed_won" || stage === "closed_lost" || stage === "archived"
}

export function getLeadDetailMoveTargets(currentStage: LeadStage): LeadStage[] {
  return MANUAL_MOVE_TARGETS.filter((stage) => stage !== currentStage)
}

export function getLeadBoardStageOptions(currentStage: LeadStage): LeadStage[] {
  if (currentStage === "new") {
    return ["new"]
  }

  return [currentStage, ...getLeadDetailMoveTargets(currentStage)]
}
