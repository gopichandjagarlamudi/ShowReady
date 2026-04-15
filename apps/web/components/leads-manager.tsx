"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Lead, LeadStage } from "@showready/types"
import { deleteLeadsAction, updateLeadStageAction } from "@/lib/actions"
import { StageBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getLeadBoardStageOptions, getLeadStageLabel } from "@/lib/lead-stage"
import { cn, formatDate, formatScore } from "@/lib/utils"

type ActiveLeadTab = "ready_to_show" | "appointment_booked" | "nurture" | "hold"
type OutcomeLeadTab = "closed_won" | "closed_lost" | "archived"

type LeadsManagerProps = {
  leads: Lead[]
  activeAppointmentLeadIds?: string[]
  activeTab?: ActiveLeadTab
  outcomeTab?: OutcomeLeadTab
}

type StageMeta = {
  title: string
  description: string
  emptyMessage: string
  headerClassName: string
  badgeClassName: string
}

export function reconcileSelectedLeadIds(selectedLeadIds: string[], leadIds: string[]) {
  const leadIdSet = new Set(leadIds)
  return selectedLeadIds.filter((leadId) => leadIdSet.has(leadId))
}

const ACTIVE_TABS: ActiveLeadTab[] = ["ready_to_show", "appointment_booked", "nurture", "hold"]
const OUTCOME_TABS: OutcomeLeadTab[] = ["closed_won", "closed_lost", "archived"]

const STAGE_META: Record<LeadStage, StageMeta> = {
  new: {
    title: "New",
    description: "Freshly submitted leads waiting for review before they enter the active pipeline.",
    emptyMessage: "No new leads yet.",
    headerClassName: "border-[color:var(--border)]/80 bg-[color:var(--muted)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--muted-ink)]"
  },
  ready_to_show: {
    title: "Ready to show",
    description: "Reviewed buyers and renters who are prepared for your next step.",
    emptyMessage: "No ready-to-show leads yet.",
    headerClassName: "border-[color:var(--ready)]/15 bg-[color:var(--ready-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--ready)]"
  },
  appointment_booked: {
    title: "Appointment booked",
    description: "Leads with an active scheduled appointment and a concrete plan to tour.",
    emptyMessage: "No appointment-booked leads yet.",
    headerClassName: "border-[color:var(--appointment)]/15 bg-[color:var(--appointment-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--appointment)]"
  },
  nurture: {
    title: "Nurture",
    description: "Leads with momentum that still need timing, financing, or clarity support.",
    emptyMessage: "No nurture leads yet.",
    headerClassName: "border-[color:var(--nurture)]/15 bg-[color:var(--nurture-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--nurture)]"
  },
  hold: {
    title: "Hold",
    description: "Leads to revisit later without losing the relationship context.",
    emptyMessage: "No hold leads yet.",
    headerClassName: "border-[color:var(--hold)]/15 bg-[color:var(--hold-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--hold)]"
  },
  closed_won: {
    title: "Closed won",
    description: "Successful outcomes you want visible for reporting without crowding active work.",
    emptyMessage: "No closed-won leads yet.",
    headerClassName: "border-[color:var(--won)]/15 bg-[color:var(--won-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--won)]"
  },
  closed_lost: {
    title: "Closed lost",
    description: "Outcomes that did not convert, kept for context and follow-up decisions.",
    emptyMessage: "No closed-lost leads yet.",
    headerClassName: "border-[color:var(--lost)]/15 bg-[color:var(--lost-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--lost)]"
  },
  archived: {
    title: "Archived",
    description: "Historical leads that should stay out of the active board while remaining searchable.",
    emptyMessage: "No archived leads yet.",
    headerClassName: "border-[color:var(--archived)]/15 bg-[color:var(--archived-soft)]",
    badgeClassName: "bg-[color:var(--surface)] text-[color:var(--archived)]"
  }
}

function buildLeadsTabHref(activeTab: ActiveLeadTab, outcomeTab: OutcomeLeadTab) {
  return `/leads?active=${activeTab}&outcome=${outcomeTab}`
}

export function LeadsManager({
  leads,
  activeAppointmentLeadIds = [],
  activeTab = "ready_to_show",
  outcomeTab = "closed_won"
}: LeadsManagerProps) {
  const activeAppointmentLeadIdSet = new Set(activeAppointmentLeadIds)
  const sections = Object.fromEntries(
    (Object.keys(STAGE_META) as LeadStage[]).map((stage) => [
      stage,
      {
        stage,
        ...STAGE_META[stage],
        leads:
          stage === "appointment_booked"
            ? Array.from(
                new Map(
                  leads
                    .filter(
                      (lead) =>
                        lead.pipelineStage === "appointment_booked" ||
                        activeAppointmentLeadIdSet.has(lead.id)
                    )
                    .map((lead) => [lead.id, lead])
                ).values()
              )
            : leads.filter((lead) => lead.pipelineStage === stage)
      }
    ])
  ) as Record<LeadStage, StageMeta & { stage: LeadStage; leads: Lead[] }>
  const boardResetKey = [
    activeTab,
    outcomeTab,
    ...sections[activeTab].leads.map((lead) => lead.id),
    ...sections[outcomeTab].leads.map((lead) => lead.id)
  ].join(":")

  return (
    <LeadsManagerBoard
      key={boardResetKey}
      leads={leads}
      activeAppointmentLeadIds={activeAppointmentLeadIds}
      activeTab={activeTab}
      outcomeTab={outcomeTab}
    />
  )
}

