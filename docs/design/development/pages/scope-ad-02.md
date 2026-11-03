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

Accepted design: the [Settings hub design decision](../../../decisions/settings-hub-figma-design.md) of 22 October 2026 covers the Settings hub (WS-D6) at the proposed route `/admin/settings`, the Business policies register at `/admin/policies`, and the policy record at `/admin/policies/[id]` with its Terms and Version 2 proposal tabs, the Propose change and Publish dialogs, the refused publication and the Readable record references record, with thirteen icon-free captures in [design r01](../../../reference/ui/settings/settings-hub-design-r01/README.md). Departures D1–D8 and answers Q1–Q6 are recorded there. Implementation is retained in draft PR #802; focused functional proof and Codex visual comparison are recorded in the evidence, separately from owner acceptance and deployment.

Accepted amendment: the [Settings amendments design decision](../../../decisions/settings-amendments-figma-design.md) of 1 November 2026 adds to the policy record the History tab (every version with its people and times, comparison, links to Audit history), the Affected work tab (owner, state and hand-off to PL-04; it never reschedules) and the read-only field readiness record, with its seven desktop frames and three desktop states in [design r01](../../../reference/ui/settings/settings-amendments-design-r01/README.md). Departures D1–D9 and answers Q1–Q7 are recorded there. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 10–13 in [design r01](../../../reference/ui/settings/settings-hub-design-r01/README.md): the Settings overview, the policy record at 390 and 320, and four phone states. Accepted amendment: images 08, 09 and 13 in [Settings amendments design r01](../../../reference/ui/settings/settings-amendments-design-r01/README.md): the record, History and Affected work lists, comparison, the Propose change, Review and Publish sheets and the "Review out of date" refusal at 390 and 320, and five phone states.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Settings hub design r01](../../../reference/ui/settings/settings-hub-design-r01/README.md) and [Settings amendments design r01](../../../reference/ui/settings/settings-amendments-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Settings hub design r01 captures](../../../reference/ui/settings/settings-hub-design-r01/README.md) (thirteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/settings-hub-figma-design.md). The [Settings amendments](../../../decisions/settings-amendments-figma-design.md) add the History and Affected work tabs, the field readiness record and the phone propose, review and publish sheets. The working-hours record beyond its history state, the other configuration areas' pages, the Waiting to publish view, the publish success state, tablet for the amendments and 200% zoom are not drawn. Codex built the r01 design in pull request #802 under the standing order on 31 October 2026; the Settings amendments accepted on 1 November 2026 are not built in it.

The draft User Guide `guide.ad.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Application acceptance is pending. Retain matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native AD-02 implementation

The working contracts are [Settings hub](route-admin-settings.md), [Business policies](route-admin-policies.md) and [policy record](route-admin-policies-id.md). Seed-only readiness and working-hours records are read-only uses of the existing record pattern, not implementation of the separately accepted field-readiness amendment. [Evidence and differences](../../../testing/evidence/settings-hub/README.md) track the build. Hiding unavailable areas was an agent decision under the standing order; the [decision record](../../../decisions/settings-hub-figma-design.md#native-implementation-direction--31-october-2026) identifies the relayed chat as context, not repository evidence of Dean’s acceptance. No visual acceptance is recorded.

## Review findings 2–9 — 4 November 2026

Only current-head proposals with a future start, no successor and no publication are live. A reviewed live branch takes precedence over a newer unreviewed branch; the register, Waiting to publish, record and hub use that selection and count only live branches. A review is called out of date only when saved review evidence exists. Access/recovery truncation is shown as a lower-bound count ending in `+`; disposed recovery cases are excluded before paging.

The r01 omissions in finding 6 are addressed by Waiting on and Last change columns, a named Who can change it block, the future-booking count from saved review evidence in the Policy state bar, My account and preferences using the existing shell Account panel, and a PL-04 saved-review link to the policy record. Waiting on names the required independent duty. Last change is the latest saved scheduling proposal, review or publication time; seeded families and the owner-decision record say Not recorded because the read has no authoritative change event for them. Who can change it names duties rather than inventing named assignees: the existing read does not enumerate current eligible reviewers/publishers. Without a saved review the future-booking count is omitted, because no complete evaluated population is available; an earlier review’s count is explicitly reference only. These are declared data limits, not changes to the accepted design.

The side menu marks its current link and shows All policies and Waiting to publish counts. Card footers reset all padding and use 12 px text. Terms and proposal views label out-of-date reviews consistently and singular booking counts use singular grammar. The History/Affected work tabs, field-readiness amendment record and phone propose/review/publish sheets accepted on 1 November remain separate scope and are not built here. The shared phone dialogs remain the earlier agent implementation decision.
