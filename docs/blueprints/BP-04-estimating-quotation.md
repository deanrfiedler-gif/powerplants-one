---
document_id: BP-04
title: Estimating & Quotation Functional & Build Blueprint
revision: r01
date: 2026-09-06
owner: Dean Fiedler - private prototype
status: Proposed design; source and business acceptance remain open
work_package: PPO-010
source_commit: c3ac9b2ab9c09308f620a5b451a337eb75fe6390
---

# BP-04 — Estimating and quotation

## 1. Outcome and boundary

Convert a permitted customer's requirement into an owned, traceable estimate and a controlled commercial offer. Preserve the cost basis, offered scope and exact customer response through revision and downstream handover. This is Dean's private synthetic PPO prototype, under [PPO-010 / issue #10](https://github.com/deanrfiedler-gif/powerplants-one/issues/10).

Dean authorised discovery and design on 6 September 2026. This package proposes future behaviour; it implements no application, database, pricing policy, live integration or operational transition. EST-01–EST-09 remain the existing parent requirements. P01–P12 retain their order. The master allocates estimating implementation to Wave B; no earlier build is silently authorised by this design. [Decision and sequencing](../decisions/bp04-estimating-discovery.md).

Read this with the [evidence and CREMS dispositions](estimating-evidence.md), [screen specification](estimating-screen-specification.md), [acceptance plan](../testing/estimating-acceptance.md), [implementation sequence](../delivery/estimating-implementation-plan.md) and [handover](../delivery/estimating-discovery-handover.md). DG below means documented guide behaviour, PR means a PPO proposal, and UQ means unresolved evidence. A guide is not executable source or proof of the live tenant.

## 2. Domain ownership

| Record or fact | Owner and integration rule |
|---|---|
| Organisation, person, site, equipment, external account identity | Shared platform; reuse scoped UUIDs and exact company/provider/entity keys. Do not create a second customer or product-price master. |
| Opportunity, qualification, sales next action and sales outcome | CRM. Read the actual BP-03 I1 contract; it currently supports Enquiry/Qualified and Open. Creating an estimate does not move its stage or introduce CRM money fields. |
| Estimating request, commercial option, scope/answer revision, cost estimate, quote revision | Estimating. A request can be returned for clarification without losing the CRM pursuit. |
| Sales selection of forecast basis | CRM selects one permitted commercial basis per mutually exclusive group; no addition of competing options. An estimate is not revenue. |
| Technical design, released drawings and configuration authority | Engineering; native authoring remains in specialist tools. A scoping attachment is not a technical release. |
| Accepted scope delivery | Projects or Service explicitly accepts the handover. A customer response does not authorise a work order, book attendance or release a job pack. |
| Item/price/stock and commercial transaction authority | Intended MYOB authority. Source reads need effective date and completeness; a quote reserves no stock and proves no payment. |
| Issued business documents | Intended SharePoint ownership, subject to verified configuration. Reuse the existing private synthetic document adapter pattern first. |
| Processing, invoicing, revenue, tax and reconciliation | Finance/ERP, with P10 responsible for the separate service handoff. No competing account balance or billable-quantity calculation here. |

Operational CREMS, Pipedrive and MYOB retain their current roles. This work does not replace them. Any migration, external writes or cutover requires separate scoped work and evidence.

## 3. Journeys to support

| Journey | Actor, entry and preparation | Completion and exceptions |
|---|---|---|
| Product/parts with defined labour | Sales requests an estimate against an existing permitted opportunity; estimator records scope, quantities, units, manual/catalogue cost sources and freight. | Exact approved offer and response; backorder, wrong part, partial supply or changed price creates owned review, not silent substitution. Proposed first prototype journey. |
| Planned/reactive service | Service or Sales references a permitted intake/site/asset and defines chargeable proposed scope; uncertain diagnosis is an explicit allowance or clarification. | Offer acceptance and receiving service-owner decision remain separate from coverage, authorisation, readiness and booking. Unknown prepayment is not a deposit receipt. |
| Equipment upgrade | Sales/Engineering establishes existing configuration, compatibility, survey assumptions, shutdown constraints and alternative solutions. | Exact selected option and design basis pass to delivery. Incompatible equipment or changed survey creates a successor estimate; historic acceptance survives unchanged. |
| Major greenhouse project | Estimator coordinates facilities/systems/phases, technical questions, design effort, subcontractors, material demand and commercial options. | Reviewed project offer with inclusions/exclusions and milestones; unresolved design, expired supplier allowances and scope changes cannot be hidden in totals. Later bounded increments. |
| Warranty/return | Service/Finance reviews original supply, entitlement and remedy. | A remedy may require an explicitly priced proposal; no automatic new sale, negative quote workaround or credit. Preserve dispute and ERP-credit references under their owning domains. |

An indicative pre-estimate is a separate later outcome (OUT-01). It must not share a label or acceptance action with a firm quotation. ROI/calculator suggestions are not technical or pricing approval.

## 4. Routing and scope

DG: the Field Guide p46 defines first-match precedence. PR: retain that ordering for review under D-010, with a stored rule version, input snapshot and decisive answer. No production policy adoption is claimed.

| Priority | Documented condition | Documented route |
|---|---|---|
| 1 | Design/engineering required after proceeding | Project |
| 2 | Otherwise, dedicated project management required | Project |
| 3 | Otherwise, significant scope/design decisions remain open | Project |
| 4 | Otherwise, whether scope is settled is unknown | Stop; own clarification |
| 5 | Otherwise, enquiry kind is unknown | Stop; own clarification |
| 6 | Otherwise, supply of parts and any labour is fixed/defined | Sales Order |
| 7 | Otherwise, service/repair requires prepayment | Sales Order |
| 8 | Otherwise, service including unknown/no prepayment | Service Order |

Contract-review need is separate from route. Full Project starts with scoping; Express starts estimating. The option retains its route and route evidence; successor estimation revisions inherit that context. A different route requires a deliberately new option/request, not editing the original route. Clarification of an unknown prepayment answer must retain the former answer, authority and effect assessment. Printed payment terms, routing prepayment and ERP credit/payment records are three different facts.

E1 narrows this to a fictional, manually confirmed defined-supply option. It will not implement the general routing engine or choose a real ERP target. Missing site/contact remains explicit during drafting, using CRM's existing unknown reasons. Service/upgrade-specific identification and firm-issue prerequisites are enforced before those outcomes, not guessed from a customer name.

Scope revisions contain facility/system/phase references where relevant, included work, exclusions, assumptions, deliverables and evidence links. Removing scope must show affected answers, generated groups, cost lines, quote content and approvals before commitment. Unresolved conflicts retain the previous revision.

## 5. Commercial identities and logical fields

These are proposed models, not current SQL tables. All mutable records use UUID, fixed `workspace_id`/`company_id`, `version`, server actor/time and `synthetic`. Use typed composite foreign keys and append-only revisions/events; labels and readable references are not keys. Field names follow snake_case. Allocate physical API/schema/ADR numbers only at implementation start.

| Candidate | Minimum fields and relationships | Constraints |
|---|---|---|
| EstimatingRequest | `opportunity_id`, `requester_id`, `owner_id`, `need_summary`, `requested_scope`, `source_refs`, `state`, `return_reason`, `follow_up_activity_id` | Opportunity and every referenced target readable in the same company; owner eligible under current grants. |
| CommercialOption | `opportunity_id`, `label`, `alternative_group_id`, `relationship_kind`, `route`, `routing_snapshot_id`, `current_revision_id` | Alternative/explicitly additive distinguished. One default is navigation convenience, not acceptance or forecast selection. |
| EstimationRevision | `option_id`, `predecessor_id`, `revision_number`, `scope_revision_id`, `questionnaire_snapshot_id`, `change_reason` | Unique option/revision; original route inherited. Historical revisions never overwritten. |
| ScopeRevision | `included_work`, `excluded_work`, `assumptions`, `deliverables`, `scope_links`, `source_hash` | Retain exact source UUID/revision and captured text; unknowns carry owner/action. |
| QuestionnaireSnapshot/Answer | `definition_id`, `definition_version`, question key/type/unit/choices/visibility, answer/value/state, mandatory/assumed/locked/override flags | NotAnswered/Deferred/Answered/Confirmed distinct. Deferral and override require reason/authority; not substitutes for required confirmation. |
| Estimate | `display_number` (EST), `estimation_revision_id`, `current_version_id`, `owner_id` | Stable estimate identity distinct from option and estimation revision. Do not collapse nested version levels. |
| EstimateVersion | `estimate_id`, `version_number`, `predecessor_id`, `scope_revision_id`, `currency`, `tax_basis`, `calculation_policy_id`, `totals_state`, cost/sell totals and hashes | Draft versions can change through expected-version commands. Submitted/approved snapshots immutable. Amounts cannot be verified when required inputs are unknown. |
| EstimateSection/Line | section identity/order; line source/category, description, `quantity`, `unit`, `source_unit_cost`, `source_currency`, FX/landed-cost basis, `unit_sell`, source/effective dates, `lead_time_days`, `included`, configuration membership | Positive finite quantity, compatible unit/currency, nonnegative explicit amounts; blank is unknown. Quantity basis and freight/duty allocation recorded once. |
| ConfigurationRun | family/formula/parts-map revisions, input/override snapshot, diagnostics, generated-line identities, comparison and apply operation | A run is distinct from a published recipe refresh. Protect manual edits and prior run membership. |
| Quote/QuoteRevision | `display_number` (QUO), exact estimate/scope revisions, quote type, terms/validity/lead times, selected lines and narrative, customer-safe content hash | Quote quantities/prices/include/print belong to this revision. No silent refresh from current estimate/catalogue. |
| QuoteLinePresentation | source line ID, `included_in_price`, `show_on_document`, `show_in_annex`, group/section identity, quantity, price, discount, net | Inclusion changes money; visibility changes presentation. Preserve group membership and source line trace. |
| CommercialReview | estimate/quote kind, exact revision/hash, rule/authority snapshot, reviewer, decision/reason/time | Estimate approval and quote approval separate. Current grants rechecked at action. No invented delegation or self-approval limits. |
| QuoteIssue/QuoteResponse | exact revision, template/output hashes, immutable issue facts; stated respondent/role, response, captured/presented times, exact issued content, evidence and owned action | Response cannot attach to “latest”. Changed content requires a new issue and new response; old response remains. |
| CommercialHandover/ConversionAttempt | accepted revision and scope, destination/company/connection, receiving owner, operation/correlation IDs, payload hash, target results, reconciliation evidence | At most one effect per operation/target. Partial, Unknown and failed/no-effect differ. |

References: `SYN-PPO-EST-000001`, `SYN-PPO-QUO-000001`; final issue example `SYN-PPO-QUO-000001-quotation-r01.pdf` follows PPO-STD-001. Draft previews always say Draft and cannot be mistaken for an issued r01. UUID/version/option label/reference/state are independently displayed where useful.

## 6. State transitions and locks

| Object | Proposed transition | Guard and consequence |
|---|---|---|
| Request | Draft → Submitted → AcceptedForEstimating / Returned / Cancelled | Receiver explicitly accepts ownership; returned work gets a reason and owned next action. Acceptance of request is not estimate approval. |
| Estimate version | Draft → Submitted → Approved / Returned; Submitted → Withdrawn | No dirty/stale/incomplete totals, unresolved mandatory inputs or blocked costing. Freeze submitted input; return/withdraw preserves review history and creates a new editable version. |
| Quote revision | Draft → Submitted → Approved / Returned; Submitted → Withdrawn | Exact approved estimate source plus complete permitted customer content and pricing-policy review. Commercial changes invalidate this review. |
| Quote output | Preparing → DurableDraft → Issued; failure → RecoveryRequired | Immutable render input; verify stored bytes and current authority before issue. Worker success alone is not issue. |
| Distribution | Requested → Sent → Delivered where evidence exists | Manual/simulated records initially. Issued, downloaded or no-error is not evidence of sending/delivery. |
| Customer response | AwaitingResponse → Accepted / AcceptedWithReservations / Declined / Disputed / Unavailable | Proposed richer PPO responses; bind exact issue and stated respondent. All except unconditional Accepted require an owned resolution/contact action. Unavailable has no signer. |
| Handover | Proposed → ReadyForReview → Accepted / Returned; cancellation before effect | Exact accepted scope; reservations/dispute hold conversion until a revised unambiguous offer is accepted or an expressly authorised disposition exists. Receiving owner independently decides. |
| External attempt | Prepared → Submitted → Confirmed / OutcomeUnknown / FailedNoEffect / PartiallyConfirmed | Reconcile unknown/partial outcomes before retry; never map timeout to failure/no effect. |

PR conservative locks: Draft edits the current draft; it does not create arbitrary parallel versions. Submitted or approved commercial content is immutable. A returned/rejected/withdrawn outcome permits an explicit successor with reason. Pending approval, awaiting customer response, acceptance without resolved handover, or conversion in progress/unknown blocks competing commercial commitment within the exclusive pursuit. Read failures or unrecognised state hold the action. Changing option default never bypasses locks.

DG has broad opportunity-wide branching restrictions, including draft quotes (guide pp89–90). Their exact adoption remains D-009/D-010. E1 supports one option and draft successors only, avoiding unsupported multi-option lock policy. Later changes must resolve the full matrix explicitly, including concurrent branch/approval/issue/conversion commands.

## 7. Cost, price and total controls

DG: cost is the purchase basis; margin is `(sell − cost) / sell`; markup is `(sell − cost) / cost`. They are not interchangeable. Extended quote net is quantity × unit price × (1 − discount). Zero denominators display Not applicable; unknown input displays Unknown, never zero.

PR: use decimal arithmetic in authoritative calculations and canonical decimal strings in commands; browser previews are advisory. Store precision, rounding mode/order, currency, FX direction/effective date and policy version with each snapshot. Sum authoritative rounded line values under the selected policy; do not average line percentages. Display cost/sell/margin separately, with currency and tax basis next to totals.

| Control | Design contract |
|---|---|
| Cost provenance | Catalogue, supplier quote, manual allowance, labour rate, freight, subcontract and other permitted categories need source/effective date. Missing basis prevents approval; drafting can retain an owned unknown. |
| Landed costs | Explicit source currency → estimate currency rate direction, unit/line/shipment freight/duty basis and allocation. Never add the same freight as both landed cost and a standalone cost line. D-009 must confirm operational formulas. |
| Pricing thresholds | Preserve the guide's distinct below-cost save block, below-minimum approval requirement and below-target advisory. Exact minima, overrides, role precedence and thresholds are UQ; do not substitute demonstration numbers for policy. |
| Refresh | Show old/new cost, FX/policy revision, affected lines, totals and approval consequences. Commit only a deliberate new draft/revision. No hidden repricing of saved, submitted, issued or accepted content. |
| Staged editing | Working proposals and last accepted totals displayed separately. Validate batch before atomic commit where practicable. If a later derived-total process fails, retain committed lines, mark totals Stale and repair totals without resaving lines. |
| Quote inclusion | Only included quote lines count. An excluded item may be described as an excluded option, but cannot be printed as included scope. Exclusion does not erase historical cost/estimate evidence. |
| Print/annex | A priced item may be hidden and rolled into a clearly labelled section/group amount. Sum visible commercial amounts back to the full included total. Never leak hidden descriptions through metadata/HTML/annex when not selected. |
| Discounts | Configuration/bulk discount replaces included member discounts; excluded members unchanged. It does not compound. Customer zero-priced quote lines and 100% discount are distinct from the estimate below-cost rule and require the applicable quote review. |
| Partial information | Unknown quantity, cost, currency, tax or allocation is not silently normalised. Show known subtotal plus explicit incompleteness during drafting; do not claim a verified final amount. |
| Terms and dates | Validity, lead time and payment terms need their own source/revision. A zero-day lead differs from unknown; expiry creates review, not automatic acceptance or deletion. |

The [synthetic calculation fixtures](../testing/estimating-calculation-fixtures.json) explicitly choose a demonstration arithmetic convention. They test the proposal, not CREMS parity, approved pricing, operational GST treatment or AT-04 acceptance.

## 8. Questionnaire and configuration contracts

Retain immutable published question definitions, answer states and scope filters. Re-snapshot compares exact old/new definitions before writing: removed answers remain in audit; new questions start unanswered; incompatible types or units block pending resolution; compatible values preserve original attribution. Hidden answers remain historical and do not automatically satisfy new mandatory conditions. Scope changes invalidate dependent readiness; they cannot silently erase answer evidence.

Do not build a Screen Systems formula engine from the guide. Obtain definitions, ranges, units, variants, rounding, parts mappings and accepted intermediate/final examples. Diagnostics distinguish blocking errors, warnings and overridden values. No-purchase parts may still be priced according to documented rules; procurement semantics do not determine quotation inclusion.

Apply must preserve run/source/line identities and record compound outcomes. On rerun show added/changed/removed/unmatched lines and manual edits before commitment. Cancel has no effect. Incompatible mappings preserve the original and require review. Recipe Refetch Latest Version never substitutes for wizard mathematics. Durable server drafts are a proposed improvement over the guide's device-local limitation; offline estimating is deferred, not borrowed from P08's field queue.

## 9. Permissions and shared-platform integration

The inspected main `c3ac9b2a` contains P09 and merged CRM I1 (#40). Inspection proves publication/content, not owner acceptance or every merged-main runtime result. Re-read current publication evidence before building. Physical sources: [CRM context](../../src/crm/context.ts), [opportunity reads](../../src/crm/reads.ts), [Activities](../../src/activities/activities.ts), [permissions](../../src/platform/permissions.ts), [operations](../../src/platform/operations.ts), [receipt dispatch](../../src/shared/receipts.ts), [document contract](../contracts/document-issue-distribution.md), BP-02 and ADR-0003/0014/0015.

Proposed capabilities below are not present grants. Capability AND current workspace/company/site scope AND all related-record visibility are required. Ownership or a role label never grants access by itself.

| Actor/capability | Permitted action | Refusal boundary |
|---|---|---|
| Sales requester: estimating.request | Submit/clarify an owned request and see permitted customer-safe progress | No internal costs, margins, supplier allowances or approval by implication. |
| Estimator: estimating.read + estimating.edit | View/edit cost basis and scoped drafts; create exact successors | Must also read opportunity and referenced scope; submitted/approved/issued content locked. |
| Commercial reviewer: estimating.approve | Approve/return exact estimate snapshot under explicit policy | Editing, assignment or system administration does not imply approval. Self-approval policy unresolved. |
| Quote author/reviewer/issuer: quotation.edit / quotation.approve / quotation.issue | Separate authoring, approval and controlled issue actions | Each action checks exact source and authority; no issuance with unresolved output/storage/review. |
| Quote response recorder: quotation.respond | Record stated response to a specific presentation | Cannot edit the issue, invent a signer or convert reservations to unconditional acceptance. |
| Integration operator: estimating.convert | Prepare/reconcile permitted handover targets | Requires actual connection/destination/write authority, exact accepted revision and receiving decision. |
| Finance/Engineering/Service | Read explicitly granted relevant projections, decide their own handovers | No global commercial-data access through a related report, Activity, document or receipt. |

E1 should add only its needed scoped capabilities. Internal costing needs a dedicated Estimating permission; existing shared.internal.read alone is insufficient. Keep customer-safe quotation data separate from cost-bearing DTOs even for an authorised estimator preview. Derive recipients from permitted people/company context. Tests must include API/detail/search/aggregate/export/file/metadata/receipt access, revocation and all-target Activity visibility.

Reuse `sharedOperation` and typed business identities. Add Estimate/Quote identity and receipt dispatch only under an additive migration, without rewriting accepted P01–P09/CRM operation hashes. Existing Activity supports Opportunity but not Estimate/Quote; use a readable Opportunity action for E1 or explicitly extend the typed target with company/visibility/FK checks. Never hide arbitrary estimating UUIDs in an unvalidated generic link.

Proposed command families: CreateEstimatingRequest, Accept/ReturnRequest, CreateEstimate, SaveDraftBatch, CreateSuccessor, PrepareDraftQuote; later Submit/ReviewEstimate, Submit/ReviewQuote, RequestQuoteIssue, RecordQuoteResponse, Prepare/AcceptHandover and ReconcileConversion. Every command has original `operation_id`, schema version, expected aggregate/source versions and reason. Server actor/scope are never trusted from the body. Atomic receipt/audit/outbox writes accompany domain changes; reads filter under current authority before returning old receipts.

On version conflict retain the authorised proposal and compare current content; do not overwrite. On lost response reconcile the original operation before retrying the original payload. A different proposal gets a new operation only after the original outcome is resolved. Permission loss clears sensitive page state; it must not export a recovery bundle that defeats revoked access.

## 10. Quotation output and customer response

Use OUT-02/03 for restricted internal estimate outputs, OUT-04/05 for scoped questionnaires, OUT-06 for customer quotations and OUT-07 for selected configuration annexes. OUT-01 indicative proposals remain separately labelled. OUT-08 technical transmittals remain Engineering's domain.

OUT-06 content: fictional/verified recipient context, opportunity/option/estimate/quote identifiers, exact issue revision/date, scope/deliverables, included commercial lines or clear group totals, currency/tax basis, exclusions, assumptions, validity, lead times, approved terms and neutral response context. Terms templates/contact blocks require actual evidence; the mockup supplies no operative legal clauses or customer-distribution controls.

Authorised render snapshots whitelist customer fields. Never send internal cost/margin to a customer browser and merely hide them with CSS. Remove supplier allowances, private review notes, employee-only files, internal fields and sensitive metadata from HTML/PDF/annex/manifests. Render A4 with repeated table headings, continuation identity and page numbers; long descriptions remain legible. Supplied logo and Roboto/Verdana follow the [shared UI specification](../standards/ui-style-specification.md).

Reuse the existing durable render/storage/finalisation pattern, but extend it explicitly for Quote rather than reusing ServiceReport semantics or IDs. Store source/template/output hashes and exact bytes. Recheck authority and source currency at issue. If storage succeeds and finalisation fails, reconcile the original attempt. Changed content creates a successor; downloading does not send, delivery does not acknowledge and a name/signature is stated evidence rather than independently verified identity.

PR customer responses are content-bound. Reservations, decline, dispute and unavailable responses carry reason, owner and next action/due or due-needed. Partial acceptance requires an unambiguous reviewed scope/price disposition, usually a revised offer, before conversion. A changed quote never inherits a prior signature. Customer acceptance, sales Won, receiving-domain acceptance and ERP confirmation remain separate facts.

## 11. MYOB handover and recovery

IF-01 covers customer/contact/location identity; IF-02 item/price/stock and item resolution; IF-03 commercial opportunity/quote/order/project conversion. The guide's introductory “three write moments” is simplified: detailed master-data and item creation/reactivation actions are additional writes. Inventory each operation separately. No endpoint, tenant, module licence, payload or target numbering is established by this package.

The future handover contains exact accepted quote/issue/scope, resolved company/customer/site/contact/item keys, units, included quantities/prices/currency/tax basis, delivery constraints and receiving owner. Validate prerequisites and hash canonical input before dispatch. Persist per-target correlation and outcome; unique operation/target constraints protect retries. One-off resolution must distinguish existing item binding, created-but-not-synchronised, reactivation, clarification and no-effect failure.

If any response is lost, record OutcomeUnknown and query supported target/correlation evidence; do not mint another item/order. Partially confirmed targets remain confirmed while unresolved siblings are reconciled. Recover existing targets without repeating financial effects. A compensation, cancellation or credit is a new authorised business action, never deletion of original evidence. Simulated adapters must expose these same distinctions without making live calls.

## 12. Traceability and completion

| Parent | Detailed coverage | Proposed increment / acceptance |
|---|---|---|
| EST-01 | Routing/request inheritance; sections 3–4/6 | E1 bounded manual context; E2 routing; EA-02/03, AT-26 |
| EST-02 | Scope/questions/definitions; sections 4–5/8 | E1 text scope; E2 questionnaires; EA-04/15, AT-27/36 |
| EST-03 | Options, estimation revisions, estimate versions, quote issues; sections 5–6 | E1 single-option versions; E2 alternatives; EA-03/09/12, AT-03/26 |
| EST-04 | Cost categories, landed inputs, staged totals; section 7 | E1 manual AUD; E3 sourcing/landed costs; EA-05/06/07, AT-04/26 |
| EST-05 | Pricing, discount, precision, refresh; section 7 | E1 declared arithmetic; E3 policy; EA-05/08/10, AT-04/26 |
| EST-06 | Versioned specialist configuration and rerun; section 8 | E5 after formula evidence; EA-16/17, AT-04/28 |
| EST-07 | Separate current-authority approvals/locks; sections 6/9 | E3/E4; EA-01/09, AT-01/26 |
| EST-08 | Exact quote output/issue/response/handover; sections 10–11 | E1 draft only; E4 issue; E6 conversion; EA-10/11/12/13/14, AT-05/26/36 |
| EST-09 | One-off identity and unknown-outcome reconciliation; section 11 | E6; EA-13/14, AT-05 |

All EA/AT implementation procedures remain Not run/Planned. The calculation oracle and visual preview checks are design verification only. Business approval, source parity, whole-domain completion and operational readiness are separate. D-009/D-010 and issue #10 remain open pending the evidence/acceptance in the [gap register](estimating-evidence.md#4-open-evidence-and-decisions).

## E2 design continuation — 9 September 2026

The [E2 decision package](../decisions/estimating-e2-rules.md), [detailed design](estimating-e2-design.md) and [receiving contract](../contracts/estimating-e2-design.md) now make the synthetic G02/G03/G04 choices reviewable. These candidate rules deliberately require known service prepayment and permit Draft-only alternatives, with their differences from the guide recorded explicitly. Policy adoption and runtime implementation remain pending. The original general BP-04 proposal and source dispositions above remain historical context; E1 actual delivery is governed by its handover/publication.
