# Customer support request and conversation — design reference

Stable entry: `scope:CP-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/portal/support`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement customer support list/new/detail/reply and safe attachment flows.

1. Check whether the issue is already recorded
2. Prepare the request with clear symptoms and context
3. Track replies and requested information

## Desktop

Accepted design: the [Support requests design decision](../../../decisions/support-requests-figma-design.md) of 30 October 2026 covers the Support list, New request in three steps and a review, Received, uncertain receipt, request detail with reply, later-stage Visit booked and Resolved, and the staff public-reply amendment to SV-02, with thirty-five icon-free captures in [design r01](../../../reference/ui/customer-portal/support-requests-design-r01/README.md). Departures D1–D16 and answers Q1–Q8 are recorded there. The portal uses its own shell (CP-01 D1–D2), not the application shell described below. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 16–31, 34 and 35 in [design r01](../../../reference/ui/customer-portal/support-requests-design-r01/README.md): the list, the new request flow, Received and detail with reply at 390 and 320, reply sent and the just-received detail at 390, and nine phone states (D15).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Support requests design r01 captures](../../../reference/ui/customer-portal/support-requests-design-r01/README.md) (accepted Figma design, icon-free)
- [customer-portal-mockup.html](../../../blueprints/customer-portal-mockup.html) (earlier direction)

## Behaviour, handovers and verification

Accepted Figma design: [Support requests design r01 captures](../../../reference/ui/customer-portal/support-requests-design-r01/README.md) (thirty-five icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/support-requests-figma-design.md). Attachments are CP2a; the design shows "Photos coming soon" and no upload. Dark mode, 200% zoom, a two-site view and a desktop closed request are not drawn. D-024 stays open, and Resolved and Closed depend on ADR-0043, still proposed. Building it is not decided.

The draft User Guide `guide.cp.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
