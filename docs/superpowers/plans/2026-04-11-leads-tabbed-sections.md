# Leads Tabbed Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the side-by-side `/leads` pipeline board with tab-driven full-width sections for active and outcome categories, with `Ready to show` as the default active tab and swipeable mobile tab rails.

**Architecture:** Keep the existing lead-card and footer action-bar behavior, but replace the current row/column board rendering in `LeadsManager` with two tabbed workspaces: one for active stages and one for outcomes. Back the visible tab state with URL search params from the `/leads` route so refresh/share behavior stays stable, while keeping local selection state reconciled to the currently rendered leads.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Vitest, jsdom component tests.

---

## File Map

- Modify: `apps/web/app/leads/page.tsx`
  - Read `searchParams`, normalize the active/outcome tab params, and pass them into `LeadsManager`.
- Modify: `apps/web/components/leads-manager.tsx`
  - Replace board rows with tab rails and full-width sections.
  - Keep card/footer behavior intact.
  - Keep the selection-toolbar and reconcile logic.
- Modify: `apps/web/components/leads-manager.test.tsx`
  - Replace board-column expectations with tabbed-section expectations.
  - Add coverage for default selected tabs and single-section rendering.
- Optional create: `apps/web/components/leads-stage-tabs.tsx`
  - Extract tab rail UI if `LeadsManager` becomes unwieldy.
- Optional create: `apps/web/components/leads-stage-section.tsx`
  - Extract the full-width stage section shell if it helps keep the main component readable.
- Modify: `docs/PROJECT_STATE.md`
  - Record the layout shift from multi-column board to tabbed sections.
- Modify: `docs/CHANGELOG_AI.md`
  - Append the implementation entry after behavior changes land.

---

### Task 1: Lock the tab state contract in tests and route parsing

**Files:**
- Modify: `apps/web/components/leads-manager.test.tsx`
- Modify: `apps/web/app/leads/page.tsx`
- Test: `apps/web/components/leads-manager.test.tsx`

- [ ] **Step 1: Write the failing tests for default tabs and single-section rendering**

Add these tests to `apps/web/components/leads-manager.test.tsx`:

```tsx
  it("defaults the active workspace to Ready to show and hides the other active sections", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-ready",
            buyerName: "Ready Buyer",
            pipelineStage: "ready_to_show",
            recommendation: "show"
          }),
          buildLead({
            id: "lead-nurture",
            buyerName: "Nurture Buyer",
            pipelineStage: "nurture",
            recommendation: "nurture"
          })
        ]}
        activeTab="ready_to_show"
        outcomeTab="closed_won"
      />
    )

    expect(html).toContain('aria-selected="true">Ready to show<')
    expect(html).toContain("Ready Buyer")
    expect(html).not.toContain("Nurture Buyer")
  })

  it("renders outcomes in a separate tab group", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-lost",
            buyerName: "Lost Buyer",
            pipelineStage: "closed_lost",
            recommendation: "hold"
          })
        ]}
        activeTab="ready_to_show"
        outcomeTab="closed_lost"
      />
    )

    expect(html).toContain("Outcomes")
    expect(html).toContain('aria-selected="true">Closed lost<')
    expect(html).toContain("Lost Buyer")
  })
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: FAIL because `LeadsManager` does not yet accept `activeTab` / `outcomeTab`, and the current markup still renders all sections at once.

- [ ] **Step 3: Add normalized tab parsing to the `/leads` route**

Update `apps/web/app/leads/page.tsx` like this:

```tsx
import { redirect } from "next/navigation"
import type { LeadStage } from "@showready/types"
import { AppShell } from "@/components/app-shell"
import { LeadsManager } from "@/components/leads-manager"
import { getCurrentAgentContext } from "@/lib/session"
import { listLeads } from "@/lib/supabase/data"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const ACTIVE_TABS = ["ready_to_show", "appointment_booked", "nurture", "hold"] as const
const OUTCOME_TABS = ["closed_won", "closed_lost", "archived"] as const

