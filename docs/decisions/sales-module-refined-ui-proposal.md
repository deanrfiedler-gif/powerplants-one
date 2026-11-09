---
document_id: PPO-SALES-REFINED-FIGMA-PROP
date: 2026-11-09
owner: Dean Fiedler
status: Owner-accepted design, 9 November 2026 (A1–A10 accepted as recommended; the audit's recommended order accepted and drawn the same day; N1–N4 accepted and integrated); named version "PPO - Sales module (accepted)" saved by Dean on 9 November 2026 before N1–N4 were integrated, so a further named version is needed to pin them; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed or deployment; every record shown is synthetic
source_commit: 8b73b5616d11b98309b445f3473bf82d100b0edc
versioning: git
---

# Sales module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 9 November 2026 · **Status:** Owner-accepted design, 9 November 2026 ([Acceptance — 9 November 2026](#9-acceptance--9-november-2026)). Sections 1 to 8 are the proposal record as written before acceptance; section 9 records the decision, section 10 the audit, section 11 what was drawn after Dean accepted the audit's recommended order, and section 12 the acceptance of N1–N4 and the named version.

On 9 November 2026 Dean asked for the refined versions of the UI pages of the Powerplants One Sales module to be built in Figma, in a brand-new file rather than inside the shell file: "I actually wanted you to create a brand new Figma page file for the Sales module UI pages." He set the accepted shell as the source of truth for the chrome ("The Figma link for the Shell UI below is the source of truth for the design of the Shell UI for the Sales module pages") and the trial Sales sheets in "PPO - Shell concept" as reference only, and gave four rules: register tables must not stack data ("only one line of data in each cell, even if this means the table will have to scroll horizontally"); no second search bar in the main content because the shell carries global search, while Find stays in the flyout and docked menus; the pages must look as professional as the shell pages; and otherwise full creative control.

This record began as a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions Dean had to decide; section 9 records his acceptance. It changes no code, test, migration, seed, permission or route. Acceptance of the design does not make the drawn pages an implementation baseline: source presence, visual review of the built pages, functional proof and deployment stay separate.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", pages "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked (accepted 8 November 2026)" | Chrome and geometry: 48 px top bar, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, 280 px docked workspace menu, 432 px right drawer at x 960 (R98), navy selection bar, white canvas, `surface/workspace` behind record cards. Components were copied into the new file under the same names so instances can be swapped to the published library later |
| Private Figma file "PPO - Shell concept", Sales sheets | Reference only, as directed |
| [Shell refined concept design](shell-refined-concept-design.md) and its [rules R1–R115](../design/development/systems/shell-refined-concept-rules.md) | Shell behaviour: nested page views in the docked menu (Q21), overlay drawer (R98), selection bar (R88), dialog pattern |
| [Deals Figma design](deals-figma-design.md), [Deal record page design](deal-record-page-design.md), [Leads design](leads-design.md), [Lead record page design](lead-record-page-design.md), [Sales Pulse and Tasks design](sales-pulse-tasks-figma-design.md), [Emails design](emails-figma-design.md), [Calendar design](calendar-figma-design.md), [Sales brief page design](sales-brief-page-figma-design.md), [Sales-to-Delivery Handover design](sales-delivery-handover-design.md), [Sales aftercare design](sales-aftercare-figma-design.md), [Organisations design](organisations-figma-design.md), [People register contract](../design/development/pages/route-people.md), [Products design](products-figma-design.md), [Pipeline insights design](pipeline-insights-figma-design.md), [Sales performance design](sales-performance-figma-design.md) | Page content, decisions and vocabulary carried into the refined pages |
| `src/shell/navigation.ts` | The Sales rail order and destinations: Pulse, Leads, Deals, Activities, Tasks, Sales Inbox (Email), Estimating handovers, Won-deal receiving, Aftercare & renewal, Contacts, Products, Insights |
| [PPO-STD-001](../standards/naming-conventions.md), [design-to-build standard](../standards/design-to-build-standard.md) | Naming, tokens and the separation of acceptance from shipped values |

The new file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | The Sales workspace: `route:/sales/pulse`, `route:/sales/leads`, `route:/sales/leads/[id]`, `route:/sales/opportunities`, `route:/sales/opportunities/[id]`, `route:/sales/tasks`, `route:/calendar` (Activities), `route:/email` (Sales Inbox), `route:/sales/handoffs/estimating` and `[id]`, `route:/sales/handoffs/won` and `[id]`, `route:/sales/aftercare` and `[id]`, `route:/contacts`, `route:/customers/[id]`, `route:/products`, and the Insights item (Pipeline insights CR-04, Sales performance RP-02). No parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist (D01–D07, L01, T01, H01, W01, AC01, C01, O01, PR01); Record detail (R01, R02, L02, H02, W02, AC02, C360); Overview / dashboard (P01, IN01, IN02); Register with a time grid (A01); Work queue and persistent detail (M01); Form / guided workflow and centred dialogs (X01–X07); states (X08, X09) |
| Reused components | Copies of the accepted shell: Shell / Top bar, Shell / Rail · collapsed, Shell / Right rail · collapsed, Shell / Workspace menu · docked; 101 icon components (Lucide stand-ins for Font Awesome Light, as in the shell file); the "PPO colour" variable collection (66 variables, same names as the shell file). New in this file, as a Sales kit: Chip, Button, Avatar, Checkbox, Filter chip, Tab and KPI tile |
| Source authority | The decisions above and Dean's 9 November direction. The fixture is synthetic: as at Thursday 5 November 2026, 09:00, signed in as Dean Fiedler |
| Incoming handover | The Sales rail and docked menu; global search; notification and My Work links to a record. Arriving creates no business record |
| Outgoing handover | Deal record, Lead record, Estimating workspace (LC-13), Won-deal receiving (CR-03), My Work, Outlook, Inventory item (Availability), Pipeline insights. Record Won creates the handover-due obligation only; nothing drawn creates an order, project, work order, stock movement, booking or ERP or Finance transaction |
| Exceptions and recovery | Filtered-empty and loading states are drawn for Deals (X08, X09); a count that cannot be read shows a dash, never zero; unavailable or restricted sources are never zero (C360, O01). Denied, error and stale states beyond these are not drawn |
| Departures | Section 5 |
| Verification | Section 6 |

## 3. Sheet inventory

All sheets are 1440 × 900 desktop frames. Node IDs are those of the frame in the new file; section IDs follow the section name.

| ID | Sheet | Route or scope | Node |
|---|---|---|---|
| — | Page header card and "Sheet index and notes" card | — | `9:161`, `51:9990` |
| — | Shell components (copied, do not edit here) · Sales kit · Shell icons | — | `7:2`, `9:165`, `9:289` |
| D01 | Deals — list view, default shell, rail collapsed | `route:/sales/opportunities` | `11:89` (section `11:88`) |
| D02 | Deals — list view with the Sales workspace menu docked | same | `11:995` |
| D03 | Deals — list view with a deal previewed in the right drawer (overlay, R98) | same | `13:809` |
| D04 | Deals — board view, five-stage pipeline (default view, Deals Q1) | same | `14:1487` |
| D05 | Deals — forecast view by expected close month and stage, unweighted (R11) | same | `15:2176` |
| D06 | Deals — archive view, Won and Lost bands with evidence and handover state | same | `14:2316` |
| D07 | Deals — three rows selected, floating selection bar (R88; no delete, Q20) | same | `13:1826` |
| R01 | Deal record — Overview (shared record layout) | `route:/sales/opportunities/[id]` | `16:2456` (section `16:2455`) |
| R02 | Deal record — Estimates & quotations tab (Sales view of the Estimating workspace, estimates, quotations and customer views) | same | `46:7267` |
| L01 | Leads — register, Inbox view | `route:/sales/leads` | `21:2710` (section `21:2709`) |
| L02 | Lead record — Activities view with the convert-readiness bar (LC-11) | `route:/sales/leads/[id]` | `21:3482` |
| P01 | Sales Pulse — day start | `route:/sales/pulse` | `21:3958` |
| T01 | Tasks — one grid grouped by due, Owner Mine, no checkboxes (SH-02 D12–D14, D22, D26) | `route:/sales/tasks` | `29:3470` (section `25:3470`) |
| A01 | Activities — week view, Due lane above read-only Outlook meetings (Calendar D1–D6) | `route:/calendar` in Sales | `29:4156` |
| M01 | Email (Sales Inbox) — thread list and reading pane, records linked one by one, private by default (EC-01 D1–D6) | `route:/email` | `30:3952` |
| H01 | Estimating handovers — Sales briefs worklist grouped by who acts next (CR-02) | `route:/sales/handoffs/estimating` | `31:4212` (section `25:3471`) |
| H02 | Sales brief record — Draft with the nine-check bar (CR-02 D1–D3, Q2) | `route:/sales/handoffs/estimating/[id]` | `33:5053` |
| W01 | Won-deal receiving — worklist grouped by receiving state (CR-03) | `route:/sales/handoffs/won` | `32:4480` |
| W02 | Won-deal handover record — nine-event responsibility chain, immutable commercial basis, Readiness tab (CR-03) | `route:/sales/handoffs/won/[id]` | `34:5264` |
| AC01 | Aftercare & renewal — worklist of customer reviews by state (CR-05) | `route:/sales/aftercare` | `32:5276` |
| AC02 | Aftercare customer review record — Planned (CR-05) | `route:/sales/aftercare/[id]` | `35:5495` |
| C01 | Contacts — People register with the hub switch People · Organisations · Sites (CS-02) | `route:/contacts` | `41:6544` (section `25:3472`) |
| O01 | Organisations register (CS-01 D1, Q2) | `route:/contacts?view=organisations` | `41:7407` |
| C360 | Customer 360 — organisation record, Overview tab (CS-01 D3–D5) | `route:/customers/[id]` | `39:6902` |
| PR01 | Products — catalogue register as Sales sees it (PD-01, amendment A1) | `route:/products` | `42:7122` |
| IN01 | Pipeline insights — overview (CR-04) | Insights | `44:6852` |
| IN02 | Sales performance — department report (RP-02, REP-01 to REP-05) | Insights | `45:7068` |
| X01 | New deal — right-hand form panel over Deals | `route:/sales/opportunities/new` | `47:7518` (section `25:3473`) |
| X02 | New lead — right-hand form panel over Leads | Leads | `47:8197` |
| X03 | Record Won — centred dialog over the Deal record | Deal record | `47:9364` |
| X04 | Record Lost — centred dialog | Deal record | `47:9735` |
| X05 | Change stage — centred dialog with the five stage definitions | Deal record | `47:10608` |
| X06 | Convert lead — centred comparison dialog (LC-11) | Lead record | `47:10962` |
| X07 | Filters — right-hand panel over Deals | Deals | `47:11814` |
| X08 | Deals — filtered, nothing matches | Deals | `47:12538` |
| X09 | Deals — loading | Deals | `47:13455` |

## 4. Rules applied

- **One line per cell.** Register cells never wrap. Text truncates with an ellipsis at the cell width, the table scrolls sideways under a horizontal scrollbar, and the selection column, the first column and the row menu stay frozen. Record pages and dialogs may wrap, because they are not registers.
- **No second search.** No search box appears in the content area of any page. The shell's search (Ctrl K) finds records, pages and help; Find stays in the flyout and docked menus.
- **Shell geometry and tokens.** Every sheet instances the copied top bar, rail, right strip and, where shown, the docked menu; content runs from x 80 to 1392 with 24 px gutters; Roboto 11 to 20 px; colours bound to the "PPO colour" variables; translucent paints (the dialog scrim) are plain paints.
- **Counts state their rule.** Every count names what it counts; counts are never added together; a count that cannot be read shows a dash, never zero; unavailable or restricted sources are never zero.
- **Separate outcomes.** Won, the handover obligation, receiving, ES-07 conversion, customer acceptance and Finance stay separate records with their own words; there is no probability or weighting (R11); Won and Lost deals are archived, never deleted (Q20); Save is not Submit; acceptance for estimating is not an estimate.

## 5. Assumptions and proposed departures

Each item was for Dean's decision. He accepted them all as recommended on 9 November 2026 (section 9).

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | Each register shows its page views as a tile row under the title (for example Inbox 14 · My leads 6 · New 5 …) in addition to the nested views in the docked menu (shell Q21). The tiles double as counts and keep the views reachable when the menu is collapsed | Keep |
| A2 | Grouped registers place the group count and total in the scroll-region band, so the frozen column never clips it | Keep |
| A3 | Tasks shows Reschedule, Record outcome and Plan next on hover and focus (SH-02 D5); at rest a row shows the done ring and the row menu; Owner Mine hides the Owner column (D22) | Keep |
| A4 | Email keeps two panes (thread list with day groups and quick filters; reading pane with linked-record chips and the privacy banner) with mailbox views as tiles. The EC-01 side menu moves into the docked workspace menu, so the page has no third pane | Keep |
| A5 | Every record uses the shared layout: one-row header, state or checks bar, 380 px details column, view tabs. Short decisions are centred dialogs of 560 to 720 px with a 12 px radius over a navy 32 % scrim; forms (New deal, New lead, Filters) open in a 432 px right panel without a scrim, like the preview drawer | Keep |
| A6 | Won-deal receiving states are written as Not prepared, Prepared, Awaiting receiving review, Returned, Accepted and Converted. No verified contract defines them (CR-03) | Keep as proposed words until the receiving contract names them |
| A7 | The Insights rail item, unavailable in `navigation.ts`, opens Pipeline insights (CR-04) and Sales performance (RP-02) as drawn | Keep as drawn: Insights opens Pipeline insights first, with Sales performance as its second view |
| A8 | Sales has no quotation register of its own. Quotations appear on the Deal record tab (R02), on the Deals Quoted column (newest revision and its state) and in REP-04; Estimating owns the register | Keep |
| A9 | The synthetic story is as at Thursday 5 November 2026, 09:00, signed in as Dean Fiedler, with new SYN-OPP, SYN-LEAD, SYN-ORG and SYN-QUO references. If the pages are adopted, align these with the accepted module stories when each page is next touched | Align later |
| A10 | Lucide icons stand in for Font Awesome Light and the shell components are local copies of the accepted file. Swap both to the published library when the shell is published | Swap on publication |

## 6. Verification

Every sheet was rendered and inspected after each build or repair. A structural pass over all 36 sheets found no child outside its 1440 × 900 frame, no wrapped text inside a register cell, no duplicate sheet labels and Roboto as the only font family (the brand wordmark mixes Roboto weights). Overflows found in review were corrected before this record: group totals moved into the scroll band, long tile labels, check labels and stepper notes shortened, the REP-04 and Aftercare column orders adjusted, and the dialog scrim corrected from an opaque fill to a 32 % paint.

Limits: this is a visual proposal. No prototype links, phone or tablet variants, keyboard order, contrast measurement across every pairing, screen-reader behaviour or application comparison were done. Repository check run for this change: `python3 scripts/build_status.py --check`.

## 7. Not drawn

Phone and tablet variants; the Deal record's Scope & sites, Correspondence, Documents and History tabs; the Lead record's other tabs; Person and Site records; the Product record; the Estimating side of Sales briefs; the Projects and Service receiving decisions; the Aftercare Service, Training and Commercial tabs; the Email composer; Calendar Day and List views and Team availability; loading, denied and error states beyond X08 and X09; prototype links.

## 8. Boundary and next steps

This record authorises nothing in the application. With the acceptance in section 9, the next steps are: Dean saves a named Figma version (recommended title "Sales module — accepted"); the page guidance in `docs/design/development/pages/` is updated for each route with the exact sheet references, in its own reviewed change; and the build is planned against the current application pages, keeping source presence, visual review, functional proof and deployment separate.

## 9. Acceptance — 9 November 2026

Asked to review the proposal, Dean answered: "Accept A1–A10 as recommended". That adopts every item in section 5 with its recommendation: A1 view tiles under each register title beside the nested docked-menu views; A2 group totals in the scroll-region band; A3 Tasks row actions on hover and focus with the Owner column hidden under Owner Mine; A4 the two-pane Email layout with mailbox views as tiles; A5 the shared record layout, 560–720 px dialogs over a 32 % navy scrim and 432 px right panels without a scrim; A6 the proposed Won-deal receiving state words until the receiving contract names them; A7 Insights opening Pipeline insights first with Sales performance second, as drawn; A8 no Sales quotation register, with quotations on the Deal record tab, the Deals Quoted column and REP-04; A9 the synthetic story aligned with the accepted module stories when each page is next touched; A10 Lucide icons and the copied shell components swapped to the published library when the shell is published.

What the acceptance covers: the 34 desktop sheets listed in section 3 as the accepted design for the Sales workspace pages, and the rules in section 4. What it does not cover: the items in section 7 that are not drawn, phone and tablet layouts, prototype behaviour, the built application pages, and any business approval. In the Figma file the page and the sheet sections were renamed from "(proposal)" to "(accepted 9 November 2026)" and the header and index cards now carry the acceptance; the named version is Dean's to save.

## 10. Audit — 9 November 2026

After the acceptance Dean asked for an extensive audit of the new pages: gaps, refinements, new and innovative features, coverage of every scenario, and whether the pages can look more professional ("I basically just want all the UI pages to look as professional and as advanced as possible"). Every sheet was re-rendered at its current state and read against the design-critique framework (first impression, usability, hierarchy, consistency, accessibility), then a journey-by-journey coverage matrix was built. The results are below; items are for Dean's decision unless marked as corrected.

### 10.1 Corrections made during the audit (my own errors, fixed in the file)

| ID | Correction |
|---|---|
| C1 | The Riverbend Growers story disagreed with itself across sheets. One truth now holds everywhere: deal title "Glasshouse fertigation upgrade"; site "Riverbend glasshouse · Lindenow VIC"; Mei Tran, Operations manager, 0400 555 101; organisation SYN-ORG-000142, sector Hydroponic vegetables (12 texts on 9 sheets and 6 titles changed) |
| C2 | Aftercare worklist sub-line shortened so it no longer runs off the content area |
| C3 | Sales brief record: "1 check missing before Submit" now sits beside the disabled Submit button |
| C4 | Activities: the now line carries its time label (09:00) |
| C5 | Email: the "Not business email" chip uses a neutral icon instead of an × that read as a close control |

### 10.2 Coverage matrix

| Journey | Drawn | Not drawn |
|---|---|---|
| Capture a lead | X02 | Create a lead from an email (M01) |
| Work a lead | L01, L02, P01, T01, A01 | Lead record Customer context, Emails, Files and History tabs |
| Resolve customer context (LC-12) | Resolved state on L02 | The resolve dialog with candidate matches and reasons; disqualify, park and reopen a lead |
| Convert | X06 | — |
| Create and work a deal | X01, R01 | Deal record Scope & sites (what is being sold: sites, areas, equipment, scope lines that feed the brief), Correspondence, Documents and History tabs |
| Brief Estimating | H01, H02 | Questions tab (answer a clarification); successor r2 comparison |
| Quote | R02 (Estimating owns the quotation pages) | Request quotation dialog |
| Stage, Won, Lost | X05, X03, X04 | Reopen deal |
| Won handover | W01, W02 | Prepare handover form (items, evidence, destination) |
| Aftercare | AC01, AC02 | Complete review dialog, Service referral side form, renewal handover (accepted in the aftercare design, not redrawn in this shell) |
| Daily work | P01, T01, A01, M01 | Record outcome, Plan activity, Reschedule and Log call dialogs in this shell |
| Customer knowledge | C01, O01, C360 | Person record; Sites register and record (third hub tab); New organisation and New person forms; Stakeholders |
| Products | PR01 | Product snapshot and record (PD-01, accepted elsewhere) |
| Insights | IN01, IN02 | Drill-through list; win/loss analysis |
| Administration | — | Pipeline configuration (stage definitions, version), saved views, column chooser, export dialog, import leads wizard, notification preferences |
| States | X08 filtered-empty, X09 loading | True-empty ("You're up to date"), could not load, denied, stale or newer version, offline, partial source |
| Responsive and accessibility | — | Tablet 1024 and phone 390/320; focus states, keyboard order, 200 % zoom, contrast proof |

### 10.3 Refinements (R)

| ID | Refinement |
|---|---|
| R1 | An in-row attention marker (left-edge bar or icon in the title cell) on Deals and Leads rows that the "Needs attention" count refers to |
| R2 | A signals strip on the Deal, Lead and Customer records: last contact, next activity, open tasks, unread emails, quotation state, days in stage against the median; rule-based and explainable, no score |
| R3 | Preview drawer quick actions (Plan activity, Log call, Email) and the readiness checks as a compact list |
| R4 | Board card age reads "12 d in stage"; a swimlane-by-owner toggle |
| R5 | Forecast chart: total labels above each month; legend order matching the stack order |
| R6 | Email reading pane: earlier messages collapsed inline (headers only); a suggested-links row for unlinked threads; the pane fills its height |
| R7 | Customer 360 overview: "Relationship signals" and "Recent activity" cards fill the empty column |
| R8 | Won-deal receiving: "Routing decision required" as a warning chip like the other states |
| R9 | Record Won dialog: collapse the unselected evidence types once one is chosen (825 px becomes about 640 px) |
| R10 | Pulse Deal attention rows: wider title, value on the second line |
| R11 | Register sub-lines and footers cut to one clause, with the rule text moved into the information-icon popover the shell already has. This is the single biggest "professional" lift: several sub-lines run 120 to 170 characters and read as documentation |
| R12 | One KPI tile (D05 and D06 use custom cards; P01 and IN01 use the kit tile) and a documented chip tone ramp: New = info, working states = neutral, nurturing = grey, Won = success, Lost = danger, stages neutral |
| R13 | Tabular figures on numeric cells; a frozen-edge shadow when a register is scrolled; sortable header hover |
| R14 | A states sheet: row hover, selected and focus, button focus rings, keyboard order per register |

### 10.4 Gaps to draw (G)

| ID | Gap |
|---|---|
| G1 | Deal record · Scope & sites tab (scope lines, sites, areas, equipment, products) — it feeds the Sales brief and is the main missing page |
| G2 | Deal record · Correspondence, Documents and History tabs; Lead record · Customer context, Emails, Files and History tabs |
| G3 | Resolve customer context dialog (LC-12) with candidate matches and reasons; disqualify, park and reopen a lead |
| G4 | Record outcome, Plan activity, Reschedule and Log call dialogs redrawn in this shell |
| G5 | Sales brief · Questions tab (answering a clarification) and the successor r2 comparison, Sales side |
| G6 | Prepare handover form (Won): items, evidence, destination; Reopen deal |
| G7 | Aftercare · Complete review dialog, Service referral side form, renewal handover to Deals |
| G8 | Person record; Sites register and record; New organisation and New person forms; Stakeholders panel |
| G9 | Administration: pipeline configuration, saved views manager, column chooser, export dialog, import leads wizard, notification preferences |
| G10 | States per register and record: true-empty, could not load, denied, stale or newer version, offline, partial source |
| G11 | Tablet 1024 and phone 390/320 variants of the registers, records and Pulse |
| G12 | Insights drill-through list; win/loss analysis (reasons, competitors) |

### 10.5 New and innovative features (N)

Rules-based logic first; AI only where it adds value, always grounded in record data and never writing without review.

| ID | Feature | Basis |
|---|---|---|
| N1 | "Catch me up": a summary of a deal, lead or email thread with a suggested next step, from the composer sparkle | AI, grounded in the record's activities; review before anything is saved |
| N2 | "Focus for today" on Pulse: three ranked actions | Deterministic rules (overdue, close date passed, no next activity, quotation viewed); AI ranking later |
| N3 | Deal health signals (R2) on board cards and as a "Needs attention" view | Explainable rules only; no scores or probabilities (R11) |
| N4 | Email intelligence: suggested record links with reasons (EC-01 D3), "Create lead from this email", proposed meeting times lifted into Plan activity | Rules plus AI extraction, reviewed |
| N5 | Stakeholder map on deals (roles, coverage, last contact) | Reuses CS-07 stakeholders |
| N6 | Quote-view notification to the deal owner and a follow-up prompt | Quote-view tracking state word |
| N7 | Scheduling assist: "Find a time" with Team availability; travel time between site visits | Calendar design Q1 |
| N8 | Inline editing in registers (value, expected close, owner) with a change reason; a keyboard-shortcuts sheet | Rules |
| N9 | Command palette: Ctrl K extended to actions (New deal, Record outcome, Move to …) | Shell search |
| N10 | Shared customer timeline across modules on Customer 360; an account health band | CS-01 sources |
| N11 | Map view of organisations and sites | Customers and sites decisions |
| N12 | Phone lead capture from a business-card photo or voice note | Phone scope, later |

### 10.6 Professional polish (P)

| ID | Polish |
|---|---|
| P1 | Shorter sub-lines and footers (R11) |
| P2 | One header rhythm: 20/28 title, state chip, star; at most three actions on the right |
| P3 | Density: 40 px rows and 36 px headers stay; add a compact 32 px density choice in the column chooser |
| P4 | Colour discipline: stage chips neutral; status chips by the ramp in R12; green only for current or positive; amber for attention; red for overdue or lost |
| P5 | Empty space on record pages (Customer 360, Email) filled or card widths capped |
| P6 | Elevation stays as drawn: drawer −4/0/24 at 18 %, dialog 0/12/40 at 24 % |
| P7 | Tabular numerals; dates as d Mon yyyy with the weekday where there is room |
| P8 | Font Awesome Light replaces the Lucide stand-ins on publication (A10) |
| P9 | Drawn states for registers and buttons (R14) |
| P10 | A contrast table for every text and surface pair; amber text on the amber surface is the likely failure and should move to ink text on tinted bands |

### 10.7 Recommended order

Draw R11 with P1 first (every sheet benefits), then R1 to R3, G1, G4 and G10, then G3 and G6, R9, and only then G11. N1 to N3 can be drawn as a proposal once the rule-based signals in R2 exist, because they rest on the same data.

## 11. Drawn after the acceptance — 9 November 2026

Dean answered "Accept the recommended order and draw them". Everything in section 10.7 was drawn the same day, in that order, in the same file. Node IDs are the new sheets' frames.

| Item | What was drawn |
|---|---|
| R11 + P1 | On every sheet: page sub-lines cut to one clause with an "About this page" link (12 pages), 19 register footers reduced to the count and the as-at time, 39 texts freed of decision-ID brackets, record-header and bar clauses trimmed |
| R1 | A 3 px attention marker on the rows the Needs attention count refers to (red for overdue, amber for the other rules) on D01, D02, D03, D07, L01 and the dialog sheets that show those rows; not on the archive, handover or aftercare registers |
| R2 | A rule-based signals strip under the header of the Deal record (R01, R02 and the dialog clones), the Lead record and Customer 360: last contact, next activity, open tasks, emails, quotation, days in stage against the median; words, no score |
| R3 | Quick actions (Plan activity, Log call, Email) under the preview-drawer header on D03 and the readiness summary shown as a four-item check list |
| G1 | R03 Deal record · Scope & sites `60:10146`: scope summary, six scope lines with kind, quantity, site or area and basis, sites and areas in or out of scope, existing equipment read from Sites, and the rule that the Sales brief carries the lines as reported context |
| G4 | X10 Record outcome `60:10914`, X11 Plan activity `60:11235`, X12 Reschedule `60:11678`, X13 Log call `60:12152`, all in this shell and all saving on the original activity |
| G10 | States section `61:11501`: S01 Leads true-empty `61:11502`, S02 Deals could not load `61:12297` (counts read a dash), S03 Deal record denied or not found `61:13228` (reads as not found), S04 newer saved version `61:13433`, S05 Pulse partial source `63:14018`, S06 Tasks "You're up to date" `61:14464` |
| G3 | X14 Resolve customer context `62:12848` (matches with reasons, nothing merged), X15 Disqualify or park a lead `62:13180` |
| G6 | X16 Prepare handover `62:13516` (destination, items from the accepted quotation, evidence, dates, prerequisites; Submit unavailable while evidence is missing), X17 Reopen deal `62:14191` |
| R9 | X03 Record Won shortened from 825 to 638 px by collapsing the unselected evidence types into a change-type line |
| G11 | Tablet and phone section `63:14522` with derived chrome (tablet top bar `64:14189` from a detached copy of the accepted bar with zones 280/360/384; phone header `64:14190`; Sales tab bar `64:14209` from `salesPhoneBar`: My Work, Deals, Activities, Contacts, More; status bar `64:14242`). Tablet 1024 × 768: TB01 Deals list `65:14070`, TB02 Deal record `66:14793`, TB03 Sales Pulse `65:15209`, TB04 Leads `65:14651`. Phone 390 × 844: PH01 Deals list `67:15013`, PH02 Deal record `67:15797`, PH03 Sales Pulse `67:15640`, PH04 Leads `67:15461`; PH05 Deals list at 320 `67:15237` |
| N1–N3 | Drawn as **proposals**, not accepted, in their own section `69:15443`: N01 "Catch me up" summary on the Deal record `69:15444`, N02 "Focus for today" on Pulse `69:15988`, N03 health signals on board cards `69:16429`, N04 the Needs attention list view `69:16971` |

Counts: the accepted set is now 60 sheets (the original 36 plus 24) and there are 4 proposal sheets. Section 3 of this record said 34 sheets; its table has always held 36 (the nine dialog sheets were miscounted), and the figure is corrected here rather than in the text above.

Verification: every new or changed sheet was rendered and inspected; a structural pass over all 64 sheets found no child outside its frame, no wrapped register cell and Roboto as the only font family.

Limits: tablet and phone layouts exist for four pages (Deals list, Deal record, Sales Pulse, Leads), not for every page; the phone header and tab bar are derived here and should be replaced by the accepted phone components when those are published; N1–N4 await a separate decision; the per-route page-guidance updates still follow in their own change.

## 12. N1–N4 accepted and the named version — 9 November 2026

Dean answered: "Draw N1–N4 as accepted. I have saved the named version as \"PPO - Sales module (accepted)\". If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The four items were integrated into the accepted sheets rather than kept as a proposal section, and the counts they depend on were reconciled across every page that states them.

### 12.1 What changed in the file

| Item | Integrated as |
|---|---|
| N1 Catch me up | A collapsed bar under the view tabs of the Deal record (R01, R02, R03) and the Lead record (L02), and in the Email reading pane header (M01): sparkle, "Catch me up", what it summarises, and Show. The open state is R04 `69:15444` in the Deal record section (the former N01 sheet, moved). The summary is grounded in the record's own activities, emails, brief and quotation; the suggested next step states its rule; nothing is saved until the person acts; it never writes to the record |
| N2 Focus for today | A compact one-row card at the top of Sales Pulse (P01) and its clones (X10, X13, S05): three actions ranked by rule (overdue first, then close date passed, then no next activity) with "why this order". Tablet TB03 carries a two-row version; phone PH03 a sideways-scrolling card row |
| N3 Health signals | Explainable chips on every board card of D04 (contact age, next activity, quotation state, overdue, no next, moved 3×); words, never a score or probability |
| N4 Needs attention view | D08 `72:16631`, built from the Deals list with the Needs attention filter active: grouped by rule in severity order (overdue next action, close date passed, no next activity, moved 3 or more times), each group stating its rule and count (including "0 deals" for close date passed), the signal detail in words and the fix beside each row |

The "Proposals · N1–N3" section was removed once empty. The accepted set is 62 sheets in nine sections; there are no proposal sheets.

### 12.2 Counts reconciled (C6)

The deal-attention rules now give the same answer on every page, as at Thursday 5 November 2026, 09:00: overdue next action 1 (Mallee Fresh Produce, 3 days), close date passed 0, no next activity 1 (Coastal Herbs, A$54,800), moved 3 or more times 1 (Hillcrest Tomatoes, +42 days), so 3 deals need attention. Pipeline insights (IN01) now reads Planned next activity 37 of 38, No next activity 1, Overdue next action 1, Close date passed 0, and its No next action card lists Coastal Herbs only; the Hunter Hydro row was removed because Hunter Hydro is a lead on Leads and a won deal on Won-deal receiving. The Filters panel (X07) counts read 1, 1 and 0. Sales Pulse (P01 and its clones, TB03, PH03) replaces the "Deals without a next step" tile with "Deals needing attention · 3 deals · no next step 1 · overdue 1 · moved 3 times 1", its Deal attention section shows Coastal Herbs and Mallee Fresh Produce with "3 in your scope · first 2 shown" (the accepted D19 wording), and the Deals "Needs attention 3" chip is unchanged.

### 12.3 Named version

Dean saved the named version "PPO - Sales module (accepted)" on 9 November 2026. It was saved before N1–N4 were integrated and before the C6 reconciliation, so under [Build from the named Figma version](figma-named-version-build-handoff.md) rule 5 it does not pin this state. Recommended: save a further named version, "PPO - Sales module (accepted) · N1–N4", and record it here when saved. A build that starts from the first version builds the 60 sheets as they were; the N1–N4 additions and the reconciled counts need the second.

### 12.4 Verification and limits

Renders of D04, D08, P01, R01, L02, M01, TB03, PH03, IN01 and X07 were inspected after the change. A structural pass over all 62 sheets found no child outside its frame, no wrapped register cell and Roboto as the only font family. The header, index and audit cards in the file carry the new counts and node IDs.

Limits: the Catch me up bar is not drawn on the tablet or phone record variants; the Focus for today ranking is deterministic as drawn and the AI ranking named in N2 is a later step; the health-signal thresholds (for example "lead goes cold at 7 days") are synthetic wording, not adopted rules; the per-route page-guidance updates still follow in their own change.

## 13. The next batch and the customisation pages — 9 November 2026

Dean answered "Draw the next batch." While it was in progress he asked whether the file includes a state or page that lets users customise Sales module features, the Deals stage pipeline being his example. The batch recommended after section 12 (G2, G5, G7, G8 and G9, then R4 to R8 and R12 to R14 with P4, P5, P7, P9 and P10 as one polish pass, then the remaining G11 pages) was drawn in that order in the same file, and six customisation pages were added in answer to the question. Node IDs are the new sheets' frames.

### 13.1 Sheets drawn

| Item | What was drawn |
|---|---|
| G2 | Deal record tabs R05 Correspondence `83:15966` (emails, calls and letters linked to the deal; private emails are never listed, counted or searchable for colleagues), R06 Documents `83:16626` (links only; SharePoint owns business documents), R07 History `83:17308` (immutable version timeline; corrections are new entries). Lead record tabs L03 Customer context `84:16714` (the resolved organisation, site and person beside the typed values, each with its match reason, Re-resolve, and possible duplicates suggested but never merged), L04 Emails `84:17277`, L05 Files `84:17820`, L06 History `84:18326` |
| G5 | H03 Sales brief · Questions tab `85:17647` (a clarification from Estimating with "answer needed by"; the answer is recorded on r1, which stays frozen), H04 successor r2 after a return `85:18132` (the returned items with their outcomes, the changes from r1 beside the frozen r1) |
| G7 | X18 Complete review `86:18072` (attendance, what was recorded, outcome in words; no satisfaction score), X19 Service referral `86:18374` (prepared is not submitted), X20 Renewal handover to Deals `86:18645` (existing-opportunity check first; creates a lead to qualify) |
| G8 | C02 Person record `87:18770` (identity, roles at sites, relationships; a title confers no purchasing authority), C03 Stakeholders `87:19194` (roles as stated or observed with their basis, our coverage, gaps; no influence score), SI01 Sites register `88:19242` (third hub tab beside People and Organisations), SI02 Site record `88:20001` (areas and equipment read from Sites, never edited here; open work by source), X21 New organisation `89:19745` and X22 New person `89:20372` (duplicate check before creating) |
| G9 | X23 Columns `89:21045` (frozen and visible columns, their order, Comfortable or Compact density, saved with the view; this is P3), X24 Export `89:21894` (scope, columns, format; restricted fields never exported; the export is logged), and the Administration section `89:23786`: AD01 Pipeline configuration `89:23787`, AD02 Saved views `89:24191`, AD03 Import leads wizard, step 2 of 5 `89:24707`, AD04 Notification preferences `89:25152` |
| Customisation (Dean's question) | AD05 Sales settings hub `96:22104` (what can be changed, by whom and at which scope, workspace, team or personal; every change is logged), AD06 Pipeline configuration editing a stage in draft v8 `96:22533` (the stage list with drag order beside the stage editor: name, definition, entry rule, exit checks added and removed, attention threshold in days; publishing creates a version), X25 Publish pipeline version `96:22962` (what changes, impact on open deals, effective when, users told in app), AD07 Needs-attention rules `97:22848` (the four rules with their thresholds in days and counts, where the flags show, two proposed rules off), AD08 Pick-lists `97:23214` (lost reasons, lead sources, activity types, stakeholder roles, relationship and evidence types; values retire and are never deleted), AD09 Record layout and board card `97:23743` (signals strip, record cards and board-card fields with a live preview; workspace default, personal order for the strip only) |
| R14, P9, R12, R13, P10 | ST01 Interaction states and accessibility `94:22071` in the States section: register row states (default, hover, selected, keyboard focus, previewed in the drawer, needs attention), column header states (hover, sorted, resizing, frozen edge), five button kinds across six states, the status chip tone ramp with one meaning per tone, checkbox states, the keyboard order with one Tab stop per region, tabular figures and the contrast proof |
| G11 | Tablet 1024 × 768: TB05 Tasks `99:23615`, TB06 People `99:24086`, TB07 Organisations `99:24721`, TB08 Products `99:25356`, TB09 Estimating handovers `100:24678`, TB10 Won-deal receiving `100:25132`, TB11 Aftercare reviews `100:25519`, TB12 Pipeline insights `100:25953`, TB13 Lead record `101:25543`, TB14 Customer 360 `101:25936`, TB15 Sales brief record `101:26350`, TB16 Won-deal handover record `101:26748`, TB17 Aftercare review record `101:27157`, TB18 Activities week `102:26601`, TB19 Email `102:26975`. Phone 390 × 844: PH06 Tasks `103:26992`, PH07 Email `103:27133`, PH08 Contacts `103:27296`, PH09 Customer 360 `103:27498`, PH10 Lead record `103:27673`, PH11 Activities day agenda `103:27822` |

### 13.2 Refinements and polish applied to existing sheets

| Item | Applied as |
|---|---|
| R4 | Board card ages on D04 read "4 d in stage"; swimlanes by owner stay optional and are not drawn |
| R5 | Forecast (D05): a total above every bar, the bars rescaled to the register and KPI totals (November A$509,600, December A$691,100, Y axis to A$800k), the legend in stack order |
| R6 | Email (M01): the reading pane fills its height with two collapsed earlier messages and a sticky reply bar (Reply all, Forward, Draft a reply) |
| R7 | Customer 360 (C360): a Recent activity card across the organisation's people |
| R8 | Won-deal receiving (W01): "Routing decision required" is a warning chip |
| R10 | Pulse attention rows (P01 and the X10, X13 and S05 clones): the title takes the full width and the value moves to the second line |
| R12 | The chip tone ramp is documented on ST01; the Forecast KPIs were already kit instances |
| R13 | Frozen-edge shadows on the 35 registers that scroll sideways (an inner shadow on the scroll region's left edge and a drop shadow on the frozen row-menu column); header hover and sort states and the tabular-figures note on ST01 |
| P10 | Contrast computed from the PPO colour variables: every text pair exceeds 4.5:1 (warning text on warning surface 6.0:1, success 5.4:1, danger 6.3:1, info 5.6:1, neutral 5.5:1, secondary text on white 5.8:1, link 7.1:1), so the amber change the audit anticipated was not needed; control edges and the focus ring exceed 3:1 |
| P4, P5, P7 | Page-wide scans: literal fills occur only in the shell copies and the forecast chart ramp; no register column is all empty (the "done" and thumbnail columns hold nodes, not text); one date style throughout, the ISO dates on AD03 being the import file's own values |
| Render fixes | Every record signals strip now truncates its tiles (SI02 overflowed at the right edge), H03 Questions tab count, H04 header overflow, C03 "4 people · 5 roles", X24 dialog centred inside its frame |

### 13.3 The customisation answer and a proposed departure

Before this batch the file held AD01 to AD04 and X23 as configuration views without an editing state. It now shows the settings hub, the stage editor over a draft version with its publish dialog and impact statement, editable attention-rule thresholds, the pick-list editor and the record and board-card layout; saved views, columns and notifications remain as drawn. One element is a proposed departure, drawn and labelled "Proposed · N13" on AD06: adding, removing or merging a stage in a draft. The accepted position (AD01, `crm-deal-stage-definitions`, R11) is that the five stages are a product decision rather than a configuration setting, so AD06 keeps the stage set editable only in a draft, says that publishing such a draft needs Dean's decision, and requires a destination for the deals in any removed stage. Dean's choice is to keep the stage set fixed (the Add stage row is removed) or to adopt N13.

### 13.4 Layout, verification and limits

The sections are stacked in one column with 360 px gaps (Deals and Deal record side by side, then Leads and Sales Pulse, Tasks, Activities and Email, Handovers and aftercare, Contacts, customers, products and insights, Dialogs, States, Tablet and phone, Administration); no top-level node overlaps another and every sheet label truncates to the width of its sheet. The header, index and audit cards carry the new counts, node IDs and status notes.

Verification: renders were inspected for R05, L03, H03, H04, C02, C03, SI01, SI02, AD01 to AD09, X25, ST01, M01, D04, D05, P01, C360 and the whole tablet and phone section, and the defects they showed were corrected. A structural pass over all 114 sheets found one child outside its frame (the X24 dialog, 5 px, corrected), no wrapped register cell and Roboto as the only font family (204 mixed-style text segments, all Roboto). Repository checks run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Counts: 114 sheets in ten sections (Deals 8, Deal record 7, Leads and Sales Pulse 7, Tasks, Activities and Email 3, Handovers and aftercare 8, Contacts, customers, products and insights 10, Dialogs 25, States 7, Tablet and phone 30, Administration 9): the 62 accepted sheets and 52 drawn after the named version.

Named version: the file's only named version is still "PPO - Sales module (accepted)", saved before N1–N4. Under [Build from the named Figma version](figma-named-version-build-handoff.md) rule 5 it pins neither N1–N4 nor this batch. Recommended: one new named version, "PPO - Sales module (accepted) · batch 2", which supersedes the section 12.3 recommendation; record it here when saved.

Limits: tablet variants exist for 19 pages and phone variants for 11, not for the dialogs; the derived phone tab bar has no active-tab property, so it highlights the same tab on every phone sheet; the forecast segment colours are a five-step navy ramp drawn with literal values because no chart variables exist; the customisation pages propose behaviour (versioning, logging, scope, thresholds) and adopt no rule; AD06's Add stage row is proposed, not accepted; G12, N5 to N12, D09 swimlanes, the offline state and prototype links remain undrawn; the per-route page-guidance updates still follow in their own change.
