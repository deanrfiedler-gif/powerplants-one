# Reference cases and calibration proposals — design reference

Stable entry: `scope:ES-10`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/reference-cases`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement reviewed reference cases, comparison eligibility, sample limitations and controlled calibration proposals.

1. Check whether the reference case is eligible
2. Compare like-for-like measures and record limitations
3. Submit a calibration proposal for review

## Desktop

Accepted design: the [Reference cases and calibration design decision](../../../decisions/reference-calibration-figma-design.md) of 30 October 2026 covers the case register, case detail, comparison and withheld comparison, calibration proposal, preview scenario, independent review and the estimator panel amendment, with fifteen icon-free captures in [design r01](../../../reference/ui/estimating/reference-calibration-design-r01/README.md). Departures D1–D13 and answers Q1–Q5 are in the decision.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 11–14 in [design r01](../../../reference/ui/estimating/reference-calibration-design-r01/README.md): case detail and the reviewer screen at 390 and 320, with a compact record header, flush sections and a sticky 48 px primary action (D13).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Reference cases and calibration design r01 captures](../../../reference/ui/estimating/reference-calibration-design-r01/README.md) (accepted Figma design, icon-free)
- [PPO-Reference-Cases-and-Calibration-Proposals-r01.html](../../../reference/ui/reference-calibration/PPO-Reference-Cases-and-Calibration-Proposals-r01.html)

## Behaviour, handovers and verification

Accepted Figma design: [design r01 captures](../../../reference/ui/estimating/reference-calibration-design-r01/README.md) (fifteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/reference-calibration-figma-design.md). The successor draft, Knowledge lesson links, 200% zoom and dark mode are not drawn. No threshold, review authority or adoption route is operative.

The draft User Guide `guide.es.10` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
