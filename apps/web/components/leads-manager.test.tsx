// @vitest-environment jsdom

import React, { type ReactNode } from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Lead } from "@showready/types"
import { getLeadBoardStageOptions, getLeadStageLabel } from "@/lib/lead-stage"
import { LeadsManager, reconcileSelectedLeadIds } from "./leads-manager"

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: ReactNode
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}))

vi.mock("@/lib/actions", () => ({
  deleteLeadsAction: vi.fn(),
  updateLeadStageAction: vi.fn()
}))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

function buildLead(overrides: Partial<Lead>): Lead {
  return {
    id: overrides.id ?? "lead-1",
    agentId: "agent-1",
    intakeType: "sale",
    buyerName: overrides.buyerName ?? "Casey Buyer",
    buyerPhone: "555-0101",
    buyerEmail: "casey@example.com",
    token: "token-1",
    tokenExpiresAt: "2026-04-20T12:00:00.000Z",
    status: "submitted",
    pipelineStage: overrides.pipelineStage ?? "new",
    submittedAt: "2026-04-08T12:00:00.000Z",
    score: overrides.score ?? 7.8,
    recommendation: overrides.recommendation ?? "nurture",
    summary: overrides.summary ?? "Looking for a condo close to transit.",
    createdAt: "2026-04-08T11:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-04-08T12:30:00.000Z",
    answers: {
      contact: {
        fullName: overrides.buyerName ?? "Casey Buyer"
      }
    },
    customAnswers: {}
  }
}

function renderLeadsManager(
  leads: Lead[],
  options?: { activeTab?: any; outcomeTab?: any; activeAppointmentLeadIds?: string[] }
) {
  return renderToStaticMarkup(
    <LeadsManager
      leads={leads}
      activeTab={options?.activeTab ?? "ready_to_show"}
      outcomeTab={options?.outcomeTab ?? "closed_won"}
      activeAppointmentLeadIds={options?.activeAppointmentLeadIds ?? []}
    />
  )
}

