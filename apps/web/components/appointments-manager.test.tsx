import React, { type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Appointment } from "@showready/types"
import { AppointmentsManager } from "./appointments-manager"

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

describe("AppointmentsManager", () => {
  it("renders the tabbed appointments surface, create form, and appointment rows", () => {
    const html = renderToStaticMarkup(
      <AppointmentsManager
        tab="upcoming"
        appointments={[buildAppointment()]}
        counts={{
          upcoming: 1,
          completed: 2,
          cancelled: 1
        }}
        eligibleLeads={[
          {
            id: "lead-2",
            buyerName: "Jordan Lead",
            buyerEmail: "jordan@example.com",
            buyerPhone: "555-0202",
            pipelineStage: "ready_to_show"
          }
        ]}
        selectedLeadId="lead-2"
      />
    )

    expect(html).toContain("Appointment pulse")
    expect(html).toContain("Upcoming")
    expect(html).toContain("Completed")
    expect(html).toContain("Cancelled")
    expect(html).toContain("Create appointment")
    expect(html).toContain("Casey Buyer")
    expect(html).toContain("123 King St W")
    expect(html).toContain("Mark completed")
  })
})
