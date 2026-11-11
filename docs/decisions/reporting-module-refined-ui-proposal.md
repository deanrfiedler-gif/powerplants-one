---
document_id: PPO-REPORTING-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal, 10 November 2026, awaiting Dean's acceptance (221 sheets and cards on 11 scope pages, including Dashboards and Report builder added at Dean's direction of 10 November 2026); drawn in a new private Figma file; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, scheduler, integration or deployment; every record and figure shown is synthetic
versioning: git
---

# Reporting module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposal awaiting Dean's acceptance. Sections 1 to 8 are the proposal record; section 9 records Dean's direction of 10 November 2026 on charts, dashboards and custom reports, and section 10 the audit.

Dean asked for the complete, refined UI page set of the Reporting workspace to be designed in a new private Figma file, "PPO - Reporting module (proposal)", inside the accepted shell and to at least the standard of the Sales module file accepted on 9 November 2026, with the Reporting brief's Addenda A1 (shared record toolbar), A2 (reference form) and A3 (persona and story reconciliation, section A3.7 for Reporting) applied. His standing instruction was to proceed on the most professional and advanced approach and state every assumption rather than stop for decisions.

Reporting is the management read over the operational modules: Reports overview with its catalogue and attention list (RP-01), the four department report pages — Sales performance (RP-02), Delivery performance (RP-03), Service performance (RP-04), Supply & Finance trust (RP-05) — and the Report definitions register with controlled versions, second-person adoption and scheduled reviews, with Saved views & schedules beside it (RP-06). It reads every module and changes nothing.

This record is a **proposal**. It changes no code, test, migration, seed, permission or route. It is also the first repository record of the RP-01 proposal of 23 October 2026, which has no decision file; an RP-01 decision remains Dean's. Acceptance of the design would not make the drawn pages an implementation baseline: source presence, visual review of built pages, functional proof and deployment stay separate.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", pages "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked (accepted 8 November 2026)" | Chrome and geometry (48 px top bar, 80 px rail, 48 px right strip, content x 80 to 1392, 280 px docked menu, 432 px panels at x 960), the accepted Reporting flyout and docked menu, the collapsed docked-menu strip, the record header toolbar (Addendum A1) and the 1024 top bar. Components were copied into the new file under the same names |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | The standard to match: page template, Read me cards, kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile), icons, derived tablet and phone chrome, the Sales phone tab bar pattern, the build-time helper library (extended for Reporting), the five pipeline stage names (Discovery, Scoping, Quoting, Negotiation, Closing) and the IN02 Sales performance extract |
| Private Figma file "PPO - Design", divider "— Reporting —" | Rules, stories and vocabulary of RP-01 (proposal, 23 October 2026, notes D1 to D13) and the owner-accepted RP-02 (30 October), RP-06 (31 October), RP-03, RP-04 and RP-05 (1 November 2026); frozen reference, its shell not copied |
| [BP-01](../blueprints/BP-01-master-blueprint.md) sections 15.4, 22.1 to 22.3 and 25.7 | Measurement governance, KPI-01 to KPI-15, the report catalogue REP-01 to REP-12, no plausible zero and no verified badge, baselines before G3; D-010, D-017 and R-06 open. No parent requirement ID is added or renamed; all 78 remain (REP and KPI codes are cross-references, relevant parents FIN-06 to FIN-08, NFR-11, SCM-08, CRM-04, PRJ-07) |
| [Navigation architecture board](navigation-architecture-board.md) (PPO-NAV-ARCH-BOARD-DEC), [Shell refined concept](shell-refined-concept-design.md) (PPO-SHELL-REFINED-FIGMA-DEC) and its [rules](../design/development/systems/shell-refined-concept-rules.md) | NAD-08 (a Reports workspace that owns no records), superseded on the rail question by Shell Q22 and R107; R36, R108, R109, R119 |
| [Sales performance](sales-performance-figma-design.md) (PPO-RP02-SALES-PERFORMANCE-FIGMA-DEC), [Delivery performance](delivery-performance-figma-design.md) (PPO-RP03-DELIVERY-PERFORMANCE-FIGMA-DEC), [Service performance](service-performance-figma-design.md) (PPO-RP04-SERVICE-PERFORMANCE-FIGMA-DEC), [Supply & Finance trust](supply-finance-trust-figma-design.md) (PPO-RP05-SUPPLY-FINANCE-TRUST-FIGMA-DEC), [Report definitions](report-definitions-figma-design.md) (PPO-RP06-REPORT-DEFINITIONS-FIGMA-DEC) | The accepted D and Q tables carried into every redrawn page |
| [Pipeline insights](pipeline-insights-figma-design.md), [Recurring checks](recurring-checks-figma-design.md), [Sales Pulse and Tasks](sales-pulse-tasks-figma-design.md), [Finance exceptions](finance-exceptions-figma-design.md), [Quote view tracking](quote-view-tracking.md), [Reviews & handovers](reviews-handovers-figma-design.md), [Report finance download access](report-finance-download-access.md), [Project financial performance](project-financial-performance-figma-design.md), [Cash outlook](cash-outlook-figma-design.md) | No probabilities, weights or targets; the basis in words; checks suggest and never act; no scheduler drawn as existing; counts never added; RP-05 keeps its numbers; the customer-view state word only; Avery Lin's return of REP-02; downloads recheck access after the storage read |
| [Readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC) and Addendum A2 | Short reference forms; definitions named by code and version; reviews by period; exports `SYN-EXP-` |
| [PPO-STD-001](../standards/naming-conventions.md), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [HTML module conformance](../standards/html-module-conformance.md), [named-version build handoff](figma-named-version-build-handoff.md), [ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md), [design, build and review roles](design-build-review-roles.md) | Naming, page order, the nine-field declaration, r20 page types, tier classification (RP-02 to RP-06 tier 1; RP-01 tier 2), the named-version rule |
| `src/shell/navigation.ts`, `src/platform/permissions.ts`, `docs/design/development/register.json` | No `reporting` workspace or `/reports` route exists (`id: "reports"` is Service review); only the Service `report.*` capabilities exist and no `reporting.*`; the register holds `scope:RP-01` to `scope:RP-06` as unbuilt with generic page notes (stale, not changed here) |

The file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

Common to every scope below: **source authority** — Dean's standing instructions and the accepted decisions named in section 1 are authority; the synthetic story (as at Thu 5 Nov 2026, 09:00 AEDT) and every figure are fictional fixtures computed by hand from the module stories, not by the application; **verification** — section 6; **departures** — section 5. Reporting reads and changes nothing (NAD-08, NR-20); every figure carries its rule, counts, source, as-at time, completeness and definition version and no judgement (BP-01 22.1, CR-04 D3); a missing value is never zero and a pending definition shows no value (BP-01 15.4, RP-02 D11, RP-04 D4); permission filters before display, with the two accepted restricted-section rules (RP-03 D9 and RP-04 D14 count a restricted section; RP-05 D10 withholds figures and counts); FN-06 owns what a measure means and RP-06 owns inclusion, grouping, filters, access and review cadence (RP-06 D1).

