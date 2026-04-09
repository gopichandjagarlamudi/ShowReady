import React, { type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Lead } from "@showready/types"
import { LeadsManager } from "./leads-manager"

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
  deleteLeadsAction: vi.fn()
}))

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

describe("LeadsManager", () => {
  it("renders only reviewed pipeline sections in order with empty states", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-ready",
            buyerName: "Ready Buyer",
            pipelineStage: "ready",
            recommendation: "show"
          }),
          buildLead({
            id: "lead-hold",
            buyerName: "Hold Buyer",
            pipelineStage: "hold",
            recommendation: "hold"
          }),
          buildLead({
            id: "lead-new",
            buyerName: "New Buyer",
            pipelineStage: "new"
          })
        ]}
      />
    )

    const readyIndex = html.indexOf("Ready to show")
    const nurtureIndex = html.indexOf("Nurture")
    const holdIndex = html.indexOf("Hold")
    const closedIndex = html.indexOf("Closed")

    expect(readyIndex).toBeGreaterThan(-1)
    expect(nurtureIndex).toBeGreaterThan(readyIndex)
    expect(holdIndex).toBeGreaterThan(nurtureIndex)
    expect(closedIndex).toBeGreaterThan(holdIndex)

    expect(html).toContain("No nurture leads yet.")
    expect(html).toContain("No closed leads yet.")
    expect(html).toContain("Ready Buyer")
    expect(html).toContain("Hold Buyer")
    expect(html).not.toContain(">New<")
    expect(html).not.toContain("New Buyer")
  })
})
