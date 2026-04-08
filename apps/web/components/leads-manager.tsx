"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Lead, LeadStage } from "@showready/types"
import { deleteLeadsAction } from "@/lib/actions"
import { RecommendationBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn, formatDate, formatScore } from "@/lib/utils"

type LeadsManagerProps = {
  leads: Lead[]
}

const STAGE_ORDER: LeadStage[] = ["ready", "nurture", "hold", "new", "closed"]

const STAGE_META: Record<
  LeadStage,
  {
    title: string
    description: string
    emptyMessage: string
    headerClassName: string
    badgeClassName: string
  }
> = {
  ready: {
    title: "Ready to show",
    description: "High-intent buyers and renters who are ready for your next step.",
    emptyMessage: "No ready-to-show leads yet.",
    headerClassName: "border-[color:var(--ready)]/10 bg-[color:var(--ready-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--ready)]"
  },
  nurture: {
    title: "Nurture",
    description: "Leads with momentum that still need timing, financing, or clarity support.",
    emptyMessage: "No nurture leads yet.",
    headerClassName: "border-[color:var(--nurture)]/10 bg-[color:var(--nurture-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--nurture)]"
  },
  hold: {
    title: "Hold",
    description: "Low-readiness leads to revisit later without losing the thread.",
    emptyMessage: "No hold leads yet.",
    headerClassName: "border-[color:var(--hold)]/10 bg-[color:var(--hold-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--hold)]"
  },
  new: {
    title: "New",
    description: "Fresh submissions that still need your first review and disposition.",
    emptyMessage: "No new leads yet.",
    headerClassName: "border-[color:var(--border)] bg-[color:var(--surface-strong)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--ink)]"
  },
  closed: {
    title: "Closed",
    description: "Completed pipeline outcomes that you want visible but out of the active queue.",
    emptyMessage: "No closed leads yet.",
    headerClassName: "border-[color:var(--border)] bg-[color:var(--muted)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--muted-ink)]"
  }
}

function getStageLabel(stage: LeadStage) {
  return STAGE_META[stage].title
}

export function LeadsManager({ leads }: LeadsManagerProps) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const allSelected = leads.length > 0 && selectedLeadIds.length === leads.length
  const selectedCount = selectedLeadIds.length

  const selectedIdSet = useMemo(() => new Set(selectedLeadIds), [selectedLeadIds])
  const sections = useMemo(
    () =>
      STAGE_ORDER.map((stage) => ({
        stage,
        ...STAGE_META[stage],
        leads: leads.filter((lead) => lead.pipelineStage === stage)
      })),
    [leads]
  )

  function toggleLead(leadId: string, checked: boolean) {
    setSelectedLeadIds((current) =>
      checked ? Array.from(new Set([...current, leadId])) : current.filter((id) => id !== leadId)
    )
  }

  function toggleAll(checked: boolean) {
    setSelectedLeadIds(checked ? leads.map((lead) => lead.id) : [])
  }

  if (leads.length === 0) {
    return (
      <Card className="p-6">
        <p className="font-display text-2xl text-[color:var(--ink)]">No leads yet</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted-ink)]">
          Completed invite submissions will appear here once a prospect finishes the intake.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm text-[color:var(--ink)]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
            className="h-4 w-4 rounded border-[color:var(--border)]"
          />
          Select all leads
        </label>
        <form
          action={deleteLeadsAction}
          onSubmit={(event) => {
            if (selectedCount === 0) {
              event.preventDefault()
              return
            }

            const confirmed = window.confirm(
              `Delete ${selectedCount} selected ${selectedCount === 1 ? "lead" : "leads"}? This cannot be undone.`
            )

            if (!confirmed) {
              event.preventDefault()
            }
          }}
          className="flex items-center gap-3"
        >
          {selectedLeadIds.map((leadId) => (
            <input key={leadId} type="hidden" name="leadId" value={leadId} />
          ))}
          <p className="text-sm text-[color:var(--muted-ink)]">
            {selectedCount > 0 ? `${selectedCount} selected` : "No leads selected"}
          </p>
          <Button type="submit" variant="secondary" disabled={selectedCount === 0}>
            Delete selected
          </Button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.stage} className="overflow-hidden xl:col-span-2">
            <div className={cn("border-b p-5 sm:p-6", section.headerClassName)}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-display text-3xl text-[color:var(--ink)]">{section.title}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted-ink)]">
                    {section.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold",
                    section.badgeClassName
                  )}
                >
                  {section.leads.length} {section.leads.length === 1 ? "lead" : "leads"}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {section.leads.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <p className="text-sm leading-6 text-[color:var(--muted-ink)]">{section.emptyMessage}</p>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {section.leads.map((lead) => {
                    const selected = selectedIdSet.has(lead.id)

                    return (
                      <Card key={lead.id} className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => toggleLead(lead.id, event.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-[color:var(--border)]"
                            />
                            <div>
                              <p className="font-display text-2xl text-[color:var(--ink)]">{lead.buyerName}</p>
                              <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
                                {lead.buyerEmail ?? lead.buyerPhone ?? "Awaiting contact details"}
                              </p>
                            </div>
                          </label>
                          <div className="flex flex-col items-end gap-3">
                            <RecommendationBadge recommendation={lead.recommendation} />
                            <form
                              action={deleteLeadsAction}
                              onSubmit={(event) => {
                                const confirmed = window.confirm(
                                  `Delete ${lead.buyerName}? This cannot be undone.`
                                )

                                if (!confirmed) {
                                  event.preventDefault()
                                }
                              }}
                            >
                              <input type="hidden" name="leadId" value={lead.id} />
                              <Button type="submit" variant="ghost" size="sm">
                                Delete
                              </Button>
                            </form>
                          </div>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted-ink)]">
                              Score
                            </p>
                            <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                              {lead.score ? formatScore(lead.score) : "Pending"}
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted-ink)]">
                              Stage
                            </p>
                            <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                              {getStageLabel(lead.pipelineStage)}
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted-ink)]">
                              Updated
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--ink)]">{formatDate(lead.updatedAt)}</p>
                          </div>
                        </div>
                        {lead.summary ? (
                          <p className="mt-4 text-sm leading-6 text-[color:var(--muted-ink)]">{lead.summary}</p>
                        ) : (
                          <p className="mt-4 text-sm leading-6 text-[color:var(--muted-ink)]">
                            Intake has not been completed yet. Share the magic link to keep this lead moving.
                          </p>
                        )}
                        <Link
                          href={`/leads/${lead.id}`}
                          className="mt-5 inline-flex text-sm font-medium text-[color:var(--brand)]"
                        >
                          Open lead detail
                        </Link>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
