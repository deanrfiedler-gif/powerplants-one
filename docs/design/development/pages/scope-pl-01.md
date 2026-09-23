# Service planner and unassigned demand — design reference

Stable entry: `scope:PL-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/schedule`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The current service planner/unassigned-demand increment exists; STATUS explicitly records PL-01 complete. Do not list it as an unbuilt page.

1. Select the demand and use Plan visit where available
2. Prepare the site-time proposal and continue through readiness/contact
3. Confirm eligible crew and inspect the resulting appointment

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

- [PPO-Scheduling-and-Appointments-Workspace-r01.html](../../../reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) — its Service planner view (day and week lanes, busy bands, drag or keyboard Move to propose, and the unassigned demand lane) covers this scope.

It is a standalone, module-only design of 15 September 2026 (no application rail or global shell), retained unchanged; its bytes match the SHA-256 `def8ebed4adc4f41b41bbfe954f8286e1162a23bf0f734fc3007c9aef78cf6d5` in its change record. Its own `design-metadata` block names register entries SV-04, PL-01, PL-04 and a read-only PL-02 subset. It is linked as the HTML reference of the three full entries only; the metadata names no application route, so the route entries are unchanged. It labels an unassigned demand lane, a multi-week outlook, advisory customer work windows and a rescheduling and acknowledgement centre as proposed extensions that need an owner decision. No owner visual review, native device acceptance or application integration is recorded, and it is not an accepted baseline in `docs/standards/ui-baselines.json`.

Its design record (`docs/decisions/scheduling-workspace-design.md`) and change record exist only inside the retained package [ppo-design-scheduling-r01-files.zip](../../../reference/ui/service/ppo-design-scheduling-r01-files.zip); neither was extracted into `docs/decisions/` or `docs/delivery/`. The change record leaves five owner decisions open, including confirmation of the ten r01 design decisions and whether an accepted revision would be registered with a governing route of `/service/schedule` (the application planner route is `/schedule`).

No application image is linked. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.pl.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## S1–S5 native implementation

Page type: **Planning workspace**. Canonical destination: `/schedule`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select a day/week, display timezone and permitted site or resource. Working hours, anonymous busy reservations and travel buffers remain separate from visit times.
2. From authorised unassigned demand choose Plan visit. Preserve the work-order version and site time; save the proposal, review readiness, record contact, then confirm eligible crew with explicit travel values and reasons.
3. Use Move or reassign as the keyboard alternative to drag. Compare the exact saved booking and proposed interval/crew before submitting. Open a resource name for availability and competence evidence.
4. Use Changes & follow-up, Travel review or Demand & capacity in the Scheduling navigation.

Existing same-tab booking recovery and server commands are preserved. Request decisions now show current versus proposed time, named crew, travel and version differences.

Desktop: toolbar wraps; PL-04 queue and comparison sit beside the exact record. PL-03/PL-05 use readable evidence cards. Phone: stack filters, queue/detail and current/proposed sections; preserve words, UUID context and reachable actions. The shared shell owns vertical scrolling. Use 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom for review.

Reuse: current shell, business-ui Field/SelectField/ReadState/Stamp, Button/ButtonLink, existing PlannerBoard and RequestDecision controls. Incoming: current scoped source/version evidence. Outgoing: existing owning-domain commands and exact PL-04 handovers; scenarios do not mutate.

The retained Scheduling r01 HTML is a proposed reference; newer authorised work-order demand and current appointment states govern application behaviour.

[Executed evidence and remaining review](../../../testing/evidence/scheduling-resources/README.md). Application images are pending until that index identifies inspected captures. No review fingerprint or owner acceptance is created by this edit.

## S1–S5 native implementation

Page type: **Planning workspace**. Canonical destination: `/schedule`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select a day/week, display timezone and permitted site or resource. Working hours, anonymous busy reservations and travel buffers remain separate from visit times.
2. From authorised unassigned demand choose Plan visit. Preserve the work-order version and site time; save the proposal, review readiness, record contact, then confirm eligible crew with explicit travel values and reasons.
3. Use Move or reassign as the keyboard alternative to drag. Compare the exact saved booking and proposed interval/crew before submitting. Open a resource name for availability and competence evidence.
4. Use Changes & follow-up, Travel review or Demand & capacity in the Scheduling navigation.

Existing same-tab booking recovery and server commands are preserved. Request decisions now show current versus proposed time, named crew, travel and version differences.

Desktop: toolbar wraps; PL-04 queue and comparison sit beside the exact record. PL-03/PL-05 use readable evidence cards. Phone: stack filters, queue/detail and current/proposed sections; preserve words, UUID context and reachable actions. The shared shell owns vertical scrolling. Use 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom for review.

Reuse: current shell, business-ui Field/SelectField/ReadState/Stamp, Button/ButtonLink, existing PlannerBoard and RequestDecision controls. Incoming: current scoped source/version evidence. Outgoing: existing owning-domain commands and exact PL-04 handovers; scenarios do not mutate.

The retained Scheduling r01 HTML is a proposed reference; newer authorised work-order demand and current appointment states govern application behaviour.

[Executed evidence and remaining review](../../../testing/evidence/scheduling-resources/README.md). Application images are pending until that index identifies inspected captures. No review fingerprint or owner acceptance is created by this edit.
