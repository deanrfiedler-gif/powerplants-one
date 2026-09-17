---
document_id: PPO-UI-SC05-07-FULFILMENT
title: Order Fulfilment & Customer Delivery workspace — detailed design report
revision: r01
date: 2026-09-16
owner: Dean Fiedler — prototype owner
status: Proposed standalone design. No owner acceptance, no application integration, no connected ERP.
scope: SC-05 Stock availability and reservations · SC-06 Picking and dispatch preparation · SC-07 Customer delivery and proof of delivery
design_html: PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html
---

# Order Fulfilment & Customer Delivery — r01

**Interactive design:** [`PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html`](PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html)
**Sources:** [`docs/design/order-fulfilment/`](../../../design/order-fulfilment/README.md)
**Receiving handover:** [`docs/decisions/order-fulfilment-delivery-design.md`](../../../decisions/order-fulfilment-delivery-design.md)
**Integration requirements:** [`docs/contracts/order-fulfilment-integration.md`](../../../contracts/order-fulfilment-integration.md)
**Verification evidence:** [`docs/testing/evidence/order-fulfilment-r01/`](../../../testing/evidence/order-fulfilment-r01/README.md)

Every record, quantity, reference, person and outcome in this design is synthetic. No MYOB Acumatica endpoint, status code, field mapping or transaction semantic is invented or asserted as verified. Nothing here establishes a live integration, an operational dispatch, a customer communication or a deployment.

---

## 1. Purpose, scope and SC-05–SC-07 mapping

### 1.1 The question the workspace answers

> **What can we supply, what is ready to dispatch, what has reached the customer, and what remains outstanding?**

The four clauses map onto the workspace's evidence layers, and the design keeps them apart because conflating them is how a fulfilment view starts lying:

| Clause | Evidence layer | Where it is answered |
|---|---|---|
| What can we supply | Receipt and inspection evidence, net of confirmed reservations | Stock & reservations |
| What is ready to dispatch | Reservation, pick, staging and readiness checks | Picking & dispatch |
| What has reached the customer | Recorded physical receipt at a named receiving point | Delivery & evidence |
| What remains outstanding | Ordered less recorded received, in the line's own unit | Fulfilment register, every view |

### 1.2 Scope identifiers

The design covers three page scopes from the [HTML page coverage register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html). These are **page register IDs**, not parent requirement IDs. The parent scope is **SCM-07** in [BP-01](../../../blueprints/BP-01-master-blueprint.md), carried through the candidate contract [PPO-013-READINESS](../../../contracts/supply-chain-readiness.md). All 78 parent requirement IDs are preserved and none is renamed, merged or retired here.

| Page scope | Register text | Delivered in this design |
|---|---|---|
| **SC-05** Stock availability and reservations | Company/warehouse/bin/item/unit, on hand, available, reserved and quarantined states with source time; review competing demand and external confirmation of reservation | Stock & reservations view; reservation lifecycle with confirmed, failed and unknown outcomes; competing-demand panel; derivation calculation |
| **SC-06** Picking and dispatch preparation | Job-linked pick lists, picked versus staged stock, substitutions requiring approval, packing, serial/batch evidence where relevant and dispatch confirmation | Picking & dispatch view; pick and stage as separate observations; findings and their review; substitution proposal and review; dispatch preparation, document issue, physical movement and source shipment outcome |
| **SC-07** Customer delivery and proof of delivery | Delivery lines, partial delivery, contact arrangements, evidence, exceptions and outstanding quantities; carrier arrival and customer acceptance remain distinct; separate the site delivery address and receiving point from the intended installation or use area | Delivery & evidence view; delivery capture with outcomes, findings, evidence references, acknowledgement and corrections |

**Proposed workspace title.** *Order Fulfilment & Customer Delivery* is a grouping label for SC-05–SC-07. It replaces no existing scope identifier. SC-08 (returns, supplier claims and credit) and SC-09 (material change-impact review) are **not** rebuilt here; they are linked to.

### 1.3 What is out of this increment

Live ERP transactions; customer communications; operational dispatch; deployment; a competing inventory ledger; SC-08 returns and credit decisions; SC-09 as a separate workspace; scheduling, technical release and installation, which remain in Service Operations and Projects & Commercial Delivery; and any production offline queue, which would need its own bounded design and verification.

---

## 2. Authority chain and first delivery scope

### 2.1 Eleven distinct facts

The workspace treats each of the following as a separate record with its own time, actor and evidence. None implies the next.

| # | Fact | Held by | Represented here as |
|---|---|---|---|
| 1 | Customer quotation acceptance | Estimating & Quotation | `handover.basis` text, dated |
| 2 | Opportunity marked Won | CRM | `handover.opportunity`, dated |
| 3 | ERP order creation | MYOB Acumatica (source) | `erpOrder`, `sourceLine` |
| 4 | Internal receiving responsibility | CRM handover (CR-03) | `handover.ref`, `handover.receivingOwner`, `acceptedAt` |
| 5 | Stock availability | Warehouse source observation | Availability observation with `observedAt` and `completeness` |
| 6 | Reservation | Source allocation | Reservation with `state` and `sourceRef` |
| 7 | Picking and staging | Warehouse, physical | `picks[].picked`, `picks[].staged` — two observations |
| 8 | Dispatch | Warehouse, physical | `dispatches[].movementAt`, separate from `dispatches[].erp` |
| 9 | Physical delivery | Field capture | `deliveries[].lines[].received` at a named `receivingPoint` |
| 10 | Customer acknowledgement of delivery | Customer | `deliveries[].acknowledgement`, scoped to that delivery |
| 11 | Installation or service completion | Service / Projects | **Not represented.** Linked out only |
| 12 | Invoicing and payment | Finance / ERP | **Not represented.** Linked out only |

The order drawer states the chain in plain words, for example:

> Quotation accepted 10 September 2026; opportunity marked Won 10 September 2026; ERP order created 11 September 2026.

and carries the standing note: *"Customer acceptance of a quotation, an opportunity marked Won, creation of an ERP order and internal receiving responsibility are four distinct records. None of them is stock availability, a reservation, a dispatch, a delivery or an invoice."*

### 2.2 Source authority

MYOB Acumatica remains the intended authority for ERP orders, inventory and related account information, subject to verified configuration and mappings. PPO **presents authoritative observations and coordinates owned work**; it does not keep a competing inventory ledger.

Concretely, in this design PPO owns: the fulfilment coordination record, reservation *requests* and their observed outcomes, pick and staging observations, dispatch preparation, physical movement records, delivery evidence, acknowledgements, corrections, exceptions, commitments and follow-ups. PPO does **not** own: on-hand quantity, the source's available figure, the source allocation, the source shipment transaction, the invoice or the payment.

### 2.3 First delivery scope

One complete **parts-only sales-order journey**: `SYN-PPO-FUL-000001` for Northbank Nursery, ten toplights, delivered in two shipments with an owned shortage in between. Project and Service demand links are preserved on their lines (`SYN-PPO-PRJ-000031`, `SYN-PPO-WO-000245`) and carry an explicit note that technical release, installation and scheduling stay in those modules.

