---
document_id: PPO-SALES-REFINED-FIGMA-PROP
date: 2026-11-09
owner: Dean Fiedler
status: Owner-accepted design, 9 November 2026 (A1–A10 accepted as recommended); not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed or deployment; every record shown is synthetic
source_commit: 8b73b5616d11b98309b445f3473bf82d100b0edc
versioning: git
---

# Sales module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 9 November 2026 · **Status:** Owner-accepted design, 9 November 2026 ([Acceptance — 9 November 2026](#9-acceptance--9-november-2026)). Sections 1 to 8 are the proposal record as written before acceptance; section 9 records the decision.

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

Every sheet was rendered and inspected after each build or repair. A structural pass over all 34 sheets found no child outside its 1440 × 900 frame, no wrapped text inside a register cell, no duplicate sheet labels and Roboto as the only font family (the brand wordmark mixes Roboto weights). Overflows found in review were corrected before this record: group totals moved into the scroll band, long tile labels, check labels and stepper notes shortened, the REP-04 and Aftercare column orders adjusted, and the dialog scrim corrected from an opaque fill to a 32 % paint.

Limits: this is a visual proposal. No prototype links, phone or tablet variants, keyboard order, contrast measurement across every pairing, screen-reader behaviour or application comparison were done. Repository check run for this change: `python3 scripts/build_status.py --check`.

## 7. Not drawn

Phone and tablet variants; the Deal record's Scope & sites, Correspondence, Documents and History tabs; the Lead record's other tabs; Person and Site records; the Product record; the Estimating side of Sales briefs; the Projects and Service receiving decisions; the Aftercare Service, Training and Commercial tabs; the Email composer; Calendar Day and List views and Team availability; loading, denied and error states beyond X08 and X09; prototype links.

## 8. Boundary and next steps

This record authorises nothing in the application. With the acceptance in section 9, the next steps are: Dean saves a named Figma version (recommended title "Sales module — accepted"); the page guidance in `docs/design/development/pages/` is updated for each route with the exact sheet references, in its own reviewed change; and the build is planned against the current application pages, keeping source presence, visual review, functional proof and deployment separate.

## 9. Acceptance — 9 November 2026

Asked to review the proposal, Dean answered: "Accept A1–A10 as recommended". That adopts every item in section 5 with its recommendation: A1 view tiles under each register title beside the nested docked-menu views; A2 group totals in the scroll-region band; A3 Tasks row actions on hover and focus with the Owner column hidden under Owner Mine; A4 the two-pane Email layout with mailbox views as tiles; A5 the shared record layout, 560–720 px dialogs over a 32 % navy scrim and 432 px right panels without a scrim; A6 the proposed Won-deal receiving state words until the receiving contract names them; A7 Insights opening Pipeline insights first with Sales performance second, as drawn; A8 no Sales quotation register, with quotations on the Deal record tab, the Deals Quoted column and REP-04; A9 the synthetic story aligned with the accepted module stories when each page is next touched; A10 Lucide icons and the copied shell components swapped to the published library when the shell is published.

What the acceptance covers: the 34 desktop sheets listed in section 3 as the accepted design for the Sales workspace pages, and the rules in section 4. What it does not cover: the items in section 7 that are not drawn, phone and tablet layouts, prototype behaviour, the built application pages, and any business approval. In the Figma file the page and the sheet sections were renamed from "(proposal)" to "(accepted 9 November 2026)" and the header and index cards now carry the acceptance; the named version is Dean's to save.
