# PP-01 — Minimum Finance and customer-account contract

**Edition:** r02 · **Status:** Maintained minimum BP-09 contract with bounded P10 implementation; actual verification/publication in the P10 handover. This is a software/workflow contract, not approved accounting policy or a live MYOB mapping.

Sources: FIN-01–FIN-03/FIN-06/FIN-07, FD-01/FD-02/FD-04/FD-10, DAT-10, TR-14, BR-01/BR-08/BR-14/BR-16/BR-19–BR-21. [Package](../prototype/README.md).

## 1. Included outcome

Provide an owned Finance queue that receives exact reviewed service evidence, decides its financial treatment, records processing in the authoritative ERP, and reconciles the result. Provide a restricted account-reference view with clearly labelled synthetic transactions/balances and a future verified read boundary.

PP-01 uses SyntheticManual mode by default; SyntheticApi exists only to exercise timeouts/replay against a simulator. Actual Manual/VerifiedApi modes remain disabled. No invoices, stock transactions, payments or credits are posted by this documentation task or its fixtures.

Project actuals, commitments, margin, revenue recognition, ageing policy, GST treatment, foreign exchange and full Finance dashboards remain broader BP-09/D-017 work. Do not insert plausible formulas or defaults merely to fill dashboard cards.

## 2. Responsibility and authority

Service verifies that work and recorded quantities are attributable and technically described. Finance owns charging treatment, source/target accounting basis, actual ERP action and reconciliation. Supply Chain verifies stock/material source references as required; a technician's consumption entry does not establish a warehouse issue.

Finance review, processing and reconciliation are separate capabilities. Synthetic demo users can exercise them individually. If a future small team combines duties, an approved compensating review is needed; this package does not invent delegated thresholds or assign employees.

## 3. Handoff input contract

Each handoff contains one work order, one verified ERP company/customer mapping, exact report/entry revision IDs, mode, source evidence manifest, correlation ID and an accountable processing owner when claimed. Separate handoffs handle different companies/currencies/billing bases. Multiple visits are permitted under the same work-order/account context with line-level attribution.

Each source line records original captured quantity, Service-approved quantity, allocation to this handoff, unit, financial disposition, billable quantity if applicable, reason, optional authorised rate/amount/currency/tax basis, and remaining unallocated quantity. Approved corrections reference the original; the original is never overwritten.

Before submission: reports reviewed/issued as required by output policy; entries Approved; account mapping Verified; unresolved coverage/charging decision identified; evidence accessible; source revisions unchanged; no over-allocation. Before approval: all financial dispositions resolved to Billable or NonBillable with authorised reasons; relevant definitions/UOM conversions/rounding are explicit. WarrantyReview/GoodwillReview are review states and cannot release a handoff.

An allocation consumes reviewed source quantity, not just billable quantity. Otherwise a non-billable disposition could later be invoiced again without review. Hold allocation from ReadyForReview through final processing; Returned keeps a review hold until revised or explicitly released; pre-effect Cancelled releases it transactionally. Processed/reconciled allocations remain consumed until an evidenced correction/reversal policy allows a successor. Locks/constraints must prevent simultaneous over-allocation across handoffs.

## 4. State and queue contract

| State | Meaning | Permitted next action |
|---|---|---|
| Draft | Editable working handoff; no released processing authority | Submit with validated allocation and evidence, or cancel before effects |
| ReadyForReview | Source snapshot and quantities reserved; awaiting Finance | Approve or Return with reasons |
| Returned | Reviewer identified changes; original submitted revision retained | Create revised Draft and transfer/release allocation under lock |
| Approved | Finance treatment and source version frozen | Claim processing; or return before external effect if input changed |
| AwaitingERP | One accountable processor has claimed the action | Record evidenced Processed/NotProcessed/Unknown outcome |
| OutcomeUnknown | An external action may have happened | Investigate and record verified outcome; no blind resubmission |
| ReconciliationRequired | Outcome evidence exists, but mappings/differences need review | Complete line/result comparison; correct mapping or raise ERP correction |
| Reconciled | Required target evidence matches approved source, or reviewed no-posting disposition is complete | Read/export; corrections via linked successor, never edit original |
| Cancelled | Abandoned before any possible external effect | Historical only; new work uses new handoff |

