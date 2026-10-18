# Discovery costing — design reference

Stable entry: `route:/estimating/discovery/[id]/costing`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/discovery/{id}/costing`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Identify the exact saved discovery revision and alternative being costed.
2. Review the source quantities, price/cost basis and any unknown values.
3. Compare options using their explicit cost versions; discovery edits do not automatically reprice or adopt an estimate basis.
4. Wider workflow outcome: A selected, traceable discovery basis with owned review items.

## Desktop

Accepted design: the [Discovery costing design decision](../../../decisions/discovery-costing-figma-design.md) of 18 October 2026, with captures 01–05 and 09 in [design r01](../../../reference/ui/estimating/discovery-costing-figma-design-r01/README.md). Figma page "Discovery costing · ES-02" `1431:809`: cost lines `1431:846`, review and adopt dialog `1432:375662`, discovery changed `1432:376321`, not ready to cost `1432:377502`, tablet `1431:1610`.

- **Place:** the wizard's Pricing step (step 4 current) in the same workspace shell, with the Costing summary and the bottom bar (D1).
- **Basis and scope:** a callout names the option and revision being costed and the saved estimate's revision; Scope being costed lists the changes since that revision, with the exact saved source in a disclosure (D2, D3).
- **Cost lines:** the accepted Pricing grid, prefilled from the current cost version with a pen marker on lines that differ; equal-height totals tiles; customer wording (D4, Q2).
- **Adopt:** a review dialog with what will be saved, checks, a required reason and a confirmation (D6). Discovery changed keeps the proposal and blocks adoption; an Incomplete revision shows what is not ready (D7).
- Nothing new is built; the text below describes the general rules the build must still meet.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 06–08 and 10 in [design r01](../../../reference/ui/estimating/discovery-costing-figma-design-r01/README.md) (`1433:2403`, `1431:1921`, `1433:2492` and the loading state `1431:2157`). A basis banner, the viewed option, step navigation, scope changes, cost lines as rows with Edit, a totals card and the customer wording; Summary and Review and adopt in the footer. Each line is edited in a full-screen editor (Q4, not drawn).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Estimation-Wizard-Container-r03.html](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html)
- [Discovery costing design r01](../../../reference/ui/estimating/discovery-costing-figma-design-r01/README.md) — owner-accepted 18 October 2026: the wizard's Pricing step for one saved Complete revision, cost lines prefilled from the current cost version, and a review-and-adopt dialog; desktop, tablet, phone 390 and 320, four dialog outcomes and a phone loading state; [decision](../../../decisions/discovery-costing-figma-design.md). Not built

## Behaviour, handovers and verification

Accepted Figma design: [design r01 captures](../../../reference/ui/estimating/discovery-costing-figma-design-r01/README.md) and its [decision](../../../decisions/discovery-costing-figma-design.md). First costing with no saved estimate (Q1), the phone line editor, the Revisions and Alternatives tabs and 200% zoom are not drawn.

The draft User Guide `guide.page.estimating.discovery.id.costing` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
