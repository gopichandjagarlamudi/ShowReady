# AI Changelog

## 2026-04-07
- Reworked `apps/web/app/page.tsx` into a more professional landing page with a tighter hero, no hero demo CTA, one preview card, one concise proof row, and a compact closing CTA while preserving the existing editorial-light design tokens.
- Updated `apps/web/tests/e2e/smoke.spec.ts` so it now checks the streamlined homepage structure and the landing-page sign-in navigation rather than the separately unstable local dashboard-login browser path, then verified the change with `corepack pnpm --filter @showready/web test:e2e -- tests/e2e/smoke.spec.ts`.
- Cleaned up `apps/web/app/(auth)/register/page.tsx` and `apps/web/app/(auth)/login/page.tsx` so both auth screens now use shorter, more professional copy, tighter card spacing, quieter status banners, and a shared Google-first plus email-divider action structure.
- Expanded `apps/web/tests/e2e/auth.spec.ts` with a browser regression for the simplified auth copy and parallel signup layout, then re-ran `corepack pnpm --filter @showready/web test:e2e -- tests/e2e/auth.spec.ts` successfully.
- Added lead-level sale/rental intake support across the shared types, Supabase data layer, dashboard lead launcher, settings template editor, lead detail page, seed data, and public intake rendering so each magic link stays locked to the questionnaire type chosen at lead creation.
- Added `apps/web/lib/intake-config.ts` and `apps/web/lib/intake-config.test.ts` to centralize sale/rental question selection, template defaults, and template resolution, while keeping the existing scoring engine unchanged.
- Updated the fresh-install SQL in `packages/db/migrations/0000_showready_phase1.sql`, added the incremental upgrade script `packages/db/migrations/0001_sale_rental_intake.sql`, and applied that incremental migration to the connected Supabase project so the new `intake_type` columns exist in the active runtime.
- Added `apps/web/tests/e2e/intake-type.spec.ts` and verified the new seeded sale/rental public intake rendering with `corepack pnpm --filter @showready/web test:e2e -- tests/e2e/intake-type.spec.ts`.
- Re-ran `corepack pnpm test`, `corepack pnpm typecheck`, and `corepack pnpm build` after the intake-type changes; all passed.
- Fixed the auth callback redirect handling so `/auth/callback` now sanitizes `next` and only redirects to internal app paths, closing the open-redirect gap identified in review.
- Added `apps/web/lib/intake-guards.ts` and wired it into `apps/web/lib/supabase/data.ts` so submitted intake links can no longer be autosaved or resubmitted, and required multi-select answers now reject empty arrays instead of silently passing validation.
- Added focused regressions in `apps/web/lib/auth-url.test.ts` and `apps/web/lib/intake-guards.test.ts`, then verified the fix set with `corepack pnpm --filter @showready/web test -- apps/web/lib/auth-url.test.ts apps/web/lib/intake-guards.test.ts apps/web/lib/utils.test.ts` and `corepack pnpm --filter @showready/web typecheck`.

## 2026-03-29
- Verified the live production auth flows after disabling Supabase email confirmations: a fresh email/password signup on `showready-jet.vercel.app` succeeded, landed on `/settings?onboarding=1`, and the same credentials then signed back in successfully; Google OAuth on production now reaches Google Accounts with `redirect_to=https://showready-jet.vercel.app/auth/callback`.
- Promoted the current auth-fix bundle to Vercel production; `showready-jet.vercel.app` now aliases deployment `showready-lezzp3k29-jagarlamudigopichand99-4818s-projects`, which removes preview protection from the Google OAuth verification path.
- Reworked auth page submission to use explicit `/auth/login`, `/auth/register`, and `/auth/google` route handlers plus new `apps/web/lib/auth-url.ts` / `apps/web/lib/auth-flow.ts` helpers so auth redirects, callback URLs, and preview-share paths are constructed consistently.
- Added `apps/web/lib/auth-url.test.ts` and `apps/web/tests/e2e/auth-share.spec.ts`, then verified locally in production mode that `/register?_vercel_share=test-share` posts and redirects without crashing.
- Re-deployed fresh preview bundles while debugging and confirmed that Vercel-auth-protected previews still return `HTTP 500` on `POST /auth/register` before app runtime logs appear, so preview deployment protection remains an external blocker for email-signup verification even though the local production path is fixed.
- Reproduced the current auth failures and confirmed they split cleanly: Google OAuth was building a malformed callback URL from a whitespace-tainted `NEXT_PUBLIC_APP_URL`, while email/password signup was failing upstream with Supabase Auth's `over_email_send_rate_limit`.
- Fixed `apps/web/lib/utils.ts` so auth callback URLs trim surrounding whitespace and trailing slashes before composing `/auth/callback`, preventing `%0A/auth/callback` redirects on the deployed site once a new build is shipped.
- Updated `apps/web/app/(auth)/register/page.tsx` so known Supabase signup failures show actionable fallback guidance instead of raw provider strings.
- Added `apps/web/lib/utils.test.ts` and `apps/web/tests/e2e/auth.spec.ts`, then verified the change with `corepack pnpm --filter @showready/web test -- lib/utils.test.ts`, `corepack pnpm --filter @showready/web test:e2e tests/e2e/auth.spec.ts`, `corepack pnpm --filter @showready/web test:e2e tests/e2e/smoke.spec.ts`, and `corepack pnpm --filter @showready/web typecheck`.

## 2026-03-28
- Created a live Vercel project named `showready`, saved the required production env vars there, and redeployed the app successfully to `https://showready-jet.vercel.app`.
- Verified the deployed Vercel site serves the public ShowReady homepage in the browser.
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
