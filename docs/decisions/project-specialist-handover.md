# PJ-06 technical and procurement handover

Owner: Dean Fiedler. Date: 16 October 2026. Status: authorised synthetic implementation decision; independent review and operational acceptance remain separate. Parents PRJ-04/PRJ-05, SCM-03 and AT-38.

## Context and constraints

The accepted PJ-06 R1 brief records exact commercial, Engineering and optional Supply references but does not carry that brief into technical/procurement receiving. Dean requested the next bounded increment. Reconciliation found remote main `1552cfbb8efd6cea17438c2af18ba0effa4fc278` and open, technically verified R1 PR #518 at `708c6da71ebd32a93ebfd2bdc84a52d3b198fb35`. Main has no R1 model. No competing PJ-06 writer was found; both earlier monitors are paused. This contribution therefore stacks on that exact R1 source, with PR base `codex/pj06-specialist-packages`. Retargeting after the parent integrates requires fresh upstream reconciliation and verification.

## Decision

### Main reconciliation — 16 October 2026

Main `b223c5817be7a946b38c48c9838d9d9925298156` now retains R1 #518 and assigns migration 0104 to the DK-06 renderer manifest. GitHub retargeted #522 to main after the parent branch was deleted. Integrate that main history into this existing contribution, retaining its issued migration bytes and all contribution ancestry. Renumber the unmerged R2 migration to 0105 without changing its SQL; keeping two 0104 entries or rewriting the integrated renderer migration would make the upgrade ledger ambiguous. No compatibility alias or checksum exception is appropriate for an unmerged synthetic branch checkpoint.

Existing R2 evidence at `459112d` continues to describe its original 0104 registry. New proof must use the integrated 0104 renderer followed by 0105 R2, retain populated legacy handovers and template publications, preserve exact ledgers and receipts, and prove repeat-run stability and reserved Products installation after 0105. The hosted-demo review gate must include both independent additions. The child work-evidence contribution #530 is separate and will require its own downstream reconciliation; this contribution does not edit it. No new technology, grants, seed, operational migration or deployment is introduced.

Extend the existing EN-06 native handover preparation with an optional exact accepted specialist package reference. The server freezes the accepted brief and source hash inside a version 2 receiving payload beside the native issued release, separately evidenced approved demand, exact lines and units. Native send and independent Supply receiving remain the only handover workflow. Receipt, audit, outbox, workspace transaction lock and original-operation recovery remain native. No order, reservation, stock movement, subcontract award, Service booking or external transaction follows acceptance.

Use two nullable reference columns on `material_handovers`, with a composite foreign key to the exact immutable specialist event and a database guard binding the new payload to that event and its Engineering/Project context. Existing version 1 payloads, hashes, receipts, events and outcomes remain byte-for-byte unchanged; no backfill, grant, seed, identity type, dependency or service is introduced. New specialist handovers require ProcurementReady and the existing TechnicalReleaseForProcurement/Approved-demand gates. Missing technical or procurement authority is an explicit blocker, not inferred from the commercial or specialist acceptance.

Preparation requires native material editing plus specialist preparation by the existing package owner or Project coordinator. The designated native receiver must currently be able to read the exact brief and its sources and hold native receiving authority; acceptance does not borrow the R1 brief-receive duty. Prepare, send and positive receiving require an Active Project and current exact specialist sources. Return and original receipt recovery retain historical visibility after drift. Reads and history withhold linked handovers when specialist/source authority is unavailable. Original evidence remains, with current-use drift separate from the recorded outcome. A returned handover uses the existing explicit successor mechanism; accepted outcomes remain terminal.

## Alternatives and consequences

A post-acceptance association would not prove the native receiver saw the specialist brief. A second PJ-06 approval aggregate would duplicate EN-06 release and Supply receiving authority. A new purchasing service would require unsupported operational policy. Extending the existing frozen payload makes the relationship part of the exact received evidence while retaining the established authority boundaries.

The cost is an additive schema upgrade and permission-aware native projections for linked handovers. Validation must cover populated historical upgrades, old payload/receipt preservation, exact units and hashes, current-source withdrawal, cross-company and revoked-source access, independent receiving, rollback, concurrent/repeated commands and actual application/database restart recovery. The contract and execution evidence will record actual results separately from CI, independent review, human acceptance and deployment. Supplier competence, verified external supplier identities, work-evidence acceptance, purchase execution and UI remain outside this increment.
