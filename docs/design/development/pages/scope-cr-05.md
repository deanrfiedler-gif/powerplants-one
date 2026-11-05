# Sales aftercare and renewal worklist — design reference

Stable entry: `scope:CR-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/aftercare`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement sales aftercare, post-installation reviews, training follow-up, renewal opportunities and owned tasks.

1. Review what was delivered and any open issues
2. Plan the aftercare contact or training follow-up
3. Record feedback and an owned renewal or support action

## Desktop

Accepted design: the [Sales aftercare design decision](../../../decisions/sales-aftercare-figma-design.md) of 30 October 2026 covers the worklist grouped by source event, the customer review record with its eleven-line outcome ledger, the Complete review dialog that sets exactly one outcome, the Service referral, the training record, the renewal handover to Deals and the history, with eleven icon-free captures in [design r01](../../../reference/ui/sales-aftercare/sales-aftercare-design-r01/README.md). Decisions D1–D10 and answers Q1–Q6 are recorded there. The built pages have not yet been changed to match it.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 09 and 10 in [design r01](../../../reference/ui/sales-aftercare/sales-aftercare-design-r01/README.md): the review record and the Record a statement form at 390 and 320, with a compact record header, flush sections, 16 px inputs and 48 px actions.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Sales aftercare design r01](../../../reference/ui/sales-aftercare/sales-aftercare-design-r01/README.md) (eleven icon-free PNGs; design compositions, not application captures).

- [PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html](../../../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.cr.05` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native Sales implementation contract

Plan a customer review from an issued Service report and track commitments, Service concerns, training and commercial follow-up.

- Worklist: permitted reviews and eligible issued reports.
- Review: date basis, preparation, participants/roles, attributed feedback and commitments.
- Service: source cases and separate prepared/submitted/receiving outcomes.
- Training: asset/configuration/material basis, arrangement, attendance, delivery and bounded assessment.
- Commercial: existing-opportunity check, discussion and separate CRM handover.
- History: immutable commands and deliberate corrections.

Choose a visible issued Service report. This bounded native implementation supports that source; it does not manufacture delivered Project or Service Agreement facts. Internal history authority, source report visibility and account/review ownership govern editing.

No default review interval or satisfaction score is adopted. Sourced dates require an exact rule reference/revision. A contact title does not confer purchasing authority. Training defaults to Not assessed with method/limits. Account-owner conflicts require explicit reconciliation. Each source projection retains its own freshness/completeness.

Service acceptance is not resolution. CRM acceptance links a separately created qualified source record and does not perform qualification. Proposed renewal changes no agreement; training arrangement makes no booking; this workflow sends no message or invitation.

Desktop: retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

Mobile: stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.cr.05` carries normal and recovery steps.

Retained reference: `docs/reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ES-05/06/07, agreements and automatic downstream effects remain unavailable under ADR-0046. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.
