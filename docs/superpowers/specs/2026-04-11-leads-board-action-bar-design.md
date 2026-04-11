# Leads Board Action Bar Redesign

## Goal
Reduce clumsiness on `/leads` by making stage changes faster and quieter while preserving the split pipeline board.

The board should optimize for:
- fast re-categorization
- lighter card scanning
- less duplicated chrome
- calmer bulk actions

## Current Problems
- Lead cards carry too much competing information: stage badge, recommendation badge, score, updated time, summary, open link, delete action, and selection checkbox all compete inside narrow board columns.
- The board's primary job is operational movement, but stage controls are not the clearest affordance on the card.
- Page-level selection controls stay visually present even when nothing is selected.

## Chosen Direction
Use a persistent bottom action bar on every lead card.

The bottom bar becomes the primary control surface:
- left: category dropdown
- right: overflow menu

The dropdown is always visible and applies changes immediately.
The overflow menu stays small and only holds secondary actions.

## Card Structure

### Top Region
Always visible:
- buyer name
- contact line
- current stage badge

Visual rules:
- keep the stage badge, but quieter than before
- remove recommendation as a stacked peer to the stage badge
- recommendation can be omitted from the board card entirely or reduced to low-emphasis metadata later if product needs it back

### Middle Region
Keep only compact scan information:
- score
- updated timestamp

Rules:
- use a compact two-column layout
- let updated span the full width when needed
- do not show the summary on the board card

### Bottom Region
Persistent action bar pinned to the bottom of each card:
- category dropdown trigger on the left
- overflow actions trigger on the right

Rules:
- always visible, not hover-only
- visually separated with a subtle top border or surface change
- controls stay compact and operational, not decorative

## Category Dropdown

### Content
Each card's dropdown should list:
- current stage first
- divider
- valid next-stage moves only

Do not show:
- `new` as a manual destination for reviewed leads
- `appointment_booked` as a manual destination
- invalid transitions

For `new` leads:
- the control should not behave like the reviewed-lead move control
- preferred handling: disabled dropdown or a review-routed label that makes it clear this lead belongs in the review flow

### Behavior
- selecting a new stage applies immediately
- selecting the current stage does nothing
- the card should show pending feedback during the mutation
- success should update the card in place
- failure should keep the previous stage visible and surface an inline or toast-level error

## Overflow Menu
Keep this intentionally small:
- `Open lead`
- `Delete`

Do not duplicate stage actions here.
Do not show summary or expanded metadata in the menu.

## Bulk Selection

### Default State
When nothing is selected:
- keep selection chrome quiet
- avoid a loud bulk-action bar

### Active Selection State
When one or more leads are selected:
- reveal a compact bulk toolbar
- show selected count
- show bulk delete

This keeps the board centered on movement first and bulk cleanup second.

## Navigation Behavior
- The full card body may navigate to lead detail.
- The bottom action bar must not trigger navigation.
- Footer controls need strict event isolation so dropdown/menu interaction never opens the lead by accident.

## Information Architecture
Board cards are for:
- identity
- stage
- quick action

Lead detail is for:
- summary
- narrative context
- deeper reasoning
- full operational history

This means summary text should remain visible only on the lead detail page, not in the board card.

## Accessibility
- Dropdown and overflow menu must be keyboard reachable.
- Use visible labels, not icon-only ambiguity for the primary stage control.
- Provide accessible loading and success/failure announcements for immediate stage changes.
- Footer controls must preserve focus correctly after selection.
- Selection and bulk toolbar states should remain screen-reader understandable.

## Implementation Shape

### Affected UI Areas
- `apps/web/components/leads-manager.tsx`
- likely shared lead-card presentation concerns if extraction becomes worthwhile
- stage helpers already in `apps/web/lib/lead-stage.ts`
- existing stage update action path in `apps/web/lib/actions.ts`

### Recommended Component Boundaries
- keep the board section renderer in `LeadsManager`
- extract a focused lead-card footer action component if the JSX starts to sprawl
- keep stage-option derivation in helpers, not inline UI conditionals

## Testing

### Component Coverage
- card renders persistent footer action bar
- dropdown shows current stage plus valid next moves only
- invalid destinations do not appear
- summary is absent from the board card
- bulk toolbar stays hidden until at least one lead is selected
- overflow menu exposes only `Open lead` and `Delete`

### Browser Verification
- category changes apply immediately from the dropdown
- footer controls do not accidentally navigate
- card body navigation still opens lead detail
- narrow desktop board columns remain readable
- selected-card bulk toolbar appears only when needed

## Recommended Rollout
Ship as a focused `/leads` interaction cleanup, not a broader pipeline redesign.

That keeps the change bounded to:
- board card hierarchy
- stage control affordance
- quieter bulk selection behavior

and avoids reopening the appointments, review inbox, or lead-detail architecture.
