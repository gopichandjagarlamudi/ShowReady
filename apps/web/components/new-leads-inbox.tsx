import Link from "next/link"
import type { Lead, LeadStage } from "@showready/types"
import { reviewLeadAction } from "@/lib/actions"
import { getSuggestedStage } from "@/lib/lead-review"
import { RecommendationBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate, formatScore } from "@/lib/utils"

type NewLeadsInboxProps = {
  leads: Lead[]
}

const REVIEW_STAGE_LABELS = {
  ready_to_show: "Ready to show",
  nurture: "Nurture",
  hold: "Hold"
} as const

type ReviewStage = Extract<LeadStage, "ready_to_show" | "nurture" | "hold">

export function NewLeadsInbox({ leads }: NewLeadsInboxProps) {
  if (leads.length === 0) {
    return (
      <Card className="p-6">
        <p className="font-display text-2xl text-[color:var(--ink)]">No new leads</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted-ink)]">
          Completed submissions will land here first so you can confirm the suggested category.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                Review queue
              </p>
              <p className="mt-3 font-display text-4xl text-[color:var(--ink)]">New Leads</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--muted-ink)]">
                Every completed intake appears here before it enters the active pipeline. Confirm the
                suggestion or move it directly in one tap.
              </p>
            </div>
            <div className="rounded-full bg-[color:var(--surface)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]">
              {leads.length} {leads.length === 1 ? "lead" : "leads"} waiting
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-4 sm:p-6">
          {leads.map((lead) => {
            const suggestedStage = getSuggestedStage(lead.recommendation) as ReviewStage | undefined

            return (
              <Card key={lead.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-display text-3xl text-[color:var(--ink)]">{lead.buyerName}</p>
                      <p className="mt-2 text-sm text-[color:var(--muted-ink)]">
                        {lead.buyerEmail ?? lead.buyerPhone ?? "Awaiting contact details"}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
                        Submitted {formatDate(lead.submittedAt ?? lead.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-full bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]">
                        {formatScore(lead.score)} / 10
                      </div>
                      <RecommendationBadge recommendation={lead.recommendation} />
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[color:var(--surface-strong)] p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                      Suggested category
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--ink)]">
                      Suggested: {suggestedStage ? REVIEW_STAGE_LABELS[suggestedStage] : "Pending review"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted-ink)]">
                      {lead.summary ?? "Lead summary will appear here once scoring is complete."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {suggestedStage ? (
                      <form action={reviewLeadAction}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input type="hidden" name="pipelineStage" value={suggestedStage} />
                        <Button type="submit" className="w-full sm:w-auto">
                          Confirm suggestion
                        </Button>
                      </form>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {(["ready_to_show", "nurture", "hold"] as const).map((stage) => (
                        <form key={stage} action={reviewLeadAction} className="sm:flex-1">
                          <input type="hidden" name="leadId" value={lead.id} />
                          <input type="hidden" name="pipelineStage" value={stage} />
                          <Button type="submit" variant="secondary" className="w-full">
                            Move to {REVIEW_STAGE_LABELS[stage]}
                          </Button>
                        </form>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/leads/${lead.id}`}
                    className="inline-flex min-h-11 items-center text-sm font-medium text-[color:var(--brand)]"
                  >
                    Review details
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
