# My Work action centre — design reference

Stable entry: `scope:SH-02`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/work/actions`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The six My Work routes exist. Add source integrations as their domains are implemented; do not recreate the action centre.

1. Choose Overview, My actions, Reviews & handovers, Blocked & waiting or Team queue
2. Narrow the list to the relevant owner and work
3. Open the activity and record an outcome when completing it

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

- [PPO-My-Work-and-Action-Centre-r01.html](../../../reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.sh.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## SH continuation

Retain the existing desktop/phone My Work structure. Review and notification counts now follow shared source projections and qualify unavailable or bounded data. Personal view editing retains existing IDs and supports explicit criteria updates; team sharing remains Not configured. See [SH handover](../../../delivery/sh-platform-handover.md) and [verification](../../../testing/evidence/sh-platform/README.md). Merged shell controls require fresh integration review; no fingerprint or approval is added.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium.
- **Findings:** Follows its overview, reviews, new-activity and record pages below.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

## Figma application increment — 13 October 2026

The [implementation decision](../../../decisions/figma-ui-implementation.md) records the exact inspected Shell v2 and My Work source frames, SH-01/SH-02 scope, r20 Overview / dashboard type, shared components and source-command handovers. The [execution ledger](../../../testing/evidence/figma-ui/README.md) separates compiled functional proof, visual comparison and remaining owner/device review.

Desktop: 240 px labelled / 76 px compact rail; preserve the saved identity preference. The My Work secondary menu is 240 px, with a 20 px collapsed edge. At 1440 × 900, content starts at x=480; toolbar 60 px, summary 64 px, content gutters 24 px and side column 320 px. Narrower interiors stack side cards. Source-backed compact activity rows use a done ring for Record outcome and an actions menu for rescheduling. The page title and freshness no longer occupy a greeting block.

Phone: 390 × 844 and 320 px containment; current page heading, Emails/Leads/Tasks with labels, flush attention and agenda lists, accessible icon-only 64 px navigation and reachable Create. Unconfigured weather remains hidden. Preserve full details, unknown counts, permission checks, focus return and draft protection. Shared tokens come from the existing theme and the explicit Shell v2 palette in `src/app/styles/figma-shell.css`; overview rules are scoped in `src/app/styles/my-work-figma.css`.

Reuse the real application shell, SecondaryMenuFrame, ProductIcon/Icon, Menu and the existing Activity dialogs; no parallel renderer or new isolated fixture is claimed. The `figma-my-work-overview` host fixture and alignment item are in components.json and navigation-fixtures.json. Exact icon-free source images: `PPO-My-Work-01-Desktop-Overview-r01.png` and `PPO-My-Work-09-Phone-Overview-Actions-Activity-r01.png` in the retained My Work page-design capture set. Public standalone Shell v2 images are not supplied; the private inspected Figma frame and accepted module captures are the available reference. Runtime identity/guidance controls, unavailable counters and conditional weather are explicit adaptations. Other module interiors, My Work grids and detail/outcome overlay compositions still require their own implementation. Existing owner review fingerprints are preserved and stale; this edit grants no review.
