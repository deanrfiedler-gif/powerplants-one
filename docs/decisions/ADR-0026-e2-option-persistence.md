---
document_id: PPO-ADR-0026
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Selected adopted-subset persistence design; implementation and verification pending
source_commit: a22eee458978568a0343d27df38c21b6004a6f07
---

# ADR-0026 — E2 options and immutable discovery revisions

## Authority and boundary

Issue #167, the adopted E2-D02/D03 and DR-02 policy, the E2 receiving contract and ADR-0025 authorise this implementation. Main has independently merged the receiving contract in #162. The P12 integration owns migrations through 0025; this follow-on allocates 0026 after inspecting the current registry. No new pricing, delivery-routing, approval, issue, terms or container policy is selected here.

The first persistence contribution implements the workspace/options/scope portion. Binding a new E2 scope to a manual Estimate remains a separately verified receiving step. It must not be claimed merely because a Complete questionnaire exists. Existing E1 one-Estimate-per-Opportunity, fixed Site, canonical schema-1/2 commands and exact output remain valid until that receiving step explicitly extends them.

## Physical records

Use the existing PostgreSQL migration, typed identity, shared-operation, audit/receipt/outbox and current-permission mechanisms. Add `estimating_workspaces`, `estimating_options` and immutable `estimation_revisions`, with explicit selected/current/predecessor foreign keys. A root belongs to one existing Opportunity/company and fixed estimating owner. It has a monotonically increasing version and one non-null selected Active option. Options have independent UUIDs, labels, Active/Archived state and one current immutable estimation revision. The maximum is ten options, including archived ones; no deletion silently frees an identity.

Discovery revisions capture one compiled adopted input, observed related context, content/context hashes, independent scope/answer snapshot UUIDs, hidden-answer retention, comparison and server attribution. Relational Facility/equipment membership accompanies the snapshot and enforces exact company/selected-Site references. No Site or unknown Site has no Facility/equipment members. Question definitions remain the immutable r01 compiler from ADR-0025, not the historical delivery rule evaluator. Current context checks run again when accepting a proposal or reading accepted history.

Migration formalises each existing E1 option A/r01 using those exact embedded UUIDs. It adds a new root and a `LegacyManual` compatibility revision, explicitly stating that no E2 questionnaire was recorded. It neither rewrites E1 rows nor supplies missing answers. New legacy E1 creation remains atomic with equivalent compatibility records; a separate E2 workspace already present for that Opportunity prevents accidentally creating another default workspace. Original E1 source data and timestamps remain identifiable as legacy provenance, distinct from when compatibility records were recorded.

## Commands and locking

All mutations use a bounded, strict schema-1 E2 command namespace distinct from the existing E1 command names. Keep operation IDs, canonical hashes, expected root version, exact source revision, reason, current authority before receipts and one transaction for records/audit/outbox. Existing E1 schema dispatch is not routed through the E2 parser. The existing shared-operation workspace lock serialises graph mutations; explicit root locks and database relationship checks preserve the option group invariants.

First-option creation makes A, r01 and selection atomic. Branching creates an unselected Active option; copying confirmed discovery downgrades confirmations and retains source identity, while a fresh branch imports no old questionnaire or money. Explicit selection replaces one pointer and advances one version. Scope save appends a successor and advances its option/root pointers. Archive refuses the selected option; reopen is an explicit action and stays unselected. Scope changes cannot alter saved Estimate versions, CRM amounts/stages, quotations or worker inputs.

Preparation returns the exact current-context and source-comparison hashes for review. Acceptance recomputes them inside the transaction and rejects a stale comparison. Affected answers confirmed in the successor require explicit confirmation acknowledgements; unchanged confirmations retain original attribution. Hidden values come from accepted history, never a client-authored hidden-answer field.

Only the documented Draft commercial states are editable. Every group mutation and new E1 costing/quote action checks the entire related group under the same transaction; an archived target, unsupported commercial state or unavailable related context holds the action. Render Pending/Running/Ready/Failed remains distinct from commercial Draft. Exact original worker recovery and permission-checked history are not blocked merely because an option was archived. SQL guards enforce state/selection integrity in addition to application controls.

Original receipt lookup must reauthorise the current root and the exact source/revision references in the accepted audit record. A formerly readable captured Site/Facility/equipment label never becomes an enduring grant. The caller's unknown outcome remains associated with its original operation until reconciliation; a new UUID is not a retry.

## Estimate receiving obligations

The subsequent `UseScopeForManualEstimate` implementation must explicitly decide and verify its physical bindings before relaxing the existing one-Estimate-per-Opportunity constraint. Each newly authored Estimate version needs an append-only link to exact option/estimation/scope/answer identities and hashes. Existing A/r01 UUIDs, old command hashes, legacy DTOs and stored HTML/PDF must remain unchanged. An incomplete successor must not replace the complete or legacy basis of existing costs.

Current E1 header and graph guards fix Estimate Site to Opportunity Site; quote preparation also reads the Opportunity Site. E2 discovery may propose a different currently related Site. Therefore this contribution exposes no costing import and no implicit Site reassignment. The receiving implementation must resolve the actual selected-Site/version context for permission checks, historical reads and customer-safe output together; it cannot pair a different Site's scope with an old quote label. Merely changing option selection must not change the existing CRM commercial projection or forecast.

## Validation and alternatives

Required real-database proof covers additive legacy extraction and future legacy creation, exact original rows/receipts/output through migration and repeated seed, competing first creation/selection/scope commands, ten-option bounds, selected archive, reopen, current-scope/owner denial, stale context, immutable revision/membership, rollback at audit/receipt/outbox boundaries, unsupported-state SQL guards and exact original recovery. Actual HTTP, saved browser states and application/PostgreSQL restart complete the runtime contribution; authored cases alone are not execution evidence. Update every affected exact migration registry assertion and review the hosted-upgrade gate without invoking deployment or reset.

A client-only selected flag would allow competing selections. Overwriting E1 A/r01 would relabel accepted costs. Implementing specialist prices or automatic routing now would execute unadopted policy. The selected design adds only the adopted discovery aggregate and keeps the later receiving change explicit and reviewable.
