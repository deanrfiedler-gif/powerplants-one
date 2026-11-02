# Estimate detail — design reference

Stable entry: `route:/estimating/estimates/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/estimates/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Confirm the record reference and customer/site context in this record workspace.
2. Find the intake or existing estimate
3. Check scope completeness and required clarification
4. Assign or review the next estimating action

Accepted design: the [Estimate detail design decision](../../../decisions/estimate-detail-figma-design.md) of 30 October 2026 makes this page the record of the adopted estimate versions, with 21 icon-free captures in [design r01](../../../reference/ui/estimating/estimate-detail-design-r01/README.md). Departures D1–D16 and answers Q1–Q8 are recorded there: the shared record layout with a checks bar of five facts, a primary action that follows state, a linked-records chain, and Summary, Lines, Sources, Versions, Review, Quotations, Import evidence and History tabs. Prices and quantities change only in CPQ, and a changed source marks the version without refreshing it. Nothing new is built; until the matching build steps are delivered, the running page keeps its editable workbook and the rest of this entry describes it.

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

Accepted design: captures 11–15 in [design r01](../../../reference/ui/estimating/estimate-detail-design-r01/README.md): the tablet record at 1024, and a reviewer's phone summary and read-only lines at 390 and 320 with the compact record header, checks and review state as lists, section links and a sticky action bar.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Estimation-Wizard-Container-r03.html](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html)
- Accepted Figma design: [Estimate detail design r01 captures](../../../reference/ui/estimating/estimate-detail-design-r01/README.md) (captures 01–07 and 11–19 for this page; design compositions, not application captures) and its [decision](../../../decisions/estimate-detail-figma-design.md). The History tab, the Sources tab with no change and 200% zoom are not drawn. The named Figma version "Estimate detail — shared record layout, accepted" was saved on 31 October 2026.

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.estimates.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Exact review integration

Review exact saved estimate opens the ES-04 native record. A `version_id` entry link now selects that original saved cost version and shows the current version separately. Existing E1 cost editing and Draft output remain unchanged. Reuse the shared link and preserve the original template/bytes. See [native review](route-estimating-estimates-id-review.md).

## NAV contextual navigation

Saved version selection uses version_id URL state. The reader validates exact estimate/version membership. Invalid or unavailable revisions recheck current access and display a truthful fallback notice; dirty/uncertain work must be reviewed before changing revision.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.