Do not transition AwaitingERP to Cancelled merely because a browser closed. Verified NotProcessed can return to Approved after recording evidence and releasing the processor claim. A new processing attempt retains original correlation and attempt lineage. Unknown must first be resolved.

Queue shows company/account, work/report references, owner, state, submitted/reviewed/processing timestamps, age, missing evidence and next permitted action. Due/overdue rules remain policy inputs; absence of a due date is visible. Queue-age calculations use UTC instants with display timezone; they are not SLA claims.

## 5. Manual processing procedure

1. Finance opens ReadyForReview and checks scope/report revisions, recorded versus approved quantities, coverage/billability and source mapping.
2. Return with specific reasons or approve the exact snapshot/definition version.
3. A processor claims Approved using an expected version. The app records AwaitingERP and the processor before the external work begins.
4. In future operational use, process the approved action using the actual MYOB workflow. In PP-01, use the simulator and label the result synthetic.
5. Record ERP company, document type/ID, target line IDs, quantities/UOM, actual source status, observed time and evidence reference. Do not enter a fabricated plausible document number as if verified.
6. Reconcile source-to-target lines and evidence. Missing mappings, different units, uncertain statuses or unknown effects keep the item open.
7. Close as Reconciled only when the comparison or authorised no-posting disposition is complete. Record reviewer/time and any permitted difference with its approved basis.

If the person cannot determine whether an ERP action succeeded, select OutcomeUnknown and search the source using the correlation and business keys before proceeding. Deleting a local row never reverses an ERP transaction.

## 6. Line mapping and correction

One source entry may split into several approved target lines; several source entries may map to one target line only with explicit allocations and a non-duplicated reconciliation grain. Compare quantities on the same UOM using a reviewed conversion when necessary. Compare amounts only when both sides have an approved matching currency/tax/rounding definition.

Capture time, approved time, billable time and ERP-posted time are distinct. For a simple synthetic example, a 90-minute captured/approved labour entry is allocated as 60 billable and 30 non-billable minutes with a reason; all 90 minutes are dispositioned. Replaying this handoff must not create another 60-minute charge or free the 30-minute allocation for silent later billing. This is a test example, not Powerplants billing policy.

Pre-processing source correction invalidates the Approved snapshot and returns it to review. After possible processing, put the item into OutcomeUnknown/ReconciliationRequired as appropriate; preserve original evidence, obtain actual target outcome and create a linked correction/reversal request. A corrected report alone cannot adjust the ledger. Supplier recovery, customer credit and physical return each need their own authoritative evidence.

## 7. Customer account view

FD-01 includes transaction identity/type, company/customer, dates/due date, currency, original amount, authoritative remaining amount where supplied, source status and source-as-at. FD-02 includes remaining balance only on a verified source/definition basis. FD-04 shows deposits/unapplied cash separately; it does not automatically net them against a displayed invoice.

Every query/run records extraction scope, pagination completeness, count, cutoff, source statuses/reversals and reconciliation result. A successful page request is not proof of a complete account. A source failure retains last-good observations with a visible failure/as-at label. Missing values render Unavailable/Unknown, never numeric zero.

Do not aggregate across currencies or legal companies without an approved conversion/consolidation definition. Do not derive an account balance by summing only currently visible table rows. Role permissions restrict balances and internal financial detail; technicians receive only the operational coverage information needed for assigned work.

## 8. Independently specified synthetic Finance fixtures

These fixtures test arithmetic and display semantics. They do not define tax rules or demonstrate live ERP reconciliation. All amounts are fictional AUD values on the same declared fixture basis.

