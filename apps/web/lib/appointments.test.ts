import { describe, expect, it } from "vitest"
import {
  canCreateAppointmentForLead,
  getAppointmentTabFromSearchParam,
  getStatusForAppointmentTab,
  normalizeShowingsInput
} from "./appointments"

describe("appointments helpers", () => {
  it("allows appointment creation only for reviewed active stages", () => {
    expect(canCreateAppointmentForLead("ready_to_show")).toBe(true)
    expect(canCreateAppointmentForLead("nurture")).toBe(true)
    expect(canCreateAppointmentForLead("hold")).toBe(true)

    expect(canCreateAppointmentForLead("new")).toBe(false)
    expect(canCreateAppointmentForLead("appointment_booked")).toBe(false)
    expect(canCreateAppointmentForLead("closed_won")).toBe(false)
    expect(canCreateAppointmentForLead("closed_lost")).toBe(false)
    expect(canCreateAppointmentForLead("archived")).toBe(false)
  })

  it("maps appointments page tabs to statuses with an upcoming default", () => {
    expect(getAppointmentTabFromSearchParam(undefined)).toBe("upcoming")
    expect(getAppointmentTabFromSearchParam("completed")).toBe("completed")
    expect(getAppointmentTabFromSearchParam("cancelled")).toBe("cancelled")
    expect(getAppointmentTabFromSearchParam("not-real")).toBe("upcoming")

    expect(getStatusForAppointmentTab("upcoming")).toBe("scheduled")
    expect(getStatusForAppointmentTab("completed")).toBe("completed")
    expect(getStatusForAppointmentTab("cancelled")).toBe("cancelled")
  })

  it("drops blank showings and rewrites the order index from the submitted order", () => {
    expect(
      normalizeShowingsInput([
        {
          address: "123 King St W",
          notes: "Front lockbox"
        },
        {
          address: "   ",
          notes: "Ignore blank rows"
        },
        {
          address: "456 Queen St E",
          notes: ""
        }
      ])
    ).toEqual([
      {
        address: "123 King St W",
        orderIndex: 0,
        notes: "Front lockbox"
      },
      {
        address: "456 Queen St E",
        orderIndex: 1,
        notes: undefined
      }
    ])
  })
})