function getTabValue<T extends readonly LeadStage[]>(
  value: string | string[] | undefined,
  allowed: T,
  fallback: T[number]
): T[number] {
  if (typeof value === "string" && allowed.includes(value as T[number])) {
    return value as T[number]
  }

  return fallback
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const context = await getCurrentAgentContext()
  if (!context) {
    redirect("/login")
  }

  const params = searchParams ? await searchParams : undefined
  const activeTab = getTabValue(params?.active, ACTIVE_TABS, "ready_to_show")
  const outcomeTab = getTabValue(params?.outcome, OUTCOME_TABS, "closed_won")

  const supabase = await createSupabaseServerClient()
  const leads = await listLeads(supabase, context.agent.id)

  return (
    <AppShell currentPath="/leads" eyebrow={context.settings.brandName} heading="Pipeline">
      <LeadsManager leads={leads} activeTab={activeTab} outcomeTab={outcomeTab} />
    </AppShell>
  )
}
```

- [ ] **Step 4: Re-run the targeted test to confirm it still fails for UI reasons only**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: FAIL, but now the failure should come from `LeadsManager` markup/props rather than missing route contract.

- [ ] **Step 5: Commit the route/test groundwork**

```bash
git add apps/web/app/leads/page.tsx apps/web/components/leads-manager.test.tsx
git commit -m "test: lock leads tab state contract"
```

---

### Task 2: Replace board rows with tabbed full-width sections

**Files:**
- Modify: `apps/web/components/leads-manager.tsx`
- Optional create: `apps/web/components/leads-stage-tabs.tsx`
- Optional create: `apps/web/components/leads-stage-section.tsx`
- Test: `apps/web/components/leads-manager.test.tsx`

- [ ] **Step 1: Write the failing test for active/outcome tab rails**

Append this test to `apps/web/components/leads-manager.test.tsx`:

```tsx
  it("renders horizontal active and outcome tab rails with one visible section each", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-ready",
            buyerName: "Ready Buyer",
            pipelineStage: "ready_to_show",
            recommendation: "show"
          }),
          buildLead({
            id: "lead-hold",
            buyerName: "Hold Buyer",
            pipelineStage: "hold",
            recommendation: "hold"
          }),
          buildLead({
            id: "lead-archived",
            buyerName: "Archived Buyer",
            pipelineStage: "archived",
            recommendation: "hold"
          })
        ]}
        activeTab="hold"
        outcomeTab="archived"
      />
    )

    expect(html).toContain('role="tablist"')
    expect(html).toContain(">Hold<")
    expect(html).toContain(">Archived<")
    expect(html).toContain("Hold Buyer")
    expect(html).toContain("Archived Buyer")
    expect(html).not.toContain("Ready Buyer")
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: FAIL because the component still renders all stage sections.

- [ ] **Step 3: Refactor `LeadsManager` to use tab metadata and visible sections**

Replace the top-level row model in `apps/web/components/leads-manager.tsx` with stage-group metadata like this:

```tsx
type ActiveLeadTab = "ready_to_show" | "appointment_booked" | "nurture" | "hold"
type OutcomeLeadTab = "closed_won" | "closed_lost" | "archived"

type LeadsManagerProps = {
  leads: Lead[]
  activeTab: ActiveLeadTab
  outcomeTab: OutcomeLeadTab
}

const ACTIVE_TABS: ActiveLeadTab[] = ["ready_to_show", "appointment_booked", "nurture", "hold"]
const OUTCOME_TABS: OutcomeLeadTab[] = ["closed_won", "closed_lost", "archived"]
```

Then replace the current `rows` memo with per-tab sections:

```tsx
  const sections = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STAGE_META).map(([stage, meta]) => [
          stage,
          {
            stage,
            ...meta,
            leads: leads.filter((lead) => lead.pipelineStage === stage)
          }
        ])
      ) as Record<LeadStage, StageMeta & { stage: LeadStage; leads: Lead[] }>,
    [leads]
  )

  const activeSection = sections[activeTab]
  const outcomeSection = sections[outcomeTab]
```

Render tab rails using links so URL params own the visible tab state:

```tsx
import Link from "next/link"

function buildLeadsTabHref(activeTab: ActiveLeadTab, outcomeTab: OutcomeLeadTab) {
  return `/leads?active=${activeTab}&outcome=${outcomeTab}`
}
```

Tab rail markup:

```tsx
      <section className="space-y-4">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            Pipeline
          </p>
          <div className="overflow-x-auto pb-2">
            <div role="tablist" aria-label="Active lead categories" className="flex min-w-max gap-3">
              {ACTIVE_TABS.map((tab) => {
                const section = sections[tab]
                const selected = tab === activeTab

                return (
                  <Link
                    key={tab}
                    href={buildLeadsTabHref(tab, outcomeTab)}
                    role="tab"
                    aria-selected={selected}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium transition",
                      selected
                        ? "border-[color:var(--ink)] bg-[color:var(--surface)] text-[color:var(--ink)] shadow-[var(--shadow-card)]"
                        : "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-ink)]"
                    )}
                  >
                    <span>{section.title}</span>
                    <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-[color:var(--surface)] px-2 text-xs font-semibold text-[color:var(--ink)]">
                      {section.leads.length}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {renderSection(activeSection)}
      </section>
```

And a separate secondary rail:

```tsx
      <section className="space-y-4">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            Outcomes
          </p>
          <div className="overflow-x-auto pb-2">
            <div role="tablist" aria-label="Outcome lead categories" className="flex min-w-max gap-3">
              {OUTCOME_TABS.map((tab) => {
                const section = sections[tab]
                const selected = tab === outcomeTab

                return (
                  <Link
                    key={tab}
                    href={buildLeadsTabHref(activeTab, tab)}
                    role="tab"
                    aria-selected={selected}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium transition",
                      selected
                        ? "border-[color:var(--ink)] bg-[color:var(--surface)] text-[color:var(--ink)]"
                        : "border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--muted-ink)]"
                    )}
                  >
                    <span>{section.title}</span>
                    <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-[color:var(--surface)] px-2 text-xs font-semibold text-[color:var(--ink)]">
                      {section.leads.length}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {renderSection(outcomeSection)}
      </section>
```

