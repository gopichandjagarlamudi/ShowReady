import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const repairMigrationPath = path.resolve(
  __dirname,
  "../migrations/0003_repair_auth_user_scaffold.sql"
)

describe("auth user scaffold repair migration", () => {
  it("redefines handle_new_user with intake_type-aware template inserts", () => {
    const sql = readFileSync(repairMigrationPath, "utf8")

    expect(sql).toContain("create or replace function public.handle_new_user()")
    expect(sql).toContain("\"intake_type\"")
    expect(sql).toContain("'sale'")
    expect(sql).toContain("'rental'")
    expect(sql).toContain("on conflict (\"agent_id\", \"intake_type\") do nothing")
  })
})
