---
document_id: PPO-013-FULFILMENT-INT
title: Order fulfilment and customer delivery — application integration requirements
revision: r01
date: 2026-09-16
owner: Dean Fiedler — prototype owner
status: Candidate requirements for SC-05–SC-07. No verified ERP contract, no connected system, no adopted mapping.
source_design: docs/reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html
---

# Order fulfilment and customer delivery — integration requirements

This record states what a future application would need in order to implement the [SC-05–SC-07 design](../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-Report-r01.md). It is deliberately separate from the design so that design review and integration commitment do not get mixed.

It builds on [PPO-013-READINESS](supply-chain-readiness.md) (SCM-01–08 candidate receiving contract), the [MYOB integration blueprint](myob-integration-blueprint.md) and the [field-mapping register](myob-field-mappings.csv). It adopts nothing, verifies nothing and commits nothing. **No MYOB Acumatica endpoint, field name, enumeration, unit code or transaction semantic in this document has been observed in an installed system.** Every statement about the source is a question to be answered, not an answer.

---

## 1. Ownership boundary

| Record | Authority | PPO's role |
|---|---|---|
| Sales order and its lines | MYOB Acumatica | Observe. Retain the external key qualified by connection, company and entity |
| Item catalogue, base unit, unit conversions | MYOB Acumatica (catalogue), Products (technical) | Observe. Never infer a conversion |
| On-hand, available, reserved, held quantities | MYOB Acumatica | Observe with an explicit observation time and completeness. **No competing ledger** |
| Reservation or allocation | MYOB Acumatica, if it is permitted at all | Request and observe. Retain state and the source reference |
| Shipment transaction | MYOB Acumatica | Observe. Never treat a physical movement as a source transaction |
| Invoice, payment, credit | MYOB Acumatica / Finance | Out of scope. Link only |
| Receipt, inspection, quarantine evidence | Material Readiness (SC-01–SC-04) | Reuse. Do not re-capture |
| Fulfilment coordination record | **PPO** | Own |
| Pick, staging, findings, substitution proposal | **PPO** | Own |
| Dispatch preparation, documents, physical movement | **PPO** | Own |
| Delivery evidence, acknowledgement, corrections | **PPO** | Own |
| Exceptions, commitments, follow-ups | **PPO** | Own |

PPO-owned records need no ERP contract to be implemented. That matters for sequencing: delivery evidence capture is buildable before any source write exists.

---

## 2. Existing mapping rows this design depends on

All are recorded in `myob-field-mappings.csv` as **Unknown — not observed**, API status **Not verified**, evidence status **Proposed**. None may be relied upon.

| Row | Field family | What SC-05–SC-07 needs from it |
|---|---|---|
| MYOB-001 | Customer account identifier | Link the order to the exact billing account shown on the register |
| MYOB-012 | Account location identifier | Relate an ERP delivery location to an operational site |
| MYOB-013 | Delivery address | Populate the dispatch address; never overwrite an operational site from a billing address |
| MYOB-019 | Product/item identifier | Bind an order line and an availability observation to the same item |
| MYOB-021 | Item classification and status | Show a discontinued item honestly, as the substitution scenario requires |
| MYOB-022 | Base unit of measure | Establish the line unit. Everything in the quantity algebra depends on this being exact |
| MYOB-023 | Purchase/sales unit conversion | **Only** basis on which any cross-unit figure could ever be combined. Absent today |
| MYOB-029 | Warehouse and bin | Identify the availability observation's location |
| MYOB-030 | Stock quantities and availability | Supply on hand, available, reserved and held, **with the source's declared basis for "available"** |
| MYOB-044 | Purchase order and line identity | Identify incoming supply |
| MYOB-045 | Promised and received quantities | Distinguish promised from received incoming supply |
| MYOB-046 | Lot or serial traceability | Carry serial and batch references recorded at picking |
| MYOB-047 | Sales order and line identity | Identify the order line that everything else hangs from |

---

## 3. Mapping rows that do not yet exist

These are **proposed additions**, listed here rather than written into the register, because writing an unobserved row into the baseline register would give it a status it has not earned. Each needs the same discovery treatment as every existing row: observe representative use, capture redacted evidence, confirm the endpoint contract, and test in the approved non-production environment.

