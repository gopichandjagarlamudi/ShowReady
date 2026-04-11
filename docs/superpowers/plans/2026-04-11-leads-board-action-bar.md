# Leads Board Action Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/leads` so each lead card has a persistent bottom action bar with an always-visible category dropdown, quieter secondary actions, and a bulk toolbar that stays hidden until leads are selected.

**Architecture:** Keep the existing split board in `LeadsManager`, but move card interaction hierarchy toward a lighter scan model: top identity, compact metadata, persistent footer controls. Reuse the current stage-move action path instead of inventing new APIs, and add focused helper logic so the dropdown only shows the current stage plus valid next moves.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Vitest component tests, existing server actions in `apps/web/lib/actions.ts`.

---

## File Map

- Modify: `apps/web/components/leads-manager.tsx`
  - Replace the current card action layout with a persistent bottom action bar.
  - Remove summary text from board cards.
  - Quiet the top selection UI until selection exists.
- Modify: `apps/web/lib/lead-stage.ts`
  - Add a helper for board-dropdown options that returns the current stage plus valid next moves.
- Modify: `apps/web/lib/lead-stage.test.ts`
  - Cover the new board-dropdown option helper.
- Modify: `apps/web/components/leads-manager.test.tsx`
  - Add markup-level assertions for the action bar, hidden summary, and quiet bulk toolbar behavior.
- Optional create if JSX grows too large: `apps/web/components/leads-board-card-actions.tsx`
  - Only extract if `LeadsManager` becomes hard to read after adding dropdown/menu logic.
- Verify in browser: `/leads`

---

### Task 1: Lock the board dropdown rules in tests

**Files:**
- Modify: `apps/web/lib/lead-stage.test.ts`
- Modify: `apps/web/lib/lead-stage.ts`

- [ ] **Step 1: Write the failing test**

Add these tests to `apps/web/lib/lead-stage.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { getLeadBoardStageOptions } from "./lead-stage"

describe("getLeadBoardStageOptions", () => {
  it("returns the current reviewed stage first followed by valid next moves", () => {
    expect(getLeadBoardStageOptions("nurture")).toEqual([
      "nurture",
      "ready_to_show",
      "hold",
      "closed_won",
      "closed_lost",
      "archived"
    ])
  })

  it("does not include new or appointment_booked in board move options for reviewed leads", () => {
    expect(getLeadBoardStageOptions("ready_to_show")).not.toContain("new")
    expect(getLeadBoardStageOptions("ready_to_show")).not.toContain("appointment_booked")
  })

  it("returns only the current stage for new leads so the board does not bypass review flow", () => {
    expect(getLeadBoardStageOptions("new")).toEqual(["new"])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm --filter @showready/web test -- lib/lead-stage.test.ts
```

Expected: FAIL with `getLeadBoardStageOptions` missing or undefined.

- [ ] **Step 3: Write minimal implementation**

Add this helper to `apps/web/lib/lead-stage.ts` below `getLeadDetailMoveTargets`:

```ts
export function getLeadBoardStageOptions(currentStage: LeadStage): LeadStage[] {
  if (currentStage === "new") {
    return ["new"]
  }

  return [currentStage, ...getLeadDetailMoveTargets(currentStage)]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm --filter @showready/web test -- lib/lead-stage.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/lead-stage.ts apps/web/lib/lead-stage.test.ts
git commit -m "test: lock leads board stage dropdown options"
```

---

### Task 2: Lock the quieter card layout and hidden bulk toolbar in component tests

**Files:**
- Modify: `apps/web/components/leads-manager.test.tsx`
- Modify: `apps/web/components/leads-manager.tsx`

- [ ] **Step 1: Write the failing test**

Append these tests to `apps/web/components/leads-manager.test.tsx`:

