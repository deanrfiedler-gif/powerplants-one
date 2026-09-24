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

Receipt: inspected ≤ received; usable + quarantined ≤ inspected; damaged ≤ quarantined. Receipt sums cannot exceed the stated line. Damage is a property of quarantined units, not another quantity to subtract. Unknown/partial source state is not zero. Prepared dispatch is distinct from physical Moved evidence and from source shipment observation. Pick ≥ staged ≥ physically moved ≥ delivered; outstanding is demand less current physical delivery. Excess is held for review, outside fulfilled demand.

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
