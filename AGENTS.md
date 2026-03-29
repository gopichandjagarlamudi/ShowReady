# AGENTS

Future Codex threads should use this repository as the continuity surface. Do not rely on prior chat history.

## Read First
- Read `AGENTS.md`.
- Read `docs/PROJECT_STATE.md`.
- Read `docs/DECISIONS.md`.
- Check `git status` before making changes.
- Inspect the relevant runtime/package files before editing.

## How Future Codex Threads Should Start
1. Read `AGENTS.md`, `docs/PROJECT_STATE.md`, and `docs/DECISIONS.md`.
2. Run `git status`.
3. Skim `README.md` and the files closest to the task.
4. Confirm whether the task is auth/data, product/UI, or documentation work.
5. After meaningful work that changes behavior, workflow, status, risks, blockers, or verification state, update `docs/PROJECT_STATE.md` and `docs/CHANGELOG_AI.md`.

## Tech Stack
- Turborepo monorepo with pnpm workspaces
- Next.js App Router, React 19, TypeScript strict mode, ESM
- Tailwind CSS v4, CSS variables in `apps/web/app/globals.css`, Framer Motion
- Shared workspace packages: `@showready/types`, `@showready/scoring`, `@showready/db`
- Supabase Auth + Postgres + Realtime, `@supabase/ssr`, service-role seed path
- Drizzle schema/migration source in `packages/db`
- Vitest for unit tests, Playwright for browser smoke tests
- Optional integrations present but env-gated: Resend, PostHog, Sentry

## Run / Build / Test
- Install: `corepack pnpm install`
- Seed Supabase demo data: `corepack pnpm --filter @showready/web seed:supabase`
- Dev app: `corepack pnpm --filter @showready/web dev`
- Lint: `corepack pnpm lint`
- Typecheck: `corepack pnpm typecheck`
- Test: `corepack pnpm test`
- Build: `corepack pnpm build`
- E2E smoke: `corepack pnpm --filter @showready/web test:e2e`

## Workflow Defaults
- Determine the change type early: auth/data, public intake, product/UI, or docs/config.
- Use [$test-driven-development](/Users/gopichandjagarlamudi/.agents/skills/test-driven-development/SKILL.md) before implementing any feature, bugfix, refactor, or behavior change.
- Use [$writing-plans](/Users/gopichandjagarlamudi/.codex/skills/writing-plans/SKILL.md) before touching code for any multi-step feature or larger scoped task.
- Use [$ui-ux-pro-max](/Users/gopichandjagarlamudi/.agents/skills/ui-ux-pro-max/SKILL.md) for any product/UI/interface work or any change that affects how a feature looks, feels, moves, or is interacted with.
- Docs-only, copy-only, and env-only changes can skip TDD and planning if they do not change behavior.
- Start with the smallest relevant verification for the scope, then widen to broader commands or browser checks only as risk increases.
- After meaningful work that changes behavior, workflow, status, risks, blockers, or verification state, update `docs/PROJECT_STATE.md` and `docs/CHANGELOG_AI.md`.

## Conventions In Use
- Prefer server components in `apps/web/app`; use client components only for interactive UI.
- Import shared contracts/utilities through `@showready/*` workspace aliases.
- Keep agent-owned reads and writes on Supabase user-scoped clients; keep public intake mutations behind server routes.
- Keep UI styling in Tailwind utility classes and semantic CSS variables, not ad hoc inline design systems.
- Follow the current code style: TypeScript, double quotes, no semicolons, concise helper modules under `apps/web/lib`.
- Treat `packages/*/src` as source of truth. `dist/` is build output.
- Keep docs factual and compact; prefer repo-observable facts over speculation.

## Change-Type Playbooks
- Auth/data work: inspect `apps/web/lib/actions.ts`, `apps/web/lib/session.ts`, `apps/web/lib/supabase`, and the nearest route/component files. Verify login, dashboard data, and the relevant Supabase read/write path.
- Public intake work: inspect `apps/web/components/intake-form.tsx`, `apps/web/app/intake/[token]/page.tsx`, the intake route handlers, and any scoring touchpoints. Verify magic-link load, autosave, final submit, and the resulting lead detail/dashboard state.
- Product/UI work: inspect the nearest route/component files plus `apps/web/app/globals.css`. Use `ui-ux-pro-max`, preserve the current typography/token direction unless a redesign is requested, and verify responsive/browser behavior.
- Docs/config work: keep changes factual, avoid speculative architecture edits, and update the repo memory docs whenever workflow, runtime behavior, or known blockers change.

## Supabase Runtime Invariants
- Keep `auth.users.id` aligned with `public.agents.id`.
- Keep public intake persistence behind server routes; do not expose service-role access or direct browser table writes for public flows.
- Prefer user-scoped Supabase clients for authenticated agent reads/writes. Reserve service-role usage for server-only admin or seed paths.
- Treat `packages/db/src/schema.ts` and `packages/db/migrations/0000_showready_phase1.sql` as the repo contract for the live database shape.
- Use the Supabase session pooler `DATABASE_URL` for local CLI access; the direct `db.<ref>.supabase.co` host may be IPv6-only.

## Environment Notes
- App runtime expects `apps/web/.env.local`.
- Repo-level tooling and scripts may also read the root `.env.local`.
- Supabase envs are required for local runtime verification; Resend, PostHog, and Sentry remain optional and env-gated.
- For live runtime checks, ensure the checked-in SQL migration has been applied and the demo seed has been run.

## Inspect Before Editing
- `README.md`
- `package.json`
- `proxy.ts`
- `apps/web/lib/actions.ts`
- `apps/web/lib/session.ts`
- `apps/web/lib/supabase`
- `packages/types/src/index.ts`
- `packages/scoring/src/index.ts`
- `packages/db/src/schema.ts`
- `packages/db/migrations/0000_showready_phase1.sql`
- `docs/ARCHITECTURE.md`

## Do Not Touch Without Explicit Approval
- The Supabase auth/data ownership boundary or service-role usage model
- Scoring rules, weights, thresholds, and recommendation logic in `packages/scoring`
- Generated or local-state paths: `.turbo/`, `packages/*/dist/`, `apps/web/.next/`
- Workspace/package-manager/CI structure unless the task directly requires it

## Documentation Maintenance
- Before editing code, always read `docs/PROJECT_STATE.md` and `docs/DECISIONS.md`.
- After meaningful work that changes behavior, workflow, status, risks, blockers, or verification state, update `docs/PROJECT_STATE.md` with current status and loose ends.
- After the same category of meaningful work, append a concise entry to `docs/CHANGELOG_AI.md`.

## Definition Of Done
- The relevant workflow skill rules were followed for the task type.
- The smallest meaningful verification was run, with broader checks added when the scope or risk justified them.
- UI changes were checked in the browser and against the current visual direction.
- Auth/data changes were checked against the live Supabase-backed path they affect.
- `docs/PROJECT_STATE.md` and `docs/CHANGELOG_AI.md` were updated after meaningful work.
- Remaining blockers, follow-ups, or externally owned issues were documented explicitly.
