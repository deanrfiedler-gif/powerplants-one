# Owned quotation Supply follow-up contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. ES-07 / SC-01/09 / EST-03/08/09 / SCM-01/08 / IF-03 / AT-05/26. [Implementation decision](../decisions/quotation-supply-followup-native.md). Synthetic implementation, runtime proof, visual review, business acceptance and deployment remain separate.

## Receiving and scope

The existing quotation conversion page contains the exact target's Supply follow-up. `/supply/changes` exposes **My quotation Supply referrals**, assigned to the current actor and filtered through current source and complete linked-record permissions. GET `/api/v1/supply/conversion-followups` refuses unknown filters; it returns no protected titles, reasons, counts or historical snapshots for denied records. Existing conversion GET adds per-target follow-up, shared allocation position and returned outcomes.

An applicable completed-conversion exception with Approved demand, allocations, child/consequential dependencies or an explicit disposition Hold can enter a referral. Requester must hold current quotation/source and native Supply coordination access. The receiving owner must be active and currently permitted for the source, target, linked Supply evidence and shared Activity. Each referral creates one generic MaterialAction reminder; its summary contains no restricted quotation, supply or other-demand evidence. The receiving workspace is the protected evidence entry. An Activity is never the decision or resolution record.

## Commands and immutable lineage

POST under `/api/v1/estimating/quotes/[revision_id]/conversion` uses the existing schema-1 command envelope: `operation_id`, `reason`, `evidence`, `synthetic_only: true`, `target_id`, `execution_id`, observed `expected_sequence` and `basis_hash`. Actor/time are authenticated/server-owned. Unknown fields are refused. Reasons are 1–1,000 characters, evidence 1–4,000. All UUIDs identify exact original records.

| Suffix | Exact decision and additional fields |
|---|---|
| `supply-refer` | Latest referral `predecessor_id` or null, permitted `owner_id`, `due_date` or null with explicit `date_needed`, and `next_action`. A replacement follows a returned/held acknowledgement or applied outcome. |
| `supply-receive` | Exact `referral_id`, latest receiving `predecessor_id`, `decision: Accepted/Returned/Held`. Only the named permitted owner may decide. Acceptance is for review, never procurement/commercial/work approval. |
| `supply-review` | Exact `referral_id`, current Accepted `receiving_id`, latest review `predecessor_id`, `decision: Retain/Hold/AdjustAllocation`. Adjustment supplies `allocation_id` and exact `quantity`; both are null otherwise. |
| `supply-apply` | Exact `referral_id`, latest applicable `review_id` and `review_hash`. Separately commits retention/hold or the reviewed native adjustment and its original receipt. |

The target-specific ordered log permits one current referral and one current acknowledgement/review at a time. Corrections, return/reacceptance and reassignment append explicit predecessor links. Earlier acknowledgements, outcomes and effects remain. A pending accepted review must be explicitly held or returned before replacement referral. An original uncertain command must recover before replacement; stale sequence/content cannot create competing work.

## Native allocation action

Reuse `Supply:Allocate` within the same locked PostgreSQL transaction. Only **one existing allocation's quantity** changes; its ID, common unit, item, company, demand, supply and Incoming/Usable basis stay fixed. The reviewed command freezes demand, supply and allocation versions plus exact decimal strings (up to six places). Current allocation requires already Approved demand; this workflow never changes demand class or approves it. Zero retains a native coordination allocation at zero. It means neither ERP reservation release nor supplier cancellation.

Incoming totals cannot exceed the supply line or demand quantity. Usable totals require usable evidence and cannot exceed it or demand. Native SQL conservation and already-picked protections remain authoritative. This increment also holds adjustments when the target has return/custody children or current facts other than Assessment/Impact. Such dependencies require their owning Supply workflow. No new allocation, demand deletion/zeroing, replacement conversion, procurement, stock movement, fulfilment reversal or downstream mutation is added.

The review shows original/current demand, company/entity keys, demand class, quantities/units, linked Supply records, allocated quantities/bases, all shared allocations, linked other demands and relevant current facts/children. Every included record is currently authorised. Shared-supply changes invalidate dependent actions through exact supply/other-demand evidence; unrelated supply, sibling mappings and unissued drafts do not indiscriminately invalidate all reviews. Earlier source exceptions and native Supply coordination changes remain separately identified.

## Returned evidence and ES-07

Apply freezes the exact accepted referral, review, actor/time, native operation/receipt where applicable, resulting demand/supply/allocation versions and post-action graph. Retention and continuing hold have no fabricated native receipt. Returned/Held receiving decisions are explicit returned evidence. Browser Unknown remains unresolved until original receipt lookup or exact retry; receipt absence is inconclusive.

The returned event and current shared position enter #343's disposition basis. A prior disposition cannot apply against changed target versions or a later referral/outcome. A new explicit disposition review and separate application resolve only that exact exception; Activity completion, a note, receiving acceptance or allocation application does not clear it. Retain can acknowledge a continuing operational hold without approving or resolving that separate Supply hold. Later relevant changes reopen ES-07 review.

Allocation zeroing leaves Approved status intact. If the separate adopted Supply owner workflow later returns the demand to Forecast and all #343 guards permit it, the existing positive quantity-disposition controls become available. Their review, mutation and receipt remain separate; this increment does not add a class-change shortcut.

## Durability and permission boundary

Migration 0063 adds append-only `quote_supply_events`, scoped lineage constraints, ordered predecessor guards, one application per review, native-operation reservation and deferred atomic receipt/audit/outbox/native-history checks. No seed, grant, user, identity type or original output changes. The existing operation journal is shared with conversion and disposition, so an uncertain original blocks every replacement action in that quotation through reload.

Replay rechecks current original source, company/site, coordination and linked dependency authority before returning the original result. It does not require the old referral still to be assigned to its original actor. Frozen restricted Credit observations require current Finance visibility before disclosure. A reserved native operation cannot be consumed by another target or command family. A deferred receipt guard requires its exact applied review and native outcome in the same transaction, including when another command attempts to use that operation ID. Direct ordinary Supply allocation cannot execute a reserved review operation; after Apply its exact original receipt can recover under current authority. Effects are atomic, with no partial database success state.

Operational authority, signing, validity/expiry, withdrawal, terms, tax/FX, item governance, observation age and live ERP mappings remain Not configured. MYOB, SharePoint and native CAD retain their documented authority. See the [handover](../delivery/quotation-supply-followup-handover.md) and [execution ledger](../testing/evidence/quotation-supply-followup/README.md).
