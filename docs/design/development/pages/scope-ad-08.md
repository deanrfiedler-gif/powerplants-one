# Retention and information lifecycle — design reference

Stable entry: `scope:AD-08`. Owner: Dean Fiedler. Status: **Figma design owner-accepted, 1 November 2026; not built**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/admin/retention`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement retention, hold, export/deletion request and information-lifecycle review.

1. Identify the policy and any hold
2. Review scope and downstream copies
3. Record authorised lifecycle decisions and actual outcomes

## Desktop

Accepted design: the [Retention and information lifecycle design decision](../../../decisions/retention-lifecycle-figma-design.md) of 1 November 2026 covers a policies register by status, a policy record, holds, a request record with per-system outcomes, an export manifest and run history, with twenty-two icon-free captures in [design r01](../../../reference/ui/retention-lifecycle-design-r01/README.md). The page is not built. The text below stays as general guidance, and the accepted design governs where they differ.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 08–13 in [design r01](../../../reference/ui/retention-lifecycle-design-r01/README.md): policies list, policy summary and request record at 390 and 320, with the compact header, list rows and flush sections.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

Retain application mobile evidence here when the page is built and reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Retention design r01 captures](../../../reference/ui/retention-lifecycle-design-r01/README.md) (icon-free). No exact HTML reference or application capture exists.

Every legal basis reads "To be confirmed", and this design gives no legal view. PPO deletes nothing from MYOB or SharePoint. D-012, D-020, D-021 and D-024 stay open.

## Behaviour, handovers and verification

The draft User Guide `guide.ad.08` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
