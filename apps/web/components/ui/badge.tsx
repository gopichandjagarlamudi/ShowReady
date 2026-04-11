import type { HTMLAttributes, PropsWithChildren } from "react"
import type { LeadStage } from "@showready/types"
import { getLeadStageLabel, getLeadStageTone, type LeadStageTone } from "@/lib/lead-stage"
import { cn, getRecommendationLabel, getRecommendationTone } from "@/lib/utils"

type BadgeTone =
  | "neutral"
  | "ready"
  | "appointment"
  | "nurture"
  | "hold"
  | "won"
  | "lost"
  | "archived"

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[color:var(--muted)] text-[color:var(--muted-ink)]",
  ready: "bg-[color:var(--ready-soft)] text-[color:var(--ready)]",
  appointment: "bg-[color:var(--appointment-soft)] text-[color:var(--appointment)]",
  nurture: "bg-[color:var(--nurture-soft)] text-[color:var(--nurture)]",
  hold: "bg-[color:var(--hold-soft)] text-[color:var(--hold)]",
  won: "bg-[color:var(--won-soft)] text-[color:var(--won)]",
  lost: "bg-[color:var(--lost-soft)] text-[color:var(--lost)]",
  archived: "bg-[color:var(--archived-soft)] text-[color:var(--archived)]"
}

export function Badge({
  className,
  children,
  tone = "neutral",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>> & {
  tone?: BadgeTone
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function RecommendationBadge({
  recommendation
}: {
  recommendation?: string
}) {
  const tone = getRecommendationTone(recommendation) as BadgeTone
  const label = getRecommendationLabel(recommendation)

  return <Badge tone={tone}>{label}</Badge>
}

export function StageBadge({ stage }: { stage: LeadStage }) {
  const tone = getLeadStageTone(stage) as LeadStageTone

  return <Badge tone={tone}>{getLeadStageLabel(stage)}</Badge>
}
