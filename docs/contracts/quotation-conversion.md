# Synthetic quotation receiving and conversion contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. ES-07 / PPO-010 / BP-04 EST-03/08 / OUT-06 / AT-26; native Supply SC-01 target. [Decision](../decisions/quotation-conversion-native.md), [handover](../delivery/quotation-conversion-handover.md). Synthetic implementation decisions do not establish operational policy or owner acceptance.

## Exact boundary and commands

GET `/api/v1/estimating/quotes/[id]/conversion` reads one exact issued quotation revision, ES-06 preparation and response, immutable receiving/resolution/plan history, current selective applicability and actual native target lineage. `[id]` is the revision UUID. No latest-offer substitution. Unknown query fields are refused; evidence is no-store. One whole manual option remains the acceptance boundary.

POST commands under that path carry `operation_id`, `schema_version: 1`, `reason`, `evidence`, `synthetic_only: true`, exact `issue_id`, `output_hash`, `preparation_id`, `response_id`, and `expected_sequence`. Reasons are 1–1,000 characters; evidence 1–4,000. Unknown fields are refused. Actor and time come from the authenticated server.

| Path | Additional fields and effects |
|---|---|
| `/receive` | `predecessor_id`, `decision: Received/Held/Returned`, active scoped `owner_id`, `due_date`, `next_action`. Appends an attributable receiving decision; correction names the prior decision. Held/Returned can retain incomplete or no-longer-applicable original evidence with an owned reason. |
| `/resolve` | `predecessor_id`, exact included Product `line_id`, `state: Missing/Ambiguous/Obsolete/Incompatible/OneOff`, `label`, exact `unit`, `company_id`, `entity: SupplyDemand`. Retains one stable internal item UUID per source line through corrections. External mapping is explicitly null/Not configured. No operational master record is created. |
| `/plan` | `predecessor_id`, reviewed current `basis_hash`, `decision: Reviewed`. Freezes source versions, all included lines/commercial snapshot, exact receiving/issue/response/output, resolved item identities, native company/entity/customer/site, quantities/units, and normalised native create commands with preallocated target/operation UUIDs. Creates no target. |
| `/execute` | Exact `plan_id`, `plan_hash`. Creates all frozen native Demand records, original native receipts and line-to-target links atomically with the conversion event. |

Preparation, any actual sending fact, receiving, review and conversion remain distinct. No sending event is inferred. Receiving and Reviewed mean bounded synthetic coordination, not verified respondent authority, signature, commercial approval or authority to begin work. Authority, signing, validity/expiry and withdrawal remain visibly Not configured.

## Source and target scope

Every included Product line requires explicit compatible resolution and becomes exactly one native Supply Demand of Forecast class. The existing Supply command supports a free-form item reference: `SYN-ONEOFF-<internal UUID>` is separate from its display label. The existing ExternalSourceKey identifies the actual synthetic target as provider Synthetic, configuration PPO-Native, exact company UUID, entity SupplyDemand and target UUID. It is not an ERP item mapping.

Quantities must satisfy the existing exact Supply precision/positive-range contract, and units must match source exactly within its 30-character limit. No truncation, unit conversion, guessed latest catalogue item or substitute master is allowed. Missing, ambiguous, obsolete or incompatible mappings visibly hold review. All accepted Labour, Freight, Engineering and Subcontract lines remain frozen commercial evidence without a material-demand effect. Commercial acceptance is never partial; target projection is deliberately narrower. Original unit sell, quantities and authoritative safe snapshot remain unchanged; Demand introduces no monetary calculation, tax, FX, price or rounding policy.

The target uses the original company/customer/site and current site timezone. Operational required date, material/technical release and work authority remain explicitly unestablished. Existing Supply ownership, identity, revision, audit and command contracts apply. Projects, Service work orders, ERP sales/purchase orders, stock and invoices are outside this first target contract. MYOB remains ERP authority; SharePoint business-document authority; CAD native authoring authority.

## Applicability, concurrency and original recovery

Current unconditioned reported acceptance and applicable ES-06 preparation are required for Received, resolutions, plans and execution. Unresolved clarification, conditions, material negotiation, successor issue or a changed response holds affected unexecuted plans. Receiving corrections, changed line resolutions, owner availability and changed target timezone also hold the affected plan. An unissued estimate revision or unrelated distribution/source observation does not transfer or invalidate immutable offered content indiscriminately. Acceptance never transfers to a successor offer.

A replacement plan names and retains its predecessor. Completed target records and their original revision/receipt remain even after later source correction or downstream edits; changed applicability/content is exposed. Replacement conversion remains refused anywhere on the same quotation aggregate, including a successor revision. The bounded disposition contract below resolves exact completed-target exceptions without creating replacement targets.

Existing workspace locking, actor-bound operation hashes, current sequence and immutable SQL evidence guards apply. Repeated original commands return original results. Changed content under the same operation conflicts. Durable uniqueness permits one execution per quotation and one target per source line. Target links must belong to their exact original atomic execution. All target effects commit together; injected failure rolls back records, identities, revisions, links, audit and receipts. Partial execution is not used as partial commercial acceptance.

The same-tab actor-bound journal keeps uncertain originals across reload. Missing receipt or failed lookup is inconclusive; replacement actions stay blocked. Recover original result or retry exact original. The old receipt can recover even if output storage later fails, after current authorisation; new consequential commands verify the original output. Browser history exposes all earlier receiving corrections and plan replacements.

