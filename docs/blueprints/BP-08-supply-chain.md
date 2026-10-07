# BP-08 — Supply Chain Management Functional & Build Blueprint

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review status: working synthetic implementation specification; owner/business review pending. Sources: [BP-01](BP-01-master-blueprint.md), [SCM readiness contract](../contracts/supply-chain-readiness.md), [fulfilment integration contract](../contracts/order-fulfilment-integration.md), [ADR-0049](../decisions/ADR-0049-native-supply-chain.md), current SC-01–SC-10 page contracts. All 78 parent requirement IDs remain unchanged.

## Authority and implementation

PPO coordinates material evidence and owned work. MYOB remains the intended ERP/inventory authority, SharePoint the intended business-document repository and Engineering the technical authority. Native Supply Chain uses the existing modular monolith and PostgreSQL with synthetic/manual observations. No ERP field mapping, endpoint, unit conversion, live command or organisational authority is verified by this build.

The four closed aggregate kinds in `supply_records` are Demand, Supply line, Return and Service custody. Each has a permanent UUID, separate stable readable reference, company/Site scope, explicit item/unit/decimal quantity, accountable owner, next action and source time/completeness. The kind-specific payload is validated from a closed field contract; unknown fields are refused. Supply line grain permits several lines per shared shipment identity. `supply_allocations` binds many demand lines to many supply lines. Its Incoming and Usable bases are PPO coordination evidence, not ERP reservations. `supply_facts` retains typed observations and corrections. `supply_revisions` and allocation history preserve predecessors. No delete/correction overwrites issued evidence.

## Scope and workflows

| Page | Native path | Parent and controlled result |
|---|---|---|
| SC-01 | `/supply/material-readiness` | SCM-01/02/08: Forecast versus Approved demand, exact origin revision, evidence-limited readiness and owned blockers |
| SC-02 | `/supply/purchasing` | SCM-03/04: requisition, authority evidence, supplier comparison, purchase observation and independently evidenced promises |
| SC-03 | `/supply/shipments` | SCM-05: line-grained shipments, split allocation, ETA versions, manufacturing/import/freight references |
| SC-04 | `/supply/receipts` | SCM-06: arrival, physical receipt, inspection, shortage/damage/quarantine, usable and source receipt distinction; mobile capture |
| SC-05 | `/supply/stock` | SCM-02: company/warehouse/bin observations; source quantities remain separate; source reservation Not configured |
| SC-06 | `/supply/dispatch` | SCM-07: usable allocation → pick → stage → preparation → movement; Engineering substitution references; mobile capture |
| SC-07 | `/supply/deliveries` | SCM-07: exact delivery line quantities, POD, exceptions, remaining quantity and separate customer acknowledgement; mobile capture |
| SC-08 | `/supply/returns` | SCM-06/07/08: six views for return authorisation, inspection, disposition/customer remedy, supplier recovery and restricted credits |
| SC-09 | `/supply/changes` | SCM-08: exact before/after impact evidence and an owned shared Activity; downstream records unchanged |
| SC-10 | `/supply/service-stock` | SVC-09/SCM-07: issued custody and mutually exclusive held/job/used/returned/damaged/quarantine/missing outcomes, exact Field evidence and inventory reconciliation |

The existing seven-item rail is preserved. Changes shares Material demand; Service stock shares Stock & reservations; Dispatch and Deliveries share Dispatch & delivery. The global information icon resolves `guide.sc.01` through `guide.sc.10`, with page-specific native guidance and separately maintained development drafts.

## Quantity and state contracts

Quantities use exact nonnegative decimal strings with at most six places, stored as PostgreSQL numeric without rounding. This is a prototype representation limit. There is no conversion dictionary. Allocations require identical company, item and unit. Incoming allocation cannot exceed supply line or demand quantity; Usable allocation needs complete usable evidence. Concurrent commands take the existing workspace transaction lock and check exact record versions. A later source correction can invalidate readiness without erasing an earlier observation.

Receipt: inspected ≤ received; usable + quarantined ≤ inspected; damaged ≤ quarantined. Receipt sums cannot exceed the stated line, and a line revision cannot reduce it below retained physical receipts. Return revisions retain sufficient quantity for current authorisations, receipts and dispositions; demand revisions retain sufficient quantity for issued custody. Damage is a property of quarantined units, not another quantity to subtract. Unknown/partial source state is not zero. Prepared dispatch is distinct from physical Moved evidence and from source shipment observation. Pick ≥ staged ≥ physically moved ≥ delivered; outstanding is demand less current physical delivery. Excess is held for review, outside fulfilled demand.

