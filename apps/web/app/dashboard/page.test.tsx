import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Lead } from "@showready/types"

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}))

vi.mock("@/lib/session", () => ({
  getCurrentAgentContext: vi.fn(async () => ({
    agent: {
      id: "agent-1",
      fullName: "Taylor Agent",
      onboardedAt: "2026-04-01T00:00:00.000Z"
    },
    settings: {
      brandName: "ShowReady"
    }
  }))
}))

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ }))
}))

vi.mock("@/lib/supabase/data", () => ({
  getAnalyticsSummary: vi.fn(async () => ({
    readyToShow: 1,
    appointmentBooked: 0,
    nurture: 0,
    hold: 0,
    averageScore: 9.1,
    totalLeads: 1
  })),
  listLeads: vi.fn(async () => [
    {
      id: "lead-1",
      agentId: "agent-1",
      intakeType: "sale",
      buyerName: "Taylor Verify",
      buyerEmail: "taylor@example.com",
      buyerPhone: "555-0101",
      token: "token-1",
      tokenExpiresAt: "2026-04-20T12:00:00.000Z",
      status: "submitted",
      pipelineStage: "ready_to_show",
      submittedAt: "2026-04-08T12:00:00.000Z",
      score: 8.96,
      recommendation: "show",
      summary: "Strong timeline urgency and financing clarity.",
      createdAt: "2026-04-08T11:00:00.000Z",
      updatedAt: "2026-04-08T12:30:00.000Z",
      answers: {
        contact: {
          fullName: "Taylor Verify"
        }
      },
      customAnswers: {}
    } satisfies Lead
  ]),
  listInvites: vi.fn(async () => [])
}))

vi.mock("@/components/live-refresh", () => ({
  LiveRefresh: () => null
}))

vi.mock("@/components/generated-link-panel", () => ({
  GeneratedLinkPanel: () => <div>Generated link panel</div>
}))

vi.mock("@/lib/actions", () => ({
  createInviteAction: vi.fn(),
  logoutAction: vi.fn()
}))

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  )
}))

import DashboardPage from "./page"

describe("DashboardPage", () => {
  it("uses a neutral heading instead of the time-of-day greeting", async () => {
    const html = renderToStaticMarkup(await DashboardPage({ searchParams: undefined }))

    expect(html).not.toContain("Good morning")
    expect(html).toContain("Welcome back, Taylor")
  })
})
