# Sales-to-estimating handover worklist — design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/sales/handoffs/estimating`. Owner: Dean Fiedler. Review: pending. Parent scope: CR-02. Route: `/sales/handoffs/estimating`.

## Native Sales implementation contract

Save a Sales brief, submit an exact frozen revision and record an independent Estimating receiving decision.

- Sales preparation worklist: select a permitted deal and create its draft.
- Brief: problem/outcome, included scope, exclusions, assumptions, unknowns, date, locations/equipment and exact evidence.
- Review: Submit, Clarify, Answer, Resolve, Return and Accept remain separate.
- History and comparison: source basis and immutable revisions. Estimating Intake shows submitted briefs.

The current deal owner needs opportunity edit access. The chosen receiver needs estimating.edit and source visibility. Prepare an open, owned and dated Activity linked to the Opportunity.

Save is not Submit. Submission freezes content. Accepted for estimating is not estimate or quotation approval. A later draft never replaces the previous submitted basis. Evidence identifies its native source and exact revision.

Acceptance records receiving evidence only. It does not create or approve an Estimate. The latest submitted revision remains the Intake basis while a successor is a draft.

## Desktop

 retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

## Mobile

 stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.route-sales-handoffs-estimating` carries normal and recovery steps.

Retained reference: `docs/reference/ui/estimating/sales-estimating-intake-preview-r02.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ES-05/06/07, agreements and automatic downstream effects remain unavailable under ADR-0046. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.
