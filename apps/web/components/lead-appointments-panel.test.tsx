import React, { type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Appointment, Lead } from "@showready/types"
import { LeadAppointmentsPanel } from "./lead-appointments-panel"

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
  saveAppointmentAction: vi.fn(),
  updateAppointmentStatusAction: vi.fn()
}))

function buildLead(overrides: Partial<Lead> = {}): Lead {
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
    pipelineStage: overrides.pipelineStage ?? "appointment_booked",
    submittedAt: "2026-04-08T12:00:00.000Z",
    score: 8.4,
    recommendation: "show",
    summary: "Pre-approved and moving soon.",
    createdAt: "2026-04-08T11:00:00.000Z",
    updatedAt: "2026-04-08T12:30:00.000Z",
    customAnswers: {}
  }
}

function buildAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: overrides.id ?? "appointment-1",
    leadId: overrides.leadId ?? "lead-1",
    date: overrides.date ?? "2026-04-22",
    startTime: overrides.startTime ?? "14:30:00",
    status: overrides.status ?? "scheduled",
    notes: overrides.notes ?? "Meet in the lobby before the first stop.",
    createdAt: "2026-04-20T10:00:00.000Z",
    lead: overrides.lead ?? {
      id: "lead-1",
      buyerName: "Casey Buyer",
      buyerEmail: "casey@example.com",
      buyerPhone: "555-0101",
      pipelineStage: "appointment_booked"
    },
    showings: overrides.showings ?? [
      {
        id: "showing-1",
        appointmentId: "appointment-1",
        address: "123 King St W",
        orderIndex: 0,
        notes: "Front desk sign-in"
      }
    ]
  }
}

describe("LeadAppointmentsPanel", () => {
  it("renders the scheduled appointment, editor, and history blocks", () => {
    const html = renderToStaticMarkup(
      <LeadAppointmentsPanel
        lead={buildLead()}
        appointments={[
          buildAppointment(),
          buildAppointment({
            id: "appointment-2",
            status: "completed",
            date: "2026-04-18",
            startTime: "10:00:00"
          })
        ]}
      />
    )

    expect(html).toContain("Current scheduled appointment")
    expect(html).toContain("Edit appointment")
    expect(html).toContain("Mark completed")
    expect(html).toContain("History")
    expect(html).toContain("Completed")
  })

  it("moves closed appointments out of the active block and keeps them in history", () => {
    const html = renderToStaticMarkup(
      <LeadAppointmentsPanel
        lead={buildLead({ pipelineStage: "ready_to_show" })}
        appointments={[
          buildAppointment({
            id: "appointment-2",
            status: "completed",
            date: "2026-04-18",
            startTime: "10:00:00"
          }),
          buildAppointment({
            id: "appointment-3",
            status: "cancelled",
            date: "2026-04-19",
            startTime: "11:00:00"
          })
        ]}
      />
    )

    expect(html).not.toContain("Current scheduled appointment")
    expect(html).toContain("History")
    expect(html).toContain("Completed")
    expect(html).toContain("Cancelled")
    expect(html).toContain("Create appointment")
  })
})
