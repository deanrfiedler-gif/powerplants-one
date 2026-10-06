# Exact saved-estimate review

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 3 October 2026. Status: authorised synthetic implementation; owner acceptance and commercial policy remain separate.

Traceability: PPO-010, BP-04, ES-04, EST-03/04/05/07, EA-01/09 and AT-01/26. This implements the review boundary in the [programme](estimating-native-programme.md) and [ES-04 design](estimate-review-pricing-exceptions-design.md). All parent IDs and issued references remain unchanged.

## Reconciliation and representation

Refreshed main is `6e8b898`. ES-01 workload, ES-02 discovery, schema-2 manual costing, ES-03 sources (0048), Screen Systems, fertigation and exact E1 Draft output already exist. Formal review and ES-05–07 runtime do not. No open PR was found. The unfinished Excel-import worktree retains package changes, its native decision and parser source; it is not a prerequisite for reviewing a manual estimate. Reserved 0051/0052 remain untouched. Current registry ends at 0057.

Retain TypeScript/Next/PostgreSQL, the Estimate aggregate, workspace mutation lock, immutable sidecars and existing operation journal. Add migration/seed 0058 only after inspecting the live 0057 schema. Review submissions and decisions are subordinate evidence with stable UUIDs; receipts retain the Estimate identity and dispatch to the exact submitted-version authority. No new framework, service, dependency or output template is required.

Alternatives: mutating an estimate's original JSON would break hashes; repurposing source review would conflate different duties; using generic audit text alone would omit relational constraints and structured applicability. A new independent commercial aggregate is unnecessary for subordinate estimate review.

## Bounded review contract

The owner submits the exact current saved version with an expected estimate version, review-event sequence and canonical observed-basis hash. An immutable submission retains its predecessor, the three review fingerprints and attributable responses to outstanding findings. Each submission has at most one decision per review kind. A Returned decision records required findings; correction is a new saved estimate when content changes, followed by a successor submission. Originals are never edited or deleted. Clarification may resubmit unchanged content after return.

Separate explicit Company/site-scoped duties govern Completeness, SourcePrice and Technical review. The author, estimate owner and submitter cannot review their own work. The local source-evidence fixture receives three **additional explicit** review grants and two necessary CRM/internal read grants; its existing source-review duty alone grants none. No hosted profile or estimator receives these duties. This is synthetic evidence review, not technical release or commercial delegation.

Applicability is calculated, never transferred as a new decision. Completeness binds title, scope, line identities/descriptions/categories/units and explicit allowance declarations. Technical binds scope, quantities and exact discovery/specialist lineage. SourcePrice binds quantities, units, manual cost/sell/source/date and exact typed bindings plus the observed source headers. An unchanged fingerprint may retain a clearly labelled earlier Reviewed decision; a changed fingerprint requires a new decision only for that kind. Reads and decisions recheck all current underlying permissions. Source-price review does not approve a source revision, financial threshold or quotation.

Commercial estimate approval, exception thresholds, quotation approval/issue authority and terms remain **Not configured**. Reviewed is the permitted bounded outcome; no Approved state, prepared ES-05 authority, customer communication or downstream work is created. E1 Draft preparation remains its existing separate contract. ES-05 must explicitly validate commercial authority before issue.

## Recovery and proof

Commands use strict schema-1 inputs, original operation UUIDs, canonical hashes, atomic audit/receipt/outbox and expected review sequences. Exact replay and receipt lookup require current authority for the original saved version and the original review duty. An unavailable receipt is inconclusive; retry retains the original operation and payload. Failed or denied reads remove evidence/forms. Browser recovery reuses the actor-bound same-tab journal and has no offline claim.

The [handover](../delivery/estimating-review-handover.md) records executed validation and limitations separately from source presence, visual review, owner acceptance and deployment. MYOB, SharePoint and native CAD retain their authority.
