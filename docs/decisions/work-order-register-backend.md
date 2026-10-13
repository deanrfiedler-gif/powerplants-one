# Work orders register and record backend

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026. Status: bounded synthetic implementation authorised by Dean's instruction to proceed. Independent review, accepted page implementation, owner acceptance and deployment remain separate.

Traceability: BC-01; existing SV-03 and SVC-02; P04; AT-06/30; PT-01/03/04. Sources: the [backend plan](../delivery/backend-completion-plan.md), [accepted register design](work-orders-design.md), [record design](work-order-record-page-design.md), [ADR-0009](ADR-0009-p04-work-scope-readiness.md), and the native scope/readiness/visit services. All parent IDs remain unchanged.

## Decision

Add read-only `GET /api/v1/service/work-orders/register` and `GET /api/v1/service/work-orders/[id]/record`. The existing list, detail and command contracts remain compatible. Reuse TypeScript, Next, PostgreSQL, the native workspace transaction lock, current source authority and scope/readiness functions. No new technology, migration, capability, seed, grant, dependency or service is selected. Persisting derived readiness would duplicate the native authority; browser-side joins would fragment permission, paging and evidence checks.

The new reads acquire the existing workspace lock used by business commands, enforce `service.work_order.read` and `shared.read`, and retain native customer/site/request/historical-asset visibility. Current authority is checked again before publication. A read never authorises a scope, confirms attendance, changes coverage, writes a receipt or publishes a document.

## Register contract

Each row contains the stable work-order identity/reference/version, current and authorised scope IDs, current scope revision/version/summary, customer and site, coverage status, Service owner, linked-request count, work-order update time, authorisation state/blocker count and earliest active visit. `updated_basis: WorkOrder` describes the header timestamp; it does not claim to be the latest event in every downstream domain.

The five display states follow the accepted design: ScopeNeeded; Blocked; ReadyToAuthorise; SuccessorDraft; Authorised. Existing native blockers determine readiness. An authorised original retains its decision; a successor's blockers belong to that draft. Unknown coverage alone is not a blanket refusal: native limited-identification/inspection rules remain authoritative. No read grants a user command eligibility.

Active visits are Proposed, Confirmed and InProgress, ordered by start and stable ID, including overdue active work. CompletedPendingReview, Completed and Cancelled are closed for this planning read, matching Scheduling's workspace rule. The next visit needs scope review unless its exact scope revision is both current and authorised at the recorded version. A draft may have a proposed visit; proposal is not booking or dispatch authority. Later active visits remain in the native record detail.

Queries allow literal `q` (200 characters), `owner_id`, `site_id`, `company_id`, `status`, `sort` (updated_desc/updated_asc/reference_asc), `offset` and `limit` (1–25). Source filters and stable order select a bounded candidate window. `view` selects all, mine, drafts, authorised, scope_needed, blocked, ready_to_authorise, successor_draft, no_visit, visit_review or coverage_unresolved inside that window. Mine means Service owner. No visit includes drafts without active visits; coverage_unresolved is an explicit Unknown or Disputed assessment, not an invented classification of missing evidence.

Counts cover authorised rows in the current candidate window before view selection, explicitly labelled `AuthorisedCandidateWindow`. They are **not global menu totals** and overlapping views must not be summed. Empty filtered windows retain continuation. Complete means this window's eligible facts were readable, not that all matching records fit in it. Offsets are live reads, not a frozen export; clients restart after changing filters. This follows the bounded read approach used for Quotations. Global counts and a globally filtered result window remain a separate contract before adopting the accepted menu's total-count presentation.

## Record supplement

The record endpoint returns the same summary, creation time, native blockers and two independently paged collections. Queries allow `history_offset`, `evidence_offset` and a common `limit` of 1–25. The existing detail API remains the reader for scope revisions, readiness, linked requests, visits and command actions. Header creation/update dates already exist in the live schema and the native detail spread; this increment explicitly projects them without a schema change.

Evidence contains exact synthetic document-reference metadata used by native scope authority or readiness assessments across the order's history. It retains title, provider, source reference/version, status, original hash and timestamp. No content bytes, storage paths, Finance evidence, generated job packs or arbitrary attached documents are added. These other documents keep their existing independent readers and permissions.

History contains attributable native WorkOrder commands (CreateWorkOrder, SaveScopeDraft, CreateScopeSuccessor, AssessWorkReadiness, AuthoriseWorkOrder) and ProposeVisit events for that order's appointments, ordered newest first by recorded timestamp then stable ID. Actor, reason and command are retained; raw audit payloads and operation receipts are withheld. The scope label explicitly excludes scheduling changes, field/report/Finance history and legacy fixture actions without these native command records. An empty list never claims no historical business activity.

## Verification and remaining work

[Execution evidence](../testing/evidence/work-order-register/README.md) records actual source, checks and failures. Prove native lifecycle and preserved approved snapshots; draft/authorised/successor visit checks; original evidence hashes and bounded history; permission/company/site/source denial; expiry and stale readiness; literal queries, stable paging and filtered continuation; unchanged business effects; compatible native detail; and authenticated compiled HTTP responses.

The accepted Figma screens, shell, global counts, selection/export, record position, broader cross-domain history and multi-area scope remain separate. Existing review fingerprints stay unchanged. Synthetic backend verification is not owner/device or operational acceptance; no deployment is included.
