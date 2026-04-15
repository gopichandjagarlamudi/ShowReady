import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

let createAppointment: typeof import("./data").createAppointment
let getAnalyticsSummary: typeof import("./data").getAnalyticsSummary
let listLeadIdsWithScheduledAppointments: typeof import("./data").listLeadIdsWithScheduledAppointments
let updateAppointmentStatus: typeof import("./data").updateAppointmentStatus

beforeAll(async () => {
  const dataModule = await import("./data")
  createAppointment = dataModule.createAppointment
  getAnalyticsSummary = dataModule.getAnalyticsSummary
  listLeadIdsWithScheduledAppointments = dataModule.listLeadIdsWithScheduledAppointments
  updateAppointmentStatus = dataModule.updateAppointmentStatus
})

function buildLeadRow(pipelineStage: "ready_to_show" | "nurture" | "hold" | "appointment_booked" = "ready_to_show") {
  return {
    id: "lead-1",
    agent_id: "agent-1",
    intake_type: "sale",
    buyer_name: "Casey Buyer",
    buyer_phone: "555-0101",
    buyer_email: "casey@example.com",
    token: "token-1",
    token_expires_at: "2026-04-20T12:00:00.000Z",
    status: "submitted",
    pipeline_stage: pipelineStage,
    submitted_at: "2026-04-08T12:00:00.000Z",
    score: 8.4,
    recommendation: "show",
    summary: "Pre-approved and moving soon.",
    created_at: "2026-04-08T11:00:00.000Z",
    updated_at: "2026-04-08T12:30:00.000Z",
    reviewed_at: "2026-04-08T12:35:00.000Z",
    reviewed_stage: pipelineStage
  }
}

function buildAppointmentRow(status: "scheduled" | "completed" | "cancelled" = "scheduled") {
  return {
    id: "appointment-1",
    lead_id: "lead-1",
    date: "2026-04-22",
    start_time: "14:30:00",
    status,
    notes: "Meet in the lobby before the first stop.",
    created_at: "2026-04-20T10:00:00.000Z"
  }
}

function buildShowingRows() {
  return [
    {
      id: "showing-1",
      appointment_id: "appointment-1",
      address: "123 King St W",
      order_index: 0,
      notes: "Front desk sign-in"
    }
  ]
}

function createMockClient({
  leadRow = buildLeadRow(),
  existingScheduled = null as null | ReturnType<typeof buildAppointmentRow>,
  appointmentRow = buildAppointmentRow(),
  showingRows = buildShowingRows()
} = {}) {
  const insertedAppointments: Record<string, unknown>[] = []
  const insertedShowings: Record<string, unknown>[] = []
  const appointmentUpdates: Record<string, unknown>[] = []
  const leadUpdates: Record<string, unknown>[] = []

  const handlers = {
    leads: {
      select: () => ({
        eq() {
          return this
        },
        maybeSingle: async () => ({
          data: leadRow,
          error: null
        })
      }),
      update: (payload: Record<string, unknown>) => {
        leadUpdates.push(payload)

        return {
          eq() {
            return this
          },
          select() {
            return this
          },
          single: async () => ({
            data: {
              ...leadRow,
              ...payload
            },
            error: null
          })
        }
      }
    },
    appointments: {
      select: () => {
        const state: Record<string, unknown> = {}

        return {
          eq(column: string, value: unknown) {
            state[column] = value
            return this
          },
          maybeSingle: async () => {
            if (state.lead_id) {
              return {
                data: existingScheduled,
                error: null
              }
            }

            return {
              data: appointmentRow,
              error: null
            }
          }
        }
      },
      insert: (payload: Record<string, unknown>) => {
        insertedAppointments.push(payload)

        return {
          select() {
            return this
          },
          single: async () => ({
            data: appointmentRow,
            error: null
          })
        }
      },
      update: (payload: Record<string, unknown>) => {
        appointmentUpdates.push(payload)

        return {
          eq() {
            return this
          },
          select() {
            return this
          },
          single: async () => ({
            data: {
              ...appointmentRow,
              ...payload
            },
            error: null
          })
        }
      }
    },
    showings: {
      insert: async (payload: Record<string, unknown>[]) => {
        insertedShowings.push(...payload)
        return { error: null }
      },
      select: () => ({
        eq() {
          return this
        },
        order: async () => ({
          data: showingRows,
          error: null
        })
      })
    }
  }

  return {
    client: {
      from(table: keyof typeof handlers) {
        return handlers[table]
      }
    } as any,
    insertedAppointments,
    insertedShowings,
    appointmentUpdates,
    leadUpdates,
    leadRow,
    appointmentRow
  }
}

