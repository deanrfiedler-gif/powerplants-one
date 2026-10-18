# Discovery register — design reference

24 September native navigation refinement: return to Estimating intake & workload at `/estimating`; saved estimates remain available at `/estimating?tab=estimates`. The five-step, immutable discovery and exact manual-costing contracts are unchanged. [Current programme](../../../delivery/estimating-programme-handover.md).

Stable entry: `route:/estimating/discovery`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/discovery`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Review Requirements, Configuration, Scope & delivery, Pricing and Review
2. Keep alternatives and their exact revisions distinct
3. Check the saved cost basis before preparing a quotation

## Desktop

Accepted design: the [Discovery register design decision](../../../decisions/discovery-register-figma-design.md) of 18 October 2026, with captures 01–05 in [design r01](../../../reference/ui/estimating/discovery-register-figma-design-r01/README.md). Figma page "Discovery register · ES-02" `1400:345306`: register `1400:345640`, Northbank snapshot `1400:352346`, tablet `1400:355129`, no workspaces yet `1402:3944`, view only `1402:4539`.

- **Register:** a grid, one row per workspace showing its selected option, most recently changed first (D1, Q1). Title (bold), Customer, Readiness and Cost basis fill the first view at 1440 and 1024; Selected option, Opportunity, Latest revision, Options, Estimator and Last changed follow when scrolled.
- **Identity:** the breadcrumb carries the rail label "Estimation wizard"; the "Scope and options" heading and the back link go (D2).
- **Views:** All workspaces and My workspaces (Estimator is the workspace owner, Q2); Readiness: Not recorded, Incomplete, Complete, Legacy manual basis; Costing: Ready for costing, Latest not costed; Options: With alternatives (D3).
- **Status in words:** Complete (success), Incomplete (warning), Not recorded and Legacy manual (neutral). Green means Complete scope readiness only, never priced or approved. Cost basis reads, for example, "v04 on r02 · r03 not costed" (D4).
- **Snapshot:** selecting a row opens the read-only large snapshot with the selected basis, the cost basis, Alternatives and Revisions tabs and recent activity; footer Open estimate and Open workspace (D5).
- **Create:** New discovery workspace (primary) goes to `/estimating/discovery/new` and is hidden without `estimating.edit` (D6).
- **Data:** customer, estimator, last changed and a cost-basis summary are proposed list-read fields, not confirmed data; `listDiscoveryWorkspaces` returns number, title and options today.
- Nothing new is built; the text below describes the general rules the build must still meet.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 06–08 in [design r01](../../../reference/ui/estimating/discovery-register-figma-design-r01/README.md) (`1400:354630`, `1400:354952` and the states `1400:355914`, `1400:356040`, `1400:356154`). Labelled list rows: title and changed date; number, customer and selected option (number and customer only at 320); a readiness and cost-basis line with an icon. A row opens the accepted wizard phone frames; there is no phone snapshot. Page guide moves into the identity menu at 390 and 320, and at 320 the title keeps the rail label with an ellipsis (D7, Q3). States: loading, no matching workspaces (names the active filters) and could not load, with no list or counts.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Discovery register design r01](../../../reference/ui/estimating/discovery-register-figma-design-r01/README.md) — eight icon-free Figma captures, owner-accepted 18 October 2026; design compositions, not application captures
- [PPO-Estimation-Wizard-Container-r03.html](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html)

## Behaviour, handovers and verification

Accepted Figma design: [design r01 captures](../../../reference/ui/estimating/discovery-register-figma-design-r01/README.md) and its [decision](../../../decisions/discovery-register-figma-design.md). Images of the snapshot's Revisions tab, desktop loading and error states, hover states, denied rows and 200% zoom are still missing. Create discovery workspace and Discovery costing are the next pages to draw (Q4).

The draft User Guide `guide.page.estimating.discovery` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
