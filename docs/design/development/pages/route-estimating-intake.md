# Estimating Intake — design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/estimating/intake`. Owner: Dean Fiedler. Review: pending. Parent scope: CR-02. Route: `/estimating/intake`.

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

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.route-estimating-intake` carries normal and recovery steps.

Retained reference: `docs/reference/ui/estimating/sales-estimating-intake-preview-r02.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ADR-0046 recorded the earlier quotation boundary. Current native ES-05/06/07 engines exist; Sales quotation/outcome integration and automatic downstream effects remain separate from this handover. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.

## Accepted Sales brief link (LC-13)

Keep the existing scope ID and r20 record workspace/intake worklist page type. Incoming: exact current accepted Sales event and source facts. Outgoing: explicit immutable link to the existing native estimating workspace, selected option and scope revision. Reuse PageHeader, Button, Field, error/status controls, native details disclosure and the existing command journal. The existing CRM panel and estimating layout are retained legacy host exceptions; no shared style system changes.

From accepted Intake, open an existing workspace or create native Discovery. Show Sales problem, scope, exclusions, assumptions, unknowns and requested-date basis as reported context; do not pre-confirm Discovery answers. A successful creation returns to the handover for a separate link review. Compare both saved versions, record a reason and save the link. Keep that comparison fixed through background refresh. Separate current acceptance, source drift and historical links. A denied target displays no retained target identities. An interrupted link recovers the exact original from the actor-scoped journal, including after reload.

Desktop: place the link comparison and separate native-creation result beside the accepted brief; use labelled saved versions and wrap long reasons. Phone: stack the same controls at 390 and 320 CSS px, keep recovery controls reachable and contain scope text without horizontal overflow. Keyboard navigation must reach the native workspace and original-result controls. The new-state mockup images are missing; retain the exact existing HTML/image references above. This is a proposed additive adaptation, not adopted paired visual or owner acceptance.