describe("appointment data helpers", () => {
  it("creates an appointment without changing the lead pipeline stage", async () => {
    const { client, leadUpdates, leadRow, insertedAppointments, insertedShowings } = createMockClient({
      leadRow: buildLeadRow("nurture")
    })

    const appointment = await createAppointment(client, "agent-1", {
      leadId: "lead-1",
      date: "2026-04-22",
      startTime: "14:30:00",
      notes: "Meet in the lobby before the first stop.",
      showings: [{ address: "123 King St W", notes: "Front desk sign-in" }]
    })

    expect(leadUpdates).toEqual([])
    expect(insertedAppointments).toHaveLength(1)
    expect(insertedShowings).toHaveLength(1)
    expect(appointment.lead.pipelineStage).toBe("nurture")
    expect(leadRow.pipeline_stage).toBe("nurture")
  })

  it("updates appointment status without restoring or changing the lead pipeline stage", async () => {
    const { client, leadUpdates, appointmentUpdates } = createMockClient({
      leadRow: buildLeadRow("hold"),
      appointmentRow: buildAppointmentRow("scheduled")
    })

    const appointment = await updateAppointmentStatus(client, "agent-1", "appointment-1", "completed")

    expect(appointmentUpdates).toEqual([{ status: "completed" }])
    expect(leadUpdates).toEqual([])
    expect(appointment.status).toBe("completed")
    expect(appointment.lead.pipelineStage).toBe("hold")
  })

  it("lists lead ids that currently have scheduled appointments", async () => {
    const client = {
      from(table: string) {
        if (table === "appointments") {
          return {
            select() {
              return this
            },
            eq() {
              return this
            },
            in() {
              return this
            },
            order: async () => ({
              data: [
                { lead_id: "lead-ready" },
                { lead_id: "lead-ready" },
                { lead_id: "lead-hold" }
              ],
              error: null
            })
          }
        }

        if (table === "leads") {
          return {
            select() {
              return this
            },
            eq: async () => ({
              data: [{ id: "lead-ready" }, { id: "lead-hold" }],
              error: null
            })
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }
    } as any

    await expect(listLeadIdsWithScheduledAppointments(client, "agent-1")).resolves.toEqual([
      "lead-ready",
      "lead-hold"
    ])
  })

  it("counts active scheduled appointments alongside legacy appointment_booked leads", async () => {
    const client = {
      from(table: string) {
        if (table === "leads") {
          return {
            select() {
              return this
            },
            eq: async () => ({
              data: [
                { id: "lead-ready", pipeline_stage: "ready_to_show", score: 9 },
                { id: "lead-booked", pipeline_stage: "appointment_booked", score: 8 },
                { id: "lead-hold", pipeline_stage: "hold", score: 7 }
              ],
              error: null
            })
          }
        }

        if (table === "appointments") {
          return {
            select() {
              return this
            },
            eq() {
              return this
            },
            in() {
              return this
            },
            order: async () => ({
              data: [
                { lead_id: "lead-ready" },
                { lead_id: "lead-booked" }
              ],
              error: null
            })
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }
    } as any

    await expect(getAnalyticsSummary(client, "agent-1")).resolves.toMatchObject({
      appointmentBooked: 2
    })
  })
})
