# Project detail & Gantt — design reference

Stable entry: `route:/projects/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Confirm the record reference and customer/site context in this record workspace.
2. Select the project and check its reporting basis
3. Review overdue milestones and explained health
4. Open the underlying issue before assigning recovery work

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [project-detail-desktop.png](../../../blueprints/projects-visuals/project-detail-desktop.png)
- [ppo-projects-gantt-content-r10.html](../../../reference/ui/projects/ppo-projects-gantt-content-r10.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.projects.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Owned material resolution — SYN-ES07-07

Retain ES-07, SC-09 and PJ-03 and their r20 evidence/review, receiving-register and native Project detail patterns. MaterialResolution within QuotationSupplyFollowups reuses Field, SelectField, Button, Status, source disclosures, dirty comparison and the actor-bound journal. Incoming: original quotation/conversion, received Receipt correction, completed allocation reduction, exact Requested Impact/MaterialAction and current Project task. Outgoing: four separate receiving decisions, immutable review, native forecast withdrawal and exact Impact successor with receipts, then fresh readiness/ES-07 disposition. Activity completion is separate.

Desktop compares quantities, unmet Demand, independent impacts and downstream versions before effects. Mobile 390/320 px stacks labels, wraps identifiers and keeps recovery before actions, with shared tokens, 44px targets and visible focus. Show Date needed explicitly. Completed receiving is retained history without renewed controls; continuing holds remain separate. Unknown originals block replacement through reload. Current authority precedes all linked snapshots/counts.

Exact retained references remain the quoting r01 and Supply readiness r03 HTML; Projects uses ppo-projects-gantt-content-r10.html. Native material mockup images are missing. This bounded forecast-withdrawal panel is the declared adaptation; no general dispatcher or rescheduling policy is adopted. Host fixtures: tests/browser/quotation-material-resolution.spec.ts and its database/HTTP siblings. The material-resolution ledger records actual checks/captures. Paired visual, owner, physical-device and screen-reader review remain pending; no fingerprint is promoted.

## One selected Project dependency — SYN-ES07-08

Retain existing ES-07 / SC-09 / PJ-03 scope and r20 evidence/review, receiving-register and native detail patterns. MaterialResolution reuses SelectField, Button, ButtonLink, Status, source disclosure and the original actor-bound journal. Incoming: exact received allocation outcome, Demand/Impact/Activity, Task A and explicitly selected native successor B. Outgoing: five distinct receiving decisions, immutable review, separately applied two-task withdrawal and exact Impact successor, three original receipts and fresh readiness/ES-07 disposition.

Desktop shows both current task positions, versions/owners, direction/kind and exact proposed dates; preserve dependency meaning and distinguish native missing-date warnings from completed scoped action. Mobile 390/320 px stacks labelled successor/receiving fields with 44px controls, 16px inputs, wrapping identifiers and visible focus. Recovery precedes replacement controls. Returned/Held/corrected/reassigned consent and extra/new dependencies remain visible holds. Completed evidence has no renewed acceptance controls.

Host/state fixtures: `tests/browser/quotation-task-dependency.spec.ts`, database/HTTP siblings and `tests/unit/quotation-task-dependency.test.ts`. Existing quoting r01, Supply readiness r03 and Projects r10 references remain exact. Accepted native pair mockup images are missing. This two-task panel is a proposed native adaptation; paired visual, owner, device and screen-reader review remain pending. No fingerprint is promoted.

## Three-task chain receiving — SYN-ES07-09

Retain ES-07, SC-09 and PJ-03 with the existing r20 evidence/review workspace, receiving register and native Project detail. Reuse MaterialResolution inside QuotationSupplyFollowups, SelectField, Field, Button/ButtonLink, Status, current shell, evidence disclosures, dirty comparison and actor-bound original journal. Incoming: exact completed allocation outcome and its quotation/Receipt lineage, selected Project-origin Demand, current Requested Impact/MaterialAction and explicitly selected A → B → C. Outgoing: six separate owner decisions, immutable review, separate atomic native application, exact Impact successor/four receipts, current readiness and fresh ES-07 disposition.

Desktop shows A, B and C owners/versions/dates/status/progress, both exact directed FS/SS relationships, original material change, unmet Demand, independent holds and proposed Unscheduled effects before decisions. The third selector appears after B is selected and resets when A/B/Impact changes. Third task is a distinct receiving control even for a common owner. Missing/reversed/extra edges hold action. Completed outcome preserves six decisions as history and exposes actual versions/receipts; MaterialAction remains separate. The Project Gantt shows all three Unscheduled tasks and both missing-date warnings, with unchanged relationships.

Mobile 390/320 px stacks labelled selectors and receiving panels, wraps IDs/provenance, preserves shared 44px targets and visible keyboard focus. Keep recovery above actions and one shell scroll owner; unknown originals disable replacement through reload. Current authority precedes linked facts, counts and historical disclosure. No shared theme exception or new page route.

Real host/state fixtures: tests/browser/quotation-task-chain.spec.ts (six-decision journey, committed lost response, inconclusive unsent original/exact retry), tests/http/quotation-task-chain.test.ts and tests/database/quotation-task-chain.test.ts. Retained references remain docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html, docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html and docs/reference/ui/projects/ppo-projects-gantt-content-r10.html for their respective scopes. Accepted chain mockup images are missing. The explicit proposed departure is this bounded three-task extension, not general graph scheduling. Paired-reference, physical-device, screen-reader and owner review remain pending; no fingerprint or review status is promoted. Actual functional evidence: docs/testing/evidence/quotation-task-chain/README.md.

Observed compiled b2f1eac captures: [1440px](../../../testing/evidence/quotation-task-chain/captures/completed-1440.png), [390px](../../../testing/evidence/quotation-task-chain/captures/completed-390.png), [320px](../../../testing/evidence/quotation-task-chain/captures/completed-320.png). See the [bounded observation](../../../testing/evidence/quotation-task-chain/README.md#bounded-viewport-observation). These are completed-panel evidence, not approved design references; existing review status/fingerprint is unchanged.

## Three-task branch receiving — SYN-ES07-10

Retain ES-07 / SC-09 / PJ-03 and the r20 evidence/review workspace, receiving register and native Project detail. Reuse MaterialResolution within QuotationSupplyFollowups, Field/SelectField, Button/ButtonLink, Status, existing shell/tokens, evidence disclosures and actor-bound recovery. Incoming: original quotation/Receipt lineage, exact received allocation outcome, Project-origin Demand, current Requested Impact/MaterialAction and explicitly selected A → B and A → C. Outgoing: six separate decisions, immutable review, separate atomic three-save/Impact application, four native receipts, current readiness and fresh ES-07 disposition.

Desktop shows the branch direction explicitly, all three current owners/versions/status/progress/dates and proposed Unscheduled effects. The Branch task C selector lists direct dependents of A distinct from B; selecting it clears the linear-chain choice, and vice versa. Changing Impact/A/B clears both third-task choices. Branch task C is a distinct receiving responsibility, never a relabelled Third task/ChainEnd decision. Both FS/SS links remain visible. Extra or introduced touching edges, consequential links and changed/revoked receiving remain holds. Completed evidence retains actual topology, versions and receipts without renewed acceptance controls; Activity completion is separate.

At 390/320 px stack labelled selectors/decisions, wrap identifiers and source evidence, retain 44px targets, 16px inputs, visible focus and one shell scroll owner. Recover uncertain originals before replacement through reload. Current authority precedes every linked record, count and historical outcome. No new route or shared-theme exception.

Host/state fixtures: tests/browser/quotation-task-branch.spec.ts (six independent decisions, lost committed response, inconclusive unsent original/exact retry), tests/http/quotation-task-branch.test.ts and tests/database/quotation-task-branch.test.ts. Exact retained references remain docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html, docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html and docs/reference/ui/projects/ppo-projects-gantt-content-r10.html. Accepted branch mockup images are missing. This branch panel is an explicit proposed departure requiring paired visual and owner review before visual baseline adoption. Physical-device/screen-reader acceptance and review fingerprints remain unchanged. Functional evidence: docs/testing/evidence/quotation-task-branch/README.md.
