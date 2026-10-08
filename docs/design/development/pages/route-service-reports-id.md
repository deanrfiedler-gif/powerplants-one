# Service report detail — design reference

Stable entry: `route:/service/reports/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/reports/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Confirm the record reference and customer/site context in this record workspace.
2. Review the exact technician submission
3. Resolve unclear evidence and separate follow-up work
4. Issue the controlled report through the permitted review workflow

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

- [PPO-Service-Review-and-Reports-Workspace-r02.html](../../../reference/ui/service-review/PPO-Service-Review-and-Reports-Workspace-r02.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.service.reports.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.


## FI-07 native contract and conformance

Scope FI-07 remains Customer attendance and report response. r20 Register / worklist is the discovery type; report detail is Document & evidence workspace with supporting Record detail and Form / guided workflow. Runtime module-workspaces and ui-baselines declare padded layout, #ppo-reports and shell #main scroll ownership.

The original report, actual technician attendance, company/site, work order/appointment, exact scope, reviewed audience, revision and presentation remain identifiable. Internal attendance acceptance is labelled separately from customer attendance acknowledgement and report-content response. Empty response remains unsaved. Historical and successor responses show their exact presentation, original stated identity/role, capturing actor, times, qualification and explicit predecessor; issued files remain separately retrievable.

Incoming: P07 actual attendance/completion, P09 exact review/audience/presentation/issue, FI-03/FI-04 inspection findings, readiness/FI-05 and FI-06 holds. Outgoing: immutable response/clarification; permitted Activity with actual owner/due/outcome and reverse source link; existing work-order visit proposal. Customer response grants no work, inspection, incident, scheduling or Finance authority.

Reused components: existing shell/information-icon mapping, shared Button from src/components/ui/button.tsx, ReadState/ErrorNotice, Stamp, recoverable-command journal and ExactReportPresentation. New response/recovery buttons retain shared variants; legacy review/issue controls remain a scoped exception. The exact HTML frame expands without changing retained bytes. Long hashes and fields wrap, with the same decisions at 1440/1024/390/320 CSS px and actual 200% zoom. Heading/validation focus, return to the presentation opener and guide return are observable requirements.

Proposed departures from retained Service Review & Reports r02: preserve DraftEvidence and IssuedReport; add explicit attendance-facts subject, append-only correction and receipt recovery; retain in-flow original evidence/history rather than copying demonstration persistence or issued-only controls. The application uses the existing 8px card token where r20 proposes 7px. No accepted native FI-07 desktop or phone mockup exists. Source/native captures are technical comparison evidence, not owner visual acceptance.

See [decision](../../../decisions/field-customer-response.md), [acceptance matrix](../../../testing/field-customer-response-acceptance.md) and [executed evidence](../../../testing/evidence/field-customer-response/README.md). Visual review, physical-device/screen-reader acceptance and deployment remain separate; no review fingerprint is assigned.

## NAV contextual navigation

A permitted reviewed/issued Report can open an existing exact scoped Finance handoff. Only issued sources with preparation authority offer the rechecked form. Hosted offline recovery is explanatory; local recovery retains original operations.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.

## Submitted photo inspection — working adaptation

SV-06 review now offers ReportPhoto beside each submitted Photo entry to the current permitted Service owner. Inspect/Hide/Retry reuse Button; loading and errors use explicit text. The inline original is bound to the exact report revision, photo version, hash and byte count. It fits the host width and 70vh, retaining one scroll owner and surrounding decision/reason input. Refresh, hide, identity changes and replacement content dispose of its temporary URL. Current read failure suppresses inspection. Customer-safe presentations remain separate.

See the [component specification](../components/report-photo.md), [decision](../../../decisions/report-photo-inspection.md) and [execution record](../../../testing/evidence/report-photo-inspection/README.md). Native desktop/phone owner acceptance and physical-device/screen-reader review remain pending; no fingerprint is assigned.
