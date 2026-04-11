# Leads Tabbed Sections Design

## Summary

Redesign `/leads` so it stops rendering the active pipeline as simultaneous side-by-side columns. Replace that layout with tab-driven, full-width category sections that keep cards readable, preserve the persistent footer action bar, and work cleanly on mobile without horizontal page scrolling.

## Problem

The current active board tries to show `new`, `ready_to_show`, `appointment_booked`, `nurture`, and `hold` at the same time. That compresses the cards until buyer names and metadata wrap vertically, which breaks readability and makes the new persistent footer controls feel cramped. The board is acting like a kanban even though the intended workflow is now category-first, not drag-and-drop.

## Goals

- Remove side-by-side active pipeline columns from `/leads`
- Make category selection the primary interaction
- Keep the page fast to scan and easy to work from on desktop and mobile
- Preserve the simplified card structure and persistent footer action bar
- Keep outcomes visible but visually secondary to active work

## Non-Goals

- No change to lead stages or move rules
- No change to lead detail behavior
- No drag-and-drop board interactions
- No summary text returning to board cards

## Recommended Approach

Use dual horizontal tab rails with full-width category sections.

### Why this approach

- It solves the compression problem directly by rendering only one category section at a time.
- It keeps category switching fast and obvious.
- It maps well to mobile with swipeable tab rails.
- It preserves the current card/action model instead of forcing another card redesign.

## Information Architecture

### Active workspace

The primary tab rail represents active pipeline work:

- `Ready to show`
- `Appointment booked`
- `Nurture`
- `Hold`

Default selected tab:

- `ready_to_show`

### Outcomes workspace

The secondary tab rail represents outcomes:

- `Closed won`
- `Closed lost`
- `Archived`

Default selected outcome tab:

- `closed_won`

### New leads

`New` does not appear in the active tab rail. It stays owned by the review flow in `/new-leads`.

Optional supporting cue near the top of `/leads`:

- a small linked count such as `New leads waiting for review: X`
- link target: `/new-leads`

This keeps `/leads` focused on worked leads while preserving visibility into the review backlog.

## Page Structure

### Top area

- Existing page heading stays
- Bulk selection toolbar stays near the top
- Bulk toolbar remains quiet until one or more leads are selected

### Active tabs

- Horizontal tab row
- Always visible near the top of the content area
- Selected tab shows one full-width active section only

### Outcome tabs

- Separate secondary tab row below the active workspace
- Visually calmer than the active rail
- Selected tab shows one full-width outcome section only

## Section Layout

Each selected tab renders one full-width section.

### Section header

- Category title
- Short description
- Count badge

### Section body

- Lead cards for that category only
- Empty state card when no leads exist in the selected category

### Empty state behavior

- One full-width empty-state card
- Short explanatory copy
- No narrow placeholder columns

## Card Layout

Preserve the simplified board-card structure:

- buyer name
- contact line
- stage badge
- score
- updated timestamp
- persistent footer action bar

Summary remains excluded from board cards and stays in lead detail only.

### Footer action bar

Keep the current approved interaction model:

- always visible
- category dropdown on the left
- quiet overflow menu on the right

### Category dropdown behavior

- current stage first
- valid next moves only
- immediate apply on selection

### Overflow menu behavior

- `Open lead`
- `Delete`

## Responsive Behavior

### Mobile

- Active and outcome tab rows are horizontally swipeable
- No horizontal page-level board scrolling
- One full-width section rendered under the selected tab
- Lead cards remain single-column
- Footer controls remain fully visible and tappable

### Tablet

- Same tab-driven model
- Prefer a single-column card list unless two columns still feel comfortable

### Desktop

- Selected section fills available width
- Lead cards can render in a maximum 2-column grid if card width remains healthy
- Do not return to 3+ columns on this page

## State Model

Use URL-backed tab state so the page is refresh-stable and shareable.

Suggested search params:

- `active=ready_to_show | appointment_booked | nurture | hold`
- `outcome=closed_won | closed_lost | archived`

Defaults when params are absent:

- `active=ready_to_show`
- `outcome=closed_won`

Selection state can clear when the visible list changes. That is acceptable and keeps the interaction safer.

## Accessibility

- Tabs must use standard keyboard-reachable tab semantics
- Swipeable mobile rails must still work without gesture-only interaction
- Active state must be clear visually and semantically
- Counts and empty states must remain understandable without relying on color alone
- Footer controls keep their current labels and tap target sizes

## Implementation Shape

Likely changes:

- `apps/web/components/leads-manager.tsx`
  - replace board-row grid rendering with active/outcome tabbed sections
  - keep current card body/footer logic
- `apps/web/components/leads-manager.test.tsx`
  - update render assertions for tab rails and single-section rendering
- `apps/web/app/leads/page.tsx`
  - potentially parse and pass URL search params if tab state is server-owned

Possible extraction if the component grows:

- `apps/web/components/leads-stage-tabs.tsx`
- `apps/web/components/leads-stage-section.tsx`

## Risks

- Mixing server-owned search params with client-owned selection state can create unnecessary resets if handled carelessly
- Over-designing the tab rails could make mobile noisier than the current view
- If `New` remains visible in `/leads`, the page can drift back toward being both review inbox and active workspace

## Validation Plan

- Component tests for:
  - active tab defaults to `Ready to show`
  - outcome tabs render separately
  - only one active section is shown at a time
  - only one outcome section is shown at a time
  - mobile-friendly tab rail markup is present
- Browser verification for:
  - desktop readability on `/leads`
  - mobile layout without horizontal page-level scrolling
  - footer action bar usability inside the widened cards

## Decision

Proceed with dual horizontal tab rails and full-width category sections, with:

- active work tabs defaulting to `Ready to show`
- `New` staying in `/new-leads`
- outcomes in a separate secondary tab group
- swipeable tab rails on mobile
