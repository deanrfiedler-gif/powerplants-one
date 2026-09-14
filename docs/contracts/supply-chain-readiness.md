---
document_id: PPO-013-READINESS
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Candidate synthetic readiness contract; no Supply Chain runtime or ERP mapping
source_commit: 3a27728c2c41e366a4863683fac748cd0d1da910
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
