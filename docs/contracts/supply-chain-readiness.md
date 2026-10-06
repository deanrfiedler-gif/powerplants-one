---
document_id: PPO-013-READINESS
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Candidate synthetic readiness contract; no Supply Chain runtime or ERP mapping
source_commit: 3a27728c2c41e366a4863683fac748cd0d1da910
versioning: git
---

# Supply Chain readiness receiving contract

Audit task 10 prepares PPO-013 / [#13](https://github.com/deanrfiedler-gif/powerplants-one/issues/13) from [BP-01 SCM-01–SCM-08](../blueprints/BP-01-master-blueprint.md), preserving D-006 source-system decisions, D-015 scheduling boundaries and D-017 Finance authority. This is a bounded candidate contract for fictional material coordination. BP-08, verified MYOB field/endpoints and operational approval remain open; no external system was queried or changed for this package.

## First complete journey

A permitted coordinator records a fictional material demand against an existing Project or Service work order, states its demand class and required date, records a separately evidenced promise, reviews line allocations and receipt exceptions, then creates an owned shared follow-up when readiness changes. The receiving Project/Service owner sees the exact demand version and evidence time. An existing confirmed booking stays unchanged until its own reviewed scheduling command succeeds.

| Parent | Bounded receiving fact | Meaning retained |
|---|---|---|
| SCM-01 | Demand UUID/version; company; typed Project or WorkOrder source; Forecast or Approved class; required quantity/unit; required-by local date and site timezone, or explicit date-needed | Approved demand requires named authority/evidence; it grants no purchase or booking permission |
| SCM-02 | Explicit item/company/warehouse external keys when actually verified; observation time, source version and Complete/Partial/Unavailable status | Unknown or partial availability is not zero stock or a verified available-to-promise figure; PPO owns no duplicate stock ledger |
| SCM-03 | Requisition/supplier-quote/purchase-order reference and its separately sourced state | Demand, request, approval and actual ERP purchase outcome stay distinct; no undocumented MYOB endpoint or posting command |
| SCM-04 | Promise UUID/version, quantity/unit, estimated or supplier-confirmed date, evidence/source time and confirmation actor | Latest date does not silently overwrite an earlier commitment; technical deliverables may still block use |
| SCM-05 | Shipment line UUID/reference and explicit many-to-many allocation links to demands | One shipment can serve several demands; one demand can use several shipments. Quantity conservation is checked in a shared unit |
| SCM-06 | Arrival, ERP receipt reference, inspection, usable quantity, shortage, damage and quarantine as distinct observations | Carrier arrival is not an ERP receipt or usable stock. Quarantined units cannot support Ready |
| SCM-07 | Pick/dispatch/delivery/return/claim reference, evidence and actual external outcome | Planning a movement is not posting it. Returns and credits require their own source authority and reconciliation |
| SCM-08 | Readiness assessment bound to exact demand/promise/allocation/inspection versions, source time and owned impact Activity | A changed promise triggers review; it cannot silently reschedule Project forecasts or confirmed Service bookings |

## Proposed records and invariants

Use permanent internal UUIDs for demand, observation, promise, allocation and assessment; provider/configuration/company/entity/key identify any external record. Titles, part descriptions and display numbers are never identity. Every observation declares whether it is manually recorded fictional evidence or a future verified external observation. An unavailable item/unit/source is explicit; no guessed conversion or cross-company match is permitted.

Demand changes create a new version with reason and predecessor, retaining the receiving source revision. If the receiving scope changes, mark comparison needed; do not silently widen demand. A forecast becoming approved needs an explicit authority/event, not a date or status import. Approval, purchase, physical receipt, inspection and allocation remain separate records.

Allocations bind exact supply and demand lines in a declared common unit. Concurrent allocations must not over-allocate the same evidenced usable quantity. No implicit EA-to-length, pack or weight conversion is allowed; any future conversion requires a versioned accepted basis. Quantity observations may be incomplete; an assessment must expose that incompleteness rather than report a final shortage.

Readiness states for review are **Not assessed**, **Evidence needed**, **At risk**, **Blocked** and **Ready for the stated material scope**. A Ready assessment names all included demands, the source completeness/time, sufficient usable allocations and any remaining scope exclusion. Its validity is limited to that exact scope and evidence point. It establishes no technical release, worker competency, site access, customer agreement, confirmed booking or Finance outcome.

Changing or withdrawing a confirmed promise, usable quantity, allocation or inspection result creates an owned impact review against affected demands. One reasoned command may create one shared Activity per declared impact identity; idempotent recovery returns the same Activity/receipt. The recipient reviews the effect using existing Project/Service controls. Lost or duplicate notifications cannot serve as authority to move a booking.

## Fictional acceptance examples

| Case | Exact input | Required observable result |
|---|---|---|
| Shared shipment | Project demand 6 EA and Service demand 4 EA; shipment promise 10 EA | Separate demand allocations preserve both owners and required dates; total planned allocation is 10 EA |
| Partial receipt and quarantine | 8 EA physically received, of which 3 EA quarantined; 2 EA not received | Only 5 EA can be evidenced usable. Proposed usable allocation 3 EA/2 EA leaves unmet demand 3 EA/2 EA. Quarantine and non-receipt are visible separate causes; no duplicated stock subtraction |
| Promise delay | Confirmed promise moves after the Service required date | New promise/version and owned impact review; original booking, appointment version and issued job-pack bytes stay exact |
| Incomplete source | Warehouse observation is Partial and one demand's unit is unresolved | Evidence needed; no Ready state, fabricated zero quantity or inferred conversion |
| Competing allocation | Two accepted attempts each seek 4 EA from the same 5 EA usable line | One wins; the other conflicts against the updated allocation. No negative remainder, duplicate receipt or hidden last-write overwrite |
| Historical recovery | Original assessment accepted, then source revised or actor's Site access revoked | Original evidence remains; current authority precedes historical labels and receipt disclosure. No new effect on replay |

## Implementation gate and verification

The first runtime slice should use manual fictional demand/promise/assessment evidence and owned impacts, reusing existing company/Site/Project/WorkOrder and Activity identities. Before coding, resolve which receiving target starts the slice and which explicit synthetic role may confirm demand/promise/readiness. Decide the common quantity precision, assessed-scope completeness rule, and policy for how long an observation can remain usable; no age threshold is supplied by this contract. Select these as prototype choices without presenting them as MYOB or corporate policy.

Required tests cover strict payload/version/unit validation, complete mixed-target permission filtering, same-key recovery and races, quantity conservation, atomic audit/receipt/outbox/Activity effects, changed-source comparison, unchanged confirmed bookings and exact issued-file preservation. Upgrade/reseed/restart must retain original UUIDs, references, evidence and revoked access. Real ERP availability, reservations, purchases, receipt, dispatch, return or credit commands require verified source contracts and separate execution authority.

The contract and cases are prepared; none is an executed SCM/AT acceptance result. This closes the audit's readiness-definition task while keeping the full #13 implementation and source-policy gaps visible.

## Native implementation follow-through — 25 September 2026

The earlier candidate/design status above is historical. [BP-08](../blueprints/BP-08-supply-chain.md) and [ADR-0049](../decisions/ADR-0049-native-supply-chain.md) define the authorised native synthetic receiving implementation. [Handover](../delivery/supply-chain-native-handover.md) records actual verification. ERP mappings, source freshness policy and operational authority remain unresolved; no age threshold or live command is inferred.

## Owned completed-conversion Supply follow-up — 4 October 2026

The [SYN-ES07-03 contract](quotation-supply-followup.md) implements attributable referral, named-owner acceptance/return/hold, immutable shared-allocation review and separately applied native outcomes. It reuses the existing quantity-only `Supply:Allocate` transition on already Approved demand, retaining allocation identity and Incoming/Usable basis, including native zero. No demand class, ERP reservation, supplier commitment or stock movement changes. Returned evidence requires explicit new ES-07 disposition; Activities and Supply outcomes do not automatically clear quotation exceptions. Prior evidence and operational holds remain. The contract and execution ledger distinguish implementation from acceptance and deployment.

## Owned reservation outcome reconciliation — SYN-ES07-04

The [bounded decision](../decisions/quotation-reservation-reconciliation.md) extends the existing accepted referral with ReconcileReservationOutcome. Review names a current ExternalOutcome/Reservation fact on the converted Demand in Unknown state. It freezes the same original source operation, Complete Confirmed/Failed/Absent observation, explicit UTC observation time, lookup evidence and demand version. Separate Apply uses native `Supply:Fact:ExternalOutcome`, committing the successor fact/history, original native receipt and returned outcome atomically. Original facts, referrals, decisions, receipts and output bytes remain.

The review API adds `dependency_id`, `outcome_state`, `observed_at` and `lookup_evidence` only for this decision; allocation fields are null. Earlier command hashes stay unchanged. Other unknown outcomes, changed predecessors/versions/source evidence or revoked authority hold application. Unknown or partial lookup is never evidence of Absent. Retain, Return and Hold remain supported; corrections and reassignment retain predecessor lineage.

This reconciles native evidence only. Demand quantity/class, shared allocations, other demands and external reservations are unchanged. Consequential allocation and Approved demand-quantity holds continue. Returned evidence requires fresh explicit ES-07 review/application; a note, Activity completion or Supply outcome cannot clear the exception. Migration 0064 adds no grants, seeds, identities or technologies. [Execution evidence](../testing/evidence/quotation-reservation-reconciliation/README.md) separates actual proof from acceptance and deployment.

## Existing Receipt correction and independently received effects

[SYN-ES07-05](../decisions/quotation-receipt-correction.md) adopts one additional bounded synthetic dependency action. An accepted exact ES-07 Supply referral may propose a versioned correction of one current native Receipt on linked Supply. It freezes native evidence fields, original fact, supply/version, all allocations and every affected Demand's source/readiness/dependency snapshot. Each current allocated Demand owner must independently record Accepted, Returned or Held for that proposal; even zero allocation links require receiving because the native command versions them. Common company/item/unit identity is retained; no conversion or operational approval threshold is invented.

A separate immutable CorrectReceipt review freezes all exact latest acceptance IDs and the reserved native command. Apply uses `Supply:Fact:Receipt`, appends its predecessor-linked fact and native history, versions Supply and allocated Demands, and creates their owned Requested Impacts. It preserves allocation identities/quantities, Demand quantity/classification, children, fulfilment and external events. Shipment usable capacity follows corrected complete Receipt observations; a shortfall below allocations is visible and holds readiness. Stock usable capacity remains the separate Stock observation. No physical reversal or stock adjustment occurs.

Relevant source/receiving/proposal/fact/Supply/allocation/Demand changes and current permission loss hold unexecuted actions. Unrelated records do not. Current linked authority precedes summaries, snapshots and original receipts. Return the immutable review, receiving decisions, actual native receipt and original/successor facts to ES-07 for a fresh explicit disposition review/application. Neither notes, Activities nor completed Supply actions resolve exceptions. Existing operational holds remain after quotation resolution. Missing receipts remain inconclusive; recover the actor-bound original before replacement.

Migration 0065 adds immutable companion events and optional links on existing Supply events; no new capability, grant, seed or dependency. Old normalized commands and stored effects remain recoverable. Operational policy, independent visual review, owner acceptance and deployment remain separate; [handover](../delivery/quotation-receipt-correction-handover.md) and [execution ledger](../testing/evidence/quotation-receipt-correction/README.md) record actual proof.

## Independently received Shipment shortfall reductions — SYN-ES07-06

The [adopted bounded contract](../decisions/quotation-allocation-shortfall.md) extends ES-07/SC-09 for one current applied Receipt correction whose linked Shipment has insufficient evidenced usable capacity. The owned referral remains actionable after explicit quotation retention, without fabricating an exception. Original quotation lineage, completed conversion, correction review/receiving/native receipt, current Receipt, all allocations, affected Demands, owners, versions and dependencies remain exact.

The permitted proposal reduces existing Usable allocations only, including exact native zero. Preserve allocation identities/links/company/item/unit/basis, Demand quantity/classification and all Receipt evidence. Every changed Demand owner records a separate Accepted, Returned or Held decision for the complete proposal; earlier Receipt acceptance is not allocation consent. Unchanged Demands receive no native version/Impact change. The referral owner must hold current coordination over Supply and each changed Demand; independently receiving an own Demand grants no authority over another.

`shortfall-propose` and `shortfall-receive` use the established ES-07 command envelope, original journal and predecessor lineage. A ReduceAllocations review binds `allocation_proposal_id`, exact latest `effect_receiving_ids`, full dependency snapshot and reserved original native operation. Apply is separate. One changed allocation reuses `Supply:Allocate`; several use bounded `Supply:ReduceAllocations`, one SQL UPDATE with non-deferred statement-level conservation for all native allocation writes. The native `/api/v1/supply/allocations/reduce` endpoint recovers the exact applied original only; it cannot create unreceived atomic work. No intermediate allocation state is committed or exposed. Atomic failure preserves all allocations, histories, impacts and receipts.

Final Usable totals must fit evidenced capacity and Demand quantity and remain above current picked totals. Consequential reservation/purchasing/fulfilment facts, return/custody children and unknown external outcomes require their owning workflow. Preserve accurate evidence on refusal. Relevant changes to source, Receipt, allocations, Demand, owners, dependencies, receiving or authority hold unexecuted work; unrelated records do not. Old reservations remain protected after correction/reassignment. Current linked authority precedes histories/counts/receipts; missing receipts remain inconclusive.

The immutable outcome returns actual before/after allocation versions, original native receipts, current capacity, unmet Demand and continuing owned impacts. Supply versions once; each changed Demand versions once and receives the existing Requested Impact/MaterialAction. Fresh readiness and explicit new ES-07 disposition are required wherever a current exception exists. Capacity validity, notes, Activity completion and Supply completion cannot clear independent operational holds. Migration 0066 adds no seed/grant/capability/identity. [Handover](../delivery/quotation-allocation-shortfall-handover.md) and [execution ledger](../testing/evidence/quotation-allocation-shortfall/README.md) separate runtime evidence, visual review, owner acceptance and deployment. Allocation priority and external release/reversal remain Not configured.

## Owned downstream material resolution — SYN-ES07-07

The [exact contract](../contracts/quotation-material-resolution.md) extends an accepted ES-07 Supply referral after an applied received allocation reduction. One affected Project-origin Demand and its exact Requested Impact/MaterialAction can receive proposed withdrawal of both dates from one unstarted Planned Project task. Demand owner, Project coordinator, task owner and MaterialAction owner decide separately. Immutable review and separate application reuse native SaveProjectTask and predecessor-linked Supply Impact review with both receipts in one bounded transaction. Activity completion and Reviewed labels alone prove no operational resolution. Unmet Demand and independent holds remain; current ES-07 exceptions require fresh disposition even after earlier retention. Allocations, Receipt facts, Demand quantity/classification and output bytes remain. [Handover](../delivery/quotation-material-resolution-handover.md) and [ledger](../testing/evidence/quotation-material-resolution/README.md) distinguish proof, policy, visual/owner acceptance and deployment.
