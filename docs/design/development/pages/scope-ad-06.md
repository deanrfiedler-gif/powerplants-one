# Migration, coexistence and cutover workbench — design reference

Stable entry: `scope:AD-06`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/admin/migration`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement migration/coexistence/cutover preparation, dry runs, validation and reconciliation.

1. Prepare a scoped migration rehearsal
2. Validate identities, quantities and exceptions
3. Review reconciliation and coexistence before any accepted cutover

## Desktop

Accepted design: the [Migration and cutover design decision](../../../decisions/migration-cutover-figma-design.md) of 1 November 2026 covers the overview, rehearsal run, reconciliation detail, exceptions, coexistence plan, cutover readiness and sign-off, with twenty icon-free captures in [design r01](../../../reference/ui/migration-cutover-design-r01/README.md). Departures D1–D10 and answers Q1–Q6 are recorded there. The page isn't built; it authorises no real migration or cutover.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 09–12 in [design r01](../../../reference/ui/migration-cutover-design-r01/README.md): overview and an exception with its owner fixing an item, at 390 and 320, and three phone states (13, 15, 16). Compact header, grouped list rows and one 48 px action on the exception.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Migration and cutover design r01 captures](../../../reference/ui/migration-cutover-design-r01/README.md) (accepted Figma design, icon-free)

## Behaviour, handovers and verification

The draft User Guide `guide.ad.06` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