Return: request identity and original source remain explicit. Customer authorisation is bounded by remaining delivered entitlement; concurrent return records cannot exceed it. Unidentified goods may be recorded but cannot be authorised or made usable. Proposed, Approved and Executed disposition are distinct and retain the same scope. Customer remedy and supplier recovery may finish independently. Warranty decisions remain MA-06/MA-07 references. Restricted credit content is queried only with Finance visibility and reconciled only with the existing Finance reconciliation capability. Customer and supplier credit are separate observations: no netting or invented loss calculation.

Custody: every issued unit belongs to exactly one current category. An at-job quantity remains custody until supported as used or another outcome. Used references the exact current Field Material entry, appointment, technician, item, unit and consumed quantity; the same capture cannot reconcile two custody records. Closure requires no unresolved custody, job-held, missing or quarantine quantity and an authoritative inventory reference/time. No automatic billability or inventory posting occurs.

## Idempotency, evidence and access

Every consequential PPO save uses the shared operation identity, canonical content signature, current-authority check, receipt, audit and outbox in one transaction. Same-key/same-content replay returns the original receipt; changed content is refused. Current linked Project, Work Order, Site, Facility, Equipment and Engineering permissions are rechecked before any record or receipt is disclosed. Query projections exclude restricted credit facts before returning lists/history/counts. Responses are private/no-store.

PNG evidence reuses the existing document-store adapter and image validation. Exact bytes and hash are verified before immutable metadata is available. A database failure after storage can leave an unreferenced immutable file; the original storage operation is reused on retry. Record revisions, business evidence and file availability are distinct. Source outcomes can be Unknown; reconcile the original operation/reference, never infer failure from a missing lookup. All external commands remain disabled.

## Handovers and unresolved contracts

Activities/My Work is the only follow-up system. Source changes create owned Material Actions and versioned impacts. Canonical links open Customer/Site/Facility/Equipment, Project, Work Order, appointment and Engineering context under their existing readers. A material delay does not alter a booking, Project programme or issued pack. Scheduling's native change request requires a proposed interval and crew; Supply Chain does not invent those values. Its Activity requests review; the Scheduling owner enters the actual proposed change through the appointment workspace. Document reissue remains with its owner. Quotation, CRM handover and warranty sources without a verified typed receiving contract remain explicit evidence references.

IF-11–IF-16 are manual/synthetic receiving boundaries, with provider/configuration/company/entity/key retained when known. Real ERP mappings, reservation semantics/authority, age thresholds, unit dictionary, partial-dispatch corporate policy, customer acknowledgement medium, source shipment semantics, financial definitions and production visibility grants remain unresolved. Consequential source commands show Not configured. Technical release does not authorise spending or installation; a completed visit does not prove reconciliation or Finance processing.

## Design and verification status

Use the current shell and r20 register/detail/review patterns, semantic navy/green tokens, Roboto/Verdana, 44px touch controls and 16px mobile form inputs. Exact historical source references remain in the page contracts. SC-10's native composition is a new proposal because no exact historical HTML/image existed.

The SC-08 r01 uploaded source report records missing authoring files and different HTML hashes. Those historical bytes and warnings are unchanged. Native tests are new implementation evidence and never retroactively verify the standalone design.

See [implementation handover](../delivery/supply-chain-native-handover.md) for actual unit/database/HTTP/browser checks, captures, commit IDs and limits. Passing tests do not grant owner acceptance, operational policy approval, deployment or production readiness. AT-16/AT-29/AT-31 business acceptance remains separate.

## Owned completed-conversion Supply follow-up — 4 October 2026

The [SYN-ES07-03 contract](../contracts/quotation-supply-followup.md) implements attributable referral, named-owner acceptance/return/hold, immutable shared-allocation review and separately applied native outcomes. It reuses quantity-only `Supply:Allocate` on already Approved demand, retaining allocation identity and Incoming/Usable basis, including native zero. No demand class, ERP reservation, supplier commitment or stock movement changes. Returned evidence requires explicit new ES-07 disposition; Activities and Supply outcomes do not automatically clear quotation exceptions. Prior evidence and operational holds remain. The contract and execution ledger distinguish implementation from acceptance and deployment.

## Owned reservation outcome reconciliation — SYN-ES07-04

The [bounded decision](../decisions/quotation-reservation-reconciliation.md) extends the existing accepted referral with ReconcileReservationOutcome. Review names a current ExternalOutcome/Reservation fact on the converted Demand in Unknown state. It freezes the same original source operation, Complete Confirmed/Failed/Absent observation, explicit UTC observation time, lookup evidence and demand version. Separate Apply uses native `Supply:Fact:ExternalOutcome`, committing the successor fact/history, original native receipt and returned outcome atomically. Original facts, referrals, decisions, receipts and output bytes remain.