```tsx
  it("renders a persistent footer action bar and omits summary text from board cards", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-ready",
            buyerName: "Ready Buyer",
            pipelineStage: "ready_to_show",
            recommendation: "show",
            summary: "This summary should not appear in the board card."
          })
        ]}
      />
    )

    expect(html).toContain("Change category")
    expect(html).toContain("More actions")
    expect(html).not.toContain("This summary should not appear in the board card.")
  })

  it("keeps bulk actions quiet until at least one lead is selected", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-ready",
            buyerName: "Ready Buyer",
            pipelineStage: "ready_to_show",
            recommendation: "show"
          })
        ]}
      />
    )

    expect(html).not.toContain("Delete selected")
    expect(html).toContain("Select all leads")
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: FAIL because the current card still renders summary text and always renders the bulk delete button.

- [ ] **Step 3: Write minimal implementation**

In `apps/web/components/leads-manager.tsx`, make these structural changes:

1. Replace the current top toolbar block:

```tsx
      <div className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm text-[color:var(--ink)]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
            className="h-4 w-4 rounded border-[color:var(--border)]"
          />
          Select all leads
        </label>

        {selectedCount > 0 ? (
          <form
            action={deleteLeadsAction}
            onSubmit={(event) => {
              const confirmed = window.confirm(
                `Delete ${selectedCount} selected ${selectedCount === 1 ? "lead" : "leads"}? This cannot be undone.`
              )

              if (!confirmed) {
                event.preventDefault()
              }
            }}
            className="flex items-center gap-3"
          >
            {selectedLeadIds.map((leadId) => (
              <input key={leadId} type="hidden" name="leadId" value={leadId} />
            ))}
            <p className="text-sm text-[color:var(--muted-ink)]">{selectedCount} selected</p>
            <Button type="submit" variant="secondary">
              Delete selected
            </Button>
          </form>
        ) : (
          <p className="text-sm text-[color:var(--muted-ink)]">Choose leads to reveal bulk actions.</p>
        )}
      </div>
```

2. In each lead card:
- delete the summary paragraph block entirely
- replace the current bottom row with a footer action bar placeholder:

```tsx
                          <div className="mt-5 border-t border-[color:var(--border)] pt-4">
                            <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[color:var(--surface-strong)] px-3 py-3">
                              <button
                                type="button"
                                className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--border)] bg-white px-4 text-sm font-medium text-[color:var(--ink)]"
                              >
                                Change category
                              </button>
                              <button
                                type="button"
                                className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-[color:var(--muted-ink)]"
                              >
                                More actions
                              </button>
                            </div>
                          </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/leads-manager.tsx apps/web/components/leads-manager.test.tsx
git commit -m "test: lock leads board footer action layout"
```

---

### Task 3: Implement the immediate-apply category dropdown on each lead card

**Files:**
- Modify: `apps/web/components/leads-manager.tsx`
- Modify: `apps/web/lib/lead-stage.ts`
- Modify: `apps/web/lib/actions.ts`

- [ ] **Step 1: Write the failing test**

Add this test to `apps/web/components/leads-manager.test.tsx`:

```tsx
  it("renders the current stage and valid next moves in the board category dropdown", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-nurture",
            buyerName: "Nurture Buyer",
            pipelineStage: "nurture",
            recommendation: "nurture"
          })
        ]}
      />
    )

    expect(html).toContain('name="stage"')
    expect(html).toContain(">nurture<")
    expect(html).toContain(">ready_to_show<")
    expect(html).toContain(">hold<")
    expect(html).not.toContain(">appointment_booked<")
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: FAIL because the footer is still a placeholder button instead of a real dropdown.

- [ ] **Step 3: Write minimal implementation**

In `apps/web/components/leads-manager.tsx`:

1. Import the new helper:

```tsx
import { getLeadBoardStageOptions, getLeadStageLabel } from "@/lib/lead-stage"
```

2. Replace the placeholder footer with an auto-submitting form:

```tsx
                          <div className="mt-5 border-t border-[color:var(--border)] pt-4">
                            <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[color:var(--surface-strong)] px-3 py-3">
                              <form
                                action={updateLeadStageAction}
                                className="min-w-0 flex-1"
                              >
                                <input type="hidden" name="leadId" value={lead.id} />
                                <label
                                  htmlFor={`lead-stage-${lead.id}`}
                                  className="sr-only"
                                >
                                  Change category
                                </label>
                                <select
                                  id={`lead-stage-${lead.id}`}
                                  name="stage"
                                  defaultValue={lead.pipelineStage}
                                  onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                  className="min-h-11 w-full rounded-full border border-[color:var(--border)] bg-white px-4 text-sm font-medium text-[color:var(--ink)]"
                                >
                                  {getLeadBoardStageOptions(lead.pipelineStage).map((stage) => (
                                    <option key={stage} value={stage}>
                                      {getLeadStageLabel(stage)}
                                    </option>
                                  ))}
                                </select>
                              </form>
                              <button
                                type="button"
                                className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-[color:var(--muted-ink)]"
                                aria-label="More actions"
                              >
                                More actions
                              </button>
                            </div>
                          </div>
```

