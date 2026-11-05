# Customer accounts, applications and exceptions — design reference

Stable entry: `scope:FN-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/finance/accounts`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend existing account observations into full applications, disputes, unapplied amounts, ageing and authoritative source reads.

1. Select the correct customer account and company
2. Review the authoritative observations and completeness
3. Investigate unapplied, disputed or unmatched amounts

## Desktop

Accepted exceptions design: the [Finance exceptions design decision](../../../decisions/finance-exceptions-figma-design.md) of 1 November 2026, under FN-01 and FN-02 and traced to FIN-03 and FIN-06, at a proposed route `/finance/exceptions`, with captures 01–08 (desktop 1440), 09 (tablet 1024) and 14–20 (states) in [design r01](../../../reference/ui/finance/finance-exceptions-design-r01/README.md): the worklist by type and owner, the exception record with its line comparison, preserved original, evidence and verification, Needs Finance review and unknown-outcome lookup. FN-02 supplies disputes, unapplied amounts and MYOB credit status. It is not built and has no route.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted exceptions design: captures 10–13 in [design r01](../../../reference/ui/finance/finance-exceptions-design-r01/README.md): the worklist summary and an exception record at 390 and 320, with the compact phone header and one 48 px action on the record.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [finance-exact-account.png](../../../testing/evidence/department-navigation/finance-exact-account.png)
- [PPO-Finance-and-Commercial-Controls-r02.html](../../../reference/ui/finance/PPO-Finance-and-Commercial-Controls-r02.html)

## Behaviour, handovers and verification

The draft User Guide `guide.fn.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