The review API adds `dependency_id`, `outcome_state`, `observed_at` and `lookup_evidence` only for this decision; allocation fields are null. Earlier command hashes stay unchanged. Other unknown outcomes, changed predecessors/versions/source evidence or revoked authority hold application. Unknown or partial lookup is never evidence of Absent. Retain, Return and Hold remain supported; corrections and reassignment retain predecessor lineage.

This reconciles native evidence only. Demand quantity/class, shared allocations, other demands and external reservations are unchanged. Consequential allocation and Approved demand-quantity holds continue. Returned evidence requires fresh explicit ES-07 review/application; a note, Activity completion or Supply outcome cannot clear the exception. Migration 0064 adds no grants, seeds, identities or technologies. [Execution evidence](../testing/evidence/quotation-reservation-reconciliation/README.md) separates actual proof from acceptance and deployment.

## Existing Receipt evidence correction

SYN-ES07-05 in the [adopted decision](../decisions/quotation-receipt-correction.md) binds one existing Receipt successor to an accepted ES-07 referral and independent receiving by every affected Demand owner. Native impacts and exact original receipts return for fresh ES-07 disposition. Reduced usable evidence retains allocations and exposes shortage; Stock observation, fulfilment and physical events remain unchanged. [Handover](../delivery/quotation-receipt-correction-handover.md). No new parent scope or operational authority.

## Receipt-derived shared allocation shortfall

[SYN-ES07-06](../decisions/quotation-allocation-shortfall.md) adds independently received exact reductions to existing Usable allocations on one corrected Shipment. Each changed Demand's owner receives the complete proposal; separate immutable review and native application preserve identities, Demand quantities/classification and Receipt history. One adjustment uses Supply:Allocate; several are atomic with immediate final conservation and picked lower bounds. Capacity validity does not satisfy all Demand or resolve operational impacts. Continuing Supply work remains available after quotation retention; current exceptions require fresh explicit ES-07 disposition. See the [handover](../delivery/quotation-allocation-shortfall-handover.md) and [execution ledger](../testing/evidence/quotation-allocation-shortfall/README.md). Scope/parent IDs, external authorities, independent acceptance and deployment remain separate.

## Owned downstream material resolution — SYN-ES07-07

The [exact contract](../contracts/quotation-material-resolution.md) extends an accepted ES-07 Supply referral after an applied received allocation reduction. One affected Project-origin Demand and its exact Requested Impact/MaterialAction can receive proposed withdrawal of both dates from one unstarted Planned Project task. Demand owner, Project coordinator, task owner and MaterialAction owner decide separately. Immutable review and separate application reuse native SaveProjectTask and predecessor-linked Supply Impact review with both receipts in one bounded transaction. Activity completion and Reviewed labels alone prove no operational resolution. Unmet Demand and independent holds remain; current ES-07 exceptions require fresh disposition even after earlier retention. Allocations, Receipt facts, Demand quantity/classification and output bytes remain. [Handover](../delivery/quotation-material-resolution-handover.md) and [ledger](../testing/evidence/quotation-material-resolution/README.md) distinguish proof, policy, visual/owner acceptance and deployment.

## One independently received Project dependency — SYN-ES07-08

SYN-ES07-08 adds explicit receiving for one FS/SS successor: withdraw both forecast dates from A and B, preserve their dependency, require five separate owner decisions, then atomically execute two native Projects task saves and the exact Impact successor. Project advances twice; each task and the selected Demand once. Unmet Demand, independent Impacts, Activity ownership and fresh explicit ES-07 disposition remain. Additional relationships or consequential links hold execution.

The [adopted dependency decision](../decisions/quotation-task-dependency.md) and [handover](../delivery/quotation-task-dependency-handover.md) define direction, native warnings, unchanged relationship and exact recovery. `material-propose` optionally adds `successor_task_id`; omission retains every original isolated command hash. Selecting B adds the Successor receiving role with current Project/source read authority and a reserved successor `SaveProjectTask` command at Project version +1. The proposal and immutable review bind both tasks and all three native operations. Five exact acceptances precede review/application. Both task saves and the Impact successor commit or roll back together. Original two-receipt outcomes remain unchanged and recoverable after migration 0068. [Execution evidence](../testing/evidence/quotation-task-dependency/README.md) remains separate from acceptance and deployment.

