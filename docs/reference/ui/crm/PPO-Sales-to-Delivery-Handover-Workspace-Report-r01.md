---
document_id: PPO-CR03-HTML-REPORT
title: Sales-to-Delivery Handover workspace r01 — detailed companion report
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed CR-03 design; owner acceptance, native device review and application integration remain separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# Sales-to-Delivery Handover (CR-03) — detailed companion report

**Interactive design:** [PPO-Sales-to-Delivery-Handover-Workspace-r01.html](PPO-Sales-to-Delivery-Handover-Workspace-r01.html) · SHA-256 `1e47efa70938127b644a9e5dda9a61d1d4f929b548610d515ec21d1d09ed30a5`
**Reproducible source:** [docs/design/sales-delivery-handover/](../../../design/sales-delivery-handover/README.md)
**Decision and receiving handover:** [sales-delivery-handover-design.md](../../../decisions/sales-delivery-handover-design.md)
**Verification record:** [sales-delivery-handover-r01](../../../testing/evidence/sales-delivery-handover-r01/README.md)

---

## 1. Purpose, scope and CR-03 traceability

### 1.1 The question the module answers

> **Who has accepted responsibility for delivering the agreed work, what have they received, and what remains unresolved?**

Every view, field and control in this design exists to answer one part of that question, and the workspace refuses to answer it by inference. Responsibility is a recorded decision by a named receiving owner against an exact handover revision, or it is absent. What was received is a list of individually sourced records with their own revisions and review outcomes, not a checklist total. What remains unresolved is split into obligations that block a receiving acceptance and prerequisites that survive one.

### 1.2 Scope identity and the conformance declaration

The HTML module scope and design conformance standard requires each package to declare its scope, page type, reuse and boundaries before those become a new baseline. That standard is not yet on `main`: it arrives with draft PR #212, so it is cited at its pinned head — [`docs/standards/html-module-conformance.md` at `8d821e9d`](https://github.com/deanrfiedler-gif/powerplants-one/blob/8d821e9d764737ab41a753c6fb72342b399428a2/docs/standards/html-module-conformance.md). This package follows it voluntarily rather than treating an unmerged standard as binding. That declaration is below.

