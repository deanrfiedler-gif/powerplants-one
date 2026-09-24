# Sales aftercare and renewal worklist worklist — design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/sales/aftercare`. Owner: Dean Fiedler. Review: pending. Parent scope: CR-05. Route: `/sales/aftercare`.

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

## Desktop

 retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

## Mobile

 stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.route-sales-aftercare` carries normal and recovery steps.

Retained reference: `docs/reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ES-05/06/07, agreements and automatic downstream effects remain unavailable under ADR-0046. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.
