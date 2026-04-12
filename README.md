# ShowReady

ShowReady is a web-first real-estate lead qualification workspace for agents. It gives each inquiry a branded intake experience, scores readiness with deterministic rules, keeps public intake persistence on the server, and moves qualified leads into an agent-facing pipeline backed by Supabase Auth, Postgres, and Realtime.

## What The Product Does

- Generates invite-based magic links that buyers or renters can open without an account
- Collects intake answers through a branded public flow for sale or rental inquiries
- Scores completed submissions with deterministic TypeScript logic in `@showready/scoring`
- Holds fresh submissions in `/new-leads` for agent review before they enter the main pipeline
- Manages active leads across `ready_to_show`, `appointment_booked`, `nurture`, and `hold`
- Tracks outcomes across `closed_won`, `closed_lost`, and `archived`
- Lets agents schedule, update, and complete appointments tied to eligible leads
- Keeps dashboard and lead views fresh with Supabase Realtime updates

## Tech Stack

- Turborepo monorepo with pnpm workspaces
- Next.js App Router, React 19, TypeScript strict mode, ESM
- Tailwind CSS v4, CSS variables, Framer Motion
- Supabase Auth, Postgres, Realtime, `@supabase/ssr`
- Drizzle schema and SQL migrations in `packages/db`
- Vitest for unit tests and Playwright for browser smoke coverage
- Optional integrations: Resend, PostHog, Sentry

## Workspace Layout

- `apps/web`: deployed app, App Router routes, server actions, API handlers, Supabase clients, UI, seed script, and tests
- `packages/types`: shared product contracts, intake question definitions, lead/appointment types, and helper utilities
- `packages/scoring`: deterministic readiness-scoring engine and summary generation
- `packages/db`: Drizzle schema, checked-in SQL migrations, and migration-oriented tests
- `docs`: architecture, decisions, project state, AI changelog, and deeper project docs

## Main User Flows

### Agent auth and onboarding

- Agents sign in with email/password or Google OAuth
- `/auth/callback` exchanges the Supabase auth code for a session
- Missing profile/settings/template records are scaffolded at runtime if needed
- First-time agents finish onboarding in `/settings`

### Invite-first intake

- Agents generate an invite from `/dashboard`
- The invite URL resolves to `/intake/[token]`
- The public intake autosaves through server routes
- Final submission writes lead answers, scores the intake, and converts the invite into a real lead

### Lead review and pipeline management

- New submissions land in `/new-leads`
- Agents confirm or override the suggested category before moving the lead into the active pipeline
- `/leads` organizes active and outcome stages in separate tab-backed workspaces
- `/leads/[leadId]` shows the full lead, answers, review state, and appointment context

### Appointments

- `/appointments` manages scheduled, completed, and cancelled appointments
- Creating an appointment can move an eligible lead into `appointment_booked`
- Showing addresses and notes are stored alongside the appointment

## Route Map

### Public routes

- `/`: landing page
- `/login`: sign-in UI
- `/register`: sign-up UI
- `/intake/[token]`: invite-backed public intake form
- `/intake/[token]/complete`: post-submit completion page

### Auth and callback routes

- `/auth/callback`: Supabase auth code exchange
- `/auth/google`: route-based Google auth entry
- `/auth/login`: route-based auth helper
- `/auth/register`: route-based auth helper

### Protected agent routes

- `/dashboard`: summary cards, invite launcher, recent leads
- `/new-leads`: review inbox for newly submitted leads
- `/leads`: main pipeline workspace
- `/leads/[leadId]`: lead detail and appointment context
- `/appointments`: appointment manager
- `/settings`: onboarding and brand/template configuration

### API routes

- `/api/intake/[token]/autosave`
- `/api/intake/[token]/submit`
- `/api/leads`
- `/api/leads/[leadId]`
- `/api/analytics/summary`
- `/api/notifications/test`

## Local Setup

### 1. Install dependencies

```bash
corepack pnpm install
```

### 2. Configure environment

Copy the root example file and provide a real Supabase project:

```bash
cp .env.example .env.local
cp .env.example apps/web/.env.local
```

Required variables:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Optional variables:

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=
POSTHOG_KEY=
POSTHOG_HOST=https://us.i.posthog.com
SENTRY_DSN=
```

Notes:

- `apps/web/.env.local` is the runtime source for the Next.js app
- root `.env.local` is also useful for repo-level tooling and scripts
- use the Supabase session pooler in `DATABASE_URL` for local CLI access

### 3. Apply migrations

```bash
psql "$DATABASE_URL" -f packages/db/migrations/0000_showready_phase1.sql
psql "$DATABASE_URL" -f packages/db/migrations/0001_sale_rental_intake.sql
psql "$DATABASE_URL" -f packages/db/migrations/0002_magic_link_invites.sql
psql "$DATABASE_URL" -f packages/db/migrations/0003_repair_auth_user_scaffold.sql
psql "$DATABASE_URL" -f packages/db/migrations/0004_lead_review_inbox.sql
psql "$DATABASE_URL" -f packages/db/migrations/0005_lead_stage_refresh_and_appointments.sql
```

### 4. Seed demo data

```bash
corepack pnpm --filter @showready/web seed:supabase
```

Demo account:

- Email: `demo@showready.local`
- Password: `demo12345`

### 5. Start the app

```bash
corepack pnpm --filter @showready/web dev
```

Open [http://localhost:3000](http://localhost:3000).

## Common Commands

### Whole repo

```bash
corepack pnpm build
corepack pnpm lint
corepack pnpm test
corepack pnpm typecheck
```

### Web app

```bash
corepack pnpm --filter @showready/web dev
corepack pnpm --filter @showready/web build
corepack pnpm --filter @showready/web typecheck
corepack pnpm --filter @showready/web test
corepack pnpm --filter @showready/web test:e2e
```

### Packages

```bash
corepack pnpm --filter @showready/types test
corepack pnpm --filter @showready/scoring test
corepack pnpm --filter @showready/db test
```

## Runtime Boundaries

- Supabase is the active runtime. The legacy mock store is not the current request path.
- `auth.users.id` must stay aligned with `public.agents.id`.
- Agent-owned reads and writes should go through user-scoped Supabase clients so RLS stays meaningful.
- Public intake writes stay behind Next.js server routes and server-side Supabase access.
- The service-role key must never reach the browser.
- Scoring rules in `packages/scoring` are product logic and should not be changed casually.

## Quality Gates

Use the smallest relevant verification for the scope, then widen as risk increases.

- Unit and helper coverage: `corepack pnpm test`
- Static checks: `corepack pnpm lint && corepack pnpm typecheck`
- Production build confidence: `corepack pnpm build`
- Browser smoke flow: `corepack pnpm --filter @showready/web test:e2e`

The checked-in Playwright smoke test currently verifies the landing page marketing structure and the `/login` transition. Feature-specific browser verification should be added when workflow risk increases.

## Documentation Index

- [Architecture](docs/ARCHITECTURE.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Product Workflows](docs/PRODUCT.md)
- [Project State](docs/PROJECT_STATE.md)
- [Decisions](docs/DECISIONS.md)
- [AI Changelog](docs/CHANGELOG_AI.md)

## Current Caveats

- Supabase is required for meaningful local verification
- Google OAuth must be configured in the Supabase Auth dashboard for end-to-end provider testing
- Resend, PostHog, and Sentry are optional and remain env-gated
- `packages/*/dist` and `.next` outputs are generated artifacts, not source-of-truth