| Fixture | Inputs | Required outcome |
|---|---|---|
| F-01 Partial payment and credit | Invoice original 1,100; applied payment 400; applied credit 100; fixture source remaining 600 | Show original 1,100 and remaining 600 separately; compare to supplied source balance |
| F-02 Unapplied cash | F-01 plus separate unapplied receipt 200 | Invoice remaining stays 600; unapplied cash 200 shown separately; no automatic 400 balance |
| F-03 Reversal | F-01 payment reversed; fixture source remaining 1,000 | Preserve reversal lineage; remaining 1,000; do not retain the old 600 as current |
| F-04 Partial import | Only one of two declared pages returned | Incomplete; no verified account total, even if visible rows are arithmetically correct |
| F-05 Unknown definition | Open committed cost definition absent | Display Not defined/Not comparable, never 0 or a green verified status |
| F-06 Quantity split | Approved labour 90 MIN, split 60 Billable + 30 NonBillable; consumed part 2 EA | Exactly those allocations; returned target must evidence billed 60 MIN and applicable material treatment; non-billable 30 has reviewed disposition |
| F-07 Unknown result | Simulator records one target then returns timeout | OutcomeUnknown; lookup finds same target; one financial effect only |

Fixture quantity reconciliation tolerance is exact equality on like units. Fixture currency values use two-decimal examples with exact equality. These are deterministic test parameters, **not a production tolerance or tax/rounding decision**. D-017 must supply real definitions and exceptions.

## 9. Minimum live-interface evidence still needed

MYOB version/company/module/licence inventory; actual source entities/fields/statuses; read/write/authentication scope; record/line keys; supported filtering/pagination/delta/reversal semantics; accounting cutoffs; currency/tax/UOM/rounding definitions; permitted manual evidence; correction/reversal procedure; freshness/tolerances; processing/reconciliation owners.

No live command endpoint has been asserted or tested. Account fixtures and simulated references cannot close D-005/D-006/D-017. P10 must prove PT-17/PT-19/PT-20/PT-21 synthetically; operational proof remains separate.

## P09 service evidence dependency boundary

P09's physical implementation stops at immutable exact personal completion submissions, service review, accepted attendance, durable OUT-10 revisions and explicit customer responses. Approved `report_reviews.entry_decisions` references the exact original `field_entries` versions in `report_entry_refs`; captured quantities remain unchanged, and the approved set supplies technical reviewed quantities. P07 field originals keep their historical Draft flag; P10 must read the immutable review projection, not mistake that original flag for current Finance eligibility.

A report correction opens a successor service review cycle while preserving accepted attendance, older report issues and responses. Future P10 eligibility must validate the exact source/review revision and current report dependency before allocating or processing. A previously accepted customer response or signed old PDF cannot authorise a changed source, billing or a downstream target. No Finance handoff, allocation, processed target, balance, stock posting, invoice, payment, tax, rate, claim or ERP reference is created by P09 or its tests. This remains a proposed Finance contract until separately authorised P10 implementation and verification; see the [maintained P10 starter](../delivery/p10-starter-prompt.md).

## P10 physical implementation amendment

This amendment supersedes the preceding preparation-only status for the separately authorised P10 slice. [ADR-0016](../decisions/ADR-0016-p10-finance-handoff.md) and the [handover](../delivery/p10-handover.md) govern implementation and actual publication. The original F-01–F-07 expected facts above remain independently specified.

`finance_accounts` is an immutable `SyntheticVerified` account identity, exact Proposed mapping/version/snapshot, company/customer, fixture identity and AUD context. The existing live mapping guard still forbids `Verified`. Seed 11 creates only three distinct Finance duty users, explicit Company grants, fictional account contexts and versioned definitions/templates. It creates no handoff, earlier-stage Finance record or financial transaction. Repeat seed never restores a revoked grant.

`finance_handoffs` owns one work order/account/company/customer/site/currency, synthetic mode, permanent FH reference and correlation. Revision changes append `finance_revisions`, `finance_sources` and `finance_lines`; original personal records are never rewritten. Exact source readiness rechecks current Issued report, exact Approved technical review and entry set/version/hash, issue bytes, active reviewed recipient tuple, authority/scope/readiness/pack/assignment/customer/site dependencies and explicit AllRecorded/None personal declarations. Partial/UnableToProceed requires owned remaining work and a separately stated Finance basis. An Incomplete declaration blocks readiness even when attendance was accepted. No report-only correction authorises another physical visit or closure.

