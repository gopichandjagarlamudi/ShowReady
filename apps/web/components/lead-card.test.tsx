// @vitest-environment jsdom

import React, { type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Lead } from "@showready/types"
import { LeadCard } from "./lead-card"

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

function buildLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: overrides.id ?? "lead-1",
    agentId: "agent-1",
    intakeType: "sale",
    buyerName: overrides.buyerName ?? "Taylor Verify",
    buyerPhone: "555-0101",
    buyerEmail: "taylor@example.com",
    token: "token-1",
    tokenExpiresAt: "2026-04-20T12:00:00.000Z",
    status: "submitted",
    pipelineStage: overrides.pipelineStage ?? "ready_to_show",
    submittedAt: "2026-04-08T12:00:00.000Z",
    score: overrides.score ?? 8.96,
    recommendation: overrides.recommendation ?? "show",
    summary: overrides.summary ?? "Strong timeline urgency and financing clarity.",
    createdAt: "2026-04-08T11:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-04-08T12:30:00.000Z",
    answers: {
      contact: {
        fullName: overrides.buyerName ?? "Taylor Verify"
      }
    },
    customAnswers: {}
  }
}

describe("LeadCard", () => {
  it("shows the stage badge without duplicating the recommendation badge", () => {
    const html = renderToStaticMarkup(
      <LeadCard
        lead={buildLead({
          pipelineStage: "ready_to_show",
          recommendation: "show"
        })}
      />
    )

    expect(html).toContain("Stage")
    expect(html).toContain("Ready to show")
    expect((html.match(/rounded-full px-3 py-1 text-\[11px\]/g) ?? []).length).toBe(1)
  })
})