describe("LeadsManager", () => {
  it("defaults the active workspace to Ready to show and hides the other active sections", () => {
    const html = renderLeadsManager([
      buildLead({
        id: "lead-ready",
        buyerName: "Ready Buyer",
        pipelineStage: "ready_to_show",
        recommendation: "show"
      }),
      buildLead({
        id: "lead-nurture",
        buyerName: "Nurture Buyer",
        pipelineStage: "nurture",
        recommendation: "nurture"
      })
    ])

    expect(html).toContain("Active board")
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain("Ready Buyer")
    expect(html).not.toContain("Nurture Buyer")
    expect(html).toContain('href="/leads?active=nurture&amp;outcome=closed_won"')
  })

  it("renders outcomes in a separate tab group", () => {
    const html = renderLeadsManager(
      [
        buildLead({
          id: "lead-lost",
          buyerName: "Lost Buyer",
          pipelineStage: "closed_lost",
          recommendation: "hold"
        })
      ],
      {
        outcomeTab: "closed_lost"
      }
    )

    expect(html).toContain("Outcomes")
    expect(html).toContain('aria-label="Outcome lead categories"')
    expect(html).toContain("Lost Buyer")
    expect(html).toContain('href="/leads?active=ready_to_show&amp;outcome=archived"')
  })

  it("renders compact card metadata with score and updated details", () => {
    const html = renderLeadsManager([
      buildLead({
        id: "lead-ready",
        buyerName: "Ready Buyer",
        pipelineStage: "ready_to_show",
        recommendation: "show"
      })
    ])

    expect(html).toContain("Score")
    expect(html).toContain("Updated")
    expect(html).toContain("Ready to show")
  })

  it("renders a persistent footer action bar while hiding board-card summary copy", () => {
    const html = renderLeadsManager(
      [
        buildLead({
          id: "lead-ready",
          buyerName: "Fresh Buyer",
          pipelineStage: "ready_to_show",
          recommendation: "show",
          summary: "Unique summary copy that should stay off the board."
        })
      ],
      { activeTab: "ready_to_show" }
    )

    expect(html).toContain('aria-label="Lead category for Fresh Buyer"')
    expect(html).toContain("More lead actions for Fresh Buyer")
    expect(html).not.toContain("Unique summary copy that should stay off the board.")
    expect((html.match(/inline-flex items-center rounded-full px-3 py-1 text-\[11px\]/g) ?? []).length).toBe(1)
  })

  it("keeps the bulk toolbar quiet until at least one lead is selected", () => {
    const html = renderLeadsManager([
      buildLead({
        id: "lead-ready",
        buyerName: "Ready Buyer",
        pipelineStage: "ready_to_show",
        recommendation: "show"
      })
    ])

    expect(html).toContain("Select all leads")
    expect(html).not.toContain("Delete selected")
    expect(html).not.toContain("No leads selected")
    expect(html).not.toContain("selected</p>")
  })

  it("shows the current stage plus valid next moves in the category dropdown", () => {
    const html = renderLeadsManager(
      [
        buildLead({
          id: "lead-booked",
          buyerName: "Booked Buyer",
          pipelineStage: "appointment_booked",
          recommendation: "show"
        })
      ],
      { activeTab: "appointment_booked" }
    )

    const expectedStages = getLeadBoardStageOptions("appointment_booked")

    expect(html).toContain('aria-label="Lead category for Booked Buyer"')
    expectedStages.forEach((stage) => {
      expect(html).toContain(`value="${stage}"`)
      expect(html).toContain(`>${getLeadStageLabel(stage)}</option>`)
    })
    expect(html).not.toContain('<option value="new">New</option>')
  })

  it("disables the category dropdown for new leads so board review flow cannot be bypassed", () => {
    const html = renderLeadsManager([
      buildLead({
        id: "lead-new",
        buyerName: "Fresh Buyer",
        pipelineStage: "new"
      })
    ])

    expect(html).toContain("New leads waiting for review: 1")
    expect(html).toContain('href="/new-leads"')
    expect(html).not.toContain('aria-label="Lead category for Fresh Buyer"')
  })

  it("puts secondary card actions behind a quiet overflow trigger", () => {
    const html = renderLeadsManager([
      buildLead({
        id: "lead-ready",
        buyerName: "Ready Buyer",
        pipelineStage: "ready_to_show",
        recommendation: "show"
      })
    ])

    expect(html).toContain("More lead actions for Ready Buyer")
    expect(html).toContain(">Open lead<")
    expect(html).toContain(">Delete<")
    expect(html).not.toContain("Open lead detail")
  })

  it("does not clip floating lead action menus inside a stage section", () => {
    const html = renderLeadsManager([
      buildLead({
        id: "lead-ready",
        buyerName: "Ready Buyer",
        pipelineStage: "ready_to_show",
        recommendation: "show"
      })
    ])

    expect(html).toContain("More lead actions for Ready Buyer")
    expect(html).not.toContain("shadow-[var(--shadow-card)] overflow-hidden")
  })

  it("renders horizontal active and outcome tab rails with one visible section each", () => {
    const html = renderLeadsManager(
      [
        buildLead({
          id: "lead-ready",
          buyerName: "Ready Buyer",
          pipelineStage: "ready_to_show",
          recommendation: "show"
        }),
        buildLead({
          id: "lead-hold",
          buyerName: "Hold Buyer",
          pipelineStage: "hold",
          recommendation: "hold"
        }),
        buildLead({
          id: "lead-archived",
          buyerName: "Archived Buyer",
          pipelineStage: "archived",
          recommendation: "hold"
        })
      ],
      {
        activeTab: "hold",
        outcomeTab: "archived"
      }
    )

    expect(html).toContain('role="tablist"')
    expect(html).toContain('aria-label="Active lead categories"')
    expect(html).toContain('aria-label="Outcome lead categories"')
    expect(html).toContain("Hold Buyer")
    expect(html).toContain("Archived Buyer")
    expect(html).not.toContain("Ready Buyer")
  })

  it("shows active scheduled appointments in the appointment_booked tab without changing the real stage badge", () => {
    const html = renderLeadsManager(
      [
        buildLead({
          id: "lead-ready",
          buyerName: "Ready Buyer",
          pipelineStage: "ready_to_show",
          recommendation: "show"
        })
      ],
      {
        activeTab: "appointment_booked",
        activeAppointmentLeadIds: ["lead-ready"]
      }
    )

    expect(html).toContain("Ready Buyer")
    expect(html).toContain("Appointment booked")
    expect(html).toContain("Ready to show")
    expect(html).not.toContain("No appointment-booked leads yet.")
  })

  it("drops stale selected ids when the board data changes", () => {
    expect(reconcileSelectedLeadIds(["lead-ready", "lead-archived"], ["lead-ready"])).toEqual([
      "lead-ready"
    ])
    expect(reconcileSelectedLeadIds(["missing-lead"], ["lead-ready", "lead-hold"])).toEqual([])
  })

  it("clears stale component selection when a selected lead leaves and re-enters the board", async () => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)
    const readyLead = buildLead({
      id: "lead-ready",
      buyerName: "Ready Buyer",
      pipelineStage: "ready_to_show",
      recommendation: "show"
    })
    const holdLead = buildLead({
      id: "lead-hold",
      buyerName: "Hold Buyer",
      pipelineStage: "hold",
      recommendation: "hold"
    })

    await act(async () => {
      root.render(
        <LeadsManager leads={[readyLead, holdLead]} activeTab="ready_to_show" outcomeTab="closed_won" />
      )
    })

    const readyCheckbox = container.querySelector(
      'input[aria-label="Select Ready Buyer"]'
    ) as HTMLInputElement | null

    expect(readyCheckbox).not.toBeNull()

    await act(async () => {
      readyCheckbox?.click()
    })

    expect(container.textContent).toContain("1 selected")
    expect(container.querySelector('input[name="leadId"][value="lead-ready"]')).not.toBeNull()

    await act(async () => {
      root.render(<LeadsManager leads={[holdLead]} activeTab="hold" outcomeTab="closed_won" />)
    })

    expect(container.textContent).not.toContain("selected")
    expect(container.querySelector('input[name="leadId"][value="lead-ready"]')).toBeNull()

    await act(async () => {
      root.render(
        <LeadsManager leads={[readyLead, holdLead]} activeTab="ready_to_show" outcomeTab="closed_won" />
      )
    })

    const readyCheckboxAgain = container.querySelector(
      'input[aria-label="Select Ready Buyer"]'
    ) as HTMLInputElement | null

    expect(readyCheckboxAgain?.checked).toBe(false)

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })
})