function LeadsManagerBoard({
  leads,
  activeAppointmentLeadIds = [],
  activeTab = "ready_to_show",
  outcomeTab = "closed_won"
}: LeadsManagerProps) {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const activeAppointmentLeadIdSet = useMemo(
    () => new Set(activeAppointmentLeadIds),
    [activeAppointmentLeadIds]
  )
  const sections = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(STAGE_META) as LeadStage[]).map((stage) => [
          stage,
          {
            stage,
            ...STAGE_META[stage],
            leads:
              stage === "appointment_booked"
                ? Array.from(
                    new Map(
                      leads
                        .filter(
                          (lead) =>
                            lead.pipelineStage === "appointment_booked" ||
                            activeAppointmentLeadIdSet.has(lead.id)
                        )
                        .map((lead) => [lead.id, lead])
                    ).values()
                  )
                : leads.filter((lead) => lead.pipelineStage === stage)
          }
        ])
      ) as Record<LeadStage, StageMeta & { stage: LeadStage; leads: Lead[] }>,
    [activeAppointmentLeadIdSet, leads]
  )

  const activeSection = sections[activeTab]
  const outcomeSection = sections[outcomeTab]
  const visibleLeadIds = useMemo(
    () => [...activeSection.leads, ...outcomeSection.leads].map((lead) => lead.id),
    [activeSection.leads, outcomeSection.leads]
  )
  const selectedLeadIdsOnBoard = useMemo(
    () => reconcileSelectedLeadIds(selectedLeadIds, visibleLeadIds),
    [selectedLeadIds, visibleLeadIds]
  )
  const allSelected =
    visibleLeadIds.length > 0 && selectedLeadIdsOnBoard.length === visibleLeadIds.length
  const selectedCount = selectedLeadIdsOnBoard.length
  const selectedIdSet = useMemo(() => new Set(selectedLeadIdsOnBoard), [selectedLeadIdsOnBoard])

  function toggleLead(leadId: string, checked: boolean) {
    setSelectedLeadIds((current) =>
      checked ? Array.from(new Set([...current, leadId])) : current.filter((id) => id !== leadId)
    )
  }

  function toggleAll(checked: boolean) {
    setSelectedLeadIds(checked ? visibleLeadIds : [])
  }

  function renderLeadCard(lead: Lead) {
    const selected = selectedIdSet.has(lead.id)
    const stageOptions = getLeadBoardStageOptions(lead.pipelineStage)

    return (
      <Card key={lead.id} className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <label className="flex min-w-0 items-start gap-3">
            <input
              type="checkbox"
              checked={selected}
              onChange={(event) => toggleLead(lead.id, event.target.checked)}
              aria-label={`Select ${lead.buyerName}`}
              className="mt-1 h-4 w-4 rounded border-[color:var(--border)]"
            />
            <div className="min-w-0">
              <p className="font-display text-[1.8rem] leading-tight text-[color:var(--ink)] [overflow-wrap:anywhere]">
                {lead.buyerName}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted-ink)] [overflow-wrap:anywhere]">
                {lead.buyerEmail ?? lead.buyerPhone ?? "Awaiting contact details"}
              </p>
            </div>
          </label>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StageBadge stage={lead.pipelineStage} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
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
              Updated
            </p>
            <p className="mt-1 text-sm text-[color:var(--ink)]">{formatDate(lead.updatedAt)}</p>
          </div>
        </div>

        <div className="mt-auto border-t border-[color:var(--border)] pt-4">
          <div className="flex items-end justify-between gap-3">
            <form action={updateLeadStageAction} className="min-w-0 flex-1">
              <input type="hidden" name="leadId" value={lead.id} />
              <label className="flex flex-col gap-2 text-sm text-[color:var(--muted-ink)]">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Category</span>
                <select
                  name="pipelineStage"
                  defaultValue={lead.pipelineStage}
                  disabled={stageOptions.length === 1}
                  aria-label={`Lead category for ${lead.buyerName}`}
                  onChange={(event) => event.currentTarget.form?.requestSubmit()}
                  className="min-h-11 w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage}>
                      {getLeadStageLabel(stage)}
                    </option>
                  ))}
                </select>
              </label>
            </form>
            <details className="relative z-20 shrink-0">
              <summary
                aria-label={`More lead actions for ${lead.buyerName}`}
                className="flex min-h-11 cursor-pointer list-none items-center rounded-full px-4 text-sm font-medium text-[color:var(--muted-ink)] transition hover:bg-[color:var(--muted)] hover:text-[color:var(--ink)]"
              >
                Actions
              </summary>
              <div className="absolute right-0 top-full z-10 mt-2 flex min-w-40 flex-col rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2 shadow-[var(--shadow-card)]">
                <Link
                  href={`/leads/${lead.id}`}
                  className="inline-flex min-h-11 items-center rounded-[14px] px-3 text-sm font-medium text-[color:var(--ink)] hover:bg-[color:var(--muted)]"
                >
                  Open lead
                </Link>
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
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-[14px] px-3 text-left"
                  >
                    Delete
                  </Button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </Card>
    )
  }

  function renderSection(section: StageMeta & { stage: LeadStage; leads: Lead[] }) {
    return (
      <Card key={section.stage}>
        <div
          className={cn(
            "rounded-t-[calc(var(--radius-lg)-1px)] border-b p-5",
            section.headerClassName
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl text-[color:var(--ink)]">{section.title}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted-ink)]">
                {section.description}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold",
                section.badgeClassName
              )}
            >
              {section.leads.length}
            </span>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {section.leads.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-5">
              <p className="text-sm leading-6 text-[color:var(--muted-ink)]">{section.emptyMessage}</p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {section.leads.map((lead) => renderLeadCard(lead))}
            </div>
          )}
        </div>
      </Card>
    )
  }

  if (leads.length === 0) {
    return (
      <Card className="p-6">
        <p className="font-display text-2xl text-[color:var(--ink)]">No leads yet</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted-ink)]">
          Leads will appear here as soon as invite recipients submit their intake details.
        </p>
      </Card>
    )
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm text-[color:var(--ink)]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
            aria-label="Select all leads"
            className="h-4 w-4 rounded border-[color:var(--border)]"
          />
          Select all leads
        </label>
        {selectedCount > 0 ? (
          <form
            action={deleteLeadsAction}
            onSubmit={(event) => {
              const confirmed = window.confirm(
                `Delete ${selectedCount} selected ${selectedCount === 1 ? "lead" : "leads"}? This cannot be undone.`
              )

              if (!confirmed) {
                event.preventDefault()
              }
            }}
            className="flex items-center gap-3"
          >
            {selectedLeadIdsOnBoard.map((leadId) => (
              <input key={leadId} type="hidden" name="leadId" value={leadId} />
            ))}
            <p className="text-sm text-[color:var(--muted-ink)]">{selectedCount} selected</p>
            <Button type="submit" variant="secondary">
              Delete selected
            </Button>
          </form>
        ) : null}
      </div>

      {sections.new.leads.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--muted-ink)]">
          <span>New leads waiting for review: {sections.new.leads.length}</span>
          <Link
            href="/new-leads"
            className="font-medium text-[color:var(--ink)] underline decoration-[color:var(--border)] underline-offset-4"
          >
            Open New Leads
          </Link>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="space-y-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
              Pipeline
            </p>
            <p className="mt-2 font-display text-3xl text-[color:var(--ink)]">Active board</p>
          </div>
          <div className="max-w-full overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none]">
            <div role="tablist" aria-label="Active lead categories" className="flex min-w-max gap-3">
              {ACTIVE_TABS.map((tab) => {
                const section = sections[tab]
                const selected = tab === activeTab

                return (
                  <Link
                    key={tab}
                    href={buildLeadsTabHref(tab, outcomeTab)}
                    role="tab"
                    aria-selected={selected}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium transition",
                      selected
                        ? "border-[color:var(--ink)] bg-[color:var(--surface)] text-[color:var(--ink)] shadow-[var(--shadow-card)]"
                        : "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-ink)] hover:border-[color:var(--ink)]/15 hover:text-[color:var(--ink)]"
                    )}
                  >
                    <span>{section.title}</span>
                    <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-[color:var(--surface)] px-2 text-xs font-semibold text-[color:var(--ink)]">
                      {section.leads.length}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {renderSection(activeSection)}
      </section>

      <section className="space-y-4">
        <div className="space-y-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
              Outcomes
            </p>
            <p className="mt-2 font-display text-3xl text-[color:var(--ink)]">Resolved board</p>
          </div>
          <div className="max-w-full overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none]">
            <div role="tablist" aria-label="Outcome lead categories" className="flex min-w-max gap-3">
              {OUTCOME_TABS.map((tab) => {
                const section = sections[tab]
                const selected = tab === outcomeTab

                return (
                  <Link
                    key={tab}
                    href={buildLeadsTabHref(activeTab, tab)}
                    role="tab"
                    aria-selected={selected}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium transition",
                      selected
                        ? "border-[color:var(--ink)] bg-[color:var(--surface)] text-[color:var(--ink)] shadow-[var(--shadow-card)]"
                        : "border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--muted-ink)] hover:border-[color:var(--ink)]/15 hover:text-[color:var(--ink)]"
                    )}
                  >
                    <span>{section.title}</span>
                    <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-[color:var(--surface)] px-2 text-xs font-semibold text-[color:var(--ink)]">
                      {section.leads.length}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {renderSection(outcomeSection)}
      </section>
    </div>
  )
}