3. Update the import from actions:

```tsx
import { deleteLeadsAction, updateLeadStageAction } from "@/lib/actions"
```

No action changes are needed if `updateLeadStageAction` already accepts the reviewed-stage values used by the board.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/leads-manager.tsx apps/web/components/leads-manager.test.tsx apps/web/lib/lead-stage.ts
git commit -m "feat: add immediate stage dropdown to leads board cards"
```

---

### Task 4: Replace the footer placeholder with a real overflow menu

**Files:**
- Modify: `apps/web/components/leads-manager.tsx`
- Optional create: `apps/web/components/leads-board-card-actions.tsx`
- Test: `apps/web/components/leads-manager.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test:

```tsx
  it("keeps secondary actions behind a quiet overflow trigger", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-ready",
            buyerName: "Ready Buyer",
            pipelineStage: "ready_to_show",
            recommendation: "show"
          })
        ]}
      />
    )

    expect(html).toContain("More actions")
    expect(html).toContain("Open lead")
    expect(html).toContain("Delete")
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: FAIL because the footer only shows a placeholder button with no menu content.

- [ ] **Step 3: Write minimal implementation**

Implement a native disclosure menu first to keep the change bounded:

```tsx
                              <details className="relative">
                                <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full px-3 text-sm font-medium text-[color:var(--muted-ink)]">
                                  More actions
                                </summary>
                                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-10 min-w-40 rounded-[18px] border border-[color:var(--border)] bg-white p-2 shadow-[var(--shadow-card)]">
                                  <Link
                                    href={`/leads/${lead.id}`}
                                    className="flex min-h-10 items-center rounded-[12px] px-3 text-sm text-[color:var(--ink)] hover:bg-[color:var(--muted)]"
                                  >
                                    Open lead
                                  </Link>
                                  <form
                                    action={deleteLeadsAction}
                                    onSubmit={(event) => {
                                      const confirmed = window.confirm(
                                        `Delete ${lead.buyerName}? This cannot be undone.`
                                      )

                                      if (!confirmed) {
                                        event.preventDefault()
                                      }
                                    }}
                                  >
                                    <input type="hidden" name="leadId" value={lead.id} />
                                    <button
                                      type="submit"
                                      className="flex min-h-10 w-full items-center rounded-[12px] px-3 text-left text-sm text-[color:var(--ink)] hover:bg-[color:var(--muted)]"
                                    >
                                      Delete
                                    </button>
                                  </form>
                                </div>
                              </details>
```

Then remove the old always-visible `Open lead detail` link and `Delete` button row from the card body.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/leads-manager.tsx apps/web/components/leads-manager.test.tsx
git commit -m "feat: move leads board secondary actions into overflow menu"
```

---

### Task 5: Remove recommendation duplication and finish the quieter card hierarchy

**Files:**
- Modify: `apps/web/components/leads-manager.tsx`
- Test: `apps/web/components/leads-manager.test.tsx`

- [ ] **Step 1: Write the failing test**

Add:

```tsx
  it("does not render the recommendation badge as a second prominent pill on board cards", () => {
    const html = renderToStaticMarkup(
      <LeadsManager
        leads={[
          buildLead({
            id: "lead-ready",
            buyerName: "Ready Buyer",
            pipelineStage: "ready_to_show",
            recommendation: "show"
          })
        ]}
      />
    )

    expect(html).toContain("Ready to show")
    expect(html).not.toContain("Recommended path")
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: FAIL because the board still renders `RecommendationBadge` alongside `StageBadge`.

- [ ] **Step 3: Write minimal implementation**

In `apps/web/components/leads-manager.tsx`, remove the board-card recommendation badge block:

```tsx
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <StageBadge stage={lead.pipelineStage} />
                            </div>
