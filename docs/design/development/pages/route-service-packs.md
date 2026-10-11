# Job pack register — design reference

Stable entry: `route:/service/packs`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/packs`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Prepare the pack against the correct scope
2. Review exact source/template revisions and readiness
3. Issue the checked pack and track recipient acknowledgement

## Desktop

Accepted design: the [Job pack design decision](../../../decisions/job-pack-figma-design.md) of 12 October 2026, with captures 01 and 07 in [Job pack design r01](../../../reference/ui/service/job-pack-design-r01/README.md). It reuses the Reviews & approvals shell and grid and the Work orders Service rail. The app still shows a card list; the shell parts wait for their own rollout decision.

- **Layout at 1440 × 900:** the labelled Service rail with Job packs selected (white tile, Solid folder-open icon, neutral badge counting the Needs attention items); the breadcrumb "Service operations / Job packs"; a flush 240 px secondary menu; then a 60 px toolbar and a full-bleed grid.
- **Secondary menu:**
  - All job packs and Prepared by me.
  - State: Drafts, Returned, Checked, Issued, Withdrawn.
  - Needs attention: Readiness not satisfied, Review required, Not yet acknowledged, Output recovery needed.
  - Next 7 days: Visits without a pack (needs a new read), Dispatch held.
  - Neutral counts. It collapses to a 20 px strip.
- **Toolbar:** "Prepare job pack" as the primary button, Technician and Site filters, the count with its refresh time, Refresh and "…".
- **Grid:** one row per pack, in single-line 40 px rows grouped by visit day (Earlier, Tomorrow, Later this week, Next week). The checkbox column and the settings and "…" column stay fixed while the grid scrolls sideways. Columns:
  - Job pack (display number and revision);
  - Visit (sorted earliest first);
  - Job (the verified scope summary);
  - State (the exact statusPresentation label);
  - Readiness ("n of m satisfied", amber when any criterion is unsatisfied);
  - Crew acknowledged;
  - Dispatch (Held or Clear);
  - Customer, Site, Technicians, Prepared by and Updated.
- **Record window:** clicking a row opens it over the grid, never squeezing it. It shows the job and visit, the three "Ready for dispatch" conditions and a rule note on the left; Readiness and Crew tabs and History on the right; and Print preview and "Open job pack" at the bottom.
- **Selection:** a 360 px panel with Open in sequence and Export list only.
- **States:** loading uses skeleton rows; filtered-empty names the filters and offers to clear them; the empty register links to the service planner (states board, capture 07).

At 1440 × 960 and 1024 × 768, also inspect the complete shell and stylesheet order and keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired design/application review.

## Mobile

Accepted design: capture 06 (first phone) in [Job pack design r01](../../../reference/ui/service/job-pack-design-r01/README.md).

- **Header and toolbar at 390 × 844:** the page name only. A toolbar holds a view picker ("All job packs"), the count and a filter icon button.
- **List:** flush list rows about 80 px tall, grouped by visit day. Each shows the job and visit date, the pack reference and customer, and the state with its attention or acknowledgement summary and the dispatch hold, with a chevron. Tapping a row opens the job pack's phone record page.
- **Tab bar:** icons only, the Service tabs with hidden accessible labels. Job packs has no tab, so More is current.

At 320 CSS px and 200% zoom, keep the same task and record context. Inputs use readable 16 px text and touch controls use the shared minimum target.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Accepted Figma design: [Job pack design r01 captures](../../../reference/ui/service/job-pack-design-r01/README.md) (icon-free PNGs; not application captures)
- [powerplants-one-job-pack-r03.html](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.service.packs` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