Source quantity uses exact whole MIN for supported time and the original declared material UOM/direction for Consumed/Returned. Fractional minutes and unsupported material directions block without rounding or stock inference. Positive decimal quantities use at most six places and exact scaled integers. A Draft may be incomplete; ReadyForReview must disposition every quantity of every selected report. Split allocations are permitted; multiple Billable allocations share a target group only on identical UOM/direction. Billable quantity equals that allocation; NonBillable equals zero with an explicit reason; Pending/WarrantyReview/GoodwillReview remain null and cannot approve. The captured/reviewed quantity is repeated source context on split lines and must never be summed as if each row were another source entry.

`finance_allocation_holds` reserve all allocations at submission under the workspace lock. A competing handoff cannot reserve the same root quantity. Returned retains Held; explicit revised Draft releases/transfers prior holds atomically; pre-effect Cancelled releases. Processed and reconciled quantities become Consumed, including reviewed NonBillable quantities. There is no automatic netting, tolerance, unit conversion or reuse of processed quantity.

| Command boundary | Exact physical outcome |
|---|---|
| Create/revise then submit | Immutable Draft revision; complete source conservation before ReadyForReview |
| Separate review | Approved or Returned exact revision/hash/policy; a pre-effect return of Approved retains the original approval and adds an ApprovalReturned event/reason |
| Begin processing | Approved → AwaitingERP; one `finance_processing_attempts` owner, original correlation/hash and stable target-line identities |
| Dispatch | One independently committed local simulator effect; `dispatch_started_at` prohibits another dispatch after possible acceptance |
| Record/lookup outcome | Unknown → OutcomeUnknown; Processed → ReconciliationRequired; verified NotProcessed → Approved with released claim, or ReconciliationRequired for no-posting dispositions |
| Reconcile | Separate reconciler compares exact target ID/type/company/account/currency/status/lines/allocations/direction/quantity; Matched or NoPostingRequired → Reconciled |
| Source successor | Unprocessed → Returned; claimed/unknown → OutcomeUnknown; processed/reconciled → ReconciliationRequired; originals and consumed/held quantities remain |
| Linked correction | Investigate/CorrectionRequested/ReversalRequested preserve original revision/outcome; no ledger correction or reversal is executed |

SyntheticManual uses the controlled local fixture, with SyntheticApi selected explicitly for accepted-then-timeout F-07. Actual Manual/VerifiedApi remain disabled. Target type is `SyntheticServiceCharge`, provider `PPO-SyntheticTarget-v1`; UUIDs are fictional target identities, never MYOB document numbers. Missing original lookup writes an immutable NotProcessed fence. Late dispatch, duplicate original IDs and competing claims cannot create a second target. Receipt recovery is checked against current original actor and Finance scope before return. Late audit/receipt/outbox failure rolls back local mutation; an independently accepted target remains available only through original-operation lookup. Unknown observations never expose a target merely because the simulator has one internally.

SC-12 queue and detail expose only current Finance-scoped records, explicit UTC/as-at, owner, state/timestamps, source blockers and permissible actions. The queue uses 50-row pages; page count is labelled and due policy is Not defined. SC-13 reads literal F-01–F-05/Failed runs, with extraction scope/pages/count/cutoff/status/source-as-at and immutable predecessor observations. F-04/Failed/mapping mismatch make current balance Unavailable and unapplied cash Unknown; last-good evidence remains historical. A failed HTTP refresh also clears current-value claims while labelling the retained observation historical; recovery reloads the original source values. Unapplied cash remains separate. Filtered rows never recompute source balance. Commitments remain Not defined. Technician, customer and Systems output excludes these values.

OUT-14 is released only from the exact Reconciled revision in this bounded increment; current queue/detail remain the review surface for incomplete/unknown work. Exact source/template/review/reconciliation, original stored bundle/manifest/hash/size/provider version and current audience are rechecked at finalisation. Preparation reserves an issue identity/time; actual release has a separate issued-at event. Storage success followed by database failure recovers the original job and bytes. No output regeneration, signature insertion, customer email/SMS/calendar or live distribution is permitted. Operational accounting, ERP mapping, document retention and broader BP-09 decisions remain open.
