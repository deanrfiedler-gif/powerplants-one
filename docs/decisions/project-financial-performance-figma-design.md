---
document_id: PPO-FN03-PERFORMANCE-FIGMA-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner-accepted design; Finance definitions (D-017), MYOB read adapter, native implementation and UI baseline acceptance separate
source_commit: 47e47361f3bc9f321795117d357a8053d923cfb9
versioning: git
---

# Project financial performance design — owner decision

On 19 October 2026 Dean asked: "You task is to now design and build the "(FN-03) Project financial performance" UI page in Figma." FN-03 (`/finance/projects`, build rank 99) was unbuilt and had no Figma page, so Claude added a "— Finance —" divider to the file and drew the first Finance page.

Before the audit, Dean opened MYOB Acumatica on his computer at one live project and asked Claude to review it read only: "Do not may any edits! This is a READ ONLY review." Claude clicked only the project's tabs (Summary, Tasks, Revenue Budget, Cost Budget, Balances, Commitments, Invoices, Change Orders, Change Requests and the » list) in its own browser tab, and saved and copied nothing. Section 5 records what the review showed. Dean then said: "We don't have to follow the exact same model as MYOB, but that gives you a good overview of our current process." He asked how Claude would design a more professional module and for recommendations on each open question, then said: "I am happy for you to proceed based on your professional recommendations." Claude redrew the page around a monthly review.

Dean asked for an audit and polish, with permission to play the prototype on his computer, and then for a final check: "Before we lock it in, just make sure you are 100% happy that the design is a professional as possible, as it's a very important UI page in the Powerplants One app." During that check he added: "Also, it would be good if we could make the section in the attached screenshot collapsible (if not already), similar to how the secondary menu collapses." After the collapse had been played in Present mode, Dean accepted the design: "I accept the Project financial performance FN-03 design with your recommendations, including D1–D9, Q6 and the adopted answers. Lock it in." Dean then asked for the named version: "Yes, save the named Figma version "Project financial performance — accepted"." Claude saved it in the Figma desktop app (section 6).

