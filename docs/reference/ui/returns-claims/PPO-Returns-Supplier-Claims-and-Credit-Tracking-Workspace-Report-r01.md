---
document_id: PPO-SC08-WORKSPACE-RPT
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed HTML design and detailed companion report; owner acceptance and application integration separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# Returns, Supplier Claims & Credit Tracking — workspace report

Companion to the standalone [SC-08 workspace r01](PPO-Returns-Supplier-Claims-and-Credit-Tracking-Workspace-r01.html) and its [design and receiving handover](../../../decisions/returns-supplier-claims-credit-design.md).

The central question the workspace answers is: **what happened to the goods, how are we resolving the customer's issue, and what recovery or credit remains outstanding?**

Everything in the design is synthetic. No live stock movement, supplier or customer message, claim, credit, refund or ERP posting is created, sent or implied anywhere in this contribution.

## 1. Purpose, SC-08 scope and parent traceability

SC-08 coordinates the work that follows a return: the customer's issue, the goods themselves, the supplier claim that may arise, and the credits that may or may not follow. Its defining discipline is that those four things move at different speeds and must never be collapsed into one status.

**Page scope (SC-08), distinct from parent requirement identifiers.** Coverage register r06 records SC-08 as *Returns, supplier claims and credit tracking*, placement *Pages + linked tabs*, family *SC — Supply Chain and logistics*, reviewer *Supply chain lead*, priority *P2*, state *N*, depending on **SC-04**, with parents **SCM-01–SCM-08**. Register r06 is an issued artefact: this contribution does not edit its bytes, and its recorded `N` state is superseded only by the design-index row added here, not by an edit to the register.

Two things the page code is **not**:

- SC-08 is a page identifier in the HTML page coverage register. The identically-spelled `SC-08` in **BP-07 Service Operations** is a parent requirement for scheduling under P05 and is unrelated. Nothing in this contribution touches BP-07 SC-08.
- SC-08 is not a requirement. All 78 parent requirement identifiers are preserved unchanged; the parents this page serves are SCM-01–SCM-08 as recorded in register r06.

| Parent | What SC-08 contributes | What it deliberately does not do |
|---|---|---|
| SCM-01 | Return demand raised against an existing order, delivery, receipt, work order or warranty case | Does not create demand, approve purchase or grant booking permission |
| SCM-02 | Item, company, warehouse and account external keys with observation time and Complete/Partial/Unavailable status | Does not maintain a stock ledger or a parallel available-to-promise figure |
| SCM-03 | Purchase order, inbound receipt and inspection references retained as the source of a supplier return | Does not call an ERP endpoint or post a purchase transaction |
| SCM-04 | Supplier claim, submission evidence and supplier response as separately dated observations | Does not treat a supplier commitment as a posted credit |
| SCM-05 | Line-level quantity links from source line → authorisation → receipt → inspection → disposition | Does not convert units, merge lines, or infer a quantity from a similar description |
| SCM-06 | Arrival, ERP receipt confirmation, inspection, usable quantity, shortage, damage and quarantine as distinct observations | Does not make returned goods available because they arrived |
| SCM-07 | Return, claim, movement and credit references with their evidence and actual external outcome | Does not plan a movement and then report it as posted |
| SCM-08 | States bound to exact record versions, with source time and owned impact follow-up | Does not silently reschedule, re-credit or re-close anything downstream |

## 2. Exact sources and reused work