```

Keep recommendation presentation in lead detail and other surfaces untouched.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/leads-manager.tsx apps/web/components/leads-manager.test.tsx
git commit -m "refactor: simplify leads board card hierarchy"
```

---

### Task 6: Browser verification for card behavior and readability

**Files:**
- Verify: `apps/web/components/leads-manager.tsx`
- Verify: `apps/web/lib/actions.ts`
- Verify: `/leads`

- [ ] **Step 1: Start the app**

Run:

```bash
corepack pnpm --filter @showready/web dev
```

Expected: Next.js dev server starts on `http://localhost:3000`.

- [ ] **Step 2: Verify the quiet default toolbar state**

Manual browser check on `/leads`:
- confirm the top area shows selection controls quietly
- confirm `Delete selected` is not visible until at least one checkbox is selected

Expected:
- unselected state looks calm
- selecting one lead reveals the bulk delete toolbar

- [ ] **Step 3: Verify the footer action bar behavior**

Manual browser check on one populated card:
- confirm the bottom bar is always visible
- confirm the dropdown shows current stage first, followed by valid next moves
- confirm selecting a new stage applies immediately

Expected:
- stage changes without a second confirmation button
- no invalid stages appear in the dropdown

- [ ] **Step 4: Verify the overflow menu behavior**

Manual browser check:
- open `More actions`
- click `Open lead`
- return to `/leads`
- open `More actions` again and verify `Delete`

Expected:
- footer controls do not accidentally trigger navigation
- `Open lead` reaches lead detail
- delete stays available as a secondary action

- [ ] **Step 5: Verify narrow-column readability**

Manual browser check at the same desktop width that originally reproduced the problem:
- confirm metadata no longer collapses into stacked vertical text
- confirm summary text is absent from board cards

Expected:
- name/contact remain readable
- score/stage/updated stay legible in compact layout

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/leads-manager.tsx apps/web/components/leads-manager.test.tsx apps/web/lib/lead-stage.ts apps/web/lib/lead-stage.test.ts
git commit -m "fix: streamline leads board card actions"
```

---

### Task 7: Final verification and repo memory updates

**Files:**
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/CHANGELOG_AI.md`

- [ ] **Step 1: Run targeted tests**

Run:

```bash
corepack pnpm --filter @showready/web test -- components/leads-manager.test.tsx lib/lead-stage.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
corepack pnpm --filter @showready/web typecheck
```

Expected: PASS.

- [ ] **Step 3: Update project state**

Append a concise note to `docs/PROJECT_STATE.md` covering:

```md
- Reworked `/leads` board cards to use a persistent bottom action bar with an immediate-apply stage dropdown, a quieter overflow menu for secondary actions, hidden summary text on the board, and a bulk toolbar that only appears when leads are selected.
```

- [ ] **Step 4: Update changelog**

Append a concise note to `docs/CHANGELOG_AI.md` covering:

```md
- Streamlined `/leads` board interactions by adding a persistent footer action bar per card, moving secondary actions into an overflow menu, hiding board-card summaries, and quieting bulk actions until selection exists; verified with targeted Vitest and browser checks.
```

- [ ] **Step 5: Commit**

```bash
git add docs/PROJECT_STATE.md docs/CHANGELOG_AI.md
git commit -m "docs: record leads board action bar redesign"
```

---

## Self-Review

### Spec coverage
- Persistent bottom action bar: covered in Tasks 2, 3, and 4.
- Category dropdown with current stage plus valid next moves only: covered in Tasks 1 and 3.
- Immediate apply stage changes: covered in Task 3 and browser-verified in Task 6.
- Summary visible only in lead detail: covered in Tasks 2 and 5.
- Quieter bulk actions until selection exists: covered in Task 2 and browser-verified in Task 6.
- Smaller, less clumsy secondary actions: covered in Task 4.

### Placeholder scan
- No `TODO`, `TBD`, or deferred “add tests later” language.
- Every code-changing task includes exact code or exact structure to insert.
- Every verification step includes exact commands and expected results.

### Type consistency
- New helper name is consistently `getLeadBoardStageOptions`.
- Existing action path stays `updateLeadStageAction`.
- Existing stage type remains `LeadStage`; no duplicate local stage types introduced.