## Permission and durable evidence boundary

Every read, command, history, evidence/target link and original receipt recovery rechecks current workspace, company/site, source/recipient/CRM/estimate/quotation access. New commands and original conversion recovery require the existing `supply.coordinate` duty. Native target access additionally requires its original source quotation access; current target restrictions also apply. Revoked source or coordination authority cannot use an old receipt as a bypass. No new capability, seed, grant or user is introduced.

Migration 0061 adds only immutable subordinate conversion events and target lineage, extends the existing outbox kind and leaves issued evidence and business identity types unchanged. Scoped foreign keys and deferred evidence constraints require original audit/receipts and all native target effects in one transaction. Existing migration/seed ordering, exact upgrade expectations and hosted gate are updated without changing reserved allocations or retained proof databases.

## Evidence and remaining policy

See the [execution ledger](../testing/evidence/quotation-conversion/README.md) for actual local/CI results and exact limitations. Retained HTML/companion reports describe broader proposals and do not demonstrate native runtime. No external communication, customer login/signing, live ERP endpoint, operational item governance or work-release rule is invented. Owner, paired visual, device and screen-reader acceptance remain separate.

## Completed-target disposition follow-up

[SYN-ES07-02 architecture decision](../decisions/quotation-disposition-native.md), [follow-up execution ledger](../testing/evidence/quotation-disposition/README.md). Migration 0062 adds immutable subordinate `quote_disposition_events`; no grants, users, seeds, new identities or old evidence changes. Existing Supply positive six-place quantity semantics apply. Read results expose every original target's status, exact original/current evidence, dependencies and independently applicable review. A successor revision links back to the original conversion page; it cannot inherit acceptance or execute again.

POST `/conversion/disposition-review` uses the existing schema-1 operation envelope with `reason`, `evidence`, explicit `synthetic_only: true`, `target_id`, `execution_id`, target-specific `expected_sequence`, nullable latest review `predecessor_id`, observed `basis_hash`, `decision`, `quantity`, scoped active `owner_id`, `due_date` and `next_action`. Decisions are **Retain**, **ReviseQuantity** or **Hold**. Quantity must be null except for ReviseQuantity, which requires a changed, exact positive quantity. Actor and time are server-owned. Unknown fields/actions are refused. A review stores all evidence and the exact proposed native command, with a canonical review hash. A note, Hold or unexecuted review never clears an exception.

POST `/conversion/disposition-apply` requires the same envelope, exact `review_id` and `review_hash`. It rechecks the target sequence, exact exception basis and current authority. Retain creates an immutable explicit resolution without changing the target. ReviseQuantity uses `Supply:Revise` in the same transaction, preserving all native guards, revisions, receipts and automatic owned MaterialAction/Impact evidence. The only changed business field is quantity. Hold cannot be applied; its owner must complete follow-up and record a replacement review. Replacing a review retains its predecessor and all earlier effects.

The exact basis binds the completed execution, original plan/hash, issue/output, source line, original response/preparation/receiving/resolution, current issue/response/preparation/receiving, that line's mapping, unresolved response evidence, site timezone, target version/snapshot and downstream dependencies. Positive allocations, return/custody children and consequential purchasing/reservation/fulfilment/unknown-outcome facts hold quantity revision; Approved demand requires its owning Supply workflow. Existing Assessment/Impact evidence does not alone prohibit revision. Retain can acknowledge the exact existing state but does not approve it or resolve separate Supply holds. Changes to a sibling mapping/target, unrelated Supply record or unissued estimate do not invalidate this target's action.

Each applied decision resolves only the exact resulting basis. Later relevant source, target or dependency changes reopen the exception. A replacement review or Hold also makes further resolution explicit. The original execution stays completed, its source/target links and version-1 receipt remain immutable, and the quotation execution uniqueness rule is unchanged. Zeroing demand, cancellation, deletion, replacement creation, unit conversion, approval, procurement, other aggregates and ERP writes are unsupported.

Review/application and original recovery recheck current workspace/company/site/source and native record authority; the existing `supply.coordinate` duty is required for commands and original receipts. Frozen dependency records require current access before their history is disclosed. Changed owner eligibility holds an unexecuted review. The actor-bound same-tab journal is shared with receiving/conversion, so an unknown original blocks replacement actions through reload. Missing lookup is inconclusive. Recover or retry the exact original operation; changed content conflicts. Database effects, receipts, histories, impact and disposition commit atomically, and one application per review prevents duplicate effects. Retried accepted commands return original results even after later exceptions; current authorisation still precedes disclosure.

A native operation frozen into a disposition review is reserved for that exact Apply action. Calling the ordinary Supply revision endpoint with that reserved operation before Apply is refused; after Apply, exact original replay recovers its native receipt under current source and target authority.

## Owned completed-conversion Supply follow-up — 4 October 2026

The [SYN-ES07-03 contract](quotation-supply-followup.md) implements attributable referral, named-owner acceptance/return/hold, immutable shared-allocation review and separately applied native outcomes. It reuses the existing quantity-only `Supply:Allocate` transition on already Approved demand, retaining allocation identity and Incoming/Usable basis, including native zero. No demand class, ERP reservation, supplier commitment or stock movement changes. Returned evidence requires explicit new ES-07 disposition; Activities and Supply outcomes do not automatically clear quotation exceptions. Prior evidence and operational holds remain. The contract and execution ledger distinguish implementation from acceptance and deployment.
