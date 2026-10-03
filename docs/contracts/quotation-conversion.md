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

A replacement plan names and retains its predecessor. Completed target records and their original revision/receipt remain even after later source correction or downstream edits; changed applicability/content is exposed. This increment refuses replacement execution anywhere on the same quotation aggregate, including a successor revision. Deliberate disposition of completed facts is a future contract, not automatic cancellation or replacement.

Existing workspace locking, actor-bound operation hashes, current sequence and immutable SQL evidence guards apply. Repeated original commands return original results. Changed content under the same operation conflicts. Durable uniqueness permits one execution per quotation and one target per source line. Target links must belong to their exact original atomic execution. All target effects commit together; injected failure rolls back records, identities, revisions, links, audit and receipts. Partial execution is not used as partial commercial acceptance.

The same-tab actor-bound journal keeps uncertain originals across reload. Missing receipt or failed lookup is inconclusive; replacement actions stay blocked. Recover original result or retry exact original. The old receipt can recover even if output storage later fails, after current authorisation; new consequential commands verify the original output. Browser history exposes all earlier receiving corrections and plan replacements.

## Permission and durable evidence boundary

Every read, command, history, evidence/target link and original receipt recovery rechecks current workspace, company/site, source/recipient/CRM/estimate/quotation access. New commands and original conversion recovery require the existing `supply.coordinate` duty. Native target access additionally requires its original source quotation access; current target restrictions also apply. Revoked source or coordination authority cannot use an old receipt as a bypass. No new capability, seed, grant or user is introduced.

Migration 0061 adds only immutable subordinate conversion events and target lineage, extends the existing outbox kind and leaves issued evidence and business identity types unchanged. Scoped foreign keys and deferred evidence constraints require original audit/receipts and all native target effects in one transaction. Existing migration/seed ordering, exact upgrade expectations and hosted gate are updated without changing reserved allocations or retained proof databases.

## Evidence and remaining policy

See the [execution ledger](../testing/evidence/quotation-conversion/README.md) for actual local/CI results and exact limitations. Retained HTML/companion reports describe broader proposals and do not demonstrate native runtime. No external communication, customer login/signing, live ERP endpoint, operational item governance or work-release rule is invented. Owner, paired visual, device and screen-reader acceptance remain separate.
