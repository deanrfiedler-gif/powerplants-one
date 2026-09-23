# Rescheduling and acknowledgement centre — design reference

Stable entry: `scope:PL-04`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/schedule/changes`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend existing move/change/contact commands into a rescheduling and acknowledgement review centre.

1. Review the existing booking and affected crew
2. Record the proposed move or cancellation reason
3. Complete required contact and renewed acknowledgement

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

- [PPO-Scheduling-and-Appointments-Workspace-r01.html](../../../reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) — its Contacts & follow-up view (owned consequences, contact history and the rescheduling and cancellations list) covers this scope. No `/schedule/changes` route exists.

It is a standalone, module-only design of 15 September 2026 (no application rail or global shell), retained unchanged; its bytes match the SHA-256 `def8ebed4adc4f41b41bbfe954f8286e1162a23bf0f734fc3007c9aef78cf6d5` in its change record. Its own `design-metadata` block names register entries SV-04, PL-01, PL-04 and a read-only PL-02 subset. It is linked as the HTML reference of the three full entries only; the metadata names no application route, so the route entries are unchanged. It labels an unassigned demand lane, a multi-week outlook, advisory customer work windows and a rescheduling and acknowledgement centre as proposed extensions that need an owner decision. No owner visual review, native device acceptance or application integration is recorded, and it is not an accepted baseline in `docs/standards/ui-baselines.json`.

Its design record (`docs/decisions/scheduling-workspace-design.md`) and change record exist only inside the retained package [ppo-design-scheduling-r01-files.zip](../../../reference/ui/service/ppo-design-scheduling-r01-files.zip); neither was extracted into `docs/decisions/` or `docs/delivery/`. The change record leaves five owner decisions open, including confirmation of the ten r01 design decisions and whether an accepted revision would be registered with a governing route of `/service/schedule` (the application planner route is `/schedule`).

No application image is linked. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.pl.04` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
