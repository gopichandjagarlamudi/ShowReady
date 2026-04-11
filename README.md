# ShowReady

ShowReady is a web-first MVP for real estate agents who want to pre-qualify buyer inquiries before spending time on showings. The current runtime is a Next.js App Router app backed by Supabase Auth, Supabase Postgres, deterministic scoring, and a luxury-editorial UI.

## Stack

- `apps/web`: Next.js App Router app
- `packages/types`: shared domain contracts and intake schema
- `packages/scoring`: deterministic buyer-readiness engine with Vitest coverage
- `packages/db`: Drizzle schema and SQL migration source for the Supabase database

## Required setup

1. Install dependencies:

```bash
corepack pnpm install
```

2. Create a Supabase project and copy `.env.example` to `.env.local`.

3. Set these required variables:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
```

4. Apply the database migrations to Supabase:

```bash
psql "$DATABASE_URL" -f packages/db/migrations/0000_showready_phase1.sql
psql "$DATABASE_URL" -f packages/db/migrations/0001_sale_rental_intake.sql
psql "$DATABASE_URL" -f packages/db/migrations/0002_magic_link_invites.sql
psql "$DATABASE_URL" -f packages/db/migrations/0003_repair_auth_user_scaffold.sql
psql "$DATABASE_URL" -f packages/db/migrations/0004_lead_review_inbox.sql
psql "$DATABASE_URL" -f packages/db/migrations/0005_lead_stage_refresh_and_appointments.sql
```

5. Seed the demo account and sample data:

```bash
corepack pnpm --filter @showready/web seed:supabase
```

6. Start the web app:

```bash
corepack pnpm --filter @showready/web dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Demo account

- Email: `demo@showready.local`
- Password: `demo12345`

The seed script creates that auth user plus a branded agent profile, settings, template, and sample leads spanning the active pipeline stages.

## Quality gates

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm --filter @showready/web test:e2e
```

## Notes

- Google OAuth must be enabled in the Supabase Auth dashboard with the callback URL pointed at `/auth/callback`.
- Buyer intake stays behind Next.js route handlers. The browser never gets the service role key.
- The initial SQL lives in [packages/db/migrations/0000_showready_phase1.sql](/Users/gopichandjagarlamudi/Projects/ShowReady/packages/db/migrations/0000_showready_phase1.sql).
- Supabase Realtime is used for dashboard refresh after lead updates.
- Resend, PostHog, and Sentry remain env-gated. The app can run without them, but it cannot run without Supabase anymore.
