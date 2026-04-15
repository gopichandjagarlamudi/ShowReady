# Project State

## Current Objective
Stabilize and extend the ShowReady MVP on a real Supabase runtime while preserving cross-thread continuity through repo-based memory files instead of chat history.

## Recently Completed
- Kept appointment actions stage-neutral while also restoring the legacy `Appointment booked` surfaces as a derived overlay: `apps/web/app/leads/page.tsx`, `apps/web/components/leads-manager.tsx`, and `apps/web/lib/supabase/data.ts` now union legacy `appointment_booked` leads with leads that currently have a scheduled appointment, dedupe by `lead.id`, and keep the card badge/category controls tied to the lead's real stored stage.
- Updated dashboard analytics so `appointmentBooked` now counts both legacy `appointment_booked` leads and active scheduled appointments, and forced `/dashboard` plus `/leads` dynamic so those authenticated board/count surfaces stay live against Supabase-backed appointment changes.
- Changed appointment behavior so new appointment actions no longer own lead categorization: `apps/web/lib/supabase/data.ts` now creates scheduled appointments without writing `lead.pipeline_stage`, and appointment completion/cancellation remains appointment-only while the lead keeps its existing manual category.
- Added `apps/web/lib/supabase/data.appointments.test.ts` to lock the data-layer contract that appointment creation and status changes leave `ready_to_show` / `nurture` / `hold` leads in place, and expanded `apps/web/components/lead-appointments-panel.test.tsx` so only scheduled appointments render in the active lead-detail appointment block while completed/cancelled records stay in history.
- Added/expanded focused regressions in `apps/web/lib/supabase/data.appointments.test.ts` and `apps/web/components/leads-manager.test.tsx` for the overlay bucket, then re-verified with `corepack pnpm --filter @showready/web test -- lib/supabase/data.appointments.test.ts components/lead-appointments-panel.test.tsx components/appointments-manager.test.tsx components/leads-manager.test.tsx lib/appointments.test.ts lib/lead-stage.test.ts`, `corepack pnpm --filter @showready/web typecheck`, and a live browser pass that created a scheduled appointment, confirmed the lead stayed `Ready to show`, and showed it in both dashboard `Appointment booked` analytics and `/leads?active=appointment_booked`.
- Fixed the `/leads` card overflow-menu clipping regression: `apps/web/components/leads-manager.tsx` no longer renders stage sections with `overflow-hidden`, the section header now carries the rounded top corners directly, and the per-card `Actions` menu got a stronger local stacking context so the dropdown can extend past the card/section boundary without being masked by the outcomes board below.
- Added a focused regression in `apps/web/components/leads-manager.test.tsx` to lock the non-clipping section container behavior, then re-verified with `corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx`, `corepack pnpm --filter @showready/web typecheck`, and a local authenticated browser pass on `/leads` confirming the lower-card `Actions` menu stays visible above the following section.
- Replaced the dashboard header greeting in `apps/web/app/dashboard/page.tsx` from `Good morning, ...` to the neutral `Welcome back, ...`, and added `apps/web/app/dashboard/page.test.tsx` to lock the page-level heading copy.
- Removed the duplicate recommendation pill from the shared dashboard/recent-leads card so `apps/web/components/lead-card.tsx` now shows only the current stage badge; this avoids stacked duplicate labels like `Ready to show` above `Ready to show` when the recommendation matches the live pipeline stage.
- Added `apps/web/components/lead-card.test.tsx` to lock the simplified card treatment and re-verified the change with `corepack pnpm --filter @showready/web test -- components/lead-card.test.tsx`.
- Re-verified the deployed auth split on April 11, 2026: desktop email/password login on the public production alias `https://showready-jet.vercel.app/login` still succeeds with the seeded demo account and reaches `/dashboard`, while the protected preview deployment `https://showready-1u87krowa-jagarlamudigopichand99-4818s-projects.vercel.app/login` still fails on browser `POST /auth/login` with `HTTP 500` even when opened through a fresh Vercel share-bypass URL.
- Fixed the follow-on CI/Vercel typecheck regression in `apps/web/components/appointment-form.tsx` by removing the invalid `appointment.updatedAt` reference from the keyed reset logic; the form reset key now uses `date` and `startTime`, which exist on the shared `Appointment` type.
- Re-verified the fix with `corepack pnpm --filter @showready/web typecheck` and `corepack pnpm --filter @showready/web lint`, both of which now pass locally.
- Fixed the failing GitHub Actions `CI / test (push)` lint regression by removing synchronous `setState` calls from `useEffect` in `apps/web/components/appointment-form.tsx` and `apps/web/components/leads-manager.tsx`; both components now reset their local state through keyed inner components instead of effect-driven state synchronization.
- Re-verified the CI-sensitive paths with `corepack pnpm --filter @showready/web lint` and `corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx components/appointments-manager.test.tsx`, which now pass locally.
- Replaced the sparse top-level project docs with a repo-wide documentation baseline: `README.md` now reflects the current invite-first, review-before-pipeline, appointments-enabled Supabase runtime; `docs/DEVELOPMENT.md` documents setup, runtime boundaries, and verification workflow; and `docs/PRODUCT.md` captures the agent/public product flows and key domain objects.
- Replaced the `/leads` side-by-side pipeline board with tab-driven full-width sections: `apps/web/app/leads/page.tsx` now reads `active` / `outcome` search params, `apps/web/components/leads-manager.tsx` renders separate active and outcome tab rails with `Ready to show` as the default active workspace, and `new` leads are now surfaced as a lightweight `/new-leads` review cue instead of a visible pipeline column.
- Kept the persistent lead-card footer action bar inside the new full-width sections, limited desktop density to two cards per row, preserved single-column mobile cards, and kept the mobile tab rails horizontally swipeable without reverting to page-level multi-column board behavior.
- Expanded `apps/web/components/leads-manager.test.tsx` to cover the tabbed-section defaults, separate outcome rail, hidden off-tab sections, `/new-leads` cue, and the existing stale-selection reconciliation behavior, then re-verified with `corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx`, `corepack pnpm --filter @showready/web test -- lib/lead-stage.test.ts`, and `corepack pnpm --filter @showready/web typecheck`.
- Reworked `/leads` again around the approved action-bar UX: every board card in `apps/web/components/leads-manager.tsx` now keeps a persistent footer with an always-visible category dropdown plus a quiet overflow menu, summary copy is removed from board cards, and the top bulk toolbar stays hidden until at least one lead is selected.
- Added `reconcileSelectedLeadIds()` in `apps/web/components/leads-manager.tsx` so local selection state is intersected with the live `leads` prop after board changes, preventing stale selections from lingering after moves or deletes and keeping bulk-delete submissions aligned with the current board.
- Tightened the leads-board coverage in `apps/web/components/leads-manager.test.tsx` by replacing brittle Tailwind/string assertions with behavior-focused checks for compact metadata, disabled `new`-stage board controls, and stale-selection reconciliation, while the shared dropdown helper coverage in `apps/web/lib/lead-stage.test.ts` remains in place.
- Verified the redesign with `corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx`, `corepack pnpm --filter @showready/web test -- lib/lead-stage.test.ts`, `corepack pnpm --filter @showready/web typecheck`, and a live browser pass on local `/leads` confirming the persistent footer controls, hidden-by-default bulk toolbar, and quiet overflow actions.
- Fixed a leads-board readability regression on `/leads`: the pipeline cards were forcing a three-column metadata grid based on viewport width instead of available column width, which caused stage/date text to collapse into vertical stacks inside the narrow five-column board. The board cards in `apps/web/components/leads-manager.tsx` now use a two-column metadata layout with the updated timestamp spanning the full row, plus stronger wrapping rules on buyer name/email text.
- Replaced the lead-stage contract end to end with the new eight-stage pipeline: `new`, `ready_to_show`, `appointment_booked`, `nurture`, `hold`, `closed_won`, `closed_lost`, and `archived`, including shared types, Supabase `Database` bindings, stage-label/tone helpers, dashboard analytics cards, seed defaults, API payload unions, and the base SQL enum in `packages/db/migrations/0000_showready_phase1.sql`.
- Added appointments v1 across the data model and product surface: `packages/db/migrations/0005_lead_stage_refresh_and_appointments.sql` plus `packages/db/src/schema.ts` now define `appointments` and `showings`, `apps/web/lib/supabase/data.ts` / `apps/web/lib/actions.ts` now support listing, creating, editing, and status-changing appointments, and the new top-level `/appointments` route plus lead-detail appointments panel now expose the workflow in the UI.
- Reworked `/leads` into the approved split board with pipeline and outcome rows, made stage badges the primary lead-card status treatment, added the `Appointments` nav destination, and shipped the shared `AppointmentForm` with ordered showing rows plus the requested stage-color mapping.
- Made the new migration path resilient to drifted Supabase projects by having `0005` tolerate missing `reviewed_stage` / `reviewed_at` columns before creating appointments, then applied `packages/db/migrations/0005_lead_stage_refresh_and_appointments.sql` to the connected Supabase project after discovering the live schema had not fully received `0004`.
- Verified the implementation with targeted Vitest coverage for stage helpers, appointments helpers, lead/appointments UI surfaces, `corepack pnpm --filter @showready/web typecheck`, `corepack pnpm typecheck`, `corepack pnpm --filter @showready/db test -- tests/lead-stage-appointments-migration.test.ts`, and a live local browser pass that signed into the demo account, loaded `/leads`, `/appointments`, and lead detail, created a real appointment, confirmed the lead auto-moved to `appointment_booked`, and cleared the new-form accessibility warnings.
- Reworked lead qualification into a suggest-first review workflow: completed intakes now stay in `pipeline_stage = new` after scoring, the app persists the score and recommendation immediately, and agents must confirm or override the suggested category before a lead enters the active pipeline.
- Added a dedicated `/new-leads` review inbox with one-tap `Confirm suggestion` plus direct `Move to Ready / Nurture / Hold` actions, and updated the shared app-shell navigation so `New Leads` is a first-class destination on desktop and mobile.
- Added persistent review metadata to the lead contract via `reviewed_stage` and `reviewed_at`, exposed shared `lead.review` helpers in `@showready/types`, and added `packages/db/migrations/0004_lead_review_inbox.sql` to backfill reviewed history for existing non-`new` leads.
- Refactored `/leads` into a reviewed-pipeline-only surface, updated lead detail to show review-first actions for unreviewed leads plus suggestion-vs-confirmed history after review, and added focused coverage in `apps/web/lib/lead-review.test.ts`, `apps/web/components/new-leads-inbox.test.tsx`, and the updated `apps/web/components/leads-manager.test.tsx`.
- Verified the new workflow with `corepack pnpm --filter @showready/web test -- lib/lead-review.test.ts components/new-leads-inbox.test.tsx components/leads-manager.test.tsx`, `corepack pnpm typecheck`, and `corepack pnpm --filter @showready/db build`.
- Debugged the fresh-user auth failure that affected both email/password signup and Google OAuth: direct Supabase Admin `createUser()` reproduction returned `AuthApiError: Database error creating new user`, and live database inspection showed `public.handle_new_user()` had drifted to an older version that inserted `question_templates` rows without the required `intake_type` column.
- Added `packages/db/migrations/0003_repair_auth_user_scaffold.sql` to reapply the current `handle_new_user()` contract on existing Supabase projects, including sale and rental template creation with `intake_type` plus the correct `(agent_id, intake_type)` conflict handling.
- Added `packages/db/tests/repair-auth-trigger.test.ts` to lock the repair migration contract, then verified the fix with `corepack pnpm --filter @showready/db test -- tests/repair-auth-trigger.test.ts`, `psql "$DATABASE_URL" -f packages/db/migrations/0003_repair_auth_user_scaffold.sql`, and a repeat admin-side `createUser()` repro that now succeeds against the connected Supabase project.
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
- `apps/web/app/new-leads/page.tsx`
- `apps/web/components/new-leads-inbox.tsx`
- `apps/web/components/new-leads-inbox.test.tsx`
- `apps/web/components/appointment-form.tsx`
- `apps/web/components/appointments-manager.tsx`
- `apps/web/components/appointments-manager.test.tsx`
- `apps/web/components/lead-appointments-panel.tsx`
- `apps/web/components/lead-appointments-panel.test.tsx`
- `apps/web/components/leads-manager.tsx`
- `apps/web/components/leads-manager.test.tsx`
- `apps/web/vitest.config.ts`
- `apps/web/app/appointments/page.tsx`
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
- `apps/web/lib/appointments.ts`
- `apps/web/lib/appointments.test.ts`
- `apps/web/lib/lead-review.ts`
- `apps/web/lib/lead-review.test.ts`
- `apps/web/lib/lead-stage.ts`
- `apps/web/lib/lead-stage.test.ts`
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
- `packages/db/migrations/0004_lead_review_inbox.sql`
- `packages/db/migrations/0005_lead_stage_refresh_and_appointments.sql`
- `packages/types/src/index.ts`
- `packages/scoring/src/index.ts`
- `apps/web/scripts/seed-supabase.ts`