- [ ] **Step 4: Extract a reusable full-width section renderer**

Inside `apps/web/components/leads-manager.tsx`, add a focused renderer function:

```tsx
  function renderSection(section: StageMeta & { stage: LeadStage; leads: Lead[] }) {
    return (
      <Card className="overflow-hidden">
        <div className={cn("border-b p-5", section.headerClassName)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl text-[color:var(--ink)]">{section.title}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted-ink)]">
                {section.description}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold",
                section.badgeClassName
              )}
            >
              {section.leads.length}
            </span>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {section.leads.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-sm leading-6 text-[color:var(--muted-ink)]">{section.emptyMessage}</p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {section.leads.map(renderLeadCard)}
            </div>
          )}
        </div>
      </Card>
    )
  }
```

Use the current card body/footer code as `renderLeadCard(lead: Lead)`.

- [ ] **Step 5: Run tests to confirm the new tabbed layout passes**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the tabbed-sections refactor**

```bash
git add apps/web/app/leads/page.tsx apps/web/components/leads-manager.tsx apps/web/components/leads-manager.test.tsx
git commit -m "feat: convert leads board to tabbed sections"
```

---

### Task 3: Add the New Leads cue and finish responsive/browser verification

**Files:**
- Modify: `apps/web/components/leads-manager.tsx`
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/CHANGELOG_AI.md`
- Test: `apps/web/components/leads-manager.test.tsx`

- [ ] **Step 1: Write the failing test for the `/new-leads` cue**

Append this test to `apps/web/components/leads-manager.test.tsx`:

```tsx
  it("shows a lightweight link to New Leads instead of rendering New as an active tab", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-new",
            buyerName: "Fresh Buyer",
            pipelineStage: "new"
          })
        ]}
        activeTab="ready_to_show"
        outcomeTab="closed_won"
      />
    )

    expect(html).toContain("New leads waiting for review")
    expect(html).toContain('href="/new-leads"')
    expect(html).not.toContain('aria-selected="true">New<')
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: FAIL because no review cue is rendered yet.

- [ ] **Step 3: Add the lightweight review cue and mobile-safe tab wrapping**

Insert this block near the top of `LeadsManager`, under the bulk toolbar:

```tsx
      {sections.new.leads.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--muted-ink)]">
          <span>New leads waiting for review: {sections.new.leads.length}</span>
          <Link
            href="/new-leads"
            className="font-medium text-[color:var(--ink)] underline decoration-[color:var(--border)] underline-offset-4"
          >
            Open New Leads
          </Link>
        </div>
      ) : null}
```

And make the tab rail container explicitly swipeable:

```tsx
className="overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none]"
```

with the inner row staying:

```tsx
className="flex min-w-max gap-3"
```

- [ ] **Step 4: Run tests and typecheck**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
corepack pnpm --filter @showready/web typecheck
```

Expected: PASS.

- [ ] **Step 5: Verify in the browser on desktop and mobile**

Run:

```bash
corepack pnpm --filter @showready/web dev
```

Then verify:

1. Desktop `/leads`
   - page opens with `Ready to show` selected
   - active categories are not side by side
   - only one active section is visible
   - only one outcome section is visible
   - cards no longer collapse text vertically
2. Mobile `/leads`
   - tab rows scroll horizontally
   - no page-level horizontal scrolling
   - cards remain single-column
   - footer action bar is fully visible

- [ ] **Step 6: Update repo memory docs**

Append concise entries reflecting the shipped behavior:

```md
- Replaced the `/leads` side-by-side active pipeline columns with tab-driven full-width sections, defaulting the active workspace to `Ready to show` and moving `New` visibility to a lightweight `/new-leads` review cue.
```

Apply that to:

- `docs/PROJECT_STATE.md`
- `docs/CHANGELOG_AI.md`

- [ ] **Step 7: Commit the final polish and docs**

```bash
git add apps/web/components/leads-manager.tsx apps/web/components/leads-manager.test.tsx docs/PROJECT_STATE.md docs/CHANGELOG_AI.md
git commit -m "feat: redesign leads page as tabbed sections"
```

---

## Self-Review

### Spec coverage

- Active categories are no longer side by side: covered in Task 2.
- Full-width section per selected category: covered in Task 2.
- Horizontal active tab row: covered in Task 2.
- Separate outcome tab group: covered in Task 2.
- Default `ready_to_show` active tab: covered in Task 1.
- `New` kept out of active tabs and linked to `/new-leads`: covered in Task 3.
- Summary remains off cards and footer action bar remains: preserved in Task 2 by reusing current card renderer.
- Mobile swipeable tabs and no page-level horizontal board scrolling: covered in Task 3 browser verification and rail classes.

### Placeholder scan

- No `TODO` / `TBD` placeholders remain.
- Each code step includes concrete snippets.
- Each verification step includes exact commands and expected outcomes.

### Type consistency

- `activeTab` values match spec and route parsing: `ready_to_show | appointment_booked | nurture | hold`
- `outcomeTab` values match spec and route parsing: `closed_won | closed_lost | archived`
- Link builder and props use the same names throughout: `activeTab`, `outcomeTab`
