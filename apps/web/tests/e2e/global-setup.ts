import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import type { FullConfig } from "@playwright/test"

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local")
  const contents = readFileSync(envPath, "utf8")

  for (const line of contents.split("\n")) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separatorIndex = trimmed.indexOf("=")

    if (separatorIndex < 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith("\"") && value.endsWith("\""))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

export default function globalSetup(_config: FullConfig) {
  loadLocalEnv()

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  ]
  const missing = required.filter((name) => !process.env[name])

  if (missing.length > 0) {
    throw new Error(
      `Playwright e2e requires Supabase env vars: ${missing.join(", ")}`
    )
  }

  execFileSync("corepack", ["pnpm", "--filter", "@showready/web", "seed:supabase"], {
    stdio: "inherit"
  })
}