| Proposed | Field family | Why SC-05–SC-07 needs it | Discovery question |
|---|---|---|---|
| FUL-A01 | Allocation or reservation identity | A confirmed reservation must carry a source reference | Does the installed process use allocations or reservations at all, and at what grain — order line, warehouse, or lot? |
| FUL-A02 | Allocation quantity, unit and state | Distinguish confirmed from pending and failed | What states exist, and what is returned when a requested quantity is unavailable? |
| FUL-A03 | Allocation create and release semantics | Whether PPO may request one, and how it is released | Is an external system permitted to allocate? What releases an allocation, and is release idempotent? |
| FUL-A04 | Availability observation basis | Whether "available" is already net of reservations or of held quantity | Exactly which quantities are subtracted in the source's available figure? |
| FUL-A05 | Availability as-at time | The observation time shown beside every quantity | Does the source return an as-at timestamp, or only the time of the call? |
| FUL-B01 | Shipment identity and line identity | The source shipment reference recorded after a physical movement | What identifies a shipment and its lines, and how does it relate to the order line? |
| FUL-B02 | Shipment quantities and unit | Reconcile a dispatched quantity with the source | Are shipment quantities expressed in the line unit or a shipping unit? |
| FUL-B03 | Shipment confirmation semantics | Distinguish a prepared shipment from a confirmed transaction | What does confirmation post, and is it reversible? |
| FUL-B04 | Shipment idempotency key | Prevent a duplicate shipment on retry | Does the source accept an idempotency key or an external reference on create? |
| FUL-C01 | Delivery or proof-of-delivery record | Whether the source holds delivery at all | Does the installed process record delivery separately from shipment? |
| FUL-C02 | Warehouse and bin hierarchy | Present location consistently | What is the location hierarchy, and is bin mandatory? |
| FUL-C03 | Unit-conversion basis and effective dates | The only lawful route to any cross-unit figure | Are conversions item-specific, versioned and dated? |
| FUL-C04 | Error and unknown-outcome semantics | Reconcile a lost response without a duplicate effect | What does the source return on timeout, and can an operation be looked up by an external reference afterwards? |

**FUL-C04 is the one that most affects correctness.** The design blocks further business effect on a line whose source outcome is unknown, and requires an evidenced search before recording absence. That behaviour is only implementable if the source can be queried by an external reference after a lost response. If it cannot, the reconciliation policy must change and the design must change with it.

---

## 4. Application requirements

### 4.1 Data

Permanent internal UUIDs for order, line, availability observation, reservation, pick, dispatch, delivery, exception, substitution, commitment and follow-up. External keys stored separately and qualified by connection, company, entity and, where required, branch. Readable references, labels, revisions and states held as separate columns. Quantities as exact decimals with an explicit unit column and a check constraint forbidding a null unit. No conversion function anywhere in the schema.

### 4.2 Server enforcement

Every permission, scope and validation rule in the design is a server obligation. In particular:

- **Reservation concurrency.** One transaction that re-reads the evidence ledger and all confirmed and in-flight reservations for the observation under a row-level lock or an optimistic version check, rejects an over-allocation, and writes the reservation, audit record and outbox entry atomically. A client-side check is a convenience, never the control.
- **Projection-level redaction.** Restricted commercial values must be excluded from the server projection for a role without the grant, so they cannot reach a query, a count, an export or a cached response.
- **Company isolation.** Enforced in the query, not in the view.
- **Stale-snapshot rejection.** Version checks on the session, the line, the pick, the dispatch, the delivery, the exception and the substitution.

### 4.3 Durability and recovery

Durable operations with an operation identity, a content signature, a receipt, an outbox and an audit record. Replay of the same identity with the same content returns the original receipt with no second effect; replay with different content is refused. Unknown source outcomes are reconciled before another business effect on the same line is permitted, and an absent lookup result is recorded as an evidenced absence only, never as proof of failure.

### 4.4 Evidence storage

Delivery photographs and documents are references in this design. An application needs durable storage with access control, retention, an integrity hash and a link from the evidence to the exact delivery and its quantities. Captured evidence and its synchronisation state must remain separate fields; a source outage must never mark unsynchronised evidence as confirmed.

### 4.5 Offline

Not designed and not claimed. If offline capture is wanted, it needs its own bounded queue and replay design with conflict handling, its own verification, and an explicit statement of what is and is not guaranteed.

---

## 5. Decisions required before implementation

| # | Decision | Blocks |
|---|---|---|
| 1 | Maximum age of an availability observation before a reservation must refresh it | Reservation command |
| 2 | Whether a damaged quantity remains outstanding on the order | Every completion figure |
| 3 | Whether PPO may request a source reservation, or may only observe one | Reservation command |
| 4 | Whether a partial dispatch requires customer agreement | Dispatch preparation |
| 5 | Acceptable acknowledgement medium and sufficient evidence | Delivery capture |
| 6 | Authorised unit dictionary and quantity precision | Schema and every quantity |
| 7 | Who may change a confirmed commitment, and whether a customer response is required first | Commitment command |
| 8 | Actual commercial-visibility grants | Projection |

Decisions 1, 2, 3 and 6 block the first write increment. Decisions 4, 5, 7 and 8 block specific commands and can be taken later.

---

## 6. Sequencing

1. **Read-only register** over synthetic data with server-enforced permissions and the quantity algebra. No writes. Establishes identity, algebra and projection.
2. **Delivery evidence capture**, because it is PPO-owned and needs no source write. Includes corrections and acknowledgement.
3. **Picking, staging and findings**, also PPO-owned.
4. **Dispatch preparation and physical movement**, PPO-owned; the source shipment outcome stays a manual observation until FUL-B01–B04 are verified.
5. **Reservations**, only once FUL-A01–A05 and decisions 1, 3 and 6 are resolved.
6. **Source shipment transactions**, only once FUL-B01–B04 and FUL-C04 are resolved.

Steps 1–4 require no verified ERP contract. Steps 5 and 6 cannot begin without one.

---

## 7. What this record does not do

It does not authorise a connection, a credential, a tenant, a licence, a migration, a deployment, a customer communication or any transaction. It creates no adopted mapping and changes no existing register row. It is a list of what would have to be true, written down so that the design can be reviewed without anyone inferring that the integration exists.
