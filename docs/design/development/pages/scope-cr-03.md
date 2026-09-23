# Won-deal receiving handover — design reference

Stable entry: `scope:CR-03`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/handoffs/won`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement controlled Won-deal receiving for Projects, Service and parts orders over the existing handover-due obligation.

1. Identify what was accepted and which items need delivery
2. Review gaps with the receiving domain
3. Record item-level acceptance or an owned return reason

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

- [PPO-Sales-to-Delivery-Handover-Workspace-r01.html](../../../reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.cr.03` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native Sales implementation contract

Prepare and receive a precise delivery handover while preserving the immutable Won handover-due obligation.

- Won worklist: source deal and current receiving state.
- Brief: selected delivery items, exact evidence, destination basis and release prerequisites.
- Review: source fingerprint and independent return/accept decision.
- History: immutable Won obligation, submitted revisions and successor evidence.

Start with a Won opportunity. Preparation requires current deal ownership and edit access. A designated Projects or Service receiver needs its existing command capability and source visibility. Parts receiving has no implemented contract.

Customer acceptance, CRM Won, conversion, receiving, work release, scheduling, delivery and Finance are separate. ES-05/06/07 outcomes remain unavailable on the audited main. No routing thresholds are inferred.

Receiving creates no Project, Service work order, sales order, stock movement, booking or ERP/Finance transaction.

Desktop: retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

Mobile: stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.cr.03` carries normal and recovery steps.

Retained reference: `docs/reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ES-05/06/07, agreements and automatic downstream effects remain unavailable under ADR-0046. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.

Paired review refinement: the exact brief uses the shared two-column form grid, stacking on phones. Routing basis, selected items and release prerequisites each retain their 4000-character source limit.
