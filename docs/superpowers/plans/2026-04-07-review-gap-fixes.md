# Review Gap Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the current review findings by hardening auth redirects, enforcing one-time intake submission semantics, and validating required multi-select answers correctly.

**Architecture:** Keep the fixes local to the existing auth URL/auth callback layer and the Supabase data helper layer. Add small, testable helper functions for redirect sanitization and intake guard validation so the critical behavior is covered by fast Vitest tests before wiring them into routes and persistence functions.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Supabase data helpers

---

### Task 1: Safe Auth Redirects

**Files:**
- Modify: `apps/web/lib/auth-url.ts`
- Modify: `apps/web/app/auth/callback/route.ts`
- Test: `apps/web/lib/auth-url.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests asserting that external and malformed callback `next` values are rejected while internal paths are preserved.

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm --filter @showready/web test -- apps/web/lib/auth-url.test.ts`
Expected: FAIL because the sanitizer does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a helper in `apps/web/lib/auth-url.ts` that only accepts app-internal absolute paths beginning with `/` and rejects protocol-relative or fully-qualified URLs, then apply it in the auth callback route.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm --filter @showready/web test -- apps/web/lib/auth-url.test.ts`
Expected: PASS

### Task 2: Intake Finalization Guards

**Files:**
- Modify: `apps/web/lib/supabase/data.ts`
- Test: `apps/web/lib/intake-guards.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests asserting:
- submitted leads cannot be autosaved again
- submitted leads cannot be re-submitted
- required array answers cannot be empty

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm --filter @showready/web test -- apps/web/lib/intake-guards.test.ts`
Expected: FAIL because the guard helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Extract small helper functions in `apps/web/lib/supabase/data.ts` for validating lead mutability and answer completeness, then use them in `autosaveLeadAnswer()` and `submitLead()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm --filter @showready/web test -- apps/web/lib/intake-guards.test.ts`
Expected: PASS

### Task 3: Regression Verification

**Files:**
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/CHANGELOG_AI.md`

- [ ] **Step 1: Run targeted verification**

Run: `corepack pnpm --filter @showready/web test -- apps/web/lib/auth-url.test.ts apps/web/lib/intake-guards.test.ts apps/web/lib/utils.test.ts`
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `corepack pnpm --filter @showready/web typecheck`
Expected: PASS

- [ ] **Step 3: Update repo memory docs**

Document the fixed risks, what was verified, and any remaining gaps.
