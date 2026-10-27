# Work order register — design reference

Stable entry: `route:/service/work-orders`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/work-orders`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Confirm work authority and the exact scope
2. Review readiness and any out-of-scope findings
3. Use controlled successor scope when requirements change

## Desktop

Accepted design: the [Work orders design decision](../../../decisions/work-orders-design.md) of 11 October 2026, with captures 01–04 in [Work orders design r01](../../../reference/ui/service/work-orders-design-r01/README.md). It reuses the [Reviews & approvals](../../../decisions/estimate-reviews-design.md) shell and grid. The native implementation now composes the existing shared shell and register table; owner comparison remains pending.

- **Layout at 1440 × 900:** the labelled 240 px Service rail, with its 15 destinations in the three AU-08 groups at 40 px each and Work orders selected (white tile, Solid icon, neutral badge counting Ready to authorise); the breadcrumb "Work orders" (shell top bar amendment, 16 October 2026) as the page title; a flush 240 px secondary menu; then a 60 px toolbar and a full-bleed grid.
- **Secondary menu:** All work orders, My work orders (you are the Service owner), Drafts and Authorised; a Needs attention group (Scope needed, Blocked at authorisation, Ready to authorise, Successor in draft); and a Planning group (No visit proposed, Visit needs review, Coverage unresolved). Neutral counts. It collapses to a 20 px strip from its right border or the top-bar toggle.
- **Toolbar:** "New work order" as the primary button, Owner and Site filters, the count with its refresh time, Refresh and "…".
- **Grid:** one row per work order. Single-line 40 px rows with lines between cells. Columns: Work order (reference and current scope revision, sorted newest first), Scope summary, Customer, State, Authorisation (icon and words), Coverage, Next visit, Site, Requests, Service owner and Updated. The checkbox column and the settings and "…" column stay fixed while the grid scrolls sideways. Long values end with an ellipsis; the record window shows them in full.
- **Authorisation and next visit:** derived only from what the code records, using the decision's display rules. Blocked uses the warning text colour, Scope needed and Authorised are muted, and every status has words.
- **Record window:** clicking a row opens it over the grid, never squeezing it, right-aligned at its both-menus-open width, with close, previous and next on its left edge. It shows the summary, the current scope, the rule note, Readiness and Visits tabs, and History. Its buttons are Open request and Open work order. Authorisation stays on the record page.
- **Selection:** ticking rows shows a selection toolbar and a 360 px panel with Open in sequence and Export list only.

At 1440 × 960 and 1024 × 768, also inspect the complete shell and stylesheet order and keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired design/application review.

## Mobile

Accepted design: captures 05–06 in [Work orders design r01](../../../reference/ui/service/work-orders-design-r01/README.md).

- **Header and toolbar at 390 × 844:** the page name only, with no breadcrumb. A toolbar holds a view picker ("All work orders") standing in for the secondary menu, the count and a filter icon button.
- **List:** flush list rows about 80 px tall, each showing the scope summary and last update, the reference and customer, and the authorisation status with the planning position, with a chevron.
- **Record view:** tapping a row opens a full-screen record view with back, previous and next. The reference sits in the header and the title in the body. The record is stacked, and Open request and Open work order are fixed at the bottom.
- **Tab bar:** icons only, five Service tabs (My Work, Service requests, Work orders, Schedule, More), each with a hidden accessible label. Work orders is the current tab.

At 320 CSS px and 200% zoom, keep the same task and record context. Inputs use readable 16 px text and touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen. Phone selection of several rows is not designed yet.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Accepted Figma design: [Work orders design r01 captures](../../../reference/ui/service/work-orders-design-r01/README.md) (icon-free PNGs; not application captures)
- [PPO-Work-Orders-Workspace-r01.html](../../../reference/ui/service/PPO-Work-Orders-Workspace-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.service.work-orders` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Additive backend contract

The [Work orders backend](../../../decisions/work-order-register-backend.md) supplies permission-scoped register and record projections. Counts cover all readable work orders matching the current search/owner/site filters before pagination; Partial reads explicitly label lower bounds. Evidence and history identify their native source scope. The existing screen and commands remain compatible; accepted Figma integration is implemented in the register PR; visual review remains pending. [Execution evidence](../../../testing/evidence/work-order-register/README.md) records actual checks. No review fingerprint is changed.

## Implementation adaptations for review — 24 October 2026

The later compact phone header supersedes the retained phone toolbar (P1–P9). Native loading, error, denied, empty, partial-source and refresh states use existing controls. Phone selection uses press-and-hold and Shift+Space; selection/export is explicitly page scoped. Filters and paging persist in the URL and are passed to the record as return context. Counts use PermissionScopedMatchingFilters and are not a workspace-wide business total. No visit proposed keeps the backend contract’s no-active-visit meaning, including drafts; proposal is not booking or dispatch. History explicitly names its native command scope. Updated remains the WorkOrder timestamp. Missing custom states in the drawings are adaptations requiring visual review, not owner-accepted additions.
