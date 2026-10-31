# Appointment coordination detail — design reference

Stable entry: `scope:SV-04`. Owner: Dean Fiedler. Status: **Owner visual review pending for this implementation** (prior 9 October Refine review retained below).
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/schedule`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Current implementation contract

SV-04 uses the accepted shared record composition at `/service/appointments/[id]`. The [route contract](route-service-appointments-id.md) is the maintained source for Figma node IDs, named version, desktop/mobile requirements, gated P4/P5 scope, reused components, deviations and open questions. [Execution evidence](../../../testing/evidence/appointment-detail-native/README.md) records synthetic verification separately from owner review.

## Purpose and task

Appointment detail and controlled scheduling already exist. Any further design refinement should extend that route.

1. Review the proposed visit and its contact/readiness evidence
2. Confirm available crew through the scheduling workflow
3. Track changes and individual acknowledgement

## Desktop

Accepted design: the [Appointment detail design decision](../../../decisions/appointment-detail-figma-design.md) of 17 October 2026, with captures 01–02 (desktop 1440) and 03 (tablet 1024) in [design r01](../../../reference/ui/service/appointment-detail-design-r01/README.md).

- **Layout:** the Work order record's shared record layout with no view tabs. The record header carries a state Tag and a readiness Tag; the readiness bar lists Parts, Job pack acknowledged, Site readiness, Site and isolation controls and Crew competency; the left column holds Summary, Customer and site and Crew.
- **Main column, one scroll:** Dispatch held (or Ready to dispatch) with its reasons, Dispatch checks derived from the records (field readiness gate P1 and P4), the job pack deadline, Job pack acknowledgements and Returns, Customer contact, Follow-ups, Schedule change requests and a collapsed Integrity details.
- **Tablet:** the details column moves below the main column, and the top bar shows the page name only.
- The native implementation uses merged gate P1–P3. P4/P5 remain gated under the current task; the source dialog and site-readiness states are retained references.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 04–07 in [design r01](../../../reference/ui/service/appointment-detail-design-r01/README.md). One column with status, the dispatch panel and checks first, then the visit, job pack, contacts and follow-ups, with Record contact and the primary action pinned at the bottom. Record customer site readiness opens as a full-screen sheet with stacked actions. Six phone states are drawn: ready, site readiness overdue, customer reports not ready, held again by a supply change, proposed and cancelled.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The mobile source composition is accepted; owner review of the native implementation is pending. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Appointment detail design r01 captures](../../../reference/ui/service/appointment-detail-design-r01/README.md) (seven icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/appointment-detail-figma-design.md). Images of loading, no access, stale save and uncertain save states, and of the Link a demand, Parts statement and permitted exception dialogs, are still missing.

- [PPO-Scheduling-and-Appointments-Workspace-r01.html](../../../reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) — its Appointment view is the appointment coordination detail for this scope: interval and time zone, commitment, preparation, dispatch hold, crew, readiness, follow-ups, change requests, contacts and history.

It is a standalone, module-only design of 15 September 2026 (no application rail or global shell), retained unchanged; its bytes match the SHA-256 `def8ebed4adc4f41b41bbfe954f8286e1162a23bf0f734fc3007c9aef78cf6d5` in its change record. Its own `design-metadata` block names register entries SV-04, PL-01, PL-04 and a read-only PL-02 subset. It is linked as the HTML reference of the three full entries only; the metadata names no application route, so the route entries are unchanged. It labels an unassigned demand lane, a multi-week outlook, advisory customer work windows and a rescheduling and acknowledgement centre as proposed extensions that need an owner decision. No owner visual review, native device acceptance or application integration is recorded, and it is not an accepted baseline in `docs/standards/ui-baselines.json`.

Its design record (`docs/decisions/scheduling-workspace-design.md`) and change record exist only inside the retained package [ppo-design-scheduling-r01-files.zip](../../../reference/ui/service/ppo-design-scheduling-r01-files.zip); neither was extracted into `docs/decisions/` or `docs/delivery/`. The change record leaves five owner decisions open, including confirmation of the ten r01 design decisions and whether an accepted revision would be registered with a governing route of `/service/schedule` (the application planner route is `/schedule`).

Native captures and comparisons are tracked in the implementation evidence above; owner visual review remains pending.

## Behaviour, handovers and verification

The draft User Guide `guide.sv.04` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium.
- **Findings:** Follows its appointment page.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

## P4/P5 backend consumer note — 24 October 2026

[PR #690](https://github.com/deanrfiedler-gif/powerplants-one/pull/690) implements the authorised backend/API slice in draft. The [service API amendment](../../../contracts/service-api.md) defines typed contact checks and the narrow preparation projection. UI wiring of the accepted P4/P5 designs is a separate follow-up; existing unavailable-state copy remains until that work is accepted and built. This note adds no visual-review evidence or acceptance claim.
