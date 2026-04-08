# Project State

## Current Objective
Stabilize and extend the ShowReady MVP on a real Supabase runtime while preserving cross-thread continuity through repo-based memory files instead of chat history.

## Recently Completed
- Fixed the Vercel production build break caused by the legacy `packages/db/src/mock-store.ts` file: `@showready/db` no longer exports or compiles that dead mock runtime path, so `turbo run build` no longer fails on removed `@showready/types` exports during the Vercel build bootstrap.
- Reproduced the remote failure from the Vercel CLI logs, then re-verified the repaired build path locally with `corepack pnpm --filter @showready/db build`, `corepack pnpm typecheck`, and `corepack pnpm --filter @showready/web build`.
- Fixed the lead detail stage controls so the page now derives manual move targets from a shared helper, excludes the lead's current stage from the action list, keeps `new` out of the manual destination set, and allows `closed` leads to reopen back into `ready`, `nurture`, or `hold`.
- Added `apps/web/lib/lead-stage.ts` plus focused coverage in `apps/web/lib/lead-stage.test.ts`, then verified the transition rules with `corepack pnpm --filter @showready/web test -- lib/lead-stage.test.ts` and `corepack pnpm --filter @showready/web typecheck`.
- Reworked the `/leads` page into a stage-grouped pipeline surface: the existing `ready`, `nurture`, `hold`, `new`, and `closed` stages now render as stacked sections with counts, descriptive sublabels, empty states, and stage-aware visual treatment instead of one undifferentiated card grid.
- Updated the leads UI presentation so `ready` is now labeled `Ready to show` throughout the leads page while preserving the underlying stage contract, selection model, delete actions, and detail links.
- Added focused UI coverage in `apps/web/components/leads-manager.test.tsx` and expanded `apps/web/vitest.config.ts` to support `@/` alias resolution plus JSX component tests, then verified the grouped leads page with the targeted Vitest run, web typecheck, and local desktop/mobile browser checks on `/leads`.
- Made the dashboard generated-link panel resilient to action redirect issues by falling back to the newest non-converted invite from the database, so the launcher can still show a copyable active invite link even if the `?invite=` query param does not come back after creation.
- Tightened the agent lead-management surfaces again: the dashboard invite launcher now renders a dedicated `Generated link` panel with copy-ready messaging, `/leads` now shows only real leads instead of open invites, and agents can now delete leads with confirmation either one at a time or in bulk from the leads page.
- Cleaned up the dashboard invite presentation so newly generated links now stay only inside the invite launcher result area instead of also showing up as `Unnamed invite` cards on the dashboard; open invite tracking remains on `/leads`, while completed submissions still surface under dashboard `Recent leads`.
- Replaced the old lead-first magic-link launcher with an invite-first flow: agents now generate standalone invite links from the dashboard, no lead row is created up front, and the public intake creates/converts the lead only after the recipient enters contact details plus buy/rent intent.
- Added invite persistence across the shared type system, Supabase database contract, and runtime data layer: `packages/types/src/index.ts` now models invite status plus explicit buyer/rental questionnaire drafts, `packages/db/src/schema.ts` and `packages/db/migrations/0000_showready_phase1.sql` now include the `invites` table and `invite_status` enum, and `packages/db/migrations/0002_magic_link_invites.sql` was applied to the connected Supabase project.
- Reworked the public intake experience around the new product structure in `apps/web/components/intake-form.tsx`: intro screen, contact capture, buy-vs-rent branch, fixed required buyer/rental questions, optional refinement questions, capped custom questions, mobile one-question flow, progress bar, and final completion state.
- Replaced the old shared intake-answer/scoring assumptions with branch-specific contracts and scoring: `@showready/types` now exposes explicit buyer/rental answer shapes and helpers, and `@showready/scoring` now computes score, recommendation, summary, and next action directly from the new questionnaires instead of the previous legacy answer map.
- Updated the server routes and Supabase data helpers so autosave and submit work against invite tokens rather than precreated leads, create the lead only when contact plus intent exist, persist draft answers consistently, and reject invalid/expired/already-converted invite paths.
- Updated the dashboard and lead-management surfaces so the dashboard generates and lists invite links, the leads index shows open invites separately from submitted leads, and lead detail renders the new structured buyer/rental answers instead of the old generic readiness field set.
- Reworked the Supabase seed path to create converted invites for seeded leads plus fresh open invite tokens for buyer/rental browser verification, and added new tests covering the draft helpers, intake config, shared types, new scoring logic, and public invite flows.
- Verified the redesign with `corepack pnpm --filter @showready/types test -- tests/intake.test.ts`, `corepack pnpm --filter @showready/scoring test -- tests/index.test.ts`, `corepack pnpm --filter @showready/web test -- lib/intake-draft.test.ts lib/intake-config.test.ts lib/intake-guards.test.ts`, `corepack pnpm --filter @showready/web typecheck`, `psql "$DATABASE_URL" -f packages/db/migrations/0002_magic_link_invites.sql`, `corepack pnpm --filter @showready/web seed:supabase`, and `corepack pnpm --filter @showready/web test:e2e -- tests/e2e/invite-flow.spec.ts`.
- Connected the existing Vercel `showready` project directly to the GitHub repository `gopichandjagarlamudi/ShowReady`, with `master` configured as the production branch so future Git pushes can trigger Vercel deployments without the manual CLI deploy path.
- Fixed the Vercel monorepo deployment path for the existing `showready` project by updating the remote project root to `apps/web`, enabling source files outside the root directory, adding a repo `.vercelignore`, and linking the local checkout to that project instead of relying on a temporary standalone bundle.
- Added explicit monorepo root config in `apps/web/next.config.ts` (`turbopack.root` and `outputFileTracingRoot`) so local and Vercel Next.js 16/Turbopack builds resolve workspace packages from the repo root consistently.
- Declared the missing `@showready/scoring` workspace dependency in `packages/db/package.json`, refreshed `pnpm-lock.yaml`, and verified the previously failing remote build path now succeeds.
- Re-ran `corepack pnpm --filter @showready/db build`, `corepack pnpm --filter @showready/web typecheck`, and `corepack pnpm --filter @showready/web build` successfully, then deployed a fresh preview to `https://showready-1u87krowa-jagarlamudigopichand99-4818s-projects.vercel.app`.
- Cleaned up the public landing page so the homepage now uses a more disciplined four-part flow: compact header, tighter hero, one product preview, one concise proof row, and a short closing CTA instead of multiple overlapping benefit sections.
- Reduced the landing-page copy and repositioned the messaging toward a calmer product promise, removing the hero demo CTA, the hero metric cards, and duplicate lower-page explanation blocks while keeping the existing editorial-light token system.
- Updated `apps/web/tests/e2e/smoke.spec.ts` to verify the streamlined landing-page structure and header-to-login navigation, then browser-checked the homepage on local desktop and mobile layouts and re-ran `corepack pnpm --filter @showready/web test:e2e -- tests/e2e/smoke.spec.ts` successfully.
- Cleaned up the auth entry screens so register/login now use more restrained copy, tighter card spacing, and a parallel Google-plus-email hierarchy instead of a more salesy headline-first layout.
- Added a browser regression in `apps/web/tests/e2e/auth.spec.ts` that checks the simplified auth copy, the Google-first-with-divider structure, and the preserved cross-link paths between `/register` and `/login`.
- Verified the refreshed auth screens in the browser on local desktop and mobile layouts, and re-ran `corepack pnpm --filter @showready/web test:e2e -- tests/e2e/auth.spec.ts` successfully.
- Added sale and rental intake support end to end: leads now persist a locked `intakeType`, agents now get separate sale and rental question templates, the dashboard lead launcher lets agents choose the questionnaire before creating a magic link, settings now switch between sale/rental template editing, and lead detail now shows which questionnaire a lead was sent.
- Split the shared intake contract into type-aware question/template helpers, keeping the existing scoring engine intact while rendering rental-specific copy and options through the same `IntakeAnswers` scoring shape.
- Updated the Supabase contract for fresh installs in `packages/db/migrations/0000_showready_phase1.sql`, added an incremental runtime upgrade in `packages/db/migrations/0001_sale_rental_intake.sql`, and applied that incremental migration to the connected Supabase project so local seeding and browser verification work against the new `intake_type` columns.
- Added `apps/web/lib/intake-config.ts` plus `apps/web/lib/intake-config.test.ts`, updated the Supabase seed to create both template types and a seeded rental lead, and added `apps/web/tests/e2e/intake-type.spec.ts` to verify the public intake page renders the correct sale vs rental questionnaire copy for seeded links.
- Re-ran `corepack pnpm test`, `corepack pnpm typecheck`, `corepack pnpm build`, `corepack pnpm --filter @showready/web test:e2e -- tests/e2e/intake-type.spec.ts`, and `psql "$DATABASE_URL" -f packages/db/migrations/0001_sale_rental_intake.sql` successfully.
- Closed three review gaps in the current auth/intake implementation: the auth callback now sanitizes the `next` redirect target to internal app paths only, public intake autosave/submit now reject already-submitted leads, and required multi-select answers now fail validation when emptied out.
- Added focused Vitest regressions in `apps/web/lib/auth-url.test.ts` and new `apps/web/lib/intake-guards.test.ts`, then re-ran the targeted auth/intake tests plus `corepack pnpm --filter @showready/web typecheck` successfully.
- Verified the live production auth flows after email confirmation was disabled in Supabase: a new email/password account was created on `showready-jet.vercel.app`, immediately landed on `/settings?onboarding=1`, then signed out and signed back in successfully with the same credentials.
- Verified that production Google OAuth now hands off cleanly to Google Accounts from `showready-jet.vercel.app/login`; the browser reaches the Google sign-in screen with `redirect_to=https://showready-jet.vercel.app/auth/callback`, confirming the callback URL normalization fix is active on the public domain.
- Promoted the current auth-fix build to Vercel production; `showready-jet.vercel.app` now points at deployment `showready-lezzp3k29-jagarlamudigopichand99-4818s-projects`, so Google OAuth can be tested on the public domain without preview protection in the path.
- Reworked auth page submission to use explicit `/auth/login`, `/auth/register`, and `/auth/google` route handlers instead of server-action forms, added share-aware auth URL helpers, and preserved preview bypass tokens through auth callback and redirect path generation in code.
- Added preview-auth regressions in `apps/web/lib/auth-url.test.ts` and `apps/web/tests/e2e/auth-share.spec.ts`, then verified the share-token path locally in production mode: `/register?_vercel_share=test-share` now posts cleanly and redirects back with the same token instead of crashing.
- Traced the current auth failures to two separate causes: the deployed Google OAuth redirect URL was being built from a whitespace-tainted `NEXT_PUBLIC_APP_URL`, and fresh email/password registration is currently blocked upstream by Supabase Auth's `over_email_send_rate_limit` response.
- Fixed `apps/web/lib/utils.ts` so `buildAppUrl()` trims surrounding whitespace and trailing slashes before composing callback URLs, preventing malformed `%0A/auth/callback` redirects for both Google OAuth and email-confirmation links.
- Updated the register page to translate known Supabase auth failures into actionable guidance, steering users toward Google sign-in when email signup is temporarily rate-limited and clarifying that reserved example domains are rejected.
- Added auth regressions in `apps/web/lib/utils.test.ts` and `apps/web/tests/e2e/auth.spec.ts`, then re-ran `typecheck` plus the auth and smoke Playwright specs successfully.
- Deployed the app to a live Vercel project named `showready` under the `jagarlamudigopichand99-4818s-projects` team using a temporary standalone staging bundle that preserved the app, proxy, workspace packages, and required env wiring.
- Persisted the required production env vars in the Vercel project (`NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `POSTHOG_HOST`) and redeployed so the live build no longer depends on one-off CLI flags.
- Verified the live Vercel deployment renders the public homepage at `https://showready-jet.vercel.app`.
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
- `apps/web/components/leads-manager.tsx`
- `apps/web/components/leads-manager.test.tsx`
- `apps/web/vitest.config.ts`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/intake/[token]/page.tsx`
- `apps/web/app/api/intake/[token]/*`
- `apps/web/app/leads/page.tsx`
- `apps/web/app/leads/[leadId]/page.tsx`
- `apps/web/lib/intake-draft.ts`
- `apps/web/app/page.tsx`
- `apps/web/lib/intake-config.ts`
- `apps/web/lib/auth-url.ts`
- `apps/web/app/(auth)/register/page.tsx`
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/lib/intake-guards.ts`
- `proxy.ts`
- `apps/web/lib/actions.ts`
- `apps/web/lib/session.ts`
- `apps/web/lib/supabase/*`
- `apps/web/components/live-refresh.tsx`
- `apps/web/components/intake-form.tsx`
- `apps/web/app/auth/callback/route.ts`
- `packages/db/src/schema.ts`
- `packages/db/migrations/0000_showready_phase1.sql`
- `packages/db/migrations/0001_sale_rental_intake.sql`
- `packages/db/migrations/0002_magic_link_invites.sql`
- `packages/types/src/index.ts`
- `packages/scoring/src/index.ts`
- `apps/web/scripts/seed-supabase.ts`

## Open Issues / Loose Ends
- Browser verification of the local agent-authenticated dashboard and lead-detail surfaces is still blocked by the current `/auth/login` redirect bounce back to `/login`; the new lead-detail stage-control change was verified with targeted Vitest coverage and typecheck only, while `apps/web/tests/e2e/dashboard-invite.spec.ts` remains skipped until the local auth redirect loop is fixed or replaced with a reliable authenticated setup path.
- Preview deployments protected by Vercel Authentication still return `HTTP 500` on browser `POST /auth/register` before runtime code executes, even after the app-side share-token preservation fix; this appears to be a platform protection constraint rather than an app runtime exception.
- Google OAuth reaches the live Google sign-in screen with the correct production callback, but a full callback completion still requires entering a real Google account in the browser.
- Email/password signup now works on production while Supabase email confirmation remains disabled; if confirmations are re-enabled, the previous email-send rate-limit constraint is expected to return unless Auth email delivery is reconfigured.
- Observability is still a console wrapper in `apps/web/lib/observability.ts`.
- Public invite-based intake still uses server-side admin-client validation/mutations rather than DB RPCs or security-definer SQL functions.
- The new auth redirect and intake-mutability protections currently have unit coverage only; there is still no browser-level regression that exercises a rejected resubmission or a malicious callback `next` value end to end.
- The repo has no commits yet; history must be inferred from files and docs, not git.

## Risks / Fragile Areas
- The entire tree is still uncommitted.
- The active Vercel project now builds from `apps/web` with source files outside the root enabled; future deployment changes should preserve that monorepo setting or Vercel will regress to failing Next.js/Turbopack root resolution.
- Automatic Vercel deploys now depend on the Vercel GitHub app retaining access to `gopichandjagarlamudi/ShowReady`; removing that repo access will silently break push-triggered deployments.
- If the SQL migration drifts from the checked-in file, the app can diverge from the hand-written `Database` type and runtime assumptions.
- The demo seed and admin-backed flows depend on `SUPABASE_SERVICE_ROLE_KEY`; rotating or removing it locally will break those paths.
- RLS and auth trigger behavior are now part of the product contract; changes there can silently break onboarding or lead access.
- Invite conversion now spans `invites`, `leads`, `lead_answers`, and `lead_scores`; partial regressions in that path can leave an invite opened but not converted unless autosave/submit guards stay aligned.
- Deleting a lead now also deletes any converted invite rows pointing at that lead; if invite retention becomes a reporting requirement later, that delete behavior will need to be revisited deliberately.
- `packages/*/dist`, `.turbo/`, and `apps/web/.next/` are local build outputs, not source-of-truth files.

## Next-Thread Bootstrap Steps
1. Read `AGENTS.md`, `docs/PROJECT_STATE.md`, and `docs/DECISIONS.md`.
2. Run `git status`.
3. Verify whether the target Supabase project env vars are present locally.
4. Skim `README.md`, `proxy.ts`, `apps/web/lib/intake-config.ts`, `apps/web/lib/supabase`, and the closest app route files.
5. If the task involves real runtime verification, ensure `packages/db/migrations/0000_showready_phase1.sql`, `packages/db/migrations/0001_sale_rental_intake.sql`, and `packages/db/migrations/0002_magic_link_invites.sql` have been applied, then run `corepack pnpm --filter @showready/web seed:supabase`.

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
- This thread also found and fixed a production-facing auth URL bug: `NEXT_PUBLIC_APP_URL` can arrive with trailing whitespace, which previously produced malformed OAuth/email callback URLs until `buildAppUrl()` was normalized.
- This thread also established that preview-protected Vercel deployments are not currently a trustworthy verification surface for the email signup POST itself: the platform returns `500` on `POST /auth/register` before app runtime logs appear, while the same code path behaves correctly in local production mode.
- This thread also promoted the auth-fix bundle to the public production alias so the remaining Google OAuth verification can happen on `showready-jet.vercel.app` instead of a Vercel-auth-protected preview deployment.
- This thread also confirmed that disabling Supabase email confirmations immediately unblocked production self-serve signup, while Google OAuth on the same deployment now reaches Google with the expected `/auth/callback` redirect target.
- This thread also replaced the dashboard lead-creation assumption with the invite-first intake architecture, rewired autosave/submit around invite conversion, and verified the buyer and rental public invite flows end to end in Playwright after reseeding the Supabase demo data.
- Future threads should not assume the old mock JSON store is still on the active request path.
