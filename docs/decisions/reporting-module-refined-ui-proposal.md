---
document_id: PPO-REPORTING-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal, 10 November 2026, awaiting Dean's acceptance; drawn in a new private Figma file; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, scheduler, integration or deployment; every record and figure shown is synthetic
versioning: git
---

# Reporting module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposal awaiting Dean's acceptance.

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
| RP-06 Report definitions; Saved views & schedules | Scope identity | `scope:RP-06`, `route:/reports/definitions` and the proposed `/reports/views` (A4); two rail items over one scope |
| | Page types (r20) | Register / worklist (definitions, views, scheduled reviews); Record detail with the A1 toolbar (definition version, saved view); Review / comparison (version comparison); Form / guided workflow (Record a review); dialogs (Adopt, Return, Submit, Save view, Share, Delete) |
| | Incoming handover | Proposals from report owners; FN-06 meaning status; the period calendar |
| | Outgoing handover | Adopted versions effective from a stated date; recorded reviews (never edited); saved views shared with named people; export permissions; second-person approvals recorded in AD-07; My Work items (section 6.9 of the brief) |
| | Exceptions and recovery | The proposer's Adopt disabled and the attempt refused and recorded (S8); nothing defined; superseded version with a view still working; review overdue (nudge only, no automation); read only; "Scheduling not yet available" |
| | Ownership | RP-06 owns versions, reviews, saved views and export permissions; AD-07 owns the audit trail; FN-06 the meaning |

## 3. Sheet inventory

_Filled when the build completes._

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

Page-level assumptions drawn on each page's Flows and notes card are listed in section 3 beside the sheets.

## 6. Verification

_Filled when the build completes._

## 7. Not drawn and open questions

Open and cited, never resolved here: D-017 (financial measures, tax and currency treatment, reconciliation; KPI-13 withheld); D-010 (pricing policy; REP-05 below-minimum pricing); REP-02 by value (RP-02 D7); KPI-06's review window (RP-04); KPI-14's definition (RP-05, AD-04 Q6); KPI-15's source instrumentation; the restricted-section alignment (A17); the review calendar's treatment of Melbourne Cup Day (A14); the RP-01 decision record (Dean's); the open questions of RP-02 (Q1 to Q7), RP-03 (Q1 to Q7), RP-04 (Q1 to Q8), RP-05 (Q1 to Q8) and RP-06 (Q1 to Q7) as they stand; dark mode; AT-31 is not claimed.

Not drawn: application pages, prototype links, motion, dark mode, any scheduler or delivery service (subscriptions appear only as "Scheduling not yet available"), the operational pages each section drills into, Measure definitions FN-06, Integrations AD-04, Mappings AD-05, Audit history AD-07, My Work and Conversations (Reporting's contributions are shown on its own sheets with the same words).

## 8. Boundary and next steps

This record authorises nothing in the application. Next steps, each in its own change: Dean reviews and, if he accepts, saves a named Figma version (any later design change needs a new named version); the design register and the page guidance for `scope:RP-01` to `scope:RP-06` are updated with the sheet references, the proposed `/reports/views` route and the proposed phone bar (the generic page notes and RP-01's references to renders 23 to 25 of the navigation board are stale); the module Insights extracts (Sales IN02, Estimating I01 to I04, Projects IS01 to IS04, Engineering IS01 to IS03, Service IS01 to IS03, Supply IS01 to IS03, Finance IS01 to IS03) are aligned where they differ from this file's figures; the Shell file's Recent row is aligned (A16). Code delivery (none), design acceptance (Dean's), production readiness (not inferred) and integration with any source system or scheduler (none exists or is authorised) remain separate statements.