Scope:
- `scope:FN-03` "Project financial performance" at `/finance/projects`, with a record at `/finance/projects/[id]` and the monthly review at `/finance/projects/reviews` (both proposed).
- Traced to FIN-04 and FIN-06 to FIN-08 with FD-05 to FD-09 in the [master blueprint](../blueprints/BP-01-master-blueprint.md). No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, MYOB connection, Finance definition or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design FN-03 in Figma | User decision, 19 October 2026 | Dean's request quoted above |
| Read-only review of MYOB project screens | User decision, 19 October 2026 | Quoted above; section 5 |
| Redraw around a monthly review, with Claude's recommendations | User decision, 19 October 2026 | "I am happy for you to proceed based on your professional recommendations." |
| Audit and polish; play the prototype | User decision, 19 October 2026 | Section 6 |
| Collapsible details column (D9) | User decision, 19 October 2026 | Dean's request quoted above |
| Departures D1–D9 | Accepted as recommended | Dean's acceptance, quoted above. Section 4 |
| Q1 Budget | Resolved as recommended | MYOB revised cost budget, by category, with the original beside it. No FD defines budget; Finance supplies the key |
| Q2 Committed cost | Resolved as recommended | MYOB's committed open amount: open purchase-order lines not yet received or billed, so actual plus committed counts each amount once (FD-06, unresolved in BP-01, needs Finance's approval) |
| Q3 Revenue for margin | Resolved as recommended | Approved contract value only (PJ-05 adjusted value). Pending and disputed variations are shown apart and never enter the margin |
| Q4 Who sees it | Resolved as recommended | `finance.read` and `shared.finance.read`, as for PJ-05's control values. Coordinators see and forecast their own projects; Finance sees all |
| Q5 Month ends | Resolved as recommended | From frozen month-end reviews, so no as-of read of PJ-05 values is needed |
| Q6 Collapsible details column elsewhere | Resolved as recommended | Apply to the shared record layout on every record page, open by default and remembering each person's choice, page by page when each is next changed |
| Q-A Who forecasts cost to complete | Resolved as recommended | The coordinator, in PPO, at the monthly review; Finance reviews it. MYOB's projection columns are not adopted |
| Q-B Which "billed" | Resolved as recommended | Invoices excluding GST plus cash applied to them. MYOB's posted income is shown as a check; a mismatch raises a difference |
| Q-C MYOB change orders and PJ-05 variations | Resolved as recommended | PJ-05 is the commercial authority. Only price-changing MYOB change orders are compared; a mismatch raises a difference for Finance |
| Q-D Which MYOB sources | Resolved as recommended | Cost and budget, revenue budget, open purchase orders, invoices and receipts. WIP, stock, accruals, retention detail and the other tabs stay in MYOB |
| Accept the design | User decision, 19 October 2026 | Quoted above |
| Named Figma version | User decision, 19 October 2026 | Saved as "Project financial performance — accepted" at Dean's request quoted above. Section 6 |
| Building the page | Not decided | Section 8 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Project financial performance · FN-03" `1580:4165`, under the new "— Finance —" divider `1580:4164`, after Inventory · SC-05. The page header holds the conformance declaration; the notes card `1620:5952` is in Flows and notes. File index: new Finance group `1676:453226`, row `1676:453235`, after Supply chain |
| Desktop 1440 | Active projects register `1586:260`; Glasshouse 4 record, Overview, full length `1588:724`; the same record with the details column collapsed `1668:441860`; September review `1632:6343`; Finance review dialog `1637:6849`; reporting basis menu `1599:1138`; open differences `1600:1863`; Assign an owner panel `1603:2600`; measure definitions `1605:2424`; Rainwater record, periods differ `1639:7405` |
| Tablet 1024 | Register with the rail and side menu collapsed `1609:3071` |
| Phone 390 and 320 | Active projects at 390 `1612:3486` and 320 `1612:3770`; Glasshouse 4 record, full length `1645:7626`; reporting basis sheet `1616:3765` |
| States | Loading `1617:3888`; MYOB read not completed `1617:434077`; no Finance access `1617:4147`; definitions pending, contract values only `1617:434312`; no projects match the filters `1617:4379`; MYOB cost partial (Boiler room) `1639:8168`; no approved basis (Water treatment) `1639:8911` |
| Parts | Moved to Components at acceptance, node IDs unchanged: Rail · Finance (proposal) `1580:4235` in Shell and navigation; in the new section Components › Finance parts `1676:12012`: Finance / Performance grid header and row (`1581:150`, `1581:164`), Review grid (`1626:6080`, `1626:6095`), Difference grid (`1600:1599`, `1600:1614`), Definition grid (`1605:2378`, `1605:2399`), Measure table (`1592:952`, `1592:974`), Category table (`1626:6022`, `1626:6051`) and Performance list row (phone) `1612:3459`. Icons added to Components › Icons: Icon/book-user `1580:4141`, Icon/chart-column `1580:4147`, Icon/solid/chart-column `1580:4153` and Icon/wallet `1580:4159`, the Font Awesome names `nav-accounts`, `nav-performance` and `nav-cash` map to in `src/components/font-awesome-icons.ts`. The record's details column uses v2 / Menu edge and v2 / Menu strip, as the secondary menu does |
| Prototype | Flows "FN-03 — desktop" (register → basis menu → Glasshouse 4 record → Review submission → dialog → Accept, Return or Cancel; details column collapse and expand; side menu to September review, Open differences and Measure definitions; differences → Assign an owner), "FN-03 — monthly review" (September review → Finance review dialog) and "FN-03 — phone" (list → basis sheet → record and back) |
| Story | Synthetic, AUD excluding GST, as at Mon 12 Oct 2026 10:42 AEST, MYOB read 06:00, signed in as Dean Fiedler (Finance). The seven active projects of the accepted Projects register, A–Z. September reviews due Fri 16 Oct 17:00: Glasshouse 4 submitted by Jamie Rossi and waiting for Finance; Block C, CO2 dosing, Propagation and Rainwater reviewed; Boiler room and Water treatment not started. Block C's contract value matches the accepted PJ-05 design ($197,250.00) |
| Retained captures | [Project financial performance design r01](../reference/ui/finance/project-performance-design-r01/README.md): twenty-two icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:FN-03` at `/finance/projects` (navigation id `performance`, Finance rail "Project performance", today `readiness: "unavailable"`); record and review routes proposed. Traced to FIN-04 and FIN-06 to FIN-08 with FD-05 to FD-09, unchanged. Capabilities: `finance.read` and `shared.finance.read`; coordinator access to their own projects is a proposed permission (Q4) |
| Page type (r20) | Register or worklist (active projects, September review, differences, measure definitions); record detail (project performance) with a collapsible details column; a review and decision dialog (Finance review); a side-panel form (assign an owner) |
| Reused components | Shell v2 (Rail · Finance, the top bar with the Conversations action, side menu, Menu edge and Menu strip), Grid header and cells, Record / Header, Field, Section heading, View tab, Banner, Tag, Button, Work order record / Blocker row, Commercial / Control values and Amounts card (PJ-05), Shell / Phone header · compact, v2 / Tab bar (phone). New: the Finance parts listed in section 2 |
| Incoming handovers | The Projects register and project record; PJ-05 control values (PJ05-FD08 v1); MYOB cost and budget, revenue budget, open purchase orders, invoices and receipts through a read adapter that does not exist yet; coordinator reviews |
| Outgoing handovers | Open project; Variations & obligations (PJ-05); Claims & obligations (FN-04) when a project is under billed; Customer accounts (FN-02); Measure definitions and the category map (FN-06); My Work items for review and difference owners; Access requests (AD-01). The page sends nothing to MYOB, changes no forecast outside a review, and sends no message |
| Source authority | The FN-03 design register page and guide `guide.fn.03`; BP-01 FIN-04 to FIN-08 and FD-05 to FD-09; [project commercial Finance definitions](../contracts/project-commercial-finance-definitions.md) and [commercial controls](../contracts/project-commercial-controls.md); [PPO as daily workspace, MYOB as book of record](ppo-workspace-myob-book-of-record.md); `src/shell/navigation.ts`; the accepted Projects register, Project record and [PJ-05](project-commercial-figma-design.md) designs; the read-only MYOB review (section 5) |
| Proposed departures | D1–D9 in section 4, accepted |
| Status | Owner-accepted design, 19 October 2026 |
| Decision record | This file |
| Named version | "Project financial performance — accepted", saved 19 October 2026 |

## 4. What the design shows

- **Register.** Active projects as a grid: contract value, billed to date, forecast final cost, forecast margin, over/under billed, review, sources, differences, coordinator, customer and reference. A portfolio strip sums only complete figures; a total with an unknown part shows Not complete with the known part. Side menu: Projects (Active, Needs attention, Incomplete sources, Closed, All), Reviews (September review, Waiting for me), Differences (Open, Needs an owner) and Basis (Measure definitions, Source reads).
- **Reporting basis.** One basis per view: Current (today's MYOB read and the latest submitted reviews) or a closed month end (that month's MYOB period and reviews).
- **Monthly review.** A worklist per review month with Not started, Draft, Submitted, Reviewed and Returned, the forecast margin and its movement since the last review, and who reviewed it. Finance's review dialog shows the movement, the cost-by-category table, the coordinator's comment, checks before accepting and a note; Accept freezes the forecast for the month and Return sends it back to Draft.
- **Record.** The shared record layout with a reporting-basis strip in place of key dates; a details column (summary, customer, five sources with read times and completeness, definitions) that collapses to the secondary menu's strip; tabs Overview, Cost, Revenue & billing, Reviews, Differences, Sources and History. Overview shows four tiles (contract value, forecast final cost, forecast margin, over/under billed), the forecast margin by month end against the budget margin, the September review card, differences, cost by category, revenue and billing, and how the figures reconcile.
- **Phone.** The compact header with a basis caption; rows show the margin or why it is missing and the billing position; the record is flush sections with a sticky full-width main action; the basis opens as a bottom sheet; the tab bar shows the Finance tabs.

### Departures, accepted

| ID | Departure | Built or earlier state |
|---|---|---|
| D1 | A Finance workspace page under the Finance rail, record and review routes proposed, a Rail · Finance component and four icons | Rail item "Project performance" is `readiness: "unavailable"`; no page |
| D2 | MYOB is the ledger and PPO the review layer: this page reads cost, budget, open orders, invoices and receipts and sends nothing to MYOB ([PPO-ERP-OPERATING-MODEL-DEC](ppo-workspace-myob-book-of-record.md)); finished business events such as a claim invoice are sent from their own pages | None |
| D3 | Monthly review: the coordinator updates cost to complete per category, pre-filled with the previous forecast less actual and committed (the budget for a first review), comments and submits; Finance accepts or returns; the submitted forecast holds until the next review | MYOB's cost-to-complete and projection columns were zero on the inspected project; usage elsewhere remains unverified |
| D4 | Finance maps MYOB tasks and account groups to materials, labour, subcontract and freight/other (FN-06); the table shows budget, committed, actual, to complete, forecast final and variance, and reconciles to MYOB | MYOB keeps cost by stock item |
| D5 | Over/under billed = billed − earned value, where earned value = actual ÷ forecast final × contract value; labelled indicative until Finance approves the definition | MYOB's over- and under-billing accounts are not set up |
| D6 | Forecast margin by month end against the budget margin; MYOB's own margin is a result to date and is never shown as a forecast | MYOB shows margin to date only |
| D7 | Derived figures need complete inputs from one MYOB read; otherwise Not complete, Not calculated, Not reviewed or Not applicable with the reason. Differences come from fixed rules (loss forecast, above budget, billed above contract value, posted income differs from invoices, PPO contract value differs from MYOB's revised budget, spend passed the forecast, source incomplete, periods differ) or a person, with no percentage threshold; Needs an owner → Owned → Explained | None |
| D8 | Record layout with the basis strip and seven tabs; phone with the compact header, flush sections, sticky main action and a basis sheet | None |
| D9 | The record's details column collapses like the secondary menu: hover the right edge and it turns blue, click to collapse to the strip, click the strip to expand; the main column widens and the tables stretch | The accepted Project record's details column is fixed |

### Numbers that reconcile (synthetic, AUD excluding GST)

| Measure | Value | How it reconciles |
|---|---|---|
| Glasshouse 4 contract value | $248,900.00 | Original $236,500.00 + approved $12,400.00 |
| Budget | $205,300.00 | MYOB revised cost budget across four categories; budget margin 17.5% |
| Forecast final cost | $213,860.50 | $201,340.50 actual + $8,420.00 committed + $4,100.00 to complete; $8,560.50 over budget |
| Forecast margin | 14.1% | ($248,900.00 − $213,860.50) ÷ $248,900.00; August 15.0% |
| Movement since August | +$2,295.50 | Materials and subcontract passed the August forecast by $1,240.00 and $1,055.50 |
| Earned value | $234,328.69 | $201,340.50 ÷ $213,860.50 = 94.1% × $248,900.00 |
| Under billed | $10,318.69 | $234,328.69 earned − $224,010.00 billed |
| Portfolio | $923,700.00 contract, $521,805.00 billed | Six approved bases; forecast known for five September reviews $622,698.40; net over billed $26,407.48 on the known part |

## 5. The MYOB review

The review was of screen structure only, on one live project, read only. No figure, customer or document from it is recorded here or in Figma.

- **What MYOB holds:** revenue budgets by task and cost code, and cost budgets by task, stock item and cost code, both carried from the quote; original and revised budgets; committed amounts split into ordered, received, invoiced and open, with "actual plus open committed"; balances by account group (income, expense, WIP, stock, PO accrual); purchase orders; pro forma and AR invoices; change orders and change requests; retention and progress billing.
- **What was observed on this project:** every inspected cost-to-complete, cost-at-completion and projected column was zero; the over- and under-billing accounts were empty; the header margin was actual income less actual expenses, a result to date; and actual income did not match the AR invoices on the project. This bounded observation does not establish whether other Powerplants projects use MYOB forecasting.
- **What the design takes from it:** budget and committed cost from MYOB's own fields (Q1, Q2); forecasting and review in PPO (Q-A); invoices as the billed figure with posted income as a check (Q-B); grouping that reconciles to MYOB's tasks and account groups (D4).

## 6. Audit, polish and verification

- Claude checked every frame with screenshots taken inside Figma and audited the page several times. The final audit found 0 stored text or fill colours differing from their bound variables, 0 overlapping frames and 0 clipped texts except the breadcrumb owner, which truncates by rule R6 of the [shell top bar amendment](shell-top-bar-amendment.md).
- Fixes from the audits: the phone tab bar, which still showed the Service tabs; the hidden record actions menu, which still listed Sales actions; the Budget key (no FD defines it); a Block C review comment that contradicted its open difference; the pre-fill rule; column widths and wording; a measure-table column that stopped stretching; phone rows whose layer names an override reset had cleared; and a Conversations badge overwritten by a lookup.
- Claude played all three flows in Present mode in Dean's Figma desktop app at Fit width, and added the missing rail, All reviews, Measure definitions, phone back, sheet close and Show links. The collapse was played at Dean's request: the edge turns blue on hover, a click collapses the column, and the strip expands it. Undrawn record tabs do nothing.
- The twenty-two captures are copies of the accepted frames on the "Captures (icon-free)" page at y = 306,000 (`1676:442238` to `1676:444871`). Each copy's prototype links were removed and each of its 769 Font Awesome icon instances was swapped for `Icon/placeholder`; a check afterwards found none left. The vectors left are the logo and the margin chart's data marks. The copies added no flow starting point to the Captures page.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/finance/project-performance-design-r01/README.md).
- The named Figma version "Project financial performance — accepted" was saved on 19 October 2026 in the Figma desktop app (Ctrl+Alt+S, title typed, Save) at Dean's request. Claude confirmed it at the top of version history, opened from the dialog's "Show full version history" link, and then updated the page header and notes card.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or Finance review is recorded. The captures are design compositions, not application captures, and set no UI baseline.

## 7. Relationship to other records

- [PJ-05 commercial controls design](project-commercial-figma-design.md): its control values are the contract value here; its record keeps the commercial basis, variations and the Value breakdown.
- [PPO as daily workspace, MYOB as book of record](ppo-workspace-myob-book-of-record.md): this page is a read-only consumer of MYOB results (EI-1, EI-3). Source reads, completeness and failures depend on Integration health (`scope:AD-04`) and External mapping and reconciliation (`scope:AD-05`).
- [Project commercial Finance definitions](../contracts/project-commercial-finance-definitions.md): billed, cash, cost, commitment and margin remain unavailable there; this design shows where they would appear once Finance defines them, and the first build shows contract values only (state S4).

## 8. Not decided and not drawn

- **Building the page.** Not decided. The rail item stays unavailable.
- **Prerequisites for a build:**
  - Finance-approved definitions for budget, billed, cash, actual, committed, forecast final cost, margin, earned value and over/under billing (D-017);
  - a read-only MYOB adapter with per-read completeness, under its own architecture decision (PPO-ERP-OPERATING-MODEL-DEC, EI-7 and EI-9);
  - the category map in FN-06;
  - review records with frozen month-end copies, accept and return, and My Work items;
  - difference records with owner, state and explanation;
  - a cross-project read with totals over the full permitted set, and the coordinator permission (Q4);
  - the collapsible details column in the shared record layout (Q6).
- **Not drawn:** the coordinator's review entry form (Draft) and a returned review; an accepted-review state; full Cost, Revenue & billing, Reviews, Sources and History tabs; the difference record and Flag a difference form; Closed and All projects views; the tablet record; phone states and the phone review list; 200% zoom and keyboard order.
- **Data in the frames:** the people, organisations, projects, amounts and dates are synthetic.
