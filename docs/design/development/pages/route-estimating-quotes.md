# Quotations — design reference

Stable entry: `route:/estimating/quotes`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/quotes`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is present in application source at ccc2251b. Review its specific workflow and release evidence; source presence does not establish deployment or full-scope acceptance.

1. Filter the scoped estimate window by reference or title
2. Continue to older windows of 100 estimates and retain q/offset in the URL
3. Open an exact quotation, then use its independent release/response controls

## Desktop

Accepted design: the [Quotations design decision](../../../decisions/quotations-design.md) of 11 October 2026, with captures 01–03 in [Quotations design r01](../../../reference/ui/estimating/quotations-design-r01/README.md). It reuses the [Reviews & approvals](../../../decisions/estimate-reviews-design.md) shell and grid. The app still shows the earlier list; the shell parts wait for their own rollout decision.

- **Layout at 1440 × 900:** the labelled 240 px rail with Quotations selected (white tile, Solid icon); the breadcrumb "Estimating & quotation / Quotations" as the page title; a flush 240 px secondary menu; then a 60 px toolbar and a full-bleed grid.
- **Secondary menu:** All quotations and My quotations (owned by you), a Stage group (Draft, Awaiting approval, Approved, not issued, Issued, Accepted, Declined, Converted) and a Needs attention group (Held, Returned, Negotiation, Clarification, Delivery unknown). Neutral counts appear on open views only. It collapses to a 20 px strip from its right border or the top-bar toggle.
- **Toolbar:** Customer and Owner filters, the count with its refresh time, Refresh and "…".
- **Grid:** one row per quotation, showing its latest revision. Single-line 40 px rows with lines between cells. Columns: Quotation (reference and revision), Title, Customer, Stage (icon and words), Value ex GST (right-aligned), Updated (sorted, newest first), Owner and Estimate. The checkbox column and the settings and "…" column stay fixed while the grid scrolls sideways. Long titles and customers end with an ellipsis; the record window shows them in full.
- **Stage:** derived only from recorded ES-05, ES-06 and ES-07 facts, using the decision's stage table. Attention stages use the warning text colour, Declined is muted, and every stage has words. There is no validity column.
- **Record window:** clicking a row opens it over the grid, never squeezing it. Its left edge meets the secondary menu's right edge, with close, previous and next on that edge. It shows the summary, the lifecycle of the exact revision, the rule note, Files and Recipient tabs, and History. Its buttons are Open release and Open response.
- **Selection:** ticking rows shows a selection toolbar and a 360 px panel with Open in sequence and Export list only. Decisions stay on each quotation's release and response pages.

At 1440 × 960 and 1024 × 768, also inspect the complete shell and stylesheet order and keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired design/application review.

## Mobile

Accepted design: captures 04–05 in [Quotations design r01](../../../reference/ui/estimating/quotations-design-r01/README.md).

- **Header and toolbar at 390 × 844:** the page name only, with no breadcrumb. A toolbar holds a view picker ("All quotations") standing in for the secondary menu, the count and a filter icon button.
- **List:** flush list rows about 80 px tall, each showing the title and value, the reference and customer, and the stage and last update, with a chevron.
- **Record view:** tapping a row opens a full-screen record view with back, previous and next. The record is stacked, and Open release and Open response are fixed at the bottom.
- **Tab bar:** icons only, the five Estimating tabs, each with a hidden accessible label. Quotations is reached through More, so More is the current tab.

At 320 CSS px and 200% zoom, keep the same task and record context. Inputs use readable 16 px text and touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen. Phone selection of several rows is not designed yet.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Accepted Figma design: [Quotations design r01 captures](../../../reference/ui/estimating/quotations-design-r01/README.md) (icon-free PNGs; not application captures)
- [PPO-Quotation-Approval-Issue-and-Distribution-r02.html](../../../reference/ui/quoting/PPO-Quotation-Approval-Issue-and-Distribution-r02.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.quotes` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## NAV contextual navigation

Filter by estimate reference/title and continue through older windows of up to 100 scoped estimates. offset and q are shareable state; each quotation receives an exact access check. Missing or restricted sources are partial, not an empty complete register.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.