## Owned three-task forecast chain — SYN-ES07-09

SYN-ES07-09 extends the exact received allocation outcome to explicitly selected A → B → C in the same Active Project. Six separate decisions cover Demand, Project coordinator, A owner, MaterialAction owner, B owner and C owner. Immutable review precedes separate atomic application of three native task saves and the exact Impact successor. All four FS/SS combinations are supported; every additional touching edge or consequential link holds execution. Each task advances once, Project three times, Demand once; both relationships remain. Four native receipts substantiate scoped forecast withdrawal. Unmet Demand, independent Impacts, the Activity lifecycle and fresh explicit ES-07 disposition remain. Earlier isolated/two-task payloads and outcomes retain recovery. See [decision](../decisions/quotation-task-chain.md), [handover](../delivery/quotation-task-chain-handover.md) and [execution ledger](../testing/evidence/quotation-task-chain/README.md).

## Owned three-task Project branch — SYN-ES07-10

SYN-ES07-10 makes the previously held A → B and A → C allocation-reduction consequence executable within Projects and the existing Supply Impact workflow. Six separate decisions (Demand, Project, A, MaterialAction, B/Successor and C/BranchSuccessor) precede immutable review and separate atomic application. Three native task saves clear dates and preserve both FS/SS relationships; all four combinations are supported. Each task advances once, Project three times and Demand once. Four native receipts substantiate the exact Impact successor. Unmet Demand, independent holds, Activity lifecycle and fresh explicit ES-07 disposition remain. Extra touching edges/consequential records hold action. Migration 0070 preserves isolated, paired and linear-chain hashes, roles, evidence and recovery.

See the [branch decision](../decisions/quotation-task-branch.md) for exact lineage, receiving authority, native write footprint, refusals and alternatives; the [handover](../delivery/quotation-task-branch-handover.md) and [execution ledger](../testing/evidence/quotation-task-branch/README.md) separate functional proof, visual/owner acceptance and deployment. `branch_successor_task_id` with `successor_task_id` explicitly selects the branch; combining it with `chain_end_task_id` is refused. BranchSuccessor never reinterprets ChainEnd. No native rule, grant, seed, policy or external-system authority changes.

## Owned three-task Project merge — SYN-ES07-11

SYN-ES07-11 makes the previously held three-task merge A → C and B → C executable after an independently received allocation reduction. Six decisions cover Demand, Project coordinator, A, MaterialAction, retained predecessor B and shared successor C. Native saves withdraw A/C forecasts; B's complete native row, dates, status, progress, owner, version and history remain exact. Project advances twice and Demand once; both FS/SS relationships remain, with three native receipts. Unmet Demand and independent holds remain; current ES-07 exceptions require fresh disposition. Migration 0071 preserves earlier isolated, pair, chain and branch contracts and original recovery.

See the [merge decision](../decisions/quotation-task-merge.md) for native evidence, retained B, exact effects, authority, refusals and alternatives; [handover](../delivery/quotation-task-merge-handover.md) and [ledger](../testing/evidence/quotation-task-merge/README.md) separate actual proof from acceptance/deployment. Optional merge_predecessor_task_id and merge_successor_task_id select the topology together, exclusively of earlier inputs. MergePredecessor receives B retention; MergeSuccessor receives C withdrawal. Earlier roles and hashes remain unchanged.

## Owned four-task Project diamond — SYN-ES07-12

SYN-ES07-12 makes the previously held four-task Project diamond A → B, A → C, B → D and C → D executable after an independently received allocation reduction. Seven separate decisions precede immutable review and separate atomic application. Four native saves withdraw A/B/C/D forecasts in that order, saving D once, followed by only the selected Impact successor. All sixteen FS/SS combinations are in scope. Four Project increments, one increment per task, one Demand increment and five native receipts preserve all four relationships, unaffected fields, allocations, Receipt facts, unmet Demand and independent holds. Fresh ES-07 disposition and MaterialAction ownership remain separate. Migration 0072 preserves earlier topology hashes, roles, outcomes and recovery, including merge B retention.

See the [diamond decision](../decisions/quotation-task-diamond.md), [handover](../delivery/quotation-task-diamond-handover.md) and [execution ledger](../testing/evidence/quotation-task-diamond/README.md). Explicit diamond_b_task_id, diamond_c_task_id and diamond_d_task_id must be selected together and cannot mix with earlier topology inputs. DiamondB/C/D are separate responsibilities. Both paths and all affected/retained evidence bind every decision; added edges or consequential records hold execution. No graph-wide rescheduling or policy is inferred.
