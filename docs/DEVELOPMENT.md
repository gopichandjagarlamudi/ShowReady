# Development Guide

## Purpose

This document is the operational guide for running, verifying, and extending ShowReady locally. It focuses on repo layout, environment setup, runtime boundaries, and the commands that matter when you are working inside this monorepo.

## Monorepo Structure

### Root

- `package.json`: Turborepo entrypoint for `build`, `lint`, `test`, and `typecheck`
- `proxy.ts`: request protection and Supabase SSR session refresh
- `AGENTS.md`: repo-specific workflow instructions for future Codex threads

### `apps/web`

- `app`: App Router routes for marketing, auth, intake, dashboard, leads, new-leads, appointments, and settings
- `components`: product UI including the app shell, intake form, lead boards, review inbox, and appointment manager
- `lib/actions.ts`: server actions for auth, onboarding, invite generation, lead review, pipeline changes, and appointments
- `lib/session.ts`: current user and agent-context resolution
- `lib/supabase/*`: browser/server/admin/proxy clients and the typed data layer
- `scripts/seed-supabase.ts`: demo seed path for a live Supabase project
- `tests/e2e`: Playwright smoke coverage

### `packages/types`

- shared domain model for leads, appointments, invite status, intake answers, templates, and helper mappings

### `packages/scoring`

- deterministic scoring engine used when a public intake is submitted

### `packages/db`

- Drizzle schema and checked-in SQL migrations that define the live database contract

## Environment

### Required

ShowReady does not have a meaningful local runtime without Supabase.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Optional

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=
POSTHOG_KEY=
POSTHOG_HOST=https://us.i.posthog.com
SENTRY_DSN=
```

### File placement

- `apps/web/.env.local`: app runtime source
- `.env.local`: useful for repo-level scripts and CLI commands
- `.env.example`: canonical example values and required variable list

## Database Setup

### Source of truth

- schema: `packages/db/src/schema.ts`
- migration chain:
  - `packages/db/migrations/0000_showready_phase1.sql`
  - `packages/db/migrations/0001_sale_rental_intake.sql`
  - `packages/db/migrations/0002_magic_link_invites.sql`
  - `packages/db/migrations/0003_repair_auth_user_scaffold.sql`
  - `packages/db/migrations/0004_lead_review_inbox.sql`
  - `packages/db/migrations/0005_lead_stage_refresh_and_appointments.sql`

### Apply migrations

```bash
psql "$DATABASE_URL" -f packages/db/migrations/0000_showready_phase1.sql
psql "$DATABASE_URL" -f packages/db/migrations/0001_sale_rental_intake.sql
psql "$DATABASE_URL" -f packages/db/migrations/0002_magic_link_invites.sql
psql "$DATABASE_URL" -f packages/db/migrations/0003_repair_auth_user_scaffold.sql
psql "$DATABASE_URL" -f packages/db/migrations/0004_lead_review_inbox.sql
psql "$DATABASE_URL" -f packages/db/migrations/0005_lead_stage_refresh_and_appointments.sql
```

### Seed demo data

```bash
corepack pnpm --filter @showready/web seed:supabase
```

The seed creates the demo auth user, agent profile/settings/template rows, and sample leads spanning the active workflow.

## Local Runbook

### Install

```bash
corepack pnpm install
```

### Start development

```bash
corepack pnpm --filter @showready/web dev
```

### Build production output

```bash
corepack pnpm build
```

## Test And Verification Strategy

### Static checks

```bash
corepack pnpm lint
corepack pnpm typecheck
```

### Unit and package tests

```bash
corepack pnpm test
```

Important coverage areas already present in the repo:

- lead board behavior
- new-lead review logic
- appointment helpers and manager behavior
- intake draft/config/guard helpers
- auth URL helpers
- scoring engine
- migration-level database contract tests

### Browser smoke

```bash
corepack pnpm --filter @showready/web test:e2e
```

The current smoke spec covers the landing page and sign-in transition. Treat deeper feature work as requiring targeted browser validation on the flow you changed.

## Runtime Architecture Notes

### Auth

- Supabase Auth is the active auth provider
- password login and registration are handled through server actions
- `/auth/callback` exchanges the OAuth code for a session
- `proxy.ts` protects authenticated areas and refreshes SSR session cookies

### Agent ownership

- `auth.users.id` is the canonical identity
- `public.agents.id` mirrors that UUID
- RLS expectations depend on preserving this mapping

### Public intake boundary

- public invite flows do not write directly from the browser into tables
- the browser talks to Next.js route handlers
- server-side Supabase access performs autosave and submit mutations

### Realtime

- `LiveRefresh` subscribes to `postgres_changes` for the current agent’s `leads`
- dashboard and lead surfaces rely on this instead of a local in-process store

## Feature Areas

### Auth and onboarding

- inspect `apps/web/lib/actions.ts`
- inspect `apps/web/lib/session.ts`
- inspect `apps/web/app/(auth)/*`
- inspect `apps/web/app/auth/callback/route.ts`

### Public intake

- inspect `apps/web/components/intake-form.tsx`
- inspect `apps/web/app/intake/[token]/page.tsx`
- inspect `apps/web/app/api/intake/[token]/*`
- inspect `apps/web/lib/intake-*`

### Leads and review

- inspect `apps/web/app/new-leads/page.tsx`
- inspect `apps/web/components/new-leads-inbox.tsx`
- inspect `apps/web/app/leads/page.tsx`
- inspect `apps/web/components/leads-manager.tsx`
- inspect `apps/web/lib/lead-review.ts`
- inspect `apps/web/lib/lead-stage.ts`

### Appointments

- inspect `apps/web/app/appointments/page.tsx`
- inspect `apps/web/components/appointments-manager.tsx`
- inspect `apps/web/components/lead-appointments-panel.tsx`
- inspect `apps/web/lib/appointments.ts`

## Conventions

- prefer server components in `apps/web/app`
- use client components only where interactivity requires them
- import shared types and helpers through `@showready/*`
- keep styling in Tailwind utilities and semantic CSS variables
- follow the current code style: TypeScript, double quotes, minimal helper modules under `apps/web/lib`
- treat `packages/*/src` as source of truth, not `dist`

## Sensitive Boundaries

Do not change these casually:

- auth/data ownership boundary and service-role usage model
- scoring thresholds, weights, and recommendation logic in `packages/scoring`
- generated state in `.turbo`, `.next`, and `packages/*/dist`
- workspace/package-manager/CI structure unless the task explicitly requires it

## Documentation Maintenance

After meaningful work that changes behavior, workflow, status, blockers, risks, or verification state:

- update `docs/PROJECT_STATE.md`
- append a concise entry to `docs/CHANGELOG_AI.md`

Use repo-observable facts. Avoid speculative documentation.
