# Sales-to-estimating handover — design reference

Stable entry: `scope:CR-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/handoffs/estimating`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement versioned Sales-to-Estimating submission, clarification, accept/return and receiving ownership.

1. Prepare the submission with owned unknowns
2. Ask the receiving estimator to accept or return that exact brief
3. Resolve clarification and preserve superseded submissions

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

- [sales-estimating-intake-preview-r02.html](../../../reference/ui/estimating/sales-estimating-intake-preview-r02.html)

## Behaviour, handovers and verification

The draft User Guide `guide.cr.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native Sales implementation contract

Save a Sales brief, submit an exact frozen revision and record an independent Estimating receiving decision.

- Sales preparation worklist: select a permitted deal and create its draft.
- Brief: problem/outcome, included scope, exclusions, assumptions, unknowns, date, locations/equipment and exact evidence.
- Review: Submit, Clarify, Answer, Resolve, Return and Accept remain separate.
- History and comparison: source basis and immutable revisions. Estimating Intake shows submitted briefs.

The current deal owner needs opportunity edit access. The chosen receiver needs estimating.edit and source visibility. Prepare an open, owned and dated Activity linked to the Opportunity.

Save is not Submit. Submission freezes content. Accepted for estimating is not estimate or quotation approval. A later draft never replaces the previous submitted basis. Evidence identifies its native source and exact revision.

Acceptance records receiving evidence only. It does not create or approve an Estimate. The latest submitted revision remains the Intake basis while a successor is a draft.

Desktop: retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

Mobile: stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.cr.02` carries normal and recovery steps.

Retained reference: `docs/reference/ui/estimating/sales-estimating-intake-preview-r02.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ES-05/06/07, agreements and automatic downstream effects remain unavailable under ADR-0046. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.
