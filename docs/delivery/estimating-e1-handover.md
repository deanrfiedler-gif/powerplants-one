# BP-04 E1 implementation handover

**Status:** Implementation under verification, not yet delivered or owner-accepted. **Work:** [issue #46](https://github.com/deanrfiedler-gif/powerplants-one/issues/46). **Decision:** [ADR-0017](../decisions/ADR-0017-estimating-e1.md). **Contract:** [E1 physical/API contract](../contracts/estimating-e1.md).

## Authority and baseline

Dean's “Proceed” and “Continue” follow the stated next-step sequence: complete the BP-04 design merge, implement E1, verify its journey and prepare E2 only. This authorises the bounded synthetic manual estimate/draft quote slice to come forward from Wave B. P01–P12 order and Finance authority remain separate. No broader estimating, live integration, operational migration, hosting or customer communication is included.

BP-04 design PR #44 merged normally at `94289a20fc609e47af647b29ca8170557da312bb`, after documentation run 34057727672, estimating design run 34057727647 and application run 34057727610 all passed on `a6e4550d12dd8130805a4cd096f67d8e41362f1f`. Its actual-main documentation/design checks have passed; actual-main application run 34059829784 is still pending at this checkpoint. Existing CRM I1 main was `c3ac9b2ab9c09308f620a5b451a337eb75fe6390`.

Current parallel work: CRM I2 #43 / PR #47 owns the Board/Grid and shared navigation refinement; Finance #45 reserves migration 0011 / ADR-0016. E1 reserves 0012 / ADR-0017 and a dedicated branch. Its migration extends existing unions/identity dispatch additively. The runner deliberately applies present 0012 after 0010 until independent 0011 arrives; reconcile in numeric order without changing applied checksums.

## Implemented scope awaiting verification

Existing Opportunity selection; eligible estimate owner; manual scope/exclusions/assumptions; complete Product/Labour/Freight decimal lines; immutable saved versions and predecessors; proposal/saved distinction; atomic original receipts and conflicts; immutable draft quotation revisions with include/print; safe projection; exact captured branded HTML and durable PDF recovery; current permission/relationship checks on commands, reads, files and receipt replay. Draft remains Draft. CRM money, stage and next-action facts are unchanged by E1 commands.

The first increment supports only manual AUD excluding tax with the declared synthetic precision/ranges. Full E2 routing/options/questionnaires, E3 catalogue/FX/approval, E4 formal issue/response, E5 specialist formula engines and E6 handover remain unimplemented. No general production calculation or operational acceptance is claimed.

## Verification record

Local foundation, prototype, naming and BP-04 design assurance pass; all 78 parent IDs and four issued-source hashes remain intact. Local Node 24.19.0/npm 11.9.0 do not match required Node 24.20.0/npm 11.19.0. Engine checks are retained. Application execution is delegated to ordinary disposable repository CI under the existing exact pins; no local application pass is claimed.

Authored checks (not yet passed at this checkpoint): six arithmetic/validation unit cases; eleven PostgreSQL cases including current-main upgrade, reseed, immutable graphs, concurrency, actual current-authority denials, safe-only projection, interrupted storage and failed-render recovery; two direct HTTP journeys; five Chromium scenarios on desktop and phone, plus 320px reflow and long output; a separate three-application/browser-process and two-PostgreSQL-restart proof retaining exact receipts and final HTML/PDF bytes. Existing full P01–P09/CRM checks remain enabled. CI evidence records source head, executed checkout/tree, run ID, runtime, process identities and content hashes.

Relevant coverage is the E1 subset of EA-01/03/05/06/09/10/15/18. Broader EA rows remain Not run; no parent AT status is promoted. Record actual run IDs, failures, fixes, visual inspection and merged-main results in this document and an exact-commit external publication comment before claiming delivery. No independent reviewer or business acceptance is implied by automated checks.

## Handover boundary

Open `/estimating` in the existing loopback synthetic application. Choose an existing eligible CRM Opportunity or create one in CRM, record scope and manual lines, save a successor with a reason, then prepare from one exact saved version. Generate/recover the draft and inspect its HTML/PDF. Original ready bytes remain the download authority. Customer contact stays in the linked Opportunity's existing Activity workflow.

Prepare E2's scoped starter after E1 verification, identify unresolved G02/G03/G04 evidence, and stop before its implementation.
