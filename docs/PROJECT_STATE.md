# Project State

## Current Objective
Stabilize and extend the ShowReady MVP on a real Supabase runtime while preserving cross-thread continuity through repo-based memory files instead of chat history.

## Recently Completed
- Replaced the active mock-only runtime path with Supabase Auth + Postgres-backed app flows.
- Added Supabase SSR/browser/admin/proxy clients under `apps/web/lib/supabase`.
- Replaced custom cookie auth with Supabase session/user resolution and a real `/auth/callback` code exchange flow.
- Switched dashboard, leads, lead detail, settings saves, and agent API routes onto the Supabase data helper layer.
- Kept buyer intake behind Next.js route handlers while moving persistence to server-side Supabase operations.
- Replaced local SSE/EventEmitter refresh with Supabase Realtime table subscriptions in `LiveRefresh`.
- Updated the checked-in SQL migration and Drizzle schema with auth-owned agents, indexes, bootstrap trigger, and RLS policies.
- Added `apps/web/scripts/seed-supabase.ts` and Playwright global setup to seed the demo account plus sample leads in a real Supabase project.
- Connected the local app env to the Supabase project URL plus anon key in `.env.local` and applied `packages/db/migrations/0000_showready_phase1.sql` to the live Supabase project through MCP.
- Added the local `SUPABASE_SERVICE_ROLE_KEY` and verified the connection by successfully seeding the demo auth user plus sample data into the live Supabase project.
- Added the local `DATABASE_URL` connection string in `.env.local`, completing the repo's required Supabase env set for local tooling.
- Added `apps/web/.env.local` for Next.js runtime loading, fixed client-safe Supabase env access in `apps/web/lib/supabase/env.ts`, and updated Playwright global setup to load `.env.local` before seeding and smoke tests.
- Verified the public buyer intake path against the live Supabase project: magic-link page load, autosave POSTs, final submit, lead scoring, lead status/stage update, and the agent-facing dashboard/detail views reflecting the submitted intake.
- Installed local `psql`, verified direct CLI connectivity through the Supabase session pooler, and updated both local `DATABASE_URL` values to the working pooler connection string instead of the IPv6-only direct host.
- Ran the remaining quality/runtime checks: `lint`, `typecheck`, `test`, and `build` all passed; analytics and notification test routes degrade safely without external keys; a brand-new intake verified `moveReasons`, `offerReadiness`, and the custom question persist and render correctly on the agent lead detail page.
- Verified that Google OAuth now reaches the live Google Accounts sign-in page after the provider secrets were configured in Supabase.
- Expanded `AGENTS.md` into a more concrete workflow guide with explicit defaults, change-type playbooks, Supabase runtime invariants, a definition-of-done checklist, and required use of `ui-ux-pro-max` for UI/product work.
- Tightened the `AGENTS.md` documentation-maintenance rule so repo-memory updates are required after meaningful work that changes behavior, workflow, status, risks, blockers, or verification state, rather than after any trivial edit.

## Likely Active Files / Areas
- `proxy.ts`
- `apps/web/lib/actions.ts`
- `apps/web/lib/session.ts`
- `apps/web/lib/supabase/*`
- `apps/web/components/live-refresh.tsx`
- `apps/web/components/intake-form.tsx`
- `apps/web/app/auth/callback/route.ts`
- `packages/db/src/schema.ts`
- `packages/db/migrations/0000_showready_phase1.sql`
- `apps/web/scripts/seed-supabase.ts`

## Open Issues / Loose Ends
- Google OAuth has only been verified up to the Google Accounts sign-in page; a full callback completion with a real Google account was not exercised in this thread.
- Fresh email/password registration currently hits a Supabase-side `email rate limit exceeded` response, so self-serve registration could not be fully cleared during this run.
- Observability is still a console wrapper in `apps/web/lib/observability.ts`.
- Public token-based intake uses server-side admin-client validation rather than DB RPCs/security-definer SQL functions.
- The repo has no commits yet; history must be inferred from files and docs, not git.

## Risks / Fragile Areas
- The entire tree is still uncommitted.
- If the SQL migration drifts from the checked-in file, the app can diverge from the hand-written `Database` type and runtime assumptions.
- The demo seed and admin-backed flows depend on `SUPABASE_SERVICE_ROLE_KEY`; rotating or removing it locally will break those paths.
- RLS and auth trigger behavior are now part of the product contract; changes there can silently break onboarding or lead access.
- `packages/*/dist`, `.turbo/`, and `apps/web/.next/` are local build outputs, not source-of-truth files.

## Next-Thread Bootstrap Steps
1. Read `AGENTS.md`, `docs/PROJECT_STATE.md`, and `docs/DECISIONS.md`.
2. Run `git status`.
3. Verify whether the target Supabase project env vars are present locally.
4. Skim `README.md`, `proxy.ts`, `apps/web/lib/supabase`, and the closest app route files.
5. If the task involves real runtime verification, ensure the SQL migration has been applied and run `corepack pnpm --filter @showready/web seed:supabase`.

## How Future Codex Threads Should Start
- Start with `AGENTS.md`.
- Read `docs/PROJECT_STATE.md` and `docs/DECISIONS.md` before editing.
- Use repo files as the primary source of truth and this file as the rolling handoff summary.
- Update this file and `docs/CHANGELOG_AI.md` after meaningful work.

## Thread Context Captured
- This repository still has a single running line of Codex work, but the user wants future threads to recover context from repo files rather than chat memory.
- The first thread created the MVP scaffold and the repo-memory system.
- This thread replaced the active runtime with Supabase-only auth/data flows so the user can test with real clients.
- This thread also uncovered and fixed two runtime/test integration bugs: dynamic `process.env[name]` access broke client-side `NEXT_PUBLIC_*` resolution in Next.js, and Playwright global setup needed explicit `.env.local` loading.
- This thread verified both the agent-authenticated workflow and the public intake workflow on the live Supabase runtime.
- This thread also established that the remaining unverified areas are mostly external configuration constraints, not app runtime crashes: Google OAuth now reaches Google sign-in but still needs a full real-user callback verification, and Supabase auth email rate limits blocked repeated registration attempts.
- Future threads should not assume the old mock JSON store is still on the active request path.