Based on `main` at **`0769a16dd842e9dc1c349a853036ab71949e7807`** (16 September 2026, merge of #209). Open PRs #210, #211, #212 and #213 at that point touch Estimating and notification scope only; none overlaps SC-08, Supply Chain or Warranty, so no concurrent contribution was rebased or displaced.

| Source | What was read | How it was used |
|---|---|---|
| [Coverage register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | SC-08 entry: title, placement, family, reviewer, entities, authority, priority, dependency on SC-04, parents SCM-01–08, checks | Fixed the page scope, the dependency on SC-04 and the three recorded checks used in §12 |
| [Supply Chain readiness receiving contract](../../../contracts/supply-chain-readiness.md) (PPO-013-READINESS r01) | SCM-01–08 bounded receiving facts, invariants, quantity conservation, incompleteness rules, fictional acceptance cases | Supplied the quantity, completeness and observation discipline, and the *carrier arrival is not an ERP receipt or usable stock* rule reused verbatim in behaviour |
| [Supply Chain Material Readiness r03](PPO-Supply-Chain-Material-Readiness-r03.html) | Its four views, and the received / quarantined / usable vocabulary, receipt and inspection references, demand, supplier and item fixtures | SC-04 receipt and quarantine concepts reused rather than reinvented; its damaged-fan-guard case (`SYN-PPO-RC-028`, `SYN-PPO-INS-028`, demand `SYN-PPO-MD-004`) is the origin of return `SYN-PPO-RET-0902` |
| [Warranty & Customer Resolution r01](../warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html) and its [decision](../../../decisions/warranty-customer-resolution-design.md) | MA-06 coverage decision, MA-07 recovery context, the retained replacement result, and the recorded statement that *future SC-08 owns a separately implemented return/claim/credit workflow* | Supplied the incoming handover: `SYN-PPO-RET-0903` receives the removed Willowbank pump and **adopts** claim identity `SYN-WAR-CLAIM-090101` instead of creating a second claim |
| [Theme style board r20](../theme-style-board/powerplants-one-theme-style-board-r20.html) | Register/worklist, detail workspace and review/comparison patterns, tokens, snapshot cells, tables, pills, dialogs | The entire component layer; `workspace.css` is the Warranty r20 composition re-scoped to `#ppo-returns`, plus SC-08-specific composition |
| [Customers, Sites & Growing Areas r03](../customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) | Customer, site and growing-area identity shape | Customer 360 link target and the `site` / `siteId` fields on every return |
| [Equipment & Installed Base r02](../equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html) | Asset identity, successor identity, installation/commissioning separation | Equipment and successor-equipment links on `SYN-PPO-RET-0903`; the rule that a replacement never inherits dates |
| [Work Orders r01](../service/PPO-Work-Orders-Workspace-r01.html) | Authorised work identity | `workOrder` source reference and the repair-remedy workflow target |
| [Finance & Commercial Controls r02](../finance/PPO-Finance-and-Commercial-Controls-r02.html) | Restricted financial visibility, no-posting and correction journeys | The Finance-only credit view, the restriction model and the *no posting here* boundary |
| [My Work & Action Centre r01](../my-work/PPO-My-Work-and-Action-Centre-r01.html) | Source-owned actions rather than duplicated task lists | Every follow-up carries kind, owner and due date so a single shared Activities/My Work feed can render it without a second obligation |
| [BP-01 master blueprint](../../../blueprints/BP-01-master-blueprint.md) | SCM-01–SCM-08 parent scope | Parent traceability in §1 |

**Adjacent module that does not exist.** *Order fulfilment and customer delivery* is **SC-05 (stock availability and reservations), SC-06 (picking and dispatch preparation) and SC-07 (customer delivery and proof of delivery)*. All three are state **N** in register r06 and **no HTML design for them exists on `main` or on any open branch at the source commit.** The original delivery, the replacement order and any outbound dispatch are therefore treated as a **named receiving boundary** in this contribution. The workspace states this explicitly in its Linked workspaces dialog rather than linking a page that does not exist, and the remedy form offers *Order fulfilment & customer delivery* as a receiving workflow label, not as a link.

## 3. Workspace composition and navigation

Module-only. There is no second application shell and no left navigation rail; the page is built to sit inside the existing shell.

- **Workspace header** — eyebrow (`Supply Chain / Returns & recovery`), title, the central question as the standing subtitle, a page-guide icon button and Preview options.
- **Environment strip** — synthetic marker, revision, the active preview role and company scope, and a live `role="status"` save indicator.
- **Tab strip** — six views, arrow/Home/End keyboard navigation, `aria-current="page"` on the active view, horizontally scrollable at phone width with 44px targets.
- **Recovery banner** — appears only when a save outcome is unknown or local storage is unusable.
- **Context bar** — selected return, direction, company, party, site and warehouse; the three most consequential states as pills; owner and due date; Linked workspaces and Assign next review.
- **Content** — the selected view.
- **Dialog** — every decision form, with a sticky footer, an inline `role="alert"` error region, unsaved-change confirmation and focus return to the invoking control.

The six views and the r20 pattern each uses:

| # | View | r20 pattern | Answers |
|---|---|---|---|
| 1 | Returns register | Register / worklist | Which returns exist, in which direction, and what is outstanding on each of four separate axes |
| 2 | Return authorisation | Detail workspace + focused form | What exactly was requested, what was authorised, on what quantities, under what conditions, and how the goods will travel |
| 3 | Receipt & inspection | Detail workspace + mobile capture form | What physically arrived, in what condition, with what evidence, and what the inspection actually found |
| 4 | Disposition & customer outcome | Review / comparison | What is proposed for each received quantity, what was approved, what was executed, and what the customer received and accepted |
| 5 | Supplier claims | Worklist + detail workspace | What was claimed, what the supplier said, what physical return is required, and what remains unresolved |
| 6 | Credits & reconciliation | Review / comparison | What credit was requested, approved, issued, applied or refunded, on each side, and what differs |

## 4. Detailed feature inventory

### 4.1 Returns register

**Snapshot cells (4).** *Returns in scope* (count, with the company scope and source completeness named), *Awaiting movement*, *Held or unidentified*, *Recovery or credit open*. Each cell is a button that sets the matching filter, so it opens exactly its contributing records — verified by comparing the cell count with the resulting row count. For any role other than Finance the recovery cell's subtitle reads *Counts only · amounts restricted*.

**Filters.** Free-text search; direction (customer/supplier); reason (the seven recorded reasons); owner; site or warehouse; outstanding action (awaiting movement, held or unidentified, customer outcome open, recovery or credit open); and order (next review date, party, reference). Company scope is deliberately **not** a register filter — it is a Preview-options scope switch, because in the application it is a server-enforced permission boundary rather than a user convenience.

**Columns (6).**

1. **Return / party** — title, reference, direction, party, company, external account, site and warehouse. A left border colours inbound (customer) and outbound (supplier) returns differently.
2. **Source & links** — source order or purchase order; delivery, inbound receipt or service result; linked case or warranty case; source completeness and reason.
3. **Items and quantities** — per line: requested, authorised, and received (customer direction) or held (supplier direction).
4. **Separate states** — four pills, one per axis: **Return**, **Inspection**, **Customer**, **Financial**, plus a fifth **Recovery** line. These are computed independently; none is derived from another.
5. **Owner / next action** — owner, due date and the single most consequential next action.
6. **Open**.

**Result count line** states rows of total, the scenario date, and whether financial amounts are visible for the active role.

**Empty state** offers Clear filters. Partial, loading, failed, empty and denied reads each render their own state and never render as a complete empty result.

### 4.2 Return authorisation

**Source lines table** — item, code, source line reference, reported condition, identity (Verified / Unverified) with the recorded serials or an explicit *No serial or batch recorded*, then delivered, requested, authorised, received (or held), inspected and executed as separate numeric columns.

**Source freshness strip** — observation time, Complete/Partial/Unavailable, company, currency and tax basis.

**Quantity position per line** — a nine-rung ladder: delivered, previously returned, requested, authorised, received or held, inspected, quarantined, disposition planned, disposition executed. The card header states how much remains available to authorise.

**Previous returns and credits** — previously returned quantity, previously credited quantity with its ERP reference and the sourced decision that permitted it. On `SYN-PPO-RET-0901` one unit was credited without a physical return under decision `SYN-PPO-RETPOL-002`; the workspace shows this whenever another request on that line is assessed, and **does not deduct it** from what may be authorised. A credit is not a return.

**Authorisation form** — source line; Authorise or Decline; authorised quantity; requested remedy; authorised scope; conditions and handling; valid-from and valid-to dates; optional external authorisation number; and the authorisation basis. The decision stored is derived, not typed: an authorised quantity below the outstanding requested quantity is recorded as **Partially authorised**.

**Authorisation history** retains every decision with its reference, authorised lines, requested remedy, external number, validity window, conditions, actor and time. Nothing is overwritten.

**Collection and dispatch arrangements** — arrangement type, sender, receiving location, receiving contact, carrier reference, packaging and handling instructions, and the window. The card footer states that an arrangement is a plan: no transport is booked and nothing is received by recording it.

**Identity gap** on a line renders as a danger panel with the explicit statement that identity is not inferred from a similar description or from the order line.

### 4.3 Receipt & inspection

**Retained receipts** — for each receipt: reference; date, time and the receiving timezone stated in full (`Australia/Sydney (AEST, UTC+10)` or `Pacific/Auckland (NZST, UTC+12)`); receiving location; receiving person; packaging condition; item condition; per-line expected, captured and effective quantities with serials read; evidence chips (photograph, document or measurement references); any retained corrections; the capturing actor and the actual save state of the capture.

**Receipt capture form (mobile-friendly)** — authorised line; receipt reference; date; local time; timezone; location; received-by; quantity physically received shown beside a disabled *Expected* field; serial or batch references read; packaging condition; item condition as received; evidence type, reference and note; and a receipt note. Quantity fields are right-aligned with tabular numerals and stay at least 60 × 38 px at 390 px width; every dialog control keeps a ≥38 px touch target.

Receiving fewer units than authorised reports the outstanding balance and does not assume the balance is lost. Receiving more reports the excess and directs it to receiving evidence rather than assigning it.

**Receiving anomalies** — missing, excess, incorrect or unexpected goods, each with description, quantity, supporting evidence, an owner, a due date and a state of Unresolved, Identified or Retained unidentified. An unexpected item is **retained as unresolved receiving evidence** and cannot be assigned to an order; resolving it requires an explicit identification decision that records its own evidence, basis, actor and time. `SYN-PPO-RET-0904` seeds exactly this case.

**Inspection findings** — inspection reference; inspected and quarantined quantities; **reported symptom**, **observed damage**, **suspected cause** and **verified finding** as four separate fields, with verified finding allowed to stay empty; measurement or method; quarantine hold reference and location; owner and follow-up date; findings narrative; actor and time. `SYN-PPO-RET-0903` seeds an inspection whose verified finding is deliberately `null`.

**Quantity reconciliation** — awaiting receipt, awaiting inspection and awaiting disposition, stated as totals across all lines of the return in the line unit, with an explicit note that lines are never converted into one another.

**Correction history** — every correction shows the original captured value struck through, the corrected value, the reason, the actor, the time and the predecessor correction or receipt. The original receipt record, including its photographs and serials, is never mutated; corrections are appended and the effective quantity is the last correction.

### 4.4 Disposition & customer outcome

**Quantity reconciliation** — the per-line ladder plus the awaiting cells, then a category grid listing, for every disposition category actually used, the executed quantity and separately the quantity *planned and not yet executed*. Planned and executed are never added together. The footnote states that categories are mutually exclusive once executed and that a quantity can be proposed only from what has been inspected and not already planned or executed.

**Disposition categories demonstrated** — return to usable stock; remain quarantined; repair or further investigation; replacement through the responsible fulfilment or service workflow; return to supplier; disposal; other authorised disposition. The sidebar states that each category requires its own source policy and authority, and that this design demonstrates the categories without adopting a disposal, restocking or scrap policy.

**Proposed and reviewed dispositions** — each record shows its exact lines, quantities and categories; the proposal basis, actor and time; the approval with its authority reference, actor and time, or *Not approved*; and the execution evidence with its type, reference, date and note, or *Not executed*. Proposal, approval and execution are three separate records, and the reviewer who proposed a disposition cannot approve it.

**Customer remedy** — remedy type (replacement, repair, customer credit, or an evidenced decision that no further remedy is required), the receiving workflow it belongs to, its reference, its state, its basis, its owner and due date. The footer states that a replacement preserves the original item identity, links the separately identified successor, and never transfers installation, commissioning, warranty dates or maintenance obligations. SC-08 does not recreate warranty entitlement or goodwill: on `SYN-PPO-RET-0903` the MA-06 decision and its exact scope are referenced, not re-decided.

**Customer communication and acknowledgement** — the exact retained content with its revision, recipient, delivery state and SHA-256; an export of the exact bytes; and the customer response with its status, presentation evidence reference, response date, commitment owner and due date. Approval, issue, presentation and acknowledgement stay distinct. New content creates a new revision and requires a new acknowledgement; the earlier one is not inherited. Restricted credit and claim amounts are refused in customer content.

**Customer outcome** — resolution requires a completed remedy **or** a confirmed evidenced decision that no remedy is required, acknowledgement of the exact current content, and no open customer commitment. The card footer always states the current recovery state, so a resolved customer outcome visibly does not close supplier recovery.

### 4.5 Supplier claims

**Claim position** — claimed, accepted, unresolved scope and physical-return requirement in a four-cell grid, then claim reference; **claim identity** stated as either *Created in this workspace* or *Adopted from …, the same claim, not a second one*; supplier and supplier account; external supplier reference; reason; claimed scope by line and quantity; the serials recorded on the line; currency and tax basis; recovery owner and due date; submission evidence or *Prepared locally — not submitted*; and the SHA-256 of the exact claim package. The exact package is inspectable.

**Prepared is not submitted.** A claim exists locally with no submission until external submission evidence is recorded, and the footer says so. `SYN-PPO-RET-0906` seeds a prepared, unsubmitted claim.

**Supplier questions and responses** — every response retained with status (awaiting response, more information, accepted, partially accepted, rejected, disputed), accepted amount, accepted quantity, supplier evidence reference, response date and recovery owner. Partial acceptance must be greater than zero and less than the claim; a pending, rejected or disputed response cannot declare an accepted amount; full acceptance must equal the claim exactly. Accepted, rejected, disputed and unresolved scope are separate.

**Required physical return** — requirement (Required, Not required, Unknown), the source of that requirement, and each movement with its type, reference, date and note. A supplier may accept a remedy before receiving goods, and may waive a physical return under its own sourced decision — `SYN-PPO-RET-0906` carries `SYN-FIELD-DEC-0091` doing exactly that — but neither is assumed as a general rule, and a recorded physical movement cannot be replaced by a later *Not required* decision.

**Recovery worklist** lists every return with a claim, its recovery state and its unresolved amount, or *unresolved scope unknown until the supplier responds*, or *unresolved amount restricted* for a non-Finance role.

**Customer position** sidebar shows the customer outcome, the remedy and whether a customer commitment is open, with the standing statement that customer resolution never waits invisibly on supplier recovery.

**Shared claim identity.** A claim reference that already exists anywhere in the workspace is refused with an instruction to open the existing claim. `SYN-PPO-RET-0903` adopts `SYN-WAR-CLAIM-090101` from MA-07 and records its own physical-return and receiving evidence against that same identity, so the Warranty view and the SC-08 view open one claim and one obligation.

### 4.6 Credits & reconciliation

**Restricted for every role except Finance.** A non-Finance role sees a stated restriction, the counts of customer and supplier credit records so coordination can continue, and nothing else — no amounts, no ERP references, no applications and no differences. The restriction also covers register search text, snapshot figures and the receiving-context export.

**Summary grid (5)** — customer requested, customer issued, supplier requested, supplier issued, differences open. A total is stated only when the contributing records support it: an empty list reads *No record*, an unissued credit reads *None issued*, and any unknown or incomplete source reads *Unknown for N of M*. Zero is never used to stand in for unknown.

**Customer credits and supplier credits are two separate cards.** Each credit shows related lines; related invoice; related claim; requested, internally approved and issued-in-ERP amounts; ERP reference; company and account; currency and tax basis; applications, reversals and refunds; the source observation time; source completeness; the sourced decision where a credit exists without a physical return; owner and due date; and its basis note.

**Credit states** — Requested, Internally approved, Issued in ERP, Applied, Refunded, plus Disputed and Unknown. Progression through the first five is strictly ordered; an issued credit needs an internal approval and cannot exceed it; only an issued credit can be applied or refunded; an ERP reference cannot be linked to two credit records anywhere in the workspace. **Unknown** sets completeness to Unavailable and renders as *Unknown — no confirmed ERP credit*, with a standing warning that the state is not zero, settled or rejected.

**No netting.** A standing note states that customer and supplier amounts are shown side by side and are not netted, that no adopted financial definition exists in this prototype for netting a customer credit against supplier recovery, and that no difference between them is described as a loss. The model exposes no netting function at all.

**Differences requiring investigation** — expected amount, amount reported by the source (or *Unknown — the source did not report an amount*), owner, due date, description, actor and time.

**Source freshness** sidebar lists the return's observation time and completeness and then each credit's own completeness and observation time.

## 5. Return directions, source-line identity and quantity relationships

**Two directions, never one movement.** A customer return is collected and received inbound; a supplier return is dispatched outbound. They are linked and never merged. `SYN-PPO-RET-0901` (customer, Northbank) and `SYN-PPO-RET-0902` (supplier, Ventra) are separate records with separate authorisations, movements, claims and credits, and the register's state vocabulary differs by direction: *Awaiting receipt / Partially received / Received* against *Awaiting dispatch / Dispatched to supplier / No physical return required*.

**Source-line identity.** Every return line carries its source line reference, item, code, unit, serials and an explicit identity state. Names and descriptions are never identity. An unread serial stays unread.

**The quantity ladder and its invariants.**

| Rung | Definition | Invariant |
|---|---|---|
| Delivered | Quantity on the source line | Fixed by the source |
| Previously returned | Quantity already returned on that line | Reduces what may be authorised |
| Previously credited | Quantity already credited, with its ERP reference and sourced decision | **Visible, never deducted** — a credit is not a return |
| Requested | What the customer or buyer asked for | May exceed what is authorisable |
| Authorised | Sum of authorisation allocations | ≤ delivered − previously returned |
| Received (or held) | Sum of receipt lines, after corrections | May fall short of or exceed authorised; both are explicit |
| Inspected | Sum of inspection records | ≤ received |
| Quarantined | Subset of inspected that is held | ≤ inspected |
| Disposition planned | Proposed + approved, not executed | Shown separately from executed |
| Disposition executed | Executed with evidence | planned + executed ≤ inspected |

Awaiting receipt, awaiting inspection and awaiting disposition are derived from these and are never negative. Concurrency is controlled twice: an optimistic version check rejects a stale form, and the remaining-quantity check rejects a fresh attempt that would over-commit the same quantity.

## 6. Inspection, quarantine, disposition and stock boundaries

Six facts are kept separate, and none establishes another:

1. **Return authorisation** — a decision. It does not collect, receive, make usable or credit anything.
2. **Physical receipt** — the goods arrived. It is not an ERP receipt.
3. **ERP receipt confirmation** — reported by its own source. It is not stock availability.
4. **Inspection completion** — the condition is known. Returned items are not made available for allocation because they arrived or because an inspection finished.
5. **Disposition execution** — the source system that performed the movement reported evidence. PPO observes it and does not post it.
6. **Usable stock** — owned by the authoritative inventory source, not by this workspace.

Quarantine reuses the SC-04 concept from Material Readiness r03: a quarantine reference and location, with quarantined units excluded from anything usable. Split receipts and line-level findings are supported throughout.

## 7. Customer remedy, warranty and supplier-recovery relationships

- The **remedy** is performed by its own workflow — a replacement order under order fulfilment and customer delivery, repair work under a service work order, a customer credit under Finance, or an evidenced decision that no remedy is required. SC-08 links and tracks; it does not create.
- **Warranty entitlement and goodwill are not recreated.** Where a return arises from a warranty case, the MA-06 decision is referenced with its exact scope and evidence. `SYN-PPO-RET-0903` carries the warranty case and the warranty claim identity and adds only the physical and receiving facts that MA-06 explicitly handed over.
- **Replacements** preserve the original item and asset identity, link the separately identified successor, retain serial and configuration history, and keep installation, commissioning and warranty dates distinct. No new warranty term is inferred and no maintenance obligation transfers.
- **Customer communication evidence** and any unresolved commitment are recorded separately from the operational completion of the remedy. A remedy can be complete while the customer outcome is still open.
- **A customer outcome may be complete while supplier recovery is open,** and the design shows both at once: `SYN-PPO-RET-0903` is seeded as *Customer Resolved · Recovery Awaiting response*, and the `SYN-PPO-RET-0901` walkthrough reaches *Customer Resolved · Recovery Partially accepted*.

## 8. Customer and supplier credit definitions and reconciliation

| Term | Definition used here | What it is not |
|---|---|---|
| Credit requested | An internal request with an amount, currency, tax basis, related lines and an owner | Not an approval |
| Internally approved | A reviewed approved amount, ≤ requested | Not a posted credit |
| Issued in ERP | A source-reported credit reference exists, with an amount ≤ the approval | Not proof that it has been applied |
| Applied | The issued credit is recorded against an invoice or account | Not a refund |
| Refunded | Settled by a separate refund reference | Not the same as applied |
| Disputed | The amount or reference is contested | Not zero |
| Unknown | The source is unavailable or the reference was not found | **Not zero, not settled, not rejected** |

Customer credit and supplier credit are separate record collections. Their amounts, currencies, tax basis and timing are not assumed to match; `SYN-PPO-RET-0905` holds an NZD customer credit against the `SYN-PPO-NZ` company while every other record is AUD against `SYN-PPO-AU`, and nothing converts between them. Supplier agreement is evidence of a claim outcome and never creates a credit record by itself. Returns without credits and credits without physical returns appear only with an explicit sourced decision reference and the Finance role. No adopted financial definition exists for netting, so nothing is netted and no difference is labelled a loss.

## 9. Permissions, source freshness and completeness

**Proposed capabilities.** These are design proposals. They assign no authority to any employee, and the HTML authenticates nobody.

| Preview role | Synthetic actor | Proposed capability |
|---|---|---|
| Returns coordinator | Robin Ellis | Authorisation, arrangements, identification, remedy links, customer communication, acknowledgement, customer outcome, follow-ups, ownership |
| Receiving operator | Jordan Lee | Physical receipt capture, receiving anomalies, corrections, follow-ups |
| Inspection reviewer | Alex Morgan | Inspection findings, quarantine, identification, disposition proposals, corrections, follow-ups |
| Supply Chain lead | Priya Nair | Disposition approval and execution evidence, proposals, follow-ups, ownership |
| Supplier recovery owner | Sam Patel | Claims, submission evidence, supplier responses, physical-return requirement and movements, follow-ups |
| Finance reviewer | Taylor Reed | Customer and supplier credits, credit states, differences, follow-ups |
| Read-only staff | — | Permitted preview, no change |
| No record access | — | Nothing |

**The application must enforce this on the server**, together with company and site scope. Role and scope switching in the HTML is a demonstration of intent, not an access control.

**Restricted detail.** Financial amounts, ERP references, applications and differences are visible only to Finance. The restriction is applied at the source of disclosure, not only at the point of display: the register's search string is built without financial values for non-Finance roles, snapshot subtitles say *Counts only · amounts restricted*, the recovery column and worklist say *unresolved amount restricted*, and the receiving-context export replaces the credit block with a restriction statement and omits claim amounts.

**Freshness and completeness.** Every return declares its source observation time and a Complete / Partial / Unavailable completeness, shown on the authorisation and receipt views and in the register. Every credit carries its own observation time and completeness. `SYN-PPO-RET-0904` is seeded Partial. A Partial read renders a standing banner stating that counts, quantities and financial figures apply only to the visible records.

## 10. State transitions, corrections, concurrency and recovery

**Five independent state axes** — return, inspection, customer outcome, financial, recovery — each computed from its own records. They are displayed side by side in a four-cell axis grid plus the recovery line, so no single "status" can hide a divergence.

**Corrections** are appended, never destructive. The original capture, its author, time, photographs, serials and predecessor are retained and rendered with the superseded value struck through. A correction cannot reduce a received quantity below what has already been inspected.

**Concurrency.** Every command carries an operation identity and an expected version. A stale form is refused with its values retained; a fresh attempt that would over-commit a quantity is refused with the exact remaining quantity in the message. There is no last-write-wins path.

**Original-operation recovery.** Every accepted command writes a receipt keyed by its operation identity. Replaying the same operation returns the original result and makes no second change; replaying it with different content or under a different role is refused. The Preview options can inject a lost confirmation, after which the workspace refuses further changes until the original operation is reconciled. **A failed lookup is not proof that the original action did nothing**, so the workspace reconciles rather than retrying blind.

**Failure modes demonstrated** — stale record versions during review; concurrent attempts on the same quantity; a previous partial receipt, disposition or credit; validation failure; storage failure before saving; a lost confirmation after a consequential submission; partial or unknown external outcomes; customer, company and identity switching; and access changes during an open workflow (switching to a read-only or denied role mid-flow removes the actions and the context without corrupting the record).

**Capture save state.** Every receipt shows the actual save state of its capture, and the environment strip shows whether anything is saved, needs recovery, or has unusable local storage.

**Shared follow-ups.** Every follow-up carries a kind (Customer, Receiving, Inspection, Disposition, Supplier, Finance), an owner and a due date, so a single shared Activities/My Work feed can render it. The workspace creates one follow-up per obligation and never duplicates an obligation across the return, warranty, claim and Finance views.

## 11. Synthetic demonstration journeys

All six returns are fictional. Customers, suppliers, items, part codes, references, serials, amounts and dates are invented; the Material Readiness r03 and Warranty r01 fixtures they build on are themselves synthetic.

| Return | Direction | Party | Demonstrates |
|---|---|---|---|
| `SYN-PPO-RET-0901` | Customer | Northbank Glasshouses · `SYN-PPO-AU` | Journeys 1, 3, 5, 6, 7, 9 — damaged after delivery, partial authorisation with a previously credited unit visible, two collections, split disposition, partial supplier acceptance, customer credit confirmed while the supplier credit is unconfirmed, lost-response recovery |
| `SYN-PPO-RET-0902` | Supplier | Ventra Horticulture | Journey 8 — a supplier-reported credit note for AUD 580.00 against an accepted AUD 640.00, whose reference the fictional ERP read cannot find; the state stays Unknown and a difference is retained |
| `SYN-PPO-RET-0903` | Customer | Willowbank Horticulture | Journey 2 — the MA-06 warranty removal received and held, customer outcome **Resolved** while recovery is **Awaiting response**, on an **adopted** MA-07 claim identity |
| `SYN-PPO-RET-0904` | Customer | Greenridge Nursery | Journey 4 — an unexpected filter service kit retained as unresolved receiving evidence, and a controller whose serial label is abraded and stays unidentified until an explicit decision |
| `SYN-PPO-RET-0905` | Customer | Bayview Nursery · `SYN-PPO-NZ` | Journey 10 — a different company, a different warehouse, NZD amounts and no cross-company leakage |
| `SYN-PPO-RET-0906` | Supplier | Fieldline Pumps NV | A prepared, unsubmitted claim, and a supplier waiving the physical return under sourced decision `SYN-FIELD-DEC-0091` |

### Recommended review walkthrough

The page guide reproduces this. Steps 1–8 are performed on `SYN-PPO-RET-0901`.

1. **Return authorisation** — authorise **3** of the 4 substrate sensor kits requested. The previously credited unit stays visible and is not deducted. The decision records itself as *Partially authorised*.
2. **Receipt & inspection** (Receiving operator) — record the first collection of **2** units, then a second of **1**. The return state passes through *Partially received* to *Received*.
3. Correct a captured quantity and correct it back. Both corrections are retained with the original capture intact.
4. **Inspection** (Inspection reviewer) — inspect 3 units, quarantining 2. Reported symptom, observed damage, suspected cause and verified finding are four separate values.
5. **Disposition** — propose 2 units for return to the supplier and 1 for usable stock. Switch to the Supply Chain lead to approve, then to record execution evidence. The other proposal remains untouched.
6. **Customer outcome** (Returns coordinator) — link the separately authorised replacement `SYN-PPO-SO-0233`, prepare the customer update, record *Reservations* (which creates an owned commitment), complete it, record *Accepted*, then record the customer outcome.
7. **Supplier claims** (Supplier recovery owner) — prepare the claim, record submission evidence, record a *Partially accepted* response. The context bar now reads *Customer Resolved · Recovery Partially accepted*.
8. **Credits** (Finance reviewer) — record the customer credit and move it Requested → Internally approved → Issued → Applied; record the supplier credit and set it Unknown; record a difference. Nothing nets.
9. Open `SYN-PPO-RET-0902` for the unmatched ERP reference and `SYN-PPO-RET-0904` for the unexpected item and the unread serial.
10. In Preview options, switch the company scope to `SYN-PPO-NZ` for isolation, or inject a lost confirmation to exercise original-operation recovery.

### Proposed policies, clearly marked as proposals

These are prototype choices made to keep the demonstration coherent. None is corporate or MYOB policy, and each is listed in §14 as an open decision.

- A previously credited quantity is visible but not deducted from what may be authorised.
- The reviewer who proposes a disposition may not approve it.
- One retained claim identity per return in this bounded design.
- Credit states progress strictly in order, and only Finance may record them.
- A recorded physical movement cannot be replaced by a later *Not required* decision.
- Customer content may not contain restricted credit or claim amounts.

## 12. Incoming and outgoing handovers

**Incoming.**

- **From Warranty (MA-06/MA-07).** The removed asset, the service result reference, the warranty case, and the claim identity. MA-06's recorded statement that *future SC-08 owns a separately implemented return/claim/credit workflow* is the authority for this contribution's scope. SC-08 adds the physical and receiving facts and re-decides nothing.
- **From Supply Chain Material Readiness (SC-01–SC-04).** Inbound receipt, inbound inspection, quarantined quantity and the affected demand for a supplier return.
- **From order fulfilment and customer delivery (SC-05–SC-07).** The source order, delivery and proof-of-delivery references. **This module does not exist yet**; the references are carried as recorded values and the boundary is named in the workspace.

**Outgoing.**

- **To the authoritative inventory source (MYOB Acumatica, intended).** Executed disposition evidence is *observed*; PPO does not post a movement, and no MYOB endpoint, transaction type or field is invented.
- **To Finance.** Credit records with their state, source observation time, completeness, differences and owner. No transaction is created.
- **To order fulfilment / service.** Replacement and repair remedy references. SC-08 does not create the order or the work.
- **To Customer 360, Equipment and Projects/Service.** Party, site, asset, successor asset, project and work-order references as recorded links.
- **To shared Activities / My Work.** Follow-ups with kind, owner and due date.
- **Receiving-context export.** A labelled synthetic JSON export of the return, its lines with every quantity rung, its five states, dispositions, remedies, claim and credits, with the credit block replaced by a restriction statement for non-Finance roles. It is explicitly labelled as carrying no implemented receiving API or import contract.

## 13. Mobile and accessibility behaviour

- **Responsive.** Verified with no horizontal overflow at 1440, 1024, 820, 390 and 320 px on all six views. The register table becomes labelled cards below 600 px; line tables do the same; snapshot cells go to two columns then one; the state-axis grid goes four → two → one; the money grid five → three → two.
- **Mobile capture.** The receipt dialog keeps its quantity fields at least 60 × 38 px at 390 px and every dialog control at ≥38 px, verified by measuring the rendered boxes rather than by inspection.
- **Filters.** At ≤390 px every toolbar select is measured against its own rendered option text; no filter is clipped.
- **Keyboard.** A skip link that becomes visible on focus and moves focus to the content region; arrow, Home and End navigation across the tab strip; Escape closing the dialog and returning focus to the invoking control; unsaved-change confirmation before discarding a form; visible focus rings on buttons, inputs, selects and the search box.
- **Announcements.** The save status is a live `role="status"` region; form errors are a `role="alert"` region; the toast is a live region.
- **Readable wording.** Operational language throughout, Australian English, dates as *16 Sept 2026* in prose and ISO in the data, AUD or NZD with the tax basis shown, and synthetic context declared in the header, environment strip and footer.
- **Print.** Header, tabs, environment strip, footer, buttons and toast are hidden; the two-column layouts collapse; cards avoid breaking across pages.
- **Known browser behaviour.** Native `<input type="date">` renders in the *browser's* locale, not the page's `lang="en-AU"`. In the captures, which were taken in a container whose Chrome locale is `en-US`, the date placeholder reads `mm/dd/yyyy`. The stored value is always ISO. This is browser behaviour, not a design choice, and the application will need an explicit decision on whether to use a native date input or a controlled one.

## 14. What works in the HTML versus future application requirements

**Works now, in the standalone file.** All six views; every filter, snapshot, sort and search; every decision form with its validation; the quantity ladders and reconciliation; corrections with retained originals; identification decisions; proposal/approval/execution separation; remedy links; exact content with SHA-256 and export; acknowledgement and customer outcome; claim preparation, submission evidence, supplier responses and physical-return requirements; credit states, differences and restriction; role and company-scope switching; read states; fault injection with original-operation recovery; local persistence, backup export and reset; URL state for view, return, filters and sort.

**Required from the application, not demonstrated here.**

1. Server-enforced permissions and company/site scope on every read and write, including the restricted financial projection.
2. Real source contracts for order, delivery, invoice, purchase order, inbound receipt, inspection, work order and warranty case, replacing recorded reference strings.
3. Verified MYOB Acumatica configuration and field mappings before any inventory or financial interaction; no endpoint, transaction type, restocking fee, warranty rule, threshold or approval authority is invented here.
4. Durable evidence storage for photographs and documents, with real hashes and retention.
5. Offline field capture with local-save, queued, synced, failed and conflict states, preserving recoverable unsent evidence.
6. A real notification and Activities integration so follow-ups appear once in My Work.
7. Idempotency keys and a durable outbox so a retry cannot produce a duplicate return, claim, replacement or credit effect.
8. Server-side quantity conservation, since the client checks demonstrate intent only.
9. An adopted unit and precision basis; this design permits two decimal places and refuses every implicit conversion.
10. Real customer and supplier communication channels; nothing is sent from this workspace.

## 15. Traceability — requested capability to HTML location and evidence

| Requested capability | Where it is in the HTML | Verification evidence |
|---|---|---|
| Searchable register of customer and supplier returns | View 1, register table and toolbar | Browser group 1, 2; `desktop-register.png` |
| Reference, direction, party, company/entity, external account | View 1, column 1 | Browser group 1 |
| Original order, delivery, receipt and invoice references | View 1 column 2; View 2 *Return context* | Browser group 1 |
| Linked case, warranty claim, equipment, Project/Service record | View 2 *Return context*; Linked workspaces dialog | Browser group 11 |
| Item and quantity summary | View 1 column 3; View 2 lines table | Browser group 1 |
| Return reason | View 1 column 2; reason filter | Browser group 2 |
| Current physical location or custody | View 1 (warehouse); View 3 (receiving location, quarantine hold) | Browser group 6 |
| Return, inspection, customer-outcome and financial states separately | View 1 column 4; the state-axis grid on views 2–6 | Browser group 1 |
| Responsible owner, next action and due date | View 1 column 5; context bar | Browser group 1 |
| Source freshness and completeness | Freshness strip on views 2–3; Source freshness card on view 6 | Browser groups 13, 19 |
| Filters: direction, party, reason, owner, site, warehouse, state, outstanding action | View 1 toolbar and snapshot cells | Browser group 2 |
| Summary cards open the exact contributing records | View 1 snapshot buttons | Browser group 2 (cell count compared with row count) |
| Exact source lines and quantities proposed for return | View 2 lines table and ladders | Model groups 3, 4; browser group 3 |
| Units and serial/batch identity | View 2 lines table; View 3 receipt serials | Model group 11; browser group 7 |
| Reported condition and supporting evidence | View 2 *Reported condition and evidence* | Browser group 3 |
| Reason and requested remedy | View 2 authorisation history | Browser group 3 |
| Authorising decision, actor and scope | View 2 authorisation history | Model group 3 |
| Return reference or external authorisation number | View 2 authorisation history | Model group 3 |
| Collection/drop-off arrangements, sender, receiving location, contact | View 2 arrangements card and form | Fixture `ret-1-arr-1`; form verified in group 3 |
| Packaging or handling instructions | View 2 arrangements; View 3 packaging condition | Browser group 4 |
| Validity dates and conditions | View 2 authorisation history | Model group 3 |
| Customer return separate from any later supplier return | `SYN-PPO-RET-0901` and `SYN-PPO-RET-0902`; direction-aware states | Model group 1 |
| Partial authorisation and partial return | View 2 quantity, View 3 two receipts | Model groups 3, 6; browser groups 3, 4 |
| Previously returned or credited quantities visible | View 2 *Previous returns and credits* | Model group 4; browser group 3 |
| Unidentified item retains an explicit gap and owned investigation | View 3 identity card and anomalies | Model groups 11, 12; browser group 7 |
| Mobile-friendly receipt and inspection flow | View 3 capture dialog | Browser group 21; `390-receipt-capture-dialog.png` |
| Receipt date/time and timezone, location, person | View 3 receipt records and form | Browser group 4 |
| Quantities expected and physically received | View 3 capture row and receipt records | Model group 5; browser group 4 |
| Packaging and item condition; photographs and document evidence | View 3 receipt records | Browser group 4 |
| Missing, excess, incorrect or unexpected items | View 3 anomalies | Model group 12; browser group 7 |
| Inspection findings and measurements | View 3 inspection findings | Model group 9; browser group 6 |
| Quarantine or hold information | View 3 inspection findings | Model group 9 |
| Symptom, damage, suspected cause and verified finding distinct | View 3 inspection findings | Browser group 6 (four distinct values asserted) |
| Physical receipt, inspection, ERP receipt and availability separate | View 3 card footers; §6 boundaries | Model group 5 |
| Split receipts and line-level findings | View 3 receipts and inspections | Model group 6 |
| Unexpected goods preserved as unresolved receiving evidence | View 3 anomalies | Model group 12 |
| Corrections retain the original capture | View 3 correction history | Model group 8; browser group 5 |
| Disposition categories demonstrated | View 4 categories card and proposal form | Model group 10 |
| Proposal, approval and execution separate | View 4 dispositions | Model group 10; browser group 8 |
| Partial dispositions against exact quantities and units | View 4 dispositions and reconciliation | Model group 10 |
| Quantity reconciliation without double-counting | View 3 and 4 reconciliation grids | Model group 10 (planned and executed asserted separately) |
| Customer remedies link to the appropriate workflow | View 4 customer remedy | Model group 13; browser group 9 |
| MA-06 decision reused, not recreated | `SYN-PPO-RET-0903` links; §7 | Model group 2 |
| Replacement preserves identity and dates | View 4 remedy footer; §7 | Model group 13 |
| Customer communication evidence separate from completion | View 4 communication and acknowledgement | Model group 14 |
| Customer outcome complete while recovery open | Context bar and View 4 footer | Model groups 2, 16; browser group 10 |
| Supplier-claim worklist and detailed claim view | View 5 | Browser group 10 |
| Supplier and company/account context | View 5 claim position | Browser group 10 |
| Claim reference and external supplier reference | View 5 claim position | Model group 16 |
| Affected items, quantities, units, serials | View 5 claim position | Browser group 10 |
| Source purchase/receipt references | View 5 claim evidence; §2 | Fixtures `ret-2`, `ret-6` |
| Claimed reason and supporting evidence | View 5 claim position and evidence | Browser group 10 |
| Requested remedy or amount; currency and tax basis | View 5 claim position | Model group 16 |
| Submission evidence | View 5 claim position | Model group 18 |
| Supplier questions and responses | View 5 responses | Model group 18 |
| Accepted, rejected, disputed or unresolved scope | View 5 claim position and responses | Model group 18 |
| Required physical return and its separate movement evidence | View 5 required physical return | Model groups 19, 20 |
| Recovery owner, next action and due date | View 5 claim position and worklist | Browser group 10 |
| Prepared claim distinct from submitted claim | View 5 footer; `SYN-PPO-RET-0906` | Model groups 16, 20 |
| Shared claim identity with MA-07, no duplicate | `SYN-PPO-RET-0903`; claim form | Model group 17 |
| Supplier may approve before receipt, or require no return | View 5 required physical return; `SYN-PPO-RET-0906` | Model group 20 |
| Finance-facing credit review with visibility restrictions | View 6 | Model group 21; browser group 11 |
| Customer and supplier credits kept separate | View 6 two cards | Model group 22; browser group 12 |
| Related return, claim, order and invoice | View 6 credit facts | Browser group 12 |
| Requested / reviewed / ERP reference / source state | View 6 credit facts and states | Model group 22 |
| Company/account and currency | View 6 credit facts | Model group 27 |
| Tax basis and source-defined adjustments | View 6 credit facts | Model group 22 |
| Applications, reversals, refunds | View 6 credit facts | Model group 22 |
| Differences requiring investigation | View 6 differences card | Model group 25; browser group 13 |
| Source observation time and completeness | View 6 credit facts and Source freshness | Browser group 13 |
| Responsible Finance owner and next action | View 6 credit facts | Model group 22 |
| Credit requested / approved / issued / applied / refunded distinct | View 6 credit state meanings and progression | Model group 22 |
| No automatic netting, no loss label | View 6 standing note; no netting function exists | Model group 25 |
| Return without credit, credit without return, only with a sourced decision | View 2 previous credits; View 6 sourced decision | Model groups 4, 28 |
| Unavailable source or missing reference stays unknown | View 6 credit facts and warning | Model group 24; browser group 13 |
| Correction and reversal history retained | View 3 corrections; View 6 applications and history | Model group 8 |
| Proposed capabilities documented, no unconfirmed authority | §9; Preview options note | Browser group 18 |
| Server enforcement stated; HTML switching is a demonstration | Preview options note; View 6 restriction note | Browser group 11 |
| Restricted detail protected in counts, search, snapshots and exports | View 1 search and snapshot, View 6, export payload | Browser group 11 |
| Stale source or return revisions during review | Expected-version check | Model group 30; browser group 23 |
| Concurrent attempts against the same return quantity | Remaining-quantity check | Model group 31 |
| Previous partial receipt, disposition or credit | Ladders and reconciliation | Model groups 6, 10 |
| Validation and storage failure | Inline form error; storage fault injection | Browser group 16 |
| Lost responses after consequential submissions | Recovery banner and original-operation replay | Model group 29; browser group 15 |
| Partial or unknown external outcomes | Unknown credit state; awaiting supplier response | Model groups 2, 24 |
| Customer, company and identity switching | Company scope in Preview options | Model group 27; browser group 14 |
| Access changes during an open workflow | Role switching mid-flow | Browser groups 8, 18 |
| Original operation identities and confirmed results preserved | Operation receipts | Model group 29 |
| Physical observations separate from synchronisation and ERP confirmation | View 3 save state; §6 | Browser group 4 |
| Shared Activities/My Work follow-ups without duplicate obligations | Remaining actions cards on every view | Browser group 9 |
| Ten synthetic demonstration journeys | §11 | Model and browser suites as mapped above |
| Primary journey visible from Customer 360, the delivery and Warranty | Linked workspaces dialog | Browser group 11 |
| Desktop/mobile presentation and keyboard behaviour | All views | Browser groups 20, 21, 22 |

## 16. Verification record

Run from the repository root at `0769a16dd842e9dc1c349a853036ab71949e7807` with the returns package applied.

| Check | Result |
|---|---|
| `python3 scripts/check_foundation.py` | **Passed** — see the [evidence record](../../../testing/evidence/returns-r01/README.md) for the exact counters |
| `python3 scripts/check_prototype.py` | **Passed** — 78 parent dispositions and 29 master decisions unchanged |
| `python3 scripts/check_naming.py` | **Passed** — document register consistent; project instructions within the 8,000-character limit |
| `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | **No match** — no merge-conflict markers |
| `git diff --check` | **Clean** |
| `python3 scripts/build-returns-design.py` then `git diff --exit-code` on the built HTML | **Deterministic** — the committed HTML is exactly what the builder produces |
| `node scripts/check-returns-model.mjs` | **34 of 34 model groups passed** |
| `node scripts/check-returns-browser.mjs` | **23 of 23 native browser groups passed**, no page errors, 33 original captures retained |
| Visual inspection | Desktop register, authorisation, receipt, disposition, claims and credits reviewed at 1440 px; register, receipt, claims and credits reviewed at 390 px and 320 px; the mobile capture dialog reviewed at 390 px |

**Disclosed limits on this run.**

- The browser suite ran against **Google Chrome 141.0.7390.37** in the authoring container. The repository's maintained pin under ADR-0022 is **Chrome 153**, which is what the `returns-design` workflow will use. The results in this report are therefore *one browser version's* results and must be re-read from the pull-request run before being cited as the package's browser evidence.
- The container runs **Node 22.22.2** against the repository's pinned **Node 24.21.0**. The model suite uses Node built-ins only and the browser suite drives Chrome, so neither depends on the runtime version; the CI run remains the authority.
- The database, compiled-application and Playwright project suites were **not** run. They are unrelated to a documentation-and-design contribution that adds no migration, no application code and no dependency.
- No screenshot comparison baseline exists for this new family, so the captures are original evidence for review, not a regression baseline.

## 17. Open decisions and limits

Nothing in this contribution establishes owner acceptance, application delivery, business approval or production readiness. The following remain open and are **not** resolved by this design.

1. **Financial definitions (D-017).** Whether any netting of customer credit against supplier recovery is ever permitted, and if so under what definition and authority. Until adopted, nothing nets and no difference is a loss.
2. **Disposal, restocking and scrap policy.** The categories are demonstrated; the policy, the authority for each and any deduction are not defined.
3. **Restocking or handling deductions.** None is invented. `SYN-PPO-RET-0905` carries a fictional decision record stating that none was agreed for that return.
4. **MYOB Acumatica.** Every inventory and financial interaction awaits verified configuration, endpoints and field mappings. Nothing here may be read as an interface specification.
5. **Order fulfilment and customer delivery (SC-05–SC-07).** Not designed. The source and remedy references are boundaries, not integrations.
6. **Operational ownership.** Which department owns the returns coordinator, receiving operator, inspection reviewer, Supply Chain lead, supplier recovery and Finance capabilities is proposed only; no employee is assigned.
7. **Unit and precision basis.** Two decimal places, no implicit conversion. A versioned accepted conversion basis is required before any unit conversion.
8. **Observation age.** The readiness contract supplies no threshold for how long a source observation stays usable, and none is invented here.
9. **One claim identity per return.** A bounded design choice. Multi-claim returns need an explicit model decision.
10. **Date input.** Whether the application uses a native or controlled date input, given the browser-locale rendering noted in §13.

## 18. Recommended next bounded application increment

**Build the receipt and inspection capture slice (SC-08-A01) against real server permissions, and nothing else.**

Scope: a server-owned return record with authorisation lines; a physical receipt capture with quantity, serial, condition and evidence references; an inspection record with the four separate observations and a quarantine hold; append-only corrections; and server-enforced company and site scope on every read and write. Out of scope: dispositions, claims, credits and any ERP interaction.

It is the right first increment because it is the point at which the prototype's current design is most likely to be wrong in a way that matters: it needs durable evidence storage, offline capture states, idempotent submission and server-side quantity conservation, and all four are demonstrated only as intent here. It depends on SC-04's receipt and quarantine concepts, which already exist as design, and it produces the record every later SC-08 capability reads. It requires one decision before coding: which existing record — order line, delivery line, inbound receipt line or work order — is the authoritative source line for a return in the first slice.

## 19. Files and maintenance

| File | Purpose |
|---|---|
| [`PPO-Returns-Supplier-Claims-and-Credit-Tracking-Workspace-r01.html`](PPO-Returns-Supplier-Claims-and-Credit-Tracking-Workspace-r01.html) | The issued standalone workspace. Open it directly in a browser. |
| This report | The companion record. |
| [`docs/design/returns/`](../../../design/returns/) | Maintainable source: template, fonts, styles, icons, model and controller. |
| [`scripts/build-returns-design.py`](../../../../scripts/build-returns-design.py) | Deterministic builder. |
| [`scripts/check-returns-model.mjs`](../../../../scripts/check-returns-model.mjs) | 34 model groups. |
| [`scripts/check-returns-browser.mjs`](../../../../scripts/check-returns-browser.mjs) | 23 native browser groups and original captures. |
| [`.github/workflows/returns-design.yml`](../../../../.github/workflows/returns-design.yml) | Runs the builder determinism check and both suites on any pull request touching this family. |
| [`docs/decisions/returns-supplier-claims-credit-design.md`](../../../decisions/returns-supplier-claims-credit-design.md) | Design and receiving handover. |
| [`docs/testing/evidence/returns-r01/`](../../../testing/evidence/returns-r01/) | Exact verification record and retained results. |

Edit the source files, rebuild, run both suites, and update this report and the [design index](../README.md) in the same pull request. Retain r01 once it is accepted as an issued baseline; material design changes use a reviewed successor revision.
