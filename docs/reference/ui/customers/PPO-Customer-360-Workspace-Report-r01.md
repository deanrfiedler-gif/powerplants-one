---
document_id: PPO-CS01-REPORT
title: Customer 360 workspace design report
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed design and detailed companion report; owner acceptance and application integration remain separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# CS-01 Customer 360 — design report

**Design HTML:** [`PPO-Customer-360-Workspace-r01.html`](PPO-Customer-360-Workspace-r01.html) · SHA-256 `d2b21bacfa4b709fcb9e52292b94def8b934414be9e246e4f3167490b9ba8431` · 283,946 bytes, one self-contained file.

**Decision and receiving handover:** [`customer-360-workspace-design.md`](../../../decisions/customer-360-workspace-design.md) · **Reproducible sources:** [`docs/design/customer-360/`](../../../design/customer-360/README.md) · **Evidence:** [`customer-360-r01`](../../../testing/evidence/customer-360-r01/README.md).

---

## 1. Purpose, scope and boundaries

### 1.1 The question the workspace answers

Customer 360 exists to answer one question on one screen:

> **What is happening with this customer, what have we committed to, and what still needs attention?**

The workspace is ordered around that question. The Overview leads with outstanding commitments and owned next actions; recent history sits underneath it, not above it. Every summary drills into the register behind it, and every register drills into a record snapshot that links back to the module that owns the record.

### 1.2 What this is

This is a **standalone interactive HTML design** for **CS-01 — Customer register and customer 360** in the [HTML page coverage register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html), delivered as an extension of the existing **Customers, Sites & Growing Areas** workspace. It is a reviewable design package: a single file that runs in a browser with no server, no build step and no network request.

### 1.3 What this is not

| Not | Because |
|---|---|
| Implemented application functionality | No route, service, database object, migration, adapter or permission is added by this contribution. An HTML design is not an application claim. |
| An accepted UI baseline | The [accepted UI baseline register](../../../standards/ui-baselines.json) is unchanged. This design is **Proposed**. |
| A live MYOB integration | Every ERP interface here is a simulated adapter over fictional data. No endpoint, credential, tenant, company or field mapping has been verified against a real MYOB Acumatica instance. |
| A security boundary | The role switch changes presentation only. The embedded data remains readable in the page source. |
| A second master for any record | Orders, quotations, cases, projects, documents and financial transactions keep their existing owners. Customer 360 reads and links. |

### 1.4 Explicit exclusions

The design provides **no ERP edit, release, cancellation, payment, allocation, shipment or fulfilment action**. It provides no approval, no authorisation and no customer communication. The only change a user can make is an internal Powerplants follow-up note held in browser storage, which alters no source record and is sent nowhere.

Conversion of an accepted quotation into an ERP order is **not** performed here. That work belongs to **ES-07 — One-off item resolution and conversion**, and Customer 360 links to it.

---

## 2. Repository and design sources used

Verified at the start of this session against the live remote.

| Item | Value |
|---|---|
| Repository | `deanrfiedler-gif/powerplants-one` (public) |
| Authenticated account | `deanrfiedler-gif` |
| Default branch head at inspection | `0769a16dd842e9dc1c349a853036ab71949e7807` — *Merge pull request #209 from deanrfiedler-gif/design/my-work-action-centre-r01*, 16 September 2026 |
| Tree at that head | `57e788526e1521b839fd0ec6c2ef6f973d4dd406` |
| Rebase | `main` advanced to `d0a660d21d52cd9128ee996ce2025bf11285a1b8` when **#210 merged** during preparation. This contribution was rebased onto it. `docs/STATUS.md` and `docs/reference/ui/README.md` merged automatically; `docs/standards/document-register.csv` conflicted at the end of the file where both contributions append rows, and was resolved by keeping both sets in order — ES-08's five rows, then CS-01's five. Every repository check was re-run after the rebase |
| Open pull requests at inspection | #210 (ES-08 specialist workbench r02, **since merged**), #211 (SH-03 notification inbox), #212 (ES-05/ES-06 quotation approval and response), #213 (ES-07 item resolution and conversion, based on #212) — all draft at the time of inspection |
| Branches active in the previous fourteen days | The `design/*` families behind #210–#213, plus the merged `design/my-work-action-centre-r01`, `design/quality-site-assurance-r01` and `docs/html-design-index-audit-r01` |
| STATUS position | 14 September 2026 snapshot, with HTML-inventory, Service Review, Quality/Site Assurance and My Work notes appended above it |

### 2.1 Design and contract sources inspected

