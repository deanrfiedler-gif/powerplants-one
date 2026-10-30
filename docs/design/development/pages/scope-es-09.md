# Estimate-to-actual outcome review — design reference

Stable entry: `scope:ES-09`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/outcomes`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement estimate-to-actual comparison with separate issued/accepted/change bases, comparable actuals and attributable variance.

1. Choose the exact estimate baseline
2. Check actual quantity, cost and period completeness
3. Explain each comparable variance and assign learning actions

## Desktop

Accepted design: the [Estimate-to-actual review design decision](../../../decisions/estimate-actual-review-figma-design.md) of 30 October 2026 brings the issued r01 workspace onto the current shell, with 22 icon-free captures in [design r01](../../../reference/ui/estimating/estimate-actual-review-design-r01/README.md). Departures D1–D12 and answers Q1–Q7 are recorded there: a register with no amounts or margin column and five review states; the shared record layout with a comparison basis strip, a details column and tabs for Overview, Basis, Comparison, Sources, Matters, Review, Lessons and History; right side panels for declaring the basis, drilling into a line, concluding and preparing a handover; and a proposed Outcomes item in the Estimating rail. Nothing new is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 08–13 in [design r01](../../../reference/ui/estimating/estimate-actual-review-design-r01/README.md): the register and record at 1024, the outcome summary at 390 and 320 with the compact record header and a sticky 48 px action, and the full-screen reviewer approve screen with 16 px input text.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Estimate-to-Actual-Outcome-Review-r01.html](../../../reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-r01.html)
- Accepted Figma design: [Estimate-to-actual review design r01 captures](../../../reference/ui/estimating/estimate-actual-review-design-r01/README.md) (22 icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/estimate-actual-review-figma-design.md)

## Behaviour, handovers and verification

Accepted Figma design: see the [decision](../../../decisions/estimate-actual-review-figma-design.md). The successor review record, the History and Matters tabs as separate views, observer export, a phone register list and 200% zoom are not drawn. Building needs ES-09/A1's own authorisation, and FD-05 and FD-06 under D-017 before any Projects cost read is trusted. The named Figma version "Estimate-to-actual review · ES-09 — shared record layout, accepted" was saved on 30 October 2026.

The draft User Guide `guide.es.09` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
