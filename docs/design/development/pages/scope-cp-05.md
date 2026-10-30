# Customer knowledge and guided support — design reference

Stable entry: `scope:CP-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/portal/knowledge`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement customer knowledge and guided support.

1. Find the relevant support topic
2. Check applicability and safe boundaries
3. Escalate unresolved issues through the configured support path

## Desktop

Accepted design: the [Customer knowledge design decision](../../../decisions/customer-knowledge-figma-design.md) of 30 October 2026 covers Help home, search results, the article with applicability in words and a distinct Stop and call us note, guided help questions and result, CP-02 step 2 prefilled from guided help, superseded and withdrawn articles, and states, with twenty-nine icon-free captures in [design r01](../../../reference/ui/customer-portal/customer-knowledge-design-r01/README.md). Captures 01–09 are desktop and 10 is tablet. This page is not built. The portal shell comes from the [Portal home and access design](../../../decisions/portal-home-access-figma-design.md), so the staff shell wording below does not apply to it.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 11–23 and 28–29 in [design r01](../../../reference/ui/customer-portal/customer-knowledge-design-r01/README.md): Help home, guided help, result, request support and article at 390 and 320, and the withdrawn and offline states at 390. Guided help comes first on phone, and answers use large touch targets.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Customer knowledge design r01](../../../reference/ui/customer-portal/customer-knowledge-design-r01/README.md): accepted Figma captures
- [customer-portal-mockup.html](../../../blueprints/customer-portal-mockup.html): earlier direction only

## Behaviour, handovers and verification

The draft User Guide `guide.cp.05` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