---

## 3. Structure, presentation and reused components

### 3.1 Five connected views

| View | Scope | Pattern |
|---|---|---|
| Fulfilment register | SC-05 · SC-06 · SC-07 | r20 Register / worklist: snapshot cards, worklist chips, filter panel, fixed-layout table, docked selection card |
| Stock & reservations | SC-05 | r20 Register / worklist with a docked detail column |
| Picking & dispatch | SC-06 | r20 Detail workspace: step flow, focused cards, readiness checklist |
| Delivery & evidence | SC-07 | r20 Detail workspace: evidence records with retained predecessors |
| Exceptions & follow-through | SC-05 · SC-06 · SC-07 | r20 Register / worklist with a docked commitments and follow-up column |

### 3.2 Reused components and their provenance

| Element | Source | How it is reused |
|---|---|---|
| Colour, type, spacing, control and focus tokens | Theme board **r20**, `powerplants-one-theme-style-board-r20.html`, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617` | Base stylesheet derived from the My Work r01 scoped token block, rescoped to `#ppo-fulfilment` |
| Roboto faces | Verified r20 board faces, `fonts.css` SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef` | Copied byte-identically; the same file is used by My Work r01, Quality r01 and Maintenance r01 |
| Workspace header, demo strip, context card, tabs, filter panel, snapshot cards, table, badges, drawer, toast, page guide | My Work & Action Centre r01 | Same markup structure and class names |
| Source model, command, receipt and recovery pattern | My Work r01 / Quality r01 model pattern | Same pure model with `seed`, `validate`, `command(state, cmd, role, company)` and idempotent receipts |
| Build assembly | `scripts/build-my-work.py` pattern | `scripts/build-order-fulfilment.py` |
| Synthetic catalogue items and units | Products catalogue r04 fixture | `SYN-PPO-PRD-0001/0003/0004/0006/0007/0008/0009/0013` with their declared units |
| Customer, site, contact and receiving-point identities | Customers, Sites & Growing Areas r03; My Work r01 fixture | `SYN-PPO-ORG-000201`, `SYN-PPO-SIT-000301`, Casey Taylor, "hardstand beside Pack Room 01"; Northbank Nursery, Greenhaven Berries, Cedar Vale Growers |
| Receipt, inspection and quarantine evidence | Supply Chain Material Readiness **r03** (latest; no r04 exists) | Receipt lines cited as `SYN-PPO-RCT-…` with inspection outcomes; not re-captured here |
| Exception and follow-up surfacing | My Work & Action Centre r01 Activities pattern | Follow-ups declare surface "Activities and My Work" |

No second application shell and no left navigation rail are introduced. The design is a module-only workspace intended to sit inside the existing shell.

### 3.3 Presentation rules applied

Australian English throughout; navy `#242a37` and green `#62bb46` from r20; Roboto with Verdana fallback; dates as **dd Month yyyy** in prose and **ISO 8601** in filenames and machine fields; money in **AUD with GST shown separately** (line values are labelled *excluding GST*; no tax is calculated). Times display with their IANA timezone; the New Zealand company uses `Pacific/Auckland` and the Australian company `Australia/Melbourne`.

---

## 4. Fulfilment register

### 4.1 Field groups per row

| Group | Fields |
|---|---|
| Source and identity | PPO fulfilment reference, source order reference, ERP account, customer purchase-order reference (or "Not supplied"), company/entity and its ERP company key |
| Customer and location | Organisation name and reference, delivery site name and reference, delivery address, receiving point, intended use area |
| Handover | Accepted handover reference, originating opportunity, receiving owner, acceptance time, commercial basis |
| Dates | Requested date, confirmed commitment, current expected date — **three separate values**, each with its own version |
| Progress | Received, in transit, reserved-not-dispatched and outstanding, as a proportional bar plus an explicit legend |
| Outstanding | Per line, with its unit |
| Condition and blockers | Coordination condition plus the first blocker and a count of the rest |
| Accountability | Responsible owner; next action reached through the order drawer |
| Source quality | Observation time and `Complete` / `Partial` / `Unavailable` |

### 4.2 Filters and worklists

Filters: free-text search (order, account, purchase order, customer, site, item code, item name, source line, handover), customer, delivery site, owner, warehouse, expected-date state.

Worklists: **All orders, Awaiting stock, Ready for picking, In preparation, Dispatched, Partially delivered, Needs follow-up.**

A standing note appears above the chips:

> These are PPO coordination views. Awaiting stock, Ready for picking, In preparation, Dispatched, Partially delivered and Needs follow-up are computed from the evidence held here. No equivalence to a MYOB Acumatica order status has been verified, and the source order state is not read by this design.

Their computation, in order of precedence:

1. every line outstanding = 0 → **Completed**
2. an unresolved exception exists → **Needs follow-up**
3. some line has received > 0 and some line outstanding > 0 → **Partially delivered**
4. some line in transit > 0 → **Dispatched**
5. a dispatch exists without a recorded movement → **In preparation**
6. every line fully reserved → **Ready for picking**
7. otherwise → **Awaiting stock**

### 4.3 Snapshot cards and filter context

Four cards: Awaiting stock, Ready for picking, In transit (in preparation plus dispatched), Needs follow-up (open exception plus partially delivered). Each card sets the matching worklist filter, so it opens the exact contributing rows rather than a similar list. The previous filter set is stored and offered back as **"Return to the previous filters"**, so a snapshot or a detail excursion never loses the coordinator's place.

When results are unavailable the cards render an em dash, never zero, under the heading *"Order source unavailable — counts and quantities cannot be shown. This does not mean there is nothing outstanding."*

### 4.4 Source links

Every order drawer links to Customer 360, the accepted handover, Material Readiness (SC-01–SC-04) and the Products catalogue. Line-level demand links open Projects delivery readiness or Work Orders.

---

## 5. Stock availability & reservations — SC-05

### 5.1 Observation record

Each observation is identified by warehouse, bin, item and unit within a company, and carries:

