import React, { type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Lead } from "@showready/types"
import { NewLeadsInbox } from "./new-leads-inbox"

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
  reviewLeadAction: vi.fn()
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
    reviewedAt: overrides.reviewedAt,
    reviewedStage: overrides.reviewedStage,
    answers: {
      contact: {
        fullName: overrides.buyerName ?? "Casey Buyer"
      }
    },
    customAnswers: {}
  }
}

describe("NewLeadsInbox", () => {
  it("renders the fast review actions and suggestion context on each card", () => {
    const html = renderToStaticMarkup(
      <NewLeadsInbox
        leads={[
          buildLead({
            id: "lead-ready",
            buyerName: "Ready Buyer",
            recommendation: "show",
            score: 8.4,
            summary: "Pre-approved and buying in 30 days."
          })
        ]}
      />
    )

    expect(html).toContain("New Leads")
    expect(html).toContain("Ready Buyer")
    expect(html).toContain("Suggested: Ready")
    expect(html).toContain("Confirm suggestion")
    expect(html).toContain("Move to Ready")
    expect(html).toContain("Move to Nurture")
    expect(html).toContain("Move to Hold")
    expect(html).toContain("Review details")
  })
})
