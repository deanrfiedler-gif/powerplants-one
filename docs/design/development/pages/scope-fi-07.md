# Customer attendance and report response — design reference

## Embedded SV-06 build

The existing report-record response is now hosted by the [SV-06 tabbed contract](scope-sv-06.md), using PPO - Design, Service review and reports — accepted, page 1265:53. Dean accepted the Customer response design at 1490:70 on 22 October 2026 ([decision](../../../decisions/customer-response-figma-design.md)); it is not built, and this embedded form remains the built page. Existing FI-07 parent IDs, exact draft/issued binding, attendance subject, append-only correction and uncertain-receipt recovery remain unchanged. Native owner visual review and deployment remain pending; see [SV-06 verification](../../../testing/evidence/service-review-build/README.md).

Stable entry: `scope:FI-07`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/reports`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Attendance/report response capabilities have an existing P07/P09 foundation. Retain and verify their distinct meanings; no new standalone route is established by this inventory.

1. Identify whether the response concerns attendance or report content
2. Record the response against the correct event/revision
3. Keep outstanding findings and follow-up visible

## Desktop

Accepted design: the [Customer response design decision](../../../decisions/customer-response-figma-design.md) of 22 October 2026 covers the Customer response tab of `/service/reports/[id]`, with captures 01–08 in [design r01](../../../reference/ui/service/customer-response-design-r01/README.md) (Figma `1490:111`, `1491:393540`, `1490:311`, `1490:411`, `1490:511`, `1490:611`, `1490:711`, tablet `1495:393233`). One card per subject, current response first (D1); a focused view for presenting the exact report (D2); inline record and correct-or-clarify forms (D3, D4); and uncertain-save recovery on the tab (D5). Nothing new is built; the embedded SV-06 form remains the built page.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 09–14 in [design r01](../../../reference/ui/service/customer-response-design-r01/README.md): the technician's Response view with the compact Record header, the Record response sheet with a drawn mark at 390 and 320, waiting to send, recorded, and five phone states (D6, D7).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Retained proposed [Service Review & Reports r02](../../../reference/ui/service-review/PPO-Service-Review-and-Reports-Workspace-r02.html). Accepted Figma design: [Customer response design r01](../../../reference/ui/service/customer-response-design-r01/README.md) (fourteen icon-free PNGs; design compositions, not application captures). Accepted native FI-07 application images are missing.

## Behaviour, handovers and verification

The draft User Guide `guide.fi.07` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Accepted Figma design: [Customer response design r01 captures](../../../reference/ui/service/customer-response-design-r01/README.md) and its [decision](../../../decisions/customer-response-figma-design.md). A Declined or Customer unavailable response, the signature mark viewer, desktop presentation of draft evidence, the Finance handoff and 200% zoom are not drawn. Named Figma version: "Customer response — accepted", saved 22 October 2026.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.


## FI-07 native contract and conformance

Scope FI-07 remains Customer attendance and report response. r20 Register / worklist is the discovery type; report detail is Document & evidence workspace with supporting Record detail and Form / guided workflow. Runtime module-workspaces and ui-baselines declare padded layout, #ppo-reports and shell #main scroll ownership.

The original report, actual technician attendance, company/site, work order/appointment, exact scope, reviewed audience, revision and presentation remain identifiable. Internal attendance acceptance is labelled separately from customer attendance acknowledgement and report-content response. Empty response remains unsaved. Historical and successor responses show their exact presentation, original stated identity/role, capturing actor, times, qualification and explicit predecessor; issued files remain separately retrievable.

Incoming: P07 actual attendance/completion, P09 exact review/audience/presentation/issue, FI-03/FI-04 inspection findings, readiness/FI-05 and FI-06 holds. Outgoing: immutable response/clarification; permitted Activity with actual owner/due/outcome and reverse source link; existing work-order visit proposal. Customer response grants no work, inspection, incident, scheduling or Finance authority.

Reused components: existing shell/information-icon mapping, shared Button from src/components/ui/button.tsx, ReadState/ErrorNotice, Stamp, recoverable-command journal and ExactReportPresentation. New response/recovery buttons retain shared variants; legacy review/issue controls remain a scoped exception. The exact HTML frame expands without changing retained bytes. Long hashes and fields wrap, with the same decisions at 1440/1024/390/320 CSS px and actual 200% zoom. Heading/validation focus, return to the presentation opener and guide return are observable requirements.

Proposed departures from retained Service Review & Reports r02: preserve DraftEvidence and IssuedReport; add explicit attendance-facts subject, append-only correction and receipt recovery; retain in-flow original evidence/history rather than copying demonstration persistence or issued-only controls. The application uses the existing 8px card token where r20 proposes 7px. An accepted Figma design exists (22 October 2026); no native FI-07 application review exists. Source/native captures are technical comparison evidence, not owner visual acceptance.

See [decision](../../../decisions/field-customer-response.md), [acceptance matrix](../../../testing/field-customer-response-acceptance.md) and [executed evidence](../../../testing/evidence/field-customer-response/README.md). Visual review, physical-device/screen-reader acceptance and deployment remain separate; no review fingerprint is assigned.

## Integrated acceptance session — 3 October 2026

Use the [current owner walkthrough](../../../delivery/field-integrated-owner-walkthrough.md) and [source-specific PT ledger](../../../testing/field-integrated-acceptance-ledger.md). Desktop1440/1024, phone390/320, actual200% zoom, readable history and one content scroll owner remain required. Technical captures and keyboard automation are separate from actual human findings. Accepted timer r05 and existing scope/page/component bindings are unchanged; native closed-visit/FI07 mockup gaps and pending reviews remain visible. No fingerprint or reviewer is supplied by this guide update.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Deferred to phase 04, with SV-06.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium.
- **Findings:** Its pages (/service/reports) sit in phase 04 by their own rank. Review it with SV-06 there.
- **Scope of this record:** no visual review is recorded; the verdict defers it.