| Source | Used for |
|---|---|
| [Customers, Sites & Growing Areas r03](PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) · SHA-256 `139938cf…7ae33` | Component vocabulary, embedded Roboto faces, shared choice-card behaviour, organisation → site → facility structure, site-party distinctions |
| [Customers, Sites & Growing Areas design record](../../../decisions/customers-sites-workspace-design.md) and [r02 audit](../../../decisions/customers-sites-workspace-audit-r02.md) | Retained business controls, the workspace-only composition rule, and what r03 already owns |
| [Theme / style board r20](../theme-style-board/powerplants-one-theme-style-board-r20.html) · SHA-256 `c68a499e…9b617` | Palette, typography, control geometry, card radii, picker geometry. Hash confirmed against the file in the repository |
| [HTML page coverage register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | The CS-01 definition, its family, reviewer, entities, parents (CRM-01, CRM-04, CRM-06, SVC-06) and stated checks |
| [HTML design index r02](../README.md) | Where each neighbouring design family lives and what its recorded status is |
| [MYOB integration blueprint r01](../../../contracts/myob-integration-blueprint.md) | ERP identity model, `ErpAccountMapping`, evidence states, synchronisation and recovery rules, journeys J-01–J-05 |
| [PP-01 Finance and customer-account contract](../../../contracts/finance-handoff.md) | FD-01/FD-02/FD-04 account-view rules and the F-01 to F-07 synthetic fixtures |
| [Service data dictionary](../../../contracts/service-data-dictionary.md) | `SYN-PPO-<TYPE>-<sequence>` readable-reference convention and the separation of UUID, reference and external key |
| [Service Cases & Triage r02](../service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html) and its [design record](../../../decisions/service-cases-workspace-design.md) | How cases, work orders and states are already presented |
| [Equipment & Installed Base r02](../equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html) | Asset identity, installed location and served relationships |
| [Service Agreements & Maintenance r01](../maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html), [Warranty & Customer Resolution r01](../warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html) | Maintenance obligations, renewal and the separation of customer outcome from supplier recovery |
| [Projects Gantt r10](../projects/ppo-projects-gantt-content-r10.html) and [Project Delivery Readiness r01](../projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02.html) | Project identity, milestones and change control |
| [Finance & Commercial Controls r02 design record](../../../decisions/finance-workspace-design.md) | Finance visibility limits and what Finance already owns |
| [My Work & Action Centre r01](../my-work/PPO-My-Work-and-Action-Centre-r01.html) | Source-owned action presentation, so an attention item here reads the same way |
| ES-07 design on draft PR [#213](https://github.com/deanrfiedler-gif/powerplants-one/pull/213) | The conversion and recovery boundary Customer 360 links to. **Not on `main` at this head**, so it is referenced as an open contribution, not as an existing repository path |

---

## 3. Relationship to CS-01 and the existing customer workspace

### 3.1 What the register asks CS-01 to be

Register r06 defines CS-01 as: *"Refine the existing customer/organisation screens into a coordinated customer workspace with multiple linked sites. Show permitted site and facility/growing-area counts and View sites; keep the full hierarchy in Sites. Retain legal accounts, operator/owner/bill-payer relationships, linked deals, estimates, projects, service, equipment and communications."* State **D**, priority **P1**, reviewer *CRM / site data steward*, parents **CRM-01, CRM-04, CRM-06, SVC-06**.

This design delivers that description and adds the sales-order dimension the instruction requires as a first-class section.

### 3.2 Division of responsibility with r03

The Customers, Sites & Growing Areas r03 workspace remains the owner of the location detail. Customer 360 does not duplicate it.

| Concern | Owner | How Customer 360 treats it |
|---|---|---|
| Site register, addresses, access, map links, arrival points | **CS-04** in r03 | Site name and address shown in context; a labelled link opens the owning view |
| Facility and growing-area hierarchy, forms, dimensions, history | **CS-05** in r03 | A flat, filtered list per site for context; "Open the full hierarchy (CS-05)" links out |
| Equipment link editing (installed location, served areas) | **CS-05 / EQ-03** in r03 | Location and served areas are shown read-only, with an explicit note that they are different relationships |
| Visit requirements and horticultural readiness | **CS-06** in r03 | Linked, not reproduced |
| Customer identity, relationship owner, contacts, account relationships | **CS-01 / CS-02 / CS-03** | Owned here |
| Commitments across deals, orders, cases, projects, accounts and activity | **CS-01** | Owned here, as a reading view over records other modules own |

The r03 file, its evidence and its check script are **unchanged** by this contribution. So is every other issued design.

### 3.3 Local navigation reconciliation

r03 uses five local tabs: *Customer · Sites · Facilities & areas · Equipment links · Visit requirements*. Customer 360 uses eight: *Overview · Deals & quotations · Sales orders · Cases & service · Projects · Sites & equipment · Accounts · Activity & documents*.

The reconciliation is deliberate:

- r03's **Customer** tab becomes this workspace's **Overview**, widened from counts to commitments.
- r03's **Sites**, **Facilities & areas** and **Equipment links** collapse into one **Sites & equipment** tab that carries enough context to work from, and links out for the detail.
- r03's **Visit requirements** is not repeated; it is reachable from each site's related row.
- The five new tabs are the commercial and service dimensions CS-01 names and r03 does not carry.

Neither file adds a global application shell, brand masthead, navigation rail or global breadcrumb. In the receiving application both are module panels inside one shell.

---

## 4. Reused components and preserved functionality

### 4.1 Carried over unchanged

| Component | Provenance | Treatment |
|---|---|---|
| Embedded Roboto `@font-face` blocks (three faces) | Extracted byte-for-byte from r03 | `docs/design/customer-360/fonts.css`, SHA-256 `57b4aafb…4bef`. No font is fetched at runtime |
| Choice card (`.choice-trigger` + `.rounded-picker`) | The r18/r20 pattern as implemented in r03 | Copied verbatim into `choice.js`: measured height, above/below placement, viewport clamping, type-ahead, Escape and Tab handling, dialog-scoped placement |
| Icon set (57 icons) | r03's `workspace-icons` block | Copied verbatim |
| Design-token block | The r20 Intake profile as resolved in r03 | Reproduced in `:root`; the build script reads the tokens back out of the stylesheet so the metadata cannot drift from it |
| Workspace shell geometry | r03 | One heading, one sticky context row, horizontal local tabs with a green current marker, 32 px gutters stepping down to 16 px |
| Dock, editor and decision dialog shells | r03 | Modeless dock for record snapshots, focused editor for forms, centred decision for explicit boundaries |
| Card, pill, callout, detail-list, toolbar and empty-state vocabulary | r03 | Reused with the same radii, borders and tones |

### 4.2 Added for this workspace

| Component | Why it is new |
|---|---|
| `.summary-tile` | A count with its scope attached and a drill-through target. r03 has no equivalent, and a bare number without scope would be a claim the design cannot support |
| `.attention-item` | The five required facts per item — originating record, reason, owner, due meaning and next action — in one row |
| `.register` / `.register-cards` pair | A desktop table and a phone card list rendering the same matched records, with sticky headers and right-aligned tabular numerals |
| `.chip-bar` | Visible active filters, individually removable, with a clear-all |
| `.source-strip` | Source authority, company, scope, source-as-at, last successful observation and completeness, attached to the data it describes |
| `.quantity-key` / `.lines-table` | Separated order quantities and line detail |
| `.money-block` / `.money-cell` | Amounts with their measure names, so that different measures are visibly different things |
| `.boundary-note` | A labelled receiving boundary in place of a dead button |

### 4.3 Preserved business rules inherited from r03 and the contracts

- Organisation-to-site context follows `SiteParty`; operator, property owner, bill payer and delivery destination are shown separately and none implies another.
- An equipment item has one identity, one physical location and a separate set of served growing areas. Structural containment is not a service grouping.
- A facility or growing area is not an ERP account location or warehouse.
- Readable references (`SYN-PPO-…`, `SYN-MYOB-…`) are display values, not primary keys. UUID, readable reference, label, revision and state remain distinct concepts.
- Blank optional values read *Not recorded* or *Not supplied*, never zero.

---

## 5. The workspace, section by section

Every field group, action, filter and snapshot in the design is listed here.

### 5.1 Workspace frame

| Element | Content |
|---|---|
| Heading | Eyebrow *Customers, contacts and sites*, title *Customer 360*, one-line purpose |
| Meta | `Interactive preview · r01` pill, a live role indicator pill (`<role> · Finance visible|Finance withheld`), and an information button opening the About dock |
| Context row | Organisation glyph and name, *Synthetic customer* note, and the customer choice card |
| Tabs | Eight `role="tab"` controls with icons and a roving tabindex; the set shrinks by role |
| Storage notice | A `role="status"` strip that appears only when browser storage is unreadable or refused |
| Footer note | Synthetic-data statement and the standing MYOB authority statement, on every view |

**Actions:** `about`, `navigate`, customer switch.

### 5.2 Overview

**Identity card** — organisation name, trading name, fictional ABN, customer-since date; relationship owner and role; service coordinator and role; segment; sites. **Contacts in scope**: name, role, responsibility, scoped by the active site filter. **Legal and billing account relationships**: one card per confirmed ERP account showing company, source account name, currency, effective-from date, mapping record and confirming owner; a warning callout for any unresolved source account. **Site party roles**: operator, property owner and bill payer per site.

**Summary tiles** (eight; each states its scope and drills through):

| Tile | Counts | Scope statement |
|---|---|---|
| Open sales orders | Orders with source status *Open* on mapped accounts | How many have outstanding or undetermined supply; active site filter; mapped accounts only |
| Quotations awaiting a response | Issued or sent with no recorded response | Revisions of one quotation count once |
| Accepted, conversion unresolved | Accepted quotations whose conversion outcome is unknown | States explicitly that this is not an existing ERP order |
| Active cases | Cases not in a *Resolved* state | States that a completed visit does not resolve a case |
| Upcoming service visits | Scheduled appointments not yet attended | Active site filter |
| Projects in delivery | Projects without a recorded commercial closeout | Active site filter |
| Maintenance, warranty and renewals | Active agreements plus open warranty cases | States that customer outcome and supplier recovery are separate |
| Customer account observations | Transactions returned for mapped accounts, **or** a *Restricted for this role* state | States that no account balance is derived from the rows |

**Outstanding commitments and next actions** — the attention register. Each item carries the originating record (as a pill), its section, a title, the reason it needs attention, the responsible owner, a dated `Date needed` / `Follow-up due` / `Renewal due` label, one next action naming the owning module, an *Open record snapshot* control, a *Go to …* drill-through, an internal-note count where notes exist, and an *Add internal note* control. The card head states how many items are in scope and how many are at or past their stated date.

**Recent history** — the six most recent activity entries, each with subject, timestamp, type, author, summary and a snapshot control.

**Support column** — *Source freshness and completeness* (one row per relevant observation with its state pill, observed time and error text, plus the standing note that "no records returned", "data unavailable" and "not permitted" are three different results) and *Detailed location and asset views* (four boundary links to CS-04, CS-05, EQ-03 and CS-06).

### 5.3 Deals & quotations

**Quotations register** — quotation reference, revision, state, issued / sent / responded dates, value, conversion state with any linked order, and the next action with its date. Draft, Reviewed, Issued, Sent, Accepted, Declined and Superseded are shown as the source defines them, and a superseded revision displays under its parent reference with an explicit note that it carries no separate commitment.

**Opportunities register** — opportunity, stage, owner, site and area scope, forecast value (or *Not estimated*), next action and date. The caption states that a forecast value is not an order, an invoice or a payment and is never added to them.

**Estimates and alternative options** — one block per estimate with its options table (option reference, description, value, selected/alternative), and a standing note that alternative options are mutually exclusive, are never totalled, and that only a selected option can reach a quotation.

**Filters:** site, facility/growing area, quotation state, owner, date range (quotation issue date). **Search:** opportunities, quotations and responses.

### 5.4 Sales orders — the dedicated section

See §6 for the full information contract.

**Register columns:** ERP order and order type · customer PO and order date · source-reported status, any source-reported hold, and a stale marker · related records (accepted quotation and exact revision, project, service record) · delivery destination (site and linked growing areas) · order amount ex tax with its tax basis · supply progress and the requested/expected dates · observation state with its timestamp.

**Below the register:** amounts stated per currency as separate pills, with the standing note that order amounts, quotation values, invoice amounts and payments are different measures that are never added together, and that currencies and legal companies are not consolidated.

**Unresolved source records** — a separate card, visibly marked *Not counted*, listing orders returned under a source account with no confirmed mapping, with an *Inspect and resolve the mapping (AD-05)* action.

**Accepted quotations that are not orders** — a card listing accepted quotations whose conversion is not complete, with the unknown-outcome explanation and a link to ES-07.

**Filters:** site, facility/growing area, source-reported status, ERP company/entity, ERP account, date range (source order date). Owner is deliberately absent: the source does not supply an owner for an ERP order, and inventing one would be a fabricated field.

### 5.5 Cases & service

One block per case: state pill, case reference, an *Unresolved finding* marker where one exists, title, raised date, owner and date needed; the four separated statements (customer-reported symptom, suspected cause, verified finding, agreed resolution) with a note that they are never merged; and the work-order column showing each authorised work order with its state, title, authorising person and date, each appointment with its state, scheduled time and outcome, the issued service report with its exact revision, issue date, acknowledgement date and acknowledging person, the note that a changed report needs a new revision and does not inherit the acknowledgement, the work order's billing state, the findings list with each finding's state, owner and date needed, and the case's next action.

**Appointments register** — appointment, state, scheduled time, technician, and whether it belongs to a work order or an agreement.

**Maintenance and warranty** — agreement state, coverage wording, next occurrence, renewal due, and the note that the coverage wording is a synthetic example and not an approved entitlement definition; warranty case state, customer outcome, supplier recovery, and the note that neither implies the other.

**Filters:** site, facility/growing area, equipment, case state, owner, date range (raised date). **Search:** cases, symptoms, findings and owners.

### 5.6 Projects

One block per project: state, reference, title, delivery owner, site and exact area scope; completion facts (technical completion, customer acceptance, commercial closeout, next milestone and due date, customer commitments) with the note that the three completion facts are separate; a deliverables table (reference, deliverable, state, due); and a variations table (reference, description, value, state) with the note that variation values are separate commercial items and are not added to the project value, the order amounts or any invoice total.

**Filters:** site, facility/growing area, project state, owner, date range (start date).

### 5.7 Sites & equipment

One card per site: name, address, timezone, a *Synthetic address* marker; a facilities and growing-areas table (reference, name, structure, use, and whether the area sits directly on the site or within another) with a link to the full hierarchy; equipment cards showing reference, name, serial, warranty state, physical location, areas served, commissioned date and warranty-until date, with the note that where an asset sits and what it serves are different relationships; and a related row with counts of orders, cases and projects at that site, each drilling through with the site filter applied, plus the visit-requirements boundary link.

**Filters:** site, facility/growing area, equipment.

### 5.8 Accounts

For a role without Finance visibility the whole section is a single restricted statement: no amount, count, balance, badge or search result is shown, with the explanation that a withheld value must not be reconstructable from a summary elsewhere.

For a permitted role: one card per mapped account with company, currency, observation state, the account balance (or *Not available* with the exact reason), the note that ageing, credit limits and open committed cost are **not defined** in this prototype, and the full source strip.

**Transactions register:** transaction reference with any linked order · type · company and account · date and due date · original amount · applied payments and credits itemised by kind and reference · remaining amount as supplied by the source (or *Not supplied*) · source status.

**Why no total is shown** — an explicit block naming the four reasons: the AUD extraction is incomplete, one disputed invoice has no source-supplied remaining amount, unapplied cash and deposits are not invoice reductions, and the NZD account belongs to a different legal company.

**Filters:** source transaction status, ERP company, ERP account, date range (transaction date).

### 5.9 Activity & documents

A filterable timeline: entry type pill, a *Private* marker where applicable, a document-revision pill where applicable, subject, timestamp, author or source, direction (Inbound, Outbound, Internal, Source), summary, and the originating record. Each entry opens a snapshot; a document entry also offers the controlled-document-register boundary. The results bar states how many private entries are withheld from the current role.

**Filters:** site, entry type, author, date range (event date).

### 5.10 Record snapshots

Ten snapshot types are implemented: order, quotation, opportunity, case, project, finance transaction, activity, mapping, warranty case and agreement. Each opens in the modeless dock, marks its row as selected, exposes *Open full record*, and — where the record is a Powerplants record — carries the internal-note block.

### 5.11 Boundaries

Fifteen receiving boundaries are defined, each stating the owning design, the intended route and where the target lives: `sites`, `areas`, `equipment`, `readiness`, `es07`, `documents`, `order`, `finance`, `mapping`, `quotation`, `opportunity`, `case`, `project`, `activity`, `warranty`, `agreement`. Where a target is an ERP record rather than a Powerplants route, the boundary says so.

---

## 6. Sales orders — the information contract

### 6.1 Identity

| Field | Treatment |
|---|---|
| Source system | `MYOB Acumatica — Simulated adapter; no live endpoint, credential or tenant exists` |
| Company / entity | The ERP company, shown by name, never abbreviated to a branch |
| Customer account | The account code, the source account name, and whether its mapping is confirmed with its effective-from date |
| ERP order reference | The source order number, shown as an identity value and never used on its own to match a record |
| Order type | Source-reported, retained where it is needed for identity |
| Customer purchase order | Source-reported, or *Not supplied* |
| Order date | Source-reported |
| Source-reported status | Shown verbatim as the source reports it, with cancellation date and the source reason code where present |

### 6.2 Relationships

Accepted quotation with its **exact revision**; opportunity; project; service record; delivery address; linked site; linked growing areas. Any relationship the source does not supply reads *Not linked* or *No linked quotation in the source record*. A delivery address alone never creates a site relationship.

### 6.3 Commercial values

Order amount excluding tax, source-reported tax amount, order amount including tax, freight and discount — each shown as a separate measure in its own cell, each able to read *Not supplied*. The currency and the source-reported tax basis are stated, with the note that the tax basis is the value the source reports, its definition is awaiting validation, and no tax is calculated here.

### 6.4 Dates

Requested, confirmed and expected delivery are three distinct fields. A missing expected date stays missing; the requested date is never substituted for it.

### 6.5 Quantities

Every line carries seven independent measures: **ordered, allocated, shipped, delivered, cancelled, returned, invoiced**. The snapshot shows them as seven separate cells. A measure is summed only within itself, only across lines that share a unit, and only when every line supplies it; one unknown line makes that measure unknown rather than zero.

Outstanding supply is computed per line as `ordered − shipped − cancelled`, and only when both `ordered` and `shipped` are known. If either is unknown the line's outstanding balance is **Unknown**, and the order's fulfilment reads *Not determinable* with the number of lines responsible.

### 6.6 Line detail

Line number; product reference or a one-off description explicitly marked as having no catalogue product; unit; ordered, shipped, invoiced and outstanding quantities with their units; shipment reference; invoice reference or *No invoice recorded*; and the linked growing area where one exists. Source-reported unit prices are listed beneath the table with the same *not supplied* discipline.

### 6.7 Accepted quotation basis versus subsequent change

The accepted basis is stated for every order. Where a mapped comparison exists and differs, a banner names the line, the field, the accepted value, the ordered value and the fact that the source supplies no reason. Where no difference is mapped, the design says that no mapped difference is reported — not that the order matches.

### 6.8 Freshness and completeness

Every order carries its observation: scope, source-as-at, last successful observation, pages declared versus returned, row count, and outcome. Four outcome states are distinguished — **Complete**, **Incomplete**, **NoRecords** and **Failed** — and an observation older than 24 hours is marked as such even when it succeeded.

### 6.9 Demonstration scenarios

| Scenario | Record | What it demonstrates |
|---|---|---|
| Open order awaiting supply | `SYN-MYOB-SO-004412` | Confirmed delivery date, allocated but unshipped lines, a linked accepted quotation at revision r02, a one-off line, and a held deposit that does not make it paid |
| Partial fulfilment with a hold and an outstanding balance | `SYN-MYOB-SO-004380` | Three of four lines partly supplied, one line on a source-reported credit hold, one returned unit, no expected date, and a mapped quantity difference from the accepted quotation |
| Cancelled order | `SYN-MYOB-SO-004455` | Cancellation date, source reason code, cancelled quantity, nothing shipped, no invoice |
| Historical completed order | `SYN-MYOB-SO-004301` | Fully shipped, delivered and invoiced, with its invoice reference retained |
| Stale / failed observation | `SYN-MYOB-SO-004470` | A failed refresh over a successful earlier observation: last-good values retained and labelled, fulfilment unknown rather than zero, and a read-only refresh request that changes nothing |
| Unmapped source record | `SYN-MYOB-SO-004489` | An order under a similarly named source account with no mapping: separated, labelled, attributed to nobody and counted nowhere |
| Second legal company | `SYN-MYOB-SO-006001` | The same customer in a second ERP company and currency, never consolidated with the first |
| Another customer | `SYN-MYOB-SO-005120` | Present in the fixture so that context isolation can be proved |

These are demonstration scenarios. **The status vocabulary is not verified MYOB configuration**; the design treats each value as source-reported text and never as a state machine it controls.

### 6.10 Accepted quotation awaiting conversion

`SYN-PPO-QUO-000322 r01` was accepted on 14 September 2026. One conversion operation was sent on 15 September 2026 and the adapter returned an **unknown** outcome. The design therefore:

- keeps the quotation out of the order register entirely;
- counts it in a separate *Accepted, conversion unresolved* tile whose scope statement says it is not an existing ERP order;
- refuses to make a second attempt from this workspace;
- states that whether an ERP order exists has not been established;
- links to ES-07 for resolution and recovery.

---

## 7. Customer, site and account mappings

### 7.1 The identity model

`Organisation` is distinct from an ERP debtor account. An account mapping carries the provider connection, the ERP company, the source account code and name, the currency, effective dates, the mapping record reference and the person who confirmed it. One organisation can hold several company-specific mappings; the same code in two companies is not one key.

| Mapping | Company | Currency | Effective from | Record |
|---|---|---|---|---|
| `WILLOW001` → Willowbank Horticulture | Powerplants Australia Pty Ltd (synthetic) | AUD | 1 July 2025 | `SYN-PPO-MAP-000012`, confirmed by Dana Whitfield |
| `WILLOW-NZ` → Willowbank Horticulture | Powerplants NZ Limited (synthetic) | NZD | 1 February 2026 | `SYN-PPO-MAP-000019`, confirmed by Dana Whitfield |
| `ROTH004` → Rothwell Glasshouse Group | Powerplants Australia Pty Ltd (synthetic) | AUD | 1 September 2024 | `SYN-PPO-MAP-000021`, confirmed by Dana Whitfield |

### 7.2 The unresolved case

Source account `WILLOWBANK HORT` in the Australian company returned one order. Its name resembles a customer. It has **no mapping record, no effective date and no confirming owner**, so:

- it is not attributed to any customer;
- its order is excluded from every count and total;
- it appears only in the separate *Unresolved source records* card and in its own snapshot;
- an attention item owns it, with a date needed and the next action *Resolve or reject the account mapping (AD-05)*.

The mapping snapshot states plainly that a similar name and a similar displayed order number are not evidence of identity, and that matching requires the confirmed internal identity, provider, company and account key together.

### 7.3 Site and area linking

A record is attributed to a site only where an explicit relationship exists. The NZ order has no site relationship and is therefore excluded by a site filter rather than assumed into one. Delivery growing areas are separate from the delivery address and from the site.

---

## 8. Source authority, freshness, completeness and financial definitions

### 8.1 Authority

MYOB Acumatica remains the intended authority for ERP order and account information. Customer 360 is a reader. Powerplants One owns the opportunity, estimate, quotation, case, work order, appointment, report, finding, agreement, warranty case, project and internal-note records shown alongside them.

### 8.2 Observation record

Each feed carries a run: feed name, company, account, scope sentence, requested time, observed time, source-as-at time, outcome, pages declared, pages returned, row count and error text. The outcome states and their presentation:

| Outcome | Presentation | Meaning |
|---|---|---|
| `Complete` | Green *Observed* pill, or amber if older than 24 hours | Every declared page arrived |
| `Incomplete` | Amber *Extraction incomplete* pill | Some declared pages did not arrive; no total is derived |
| `NoRecords` | Neutral *No records returned* pill | The source answered and had nothing in scope — a result, not a failure |
| `Failed` | Red *Last refresh failed* pill | The attempt failed; last-good data is retained with its own as-at time |

Permission-restricted is a fifth, separate state, shown by the Accounts section's restricted panel rather than by an empty result.

### 8.3 Financial definitions

No financial definition is invented. The synthetic transactions follow the recorded fixtures in the PP-01 Finance contract:

| Fixture | Record | Behaviour in the design |
|---|---|---|
| F-01 partial payment and credit | `SYN-MYOB-INV-010044` | Original 1,100.00 AUD and source remaining 600.00 AUD shown separately; the 400.00 payment and 100.00 credit itemised by kind and reference |
| F-02 unapplied cash | `SYN-MYOB-PMT-004411` | 200.00 AUD shown on its own row as *Unapplied*; the invoice remaining stays 600.00 |
| Deposit | `SYN-MYOB-DEP-000212` | 1,500.00 AUD held against an order, shown separately, with the explicit statement that it does not make the order paid |
| Disputed with no remaining | `SYN-MYOB-INV-010061` | Original 940.00 AUD, remaining *Not supplied*, status *Disputed*. Never rendered as zero |
| F-04 partial import | Account `WILLOW001` | Page 2 of 2 not returned; account balance *Not available* with the exact reason; no total derived from the rows that arrived |
| F-05 unknown definition | Ageing, credit limits, open committed cost | Shown as **not defined** in this prototype and not comparable, never as 0 and never as a green verified status |
| Cross-company | `SYN-MYOB-INV-NZ-002201` | 2,300.00 NZD in a different legal company, never consolidated with AUD |

An order's status never establishes payment. Invoiced, paid, credited, disputed, unapplied, held and outstanding amounts are separate facts throughout.

---

## 9. Permissions, privacy and historical evidence

### 9.1 What the demonstration shows

Three demonstration roles are provided: **Service coordinator** (no Finance, no private notes), **Account manager** (Finance and private notes permitted) and **Service technician** (operational records only; the commercial sections are removed entirely).

Withholding is by removal, not by masking: a restricted role does not receive a blurred number, a count it could subtract from, a badge, a search hit or a snapshot. The Accounts section states this explicitly rather than showing an empty table.

### 9.2 What it is not

The role switch is a presentation demonstration. The data is embedded in the file and inspectable. The About dock says so in those words.

### 9.3 Server-enforced requirements for the receiving application

| Requirement | Detail |
|---|---|
| Section-level authorisation | Finance visibility is a server decision. The Accounts data must not be sent to an unauthorised session at all, rather than hidden in the client |
| Derived-value protection | Counts, totals, badges, search indexes, exports and record snapshots must be computed under the same grant as the underlying records, so a withheld value cannot be reconstructed |
| Private communications | A private internal note must be filtered server-side by owner and grant, and must be absent from search indexing for other users |
| ERP account scope | A user permitted to see one ERP company must not receive another company's orders or transactions through a customer-level query |
| Document permissions | A controlled document link must be resolved against the document register's own permissions at open time, not at list time |
| Read-only guarantee | Customer 360 must be defined as a read surface. Any write must belong to an owning module's command with its own permission, expected-version check, durable receipt and outbox boundary |

### 9.4 Historical evidence

Approval, issue, sent, delivered and acknowledged are five distinct facts. A report acknowledgement is bound to its exact revision and is not inherited by changed content. A superseded quotation revision is retained with its own state and explicitly carries no commitment. Reading a timeline entry completes nothing: there is no acknowledgement affordance on a notice, and the snapshot says so.

---

## 10. Demonstrated journeys, exceptions and recovery

All eight requested journeys are exercised end to end in the design and asserted in the checks.

| # | Journey | Path through the design | Verified by |
|---|---|---|---|
| 1 | Outstanding order → remaining lines → linked follow-up | Overview → attention item `FU-0003` → *Go to sales orders* → open `SYN-MYOB-SO-004380` → outstanding per line, hold, missing expected date → internal follow-up note | DOM groups on partial fulfilment, mapped difference, shipment/invoice references and note saving |
| 2 | Unresolved case → work orders and completed visit → remaining action | Cases & service → `SYN-PPO-TKT-000731` → work order `SYN-PPO-WO-000488`, appointment `SYN-PPO-APT-000615` completed, report `SYN-PPO-RPT-000254 r01` acknowledged, finding F-02 unresolved → next action | DOM groups on visit-does-not-resolve, four separated statements, revision-bound acknowledgement, billing state |
| 3 | Filter to one site → its equipment, orders, projects and service history | Sites & equipment → site card related row, or the site filter on any register | DOM groups on site scoping, explicit-relationship-only filtering and equipment drill-through |
| 4 | Accepted quotation → linked ERP order, both identities preserved | Deals & quotations → `SYN-PPO-QUO-000318 r02` snapshot → *Open the linked ERP order* → order snapshot showing the quotation and its exact revision | DOM groups on quotation/order linking and accepted-basis retention |
| 5 | Stale or failed ERP observation | Sales orders → `SYN-MYOB-SO-004470` → stale banner, failure text, last-good values, unknown quantities, read-only refresh request | DOM groups on stale retention, unknown-not-zero and refresh changing nothing |
| 6 | Permitted account review without leaking restricted data | About → role *Account manager* → Accounts; and role *Service coordinator* → the restricted statement | DOM groups on restricted overview tile, restricted section, restricted search |
| 7 | Switch customer and return without mixing records | Customer choice card → Rothwell → every register; then back | DOM groups on context reset and second-customer isolation; native group on the same switch through the real choice card |
| 8 | Empty result, missing relationship or unavailable source | Search for another customer's PO; filter to a site the record has no relationship with; the failed observation | DOM groups on empty-state explanation and recovery control |

### 10.1 Exception and recovery behaviour

- **Failed source observation** — last-good data is retained, labelled, and its age stated. A refresh request is a read that changes nothing, and the design says what happened rather than silently re-rendering.
- **Incomplete extraction** — no total is derived, and the reason is stated where the total would have been.
- **Unknown conversion outcome** — held unresolved; no second attempt is offered; the record is not promoted to an order.
- **Unmapped source account** — separated, uncounted, and owned by a dated attention item.
- **Refused browser storage** — the note is kept in the tab, the status strip and the toast both say it may not survive a reload, and nothing is silently lost.
- **Unreadable retained bytes** — the existing stored bytes are left untouched, never overwritten, and the user is told.

---

## 11. Responsive and accessibility behaviour

### 11.1 Measured presentation

Measured in Chromium at five viewports. Horizontal page scroll is **0 px** on Overview, Sales orders, the order snapshot, Accounts and Cases at every one.

| Viewport | Width | Register presentation | Smallest interactive control height |
|---|---|---|---|
| Desktop | 1440 | Table (6 rows) | 32 px |
| Laptop | 1280 | Table (6 rows) | 32 px |
| Tablet | 834 | Table (6 rows) | 32 px |
| Phone | 390 | Cards (6 cards) | 32 px |
| Narrow | 320 | Cards (6 cards) | 32 px |

The table and the card list always represent the same matched records; the count equality is asserted at every viewport.

### 11.2 Layout behaviour

Four-column summary tiles step to three at 1320 px, two at 960 px and one at 760 px. The support column drops below the main column at 1150 px. Filter grids step from four columns to three, two and one. Gutters step 40 → 32 → 24 → 20 → 16 → 12 px. Text inputs reach 16 px at ≤760 px to avoid iOS zoom-on-focus. Picker options reach a 44 px minimum on touch widths. A short landscape viewport releases the sticky tools row. Reduced motion is honoured. A print stylesheet restores the table, hides the interactive chrome and avoids breaking cards.

### 11.3 Keyboard and assistive-technology structure

- A skip link reaches the workspace content.
- Local navigation is a `role="tablist"` with `role="tab"` controls, roving `tabindex`, `aria-selected`, and Left/Right/Home/End handling. **Focus is restored to the newly activated tab after the strip re-renders** — a defect found by the native check and fixed.
- The content region is `role="tabpanel"` and `aria-labelledby` the current tab.
- A focused control shows a 2 px `--focus` outline with a 3 px offset; the focus ring was measured on a keyboard-reached tab.
- The choice card is a labelled `listbox` with `aria-expanded`, `aria-controls`, `aria-selected`, type-ahead, Escape, Tab and viewport clamping, and it renders inside its owning dialog's context. It was measured opening within the viewport and closing on Escape.
- Each dialog has `aria-labelledby` and `aria-describedby`, and focus moves to its title on open.
- The storage strip and the toast are `role="status"` with `aria-live="polite"`.
- Every element identity in the rendered document is unique.
- Icons are `aria-hidden` and never the sole carrier of meaning; every state pill carries text.

### 11.4 Known presentation limits

- The modeless dock overlays the right of the workspace, including the customer choice card, matching the r03 dock pattern. This is measured and recorded rather than described otherwise. Switching customer while a snapshot is open still clears it.
- The native date inputs hold ISO 8601 values, but the format a browser *displays* in the control follows the user's browser and operating-system locale, not the document's `lang="en-AU"`. All dates rendered by the design itself use `dd Month yyyy`.
- No screen reader, assistive technology, physical device, zoom, high-contrast or print output has been exercised. Colour-contrast ratios were not measured in this package.

---

## 12. What works in the HTML and what remains proposed

### 12.1 Working in the file

Customer switching with full context reset · eight local views with keyboard navigation · site, facility/area, equipment, status, owner, ERP company, ERP account and date-range filters · per-view applicability of those filters · free-text search within the customer's records · removable filter chips and clear-all · summary-tile drill-through with filter application · a return stack that restores the previous view, filters and search · ten record snapshot types in a modeless dock · fifteen labelled receiving boundaries · three demonstration roles with section removal and restricted statements · internal follow-up notes with save status, reload persistence, refused-storage handling and unreadable-bytes protection · source observation states including complete, incomplete, no-records and failed · a read-only source refresh request · desktop table and phone card presentations of the same records · empty states with recovery controls.

### 12.2 Proposed, not implemented

Every route behind *Open full record* · any real MYOB read or write · server-enforced permissions · durable storage of anything · real customer, site, order, account or document data · a real conversion or reconciliation operation · scheduled or event-driven refresh · export, print-to-PDF or sharing · notification of an attention item to its owner.

### 12.3 Deliberately absent

An aggregate "customer value" figure, a health score, a priority or service-level badge, an ageing band, a credit-limit indicator, an ERP action control, or any single number that mixes opportunity, quotation, order, invoice and payment amounts.

---

## 13. Receiving application contracts and open decisions

### 13.1 Read contracts the application must provide

| Contract | Shape | Notes |
|---|---|---|
| `GET /customers/{id}/summary` | Identity, relationship owner, service owner, contacts, sites, site-party roles, mapped ERP accounts | Scoped by grant; contacts filtered by site where a site scope applies |
| `GET /customers/{id}/attention` | Owned items with originating record type and id, reason, owner, due value **and its meaning**, next action and target module | The due *meaning* is part of the contract; a bare date is not sufficient |
| `GET /customers/{id}/orders` | Order header, relationships, values, three delivery dates, line array with seven quantity measures, shipment and invoice references, and the observation record | Nullable everywhere; `null` must survive to the client as unknown |
| `GET /customers/{id}/orders/{orderId}` | The same, plus the accepted-quotation comparison where a mapping supports one | The comparison is optional and must be absent rather than empty when unmapped |
| `GET /customers/{id}/quotations` | Quotation, revision, state, issue/sent/delivered/response dates, value, conversion state, linked order | Superseded revisions included with their parent reference |
| `GET /customers/{id}/cases` | Case, states, the four separated statements, work orders, appointments, reports with revisions and acknowledgement, findings | |
| `GET /customers/{id}/projects` | Project, owner, scope, the three completion facts, milestones, deliverables, variations, commitments | |
| `GET /customers/{id}/accounts` | Per company and account: transactions with type, dates, original, applications, source remaining, source status, plus the observation record | Balance only where the source supplies one on a complete extraction |
| `GET /customers/{id}/activity` | Entries with type, timestamp, author/source, direction, originating record, document revision, privacy flag | Private entries filtered server-side |
| `GET /customers/{id}/sites` | Sites, areas and assets with installed location and served areas | May be the existing CS-04/CS-05 contract |

Every collection response must carry the observation envelope: `scope`, `requested_at`, `observed_at`, `source_as_at`, `outcome`, `pages_declared`, `pages_returned`, `rows`, `error`.

### 13.2 Write contract

One only: `POST /customers/{id}/notes` — an internal Powerplants note against a record reference, with author, timestamp, grant check, expected-version handling and a durable receipt. It performs no ERP effect.

### 13.3 Integration dependencies

1. **MYOB discovery must complete first.** Endpoint name and version, schema export and hash, entity and action inventory, record and line keys, custom fields, permitted queries, paging and delta semantics, error and limit behaviour, authentication mechanism, role and company restrictions, and entitlement limits are all **Not supplied** today (CFG-01–CFG-12 in the MYOB blueprint).
2. **Field families must be split into atomic fields.** The 60 proposed mapping entries are families, not verified columns.
3. **`ErpAccountMapping` must exist as a persisted record** with connection, company, account, effective dates, confirming owner and evidence reference, before any order can be attributed to a customer.
4. **Order status, hold and type vocabularies must be observed, not assumed.** The design treats them as text for this reason.
5. **Financial definitions (D-017) must be supplied** before any balance, ageing band, credit rule or comparability statement is shown as a calculation.
6. **Service authority (D-007) must be decided** before order, appointment and labour ownership can be settled.
7. **ES-07 must land** before the conversion boundary resolves to a real destination.
8. **Refresh, retry and reconciliation behaviour must be specified** so that a repeated read cannot create a duplicate business effect and an unknown outcome is resolved by lookup rather than resubmission.

### 13.4 Open decisions this design does not make

| Decision | Why it is left open |
|---|---|
| Whether Customer 360 is a route of its own or a tab set on the customer record | A navigation decision for the application shell, not for a module design |
| Refresh cadence and whether it is user-triggered, scheduled or event-driven | Depends on MYOB entitlement and concurrency limits that are not supplied |
| Whether an attention item is derived at read time or persisted as a work item | Persisting it would create a second owner for a state another module owns; deriving it costs a query per section. This design derives, and says so |
| Whether internal notes belong to Customer 360 or to the owning record's module | The design keeps them customer-scoped and record-referenced, which is the reversible choice |
| Which role set is real | The three demonstration roles are illustrative. Departmental roles remain proposed |
| Whether ageing, credit and committed-cost measures appear at all | They cannot appear until D-017 supplies their definitions |

---

## 14. Validation results and remaining limitations

### 14.1 What was run

| Check | Command | Result |
|---|---|---|
| Documentation foundation | `python3 scripts/check_foundation.py` | Passed |
| PP-01 prototype consistency | `python3 scripts/check_prototype.py` | Passed |
| Naming and document register | `python3 scripts/check_naming.py` | Passed |
| Conflict-marker scan | `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | No match |
| Model and DOM emulation | `node scripts/check-customer-360-design.mjs` | **86 groups passed** |
| Native browser | `node scripts/check-customer-360-browser.mjs` | **12 groups passed** |

Both design checks were run against the issued file at SHA-256 `d2b21bacfa4b709fcb9e52292b94def8b934414be9e246e4f3167490b9ba8431`. Results are recorded in [`docs/testing/evidence/customer-360-r01/`](../../../testing/evidence/customer-360-r01/README.md).

### 14.2 Defects found and fixed during verification

| Defect | Found by | Fix |
|---|---|---|
| 68 px horizontal page overflow at 320 px, caused by two native date inputs refusing to shrink inside a flex row | Native browser measurement | `flex:1 1 0; min-width:0` on `.date-range input`; re-measured at 0 px |
| Keyboard focus was dropped to the document body after activating a tab, because the tab strip re-renders | Native browser keyboard check | The tab keydown handler now changes the view directly and restores focus to the new tab element |
| The case detail note became a third grid column, pushing the work-order column onto a second row | Screenshot review | The description list and its note were wrapped in one grid child |

### 14.3 What was not verified

- No screen reader, assistive technology or physical device was used.
- Colour contrast ratios were not measured.
- Print output was not rendered or reviewed.
- Only one browser engine (Chromium) was exercised; no Firefox, Safari or WebKit run was performed.
- No owner visual acceptance and no business acceptance has occurred.
- No MYOB endpoint, schema, permission, company definition, status vocabulary or financial definition has been verified against a real instance. Every ERP fact in this package is fictional.
- No parent requirement (CRM-01, CRM-04, CRM-06, SVC-06) and no acceptance case is passed by these design checks.

---

## 15. Traceability

### 15.1 Requested capability to location and evidence

| Requested capability | Where it is in the HTML | Verification evidence |
|---|---|---|
| Eight named sections | `#workspace-tabs`, eight `role="tab"` controls | DOM: *The workspace does not add a second application shell*; native: tab keyboard groups |
| Reconciled with the existing local navigation, without duplicating r03 | Sites & equipment view and the *Detailed location and asset views* card | DOM: *The full hierarchy is linked rather than duplicated* |
| Customer identity, owner, contacts, sites, account relationships | Overview identity card | DOM: *Overview opens on the central question*; *Overview separates operator, property owner and bill payer* |
| Summaries with stated scope and drill-through | `.summary-grid` tiles | DOM: *Every summary tile states the scope of what it counted*; *A summary tile drills into the register behind it* |
| Attention items with record, reason, owner, due and next action | `.attention-list` | DOM: *Each attention item names record, reason, owner, due meaning and next action* |
| Sales-order register | Sales orders view `.register` | DOM: *The sales-order register lists only this customer's mapped-account orders* |
| Order snapshot with source, identity, dates, money, lines | `orderSnapshot()` in the dock | DOM: six order-snapshot groups |
| Seven separated quantities | `.quantity-key` | DOM: *Ordered, allocated, shipped, delivered, cancelled, returned and invoiced stay separate* |
| Unknown stays unknown | `lineOutstanding`, `orderFulfilment`, `.unknown` | DOM: *Unknown quantities on a stale order are rendered unknown rather than zero* |
| Open / partial / cancelled / historical / stale scenarios | Five order fixtures | DOM: five scenario groups |
| Accepted basis kept separate from later change | `comparison` block in the snapshot | DOM: *A mapped difference from the accepted quotation is shown, not silently absorbed* |
| Accepted quotation awaiting conversion is not an order | `renderConversionCard()` and the Overview tile | DOM: *An accepted quotation with an unknown conversion is never presented as an order* |
| ES-07 link, no conversion recreated here | `boundary` → `es07` | DOM: *Conversion and recovery link to ES-07 instead of being recreated here* |
| No ERP operational actions | Absence, asserted | DOM: *No ERP edit, release, cancellation, payment or fulfilment control exists* |
| Deals: states, options, revisions | Deals & quotations view | DOM: three deals groups |
| Cases: separated identities and states | Cases & service view | DOM: seven cases groups |
| Projects: three completion facts | Projects view | DOM: three projects groups |
| Sites & equipment: location vs served areas | Sites & equipment view | DOM: three sites groups |
| Accounts: permitted observations, separated amounts | Accounts view | DOM: seven accounts groups |
| Activity & documents: source, author, date, revision, privacy | Activity view | DOM: three activity groups |
| Filters, search, chips, drill-through, return | Toolbar, filter grid, chip bar, return control | DOM: seven filter and navigation groups; native: drill-through group |
| Context isolation | `resetContext()` | DOM: three isolation groups; native: customer-switch group |
| ERP identity, company and account handling | `erpAccounts`, `mappingSnapshot()` | DOM: three identity groups |
| Stale, incomplete, unavailable, empty, restricted states | `observationState()`, `accountBalance()`, restricted panel, empty states | DOM: six state groups |
| Permissions and privacy | `roles`, `visibleActivities()`, Accounts restricted panel | DOM: three permission groups |
| Save status and storage recovery | `writeStorage()`, `storageNotice()`, toast | DOM: five persistence groups |
| Responsive and keyboard behaviour | Media queries, tab handler, choice card | Native: six presentation and interaction groups |
| Self-contained, themed, synthetic | Build output, `design-metadata` | DOM: three presentation groups |

### 15.2 Register and requirement traceability

| Identifier | Relationship |
|---|---|
| **CS-01** | This design's subject |
| CS-02, CS-03 | Contact and stakeholder context carried in the Overview |
| CS-04, CS-05, CS-06 | Extended and linked, not replaced |
| CR-01, ES-05, ES-06, ES-07 | Presented and linked |
| SV-01, SV-02, SV-03, SV-06, SV-07 | Presented and linked |
| PJ-01, PJ-05, PJ-09 | Presented and linked |
| MA-01, MA-05, MA-06, MA-07 | Presented and linked |
| EQ-01, EQ-03 | Presented and linked |
| FN-02 | Presented under permission and linked |
| AD-04, AD-05 | Named as the owners of adapter health and mapping resolution |
| EC-01, DK-02 | Named as the owners of communications and controlled documents |
| CRM-01, CRM-04, CRM-06, SVC-06 | Parent requirements of CS-01. **None is passed, advanced or closed by this design** |
| D-005, D-006, D-007, D-011, D-017 | Open decisions this design depends on and does not resolve |
| FD-01, FD-02, FD-04 | Account-view rules applied |
| IF-01 – IF-05 | Interface families this design will consume when they exist |

---

## 16. Recommended next bounded increment

**Build the read-only Customer 360 Overview and Sales orders sections against a synthetic server contract — and nothing else.**

Scope:

1. Two read endpoints — `GET /customers/{id}/summary` and `GET /customers/{id}/orders` — served from a synthetic fixture adapter behind the existing adapter boundary, returning the full observation envelope.
2. The persisted `ErpAccountMapping` record: connection, company, account code, effective dates, confirming owner and evidence reference, with server-side attribution of an order to a customer **only** through a confirmed mapping.
3. Server-enforced grants for the two endpoints, including the Finance exclusion, with a negative-authorisation test for each.
4. The Overview and Sales orders views rendered from those endpoints, with the unknown, incomplete, no-records and failed states driven by the envelope rather than by fixture flags.
5. Acceptance evidence: an order with an unknown shipped quantity renders unknown; an incomplete extraction renders no total; a similarly named unmapped account is attributed to nobody; an unauthorised session receives no Finance field at all.

Explicitly out of scope for that increment: any MYOB call, any write, the remaining six sections, internal notes, and conversion.

**Why this next:** it turns the two hardest information-integrity rules in the package — mapping-based attribution and the observation envelope — into server behaviour, while every other section remains a design that can be reviewed without cost. It also depends on no MYOB evidence, so it is not blocked by CFG-01–CFG-12.

---

*Prepared 16 September 2026 against `main` at `0769a16d`, and rebased onto `d0a660d2` after #210 merged. All data in the design and in this report is synthetic. Design status is Proposed; owner acceptance, application integration and production readiness remain separate claims.*
