# AI Changelog

## 2026-03-28
- Created `AGENTS.md` and the `docs/` memory set: `ARCHITECTURE.md`, `PROJECT_STATE.md`, `DECISIONS.md`, and `CHANGELOG_AI.md`.
- Captured the current uncommitted MVP state, active architecture, repo conventions, known gaps, and the purpose of repo-based continuity for future Codex threads.
- Recorded that this repository currently has a single Codex thread and that future thread recovery should come from repo docs rather than old chat history.
- Replaced the active mock runtime assumptions in the docs with the new Supabase-only auth/data architecture.
- Added documented setup for the Supabase migration, demo seed script, real auth callback flow, and Realtime-backed dashboard refresh.
- Added a local `.env.local` wired to the current Supabase project URL plus anon key and applied the checked-in phase-1 SQL migration to the MCP-connected Supabase project.
- Added the local service-role key and verified the real Supabase connection by running the seed script successfully against the live project.
- Added the local `DATABASE_URL` so the repo now has the full required Supabase env set for runtime plus migration tooling.
- Fixed `apps/web/lib/supabase/env.ts` to use client-safe static `NEXT_PUBLIC_*` reads for Next.js, added `apps/web/.env.local` for app runtime loading, and updated Playwright global setup to load `.env.local` before smoke tests.
- Verified the real runtime end to end: demo login, dashboard render from Supabase data, lead creation persisted to Supabase, lead detail render, logout, and the Playwright smoke spec passing.
- Verified the public intake flow on the live Supabase runtime: magic-link load, autosave requests, final submit to `/api/intake/[token]/submit`, score creation, `leads` status/stage update, and the submitted lead surfacing correctly in the agent dashboard and lead detail page.
- Installed local `psql`, verified Supabase CLI connectivity through the session pooler with a live SQL query, and updated the repo-local `DATABASE_URL` values to the working pooler connection string.
- Ran the remaining quality gates and runtime checks: `lint`, `typecheck`, `test`, and `build` all passed; the clean intake case persisted `moveReasons`, `offerReadiness`, and `custom-1`; analytics and notification endpoints behaved correctly without optional provider keys.
- Confirmed the two remaining blockers are external Supabase configuration states rather than app code failures: Google OAuth is missing provider secrets and repeated email registration attempts are currently rate-limited by Supabase Auth.
- Updated `AGENTS.md` to require the `test-driven-development` skill for implementation changes and the `writing-plans` skill for multi-step feature work.
- Verified that Google OAuth now reaches the live Google Accounts sign-in page after the Supabase provider secrets were configured.
- Expanded `AGENTS.md` into a more concrete workflow guide with explicit workflow defaults, change-type playbooks, Supabase invariants, a definition-of-done checklist, and a required `ui-ux-pro-max` trigger for UI/product work.
- Tightened the `AGENTS.md` memory-update rule so future threads only update `PROJECT_STATE.md` and `CHANGELOG_AI.md` after meaningful changes to behavior, workflow, status, risks, blockers, or verification state.