| Scope | Field | Declaration |
|---|---|---|
| RP-01 Reports overview | Scope identity | `scope:RP-01`, `route:/reports`; the workspace landing for Executive readers (NAD-08 landing rule kept) |
| | Page types (r20) | Overview / dashboard (management overview); Register / worklist (catalogue); right panels (About this measure, Definition pending, filters, Find results); page states |
| | Reused components | Shell / Top bar, Rail · collapsed (More current), Right rail · collapsed, the Reporting docked menu and collapsed strip; Sales kit chip, button, avatar, checkbox; Report / Tile; register table pattern |
| | Incoming handover | The eight hand-over measures as read from their report pages; the definitions register, the review calendar and the export queue for the attention list |
| | Outgoing handover | "Open report", "Open in Scheduled reviews", "Open in Report definitions", "Open request"; nothing changes on any source |
| | Exceptions and recovery | Loading permitted evidence; could not load; denied; no Reporting access (lands on My Work); stale version; permission changed; filtered-empty; viewer counts only |
| | Ownership | RP-01 owns the catalogue status, derived by rule (section 9.1), never set by hand; each report owner owns their definitions |
| RP-02 Sales performance | Scope identity | `scope:RP-02`, `route:/reports/sales`; REP-01 to REP-05 with KPI-08 |
| | Page types (r20) | Overview / dashboard (department report page) with drill registers, filter and export panels and the second-person approval dialog |
| | Reused components | As RP-01, plus Report / Header, Report / Section and Report / Chart compositions |
| | Incoming handover | Deals, leads, stage history, accounts and activity (CR-01, CR-02, CS-07), quotations by revision (ES-05), approval exceptions by rules version |
| | Outgoing handover | "Open in Deals", "Open in Quotations", "Open in Reviews & approvals"; an export request (SYN-EXP-000052) audited in AD-07 with a second person for anything leaving Powerplants |
| | Exceptions and recovery | Not recorded history (Q2 stages 1 and 2); Definition pending (REP-02 by value); no pricing policy (D-010); restricted REP-05 counted; superseded saved view; 25,000-row split |
| | Ownership | RP-02 owns the presentation of its sections; Sales and Estimating own the records |
| RP-03 Delivery performance | Scope identity | `scope:RP-03`, `route:/reports/delivery`; REP-06, REP-07, REP-08 with KPI-09, KPI-11 |
| | Page types (r20) | Overview / dashboard with drill registers and the working-days switch |
| | Incoming handover | Engineering packages, reviews and queries (EN-01, EN-05), commissioning tests by class (EN-08), baselines and forecasts with their calendars (PJ-03), variations and obligations (PJ-05), acceptance (PJ-09) |
| | Outgoing handover | "Open in Engineering", "Open in Programme", "Open in Contract obligations", "Open in Commissioning & as-built" |
| | Exceptions and recovery | As-at items "not a period measure"; REP-07 Definition pending with its facts; unpriced variations dashed; partial acceptance outside the counts; Not read; commercial values counted for project managers |
| | Ownership | Engineering owns the work and the test classes; Projects owns dates, variations and acceptance |
| RP-04 Service performance | Scope identity | `scope:RP-04`, `route:/reports/service`; KPI-01 to KPI-07, REP-12, capacity context |
| | Page types (r20) | Overview / dashboard (departs from the RP-04 decision's Record detail, A5) |
| | Incoming handover | Packs and the cutoff (FI-02), bookings and conflicts (PL-01), changes and acknowledgements, report states (SV-06), findings (SV-08), agreements and occurrences (MA-01, MA-04), capacity hours (PL-03) |
| | Outgoing handover | "Open in Job packs", "Open in Service planner", "Open in Service review", "Open in Maintenance", "Open in Findings" |
| | Exceptions and recovery | KPI-06 withheld; live items "Not in October"; unfinished items counted apart; technician own rows; restricted sections counted; Out of date |
| | Ownership | Service owns the work and the policy versions |
| RP-05 Supply & Finance trust | Scope identity | `scope:RP-05`, `route:/reports/reconciliation` (register route; the Shell label is the title); REP-09 to REP-11 with KPI-10, KPI-12, KPI-13, KPI-14 |
| | Page types (r20) | Overview / dashboard with the trust panel (departs from the RP-05 decision's Record detail, A5) |
| | Incoming handover | Demands and prerequisites (SC-01), returns, claims and credits (SC-08), handoffs, differences and exceptions (FN-01, Finance exceptions), the measure definitions' status (FN-06), the send ledger and reconciliation run (AD-04, AD-05); FN-03 and FN-05 by pointer only |
| | Outgoing handover | "Open in Material demand", "Open in Returns & claims", "Open in Finance exceptions", "Open in Reconciliation", "Open in Integrations"; Finance exports stay inside Finance |
| | Exceptions and recovery | KPI-13 withheld (D-017); KPI-14 Definition pending with the ledger in its five words; no Verified mark; MYOB read failed (Could not load, last complete read named); Finance sections withheld from Supply readers; download access rechecked when the file is read |
| | Ownership | Supply owns orders, stock and goods; FN-06 owns what a measure means; MYOB owns the ledger |
| RP-06 Report definitions; Saved views & schedules | Scope identity | `scope:RP-06`, `route:/reports/definitions` and the proposed `/reports/views` (A4); two rail items over one scope, and from Dean's direction of 10 November 2026 two more record types, Dashboards (`/reports/dashboards`) and the Report builder (`/reports/builder`), proposed (A23, A24) |
| | Page types (r20) | Register / worklist (definitions, views, scheduled reviews); Record detail with the A1 toolbar (definition version, saved view); Review / comparison (version comparison); Form / guided workflow (Record a review); dialogs (Adopt, Return, Submit, Save view, Share, Delete) |
| | Incoming handover | Proposals from report owners; FN-06 meaning status; the period calendar |
| | Outgoing handover | Adopted versions effective from a stated date; recorded reviews (never edited); saved views shared with named people; export permissions; second-person approvals recorded in AD-07; My Work items (section 6.9 of the brief) |
| | Exceptions and recovery | The proposer's Adopt disabled and the attempt refused and recorded (S8); nothing defined; superseded version with a view still working; review overdue (nudge only, no automation); read only; "Scheduling not yet available" |
| | Ownership | RP-06 owns versions, reviews, saved views and export permissions; AD-07 owns the audit trail; FN-06 the meaning |

## 3. Sheet inventory

Every sheet sits on its scope page inside the shell, in the six template sections, with a one-line label 26 px above it. Node IDs are the sheet frames in the file; "full length" sheets are 1440 wide and as tall as their content.

Total: 221 sheets and cards across 11 scope pages, matching the scripted count of frames in the template sections.

### Reports overview · RP-01

| Code | Sheet | Node | Section |
|---|---|---|---|
| RO01 | Management overview, full length (built first, as the exemplar) | `39:3` | Desktop 1440 |
| RO02 | Report catalogue, grouped by report page, full length, strip; status-rule hover on REP-02 | `42:799` | Desktop 1440 |
| RO03 | Attention list expanded, full length (docked view Attention) | `44:3804` | Desktop 1440 |
| RO06 | Catalogue filtered to Partial, REP-02 row expanded with readiness ledger (N-N12) | `46:3841` | Desktop 1440 |
| RO07 | Period and company filter panel | `47:7019` | Desktop 1440 |
| RO07b | SYN Greenhouse Demonstration selected — "No data · demo company" on every tile | `47:7595` | Desktop 1440 |
| RO08 | Overview as Jamie Park (Sales valued; REP-06, REP-07, REP-12 Counted; REP-11 Withheld; attention reduced to 2 rows) | `47:8309` | Desktop 1440 |
| RO09 | Overview with the accepted 12 px collapsed strip, handle hovered | `47:12653` | Desktop 1440 |
| RO10 | Find in Reporting results for "KPI-11" (flyout from the docked menu's Find; 7 results) | `47:13264` | Desktop 1440 |
| RO04 | About this measure, KPI-12 (432 px panel; rule, run, four items, version, owner, cadence, review history; RP-06 and FN-06 links) | `49:10713` | Dialogs and panels |
| RO05 | Definition pending panel, REP-07 (facts that need no definition) | `49:11451` | Dialogs and panels |
| X01 | Source completeness panel (read, completeness, age rule, what depends on each) | `49:12180` | Dialogs and panels |
| X02 | Period selector popover | `50:17363` | Dialogs and panels |
| X03 | Company filter popover | `50:18083` | Dialogs and panels |
| X04 | Drill list behind the REP-12 tile — October occurrences (done 19 collapsed, deferred 2, carried 2) | `50:18778` | Dialogs and panels |
| PS01 | Loading permitted evidence (no figures) | `52:19629` | States |
| PS02 | Could not load (no figures; last complete read 08:45 named) | `52:19962` | States |
| PS03 | Denied or not found (old saved-view link) | `52:20280` | States |
| PS04 | No Reporting access — Casey Ward lands on My Work (toast; Service performance own rows) | `55:19464` | States |
| PS05 | Permission changed while open — Jamie Park, REP-10 now Counted (09:12) | `55:19667` | States |
| PS06 | Filtered-empty catalogue, filters restated | `55:20347` | States |
| PS07 | Stale — REP-02 v1 adopted while reading, version label "read 09:00" kept | `56:20860` | States |
| PS08 | Lee Nakamura viewer — counts only, REP-11 Withheld, no Save view or Export, "Nothing needs you" | `56:21524` | States |
| TB01 | Tablet 1024 overview, full length, tiles two per row (2322 px) | `56:38874` | Tablet 1024 |
| TB02 | Tablet 1024 catalogue, full length, strip | `56:39438` | Tablet 1024 |
| PH01 | Phone 390 overview, tiles stacked with attention list, full length | `56:45928` | Phone 390 and 320 |
| PH02 | Phone 390 catalogue list | `57:41897` | Phone 390 and 320 |
| PH03 | Phone 390 Definition pending detail (REP-07) | `57:42013` | Phone 390 and 320 |
| PH04 | Phone 390 no Reporting access — My Work tab current | `57:42093` | Phone 390 and 320 |
| PH05 | Phone 390 could not load | `57:42164` | Phone 390 and 320 |
| PH06 | Phone 320 overview, full length (own row) | `56:46154` | Phone 390 and 320 |
| NOTES | Flows and notes · Reports overview · RP-01 | `58:8247` | Flows and notes |

### Dashboards · RP-06 (proposal of 10 November 2026)

| Code | Sheet | Node | Section |
|---|---|---|---|
| DB00 | Proposed Reporting menus: flyout and docked with the Dashboards group and Report builder, footer "All 9 Reporting pages", Recent row Q3, what-changes note | `76:5657` | Desktop 1440 |
| DB01 | Dashboards register (12 px strip; views My dashboards 1, Shared with me 2, All permitted 3; grouped Mine / Shared; New dashboard as a page action; saved view vs dashboard explainer) | `81:7070` | Desktop 1440 |
| DB02 | Management dashboard, Dean (full length, flagship): header with Private, one filter row, sources, permission; ten widgets on a 12-column grid (KPI-12 number, send ledger split bar, Needs attention, decided deals by month with quarter row and hover tooltip, quotation outcomes split bar + issued by month, open deals by stage, KPI-01 Oct/Sep split bars, REP-12 Oct/Sep, REP-06 reviews by month, KPI-11 per test class); each widget with rule, source, as-at and version | `78:7776` | Desktop 1440 |
| DB03 | Sales team (Jamie Park) as Kate Morgan, shared read only, Duplicate to edit; proposed docked menu with Shared with me current; REP-05 widget Counted; open deals by owner ranked bars; top bar shows Kate Morgan | `82:14316` | Desktop 1440 |
| DB04 | Edit mode: edit bar (Undo, Add widget, Cancel, Done), grips on every widget, 12-column overlay, selected widget with corner handle and size label, dragged ghost, drop placeholder | `82:50934` | Desktop 1440 |
| DB05 | Add widget panel (432 px): governed library grouped by report, status chips, allowed chart types, Added state, Definition pending and Withheld addable showing their state, KPI-15 Not built not addable; filter chips, no search field | `83:1103` | Dialogs and panels |
| DB06 | Widget settings panel: bound source, chart type (pie, target line, average line disabled with reasons), period rule, prior period toggle, table view toggle, filters | `84:5733` | Dialogs and panels |
| DB07 | Share dashboard dialog: named people, read only, no public link, per-reader preview (Kate 4/5/1, Robin 1/8/1 readable/counted/withheld) | `85:3617` | Dialogs and panels |
| DB-S1 | Widget states: Could not load (MYOB 06:00 failed, last complete read Wed 4 Nov 06:00), Definition pending (KPI-06), Withheld (as Robin Hale), superseded version still working (REP-01 v1) | `86:6943` | States |
| DB-S2 | Empty dashboard (Untitled, Add widget, Start from a report) | `87:10248` | States |
| DB-S3 | Loading permitted evidence (skeleton widgets, no figures) | `87:10480` | States |
| TB-DB02 | Tablet Management dashboard, two widgets per row, full length | `87:38598` | Tablet 1024 |
| PH-DB02 | Phone Management dashboard, widgets stacked, read only, full length, More current | `88:6187` | Phone 390 and 320 |
| PH-DB01 | Phone Dashboards list, More current | `88:6673` | Phone 390 and 320 |
| Notes | Flows and notes card | `89:2884` | Flows and notes |

### Sales performance · RP-02

| Code | Sheet | Node | Section |
|---|---|---|---|
| SP01 | Report, Q3 2026 beside Q2, five sections, full length (5918 px) | `44:2102` | Desktop 1440 |
| SP02 | REP-01 Pipeline ageing, section detail with the chart table open, full length | `49:2584` | Desktop 1440 |
| SP03 | REP-01 drill, open deals by stage (register, collapsed strip) | `50:9373` | Desktop 1440 |
| SP04 | REP-02 Conversion, section detail, full length | `49:3302` | Desktop 1440 |
| SP05 | REP-03 Account activity, section detail, full length | `51:6794` | Desktop 1440 |
| SP06 | REP-04 Quotations, section detail, full length | `51:7401` | Desktop 1440 |
| SP07 | REP-04 drill, open quotations now (14) | `50:10124` | Desktop 1440 |
| SP08 | REP-05 Commercial exceptions, section detail, full length | `51:7950` | Desktop 1440 |
| SP11 | As Jamie Park (owner): Record review (REP-01, REP-03 due Fri 6 Nov), own export waiting | `52:7822` | Desktop 1440 |
| SP12 | As Kate Morgan: REP-05 Counted, "Ageing by owner" on REP-01 v1 superseded, full length | `52:8477` | Desktop 1440 |
| SP09 | Filters panel | `56:25907` | Dialogs and panels |
| SP10 | Export panel as Jamie Park with SYN-EXP-000052 Awaiting approval | `56:26575` | Dialogs and panels |
| X | Period selector popover | `56:27250` | Dialogs and panels |
| X | Approve export SYN-EXP-000052 (Dean as the second person) | `56:41870` | Dialogs and panels |
| X | Download with manifest (state after approval, SHA-256 per file) | `56:42532` | Dialogs and panels |
| SP13 | History not recorded (Q2 stages 1 and 2) | `57:17141` | States |
| PS | Export over 25,000 rows split into parts | `57:17504` | States |
| PS | Export awaiting a second person, requester view (Approve disabled) | `57:18114` | States |
| PS | Stale: REP-02 v1 adopted while reading, labels kept | `57:18754` | States |
| TB SP01 | Report at 1024, full length | `57:42539` | Tablet 1024 |
| TB SP03 | Drill register at 1024 | `58:33460` | Tablet 1024 |
| PH SP01 | Section summaries 390, full length (no tables, no export) | `58:33906` | Phone 390 and 320 |
| PH SP03 | Drill list | `58:34133` | Phone 390 and 320 |
| PH SP01 · 320 | Section summaries 320, full length | `58:34226` | Phone 390 and 320 |
| Notes | Flows and notes · RP-02 | `59:15140` | Flows and notes |

### Delivery performance · RP-03

| Code | Sheet | Node | Section |
|---|---|---|---|
| DP01 | Report, Q3 beside Q2, open items as at Thu 5 Nov, five sections (REP-06, REP-07, REP-08, KPI-09, KPI-11), full length | `42:1970` | Desktop 1440 |
| DP02 | REP-06 engineering, section detail with About these numbers open (data table) | `49:611` | Desktop 1440 |
| DP03 | REP-07 programme slippage, Definition pending with the nine projects' facts, Glasshouse 4 r1 beside r2 | `49:1206` | Desktop 1440 |
| DP04 | REP-08 changes and closeout with KPI-09 variations by status, section detail | `50:2353` | Desktop 1440 |
| DP05 | KPI-11 first pass by test class, section detail with version per period | `50:3046` | Desktop 1440 |
| DP06 | Block C drill (REP-08, KPI-09, programme, permit, O-07) | `51:18941` | Desktop 1440 |
| DP07 | KPI-11 drill, Control panels, 12 Q3 tests, T06 SM-3 counted against | `51:19361` | Desktop 1440 |
| DP09 | As Jess Wong (owner follow-ups, REP-08 Recorded late, REP-07 submit v1, REP-06 overdue) | `52:13821` | Desktop 1440 |
| DP10 | As Morgan Lee (commercial values Counted, approved value withheld as a count) | `55:7554` | Desktop 1440 |
| DP08 | Export panel (sections with permitted rows, purpose, destination, manifest) | `56:36403` | Dialogs and panels |
| DPX1 | About this measure, KPI-11 with version history | `56:36960` | Dialogs and panels |
| DPX2 | REP-07 Definition pending detail | `56:37475` | Dialogs and panels |
| DP11 | Working days and calendar days switch, calendars named | `56:40656` | States |
| DPS1 | As Kate Morgan: every section Counted (RP-03 D9) | `56:41293` | States |
| DPS2 | KPI-11 Screen drives Q2 "Not read", never 0 % | `56:44444` | States |
| DPS3 | Engineering read failed: REP-06 and KPI-11 Could not load, last complete read named | `56:44961` | States |
| TB-DP01 | Tablet 1024, full length, five sections | `57:10030` | Tablet 1024 |
| TB-DP05 | Tablet 1024, KPI-11 view | `57:11590` | Tablet 1024 |
| PH-DP01 | Phone 390, section summaries stacked, full length, More current | `58:32752` | Phone 390 and 320 |
| — | Flows and notes card | `58:35336` | Flows and notes |

### Service performance · RP-04

| Code | Sheet | Node | Section |
|---|---|---|---|
| SE01 | Report, October 2026 beside September, full length (6056 px; six sections, live strip, N-N8 strip) | `42:2850` | Desktop 1440 |
| SE02 | Field readiness (KPI-01, KPI-02), section detail | `47:1498` | Desktop 1440 |
| SE03 | KPI-01 drill: 5 not met, 2 permitted exceptions apart | `47:12122` | Desktop 1440 |
| SE04 | Scheduling (KPI-03, KPI-04), section detail | `47:1959` | Desktop 1440 |
| SE05 | Outcomes (KPI-05, KPI-06 withheld), section detail | `47:14028` | Desktop 1440 |
| SE06 | Data quality (KPI-07), section detail | `47:14510` | Desktop 1440 |
| SE07 | Coverage and follow-up (REP-12), section detail | `47:14917` | Desktop 1440 |
| SE08 | Capacity context, section detail | `49:6302` | Desktop 1440 |
| SE09 | Live items, Not in October | `49:6727` | Desktop 1440 |
| SE10 | As Casey Ward: own rows, other sections Counted, no Export, view "Van 1 October", N-N11 | `50:22131` | Desktop 1440 |
| SE12 | As Jordan Kim: Record review (October set due Fri 6 Nov), KPI-06 v1 awaiting adoption by Dean Fiedler | `49:7139` | Desktop 1440 |
| SE11 | Export panel (inside Powerplants, 294 rows, manifest, N-N5) | `51:13646` | Dialogs and panels |
| SE-X1 | KPI-06 Withheld / Definition pending detail | `51:14190` | Dialogs and panels |
| SE-X2 | About this measure, KPI-04 (median, 90th nearest rank, slowest; history) | `52:3942` | Dialogs and panels |
| SE-X3 | Record a review, October set, as Jordan Kim (N-N3 suggested draft, never saved until recorded) | `52:4485` | Dialogs and panels |
| SE-S1 | Out of date, labelled state example | `55:12782` | States |
| SE-S2 | Technician view, restricted sections Counted | `55:13143` | States |
| SE-S3 | Owner with an overdue review, state example dated Mon 9 Nov | `55:13491` | States |
| TB-SE01 | Tablet 1024, full length | `56:12561` | Tablet 1024 |
| TB-SE03 | Tablet 1024, KPI-01 drill | `56:14233` | Tablet 1024 |
| PH-SE01 | Phone 390, section summaries, full length | `56:45423` | Phone 390 and 320 |
| PH-SE01-320 | Phone 320, section summaries, full length | `56:45675` | Phone 390 and 320 |
| PH-SE03 | Phone 390, KPI-01 drill list | `57:42243` | Phone 390 and 320 |
| PH-SE10 | Phone 390, Casey Ward own rows | `57:42388` | Phone 390 and 320 |
| — | Flows and notes card | `58:21611` | Flows and notes |

### Supply and Finance trust · RP-05

| Code | Sheet | Node | Section |
|---|---|---|---|
| TR01 | Report, October 2026 beside September, full length (4 sections; flagship) | `42:3444` | Desktop 1440 |
| TR02 | Materials (REP-09, KPI-10), section detail | `45:3060` | Desktop 1440 |
| TR04 | Returns and recoveries (REP-10), three ageing tables never added | `45:3619` | Desktop 1440 |
| TR05 | Finance trust (REP-11, KPI-12, KPI-13), section detail, flagship, with "What changed" (N-N8) | `46:1092` | Desktop 1440 |
| TR07 | Integration (KPI-14), Definition pending with the week's ledger | `46:1580` | Desktop 1440 |
| TR03 | REP-09 drill, 8 eligible October packages, prerequisites met/unmet | `47:10757` | Desktop 1440 |
| TR11 | Report as Avery Lin (owner): Record review REP-11, follow-ups (October due Fri 6 Nov; adopt KPI-15; September recorded) | `47:11274` | Desktop 1440 |
| TR10 | Report as Robin Hale: Materials and Returns full; Finance trust Withheld (no figures, no counts); KPI-14 Counted; Record review (REP-10) | `47:15820` | Desktop 1440 |
| TR06 | KPI-13 withheld while D-017 is open (panel) | `49:15256` | Dialogs and panels |
| TR08 | Trust panel "Can this view be trusted?" — three answers in words, no badge | `49:15758` | Dialogs and panels |
| TRX1 | About this measure, KPI-12 — rule, run, four items, version, owner, cadence, review history; Definition (RP-06) and Meaning (FN-06) | `49:16253` | Dialogs and panels |
| TR09 | Export side form as Avery Lin (Finance sections inside Finance only; SYN-EXP-000051 Downloaded) | `50:6948` | Dialogs and panels |
| TRX2 | SYN-EXP-000051 downloaded: manifest, SHA-256 per file, access recheck on read (dialog) | `50:7474` | Dialogs and panels |
| TR-PS07 | MYOB read of 06:00 failed: Could not load with last complete read (Wed 4 Nov 06:00); PPO figures still show (N-N2) | `51:23588` | States |
| TR-PS | Restricted sections: Withheld (RP-05 D10) beside Counted (RP-03 D9, RP-04 D14), each rule stated, Q5 open | `51:24044` | States |
| TR-PS | Out of date: reconciliation run older than its rule | `51:24340` | States |
| TR-TB01 | Report at 1024 × 768, full length (tiles two by two) | `52:25104` | Tablet 1024 |
| TR-PH01 | Section summaries stacked, no tables, 390, full length (More current on the Reporting bar) | `52:26417` | Phone 390 and 320 |
| — | Flows and notes card | `56:41740` | Flows and notes |

### Report definitions · RP-06

| Code | Sheet | Node | Section |
|---|---|---|---|
| RD01 | Register, all 27 definitions grouped by report, full length (1440 × 1564), strip | `47:4680` | Desktop 1440 |
| RD02 | REP-02 v1 record, Definition tab, In review, Dean adopts; checks bar, signals, details column, impact preview (N-N4); full length (1440 × 1383) | `44:1638` | Desktop 1440 |
| RD03 | REP-02 v1 History tab: proposed, returned (Avery Lin), resubmitted, nothing edited | `49:18057` | Desktop 1440 |
| RD04 | REP-01 v1 → v2 comparison: changes in words, pages affected 3, saved views affected 1 | `49:18407` | Desktop 1440 |
| RD05 | KPI-11 v2 Adopted, within test class; Q2 "computed under v1" | `49:18720` | Desktop 1440 |
| RD07 | KPI-15 v1, Dean's own proposal: Adopt disabled ("You proposed v1 on Mon 2 Nov · Avery Lin adopts"), refused attempt in History/AD-07 | `45:5451` | Desktop 1440 |
| RD08 | Export permissions by report section (policy v1) with Taylor Quinn's REP-12 proposal awaiting Dean | `50:12602` | Desktop 1440 |
| RD09 | REP-11 review history: October due, September recorded with a correction note, August recorded | `50:13088` | Desktop 1440 |
| RD11 | REP-01 v1 Superseded, the saved view "Ageing by owner" still works on it | `52:28965` | Desktop 1440 |
| RD12 | Register grouped by owner, collapsed strip in hover with tooltip | `52:29275` | Desktop 1440 |
| RD06 | Adopt definition dialog, REP-02 v1 (checks in words, effective Sun 1 Nov, by value stays pending) | `45:5177` | Dialogs and panels |
| RD10 | Record a review panel, October review of REP-11, as Avery Lin, with the N-N3 suggestion | `54:2725` | Dialogs and panels |
| RDX1 | Return definition dialog (reason required) | `54:2940` | Dialogs and panels |
| RDX2 | Propose new version panel, REP-01 v3 by Jamie Park, impact preview | `54:3188` | Dialogs and panels |
| RDX3 | Submit for review dialog, REP-07 v1 by Jess Wong | `55:29285` | Dialogs and panels |
| RDX4 | Add a note to a recorded review (August REP-11), as Avery Lin | `55:30228` | Dialogs and panels |
| RDX5 | Edit export permissions as a proposal, Taylor Quinn, reviewed by Dean | `55:30405` | Dialogs and panels |
| RDS1 | Nothing defined: the demo company SYN Greenhouse Demonstration | `56:32372` | States |
| RDS2 | Read only: a recorded review, Add a note the only action | `56:32582` | States |
| RDS3 | Proposer is reviewer: Jamie Park on their own REP-02 v1 | `56:32905` | States |
| RDS4 | Unadopted measure in an adopted report: REP-11 v1 with KPI-13 pending | `56:33312` | States |
| TB-RD01 | Register at 1024, full length (1024 × 1542) | `57:26650` | Tablet 1024 |
| TB-RD02 | REP-02 record at 1024, details collapsed | `57:27331` | Tablet 1024 |
| PH-RD10 | Record a review on the phone, Definitions tab current, as Avery Lin | `57:27615` | Phone 390 and 320 |
| NOTES | Flows and notes card | `58:27302` | Flows and notes |

### Report builder · RP-06 (proposal of 10 November 2026)

| Code | Sheet | Node | Section |
|---|---|---|---|
| CB01 | Builder, full length (1440 × 1371): header with "Unadopted · personal exploration" chip, Save / Propose as a definition / Draft from a question; configuration column (Source Deals, Measure Count of deals, Group by Expected close month, Split by Stage · pipeline v7, Filters Status Open + Company Powerplants AU, Period As at 09:00, Chart Columns, Comparison None, Reference line "No target adopted · BP-01 22.3" disabled, Basis); columns split by stage with printed segment counts and totals, legend with patterns, hover tooltip; About these numbers table with "Open in Deals"; rule footnote | `77:7542` | Desktop 1440 |
| CB02 | Measure and chart menus open, with what is not offered and why (full length) | `78:22717` | Desktop 1440 |
| CB07 | My reports register with the proposed 9-page docked menu (Report builder current, My reports view) and the governance chain card | `81:6287` | Desktop 1440 |
| CB03 | Save this exploration dialog (only you; named people not available; saves configuration, never figures; rules at save) | `82:22825` | Dialogs and panels |
| CB04 | Propose as a definition panel (title, question, inclusion, exclusion, grain, grouping, owner, cadence, adopter Avery Lin / Jamie Park with Dean not offered, measures used and their meaning, outcome) | `82:23469` | Dialogs and panels |
| CB05 | Draft from a question (Carl · AI assistant · Simulated): quotations-by-month suggestion citing REP-04 v1, Apply · Discard; "average deal size" refused with the median offered and REP-02 by value pending | `82:24154` | Dialogs and panels |
| CB06a | Jamie Park picks the MYOB ledger source → refused, capability named (finance.read, shared.finance.read) | `84:1401` | Dialogs and panels |
| CB06b | Robin Hale's source list: Supply sources only, Finance not listed (RP-05 D10) | `84:1699` | Dialogs and panels |
| CB06c | Casey Ward own rows only: 93 % · 14 of 15 own eligible October visits by pack issued by the cutoff; Propose disabled; no export | `84:1999` | Dialogs and panels |
| CB-S1 | Empty builder, choose a source (twelve source cards with their rules) | `86:4014` | States |
| CB-S2 | Preview could not load (last complete read Thu 5 Nov 08:00 named; nothing reads zero; Retry) | `86:4364` | States |
| CB-S3 | Filters leave nothing (0 of 38, a known zero; filters restated; clear the last two) | `86:4615` | States |
| CB-S4 | Saved on a superseded rule (REP-01 v1 → v2), opens on v2 and says so; illustrative, outside the story's register | `86:4914` | States |
| TB-CB01 | Tablet 1024, full length (1024 × 1145): configuration summary chips + Configure, chart, table | `87:26214` | Tablet 1024 |
| PH-CB01 | Phone 390: "Report builder is on desktop and tablet", My reports read-only list, More current | `87:26712` | Phone 390 and 320 |
| Notes | Flows and notes card | `88:3085` | Flows and notes |

### Saved views and schedules · RP-06

| Code | Sheet | Node | Section |
|---|---|---|---|
| SW01 | My views and Shared with me, plus the administrators' All views 5 | `58:34454` | Desktop 1440 |
| SW02 | Monthly pack saved view record (A1 toolbar, primary Open report), shared with 4 | `58:34968` | Desktop 1440 |
| SW05 | Scheduled reviews with the calendar strip, full length (1440 × 1210) | `59:6115` | Desktop 1440 |
| SW06 | REP-06 Q3 review overdue: My Work nudge wording, no automation acts | `60:9613` | Desktop 1440 |
| SW07 | "Ageing by owner" saved on REP-01 v1 opens and offers v2, as Kate Morgan (docked Sales performance) | `61:3345` | Desktop 1440 |
| SW08 | Report subscriptions: Scheduling not yet available (N-N9) | `60:9911` | Desktop 1440 |
| SW03 | Save view dialog (from Reports overview) | `62:1513` | Dialogs and panels |
| SW04 | Share view panel (named people, read-only, revoke, what each sees) | `62:1940` | Dialogs and panels |
| SWX1 | Rename view dialog | `62:2136` | Dialogs and panels |
| SWX2 | Delete view dialog (shared readers lose it) | `62:2299` | Dialogs and panels |
| SWS1 | Shared view whose sections the reader may not read (Jess Wong): Counted and Withheld | `64:3035` | States |
| SWS2 | Deleted view opened by a shared reader (Avery Lin) — state example | `64:3369` | States |
| TB-SW05 | Scheduled reviews at 1024, full length (1024 × 964) | `63:4320` | Tablet 1024 |
| PH-SW05 | Scheduled reviews on the phone, full length (390 × 1760), Definitions current | `63:4781` | Phone 390 and 320 |
| PH-SW05-320 | Scheduled reviews at 320, full length (320 × 1826) | `63:4984` | Phone 390 and 320 |
| PH-SW01 | Saved views list on the phone, More current | `63:5166` | Phone 390 and 320 |
| NOTES | Flows and notes card | `64:3571` | Flows and notes |

### Interaction states · RP

| Code | Sheet | Node | Section |
|---|---|---|---|
| ST01a | Tile family: ten kinds, interaction states (default, hover with rule tooltip, 2 px focus, info pressed), anatomy and required fields, screen-reader text (full length) | `42:2541` | Desktop |
| ST01b | Chart slots 1–6 + neutrals with patterns and computed contrast on white; printed values and "About these numbers" example; never-drawn list; contrast proof table computed from the PPO colour variables (full length) | `43:2262` | Desktop |
| ST01c | Status chip ramps (definition, catalogue, review, export, send ledger, completeness, period, saved view, filters/references); the words for the missing; checks-bar chips; who-did-what chips (full length) | `45:6306` | Desktop |
| ST01d | Register standard: header states (default, hover grip, sorted asc/desc, resizing 8 px hit area + live width, dragging ghost + 2 px drop indicator, frozen edge); row states; inline edit (pencil, editing, validation in words, concurrent edit); read-only reasons; not-used notes incl. no address lookup (full length) | `47:2966` | Desktop |
| ST01e | Buttons 6 kinds × 5 states; checkbox, radio, toggle, field states; keyboard order map; shortcuts (proposed); 200 % zoom, screen reader, phone targets, motion, dark mode not drawn (full length) | `47:16819` | Desktop |
| X-ST1 | Report catalogue — Columns panel (density, frozen set, reorder with drop indicator, widths, hidden columns) | `49:19605` | Dialogs and panels |
| X-ST2 | Reports overview — Keyboard shortcuts dialog (over a clone of RO01) | `49:20243` | Dialogs and panels |
| PS-ST1 | Restricted sections — Counted (Morgan Lee RP-03; Jamie Park RP-04) beside Withheld (Robin Hale RP-05) with the rule table and the Q5 open question (full length) | `51:9967` | States |
| ST-TB01 | Service performance at 1024 — focus visible, collapsed strip, tiles two per row | `56:38347` | Tablet |
| ST-PH01 | Service performance on 390 — 44 px info targets, 48 px button, More current (full length) | `56:38624` | Phone |
| ST-PH02 | Service performance on 320 — stacking, no truncation of rates (full length) | `56:38747` | Phone |
| Notes | Flows and notes card (ST-A1–ST-A8, conformance, counts) | `57:21484` | Flows and notes |
| ST02 | Chart vocabulary v2 (Dean, 10 November 2026): adopted forms with examples, anatomy, declined forms with their rules, palette check; full length | `83:3944` | Desktop |

### Administration · RP

| Code | Sheet | Node | Section |
|---|---|---|---|
| AD01 | Reporting settings hub (Taylor Quinn): scope strip, nine setting cards, recent changes, who can change what (full length) | `58:33001` | Desktop |
| AD02 | Review cadence policy — draft v2 by Taylor Quinn: monthly and quarterly sets, due rule, absent-owner rule edit with eight named second people | `58:35467` | Desktop |
| AD03 | Export permissions — policy v2 In review, read by Dean as second person: 16 section rows × 14 people/role columns, REP-12 change, leaving-Powerplants rule, manifest (full length) | `61:1331` | Desktop |
| AD04 | Period defaults and cutoffs — v1, with the Melbourne Cup Day question and the due-date table | `59:7269` | Desktop |
| AD05 | Catalogue owners and adopters — page owners and 27 definitions grouped by page (owner, adopter, recorder if away, cadence, meaning, status) (full length) | `62:4971` | Desktop |
| AD06 | Saved view sharing — rules v1 and the administrator's All views 5 | `59:7584` | Desktop |
| AD07 | Display rules — read only, fixed by decisions | `60:8181` | Desktop |
| AD08 | Numbering, notifications and nudges (day counts, first-fire dates), personal layout | `60:8542` | Desktop |
| AD-X1 | Publish export permissions v2 dialog (Dean, second person) | `63:5247` | Dialogs and panels |
| AD-X2 | Submit review cadence v2 for review dialog (Taylor; what it affects) | `63:5931` | Dialogs and panels |
| AD-S1 | Proposer refused: Taylor cannot publish their own export permissions v2 (Publish disabled with reason, Withdraw v2 offered) | `63:6192` | States |
| AD-TB01 | Reporting settings hub at 1024 | `64:6099` | Tablet |
| AD-PH01 | Reporting settings on a phone — policies read only, personal notifications editable | `64:6373` | Phone |
| Notes | Flows and notes card (AD-A1–AD-A10, conformance, counts) | `65:6127` | Flows and notes |

## 4. Rules applied

- **Reads, never acts.** No sheet shows Approve, Assign, Reschedule, Close or Send on a source record; every drill row carries "Open in [page]"; Export is the only download; Reporting's own writes are definition versions, reviews, saved views and export requests.
- **Every figure explains itself.** The Report / Tile family carries the value or state word, the counts, the prior period, the rule line, the source and as-at line with the definition version, and the information icon that opens About this measure (UXB-62). Rates read "89 % · 41 of 46 eligible visits"; durations read as median with range, the 90th percentile by nearest rank and the slowest, with unfinished items counted apart; there are no averages.
- **No judgement.** No target, baseline, threshold, score, index, weighting, probability, utilisation percentage, trend arrow or good-or-bad colour; the prior period sits beside the current one in `chart/neutral` and is never labelled better or worse; status chips carry words and a pattern, never colour alone.
- **Missing is never zero.** Not recorded, Not known, No rate, Could not load, Out of date, Definition pending, Withheld, Counted, Not in [period] and Not a complete quarter are separate words with their own tile kinds and chips; a dash only for a count that cannot be read.
- **Charts.** Bars and ranges with printed values, the fixed `chart/1` to `chart/6` order with a pattern per slot (solid, diagonal, dots, cross-hatch, horizontal, vertical; `chart/neutral` light diagonal for the prior period), unpriced values as a dashed outline, KPI-11 as small multiples per test class, REP-10 as three ageing tables never added, and "About these numbers" as the table view; never a gauge, dial, traffic light, target line or threshold band.
- **Register standard.** One line per cell, frozen first column, sideways scroll, view tiles, Filters and Columns, footer with count and as-at; column reorder, resize and inline edit specified on ST01; inline edit only on a Draft definition's own fields and a saved view's name and share list.
- **Shell.** More is the current rail item on every sheet; report pages open with the docked Reporting menu and its nested section views; registers open with the 12 px collapsed strip; 432 px right panels; centred dialogs 560 to 720 px over a 32 % navy scrim.
- **Records.** Definition versions and saved views use the A1 record header toolbar with the primary action by state (brief section 9.8); report pages use the Report / Header instead.
- **Second person.** Nobody adopts what they proposed; nobody approves their own export; exports leaving Powerplants need a second person; Finance sections stay inside Finance; viewing never grants export.

## 5. Assumptions and proposed departures

Each item is for Dean's decision.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | The file "PPO - Reporting module (proposal)" is recorded as the file for the Reporting domain; the design-to-build standard names none and is not changed here | Keep; record in the standard's next revision |
| A2 | Reporting sits under More with More as the current rail item (Shell Q22, R107); the navigation board's own `reporting` rail item (NAD-08) and RP-01 D1 are superseded on the rail question | Keep |
| A3 | Page titles use the accepted rail labels with the scope name as the sub-line; RP-06 is two rail items (Report definitions; Saved views & schedules) over one scope | Keep |
| A4 | Saved views & schedules gets the proposed route `/reports/views`; RP-05 keeps the register route `/reports/reconciliation` with the Shell label as its title | Record in the design register in its own change |
| A5 | Report pages are r20 Overview / dashboard with the Report / Header, as RP-02 and RP-03 decided; this departs from the RP-04 and RP-05 decisions' "Record detail". The A1 toolbar applies only to the records Reporting owns (definition version, saved view) | Keep |
| A6 | The Design pages' inspection panels and export side forms become 432 px right panels at x 960 without a scrim | Keep |
| A7 | A Reporting phone tab bar is proposed: My Work, Reports (the overview), Definitions (reviews only on the phone, RP-06 D10), More; the code has no Reporting bar | Keep as proposed; record for the register |
| A8 | One Tile family, "Report / Tile", with ten kinds (Rate, Count, Duration, Amount by status, Definition pending, Withheld, Counted, Not recorded, Could not load, Out of date) answers the 24 October audit's S6 for RP-01 to RP-06 and the module Insights extracts; the RP-05 "Trust report parts" duplicates are merged into it | Keep; move to PPO - Library with the shell |
| A9 | Proposed capabilities (†, none exist): `reporting.overview.read`, `reporting.export`, `reporting.service.read`, `reporting.definition.propose`, `reporting.definition.adopt`, `reporting.review.record`, `reporting.view.share`, and RP-03 Q7's `engineering.workload.read`, `engineering.review.read`, `engineering.commissioning.read`; section reads otherwise follow the source capabilities | Design only; a capability change follows the AD-01 cascade in its own change |
| A10 | Owners reconciled to Addendum A3.7: Jamie Park (RP-02, REP-01 to REP-03), Marcus Tan (REP-04, KPI-08), Jordan Blake (REP-05), Jess Wong (RP-03, REP-07; REP-08 and KPI-09 with Jordan Hale), Alex Morgan (REP-06, KPI-11), Jordan Kim (RP-04, KPI-01 to KPI-06, REP-12; KPI-07 with Taylor Quinn), Avery Lin (RP-05, REP-11, KPI-12, KPI-13), Robin Hale (REP-09, KPI-10; REP-10 with Avery Lin), Taylor Quinn (KPI-14); Dean proposes KPI-15 and Avery Lin adopts it. Earlier fixtures superseded: "Alex Lee" (REP-04), "Morgan Patel" (REP-05), "Morgan Lee · Projects" (RP-03), "Dean until a service manager is named" (RP-04), Dean signed in as Finance | Keep |
| A11 | The story moves from Tue 13 Oct 2026 (the accepted pages) to Thu 5 Nov 2026, 09:00 AEDT; the last complete quarter is Q3 2026 and the last complete month October 2026; the accepted RP-04 page's "86 % · 31 of 36" is September's KPI-01 and October reads 89 % · 41 of 46 | Keep; every module file shares the date |
| A12 | REP-02 v1 is In review (resubmitted by Jamie Park on Tue 3 Nov 11:40 after Avery Lin's return on Wed 28 Oct), counts shown and by value Definition pending; the RP-06 page's "REP-02 v1 Draft" and the Reviews & handovers Q9 return are history | Keep |
| A13 | Catalogue statuses are derived by the rules of section 9.1 of the brief: Available 7, Partial 4, Definition pending 1, and KPI-15 Not built under "Measures without a report"; RP-01's earlier statuses are superseded | Keep |
| A14 | Reviews fall due five working days after the period end on the Melbourne calendar. The story treats Tue 3 Nov 2026 (Melbourne Cup Day) as a working day, giving Fri 6 Nov for October; if the business calendar observes it, October's reviews fall due on Mon 9 Nov | Open question for Dean |
| A15 | Five saved views (Monthly pack, Glasshouse projects, Q3 by project, Ageing by owner, Van 1 October) and two exports (SYN-EXP-000051 Downloaded; SYN-EXP-000052 Awaiting approval). Reporting proposes no new reference family; `EXP` is the family Settings already proposes | Keep |
| A16 | The Shell's Recent row "Sales performance · Report · Q2" is a stand-in and is drawn as "Q3" | Align the Shell file when it is next touched |
| A17 | Both accepted restricted-section rules are kept and drawn side by side (counted on RP-03 and RP-04; nothing shown on RP-05's Finance sections) | Open question: align on one rule |
| A18 | The accepted collapsed strip is 12 px wide (component "Shell / Workspace menu · collapsed strip", Shell sheet K); the brief's "80 px · content 1232" is read as the component set's frame. Registers therefore have a 1300 px content region (x 92 to 1392), and Find in Reporting stays in the expanded menu because the strip has no search icon | Keep the accepted component; correct the brief |
| A19 | The Plugin API cannot set tabular figures; figure columns are right-aligned in fixed-width cells, and the build should apply `font-variant-numeric: tabular-nums` | Keep |
| A20 | Dark mode is not drawn, as on the accepted pages | Keep |
| A21 | Lucide icons stand in for Font Awesome Light; the shell components, the Sales kit and the Reporting menus are local copies under the same names until PPO - Library is published | Swap on publication |
| A22 | Sales story reconciled with Addendum A3: the deal without a next action is SYN-OPP-000329 Coastal Herbs rainwater stage 2 (A$54,800.00); the overdue next action is Mallee Fresh Produce (3 days); the deal moved three or more times is Hillcrest Tomatoes (+42 days); the re-entered deal is SYN-OPP-000247 Northern Leaf Nursery screens | Keep |

Assumptions A23 to A28, from Dean's direction of 10 November 2026, are in section 9.

### 5.1 Page-level assumptions (from each page's Flows and notes card)

| ID | Assumption or departure |
|---|---|
| RO-A1 | Each tile keeps one period rule (as at, October 2026 or Q3 2026); the period selector chooses within a family, never mixes periods on a tile. |
| RO-A2 | REP-04 tile reads "9 of 31 accepted" as counts, not a rate (no hit-rate measure defined; KPI-08 is cycle time). |
| RO-A3 | Catalogue groups by report page; KPI rows nested under the report they are reviewed with (KPI-08→REP-04; KPI-09, KPI-11→REP-08; KPI-01–07→REP-12 as the Service set; KPI-10→REP-09; KPI-12–14→REP-11); KPI-15 in "Measures without a report". |
| RO-A4 | REP-02 reads Partial (section 9.1) although its report definition v1 is In review; the counts measure is published and reported under RP-02's accepted rule (question RO-Q1). |
| RO-A5 | Counted tiles show the section and item count, never names or values (as SP12); Finance tiles show nothing (RP-05 D10). |
| RO-A6 | Source age rules on X01 (PPO 15 min, MYOB 26 h, AD-05 follows its MYOB read) are proposed values. |
| RO-A7 | New synthetic occurrences SYN-MOC-000412, 000415, 000418, 000421 (MOC family per A3.4); 000418 and 000421 are booked with SYN-WO-000041/SYN-APT-000084 and SYN-WO-000039/SYN-APT-000085 — align with the Service file's SE07. |
| RO-A8 | A technician following a /reports link lands on My Work with a toast (NAD-08 landing rule). |
| RO-A9 | Demo company reads "No data · demo company" on every tile; one company at a time, never summed. |
| RO-A10 | The stale state's adoption time 09:18 is illustrative. |
| RO-A11 | Find in Reporting is a results flyout from the docked menu's Find; no content search box. |
| RO-A12 | "at risk" is avoided in labels (REP-06 short name "Engineering work"; REP-07 fact "2 successors depend on it"); only BP-01's own question "What engineering work is at risk?" keeps the words. |
| DB-A1 | Dashboards are a new RP-06 record type beside saved views (no new scope ID); proposed route /reports/dashboards. |
| DB-A2 | Reporting menus gain a Dashboards group (Dashboards with views My dashboards, Shared with me, All permitted) between Reports and Performance, and Report builder in Set-up; footer "All 9 Reporting pages"; only the Dashboards and Report builder pages draw the proposed menu. |
| DB-A3 | The dashboard canvas opens with the 12 px strip (grid 1252 px); DB03 shows the docked menu. |
| DB-A4 | New fixtures to align with module files: decided deals by month (Apr 2/3, May 2/4, Jun 2/3, Jul 3/4, Aug 2/3, Sep 3/4); quotations issued by month (Q2 8, 9, 9; Q3 11, 9, 11); REP-06 reviews by month (Q2 6, 7, 6; Q3 8, 7, 8); open deals by owner Dean Fiedler 12, Sasha Clarke 10, Kate Morgan 9, Tom Reid 7 (SP03 draws only 14 of the 38 rows: DF 4, SC 5, TR 3, KM 2 — consistent, not derived). |
| DB-A5 | Three dashboards, 21 widgets: Management dashboard (Dean, 10, private), Sales team (Jamie Park, 6), Finance trust (Avery Lin, 5). |
| DB-A6 | Two-series monthly charts keep series colours in both quarters with a quarter row; single-series monthly charts draw the prior quarter in chart/neutral. |
| DB-A7 | Parts keep their slot in both periods; period named in the row title. |
| DB-A8 | Stages are not a cohort: no "n of m" between steps. |
| DB-A9 | Share preview counts (Kate 4/5/1; Robin 1/8/1); Needs attention shows the reader's own items. |
| DB-A10 | Pie, target line, average line shown disabled with reasons in widget settings. |
| DB-A11 | Phone read only; dashboards under More on the proposed phone bar. |
| DB-A12 | "Start from a report" copies a report's sections as widgets with their period rule. |
| SP-A1 | Stage counts and ranges follow section 9.2 (9, 11, 10, 5, 3); the Sales file board shows 9, 8, 11, 6, 4 with days up to 23 — the Sales extract (D04/IN02) to align. |
| SP-A2 | The re-entered SYN-OPP-000247 is one of the 38 open deals and of the 11 in Scoping, left out of the Scoping median and range (10 counted). |
| SP-A3 | Deal owners are the four deal owners of A3.7 with the A3.9 relationship owners; the Sales file initials "PN" read Kate Morgan (Priya Nair stays the estimator). |
| SP-A4 | Deal, quotation and decided-deal names beyond those fixed by the Sales file and A3 are synthetic fillers matched to the counts; two stage entries fall on a Sunday. |
| SP-A5 | Section details drawn full length (a section with its table exceeds the 852 px viewport), with a compact sticky header and the chart table open. |
| SP-A6 | REP-02 Q3 counts show while v1 is In review (RP-02, A3.7); adopting the report would not adopt by value. |
| SP-A7 | REP-04 Q2 issue-to-response is not in the data (no prior bar); Q2 withdrawn reads "—". |
| SP-A8 | Download with manifest shows the state after Dean approves (after the story time), labelled; hashes are placeholders. |
| SP-A9 | The 25,000-row example (REP-04 quotation lines, 31,480 rows, 2 parts) is synthetic, outside section 9. |
| SP-A10 | Kate's "Ageing by owner" opens with REP-01 v2 figures and says it was saved on v1; Move to v2 offered, nothing moved. |
| SP-A11 | On the phone the whole tile is one tap area; drill links are 48 px. |
| SP-A12 | Mallee Fresh Produce is REP-01's one overdue next action (9.2); A3.8 also lists Dean's task on SYN-OPP-000318 due Tue 3 Nov — not drawn; for alignment. |
| DP-A1 | REP-06 question worded on sheets as "What engineering work is overdue, waiting or blocked?" so no sheet carries "at risk"; BP-01's wording stays in the record. |
| DP-A2 | KPI-09 is its own section (five sections as accepted RP-03), under the docked view "Changes & closeout" with REP-08. |
| DP-A3 | Synthetic fixtures added here: two technical reviews (Block C dosing skid P&ID rev C, 4 wd; Glasshouse 4 screen drive schedule rev B, 2 wd), the overdue query (Propagation house stage 2 validation points, 8 wd), Block C variation titles, the permit wording, control-panel tests BR-1, PH-2, DC-1, CD-1. The two Blocked deliverables follow A3 (Woodhaven survey SYN-SRV-000038; Water treatment SYN-BAS-000015 rev A Draft). |
| DP-A4 | Rainwater: milestone overdue only; project slippage "not computed". |
| DP-A5 | Glasshouse 4 baseline r1 shown as superseded Fri 9 Oct, dates not restated. |
| DP-A6 | Unpriced variation = fixed 28 px dashed swatch (no implied magnitude). |
| DP-A7 | Q2 query response times "Not known" (only the count 14 is in the story). |
| DP-A8 | DP02 shows "About these numbers" open as the data table. |
| DP-A9 | DP09 Record review disabled with its reason (Q4 REP-08 review opens after the period; due Fri 8 Jan 2027). |
| DP-A10 | Phone: report pages sit under More, so More is the current tab. |
| DP-A11 | Tablet: rail navigation gap set to 0 so the current More item stays visible at 720 px. |
| SE-A1 | October visits/packs/reports/agreements (SYN-APT-000061–000080, SYN-PACK-000052–000064, SYN-RPT-000031–000040, SYN-AGR-000019–000029) are new synthetic refs consistent with A3.4; totals are 9.4's. |
| SE-A2 | KPI-01 permitted exceptions (2) sit outside the 46 eligible visits. |
| SE-A3 | KPI-02 not acknowledged by cutoff 12 of 71 (September 13 of 58), derived. |
| SE-A4 | KPI-07 not linked 3 = ambiguous asset 2 (one resolved Wed 4 Nov, SYN-DQF-000047) + report 1; month-end read kept; September 4 of 35 derived. |
| SE-A5 | REP-12 split over five agreements (23 = 19+2+2); SYN-AGR-000024 Mallee Fresh Produce expires Tue 15 Dec (within 60 days). |
| SE-A6 | Capacity by van 154 h each; booked 136/128/124; travel 25/22/24; September travel not shown (not in dataset). |
| SE-A7 | Casey Ward's miss SYN-APT-000070, exception SYN-APT-000069, KPI-02 miss SYN-APT-000080. |
| SE-A8 | Technician's docked menu shows only Service performance and Saved views & schedules. |
| SE-A9 | Section-detail sheets are clones of SE01's sections (one truth). |
| SE-A10 | Phone: report pages under More, so More is the current tab; charts, tables, Export desktop only. |
| SE-A11 | Out of date and review-overdue are labelled state examples. |
| SE-A12 | KPI-04 on an hours axis; 90th by nearest rank = 14th of 15. |
| SE-A13 | Tue 3 Nov (Melbourne Cup Day) treated as a working day, as the Fri 6 Nov due date requires. |
| TR-A1 | The eight open REP-09 exceptions are illustrative rows built from A3 records (SYN-DEM-000101, 000102, 000105, 000106; DP-25 pump with SYN-SMT-000011; Block C cable and gland kit). The cable and gland kit counts as a shortage and a missing allocation, so the kind counts (2+2+2+3 = 9) are not added to the 8 open exceptions. Align with the Supply file. |
| TR-A2 | KPI-10's eight eligible October packages (TR03) are illustrative; SYN-KIT-000033 drawn as met with a Fri 30 Oct cutoff, as the brief's TR03 states, although its visit is Thu 5 Nov. Align with the Supply file. |
| TR-A3 | SYN-RTN-000014, 000016, 000018 are new synthetic return references (000017, 000019, 000020 from A3). |
| TR-A4 | Only SYN-RCT-000084's age is fixed by A3.7; SYN-RTN-000020 (Unknown since Wed 4 Nov 15:42) and SYN-RCT-000083 (Refused at Thu 5 Nov 07:55) ages are illustrative. |
| TR-A5 | Section-detail sheets show the page scrolled to the section under a compact sticky header with its drill links. |
| TR-A6 | Met/Unmet (TR03) are words in neutral tones — no green/amber judgement. |
| TR-A7 | TR09 and TRX2 drawn signed in as Avery Lin (requester of SYN-EXP-000051). |
| TR-A8 | When the MYOB read fails, the AD-05 run that reads it is Partial; KPI-12 and the MYOB credit figures read Could not load. |
| TR-A9 | Out of date example assumes a daily run rule of 07:00 (AD-05 owns the schedule). |
| TR-A10 | Robin Hale's drill links never point to Finance pages Robin cannot open. |
| RD-A1 | KPI-15 v1 stays Draft (9.6, A3.7) although A3.8 says its adoption was requested from Avery Lin on Mon 2 Nov; drawn Draft with the request in History; the refused attempt (Thu 5 Nov 08:47, register row menu) is a synthetic fixture. |
| RD-A2 | A1 toolbar primary keeps the accepted green; dialog primaries keep the kit navy (as in Sales). |
| RD-A3 | Records use the Sales R01 layout (380 px details column on the left); at 1024 it collapses to a one-line Details strip. |
| RD-A4 | "Superseded versions 2" is a view of versions (REP-01 v1, KPI-11 v1); 27 = definitions. |
| RD-A5 | Measures nest under their report (↳); KPI-11 nests under REP-06 (same owner) while its review rides with REP-08. |
| RD-A6 | Export permissions drawn by role (policy v1, synthetic); Taylor Quinn's REP-12 change for Service coordinators = 4.2's "Export REP-12 only (proposed)". |
| RD-A7 | September REP-11 correction note (Wed 7 Oct 09:10) and the August entry are synthetic. |
| RD-A8 | / SW-A1 Review calendar treats Tue 3 Nov 2026 (Melbourne Cup Day) as a working day as the story does (October due Fri 6 Nov); if observed, October moves to Mon 9 Nov — open question for Dean. |
| RD-A9 | At 768 px the tablet rail is drawn scrolled (Favourites and its divider hidden) so the current item More shows. |
| RD-A10 | RDX2's REP-01 v3 is an unsaved example form (no count changes); RDX3 names Jordan Hale as REP-07 reviewer. |
| CB-A1 | New fixture: close months for 19 open deals not drawn on SP03 (SP03 draws 14 of 38 rows) or in the Sales Deals list. The 14 SP03 deals and Glasshouse Valley (28 Nov), Bairnsdale Berries (5 Dec), Hillcrest Tomatoes (20 Dec), Goulburn Orchards (21 Nov), Yarra Microgreens (27 Nov) keep their dates. Split Nov 6, Dec 12, Jan 9, Feb 8, Mar 2, Apr 1 = 38; by stage 9, 11, 10, 5, 3. By month and stage: Nov 0/0/1/3/2; Dec 0/4/5/2/1; Jan 2/4/3/0/0; Feb 5/2/1/0/0; Mar 1/1/0/0/0; Apr 1/0/0/0/0. Align with the Sales file. |
| CB-A2 | New fixture: Dean's "Close-month outlook", saved Wed 4 Nov 2026 16:05, Unadopted, not shared. |
| CB-A3 | Report builder under RP-06 (no new scope ID) as a Set-up rail item; proposed route /reports/builder. |
| CB-A4 | Rules used are recorded at save; a superseded rule opens on the current version and says so (CB-S4 illustrative). |
| CB-A5 | Carl suggests configurations from adopted measures only, computes no figures, labelled Simulated (A3.6, N-N10). |
| CB-A6 | Technicians explore and save own rows only (field.read.own); cannot propose or export. |
| CB-A7 | Phone opens saved explorations read-only as their table; building is desktop and tablet only. |
| CB-A8 | Shared table helper: header cells can hug their label (misaligning right-aligned headers); on this page they are fixed to the column width after `table()`. |
| SW-A2 | Monthly pack saved Mon 12 Oct 08:30, last opened today 08:55 (synthetic); period rule resolves per section. |
| SW-A3 | Kate Morgan's two deals on SW07: SYN-OPP-000318 (Sunline LED propagation lighting, Quoting since Mon 26 Oct, 10 days) and SYN-OPP-000247 (Northern Leaf screens, Scoping since re-entry Tue 8 Sep, 58 days, listed and left out of medians) — stage and dates synthetic; other owners 36. |
| SW-A4 | Full-length phones take their own rows; the 320 header subtitle shortened to "Definitions". |
| SW-A5 | Administrators (Dean, Taylor Quinn) see All views 5. |
| SW-A6 | Share, rename and delete are desktop-only; the phone lists and opens views. |
| ST-A1 | Tile family is one component set "Report / Tile" (10 kinds, 7 properties); tiles marked "example" on ST01a are drawn states, not the story. |
| ST-A2 | No darker navy/danger tokens: primary/danger hover and pressed use brand/navy-deep or an inner shadow; propose two pressed tokens for the library. |
| ST-A3 | Computed contrast: chart/neutral 2.14:1 and chart/neutral-strong 2.69:1 are also below 3:1 (not only slots 3, 5, 6); printed values + table rule covers them. Slots: 1 4.42, 2 3.20, 3 2.82, 4 5.02, 5 2.17, 6 2.69. Lowest text pair 5.14:1; lowest control edge/focus ring 3.32:1. |
| ST-A4 | Tones for states 6.2 does not name: Downloaded, Declined Neutral; source Complete Success; Complete period Neutral; view Private Neutral, Shared Tint, On superseded version Grey. |
| ST-A5 | Shortcuts other than Ctrl K and Esc are proposed; none acts on a source record. |
| ST-A6 | Danger button shown in the kit only; no Reporting sheet uses it. |
| ST-A7 | PS-ST1 sits on Interaction states because it compares three report pages. |
| ST-A8 | The tablet rail at 720 px clips the More label in its scroll viewport (shared `tsheet` geometry, every tablet sheet) — for the audit. |
| AD-A1 | Reporting settings at a proposed route `/reports/settings`, not one of the seven rail pages. |
| AD-A2 | Policies are versioned like definitions; v1 of each published Thu 1 Oct 2026 by Dean (synthetic). |
| AD-A3 | Two Taylor Quinn proposals drawn: Review cadence v2 (draft; named second person may record for an absent owner) and Export permissions v2 (REP-12 export for Ravi Kumar and Riley Tran — the grant prompt 4.2 marks proposed), In review with Dean since Wed 4 Nov 14:10. |
| AD-A4 | Melbourne Cup Day (Tue 3 Nov 2026) is counted as a working day by the story (October reviews due Fri 6 Nov); if observed, due Mon 9 Nov — Dean decides. |
| AD-A5 | Nudge first-fire dates from 6.9: KPI-06 v1 day 11 Fri 13 Nov; SYN-EXP-000052 day 3 Fri 6 Nov 17:10; Ageing by owner from Fri 6 Nov; overdue review repeats every 5 working days (proposed). |
| AD-A6 | Named second people (proposed pairings): Jordan Kim → Ravi Kumar; Jamie Park → Dean Fiedler; Marcus Tan → Priya Nair; Jordan Blake → Avery Lin; Alex Morgan → Casey Quinn; Jess Wong → Jordan Hale; Robin Hale → Avery Lin; Avery Lin → Priya Raman. |
| AD-A7 | Display rules and Numbering read only. |
| AD-A8 | Export matrix uses prompt 4.2's people as columns; scrolls sideways with Section frozen. |
| AD-A9 | "Leaving Powerplants" approver read as Dean, or Avery Lin with Dean; never the requester (prompt 4.2 ambiguous). |
| AD-A10 | Email digest is a proposed channel only. |

## 6. Verification

Every sheet was rendered and inspected by the builder that drew it, defects were fixed and one post-fix render was taken. The flagship sheets (RO01, TR01, TR05, RD02, RD06, RD07, SP01, DB02) were re-read against first impression, usability, hierarchy, consistency and accessibility. A scripted pass then ran over all 11 scope pages:

| Check | Result |
|---|---|
| Structure | 221 sheets and cards in the six template sections; every sheet labelled; nothing loose on any page; separators empty |
| Position | No overlap between sections, sheets, labels or cards; no child outside its sheet; no sheet outside its section |
| Typography | Roboto only; no register cell text taller than one line |
| Counts | 374 rates of the form "n % · a of b" recomputed from their counts, rounded half up: 0 mismatches; totals reconcile with section 9 of the brief and the fixtures in section 9 of this record |
| Dates | 2,753 dated weekdays checked against 2026, or 2027 where stated or for January to March: 0 mismatches |
| Words | "verified", "on track", "healthy", "at risk", "good", "poor", "target", "threshold", "score" and "index" appear only inside rules or "not offered" lists that forbid them; no zero stands for a missing value; no average |
| Authority | No action on any source record; proposers never adopt (RD07, AD-S1); requesters never approve their own export (SP); technicians never export (SE10); Finance figures stay inside Finance (TR09, TR10); no Verified mark |
| People | Persona sheets show the reader in the top bar; More is the current rail item on every sheet; gendered pronouns for people whose pronouns are not stated were replaced (17) |
| Palette | The six chart slots pass lightness, chroma, colour-vision separation (worst adjacent ΔE 9.2 deutan; tritan 5.8 relies on the pattern) and the normal-vision floor; slots 3, 5 and 6 and `chart/neutral` are below 3:1 on white, so every chart prints its values and has a table view (ST01b, ST02) |

Repository checks for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Limits: this is a visual proposal. No prototype links, motion, screen-reader run, 200 % zoom render or application comparison were done; the contrast proof is computed, not measured on a device.

## 7. Not drawn and open questions

Open and cited, never resolved here: D-017 (financial measures, tax and currency treatment, reconciliation; KPI-13 withheld); D-010 (pricing policy; REP-05 below-minimum pricing); REP-02 by value (RP-02 D7); KPI-06's review window (RP-04); KPI-14's definition (RP-05, AD-04 Q6); KPI-15's source instrumentation; the restricted-section alignment (A17); the review calendar's treatment of Melbourne Cup Day (A14); the RP-01 decision record (Dean's); REP-02's catalogue status (Partial, as section 9.1 has it, or Definition pending, as rule 5.6 reads); governed targets (A28); the story conflicts in section 10 (G2); the open questions of RP-02 (Q1 to Q7), RP-03 (Q1 to Q7), RP-04 (Q1 to Q8), RP-05 (Q1 to Q8) and RP-06 (Q1 to Q7) as they stand; dark mode; AT-31 is not claimed.

Not drawn: application pages, prototype links, motion, dark mode, any scheduler or delivery service (subscriptions appear only as "Scheduling not yet available"), the operational pages each section drills into, Measure definitions FN-06, Integrations AD-04, Mappings AD-05, Audit history AD-07, My Work and Conversations (Reporting's contributions are shown on its own sheets with the same words).

## 8. Boundary and next steps

This record authorises nothing in the application. Next steps, each in its own change: Dean reviews the proposal and, on acceptance, saves a named Figma version (any later design change needs a new named version); the design register and the page guidance for `scope:RP-01` to `scope:RP-06` are updated with the sheet references, the proposed `/reports/views` route and the proposed phone bar (the generic page notes and RP-01's references to renders 23 to 25 of the navigation board are stale); the module Insights extracts (Sales IN02, Estimating I01 to I04, Projects IS01 to IS04, Engineering IS01 to IS03, Service IS01 to IS03, Supply IS01 to IS03, Finance IS01 to IS03) are aligned where they differ from this file's figures; the Shell file's Recent row is aligned (A16); the Tile family, the chart vocabulary v2 and the phone chrome move into PPO - Library. Code delivery (none), design acceptance (Dean's), production readiness (not inferred) and integration with any source system or scheduler (none exists or is authorised) remain separate statements.

## 9. Direction of 10 November 2026 — professional charts, dashboards and custom reports

While the pages were being drawn, Dean asked that "our reports include very professional visual diagrams, charts, etc." and suggested that "we could also allow users to create customised reports and/or dashboard", with screenshots of Pipedrive Insights as the reference (a dashboard of report widgets, column and stacked charts, ranked bars, a headline number, goal lines, a pie, "Generate report (AI)", Share and Public link).

**Adopted.** Column charts by month with axis, gridlines and printed values; segmented bars (one whole split into at most six parts, 2 px gaps, counts printed); ranked horizontal bars; stage-count steps; headline numbers with their counts; a hover tooltip on every chart; a Visual summary band at the top of every report page (RO01, SP01, DP01, SE01, TR01); the chart vocabulary specified on ST02 and in AD07. **Dashboards** (a new page, DB00 to DB07 and states): a person composes a dashboard from governed widgets (adopted report sections and measures), drags and resizes them on a 12-column grid, sets one filter row and shares it read-only with named people. **Report builder** (a new page, CB01 to CB07 and states): a personal exploration of any source the reader may read, with count, sum where FN-06 publishes the amount's meaning (labelled "unweighted · not a forecast"), median and range, 90th percentile and slowest; it is "Unadopted · personal exploration" and visible only to its author; sharing it beyond the author or adding it to the catalogue means proposing it as a definition, which a second person adopts. **Draft from a question** (CB05): the assistant suggests a builder configuration from adopted measures only, labelled as a suggestion, and saves nothing.

**Declined, because accepted rules forbid them.** Goal or target lines (no target is approved, BP-01 22.3, CR-04 D3; the builder shows "No target adopted"); averages (RP-04 D9 and Q6; medians and ranges instead); a forecast stacked with won value (BP-01 22.1 keeps forecast apart from posted results); pie and donut charts (segmented bars instead); percent-only labels (counts always printed); public links (RP-06 Q3); dual axes.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A23 | Dashboards and custom reports are RP-06 record types beside saved views and definitions, not a new scope; proposed routes `/reports/dashboards` and `/reports/builder` | Keep; record for the register |
| A24 | The Reporting menus gain a Dashboards group and a Report builder row (nine pages); only the two new pages show the proposed menu until Dean accepts it (departure from the accepted Shell menus) | Accept with the pages, then update every sheet (R3) |
| A25 | A dashboard binds widgets, period rules and filters, never figures; a widget the viewer may not read is Counted or Withheld by its page's rule; a widget on a superseded version keeps working and says so | Keep |
| A26 | A custom report proposed for the catalogue keeps its title and owner and receives the next REP code (REP-13) only when adopted; extending BP-01's catalogue needs its own record | Keep |
| A27 | New synthetic fixtures for the charts: decided deals by month (Q2 6 of 16, Q3 8 of 19), quotations issued by month (26, 31), REP-06 reviews completed by month (19, 23), open deals by owner (Dean Fiedler 12, Sasha Clarke 10, Kate Morgan 9, Tom Reid 7) and by expected close month | Align with the Sales, Estimating and Engineering files |
| A28 | Governed targets are proposed, not drawn: a target would be a definition type with an owner, second-person adoption and an effective date, and only then a labelled reference line (N17) | Dean's decision |

## 10. Audit — 10 November 2026

The audit card on the Read me page carries the same lists.

**Corrections made in the file (C).** C1 REP-02's effective date read "Sun 1 Nov · start of Q4", but Q4 began on Thu 1 Oct; corrected. C2 REP-06 is worded on the sheets as "What engineering work is overdue, waiting or blocked?" and short-named "Engineering work" (46 texts); BP-01's catalogue question is unchanged and cited here. C3 The Sales rail label weight was reset on 153 rails, and the tablet rail gap was closed so the current More item shows (5 tablets). C4 The phone tab bar's current marker follows the bold label, and More is current on report pages. C5 Pattern fills now cover tall bars (578 vectors), and right-aligned table headers were realigned (30). C6 Met and not-met chips use neutral tones, and "verified" in a footnote now reads "confirmed".

**Refinements proposed (R).** R1 Duration-strip labels can collide when the median and 90th percentile are close (fixed on ST02; check SE04 and SE05). R2 Short names per code, so tile eyebrows stay on one line. R3 Once the nine-page menu is accepted, show it on every sheet. R4 Fix the view-tile and table-header helpers once, in PPO - Library. R5 A Reporting phone header component, in place of the Sales chrome with overrides. R6 A phone tab-bar component set with Current = My Work, Reports, Definitions or More.

**Gaps (G).** G1 Persona sheets are not drawn for Marcus Tan (REP-04), Jordan Blake (REP-05), Jordan Hale (REP-08), Ravi Kumar and Riley Tran (REP-12 export only) or Priya Raman (Finance inside Finance). G2 Story conflicts for the module files:
- KPI-11 counts CP-4's T06 SM-3 failure in Q3 (brief 9.3), while Addendum A3.2 dates the CP-4 site tests from Thu 15 Oct, which is Q4.
- The Sales board shows stage counts 9, 8, 11, 6, 4 against 9.2's 9, 11, 10, 5, 3, and the IN02 extract differs from both.
- A3.8 lists a second overdue next action (SYN-OPP-000318) that REP-01 does not count.
- REP-09's exception kinds add to 9 against 8 open.
- A3.8 says KPI-15's adoption was requested from Avery Lin, but KPI-15 is drawn as Draft.

G3 New fixtures to align, listed on each page's notes card: A27, the SYN-MOC occurrences, SYN-RTN-000014, 000016 and 000018, the close months of the 38 open deals, and SE01's whole of 41 reports. G4 Decisions open (section 7). G5 The Visual summary bands are drawn on desktop only.

**New features (N).** N-N1 to N-N4 are integrated: About this measure, the source completeness watch, review pre-fill and the definition impact preview. N-N5 to N-N12 are drawn or proposed as listed on the audit card. N13 to N16 come from Dean's direction: Dashboards, the Report builder, the chart vocabulary v2 and Draft from a question. Two more are proposed: N17, governed targets (A28), and N18, delivering a dashboard or saved view on the review cadence once a scheduler is designed and approved.

**Polish (P).** P1 Notes cards are labelled "NOTES ·" by design. P2 Every monthly chart gets a quarter label row. P3 Dark mode is not drawn.

**Recommended order.**
1. Dean decides the assumptions and open questions: the restricted-section rule, Melbourne Cup Day, REP-02's catalogue status, the nine-page menu, Dashboards and the Report builder as RP-06 record types, and targets.
2. The module stories and extracts are aligned (G2, G3).
3. The Tile family, the chart vocabulary and the phone chrome move into PPO - Library (R4 to R6).
4. The missing persona sheets are drawn (G1), with R1 to R3.
5. Dean saves a named version; any later design change needs a new one.
