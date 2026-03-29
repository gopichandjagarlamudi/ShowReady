# Decisions

## Web-First Monorepo
- Title: Web-first Turborepo structure
- Status: Active
- Rationale: The repository is organized as a Turborepo with one deployed app in `apps/web` and shared packages for types, scoring, and database schema.
- Impact: New work should preserve the monorepo split and keep cross-cutting logic in workspace packages rather than duplicating it inside the app.

## Shared Domain Packages
- Title: Shared domain, scoring, and db packages
- Status: Active
- Rationale: Product contracts live in `@showready/types`, scoring lives in `@showready/scoring`, and Supabase schema/migration source lives in `@showready/db`.
- Impact: UI and route changes should reuse shared package contracts instead of inventing local copies of types or scoring rules.

## Deterministic Readiness Scoring
- Title: Deterministic scoring over black-box AI
- Status: Active
- Rationale: The scoring engine is pure TypeScript with explicit weight tables, override rules, and human-readable summaries.
- Impact: Readiness classification is explainable and testable; any scoring changes are product-level changes and should be handled deliberately.

## Supabase-Only Runtime
- Title: Supabase Auth and Postgres are the active runtime
- Status: Active
- Rationale: The app request path now resolves auth, agent data, leads, intake answers, and score persistence through Supabase clients and SQL-backed tables.
- Impact: Local development now requires a real Supabase project, applied migration, and seed data. Future threads should not build against the old mock runtime path.

## Auth UUID Ownership
- Title: Agent identity is anchored to `auth.users.id`
- Status: Active
- Rationale: `public.agents.id` is modeled to match the authenticated Supabase user UUID, and RLS policies use that ownership model.
- Impact: Any schema or auth changes must preserve that id mapping or update the entire access model consistently.

## Public Intake Stays Server-Side
- Title: Buyer intake persistence stays behind server routes
- Status: Active
- Rationale: The browser submits autosave and final submit requests to Next.js route handlers, which use server-side Supabase access for token-scoped persistence.
- Impact: Public buyer flows should not gain direct browser table access or service-role exposure.

## Supabase Realtime Refresh
- Title: Dashboard refresh uses Supabase Realtime
- Status: Active
- Rationale: `LiveRefresh` now subscribes to `postgres_changes` on the `leads` table filtered by `agent_id`.
- Impact: Realtime behavior is no longer tied to a single local Node process and should stay aligned with the `leads` table contract.

## Luxury-Editorial Light Theme
- Title: Light-first luxury-editorial UI direction
- Status: Active
- Rationale: The app uses Playfair Display, Inter, JetBrains Mono, and semantic CSS variables for an editorial but functional SaaS look.
- Impact: UI changes should preserve the current typography, color-token, and app-shell direction unless a deliberate redesign is requested.

## Env-Gated Integrations
- Title: Resend, PostHog, and Sentry remain optional
- Status: Active
- Rationale: Those integrations are still env-gated, but Supabase itself is no longer optional.
- Impact: New features should keep non-Supabase integrations resilient when external keys are absent.

## Repo-Based Continuity Memory
- Title: Repo docs are the cross-thread memory surface
- Status: Active
- Rationale: The repository had no commit history to lean on, and the user requested durable continuity through `AGENTS.md` and `docs/*.md`.
- Impact: Future Codex threads should use these files as the default handoff layer and keep them updated after meaningful work.