`onHand`, `sourceAvailable`, `sourceReserved`, `held` (each nullable), `availableBasis` (the source's declared basis, in words), `observedAt`, `completeness` (`Complete` / `Partial` / `Unavailable`), `unitBasis` (`Declared` / `Unresolved`), `anomaly`, incoming supply with its evidence, competing demand, and its own version.

### 5.2 The four quantity families, kept apart

| Family | Meaning | Rule |
|---|---|---|
| Physical stock | What the source says is present | Displayed as reported |
| Held or quarantined | Present but withdrawn | Never contributes to usable |
| Incoming supply | Promised, not received | Displayed with its promise evidence and expected date; never usable |
| Usable | Supported by receipt and inspection evidence | The **only** basis for a reservation |

Source-reported available is shown with its declared basis and is **never adjusted** by the workspace.

### 5.3 The displayed calculation

Every observation detail shows its derivation explicitly:

```
Source-reported available   6 EA · basis: Source available is reported net of source reservations
PPO evidence ledger         = receipt lines inspected Usable  6 EA
Unreserved usable           = evidenced usable 6 EA − confirmed reservations 0 EA
                              − requests awaiting an outcome 0 EA = 6 EA
```

with the standing sentence: *"The source figure is displayed as reported. PPO subtracts its own confirmed reservations only from its own evidence ledger, so a reservation is never subtracted twice."*

Where the two figures legitimately differ, both are shown and neither is adjusted. The worked case in the fixture is `SYN-PPO-AVL-000010`:

| Value | Figure | Why |
|---|---|---|
| Source on hand | 2 SET | Six sets were dispatched on 15 September and have left the store |
| Source available | 2 SET | The source has already netted the dispatched stock |
| PPO evidence ledger, inspected Usable | 8 SET | The receipt record is retained; receipts are not deleted when goods leave |
| PPO confirmed reservations | 6 SET | The reservation for the dispatched consignment is retained |
| PPO unreserved usable | 8 − 6 = **2 SET** | Agrees with the source, by a different and stated route |

### 5.4 Absence, incompleteness and anomaly

| Case | Fixture | Display | Effect |
|---|---|---|---|
| Partial source result | `SYN-PPO-AVL-000006` (C200, Sydney) | Every quantity as an **Unknown** badge, `Partial`, observed 15 September 2026 18:05 | Reservation refused: *"Stock information is incomplete for this observation. Unknown availability is not zero and cannot support a reservation."* |
| Quarantine | `SYN-PPO-AVL-000002` (toplights, QA-HOLD-01) | On hand 4 EA, held 4 EA, evidenced usable 0 EA, source note retained | Reservation refused; blocker *Quarantine or inspection hold* |
| Unresolved unit basis | `SYN-PPO-AVL-000005` (battery packs reported in EA at Sydney, ordered in PACK) | Badge **Unit basis Unresolved**; evidenced usable **Not established** | Never summed with the PACK observation; cross-unit reservation refused: *"No conversion basis exists, so this reservation is refused."* |
| Internally inconsistent source | `SYN-PPO-AVL-000011` (on hand 2 EA, held 1 EA, source available 3 EA) | Badge **Investigate**; both original values preserved verbatim with the anomaly explained | Not allocatable; nothing is corrected, rounded or hidden |
| Absent evidence | `SYN-PPO-AVL-000008` (discontinued F200) | On hand 0 EA, no incoming supply | Blocker *Insufficient evidenced usable stock*; drives the substitution scenario |

### 5.5 Reservations

A reservation binds one order line to one availability observation in one declared unit. States are **Proposed, Pending, Confirmed, Failed, Unknown**; only `Confirmed` counts toward reserved quantity, and only a confirmed reservation carries a source allocation reference.

Refusals, with their exact text:

- beyond the line: *"Only N EA on this line is not already reserved."*
- beyond the evidence: *"Only N EA is evidenced usable and unreserved on SYN-PPO-AVL-000001. This request is refused rather than over-allocated."*
- against an incomplete, anomalous or cross-unit observation: as in §5.4
- while an earlier response is unknown: *"An earlier reservation response is unknown. Reconcile the original operation before another attempt."*

### 5.6 Competing demand and concurrency

`SYN-PPO-AVL-000003` holds 5 EA of evidenced usable S100 sensors against two orders wanting 4 EA and 3 EA. Reserving 4 EA leaves 1 EA; the 3 EA request is refused with the remaining quantity stated, and the second order may take the 1 EA and keep an owned shortage of 2 EA. There is no negative remainder, no silent last-write overwrite and no partial auto-fill.

**Server-side requirement — stated, not demonstrated.** Browser controls cannot establish this guarantee. A future application must, in one server transaction: re-read the evidence ledger and all confirmed and in-flight reservations for the observation under a row-level lock or an optimistic version check; reject when the requested quantity exceeds the remaining evidenced quantity; and write the reservation, audit record and outbox entry atomically. The client's check is a convenience that prevents an obviously doomed submission; it is not the control.

---

## 6. Picking & dispatch preparation — SC-06

### 6.1 The five-step flow

The view opens with an explicit step flow: **Pick → Stage → Prepare dispatch → Record movement → Source shipment.** Each step is a separate record; the flow shows which have occurred.

### 6.2 Pick preparation and the picking interface

| Field group | Fields |
|---|---|
| Order and source | PPO order reference, source line reference, customer |
| Item | Catalogue reference, code, name, catalogue status, unit |
| Location | Warehouse and bin, shown as a monospace location chip |
| Basis | Confirmed reservation reference, its quantity, its source allocation reference, and the quantity still to pick **on that reservation** |
| Observation | Picked quantity, then staged quantity as a second, separate entry |
| Traceability | Serial or batch references, entered manually, comma or newline separated |
| Evidence | Picker name and capture time, recorded automatically |
| Findings | Short pick, damaged stock, missing item — each with a quantity, a note and a review state |

**Manual reference entry is the primary path.** Scanning is not demonstrated in this standalone design; any future scanning must retain the manual fallback shown here.

Rules: picking requires a confirmed reservation; picked cannot exceed the outstanding quantity on that reservation; a picked quantity below the reservation **requires** a recorded finding; staging cannot exceed the picked quantity and is not a repeat of it.

Reviewing a finding records an outcome — *Accepted as short supply*, *Returned to the warehouse for a recount*, *Quarantined pending disposition* — with a note, author and time. It never alters the recorded picked quantity: *"A recount needs a fresh pick against the reservation, not an edit of this one."*

### 6.3 Substitutions

A substitution is a **proposal** against an order line, not an edit. It records the accepted item, the proposed item, the reason, the proposer and the time, and it blocks dispatch readiness while it is open.

A picker cannot decide it. The review is available only to the commercial reviewer role and requires two explicit confirmations — that the engineering compatibility position has been obtained from Engineering & Design Control, and that the commercial position on price and accepted scope has been obtained from Estimating & Quotation — plus a written basis. A proposed item in a different unit is refused outright, because no conversion basis exists.

Approval is deliberately weaker than it sounds, and the workspace says so: *"An approved substitution still needs a revised accepted scope issued through Estimating and an amendment in the source order before anything is dispatched."* Neither price, quantity, accepted item nor technical scope changes here.

### 6.4 Dispatch preparation

Recorded on preparation: exact lines and quantities, delivery address, receiving point, receiving contact and role, recorded delivery instructions, carrier or collection arrangement, package references, and the planned dispatch date.

**Readiness checks**, computed rather than ticked, per line and per consignment:

1. confirmed reservation covers every planned dispatch quantity
2. picked and staged quantities cover every planned dispatch quantity
3. no unreviewed short pick, damage or missing-item finding
4. no substitution awaiting review
5. delivery address and receiving point recorded
6. receiving contact recorded
7. carrier or collection arrangement recorded
8. at least one package reference recorded

Each check shows its own figures. Physical dispatch is refused until all are met, naming the unmet checks.

### 6.5 Three things that are not the same

| Record | What it means | What it does not do |
|---|---|---|
| Prepared dispatch | Intended lines, quantities and arrangements | Moves nothing; creates no source transaction |
| Issued document | A pick list, packing document or delivery document exists | *"Issuing a document is evidence of preparation only. It does not move goods, mark the order dispatched or create a source shipment transaction."* |
| Recorded movement | The listed lines and quantities physically left the store, confirmed by the warehouse role | Is not a source shipment transaction |
| Source shipment outcome | What the source actually returned: `Confirmed`, `Failed` or `Unknown` | Does not change any physical evidence already captured |

Historical preparation and dispatch evidence is retained when a later change occurs; a second consignment is a new record, never an edit of the first.

---

## 7. Customer delivery & proof of delivery — SC-07

### 7.1 Delivery record

| Field group | Fields |
|---|---|
| Identity | Delivery reference, consignment reference, order reference |
| Lines | The exact source order lines, with dispatched, recorded received, damaged and missing quantities in the line unit |
| Time | Capture time with its IANA timezone, displayed |
| Place | Delivery address; **actual receiving point**; and, shown separately, the **intended use area** |
| People | Receiving person and their recorded role; the person who captured the evidence; where a correction exists, the person who recorded it |
| Outcome | `Delivered`, `Partial`, `Failed attempt`, `Refused`, `Access denied` |
| Notes and evidence | Delivery notes; labelled synthetic evidence references (photograph and document references) |
| Findings | Damaged, Missing quantity, and the failed/refused/access-denied outcome itself, each with quantity and note |
| Acknowledgement | Where captured: person, role, time, exact scope and an explicit exclusion statement |
| Remaining | Remaining quantity on the order after this delivery, shown per line |
| Local state | `Captured locally`, `Queued`, `Synced`, `Failed`, `Conflict` — separate from the business outcome |

### 7.2 Receiving point is not the use area

The standing note reads: *"Delivery to Pack Room 01 does not establish installation in Glasshouse 02, completion of a project, resolution of a service case, or approval to invoice or pay."* Both values are shown on every delivery record, with the use area annotated *(separate from the receiving point)*.

### 7.3 Five separate steps

Carrier arrival · physical receipt · delivery acknowledgement · inspection · acceptance of the wider contractual scope. This design records the second and third. It records neither inspection nor contractual acceptance, and it does not infer either.

### 7.4 Acknowledgement

An acknowledgement is bound to one delivery and its recorded quantities, and carries:

> Acknowledges receipt of the quantities recorded on SYN-PPO-DEL-000002 only.
> This acknowledgement is not acceptance of installation quality, completion of a project, resolution of a service case, or approval to invoice or pay.

It requires an explicit confirmation before it can be recorded. A failed, refused or access-denied attempt cannot carry one at all. A delivery without an acknowledgement says so: *"The recorded quantities stand on the capture evidence alone until a customer acknowledgement scoped to this exact delivery is recorded."*

### 7.5 Partial deliveries, failed attempts and corrections

Partial deliveries are ordinary: a consignment may be delivered across several records, and the model refuses any capture whose quantities, added to those already recorded against the same consignment, exceed what was dispatched.

A failed attempt records no quantity, sets the receiving point to "Not reached", records a finding and is retained in the history.

A **correction creates a successor**. The predecessor is marked superseded, retained in full — its original author, time, notes, findings and evidence unchanged — and **excluded from every total**. The successor records the reason, the person who recorded it, the time and its predecessor reference, and starts without an acknowledgement, because the acknowledged content has changed. Nothing is overwritten and no quantity is counted twice.

### 7.6 Outstanding quantities

`outstanding = ordered − recorded received − cancelled`, per line, in the line's unit.

Damaged and missing quantities do **not** reduce the outstanding figure. They were dispatched and not accepted, so the order still owes them; they simultaneously create an exception for the damage or shortage, which is routed to its own workflow. This is a deliberate, documented choice: the alternative — treating a damaged unit as delivered — would let a fulfilment view report a complete order against goods the customer cannot use.

Double counting is prevented structurally: a delivery line references exactly one dispatch line and one order line; superseded deliveries are excluded; corrections replace rather than add; and returns, credits and supplier recoveries live in their own workflows and never post quantities back into this ledger.

---

## 8. Exceptions, commitments and follow-through

### 8.1 Exception categories

Insufficient or unavailable stock · Competing reservations · Quarantine or inspection hold · Short pick or substitution review · Supplier or dispatch delay · Failed or partial delivery · Damage, shortage or disputed receipt · Unresolved source mapping · Unknown source outcome · Changed customer commitment.

Every exception carries a source record reference, affected scope, owner, next action, a due date **or** an explicit "Date needed", a state (`Open` / `In review` / `Resolved`) and retained resolution evidence with author, time and evidence reference.

The view separates **recorded exceptions** (owned) from **detected conditions not yet owned** (computed from source evidence), so a condition that nobody has taken responsibility for is visible without pretending it is being handled.

### 8.2 Duplicate prevention

An exception is keyed on `kind | order | line`. A second open exception for the same scope is refused, naming the existing reference: *"An open … exception already exists for this scope (SYN-PPO-EXC-000002). Add resolution evidence to it rather than creating a second obligation."*

Follow-ups are keyed on an **impact identity** such as `exception:Insufficient or unavailable stock:ful-000001:lin-000001`. Creating a follow-up from the register, the stock view and the exception list for the same impact returns the existing obligation: *"An open follow-up already exists for this impact identity; no duplicate obligation was created."* Follow-ups declare their surface as *Activities and My Work* and link to [My Work & Action Centre r01](../my-work/PPO-My-Work-and-Action-Centre-r01.html).

### 8.3 Commitments

Three commitment kinds per line, each versioned with an actor, time, reason and predecessor:

- **Requested** — the customer's date on the accepted order
- **Confirmed** — what the customer was told
- **Expected** — the current best estimate

Changing the **expected** date creates a new expected version and leaves the confirmed commitment and the requested date untouched.

Changing the **confirmed** commitment is restricted to the commercial reviewer role and requires a reason plus two explicit confirmations: that an accountable customer follow-up will be created, and that the change does not reschedule a visit or amend a project plan. It retains the earlier confirmed version and **automatically raises a *Changed customer commitment* exception** whose impact statement names the affected Project or Service demand, for example:

> `SYN-PPO-PRJ-000031` demand is affected. The project plan is not amended by this change.

No visit is moved, no project plan is amended and no appointment is touched by anything in this workspace.

### 8.4 Routing recovery matters

Returns and return authorisation (SC-08), Warranty & Customer Resolution, supplier claim and recovery, and Finance credit and reconciliation each keep their own decision and outcome. This workspace records the routing and the external reference only: *"The decision and outcome remain in that workflow. This link records the routing only."* SC-08 is not rebuilt.

---

## 9. Identity, permissions and information boundaries

### 9.1 Identity layers

Permanent internal identifiers (`ful-…`, `lin-…`, `avl-…`, `res-…`, `pck-…`, `dsp-…`, `del-…`, `exc-…`, `sub-…`, `fup-…`) are separate from readable references (`SYN-PPO-FUL-000001`), external keys (`SYN-ERP-SO-004411`, `SYN-ERP-CUST-NBN01`, `SYN-ERP-ALLOC-000771`, `SYN-ERP-SHP-006201`), display labels, revisions and states. Company and entity context (`PPA-AU` / `SYN-ERP-CO-AU`, `PPA-NZ` / `SYN-ERP-CO-NZ`) qualifies every external key. Display numbers, item descriptions and customer names are never identity.

### 9.2 Synthetic roles

No real employee is assigned any authority. Names are fictional.

| Role | Person | Companies | Warehouses | Commercial values | May record |
|---|---|---|---|---|---|
| Fulfilment coordinator | Robin Ellis | PPA-AU | MEL, SYD | Yes | reserve, reconcile unknown outcome, refresh observation, review finding, prepare dispatch, issue documents, record source shipment outcome, correct delivery, raise/resolve exception, change expected date, create follow-up |
| Warehouse & dispatch | Alex Morgan | PPA-AU | MEL | No | pick, stage, propose substitution, issue documents, record physical movement |
| Delivery & proof of delivery | Sam Patel | PPA-AU | — | No | capture delivery, record acknowledgement, correct delivery |
| Commercial reviewer | Casey Reed | PPA-AU | — | Yes | decide substitution, change confirmed commitment, raise/resolve exception, route recovery, create follow-up |
| Group fulfilment coordinator | Mia Chen | PPA-AU, PPA-NZ | MEL, SYD, AKL | Yes | as the fulfilment coordinator, in both companies |
| Read-only observer | Jamie Walker | PPA-AU | — | No | nothing |

An **empty warehouse grant is no scope at all**, never an implicit grant over every warehouse in the company.

### 9.3 Information boundaries

Restricted commercial line values are removed **in the projection**, before any view, search, count, snapshot, drawer or export can see them. For a non-commercial role the field does not exist; a search for the value returns no rows, and the drawer states *"Commercial values are outside the Warehouse & dispatch grant and are not loaded for this role."* Company isolation works the same way: a role without the company grant receives an empty projection, and the workspace explains the boundary rather than showing an empty list that could be read as "nothing outstanding".

### 9.4 Server enforcement

Role and company selection in the HTML is a **presentation of the model's permission projections**. It is not authenticated access control. A future application must enforce every permission, scope and validation rule on the server, and must not rely on a client-side projection to withhold restricted information.

---

## 10. Status transitions, corrections, concurrency and recovery

### 10.1 Recovery behaviours demonstrated

| Scenario | Behaviour |
|---|---|
| Stock or order scope changes during preparation | A stale line or pick snapshot is refused: *"The order line changed. Refresh its snapshot before acting."* The submitted entries are retained in the form |
| Concurrent attempts against the same supply | The second is refused with the remaining evidenced quantity stated; no negative remainder, no overwrite |
| Stale reservation or dispatch evidence | Optimistic version check on the session, the line, the pick, the dispatch, the delivery, the exception and the substitution |
| Submission validation failure | Refused atomically; nothing is written; the form keeps its entries |
| Network or storage failure | Simulated save failure: *"Simulated save failure. Nothing was recorded and your entries are retained; retry the same form."* |
| Response lost after a submitted operation | The operation is recorded, the workspace marks it pending, **blocks all further business effect** and offers "Recover the original operation". Replaying the same operation identity returns the same receipt and the same version: *"Original operation recovered. The same result and receipt were returned; no second effect was created."* |
| Partial and unknown source outcomes | A reservation may be `Unknown`; the line is blocked until reconciled. Reconciliation offers *Confirmed in source*, *Not found after evidenced search* (which requires a search-evidence reference and is recorded as *Evidenced absence*) and *Still unknown* (which leaves the line blocked). **A missing lookup result is not proof that the original transaction failed** |
| Customer, company and identity switching | Switching any of the three re-projects the workspace; records never mix, and a company outside the grant produces an explained boundary |
| Access revoked during an open workflow | Changing to a role without the grant leaves every recorded result intact and disables the controls that role may not use; the read-only observer can inspect everything permitted and record nothing |

### 10.2 Operation identity and receipts

Every command carries an operation identity. A receipt records the identity, a content signature, the resulting version, the time and the result reference. Replaying the same identity with the same content returns the original receipt without a second effect. Replaying the same identity with **different** content is refused: *"This operation identity belongs to different content."*

### 10.3 Evidence versus synchronisation

Captured physical evidence and its synchronisation state are separate fields. The delivery form states: *"A source outage cannot turn unsynchronised evidence into a confirmed record."* The design shows `Captured locally` and `Queued` states honestly and **does not imply production offline capability**; a bounded queue and replay design with its own verification would be required before any such claim.

### 10.4 Local persistence

Records are saved to this browser's local storage under `ppo-order-fulfilment-r01`, and the header reports the actual state — "Saved in this browser" or "Session only · export before closing". A damaged saved session is never silently discarded: the workspace refuses to render the workspace, preserves the original stored content exactly and offers to export it before any reset. A change in another tab is detected and the tab refuses to overwrite the newer session.

---

## 11. Quantity definitions, units and reconciliation

### 11.1 Representation

Quantities are held as integer thousandths of the line unit, so three decimal places are exact and no floating-point drift occurs. Entry accepts at most three decimal places and rejects negatives, empty values, thousands separators and non-numeric text. Display trims trailing zeros: `2.500` renders as `2.5`.

### 11.2 Units

Units in the fixture: **EA, SET, PACK** (and, in the wider catalogue, BOTTLE, HOUR, JOB). **No conversion exists between any of them.** An order line's unit must equal its catalogue unit. A reservation must use one declared unit on both sides. An observation reporting a different unit is excluded from every total and marked `Unit basis Unresolved`. A substitution proposing an item in a different unit is refused. Any future conversion would require a versioned accepted basis, which this design does not supply.

### 11.3 Definitions

| Term | Definition |
|---|---|
| Ordered | The accepted source order line quantity |
| Reserved | Sum of **confirmed** reservations on the line |
| Unreserved | ordered − cancelled − reserved |
| Picked | Sum of recorded picked quantities (physical observation) |
| Staged | Sum of recorded staged quantities (a second physical observation) |
| Planned | Sum of quantities on all prepared consignments, whether moved or not |
| Dispatched | Sum of quantities on consignments with a recorded physical movement |
| Received | Sum of recorded received quantities on **current** (non-superseded) deliveries |
| Damaged / Missing | Recorded at delivery; dispatched but not accepted |
| Outstanding | ordered − received − cancelled |
| In transit | dispatched − received − damaged − missing |
| Still to pick | reserved − picked |
| Evidenced usable | Sum of receipt lines inspected `Usable` on an observation, when the observation is Complete, its unit basis Declared and it carries no anomaly |
| Unreserved usable | evidenced usable − confirmed reservations − requests awaiting an outcome |

### 11.4 Enforced invariants

Per line: `staged ≤ picked ≤ reserved ≤ ordered`; `dispatched ≤ staged`; `received + damaged + missing ≤ dispatched`; `outstanding ≥ 0`.
Per observation: `confirmed reservations ≤ evidenced usable`.
Every invariant is re-checked after every command; a command that would breach one is refused and nothing is written.

### 11.5 Worked reconciliation — the two-shipment journey

Line `SYN-ERP-SO-004411-10`, 10 EA of `SYN-PPO-PRD-0004`.

| Step | Ordered | Reserved | Picked | Staged | Dispatched | Received | Outstanding |
|---|---|---|---|---|---|---|---|
| Opening | 10 EA | 0 | 0 | 0 | 0 | 0 | **10 EA** |
| Reserve 6 EA against 6 EA evidenced usable | 10 | 6 | 0 | 0 | 0 | 0 | 10 |
| Pick 6, stage 6 | 10 | 6 | 6 | 6 | 0 | 0 | 10 |
| Prepare consignment 1 (planned 6) | 10 | 6 | 6 | 6 | 0 | 0 | 10 |
| Issue pick list and packing document | 10 | 6 | 6 | 6 | **0** | 0 | 10 |
| Record physical movement | 10 | 6 | 6 | 6 | 6 | 0 | 10 |
| Record source shipment `SYN-ERP-SHP-006201` | 10 | 6 | 6 | 6 | 6 | 0 | 10 |
| Capture delivery of 6 EA at Pack Room 01 | 10 | 6 | 6 | 6 | 6 | 6 | **4 EA** |
| Acknowledgement for that delivery only | 10 | 6 | 6 | 6 | 6 | 6 | 4 |
| Raise the owned 4 EA shortage | 10 | 6 | 6 | 6 | 6 | 6 | 4 |
| Refresh the observation: later receipt of 4 EA inspected Usable | 10 | 6 | 6 | 6 | 6 | 6 | 4 |
| Reserve 4, pick 4, stage 4, dispatch 4, deliver 4 | 10 | 10 | 10 | 10 | 10 | 10 | **0** |

Conservation at every step: `ordered = received + outstanding + cancelled`. Two deliveries exist; the shortage exception and its history remain visible after completion.

### 11.6 Worked reconciliation — damage and dispute

Line `SYN-ERP-SO-004440-10`, 6 SET dispatched, delivery `SYN-PPO-DEL-000001` records 5 SET received, 1 SET damaged, receipt disputed.

`outstanding = 6 − 5 − 0 = 1 SET`. The damaged set is not counted as received. A correction creates `SYN-PPO-DEL-000004` with the same totals and a stated reason; `SYN-PPO-DEL-000001` is retained, marked superseded and excluded from totals, so the received figure stays 5 SET rather than becoming 10 SET. The damage is routed to returns and supplier recovery, where its credit or replacement decision is made.

---

## 12. Source authority, freshness and completeness

Each order carries its own `observedAt` and `Complete` / `Partial` / `Unavailable`. Each availability observation carries its own. The register footer states the observation time for the loaded set. A stale-observation scenario marks every observation *"Refresh before relying"* without changing any quantity.

No age threshold is supplied. The candidate contract explicitly leaves "how long an observation can remain usable" open, and this design does not invent one. What it does instead is make the observation time visible everywhere a quantity is shown, and refuse to reserve against an observation the source itself reports as incomplete.

---

## 13. Incoming and outgoing links

**Incoming.** Accepted handover (CR-03 Won-deal receiving handover) supplying the handover reference, originating opportunity, receiving owner, acceptance time and commercial basis. Receipt, inspection and quarantine evidence from Material Readiness r03 (SC-01–SC-04). Catalogue items and units from Products r04. Customer, site, contact and receiving-point context from Customers, Sites & Growing Areas r03. Item resolution and company/entity key mapping from ES-07, which is the upstream owner of unresolved source mappings.

**Outgoing.** Customer 360 for the customer view of the journey — the two-shipment story, the retained shortage and its resolution are all reachable from the order. Projects delivery readiness and Work Orders for linked demand, which this workspace never reschedules. Warranty & Customer Resolution, returns (SC-08), supplier claim and Finance for recovery matters. My Work & Action Centre for owned follow-ups.

---

## 14. Demonstrated scenarios

| # | Scenario | Where |
|---|---|---|
| 1 | 10 EA order, 6 EA of confirmed usable supply, deliver 6, retain a 4 EA owned shortage, fulfil the remainder after new supply is confirmed | Register → Stock → Picking → Delivery → Exceptions, end to end |
| 2 | Competing demand against limited usable stock | Stock: `SYN-PPO-AVL-000003` with two competing orders |
| 3 | Partial or stale availability observation | Stock: `SYN-PPO-AVL-000006`; and the stale source scenario in Preview options |
| 4 | Short pick and a quarantined item preventing dispatch readiness | Picking: seal-kit line with a short-pick finding; `SYN-PPO-AVL-000002` quarantine |
| 5 | Proposed substitution requiring review | Picking: discontinued F200 line, proposal and two-position review |
| 6 | Delivery with damage, missing quantity or disputed receipt | Delivery: `SYN-PPO-DEL-000001` and its correction |
| 7 | Lost response or unknown source result requiring original-operation reconciliation | Preview options → "Submit, then lose the response"; and the `Unknown` reservation outcome |
| 8 | Changed delivery commitment requiring accountable customer follow-up | Exceptions → "Change a confirmed commitment" |
| 9 | Switching customer, company and identity without mixing records | Working context controls; PPA-AU / PPA-NZ, six identities |

### 14.1 Synthetic assumptions

Two companies (`PPA-AU`, `PPA-NZ`) and three warehouses exist only to demonstrate company and scope isolation; neither corresponds to a real entity or a real warehouse. Simulated source outcomes are chosen by the reviewer from a control, not returned by any system. Evidence references are labelled synthetic strings, not files. The `SYN-ERP-…` prefix marks every value that stands in for a source record; no such record exists.

---

## 15. Mobile and accessibility behaviour

Breakpoints at 1150, 850 and 600 px. At phone width the register and stock tables become stacked cards with their column headings as labels, the filter grid collapses to two columns, the working-context controls become full-width, forms become single-column, and every interactive target is at least 44 px high. The pick card shows the item, quantity and bin location prominently with full-width actions; the delivery capture form presents received, damaged and missing as separate numeric inputs per line with `inputmode="decimal"` to raise a numeric keypad.

Accessibility: a skip link; one `h1`; landmark `header`, `nav`, `main` and `footer`; `aria-current="page"` on the active tab; `aria-pressed` on worklist chips and snapshot cards; labelled form controls with visible labels; `role="status"` with `aria-live="polite"` for the save indicator and toast; `role="alert"` on the form error, which also receives focus; a table caption for screen readers on each worklist; `role="img"` with a full text alternative on each progress bar, whose colour legend is hidden from assistive technology in compact form because the same figures are read from the alternative text; a visible focus outline that meets `:focus-visible`; dialogs that return focus to their opener; and an unsaved-entry confirmation before a form is discarded. Colour is never the only signal — every state also carries a text badge.

Verified in a native browser: all five views at 1440, 1024, 820, 390 and 320 px with no horizontal page overflow; keyboard-only navigation to a view and into a record; `:focus-visible` matched with a non-`none` outline; a 46 px navigation target at phone width.

---

## 16. What works in the HTML versus future application requirements

### 16.1 Functional in the standalone file

Five views with real filtering, search and worklists; snapshot cards that open contributing records and restore filter context; the complete two-shipment journey; reservation with confirmed, failed and unknown outcomes; over-allocation and competing-demand refusals; picking, staging, findings and their review; substitution proposal and review; dispatch preparation, document issue, physical movement and source shipment outcome; delivery capture, acknowledgement and correction; exceptions, routing, commitments and deduplicated follow-ups; six identities and two companies; five source scenarios; simulated save failure and lost response with original-operation recovery; local persistence, export, damaged-session recovery and cross-tab detection.

### 16.2 Required of the application, not established here

Server-side permission, scope and validation enforcement. Server-side concurrency control over the evidenced quantity, under one transaction with a lock or version check. A verified MYOB Acumatica contract for availability, reservation, shipment and any other source interaction — including the actual endpoints, field names, enumerations, units and error semantics, none of which exists today. Durable operations with an outbox, audit records and a reconciliation path for unknown outcomes. Durable evidence storage for photographs and documents, which are references only here. A bounded offline queue and replay design, if offline capture is wanted. Real identity and grant administration. Notification delivery, which this design only surfaces as follow-ups.

---

## 17. Open policies, dependencies and verification limitations

### 17.1 Open policy questions

1. **Observation age threshold.** How old may an availability observation be before a reservation must refresh it? Not supplied by the contract and not invented here.
2. **Damaged quantity and outstanding.** This design keeps damaged units outstanding. Confirm that this matches the commercial intent before implementation, because the alternative changes every completion figure.
3. **Reservation authority.** Whether PPO may request a source reservation at all, or may only observe one made in the source, is unresolved and depends on the ERP contract.
4. **Partial dispatch policy.** Whether a partial dispatch requires customer agreement before it is prepared.
5. **Acknowledgement medium.** Signature, photograph, email or portal, and what constitutes sufficient evidence.
6. **Quantity precision and unit dictionary.** Three decimal places is a prototype choice; the authorised unit dictionary and any conversion basis remain undecided.
7. **Who may change a confirmed commitment**, and whether a customer response is required before the change is recorded.
8. **Restricted commercial visibility.** The grant model here is a prototype proposal; actual authority is not confirmed.

### 17.2 Integration dependencies

Every MYOB Acumatica dependency is listed in [`docs/contracts/order-fulfilment-integration.md`](../../../contracts/order-fulfilment-integration.md). In summary: `MYOB-019/021/022/023/029/030/044/045/046/047` in the existing [field-mapping register](../../../contracts/myob-field-mappings.csv) are all recorded as *Unknown — not observed* and *Not verified*, and **no mapping row yet exists** for a reservation or allocation, a sales-order shipment, a delivery confirmation, a warehouse location hierarchy or a unit-conversion basis. Those gaps are proposed additions in the integration record, not verified facts.

### 17.3 Verification limitations

These are design checks, not application acceptance. No application code, database migration, dependency or deployment is introduced. The native browser run used the Playwright-bundled Chromium available in the authoring environment, not the repository's pinned Chrome channel; the focused workflow runs the same script under the pinned runtime. No real device was used, so touch behaviour is inferred from viewport and target-size measurement rather than observed. No screen-reader run was performed. Local storage was exercised in one browser only. Print output was not reviewed. Nothing here establishes owner acceptance, business approval or production readiness.

---

## 18. Recommended next bounded application increment

**Read-only fulfilment register over synthetic data, with server-enforced permissions.**

Deliver: a `fulfilment_order`, `fulfilment_line` and `availability_observation` schema with permanent internal identifiers and explicit external-key columns qualified by connection, company and entity; a server projection that computes the quantity algebra of §11 and enforces the information boundaries of §9; the register view and the order drawer; and a synthetic seed reproducing this fixture.

Exclude: every write. No reservation, pick, dispatch, delivery, correction or exception command until §17.1 questions 1, 2, 3 and 6 are decided and the source contract for availability is verified.

Why this first: it establishes the identity model, the quantity algebra and the permission projection — the three things every later command depends on — against synthetic data, with no source write and no irreversible effect. The next increment after it would be delivery capture, because delivery evidence is PPO-owned and needs no ERP write, followed by reservations once the source contract exists.

---

## 19. Traceability

| # | Requested capability | Where in the HTML | Verification evidence |
|---|---|---|---|
| 1 | Searchable fulfilment worklist | Fulfilment register | Native: *The register shows source order, account, purchase order, handover and three separate dates*; *Search, filters and the empty state explain themselves and clear cleanly* |
| 2 | Company/entity and ERP order reference | Register rows; order drawer | Native check 2 |
| 3 | Customer and ERP account | Register rows | Native check 2 |
| 4 | Customer purchase-order reference | Register rows ("Not supplied" where absent) | Native check 2 |
| 5 | Accepted handover and receiving owner | Register rows; order drawer | Native: *The order drawer separates acceptance, Won, ERP order creation and receiving responsibility* |
| 6 | Delivery site and receiving location | Order drawer; dispatch; delivery | Native checks 6, 12, 15 |
| 7 | Requested, confirmed and expected as separate values | Register "Dates" column; order drawer | Model: *Requested, confirmed and expected dates are separate values with their own versions* |
| 8 | Order and line fulfilment progress | Progress bar and quantity grid | Model: two-shipment conservation test |
| 9 | Stock, picking, dispatch and delivery blockers | Register blockers; exceptions view | Model: *The register condition and blockers describe the Northbank shortage exactly* |
| 10 | Outstanding quantities and their units | Every view | Model: quantity conservation; unit tests |
| 11 | Owner, next action and due date | Register; exception cards | Native: *The remaining four units stay outstanding and become an owned exception* |
| 12 | Source freshness and completeness | Register footer; observation column | Model: partial-observation test |
| 13 | Filters for customer, site, owner, company, warehouse, date, condition | Filter panel; worklist chips; context controls | Native check 3 |
| 14 | Worklist views identified as PPO coordination views | Standing note above the chips | Native: *Coordination views are labelled as PPO views, not source statuses* |
| 15 | Summary cards open contributing records; filter context preserved | Snapshot cards; "Return to the previous filters" | Native: *A snapshot card opens the exact contributing records and preserves filter context* |
| 16 | Unavailable or incomplete results explained | Source notices for partial, failed, empty, stale | Native: *Partial, failed and empty source scenarios explain themselves without showing zero* |
| 17 | Source links to Customer 360, handover and originating order | Order drawer link row | Visual review of `1440-02-order-drawer.png` |
| 18 | Company/warehouse/bin/item/unit availability | Stock table | Native: *Stock shows unknown, quarantined, unresolved-unit and anomalous observations as themselves* |
| 19 | On hand, source available, reserved, held, incoming, competing demand, observation time, completeness | Stock table and observation detail | Native check 7; model checks on each case |
| 20 | Incoming, physical, usable and available-to-promise kept distinct | Standing note; derivation block | Model: *Incoming supply is promised, not usable* |
| 21 | Stock not inferred from a purchase order or an arrival | Incoming supply shown as "Promised, not received" | Model: same test |
| 22 | Reuse of receipt, inspection and quarantine evidence | Receipt and inspection evidence block | Model: *Quarantined stock is physically present but never usable* |
| 23 | Proposed versus confirmed reservations; pending, confirmed, failed, unknown | Reservation states and simulated outcome control | Model: *An unknown source outcome blocks further effect until the original operation is reconciled* |
| 24 | Double allocation prevented | Reservation refusal | Model: *Double allocation…refused, not netted to a negative*; native check 9 |
| 25 | Server-side concurrency requirement specified | §5.6; concurrency note in the stock sidebar | This report |
| 26 | Quantity precision and units retained; no invented conversion | Quantity algebra | Model: *An unresolved unit basis is never summed…*; *Quantity parsing rejects invalid precision…* |
| 27 | Each displayed calculation documented; no double subtraction | Derivation block; `calc` blocks | Visual review of `1440-03-stock.png`; §5.3 |
| 28 | Anomalous source values preserved with an investigation state | `Investigate` badge and anomaly note | Model: *An internally inconsistent source value is preserved and excluded, not corrected* |
| 29 | Incomplete information never shown as zero or confirmed | Unknown badges; refusal text | Model and native partial-observation checks |
| 30 | Order-linked pick preparation and picking interface | Picking view; pick card and form | Native: *Picking and staging are separate physical observations…* |
| 31 | Picked and staged as separate observations | Pick record; stage form | Model: *Staging is its own observation and cannot exceed the picked quantity* |
| 32 | Serial/batch references; manual entry with fallback | Pick form | §6.2 |
| 33 | Short picks, damaged stock, missing-item findings | Finding capture and review | Model: *A short pick needs a recorded finding and blocks dispatch readiness until reviewed* |
| 34 | Substitutions require explicit review; no silent replacement | Substitution proposal and two-position review | Model: *A substitution is a proposal only, requires two independent positions and never changes the order* |
| 35 | Dispatch preparation content | Prepare dispatch form; dispatch card | Native: *Dispatch preparation records the receiving point and moves nothing* |
| 36 | Prepared dispatch, physical movement and source shipment distinguished | Three separate records and controls | Native: *Physical dispatch and the source shipment outcome are recorded separately* |
| 37 | Printing a document does not dispatch | Issue-document form and its note | Native: *Issuing a pick list does not dispatch the goods* |
| 38 | Historical preparation and dispatch evidence retained | Consignment list in the order drawer | Native: *The original shortage and both shipments remain visible after completion* |
| 39 | Delivery record content | Delivery block | Native: *Delivery capture records the actual receiving point and keeps the use area separate* |
| 40 | Receiving point separate from installation or use area | Both shown on every delivery; standing note | Native check 15 |
| 41 | Carrier arrival, receipt, acknowledgement, inspection and acceptance separated | Standing note; §7.3 | This report; native check 16 |
| 42 | Acknowledgement identifies its exact delivery and quantities | Acknowledgement block and its exclusion statement | Native: *An acknowledgement names its exact delivery and excludes wider acceptance* |
| 43 | Partial deliveries, failed attempts, corrected evidence | Outcomes; superseded predecessors | Model: *A failed delivery attempt records no received quantity and is retained*; native: *A correction supersedes its predecessor…* |
| 44 | Outstanding quantities follow a documented basis; no double counting | `calc` blocks; §11.3, §11.6 | Model: conservation and correction tests |
| 45 | Consolidated exceptions view with all ten categories | Exceptions view | §8.1; native check 17 |
| 46 | Each exception has source, scope, owner, next action, date and evidence | Exception card and forms | Native check 17 |
| 47 | Effect on commitments, Project demand and Service work | Impact block on the exception | Model: *Changing a confirmed commitment retains the earlier version, needs a review role and reschedules nothing* |
| 48 | Changing an ETA does not replace a commitment or reschedule anything | Expected versus confirmed commitment commands | Model: *Changing an expected date does not replace the confirmed commitment* |
| 49 | Returns, warranty, supplier claim and credit linked, not rebuilt | Routing control and its note | Model: *Recovery matters are routed, not rebuilt…* |
| 50 | Follow-ups use Activities/My Work; no duplicate obligations | Follow-up form keyed on impact identity | Native: *The same impact identity cannot create a second follow-up obligation* |
| 51 | Permanent identities alongside external keys | §9.1; every drawer | Model: fixture validation |
| 52 | Documented permissions for each function | §9.2; disabled controls | Native: *A read-only identity can inspect everything and record nothing* |
| 53 | Server enforcement stated; HTML role switching is presentation | §9.4; Preview options note | This report |
| 54 | Restricted information does not leak through search, counts, snapshots or exports | Projection-level redaction | Model: *Commercial values never enter a projection…*; native: *Restricted commercial values never reach a non-commercial role…* |
| 55 | Nine recovery behaviours | §10.1 | Native: lost response, save failure, stale version, damaged session, reload, company/identity switching |
| 56 | Original operation identities and confirmed results preserved | Receipts ledger | Model: *An identical operation identity replays once…* |
| 57 | Physical evidence separate from synchronisation and source reconciliation | Delivery `syncState`; capture note | §10.3 |
| 58 | Local persistence shows its actual state; no production offline claim | Save indicator; capture note | Native: *Reload restores the exact saved records…*; *A damaged saved session preserves the original content…* |
| 59 | Nine synthetic demonstration journeys | §14 | Model and native suites |
| 60 | Primary journey visible through Customer 360 with retained history | Order drawer link; retained exception and both deliveries | Native check 20 |
| 61 | Real navigation targets where available | Link table in §3.2 | Visual review |
| 62 | Mobile and accessibility behaviour | §15 | Native responsive and keyboard checks |

---

## 20. Document control

| Item | Value |
|---|---|
| Design revision | r01 |
| Built from | `docs/design/order-fulfilment/` (template, fonts, workspace.css, model.js, workspace.js) |
| Builder | `python3 scripts/build-order-fulfilment.py` |
| Checks | `node scripts/check-order-fulfilment-model.mjs` · `node scripts/check-order-fulfilment-browser.mjs` |
| Theme authority | Theme board r20 |
| Predecessors preserved | Supply Chain Material Readiness r01, r02, r02a, r03 are unchanged |
| Status | Proposed design. Owner acceptance, application integration, ERP contracts and deployment are all separate and unresolved |
