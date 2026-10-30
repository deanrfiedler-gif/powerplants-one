# Customer quotation, variation and account views — design reference

Stable entry: `scope:CP-06`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/portal/commercial`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement separately authorised customer quotation, variation and account views.

1. Identify the exact commercial record
2. Review conditions and the permitted response
3. Retain the attributable response and next action

## Desktop

Accepted design: the [Quotations and account design decision](../../../decisions/quotations-account-figma-design.md) of 30 October 2026 covers the commercial home, issued quotations (list, exact revision, reply, replaced), issued variations (list, view with reply, question, reply sent), orders and deliveries (in transit, delivered with proof, report a problem), account, invoice query and access not granted, with thirty-six icon-free captures in [design r01](../../../reference/ui/customer-portal/quotations-account-design-r01/README.md). Departures D1–D16 and answers Q1–Q7 are recorded there. The page uses the CP-01 portal shell, not the application shell; the wording below about the application shell doesn't apply to it. Tablet: capture 16.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 17–36 in [design r01](../../../reference/ui/customer-portal/quotations-account-design-r01/README.md): commercial home, order tracking, quotation view and reply, account and variation with reply at 390 and 320, and eight phone states. One column of cards, a labelled Show selector in place of the tabs, 16 px text and inputs, and 48 px buttons (D15).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Quotations and account design r01 captures](../../../reference/ui/customer-portal/quotations-account-design-r01/README.md) (accepted Figma design, icon-free)
- [customer-portal-mockup.html](../../../blueprints/customer-portal-mockup.html) (earlier direction)

## Behaviour, handovers and verification

The draft User Guide `guide.cp.06` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