## Open Issues / Loose Ends
- The new docs are code-aligned and repo-observable, but they still do not include screenshots, sequence diagrams, or deployment-provider runbooks; future documentation work could add operator-facing visuals once the surface area stabilizes further.
- Any Supabase environment that should use the refreshed pipeline and appointments workflow must apply `packages/db/migrations/0005_lead_stage_refresh_and_appointments.sql`; the migration now self-heals missing review columns, but the new `/appointments` route and `appointment_booked` stage contract still require that upgrade to exist in the connected project.
- The appointments and split-board changes now have manual browser verification, but there is still no dedicated Playwright coverage for creating/editing appointments, status changes, or verifying the auto-move into `appointment_booked`.
- The `/leads` board readability fix currently has targeted component coverage and a manual browser check on the authenticated local page; there is still no visual regression coverage for narrow desktop board columns beyond the static markup assertion in `apps/web/components/leads-manager.test.tsx`.
- `/new-leads` itself still has no authenticated browser regression even though local sign-in now works again; the review-first workflow remains covered by targeted Vitest plus shared typecheck rather than end-to-end automation.
- Preview deployments protected by Vercel Authentication still return `HTTP 500` on browser `POST /auth/register` before runtime code executes, even after the app-side share-token preservation fix; this appears to be a platform protection constraint rather than an app runtime exception.
- Preview deployments protected by Vercel Authentication also still return `HTTP 500` on browser `POST /auth/login` before the app can complete the Supabase sign-in redirect, even when the preview is opened via a valid `_vercel_share` bypass URL; this reproduced again on April 11, 2026 in desktop and mobile-emulated browser sessions.
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
- Existing Supabase projects can carry stale copies of `public.handle_new_user()` even when the checked-in base migration is correct; auth regressions that say `Database error saving new user` should be checked against the live function body, not just the repo SQL.
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
5. If the task involves real runtime verification, ensure `packages/db/migrations/0000_showready_phase1.sql`, `packages/db/migrations/0001_sale_rental_intake.sql`, `packages/db/migrations/0002_magic_link_invites.sql`, `packages/db/migrations/0003_repair_auth_user_scaffold.sql`, `packages/db/migrations/0004_lead_review_inbox.sql`, and `packages/db/migrations/0005_lead_stage_refresh_and_appointments.sql` have been applied, then run `corepack pnpm --filter @showready/web seed:supabase`.

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
- This thread also found that the connected Supabase project was still running a stale `public.handle_new_user()` trigger function from before `question_templates.intake_type` became required; applying `packages/db/migrations/0003_repair_auth_user_scaffold.sql` repaired the live function and restored new-user creation.
- This thread also changed the lead workflow from score-and-auto-file to score-and-review: submitted leads now land in `/new-leads`, and agents must confirm or override the suggested category before the lead enters the pipeline.
- This thread also replaced the old five-stage lead contract with the new eight-stage pipeline, added a dedicated `/appointments` management surface backed by real Supabase `appointments` and `showings` tables, and verified the key auto-transition by creating a live appointment that moved a lead into `appointment_booked`.
- Future threads should not assume the old mock JSON store is still on the active request path.
