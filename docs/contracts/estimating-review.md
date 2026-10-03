# Exact saved-estimate review contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic implementation under [the decision](../decisions/estimating-review-native.md). ES-04 / EST-03/04/05/07 / EA-01/09 / AT-01/26. Commercial policy and owner acceptance are separate.

## Commands and reads

All paths start `/api/v1/estimating/estimates/[id]`. GET `/review` returns current saved evidence, exact submission/decision history, current applicability and permitted actions. Current estimating, CRM, company/site, customer/contact and source/specialist permissions apply before any history is returned. Unknown query fields are refused. Responses are no-store. Cross-company, cross-workspace and revoked originals are unavailable.

POST `/review` requires the owner and current `estimating.edit`. Body: original `operation_id`, `schema_version: 1`, `reason`, exact `estimate_version_id`, positive `expected_version`, nonnegative `expected_review_version`, and explicit `responses` array of `{finding_id,response}`. Each response retains the original finding UUID. Every outstanding Returned finding needs one response; arbitrary, repeated or omitted findings are refused. A complete saved manual cost revision is required. Discovery-bound estimates also need the current saved Complete discovery basis. A successor may retain unchanged saved content when responding to a return or acknowledging a changed source observation.

Submission also requires the exact SHA-256 `basis_hash` returned by the permitted read. The server recomputes it while holding the workspace command lock; changed source headers, discovery or context cause `ReviewConflict` even when cost and review sequences have not changed. The client retains entered rationale and requires an explicit comparison/refresh before a replacement submission. Original-command recovery still returns the originally accepted receipt.

POST `/review/decision` requires one explicit duty: `estimating.review.completeness`, `.price` or `.technical`. Body: original envelope, exact `submission_id`, `kind` (`Completeness`, `SourcePrice`, `Technical`), `outcome` (`Reviewed`, `Returned`), both expected versions, and `findings`. Reviewed requires an empty findings array. Returned requires 1–20 `{line_id: UUID|null,detail}` findings; the server allocates their immutable IDs. The native form records one finding per return; the API supports up to twenty. A line must belong to that submitted revision. Author, owner and submitter cannot decide it. There is one immutable decision per kind per submission; corrections use a successor submission.

The review sequence belongs to the sidecar, not the estimate's saved-cost version. Each command advances it once under the existing workspace lock. Receipts retain the Estimate record UUID and review sequence; audit details name the exact event and saved version. Recovery through `/api/v1/operations/[operation_id]` and command replay rechecks the original saved-version scope and original duty. Same key/different input conflicts. Missing/inaccessible receipt does not prove failure. No offline command is registered.

## Applicability and boundaries

`SYN-ES04-01` records three deterministic fingerprints. Scope identities include company, opportunity, customer, contact, site and option. Completeness includes title/scope, exact discovery revision/current head, line identities/descriptions/categories/units and explicit allowance declarations. Technical additionally binds quantities and specialist technical lineage. SourcePrice binds the unchanged arithmetic policy, quantities, units, manual cost/sell/source/date, exact typed source bindings and observed source header versions. Saved-cost/version UUIDs alone do not invalidate otherwise unchanged facts.

The most recent decision of each kind remains visible with its original submission and actor. Matching facts retain applicability; a changed fingerprint marks that kind Changed basis. This is not a new decision or inherited commercial approval. A pending SourcePrice decision against an older observation is refused after a source update. Deliberately reviewing the retained historical price against the newer observation requires a new owner submission. Old bindings and source revisions remain unchanged.

All three currently applicable Reviewed outcomes plus a submission of the current saved cost version yield **Reviewed**. Commercial approval and pricing-exception policy stay **Not configured**. No approval threshold, tax, FX, terms, release authority or Engineering sign-off is inferred. A review never changes E1 Draft preparation, original estimate JSON, quote revisions, render jobs or stored bytes. ES-05 must independently establish exact commercial approval and issue authority. ES-06/07 remain subsequent receiving increments.

## Persistence and fixture

Migration 0058 adds immutable `estimate_review_events`, scoped foreign keys, one ordered sequence, independent-author checks, one decision per submission/kind and deferred atomic receipt/audit/outbox validation. No business identity, existing estimate state or historical output is altered. Seed 58 gives the existing local fictional source reviewer three explicit review duties plus necessary Company A CRM/internal reads. No user, hosted role or operational approval duty is added. Replaying seed receipts cannot revive a revoked grant. See [executed evidence](../delivery/estimating-review-handover.md).
