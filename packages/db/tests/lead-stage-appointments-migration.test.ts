import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const migrationPath = path.resolve(
  __dirname,
  "../migrations/0005_lead_stage_refresh_and_appointments.sql"
)

describe("lead stage refresh and appointments migration", () => {
  it("migrates the lead stage enum and creates appointments/showings", () => {
    const sql = readFileSync(migrationPath, "utf8")

    expect(sql).toContain("'ready_to_show'")
    expect(sql).toContain("'appointment_booked'")
    expect(sql).toContain("'closed_won'")
    expect(sql).toContain("'closed_lost'")
    expect(sql).toContain("'archived'")
    expect(sql).toContain("update public.leads")
    expect(sql).toContain("when 'ready' then 'ready_to_show'")
    expect(sql).toContain("when 'closed' then 'archived'")
    expect(sql).toContain("add column if not exists \"reviewed_stage\"")
    expect(sql).toContain("add column if not exists \"reviewed_at\"")
    expect(sql).toContain("create table if not exists \"appointments\"")
    expect(sql).toContain("create table if not exists \"showings\"")
    expect(sql).toContain("check (\"status\" in ('scheduled', 'completed', 'cancelled'))")
    expect(sql).toContain("where \"status\" = 'scheduled'")
    expect(sql).toContain("(\"appointment_id\", \"order_index\")")
  })
})
