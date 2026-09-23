# Cross-domain resource demand and capacity — design reference

Stable entry: `scope:PL-03`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/schedule/capacity`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement cross-domain demand/capacity review for engineering, installation and service without silently changing bookings.

1. Compare demand on a consistent time basis
2. Identify over-allocation and unknown effort
3. Prepare owned capacity actions for the relevant schedulers

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

## Behaviour, handovers and verification

The draft User Guide `guide.pl.03` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## S1–S5 native implementation

Page type: **Review / comparison**. Canonical destination: `/schedule/capacity`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select a 7-, 28- or 90-day horizon, display timezone and permitted site. Review each source domain’s completeness or Unavailable state.
2. Filter by domain, source commitment, resource mapping, required skill or unknown effort. Unknown resource/skill filters explicitly retain missing mappings.
3. Review source references, UUIDs, versions/as-at, customer/site context, owner, time basis and next action. Follow the exact owning-domain link for resolution.
4. Exclude contributions from an analytical scenario and compare its count and reserved resource minutes against the visible baseline. Reset or refresh discards the scenario.

Project programme dates and Engineering required dates never become labour effort. Service reservations include crew and explicit buffers; they are not labour estimates. No utilisation denominator or percentage is claimed.

Desktop: toolbar wraps; PL-04 queue and comparison sit beside the exact record. PL-03/PL-05 use readable evidence cards. Phone: stack filters, queue/detail and current/proposed sections; preserve words, UUID context and reachable actions. The shared shell owns vertical scrolling. Use 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom for review.

Reuse: current shell, business-ui Field/SelectField/ReadState/Stamp, Button/ButtonLink, existing PlannerBoard and RequestDecision controls. Incoming: current scoped source/version evidence. Outgoing: existing owning-domain commands and exact PL-04 handovers; scenarios do not mutate.

No exact page-specific retained HTML or accepted mockup exists. The new composition is proposed for owner visual review.

[Executed evidence and remaining review](../../../testing/evidence/scheduling-resources/README.md). Application images are pending until that index identifies inspected captures. No review fingerprint or owner acceptance is created by this edit.

## S1–S5 native implementation

Page type: **Review / comparison**. Canonical destination: `/schedule/capacity`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select a 7-, 28- or 90-day horizon, display timezone and permitted site. Review each source domain’s completeness or Unavailable state.
2. Filter by domain, source commitment, resource mapping, required skill or unknown effort. Unknown resource/skill filters explicitly retain missing mappings.
3. Review source references, UUIDs, versions/as-at, customer/site context, owner, time basis and next action. Follow the exact owning-domain link for resolution.
4. Exclude contributions from an analytical scenario and compare its count and reserved resource minutes against the visible baseline. Reset or refresh discards the scenario.

Project programme dates and Engineering required dates never become labour effort. Service reservations include crew and explicit buffers; they are not labour estimates. No utilisation denominator or percentage is claimed.

Desktop: toolbar wraps; PL-04 queue and comparison sit beside the exact record. PL-03/PL-05 use readable evidence cards. Phone: stack filters, queue/detail and current/proposed sections; preserve words, UUID context and reachable actions. The shared shell owns vertical scrolling. Use 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom for review.

Reuse: current shell, business-ui Field/SelectField/ReadState/Stamp, Button/ButtonLink, existing PlannerBoard and RequestDecision controls. Incoming: current scoped source/version evidence. Outgoing: existing owning-domain commands and exact PL-04 handovers; scenarios do not mutate.

No exact page-specific retained HTML or accepted mockup exists. The new composition is proposed for owner visual review.

[Executed evidence and remaining review](../../../testing/evidence/scheduling-resources/README.md). Application images are pending until that index identifies inspected captures. No review fingerprint or owner acceptance is created by this edit.
