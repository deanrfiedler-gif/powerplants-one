# Business configuration and policy publication — design reference

Stable entry: `scope:AD-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/admin/policies`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement governed business configuration and policy publication, including applicable numbering/naming rules.

1. Prepare the intended configuration change
2. Review affected workflows and records
3. Publish a controlled successor with effective context

## Desktop

Accepted design: the [Settings hub design decision](../../../decisions/settings-hub-figma-design.md) of 22 October 2026 covers the Settings hub (WS-D6) at the proposed route `/admin/settings`, the Business policies register at `/admin/policies`, and the policy record at `/admin/policies/[id]` with its Terms and Version 2 proposal tabs, the Propose change and Publish dialogs, the refused publication and the Readable record references record, with thirteen icon-free captures in [design r01](../../../reference/ui/settings/settings-hub-design-r01/README.md). Departures D1–D8 and answers Q1–Q6 are recorded there. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 10–13 in [design r01](../../../reference/ui/settings/settings-hub-design-r01/README.md): the Settings overview, the policy record at 390 and 320, and four phone states.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Settings hub design r01](../../../reference/ui/settings/settings-hub-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Settings hub design r01 captures](../../../reference/ui/settings/settings-hub-design-r01/README.md) (thirteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/settings-hub-figma-design.md). The History and Affected work tabs, the field readiness and working-hours records, the other configuration areas' pages, the publish success state, the phone propose and publish sheets and 200% zoom are not drawn. Building it is not decided.

The draft User Guide `guide.ad.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
