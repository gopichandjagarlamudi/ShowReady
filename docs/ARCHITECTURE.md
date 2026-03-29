# Architecture

## Overview
ShowReady is a web-first MVP in a Turborepo monorepo. The active runtime is a Next.js App Router app backed by Supabase Auth, Supabase Postgres, Supabase Realtime, and shared TypeScript packages for domain types and deterministic scoring. `packages/db` now defines the checked-in schema and SQL migration for the Supabase database; it is no longer the active runtime API layer for the web app.

## Workspace Layout
- `apps/web`: Next.js application, App Router routes, UI, server actions, API routes, Supabase SSR helpers, and the Supabase seed script
- `packages/types`: canonical product types, question definitions, navigation metadata, default template
- `packages/scoring`: pure readiness scoring logic and summary generation
- `packages/db`: Drizzle schema and SQL migration source for the Supabase database

## Web App Structure
- `apps/web/app`
  - Public/product routes: `/`, `/login`, `/register`
  - Auth callback: `/auth/callback`
  - Agent routes: `/dashboard`, `/leads`, `/leads/[leadId]`, `/settings`
  - Buyer routes: `/intake/[token]`, `/intake/[token]/complete`
  - API routes: lead CRUD-style endpoints, intake autosave/submit, analytics summary, notification test
- `apps/web/components`
  - App shell, intake form, lead cards, score ring, live refresh, UI primitives
- `apps/web/lib`
  - `actions.ts`: server actions for auth, onboarding, lead creation, stage changes, score overrides
  - `session.ts`: Supabase session resolution for the current user and agent context
  - `supabase/*`: browser/server/admin/proxy clients, manual `Database` type, and runtime data-access helpers
  - `analytics.ts`: optional PostHog forwarding
  - `notifications.ts`: optional Resend email send path plus push stub
  - `observability.ts`: console-backed error capture placeholder
- `apps/web/scripts/seed-supabase.ts`
  - Creates the demo auth user and sample relational data in a live Supabase project

## Core Runtime Flow
- Auth
  - Login/register pages submit to Supabase-backed server actions in `apps/web/lib/actions.ts`
  - Email/password uses `signInWithPassword` and `signUp`
  - Google login uses `signInWithOAuth({ provider: "google" })`
  - `/auth/callback` exchanges the auth code for a session and redirects into the app
  - `proxy.ts` refreshes Supabase SSR cookies and redirects unauthenticated requests away from protected routes
- Agent context and onboarding
  - `getCurrentAgentContext()` reads the authenticated Supabase user and loads `agents`, `agent_settings`, and `question_templates`
  - `ensureAgentScaffold()` is a runtime backstop that creates missing profile/settings/template rows if the database trigger has not already done it
  - Settings form posts to `saveSettingsAction`, which updates the three agent-owned tables
- Lead creation and management
  - Dashboard form uses `createLeadAction`
  - Agent pages and agent-only API routes query Supabase through `apps/web/lib/supabase/data.ts`
  - Pipeline stage changes and score overrides stay synchronous and run through server actions or `PATCH /api/leads/[leadId]`
- Public intake
  - Buyer opens `/intake/[token]`
  - `IntakeForm` autosaves answers to `/api/intake/[token]/autosave`
  - Final submission posts to `/api/intake/[token]/submit`
  - Public intake routes use the server-side admin client; the browser never gets table access for token-based persistence
  - Submission scores synchronously through `@showready/scoring`, writes answers and scores, updates the lead row, optionally emails the agent, and returns the final lead payload
- Realtime and analytics
  - `LiveRefresh` subscribes to Supabase Realtime `postgres_changes` on the `leads` table filtered by `agent_id`
  - Analytics are optional and currently forwarded to PostHog only when env vars are present

## Data and Package Boundaries
- `packages/types/src/index.ts` is the source of truth for:
  - intake question keys and answer types
  - lead, agent, settings, and override shapes
  - default template and nav metadata
- `packages/scoring/src/index.ts` owns:
  - weights and mapping tables
  - override rules
  - recommendation thresholds
  - summary generation
- `apps/web/lib/supabase/data.ts` owns the active runtime data-access layer:
  - agent context reads
  - lead CRUD flows
  - intake token resolution/autosave/submit
  - analytics summary aggregation
- `packages/db/src/schema.ts` and `packages/db/migrations/0000_showready_phase1.sql` define:
  - Supabase-owned tables and enums
  - indexes and constraints
  - auth bootstrap trigger
  - RLS policies

## Important Boundaries
- Supabase is now required for the runtime. There is no active JSON-store fallback in the app request path.
- `auth.users.id` is the canonical agent id. `public.agents.id` mirrors that UUID.
- Agent-authenticated reads and writes should use user-scoped Supabase clients so RLS remains meaningful.
- Public buyer intake stays behind Next.js route handlers and server-side admin access.
- The browser must never receive the service role key.
- Observability is still lightweight; `apps/web/lib/observability.ts` is console-backed, not full Sentry SDK instrumentation.
