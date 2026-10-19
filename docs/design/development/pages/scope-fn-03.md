# Project financial performance — design reference

Stable entry: `scope:FN-03`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/finance/projects`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement project financial performance using agreed budget/actual/commitment/forecast/billing/cash definitions.

1. Select the project and reporting basis
2. Compare measures only where definitions and periods align
3. Own material differences and incomplete sources

## Desktop

Accepted design: the [Project financial performance design decision](../../../decisions/project-financial-performance-figma-design.md) of 19 October 2026 covers `/finance/projects` (Finance rail "Project performance"), a record at `/finance/projects/[id]` and the monthly review (both proposed), with twenty-two icon-free captures in [design r01](../../../reference/ui/finance/project-performance-design-r01/README.md). Departures D1–D9 and the adopted answers are recorded there: MYOB as the ledger and this page as a read-only review layer, one reporting basis per view, a monthly review that freezes each project's forecast with Finance acceptance, cost by category reconciled to MYOB, over/under billing, margin by month end, figures that say why they are missing, rule-based differences with owners, visible measure definitions, and a details column that collapses like the secondary menu. Nothing is built; the rail item stays unavailable.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 12–15 in [design r01](../../../reference/ui/finance/project-performance-design-r01/README.md): the list at 390 and 320 with the compact phone header and a basis caption, the record at full length with a sticky main action, and the reporting basis sheet. The phone tab bar shows the Finance tabs.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Icon-free Figma captures: [Project financial performance design r01](../../../reference/ui/finance/project-performance-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [design r01 captures](../../../reference/ui/finance/project-performance-design-r01/README.md) (twenty-two icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/project-financial-performance-figma-design.md). A build needs Finance-approved definitions (D-017), a read-only MYOB adapter under its own decision, the FN-06 category map, review and difference records, and a cross-project read. The coordinator's review form, a returned review, the full record tabs, the difference record and the tablet record are not drawn. The named Figma version "Project financial performance — accepted" was saved on 19 October 2026.

The draft User Guide `guide.fn.03` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