| Field | Declared content |
|---|---|
| **Scope identity** | **CR-03 · Won-deal receiving handover**, from the HTML page coverage register. Register text: *"Turn existing Won/handover-due into controlled Service/Project/parts-order acceptance, preserved commercial basis, rejected/returned paths and original-result recovery."* Presented as the **Sales-to-Delivery Handover** workspace. Related scope: CR-01/CR-02 (opportunity outcome), CS-01 (customer 360), ES-05/ES-06/ES-07 (quotation lifecycle and conversion), PRJ/SVC/SCM receiving pages. No new module identity is created and no parent requirement is added, replaced or marked accepted. |
| **Page type** | **Form / guided workflow**, supported by **Review / comparison**. The register uses the shared Register / worklist treatment; the history view uses the Document & evidence treatment. No variant is introduced. |
| **Reused components** | Shell boundary, workspace title/context strip, tab bar, registers, badges, summary cells, source rows, docked decision dialogs, form patterns and responsive rules from the Quality, Safety & Site Assurance r01 source (`docs/design/quality-site-assurance/workspace.css`, class prefix rewritten to `#ppo-handover`). Embedded Roboto faces reused byte-for-byte from that source, SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`, extracted from theme board r20, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. Deterministic Python assembly script pattern reused from `scripts/build-quality-site-assurance.py`. |
| **Source authority** | Four kinds are kept apart throughout this report: **implemented behaviour** (present in `main` code or migrations), **accepted design** (a recorded decision), **proposed composition** (this package), and **fictional fixture**. Each claim below says which it is. |
| **Incoming handover** | A Won opportunity with its immutable `opportunity_handovers_due` record; the accepted quotation issue and its customer response (ES-06); the item resolution and conversion outcome (ES-07); customer, site, facility and equipment context (CS-01/CS-04/CS-05/EQ-03). |
| **Outgoing handover** | A recorded receiving decision bound to an exact revision, a set of individually owned outstanding obligations, and locally prepared links to the Project, Service, parts-order, My Work and Finance workspaces. Prepared, submitted, returned, accepted and converted remain five separate outcomes. |
| **Exceptions and recovery** | Normal, missing acceptance evidence, unrouted scope, unallocated scope, stale source during review, superseded source after acceptance, unavailable receiving record, restricted identity, unavailable register source, incomplete loading, failed save, lost response, and partial or unknown external conversion outcomes. |
| **Departures** | A nine-cell **responsibility chain** band at the top of the history view is new composition; it uses existing card, tag and grid vocabulary. A three-column **field comparison** grid is new composition for the review/comparison type. Both are proposals for review, not authorised baseline changes. |
| **Verification** | 25 model groups and 29 native browser groups passed on the issued file, with no page or console errors, plus 31 original captures at 1440, 1024, 820, 390 and 320 pixels. Exact results, limits and the browser actually used are in section 18. |

### 1.3 What this increment does not do

Live integration, ERP transactions, operational communications and deployment are outside this increment, as instructed. Concretely, the design performs no MYOB Acumatica read or write, creates no project, work order, appointment, purchase order or Finance record, sends no message or notification, books nothing, authorises no work and changes no application route, database, dependency, adapter or hosted service. The receiving application requirements are documented separately, in section 19 and in the decision record.

---

## 2. Exact sources and reused components

### 2.1 Repository baseline

| Source | Identity |
|---|---|
| Repository | `deanrfiedler-gif/powerplants-one`, public, default branch `main` |
| Baseline commit | `0769a16dd842e9dc1c349a853036ab71949e7807`, tree `57e788526e1521b839fd0ec6c2ef6f973d4dd406`, 16 September 2026 (merge of PR #209, My Work action centre r01) |
| Branch | `design/sales-delivery-handover-r01`, based on that commit |
| Open pull requests inspected | #210 (ES-08 Screen Systems r02), #211 (SH-03 notification inbox r01), #212 (ES-05 correction and ES-06 response), #213 (ES-07 item resolution and conversion) |

### 2.2 Implemented behaviour this design builds on

These are facts in `main`, not proposals. They constrain the design and are quoted exactly where the design depends on them.

| Implemented source | Fact relied upon |
|---|---|
| `db/migrations/0023-crm-owned-outcomes.sql` | A Won outcome requires stage `Closing` and a non-empty `acceptance_evidence` narrative of 1–2000 characters. A Lost outcome requires a `lost_reason` from `Price`/`Competitor`/`Timing`/`No decision`. A closed opportunity cannot reopen or change stage. Exactly one `OpportunityOutcomeRecorded` event may exist per opportunity. |
| `db/migrations/0023-crm-owned-outcomes.sql` | `ppo.opportunity_handovers_due` is an **immutable companion**: one row per Won opportunity, keyed `(workspace_id, opportunity_id)`, carrying the outcome event, the opportunity version at Won, the closing `owner_id`, and a `status` column constrained to the single value `'Due'`. A `handover_due_immutable` trigger refuses every `UPDATE` and `DELETE`. |
| `src/crm/outcomes.ts` | The handover-due row is written inside the same transaction as the outcome event, with `owner_id` taken from the opportunity, not from the actor. |
| `src/crm/reads.ts` | The opportunity read projection exposes `handover_due` as `{owner_id, owner_name, opportunity_version, created_at, status}` and tolerates the table's absence. |
| `docs/contracts/crm-opportunity-handover.md` r02 §7 | *"A Won handover-due record remains immutable evidence of the closing owner's outstanding obligation; changing the sales owner does not confirm the receiving delivery route/owner or complete that obligation."* |
| `docs/contracts/service-api.md` | Service work orders move `Draft` → `Authorised` through `POST /service/work-orders/:id/authorise`, which binds an exact `scope_revision_id`, `scope_version` and `policy_version_id`. Appointments are `Proposed`/`Confirmed`/`Cancelled` and `dispatch_hold` is a server fact that stays true. Work-order creation accepts an *optional exact project/opportunity reference text* — a reference string, not a typed relationship. |
| `docs/contracts/supply-chain-readiness.md` r01 | Readiness states are `Not assessed`, `Evidence needed`, `At risk`, `Blocked` and `Ready for the stated material scope`. A `Ready` assessment *"establishes no technical release, worker competency, site access, customer agreement, confirmed booking or Finance outcome."* |

### 2.3 Accepted and proposed design sources

| Source | Revision / identity | Used for |
|---|---|---|
| [Theme / style board r20](../theme-style-board/powerplants-one-theme-style-board-r20.html) | SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617` | Palette, typography, density, control geometry, page-type selection. Only the three embedded Roboto faces are carried into the output; the 16 MB board is not copied. |
| [Quality, Safety & Site Assurance r01](../quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html) and its source | `docs/design/quality-site-assurance/` on `main` | Shared workspace CSS, template scaffold, deterministic build pattern, docked decision dialog, register and snapshot vocabulary. Fixture identities for Northbank, Greenhaven and Cedar Vale. |
| [Customers, Sites & Growing Areas r03](../customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) and [its handover](../../../decisions/customers-sites-workspace-design.md) | r03 | Customer 360 (CS-01) content: organisation/site/facility hierarchy, the separate operator, owner and bill-payer meanings, and CS-06 visit requirements as source information rather than site permission. Willowbank fixture identities. |
| [Project Delivery Readiness & Change Control r01](../projects/PPO-Project-Delivery-Readiness-and-Change-Control-r01.html) and [its handover](../../../decisions/project-delivery-readiness-design.md) | r01 | Receiving-side vocabulary for prerequisites, comparison capture, owned requests and original-receipt recovery. Pump `SYN-PPO-AST-000501` and its exact installed/served relationships. |
| [My Work & Action Centre r01](../my-work/PPO-My-Work-and-Action-Centre-r01.html) | r01 | Owned follow-up pattern: one stable source obligation has one projection, and completing an action never clears a source blocker. |
| [Work Orders r01](../service/PPO-Work-Orders-Workspace-r01.html), [Supply Chain Material Readiness r03](../supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html) | r01 / r03 | Receiving-destination vocabulary for the Service and parts-order routes. |
| [Customer quotation module r03](../quoting/ppo-quotation-module-r03.html) | SHA-256 `7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a` | The accepted commercial basis for the Riverbend fixture: exact lines, selection envelope, declared defaults, discount and GST basis. The build asserts this hash. |
| [ES-05 / ES-06 quotation approval, issue and response](https://github.com/deanrfiedler-gif/powerplants-one/pull/212) | Draft PR #212, head `8d821e9d764737ab41a753c6fb72342b399428a2` | Incoming acceptance semantics: approval, issue, sent, delivered and acknowledged are distinct; changed content needs a successor and does not inherit acceptance. |
| [ES-07 item resolution and conversion](https://github.com/deanrfiedler-gif/powerplants-one/pull/213) | Draft PR #213, head `b6ef1342aa62eec87f2c4557ce7d1649fd246530` | The conversion outcome vocabulary reproduced exactly: `Not prepared`, `Prepared`, `Confirmed`, `Partially confirmed`, `Outcome unknown`, `Failed — no effect`; target states `Prepared`, `Submitted`, `OutcomeUnknown`, `FailedNoEffect`, `Confirmed`; order and operation key shapes `SYN-SO-NNNNN` and `SYN-PPO-COP-NNNN`; provider entities `SYN-PPA-AU` / `SYN-PPA-NZ`. |

**Branch dependency decision.** ES-05/ES-06 (#212) and ES-07 (#213) are open draft pull requests, and #213 is stacked on #212's branch rather than on `main`. This package therefore branches from `main` and treats both as **pinned references**, not as a build dependency. No byte from either branch is copied into this design. The only upstream bytes reproduced are from `ppo-quotation-module-r03.html`, which is on `main` and is hash-guarded by the build script. This keeps CR-03 reviewable and mergeable independently of the estimating chain; the cost is that the ES-06 acceptance fixture is reproduced from the quotation document's own declared defaults rather than imported from #213's generated JSON. That reproduction is stated wherever it is used.

---

## 3. Record identities, scope allocation and source relationships

### 3.1 Identity model

| Identity | Treatment in this design |
|---|---|
| Delivery handover | Internal identity `ho-N` in the demonstration session, with a readable reference `DEMO-HDV-030NNN`. **`DEMO-HDV-` is a local demonstration label, not a new entry in the PPO business-reference type catalogue and not a server-allocated reference.** This follows the Projects readiness precedent (`DEMO-CHG-`/`DEMO-ACT-`). A receiving implementation must allocate a real reference through the existing allocation mechanism, or reuse the opportunity reference; that decision is open (OQ-01). |
| Handover revision | `rNN` within a handover, monotonically increasing. A revision is never edited after submission. |
| Receiving decision | `DEC-<handover suffix>-NN`, bound to exactly one revision. |
| Outstanding obligation | `OBL-<handover suffix>-NN`, individually owned and dated. |
| Owned follow-up action | `DEMO-ACT-<handover suffix>-NN`, the shared Activities / My Work pattern, likewise a local demonstration label. |
| Opportunity | `SYN-PPO-OPP-NNNNNN`, existing synthetic reference type. |
| Quotation issue | `SYN-PPO-QUO-NNNNNN` with an `RNN` issue revision, existing synthetic reference type. |
| ERP conversion | `SYN-PPO-COP-NNNN` operation, `SYN-SO-NNNNN` order key, `SYN-SO-NNNNN/LINE-NN` target correlations — reproduced exactly from ES-07. |
| Customer, site, facility, asset | `SYN-PPO-ORG-`, `SYN-PPO-SIT-`, `SYN-PPO-FAC-`, `SYN-PPO-AST-` plus real UUIDs where an existing design already fixed them. |

Names are never identity. Display labels are resolved labels, and the workspace always shows a reference alongside a name where one exists.

### 3.2 Scope allocation

The accepted quotation is the commercial basis. A destination receives an **allocated subset** of that basis:

- The **allocated subtotal** is the sum of the allocated accepted lines and allocated selected options.
- The **accepted total** is shown separately and is never duplicated across destinations.
- The accepted **discount** is a basis-level amount. It is applied to the allocated subtotal **only when every accepted line and every selected option is allocated to this one destination**. Apportioning a discount between destinations would require a rule that no approved source supplies.
- Any accepted line that is not allocated is listed explicitly as **Not allocated**, and the destination view states that splitting one accepted quotation across several destinations is undefined (**OQ-03**).

Splitting is therefore recorded as an open requirement rather than invented, and the first working journey is bounded to one destination per handover, as instructed.

### 3.3 Source relationships and the fingerprint

Each handover keeps a **source fingerprint** computed from: quotation reference, issue revision and issued-document hash; acceptance state and date; accepted totals; every supporting document reference, revision and state; conversion outcome and order key; destination type, receiving record reference and version; the allocated line set; and the opportunity version at Won.

A submitted revision stores the fingerprint that was true when it was submitted. A receiving decision stores both the revision's fingerprint and the fingerprint at the moment of decision. This one value drives three behaviours described in sections 9 and 13: stale-review refusal, renewed-acceptance requirement, and the "still applicable to the current source" marker on each recorded decision.

---

## 4. The nine separate events

The workspace's history view opens with a nine-cell **responsibility chain**. Each cell is a distinct event with its own owner, time, source and state. Recording one never records another, and the chain is never collapsed into a progress bar or percentage.

| # | Event | Owner | Owning system | State shown here |
|---|---|---|---|---|
| 1 | Customer acceptance of a particular quotation | Customer | ES-06 quotation response | Recorded / not recorded against an issue |
| 2 | Opportunity marked Won | Closing sales owner | CRM outcome command | Recorded, with opportunity version |
| 3 | Item resolution and ERP conversion | Conversion coordinator | ES-07 | One of the six ES-07 outcomes |
| 4 | Delivery handover submitted | Sending owner | CR-03 | Revision and its state |
| 5 | Receiving responsibility accepted | Receiving owner | CR-03 | Decision, decider and date |
| 6 | Work authorised or released | Receiving owner | Projects / Service work-order authorisation | Outside this increment; open prerequisite count is shown |
| 7 | Attendance scheduled | Receiving owner | Scheduling & Appointments | Outside this increment |
| 8 | Delivery completed | Receiving owner | Projects / Service / Supply Chain | Outside this increment |
| 9 | Financial processing and reconciliation | Finance | Finance & Commercial Controls | Outside this increment |

The three combinations the brief calls out are directly demonstrated:

- **A Won opportunity can still have missing acceptance evidence.** `DEMO-HDV-030004` (Cedar Vale) has event 2 recorded and event 1 not recorded. The Won event carries a narrative acceptance note — *"Verbal confirmation at the site meeting"* — which the implemented schema permits, because `acceptance_evidence` is free text. The workspace states plainly that **a narrative note is not a customer response bound to a quotation issue**, and refuses submission.
- **A confirmed ERP order can still have an incomplete delivery handover.** `DEMO-HDV-030001` and `DEMO-HDV-030002` both have event 3 `Confirmed` with a real order key, and both were still awaiting a receiving decision at seed.
- **An accepted handover can still have unresolved prerequisites that prevent work release.** `DEMO-HDV-030003` (Greenhaven) has event 5 recorded, four open release prerequisites, and event 6 explicitly not satisfied.

---

## 5. State model

### 5.1 Handover states — all proposed

No verified contract defines a delivery-handover state. The only implemented fact is that `opportunity_handovers_due.status` is exactly `'Due'` and immutable. **Every state label below is therefore a proposal in this package**, and the workspace says so.

| Proposed state | Meaning | Entered when | Owner of the next action |
|---|---|---|---|
| `Awaiting preparation` | No revision is awaiting review and nothing has been returned | Seed, after withdrawal, or after a Won record with owned gaps | Sending owner |
| `Awaiting receiving review` | Exactly one revision is submitted | `submit` succeeds | Receiving owner |
| `Returned for clarification` | The latest decision was a return and no successor has been submitted | `review` with `Return for clarification` | The finding's named responder |
| `Accepted — follow-through outstanding` | Responsibility is accepted and either an obligation or a release prerequisite is open | `review` with an accepting decision, while follow-through remains | Obligation or prerequisite owner |
| `Accepted — complete` | Responsibility is accepted and no obligation or release prerequisite is open | Last obligation and prerequisite satisfied | Receiving owner |
| `Renewed acceptance required` | A bound source changed after acceptance | Source fingerprint diverges from the accepted fingerprint | Sending owner |

`Routing decision required` is deliberately **not** a state. It is a destination condition with an owned action, shown inside `Awaiting preparation`, because routing is a property of the destination rather than of the handover's review position.

### 5.2 Revision states

`Submitted` → `Returned` | `Accepted` | `Superseded` | `Withdrawn`. A revision's stored payload and fingerprint are never rewritten; only its state label changes, and the model validates that at most one revision is `Submitted` at any time.

### 5.3 Requirement outcomes

`Not received`, `Received — reviewed`, `Received — insufficient`, `Not applicable` (reason mandatory), `Restricted to this viewer`. **Missing evidence and evidence reviewed and found insufficient are different findings** and are stored, displayed and filtered separately. Each change pushes the previous outcome, finding, reviewer and date onto a retained history.

### 5.4 Conversion outcomes

Reproduced from ES-07 without alteration: `Not prepared`, `Prepared`, `Confirmed`, `Partially confirmed`, `Outcome unknown`, `Failed — no effect`, with per-target `Prepared`, `Submitted`, `OutcomeUnknown`, `FailedNoEffect`, `Confirmed`. CR-03 reports them. It never creates a conversion, offers a retry, or simulates a compensating effect.

---

## 6. View 1 — Handover register

### 6.1 Purpose

A searchable queue of Won opportunities requiring a delivery handover, answering *whose turn is it and what is in the way*.

### 6.2 Saved views

Chips across the top of the register: **All handovers**, **My handovers**, **Awaiting preparation**, **Awaiting receiving review**, **Returned for clarification**, **Accepted with outstanding follow-through**. *My handovers* resolves against the current preview identity and matches either the sending owner or the receiving owner, because both are "mine" at different points in the journey.

### 6.3 Summary cells

Four contiguous summary cells show counts for Awaiting preparation, Awaiting receiving review, Returned for clarification, and Accepted with follow-through. **Each cell opens exactly its contributing records** by switching the saved view; it does not apply a lookalike filter. The native browser check asserts that the row count after clicking a cell equals the number printed on that cell, and that the first row is the expected record.

Counts are computed over the **permitted** set only. No count, search result or snapshot includes a record the current identity may not read.

### 6.4 Register columns

| Column | Content |
|---|---|
| Handover & opportunity | `DEMO-HDV-…` reference, opportunity reference and title |
| Customer, site and areas | Customer name, site name, affected facilities / growing areas |
| Destination & receiving owner | `Project` / `Service` / `Parts order` / `Routing decision required`, receiving owner and team |
| Accepted basis | Quotation reference and issue revision, accepted amount excluding GST, acceptance state |
| State | The proposed state, colour-toned by severity |
| Submitted / response due | Latest revision and its submission date; required response date when one is recorded, otherwise "No response date recorded" |
| Blockers and owned gaps | Count of outstanding items, count of sender-owned information gaps, and the first blocker in full |
| Next action & owner | The single next action and the person who owns it |
| Conversion | ES-07 outcome and order identity, or "No order identity" |
| Last activity | Date and kind of the last retained history entry, plus the source read time |

For an accepted handover the blocker column switches from acceptance blockers to **release prerequisites**, because that is what is actually outstanding once responsibility has transferred.

### 6.5 Filters

Owner, receiving destination, customer, site, state and response due (`Overdue`, `Due today`, `Due within seven days`, `No response date recorded`), plus free-text search across reference, opportunity, title, customer, site, destination, receiving owner, quotation reference and area names. Filters compose with the saved view; the count line reports how many permitted records fall outside the current view and filters.

### 6.6 Four different empty conditions

The brief requires these to be distinguishable, and they are rendered as four different things:

| Condition | What the user sees |
|---|---|
| **No results** | An empty state that says explicitly *"This is an empty result, not an unavailable source or a restricted record"*, with a Clear filters control |
| **Unavailable source** | The register still lists records, with a warning band naming the source that could not be read, and the affected requirements shown as **Source unavailable** rather than as satisfied or missing |
| **Incomplete loading** | The register is withheld entirely, with a statement that counts and filters are withheld until the complete permitted set is available, *so a partial list is never presented as the whole queue* |
| **Restricted access** | Permitted records render normally; the count line states how many records are not available to this identity, without naming them, and they are excluded from every count, search result and snapshot |

### 6.7 Submission does not clear follow-up

A successful submission changes the handover's state and nothing else. Obligations, actions and release prerequisites are separate records with their own lifecycles; no command in the model closes one as a side effect of another. The model check asserts that acceptance leaves the release prerequisite count unchanged apart from obligations explicitly named at acceptance.

---

## 7. View 2 — Accepted commercial basis

### 7.1 Immutability

The view opens with a locked banner: *"Immutable within this workspace. Preparation notes and receiving findings are recorded separately and never alter the accepted basis."* No command in the model writes to `commercial.lines`, `commercial.selections`, `commercial.discount` or `commercial.totals`. The only permitted writes to the commercial object are:

- `attach` — records that a **missing** supporting document is available at an exact revision in its owning workspace, with a stated source. It is not a checklist tick (section 7.5).
- `sourceChange` — represents an upstream event in the quotation lifecycle or Engineering, which is displayed as a change *to the source*, not as an edit made here.

### 7.2 Content

| Group | Fields |
|---|---|
| Identity | Quotation reference and issue revision, issue state, issued date, valid-until date, what it supersedes, issued document hash, customer and organisation reference, opportunity reference with its Won date and version |
| Acceptance evidence | State (`Recorded` / `Missing` / `Superseded` / `Expired` / `Disputed`), date, accepting person and position, channel, evidence reference, and any superseded note |
| Customer purchase order | Reference and received date, or "Not supplied" |
| Amounts | Accepted lines with section, detail, accepted quantity and accepted amount; the selection envelope with each option's selected/not-selected state, delta and note; the discount as a negative line; and a totals block with ex-GST, GST and inc-GST |
| Scope | Inclusions, exclusions and deliverables as three separate lists |
| Dates and commitments | Each entry tagged **Customer-requested date**, **Quoted assumption** or **Confirmed commitment** |
| Supporting documents | Reference, exact revision, title, state, owner, retained hash, and the owning-workspace provenance where one was recorded |
| Clarifications | Outstanding clarifications and commitments with their owners and status |

### 7.3 Amounts are not recomputed

For the Riverbend fixture the accepted amounts are reproduced from the retained quotation r03 document exactly: base lines totalling **$146,533.34**, the selected root-zone monitoring option at **+$12,533.33**, the project discount at **−$4,500.00**, giving **$154,566.67 excluding GST**, **$15,456.67 GST** and **$170,023.34 including GST**. Note that in the source document `sellCents` is a **line total**, not a unit rate; the design carries it through unchanged and does not multiply by quantity. GST is calculated the same way ES-06 calculates it — `round(exGst × gstRateBp / 10000)` — and the model asserts `exGst + gst = inclGst` on every validation.

### 7.4 Three kinds of date, never merged

A customer-requested date, a quoted assumption and a confirmed commitment are visually and structurally distinct, and the view states: *"None of them is a delivery promise made by this workspace."* Nothing in the design turns an estimate or an internal target into a customer promise, and no date entered here is propagated to a schedule.

### 7.5 A missing document stays missing

A supporting document recorded as `Missing` cannot be cleared by any requirement outcome. The only way it becomes `Available` is the `attach` command, which requires **an exact issued revision matching `rNN`** and **a stated owning workspace and record of at least ten characters**. Both refusals are checked. The resulting state carries a `suppliedFrom` provenance string and the view says the bytes remain with the owning workspace — this design holds no files.

### 7.6 Commercial changes belong elsewhere

A side card states that scope, price and terms changes belong to the quotation lifecycle, offers the issue snapshot, and offers to record an **owned commercial-revision request** as an action. There is no control anywhere in the workspace that amends an accepted basis.

---

## 8. View 3 — Delivery destination

### 8.1 Three existing destination types

| Destination | Fields shown |
|---|---|
| **Project** | Receiving project owner and team, project reference or an explicitly labelled *proposed receiving record* with no allocated reference, delivery scope allocation, Engineering dependencies with their owners and states |
| **Service** | Receiving service owner and team, work-order reference and version with its current `Draft`/`Authorised` state, equipment and area scope, authority prerequisites including work-order authorisation and any open blocking incident |
| **Parts order** | Receiving fulfilment owner and team, verified order identity where available, delivery destination, fulfilment dependencies including stock observation completeness |

### 8.2 No invented routing

The design adopts **no numerical routing threshold**. The estimating decisions leave numeric routing unadopted, so where an approved source has already routed the scope, the workspace shows that route and its stated basis; where none exists it shows **Routing decision required** with an owned action and the routing owner. The `route` command exists but refuses when the handover is not marked routable by an approved source, and the demonstration's Cedar Vale record is deliberately not routable. The view states this in writing: *"No routing threshold is invented here."*

### 8.3 Party distinctions preserved

Customer, site operator, site owner, bill payer, ERP account and provider entity are shown as six separate values, together with the delivery location. The Customer 360 snapshot repeats the warning that *"neither hierarchy nor relationship grants billing or access authority."* Greenhaven's fixture deliberately has a site owner (`Greenhaven Land Holdings Pty Ltd`) different from its operator and bill payer, so the distinction is visible rather than asserted.

### 8.4 ES-07 outcomes shown accurately

A dedicated card shows the conversion operation, outcome, order identity, preparation date, provider entity and a per-target table of outcome and confirmed identity. All five requested cases are representable and three are demonstrated in the fixtures:

| Requested case | Rendering | Fixture |
|---|---|---|
| Conversion not yet completed | `Not prepared` / `Prepared`, no order identity | `DEMO-HDV-030004` |
| Confirmed target reference | `Confirmed`, every target with a `SYN-SO-…` identity | `DEMO-HDV-030001/2/3` |
| Partial outcome | `Partially confirmed`, mixed target states | `DEMO-HDV-030005` |
| Unknown outcome requiring reconciliation | `Outcome unknown` at operation level; `OutcomeUnknown` at target level | `DEMO-HDV-030005` line L2 |
| Failed with confirmed no effect | `Failed — no effect` at operation level; `FailedNoEffect` at target level | `DEMO-HDV-030005` line L3 |

The card footer always ends with the same invariant: *"This workspace creates no second conversion, no retry and no compensating effect."* The only control offered for an unresolved outcome is an owned reconciliation action addressed to the conversion coordinator, and a link back to ES-07.

### 8.5 Scope allocation table

Every accepted line and selected option is listed with an explicit `Allocated` / `Not allocated` tag and its amount, followed by two totals: allocated to this destination, and accepted total. The footer explains which discount rule applied (section 3.2) and names **OQ-03** where allocation is incomplete.

---

## 9. View 4 — Readiness review

### 9.1 Two classes, stated as such

The view is split into two bands with explicit headings:

- **Required before receiving responsibility can be accepted** — every item must be `Received — reviewed`, or `Not applicable` with a reason, before any accepting decision is permitted.
- **May remain open at acceptance — must be satisfied before work release** — these prerequisites survive acceptance, are carried forward as owned obligations, and block work authorisation rather than the transfer of responsibility.

### 9.2 Requirement coverage

The ten information categories the brief names are represented: commercial basis and acceptance evidence; technical brief, survey and design information; site and exact facility/growing-area scope; equipment identity and relevant configuration; materials, supplier assumptions and lead-time evidence; site access, biosecurity, induction and shutdown constraints; customer responsibilities and contact arrangements; documents, drawings, training and commissioning obligations; unresolved questions, assumptions and risks (carried as clarifications and obligations); and proposed delivery ownership with immediate next actions (carried in the destination and next-action fields).

Each requirement row shows applicability, source, owner, review date, reviewer, status, the recorded finding, the exact source record where one was given, a not-applicable reason where relevant, and the count of retained earlier outcomes.

### 9.3 The invariant this view exists to protect

A prominent warning states:

> **A checklist acknowledgement is not permission.** Recording a requirement as reviewed establishes that the information was received and assessed. It does not establish site permission, induction completion, work authority, a confirmed booking or dispatch readiness. Those remain decisions of their own workspaces.

This is enforced structurally, not only in copy: no command in the model writes work authorisation, appointment state or dispatch readiness, and an accepting decision records `releaseAtAcceptance` — the list of prerequisites that were still open at that moment — directly onto the decision record.

### 9.4 Documented rules versus the hypothetical rule set

| Rule | Status |
|---|---|
| Supply readiness states `Not assessed` / `Evidence needed` / `At risk` / `Blocked` / `Ready` | **Documented**, used unchanged from the Supply Chain readiness contract |
| Work-order authorisation binds an exact scope revision, scope version and policy version | **Documented**, used unchanged from the Service API contract |
| CS-06 visit-requirement review is source information, not induction completion, crop-entry permission, shutdown approval, dispatch or attendance | **Documented**, used unchanged from the Customers, Sites & Growing Areas handover |
| Which requirements are mandatory before acceptance, per destination type | **CR3-RULE-01 — hypothetical demonstration rule set**, labelled as such in the workspace |

CR3-RULE-01 is stated in three lines in the workspace and is explicitly *not* corporate policy, approval authority or a spend limit. No exception mechanism is offered anywhere: there is no override, no "accept anyway" and no approval-level escalation, because inventing one would imply an authority that does not exist.

---

## 10. View 5 — Receiving decision and controlled revision

### 10.1 The full cycle

A four-step strip shows Prepare → Submit → Review → Accepted with the current fact under each. The complete cycle is preparation, submission, review, return, correction, resubmission and acceptance, and every step is functional in the standalone file.

### 10.2 What a decision shows and records

| Element | Content |
|---|---|
| Exact revision under review | Revision label, submission date, submitting person, required response date |
| Sending and receiving responsibilities | The closing sales owner and the receiving owner with their team |
| Commercial and destination basis | Quotation issue and revision with acceptance state; destination type and receiving record |
| Conversion basis | ES-07 outcome and order key |
| Findings and blockers | Acceptance blockers listed in full, and release prerequisites listed separately with the statement that acceptance will not satisfy them |
| Proposed decision and reason | `Accept responsibility`, `Accept with outstanding obligations` or `Return for clarification`, with a reason of at least 20 characters |
| Outstanding obligations | Title, owner and date for each, each becoming its own record |
| Consequences | The decision record stores the bound quotation, issued document hash, conversion operation and outcome, receiving record and version, opportunity version, and the release prerequisites open at that moment |

### 10.3 Acceptance semantics

An acceptance records responsibility **for the reviewed scope**, nothing wider. Permitted outstanding obligations remain individually visible, individually owned and individually dated; the decision card lists them and the register keeps counting them. There is no aggregate "accepted" flag that hides them.

### 10.4 Return semantics

A return must name findings. Each finding requires a detail of at least ten characters, a named responder and a response date that is a real calendar date not in the past — `2026-02-30` is refused, which the model check asserts. The returned submission is preserved byte-for-byte: the model check captures the submitted revision's payload before the return and asserts deep equality after the return, after the correction and after the successor acceptance.

### 10.5 Correction and comparison

A correction creates a **successor revision**; it never edits the returned one. The comparison grid flattens both revision payloads to individual fields — including each document entry and each requirement entry as its own row — and shows only the changed rows, with `changed`, `added` and `removed` toning. In the demonstrated journey the comparison shows exactly three changed rows: the wiring schedule moving from `Missing` to `Available` with its new hash, and two requirement outcomes moving from `Not received` / `Received — insufficient` to `Received — reviewed`. Scope, documents, destinations, dates, owners and resolved findings are all inside the compared payload.

### 10.6 Binding and non-inheritance

Acceptance binds the exact reviewed revision fingerprint. A later change to any bound source makes the accepted fingerprint diverge from the current one, and:

- the handover state becomes `Renewed acceptance required`;
- a banner states that the recorded acceptance is retained exactly as decided and *"Acceptance is never inherited silently"*;
- the original decision, its reason, its decider and its bound sources remain visible and unaltered in history — the model check asserts the serialised reviews array is byte-identical across a source change;
- each recorded decision carries a live marker reading either "Still applicable to the current source" or "Source has changed since this decision".

Historical responsibility is never overwritten. A renewed acceptance is a new decision against a new revision, and both are retained.

### 10.7 Confirmation, cancellation and failed validation

Every consequential command requires an explicit confirmation checkbox: submission, receiving decision, and the demonstration source changes. Cancel closes the dialog and writes nothing. Failed validation shows the message in an alert region inside the dialog, leaves every entered value in place, and — the model check asserts this for every refusal path — changes no byte of state.

---

## 11. View 6 — History, follow-through and recovery

### 11.1 Content

The responsibility chain (section 4), then a chronological evidence list covering preparation and submission revisions, review findings, returns and responses, receiving decisions, source changes and their consequential review, destination references and confirmed receiving outcomes, work-release statements, obligations and their completion evidence, and prepared receiving links. Nothing is removed by a later correction; a correction appends.

Alongside it: the submitted-revision list with each revision's state, note, submitter, response date and any withdrawal reason; the owned follow-up list using the shared Activities / My Work pattern; the prepared receiving links; and the connected-records card.

### 11.2 Three kinds of acceptance kept apart

Customer acceptance (event 1), internal receiving acceptance (event 5) and notification delivery are three separate records. This design creates no notification at all: a prepared receiving link is explicitly labelled *"Prepared locally. It creates no application record, booking, order or notification."* There is no path in the workspace that could be mistaken for having told someone.

### 11.3 Back-links and forward-links

Accepted handovers link back to Customer 360 and the originating opportunity through snapshots, and forward to the Project, Service, parts-order, My Work and Finance workspaces through prepared links. Forward links are disabled until responsibility is accepted, and each target can be prepared only once — the model refuses a duplicate with *"This receiving link has already been prepared. It creates no second record."*

### 11.4 Recovery cases

| Case | Behaviour |
|---|---|
| **Source or handover changed during review** | The `review` command compares the submitted revision's fingerprint against the current one and refuses with *"A bound source changed while this revision was under review. A corrected successor revision is required."* The register's blocker column shows the same finding. |
| **Destination changed or became unavailable** | The destination record is marked unavailable with its reason, a banner appears, the destination card explains that responsibility cannot be accepted against an unavailable receiving record, and the submitted revision is preserved for re-routing. |
| **Access changed** | Switching to the restricted identity removes the record from the permitted set. Counts, search and snapshots recompute over permitted records only, and the count line discloses the number excluded without naming them. |
| **Save failure** | The command is not executed at all. The dialog shows the error, every entered value is retained, and the state is deep-equal to the state before the attempt. |
| **Response lost after a decision was submitted** | The record is written, the response is treated as lost, a banner states that the original operation must be reconciled before another consequential submission, and **Recover the original operation** replays the same operation identity. The replay returns the original result object and creates no second record. |
| **Partial or unknown external outcomes** | Reported from ES-07 with per-target detail, blocked at acceptance for a parts-order destination, and referred to ES-07 for reconciliation. No retry, no compensating effect, no second conversion. |
| **Previously accepted work requiring a revised handover** | `Renewed acceptance required`, with the original decision retained in full (section 10.6). |

### 11.5 Reconciling before the next consequential submission

The lost-response banner is not advisory dressing: it states the rule, and the intended application behaviour is that the original operation is reconciled before another consequential submission is accepted. In this standalone demonstration the banner and the recovery control implement that rule at the presentation layer; the model enforces the underlying guarantee, which is that replaying an operation identity can never produce a second effect.

### 11.6 Late responses cannot appear under another identity

The operation key is `(operation id)` resolved against a stored receipt that also records **the acting identity** and **the bound handover**. Three refusals follow, all asserted in the model check:

- same operation identity, different content → *"The same operation identity was reused with different content."*
- same operation identity, different handover → *"This operation belongs to another handover. No original result is disclosed."*
- same operation identity, different identity → *"This operation belongs to another identity. No original result is disclosed."*

In each case nothing is disclosed: the refusal does not reveal the original result, its customer or its existence beyond the fact that this key is not this caller's.

---

## 12. Incoming and outgoing boundaries

### 12.1 Incoming

| Source | What CR-03 consumes | What CR-03 must never do |
|---|---|---|
| Customer 360 (CS-01/CS-02/CS-04/CS-05) | Organisation, contact, site, facility and growing-area identity; operator/owner/bill-payer meanings; visit requirements as source information | Infer billing or access authority from hierarchy; treat a visit requirement as site permission |
| Opportunity (CRM) | Won outcome, opportunity version, outcome event, narrative acceptance note, immutable handover-due record, ownership-transfer history | Treat the narrative note as bound acceptance evidence; treat an ownership transfer as a delivery handover |
| Quotation lifecycle (ES-05/ES-06) | Accepted issue and revision, issued-document hash, customer response, selections, amounts, terms, supporting documents and their revisions | Amend an accepted basis; inherit an acceptance across a revision |
| Item resolution and conversion (ES-07) | Conversion operation, outcome, order key, per-target correlations | Create, retry or compensate a conversion |
| Equipment & Installed Base | Asset identity, installed location, served relationships | Infer hydraulic capacity or control grouping from a served relationship |
| Supply Chain readiness | Stock observation completeness, promise evidence | Treat partial availability as zero stock or as a verified available-to-promise |

### 12.2 Outgoing

| Receiving domain | What it gets | What stays with it |
|---|---|---|
| Projects | A recorded acceptance of an allocated scope with its bound sources and open prerequisites | Project creation, delivery readiness, change control, forecast dates, work release |
| Service | The same, plus equipment and area scope | Work-order authorisation with its exact scope/policy versions, booking, dispatch hold, attendance |
| Supply Chain / parts order | The same, plus the delivery location and the confirmed order identity | Demand, promise, allocation, receipt, inspection and dispatch |
| My Work / Activities | Owned follow-up references using the shared pattern | Activity ownership, completion authority and its own recovery rules |
| Finance | Nothing in this increment; a prepared local link only | Every cost, commitment, invoice, revenue, payment and balance definition; no financial definition, threshold or approval authority is invented here |

### 12.3 ERP authority

MYOB Acumatica remains the intended authority for ERP order and account information. Every external key in this design is a clearly identified synthetic example (`SYN-SO-…`, `SYN-CUST-…-AU`, `SYN-PPA-AU`), no endpoint is named or invented, and the ERP account field is labelled with its intended authority wherever it appears.

---

## 13. Permissions and identity

### 13.1 Proposed capabilities

| Capability | Held by | Grants |
|---|---|---|
| `handover.read` | All five preview roles | Read a permitted handover |
| `handover.prepare` | Sending owner | Start or update a draft revision; record routing from an approved source; record a missing document as supplied |
| `handover.submit` | Sending owner | Submit a draft for receiving review |
| `handover.withdraw` | Sending owner | Withdraw a submitted revision before a decision |
| `handover.review` | Receiving owners | Record receiving review outcomes against requirements |
| `handover.decide` | Receiving owners | Record a receiving decision |
| `obligation.manage` | Receiving owners | Complete an outstanding obligation |
| `commercial.read` | All except the restricted viewer | See accepted amounts and acceptance detail |
| `action.create` | All except the restricted viewer | Create an owned follow-up |

### 13.2 Scope, not just capability

Holding `handover.decide` is insufficient. A receiving decision additionally requires that the identity's receiving destination equals the handover's destination. The Service owner cannot decide a Project handover, and the control is disabled with the reason stated in the interface rather than silently hidden. The model enforces the same rule and the browser check asserts both the disabled control and the refusal message.

### 13.3 Restricted content

The restricted viewer:

- cannot read one of the five handovers at all — it is absent from the register, from the select control, from search results and from every count, and the count line discloses only that one record is unavailable to this identity;
- sees every monetary value replaced by `Restricted` with a title attribute explaining why, in the register, the basis view, the allocation table and the submission dialog;
- cannot prepare, submit, decide, complete an obligation or create an action.

### 13.4 This is presentation, not security

Stated in the interface, in the preview-options dialog and here: **a static role switch is not authentication and is not a security boundary.** A later application must enforce capability, workspace, company and site scope on the server, must filter restricted commercial detail, private communications and inaccessible documents server-side, and must ensure that counts, search results, cursors and snapshots cannot leak the existence or attributes of records the caller may not read.

---

## 14. Demonstration scenarios and synthetic assumptions

### 14.1 The five fixtures

| Handover | Customer / site | Destination | Conversion | Seeded state | Demonstrates |
|---|---|---|---|---|---|
| `DEMO-HDV-030001` | SYN Riverbend Produce — Glasshouse 3, Cobram VIC | Project (proposed record) | `Confirmed` · `SYN-SO-00001` | Awaiting receiving review, r01 | Journeys 2, 6 and 7 |
| `DEMO-HDV-030002` | Northbank Nursery — Propagation site, Irrigation room | Parts order · `SYN-SO-00002` | `Confirmed` | Awaiting receiving review, r01 | Journey 1 |
| `DEMO-HDV-030003` | Greenhaven Berries — Berry tunnels, Tunnel 06 | Service · `SYN-PPO-WO-000245` (Draft) | `Confirmed` · `SYN-SO-00003` | Accepted — follow-through outstanding | Journey 3 |
| `DEMO-HDV-030004` | Cedar Vale Growers — Young plant facility, Bay 03 | Routing decision required | `Not prepared` | Awaiting preparation | Journey 4 |
| `DEMO-HDV-030005` | Willowbank Horticulture — Nursery & propagation, Irrigation Shed 01 | Parts order · `SYN-SO-00005` | `Partially confirmed` | Awaiting receiving review, r01 | Journey 5 |

### 14.2 The eight required journeys

1. **Parts-order handover with a confirmed ERP order, reviewed scope and accepted fulfilment responsibility.** `DEMO-HDV-030002` seeds with zero acceptance blockers, so the Fulfilment owner can review and accept in one pass. Its stock observation remains `Received — insufficient` as a release prerequisite, so acceptance is real but follow-through survives.
2. **Project handover returned for missing technical information, corrected and resubmitted with a comparison.** `DEMO-HDV-030001`: Dana Brooks returns r01 with two findings; Priya Raman records the wiring schedule as supplied at r01 with its source; the two requirement outcomes are reviewed; r02 is prepared and submitted; the comparison shows exactly the changed fields; Dana accepts with one outstanding obligation.
3. **Service handover with a known asset and an outstanding site prerequisite that prevents work release.** `DEMO-HDV-030003`: asset `SYN-PPO-AST-000105` (Vent drive 05, UUID `11111111-1111-4111-8111-111111111105`) in Tunnel 06; work order `SYN-PPO-WO-000245` is `Draft`; incident `SYN-QA-EVT-000501` is open and blocking; the accepted decision records four release prerequisites still open and states that work is not authorised or released by the acceptance.
4. **A Won opportunity with missing customer acceptance evidence.** `DEMO-HDV-030004`, described in section 4.
5. **An ES-07 partial or unknown conversion outcome requiring reconciliation.** `DEMO-HDV-030005`: order header and L1 `Confirmed`, L2 `OutcomeUnknown`, L3 `FailedNoEffect`. Acceptance is refused under CR3-RULE-01 and the only offered control is an owned reconciliation action addressed to ES-07.
6. **An accepted handover whose commercial or technical source subsequently changes.** Two forms are demonstrated: the accepted quotation superseded to R03 after acceptance on `DEMO-HDV-030001` (renewed acceptance required, original decision retained), and a technical document advanced during review on `DEMO-HDV-030002` (stale-review refusal).
7. **A review interrupted by a stale revision or lost response.** The stale case is scenario 6's second form. The lost-response case is demonstrated on `DEMO-HDV-030005` with an owned action, including the recovery control and the assertion that recovery produces no second record.
8. **Switching between customers and identities without retaining another context's records.** Changing the selected handover clears the comparison selection and the recovery banner and rebuilds every view from the newly selected record; the browser check asserts that Riverbend's quotation reference does not appear anywhere in the Greenhaven view. Changing identity rebuilds the permitted set, the select control and every count.

### 14.3 Synthetic assumptions stated

- Every organisation, person, email address, address, purchase order, amount, document reference and external key is fictional. Names used — Priya Raman, Dana Brooks, Morgan Hale, Sam Whitcombe, Lee Tran, Alex Morgan, Robin Ellis, Casey Reed, Alison Reid, Daniel Moss — are fictional and assign no employee, department or corporate authority.
- The Riverbend accepted amounts reproduce the retained quotation r03 document's own lines and declared selection defaults. The acceptance event itself is a fictional example, consistent with the ES-06 fixture at PR #213's pinned head but not imported from it.
- Northbank, Greenhaven and Cedar Vale identities, assets, work orders and the open incident are reused from the Quality & Site Assurance r01 fixture so that the two designs stay consistent.
- Willowbank's site, Irrigation Shed 01 and pump `SYN-PPO-AST-000501` (UUID `33000000-0000-4000-8000-000000000501`, serving Greenhouse 01, Tunnel 01 and Propagation House 01) are reused from the Customers, Sites & Growing Areas r03 and Projects readiness r01 fixtures.
- All dates sit in `Australia/Melbourne`, the demonstration date is 16 September 2026, and money is AUD with GST shown separately.

---

## 15. Desktop, mobile and accessibility behaviour

### 15.1 Responsive composition

| Breakpoint | Behaviour |
|---|---|
| ≥ 1151 px | Two-column working layout (content plus a 315 px support column); ten-column register; nine-cell responsibility chain in one row; four-cell summary strip |
| ≤ 1150 px | Support column narrows to 280 px; the responsibility chain wraps to three columns; the register drops its lowest-value column |
| ≤ 850 px | Single column; header stacks; context card stacks; three-card rows collapse |
| ≤ 600 px | Register becomes labelled cards with each cell carrying its column name; summary cells become a 2 × 2 grid; the responsibility chain becomes one cell per row; the comparison grid becomes stacked field blocks with the field name as a small caption; dialogs become full-width; principal controls keep a 44 px minimum target |

Every view was checked at 1440, 1024, 820, 390 and 320 pixels with an assertion that `document.documentElement.scrollWidth` never exceeds the viewport. Thirty-one original captures were produced.

### 15.2 Accessibility

- A skip link moves focus to `#content`, verified by pressing Enter on it and asserting the active element.
- Tabs are buttons with `aria-current="page"` and Left/Right arrow-key movement that also moves focus, verified.
- Register rows are focusable, expose `role="button"` with a descriptive `aria-label`, and respond to Enter and Space.
- The decision dialog is a native `<dialog>`; Escape closes it and focus returns to the invoking control, verified.
- Validation errors are announced through `role="alert"` and receive focus.
- The save status and toast use `role="status"` with `aria-live="polite"`.
- The responsibility chain is a `role="list"` of `role="listitem"` cells so its nine steps are enumerable.
- Every form control has a visible associated label; no control relies on placeholder text alone.
- Colour is never the only carrier of meaning: every tone is paired with a text label (`Confirmed`, `Not allocated`, `Received — insufficient`, and so on).
- Focus is visible at a 2 px outline with 3 px offset throughout.

**Not verified:** real screen-reader output, physical device testing, 200 % zoom reflow, forced-colours mode, and print pagination. These remain outstanding and are listed in section 18.

### 15.3 Language and conventions

Australian English throughout, dates as `dd Month yyyy` in prose and ISO 8601 in file names, money in AUD with GST shown separately, metric units, and business language in business flows. Implementation terminology appears only where it is the subject — for example, the opportunity snapshot names `ppo.opportunity_handovers_due` precisely because the point being made is what the implemented record actually is.

---

## 16. Implemented HTML interactions versus future application work

### 16.1 Functional in the standalone file

Saved views; summary cells that open their contributing records; search and six filters; record selection; all six views; all seven snapshots; record a requirement review outcome with retained history; record a missing document as supplied with provenance; record a routing decision; prepare, submit and withdraw a revision; record a receiving decision with findings or obligations; complete an obligation; create an owned follow-up with duplicate refusal; prepare a receiving link once; revision comparison with a revision selector; three demonstration source changes; role switching; register-source simulation; save-outcome simulation with failure and lost-response recovery; JSON export; damaged-session preservation; and reset.

### 16.2 Deliberately not functional

Anything that would constitute a real effect: no ERP call, no project or work-order creation, no booking, no message, no notification, no document issue, no financial effect. Receiving screens that are not implemented are reached through clearly labelled snapshots rather than through fabricated navigation.

### 16.3 Browser persistence limitation

The session is held in `localStorage` under `ppo-cr03-handover-r01`. That storage belongs to one browser on one device, can be unavailable, cleared or blocked, and is never shared. Every read and write is guarded: a failure switches the workspace to page-only state and says so in the status line; a damaged record is preserved exactly as stored, offered as a download, and never overwritten without an explicit discard. This is a demonstration convenience and is not a durable store, an offline queue or evidence of server idempotency.

---

## 17. Traceability — requested capability to location and evidence

| # | Requested capability | Location in the HTML | Verified by |
|---|---|---|---|
| 1 | Searchable queue of Won opportunities requiring handover | Handover register | Browser 1 |
| 2 | Register shows handover reference, opportunity, customer, site, areas, destination, owners, accepted quotation and revision, state, dates, blockers, next action, conversion, last activity | Register table columns | Browser 1, capture `1440-register` |
| 3 | Useful saved views | Register view chips | Browser 2 |
| 4 | Filters for owner, destination, customer, site, state, due date | Register toolbar | Browser 3 |
| 5 | No results, unavailable source, incomplete loading and restricted access distinguished | Register empty state, warning band, loading state, count line | Browser 3, Browser 4 |
| 6 | Summary counts open the exact contributing records | Register summary cells | Browser 2 |
| 7 | Submission does not remove unresolved follow-up | Obligations and release prerequisites | Model 13, Model 20, Browser 23 |
| 8 | Exact accepted commercial evidence, immutable | Accepted commercial basis | Model 1, Browser 5, capture `1440-basis` |
| 9 | Missing, expired, superseded or disputed evidence shown clearly | Acceptance card, document list | Browser 5, Browser 21 |
| 10 | A missing supporting document stays missing | `attach` command guards | Model 10, Browser 12 |
| 11 | Customer-requested dates, quoted assumptions and confirmed commitments distinguished | Commitments card | Browser 5 |
| 12 | Source snapshots and a link to the quotation workflow | Seven snapshots; commercial-revision request | Browser 6 |
| 13 | Three destination types with their own fields | Delivery destination | Browser 7, capture `1440-destination` |
| 14 | No invented routing threshold; "Routing decision required" with an owned action | Destination routing card | Model 4, Browser 21 |
| 15 | Customer, operator, owner, bill-payer, ERP account and entity distinctions | Destination facts; Customer 360 snapshot | Browser 6, Browser 7 |
| 16 | Five ES-07 outcomes shown accurately | Conversion card and target table | Model 2, Model 17, Browser 7, Browser 20 |
| 17 | Link to ES-07; no second conversion or retry | Conversion card footer and reconciliation action | Browser 7, Browser 20 |
| 18 | Explicit scope allocation; accepted total not duplicated | Allocation table and totals | Model 3, Browser 7 |
| 19 | Split routing recorded as an open requirement | Allocation footer, OQ-03 | Model 3, Browser 7 |
| 20 | Readiness information with applicability, source, review date, owner and status | Readiness review rows | Browser 8, capture `1440-readiness` |
| 21 | Not-applicable reason required | `requirement` command guard | Model 11 |
| 22 | Missing evidence separated from insufficient evidence | Requirement outcome vocabulary | Model 11, Browser 8 |
| 23 | Acceptance evidence separated from work-release prerequisites | Two readiness bands | Model 13, Browser 8 |
| 24 | Documented rules used; demonstration rule set labelled hypothetical | Applicability rule-set card | Browser 8 |
| 25 | Acknowledgement is not permission | Readiness warning; `releaseAtAcceptance` | Model 13, Browser 8, Browser 22 |
| 26 | Prepare, submit, review, return, correct, resubmit, accept | Receiving decision view | Model 7–14, Browser 10–15 |
| 27 | Decision shows exact revision, responsibilities, basis, findings, obligations and consequences | Decision dialog and decision cards | Browser 15 |
| 28 | Outstanding obligations individually visible and owned | Obligations card | Model 20, Browser 23 |
| 29 | A return identifies what is missing, who responds and when | Return findings | Model 7, Browser 10, Browser 11 |
| 30 | Returned submission preserved unchanged | Revision payload immutability | Model 9, Model 13 |
| 31 | Correction creates a successor revision with a readable comparison | Comparison grid | Model 12, Browser 14, capture `1440-comparison` |
| 32 | Acceptance bound to the exact reviewed revision and evidence | `boundSources`, `revisionFingerprint` | Model 13, Browser 15 |
| 33 | A later change does not inherit acceptance | Renewed acceptance required | Model 15, Browser 16, capture `1440-renewed` |
| 34 | Original decision retained while showing subsequent change | Decision cards with applicability marker | Model 15, Browser 16 |
| 35 | Explicit confirmation; cancel and failed validation preserve state | Confirmation checkboxes; error region | Model 8, Browser 11, Browser 19 |
| 36 | Chronological evidence view | History & follow-through | Browser 22, capture `1440-history-chain` |
| 37 | Customer acceptance, receiving acceptance and notification kept separate | Responsibility chain; link labelling | Model 21, Model 23, Browser 22 |
| 38 | Back-links to Customer 360 and the opportunity; forward links to receiving workspaces | Connected records card | Model 21, Browser 6 |
| 39 | Shared Activities / My Work patterns without duplicate obligations | `action` command with duplicate refusal | Model 20 |
| 40 | Recovery: source changed during review | Stale-review refusal | Model 16, Browser 17 |
| 41 | Recovery: destination unavailable | Destination availability banner and blocker | Model 18 |
| 42 | Recovery: access changed | Permitted set, counts and search | Browser 4 |
| 43 | Recovery: save failure | Failed-save simulation | Browser 19 |
| 44 | Recovery: lost response after a decision | Lost-response banner and recovery | Model 19, Browser 18 |
| 45 | Recovery: partial or unknown external outcomes | Conversion card and acceptance blocker | Model 17, Browser 20 |
| 46 | Recovery: previously accepted work requiring a revised handover | Renewed acceptance required | Model 15, Browser 16 |
| 47 | Late responses cannot appear under another customer, handover or identity | Receipt key checks | Model 19 |
| 48 | Proposed permissions documented without assigning unconfirmed authority | Preview roles; section 13 | Browser 9, Browser 4 |
| 49 | Restricted detail protected including through counts, search and snapshots | Permitted set and amount masking | Browser 4, capture `1440-restricted-basis` |
| 50 | Eight synthetic journeys | Five fixtures | Model and browser groups as listed in section 14.2 |
| 51 | Local save status and recoverable storage failures | Status line; damaged-session preservation | Browser 27, Browser 29 |
| 52 | Accessible keyboard behaviour and responsive presentation | Whole workspace | Browser 25, Browser 26 |
| 53 | Accurate quantities, currency and source-defined totals | Accepted lines and totals | Model 1, Model 25, Browser 5 |

"Model N" and "Browser N" refer to the numbered groups in [model-results.json](../../../testing/evidence/sales-delivery-handover-r01/model-results.json) and [results.json](../../../testing/evidence/sales-delivery-handover-r01/results.json), in the order they appear there.

---

## 18. Verification results and limitations

### 18.1 What was executed

| Check | Result |
|---|---|
| `python3 scripts/build-sales-delivery-handover.py` | Built; output SHA-256 `1e47efa70938127b644a9e5dda9a61d1d4f929b548610d515ec21d1d09ed30a5`; upstream quotation hash guard satisfied |
| `node scripts/check-sales-delivery-handover-model.mjs` | **25 groups passed**, 0 failed |
| `node scripts/check-sales-delivery-handover-browser.mjs` | **29 groups passed**, 0 failed, **0 page or console errors**, 31 original captures |
| `python3 scripts/check_foundation.py` | Passed (section 18.4) |
| `python3 scripts/check_prototype.py` | Passed |
| `python3 scripts/check_naming.py` | Passed |
| Merge-conflict marker scan over `docs` | Clean |
| `git diff --check` | Clean |
| Responsive containment | All six views at 1440, 1024, 820, 390 and 320 pixels — no horizontal overflow |
| Visual inspection | Desktop register, accepted basis, responsibility chain and 390 px register captures inspected directly |

### 18.2 What the model groups cover

Accepted-basis reproduction and arithmetic; state and conversion vocabularies; allocation and discount treatment; missing acceptance and unrouted scope; role and receiving-scope enforcement; stale expected version; return-finding validation including an impossible calendar date; acceptance blocking; submission preservation; document provenance guards; requirement history and not-applicable reason; successor revision and comparison content; acceptance binding and prerequisite survival; double acceptance refusal; source change after acceptance; source change during review; unresolved conversion; unavailable destination; original-operation replay and its three refusals; obligation uniqueness and completion; receiving-link uniqueness and precondition; withdrawal; the nine-event chain; session validation including four tamper cases; and Australian money and date conventions.

### 18.3 What the browser groups cover

Everything in section 16.1 exercised through the real DOM, plus the four empty conditions, restricted-identity behaviour, keyboard and focus behaviour, reload persistence, export fidelity and damaged-session preservation.

### 18.4 Honest limits

- **The native browser was Chromium 141.0.7390.37 launched through `PPO_CHROME_PATH`, not the repository's pinned Chrome 153 channel**, which is not installed in the environment used for this package. The manifest records the version actually used. A run on the repository's pinned Chrome remains outstanding, and the repository's focused-workflow pattern can supply it.
- Playwright 1.63.0 — the repository pin — was installed outside the repository tree because the repository's `engines` field requires Node 24.21.0 / npm 11.19.0 and the environment provides Node 22.22.2. **No repository dependency, lockfile or pin was changed.** A run on the pinned Node remains outstanding.
- Screen-reader output, physical devices, 200 % zoom reflow, forced-colours mode and print pagination are **not** verified.
- No CI workflow was added for this package in this contribution.
- These are design checks. They are not business acceptance, not owner visual approval, not application delivery and not production readiness. Nothing here establishes that any requirement is accepted.

### 18.5 Unresolved decisions

| ID | Open question | Why it is open |
|---|---|---|
| **OQ-01** | What is the durable identity of a delivery handover, and does it get an allocated business reference or reuse the opportunity reference? | No reference type exists for it and inventing one would change the reference catalogue |
| **OQ-02** | How is the immutable `opportunity_handovers_due` obligation discharged? | Its `status` is constrained to `'Due'` and the row is trigger-immutable, so a satisfied obligation needs an additive **companion** record, not a mutation. Section 19 recommends the companion. |
| **OQ-03** | How is one accepted quotation split across several destinations, and how is an accepted discount apportioned between them? | No approved source defines it; the first journey is bounded to one destination |
| **OQ-04** | Which requirements are genuinely mandatory before acceptance, per destination type? | CR3-RULE-01 is hypothetical and needs an owner decision |
| **OQ-05** | What is the authority model for the receiving side — individual owner, team queue, or delegated? | Departmental roles remain proposed; no employee or department is assigned |
| **OQ-06** | Does a return restart the required-response clock, and what happens when a required response date passes? | No escalation or due-date policy exists and none is invented |
| **OQ-07** | Should CR-03 consume ES-06 acceptance and ES-07 conversion through a typed contract, or through the reference-text field the Service work-order API already accepts? | Both are currently possible; the typed contract is recommended in section 19 |
| **OQ-08** | Is a receiving acceptance a precondition for work-order authorisation, or an independent record? | This design assumes independent-but-recorded; the Service authorisation contract does not mention a handover |

---

## 19. Receiving application requirements

Documented separately, as instructed. These are requirements on a later increment; none is implemented here.

### 19.1 Records

1. A `delivery_handover` aggregate with a stable UUID, a readable reference resolved under OQ-01, workspace and company scope, the originating opportunity and its version at Won, and an immutable revision chain.
2. A `delivery_handover_revision` child carrying the exact submitted payload, its source fingerprint, submitter, submission time and required response date. Revisions are append-only; a correction is a successor.
3. A `delivery_handover_decision` child bound to exactly one revision, carrying the decision, reason, decider, time, the complete set of bound source identities and hashes, and the release prerequisites open at that moment.
4. A `delivery_handover_obligation` child, individually owned and dated, with completion evidence.
5. An additive **companion** record satisfying the `opportunity_handovers_due` obligation (OQ-02). The existing row must not be mutated: its `status` check permits only `'Due'` and `handover_due_immutable` refuses `UPDATE` and `DELETE`. A `opportunity_handover_satisfied` companion keyed `(workspace_id, opportunity_id)` referencing the accepted decision preserves the evidence chain and matches the repository's established companion pattern.

### 19.2 Authority

6. Server-enforced capabilities as in section 13.1, plus the receiving-scope rule: a decision requires that the actor's receiving scope covers the handover's destination type **and** its company/site context.
7. The receiving eligibility check must be a real grant check, not a role label, following the precedent set by `eligibleOpportunityOwner`.
8. Restricted commercial detail, private communications and inaccessible documents must be filtered server-side, and list cursors, counts and search must not reveal excluded records.

### 19.3 Integrity

9. Every consequential command carries an operation identity, an expected version and a canonical hash, reusing the existing durable-operation and receipt framework. A replay returns the original receipt; a different payload under the same key conflicts; a key bound to another actor or another handover discloses nothing.
10. The source fingerprint must be computed server-side from authoritative reads, never from client input, and stored with each revision and decision.
11. A decision must be refused when the submitted revision's fingerprint differs from the current one, in the same transaction that reads both.
12. Acceptance must never write work authorisation, appointment state, dispatch readiness or any financial effect.
13. Supporting-document references must bind to the document contract's issued revision and hash; the handover must not copy or hold document bytes.

### 19.4 Integration

14. Consume ES-06 acceptance and ES-07 conversion through typed reads with explicit outcome vocabularies (OQ-07). Never derive an ERP effect from the absence of an error.
15. Preserve provider, company and entity context alongside every external key, and never write to MYOB Acumatica from this module.
16. Emit minimal outbox intents (`DeliveryHandoverSubmitted`, `DeliveryHandoverReturned`, `DeliveryHandoverAccepted`) with no consumer in the first increment, following the established pattern.
17. Create owned follow-up through the existing Activities commands, with idempotent recovery returning the same Activity and receipt.

### 19.5 Verification the application must add

18. Permission and scope refusal tests for every command, including a receiving owner of the wrong destination type.
19. Concurrency tests: two decisions racing on one revision; a source change committing between read and decision; a revision submitted while a decision is in flight.
20. Recovery tests for every case in section 11.4, including the three receipt-key refusals.
21. Evidence-integrity tests: a decision cannot outlive its revision's payload; a returned revision is byte-identical after correction and acceptance.
22. Isolation tests: counts, search, cursors and snapshots over a restricted identity.

---

## 20. Recommended next bounded application increment

**Recommendation: implement the read-and-submit half of CR-03 first, and leave the receiving decision for the increment after it.**

Specifically: a `delivery_handover` aggregate with its revision chain, the server-computed source fingerprint, the `prepare`/`submit`/`withdraw` commands under `handover.prepare`/`handover.submit`, and a read projection that assembles the accepted commercial basis, destination and readiness requirements from existing reads. No decision command, no obligations, no companion satisfaction record.

The reasons are structural rather than preference:

- The fingerprint is the load-bearing mechanism for stale-review protection, renewed acceptance and the applicability marker. It must be correct before any decision binds to it, and it is testable on its own.
- A submission has no external effect, so the first increment can be verified end to end without touching work authorisation, scheduling or Finance.
- The decision half depends on OQ-04 (which requirements are mandatory) and OQ-05 (receiving authority model), both of which need an owner decision. The submission half depends on neither.
- OQ-02's companion record only matters once an acceptance exists, so it can be designed against a working revision chain rather than in the abstract.

Before that increment starts, three answers are needed: OQ-01 (handover identity), OQ-07 (typed contract versus reference text for ES-06/ES-07 consumption), and confirmation that branching CR-03 independently of the ES-05/06/07 chain remains the right call once those pull requests land.

---

*Every record, person, amount, document, purchase order and external key in this design is synthetic. This report describes a proposed design. It does not establish owner acceptance, application delivery, business acceptance or production readiness.*
