# Resource availability and competence — design reference

Stable entry: `scope:PL-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/technicians`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Review published availability, competence validity and source review evidence. Certificate/renewal evidence remains Unknown.

1. Review current availability and preparation flags
2. Check applicable competence evidence
3. Use the planner for controlled assignment and booking

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

No exact image or HTML reference is linked. Keep this gap visible.

[PPO-Scheduling-and-Appointments-Workspace-r01.html](../../../reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) declares only a read-only PL-02 subset: its Resources view shows published calendars, exceptions, blocks and skills with no editor. It does not design this whole scope, so it is not linked as this entry's HTML reference; see `scope:SV-04`.

## Behaviour, handovers and verification

The draft User Guide `guide.pl.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## S1–S5 native implementation

Page type: **Record detail with existing register**. Canonical destination: `/service/technicians`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Keep Field Team Visits, Technicians and Needs preparation views. In Technicians, choose Availability & competence; the resource name in Planner also opens detail.
2. Select a seven-day review window. Inspect permitted site eligibility, active/publication state, source-as-at, effective dates and calendar version/timezone.
3. Review weekly intervals, exceptions, unavailable/other-work blocks and anonymous busy reservations. Open permitted appointment records for commitments and retained history.
4. Check skill status, validity and review evidence. Expired, not-yet-valid, expiring-within-period and unknown evidence stay explicit.

Resource/calendar/competence mutation is unavailable. Synthetic skills are not statutory certificates; certificate/renewal evidence remains Unknown. No private HR fields are added.

Desktop: toolbar wraps; PL-04 queue and comparison sit beside the exact record. PL-03/PL-05 use readable evidence cards. Phone: stack filters, queue/detail and current/proposed sections; preserve words, UUID context and reachable actions. The shared shell owns vertical scrolling. Use 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom for review.

Reuse: current shell, business-ui Field/SelectField/ReadState/Stamp, Button/ButtonLink, existing PlannerBoard and RequestDecision controls. Incoming: current scoped source/version evidence. Outgoing: existing owning-domain commands and exact PL-04 handovers; scenarios do not mutate.

No exact page-specific retained HTML or accepted mockup exists. The new composition is proposed for owner visual review.

[Executed evidence and remaining review](../../../testing/evidence/scheduling-resources/README.md). Application images are pending until that index identifies inspected captures. No review fingerprint or owner acceptance is created by this edit.

## S1–S5 native implementation

Page type: **Record detail with existing register**. Canonical destination: `/service/technicians`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Keep Field Team Visits, Technicians and Needs preparation views. In Technicians, choose Availability & competence; the resource name in Planner also opens detail.
2. Select a seven-day review window. Inspect permitted site eligibility, active/publication state, source-as-at, effective dates and calendar version/timezone.
3. Review weekly intervals, exceptions, unavailable/other-work blocks and anonymous busy reservations. Open permitted appointment records for commitments and retained history.
4. Check skill status, validity and review evidence. Expired, not-yet-valid, expiring-within-period and unknown evidence stay explicit.

Resource/calendar/competence mutation is unavailable. Synthetic skills are not statutory certificates; certificate/renewal evidence remains Unknown. No private HR fields are added.

Desktop: toolbar wraps; PL-04 queue and comparison sit beside the exact record. PL-03/PL-05 use readable evidence cards. Phone: stack filters, queue/detail and current/proposed sections; preserve words, UUID context and reachable actions. The shared shell owns vertical scrolling. Use 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom for review.

Reuse: current shell, business-ui Field/SelectField/ReadState/Stamp, Button/ButtonLink, existing PlannerBoard and RequestDecision controls. Incoming: current scoped source/version evidence. Outgoing: existing owning-domain commands and exact PL-04 handovers; scenarios do not mutate.

No exact page-specific retained HTML or accepted mockup exists. The new composition is proposed for owner visual review.

[Executed evidence and remaining review](../../../testing/evidence/scheduling-resources/README.md). Application images are pending until that index identifies inspected captures. No review fingerprint or owner acceptance is created by this edit.
