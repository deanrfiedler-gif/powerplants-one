---
document_id: PPO-SUPPLY-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal, 10 November 2026; design acceptance is Dean's and has not been given; no named version is saved yet; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, MYOB endpoint or deployment; every record shown is synthetic
source_commit: c72a55b86e24dd3e524624bd9608493ff99e32f7
versioning: git
---

# Supply module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposal. Sections 1 to 8 are the proposal record; section 9 holds the audit run after the build and section 10 the named version. Later sections will record Dean's acceptance and any further batches exactly as the [Sales record](sales-module-refined-ui-proposal.md) does.

On 9 November 2026 Dean asked for the refined UI pages of the Powerplants One Supply module (the "Supply chain" workspace) to be built in a new, empty private Figma file, "PPO - Supply module (proposal)", inside the accepted shell and to at least the standard of the Sales module file. His brief set the scope (every Supply page, the three Workshop pages, Workshop settings, the Supply extract of Insights, interaction states and administration), the decisions already taken (D1 to D13), one synthetic dataset as at Thursday 5 November 2026, 09:00 AEDT, signed in as supply coordinator Robin Hale, and a standing instruction: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The eight questions in the brief were therefore answered by their stated defaults; each is recorded in section 5 as an assumption Dean can reverse.

This record is a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions that remain. It changes no code, test, migration, seed, permission or route, and it authorises no business transaction, MYOB integration or customer communication. Four statements stay separate throughout: code delivery (none), design acceptance (Dean's, not given), production readiness (not inferred) and MYOB integration (not configured, not authorised).

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell", named version "Shell refined concept — accepted" (8 November 2026), and its page "Record header toolbar (proposal 9 November 2026)" | Chrome and geometry: 48 px top bar, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, 280 px docked workspace menu, the collapsed strip, the Supply chain flyout and docked menus, the 1024 top bar. The shared record header toolbar and its rules R1 to R10 (Addendum A1) were read from the proposal page. Components were copied into the new file under the same names |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | Conventions mirrored: page template, sheet labels, the page kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile), phone header and tab bar pattern |
| Private Figma file "PPO - Design", the earlier Supply pages | Rules, stories and vocabulary for Receiving, Inventory, Workshop builds, Workshop settings, Material change impact and Supply & Finance trust (accepted), and for Material readiness, Purchasing, Inbound shipments, Dispatch and delivery, Returns and claims, Service stock custody, Kitting and Bench testing (proposals) |
| [BP-08 Supply chain](../blueprints/BP-08-supply-chain.md) and [BP-01](../blueprints/BP-01-master-blueprint.md) section 14.4 and sections 22.1 to 22.3 | Scopes SC-01 to SC-10 with parents SCM-01 to SCM-08 and SVC-09; CX-02; REP-09 to REP-11, KPI-10 and KPI-12. No parent requirement ID is added or renamed; all 78 remain |
| [ADR-0049](ADR-0049-native-supply-chain.md), [PPO workspace, MYOB book of record](ppo-workspace-myob-book-of-record.md) (PPO-ERP-OPERATING-MODEL-DEC, EI-1 to EI-10) | Stock observations are dated evidence, never a PPO balance; ERP commands are Not configured; an Unknown outcome blocks a repeat; finished events are sent, corrections are reversals |
| [Supply readiness and promise rules](supply-readiness-promise-rules.md) (PPO-SUP-DEC-01), [readiness contract](../contracts/supply-chain-readiness.md) (PPO-013-READINESS), [unallocated demand proposal](unallocated-demand-readiness-proposal.md) | Readiness states and the promise rule; both unallocated-demand words kept |
| [Receiving design](receiving-figma-design.md), [Inventory design](inventory-figma-design.md), [Workshop builds design](workshop-builds-figma-design.md), [Workshop settings design](workshop-settings-figma-design.md), [Material changes design](material-changes-figma-design.md), [Supply & Finance trust design](supply-finance-trust-figma-design.md), [Workshop settings scope](workshop-settings-preferences-scope.md) | Accepted decisions carried into the redrawn pages |
| [Readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC) and Addendum A2 to the brief | Reference form `SYN-<TYPE>-<NUMBER>`, six digits minimum |
| [PPO-STD-001](../standards/naming-conventions.md), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [HTML module conformance](../standards/html-module-conformance.md), [named-version build handoff](figma-named-version-build-handoff.md) | Naming, page order, the nine-field declaration, r20 page types, the flagship "Receive and find stock" drawn first, and the rule that a named version pins a build basis |
| `src/shell/navigation.ts`, `src/supply/navigation.ts`, `src/supply/model.ts`, `src/platform/permissions.ts` | Workspace label "Supply chain", the rail and side-menu destinations, state names, and the six `supply.*` capabilities; read only |

The file's link and key are not recorded in this public repository ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

### 2.1 The module

| Field | Declaration |
|---|---|
| Scope identity | The Supply chain workspace: `scope:SC-01` to `scope:SC-10`, `scope:CX-02` (Workshop builds, Kitting and controllers, Bench testing and returns, Workshop settings) and the Supply extract of `scope:RP-05`. Routes are listed per scope in 2.2. No scope ID or parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist; Record detail; Overview / dashboard (Supply Pulse, Supply & Finance trust, the two settings overviews); Form / guided workflow as right-side panels and centred dialogs; Review / comparison (propose, review and publish; before-and-after on impacts); states; tablet and phone variants. Per scope in 2.2 |
| Reused components | Copies of the accepted shell under the same names: Shell / Top bar, Shell / Rail · collapsed, Shell / Right rail · collapsed, Shell / Workspace menu · docked (eleven Supply pages), Shell / Workspace menu · collapsed strip, Shell / Workspace flyout · Supply chain, the 1024 top bar, and Shell / Record header · toolbar (proposal of 9 November 2026) with its phone variant; 101 shell icon components and 20 added Supply icons (Lucide stand-ins for Font Awesome Light); the "PPO colour" variable collection (66 variables, same names as the Shell and Sales files); the Sales page kit under its Sales names. New in this file and proposed: a docked-menu variant with the Supply Pulse and Workshop entries; a Supply phone tab bar; drawn parts for the checks bar, signals strip, four-track strip, quantity and send-state chips, serial field, photo and signature tiles, MYOB events card and "why this" trace |
| Source authority | Dean's brief and its decisions D1 to D13; the accepted designs for Receiving, Inventory, Workshop builds, Workshop settings, Material change impact and Supply & Finance trust; the earlier proposals for the other scopes as design direction, not accepted; this file's compositions as proposals. The fixture is fictional and synthetic: as at Thursday 5 November 2026, 09:00 AEDT, signed in as Robin Hale unless the sheet names another person |
| Incoming handover | Per scope in 2.2. Arriving on a page creates no business record |
| Outgoing handover | Per scope in 2.2. Nothing drawn places an order, posts or moves stock, moves a booking or edits a MYOB document. Every finished event sent to MYOB shows one of five states: Prepared, Sent, Posted, Unknown, Refused |
| Exceptions and recovery | Drawn: loading permitted evidence, true-empty, filtered-empty, could not load, denied or read-only, stale (a newer save by someone else), partial source (MYOB, Purchasing or a credit-note read unavailable), outcome unknown with the repeat blocked, bulk action partly failed, permission changed while a form was open, a form refusing with the failed inequality, an expired instrument calibration, a review that is refused or out of date. A count that cannot be read shows a dash and a quantity that is not known reads Unknown; neither is ever zero |
| Departures | Section 5 |
| Verification | Section 6 |

### 2.2 Per scope

MYOB Acumatica is the book of record for every scope below. ERP commands are Not configured, and every send is evidence with a state.

| Scope and route | Page types | Owns | Incoming handover | Outgoing handover |
|---|---|---|---|---|
| SC-01 Material demand, `/supply/material-readiness`; proposed Supply Pulse | Register; Record detail; Overview | Readiness assessment and owned blockers. It approves no demand | Forecast demand per Product line from Estimating (ES-07); demand approval, forecast changes and the frozen brief from Projects (PJ-01, PJ-03, PJ-06); released materials from Engineering (EN-06); work-order demand from Service | Readiness and impact reviews to the project manager; purchase requests to Purchasing; MaterialAction follow-ups and nudges to My Work |
| SC-02 Purchasing, `/supply/purchasing` | Register; Record detail; Form | Purchase requests, their authority evidence and supplier commitments. The order itself is raised in MYOB | Demand to buy from SC-01; preferred supplier and price from Cost sources (ES-03); the MYOB order reference | Approval requests to Reviews (SH-06); promises to SC-01; order revisions as finished events |
| SC-03 Inbound shipments, `/supply/shipments` | Register; Record detail; Form | Line-grained shipments, split allocation and ETA versions | Orders from SC-02; supplier documents from SharePoint (DK-01) | Arrivals to SC-04; shortfalls to SC-09; a delay to a customer date to the project owner and to SC-06 for a delay notice |
| SC-04 Receiving, `/supply/receipts` | Register; Record detail; Form | Receipt and quarantine evidence: arrival, count, inspection, disposition | Shipments from SC-03 | Usable stock (released) observed in SC-05; rejected goods to SC-08; shortages to SC-09; count, release, rejection and correction as finished events |
| SC-05 Inventory, `/supply/stock` | Register; Record detail | Nothing: it shows dated observations and creates nothing, apart from the native observation form kept on its own route | Stock observations read from MYOB with time and completeness | Links to the records that hold or reserve stock |
| CX-02 Workshop builds, Kitting and controllers, Bench testing and returns, `/workshop` and below | Register; Record detail; Form | Build, kit, controller preparation and bench evidence | Released materials and intended configuration from Engineering (EN-06, EN-08); calibrated instruments from Equipment (EQ-09); returned units from the field | New serials at release and controller backups to Equipment; released units to SC-06; job kits to SC-10; bench outcomes to SC-08; booking out and release as finished events |
| SC-06 and SC-07 Dispatch and delivery, `/supply/dispatch`, `/supply/deliveries` | Register; Record detail; Form | Pick, stage, shipment and proof-of-delivery evidence | Usable allocations; released units from the Workshop | Prepared M1 and M2 notices to Customer messages (EC-04 owns sending); delivery exceptions to SC-08; custody transfers to SC-10 |
| SC-08 Returns and claims, `/supply/returns` | Register; Record detail; Form | Returns, supplier claims and expected credits. Finance owns money | Rejected goods from SC-04; faulty parts from SC-10 and the field; bench outcomes; credit notes observed in MYOB | Expected credits and claim ageing read by Finance (FN-05) and RP-05; credit matching by Finance |
| SC-09 Material change impact, `/supply/changes` | Register; Record detail; Review | Nothing but the review: it shows and routes and edits no downstream record | Engineering changes (EN-07), shortfalls, receipt corrections, forecast changes | Owner actions and reminders to My Work; each module records its own outcome |
| SC-10 Service stock custody, `/supply/service-stock` | Register; Record detail; Form | Issued custody and its outcomes | Job kits from Kitting; technician transfers from Dispatch; field parts capture from Service (FI-01) | Parts-ready signal per visit to the Job pack (SV-05) and My jobs; faulty parts to SC-08; write-off approval to Reviews |
| RP-05 Insights, Supply extract | Overview; Register (drill-through) | Nothing: Reporting owns the definitions | Facts already recorded in Supply and credit notes observed in MYOB | Every count opens the rows on the page that owns them |
| Administration, Supply and Workshop settings | Overview; Settings; Review | The rules and lists Supply reads its evidence by | Proposals from an administrator or the workshop lead | Published versions to every Supply page from that moment; versions to new builds; nothing to MYOB |

Engineering owns release and change, Service owns bookings and field capture, Projects owns delivery and the customer conversation, Equipment owns the serial and instrument register, Documents owns storage, EC-04 owns sending, and AD-04 and AD-05 own the integration record and mappings.

## 3. Sheet inventory

233 sheets and 15 notes cards on 15 scope pages. Node IDs are those of the sheet frame in the new file. Titles longer than the audit capture are shortened with an ellipsis; the file's "Sheet index and notes" card carries every label in full. A sheet label reads `CODE · Page — state (scope ID) [source]`.

| Item | Node |
|---|---|
| Read me: header card, "Sheet index and notes", audit card, page template card | `76:517`, `76:546`, `76:634`, `76:686` |
| Pages: Read me `0:1`, — Accepted — `11:2`, — Proposals — `11:3`, Shell and kit `11:19`, Scratch `11:20` | separators and Scratch are empty |
| Shell and kit: shell components, shell icons, Supply icons, workspace menus, tablet and phone chrome, record header toolbar, page kit | on page `11:19` |

### Material demand and Pulse · SC-01

Page `11:4` · `scope:SC-01`, `/supply/material-readiness` · 29 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| MD01 | Material demand — All demand grouped by need date, readiness with its rule | Register | 1440 × 900 | `33:523` |
| MD12 | Material demand — register with the accepted docked Supply menu: three groups, favourites, eleven pages | Register | 1440 × 900 | `33:1318` |
| MD02 | Demand SYN-DEM-000094 Block C SV-20 — Material lines: approved, allocated, usable, incoming, short; why At risk | Record detail | 1440 × 900 | `33:2187` |
| MD03 | Demand SYN-DEM-000094 — Supply cover: the orders, shipments, receipts and stock behind each line; promise SupplierConfirmed Fri 13 Nov | Record detail | 1440 × 900 | `33:2626` |
| MD04 | Demand SYN-DEM-000110 Coastal Herbs tanks — Blockers & actions: no usable allocation reads Blocked here, Evidence needed in the Job pack | Record detail | 1440 × 900 | `33:3080` |
| MD08 | Demand SYN-DEM-000094 — Changes: impact reviews touching this demand with the owner’s Accepted, Returned, Held decisions | Record detail | 1440 × 900 | `33:3497` |
| MD09 | Demand SYN-DEM-000094 — History, grouped by day | Record detail | 1440 × 900 | `34:2030` |
| MD10 | Work-order demand SYN-DEM-000108 for SYN-WO-000041 Riverbend EC sensor replacement — lines against a visit, parts-ready signal | Record detail | 1440 × 900 | `34:2400` |
| MD11 | Supply Pulse — day start: Focus for today ranked by rule | Overview | 1440 × 900 | `35:4714` |
| MD05 | Escalate to My Work — a demand owner escalates a blocker; a MaterialAction follow-up is created | Form, dialog or panel | 1440 × 900 | `34:3246` |
| MD06 | Record supplier promise — basis Estimated or SupplierConfirmed, date, covering quantity, evidence, and what the rule will say | Form, dialog or panel | 1440 × 900 | `34:3701` |
| MD07 | Request purchase — selected lines with the preferred supplier and price from Cost sources; hands to Purchasing | Form, dialog or panel | 1440 × 900 | `34:4176` |
| X03 | Filters — right-hand panel over Material demand | Form, dialog or panel | 1440 × 900 | `34:4968` |
| X04 | Columns — right-hand panel over Material demand: frozen and visible columns, order, width and density, saved with the view | Form, dialog or panel | 1440 × 900 | `34:5769` |
| X05 | Export register — centred dialog over Material demand: scope, columns, format; values withheld stay withheld | Form, dialog or panel | 1440 × 900 | `34:6683` |
| X06 | Inline edit — change reason for a governed field (need date) in a small dialog | Form, dialog or panel | 1440 × 900 | `34:7455` |
| MS01 | Demand SYN-DEM-000098 Contactor — released materials changed after allocation: re-assess, impact review linked | State | 1440 × 900 | `35:5188` |
| MS02 | Demand SYN-DEM-000110 — promise date passed: the nudge, where it came from and where it clears | State | 1440 × 900 | `35:5549` |
| MS03 | Demand SYN-DEM-000105 Hillcrest dosing retrofit — all lines ready: no primary, “Ready for the stated material scope” | State | 1440 × 900 | `35:5923` |
| MS04 | Demand opened by an engineer — read only: facts visible, no commands, the reason stated | State | 1440 × 900 | `35:6297` |
| PS01 | Material demand — loading permitted evidence: skeleton rows, counts read a dash until they are known | State | 1440 × 900 | `35:6631` |
| PS02 | Material demand — filtered, nothing matches: the filters are restated and can be cleared | State | 1440 × 900 | `35:6981` |
| PS04 | Material demand — could not load: the read failed, counts show a dash, nothing reads zero | State | 1440 × 900 | `35:7247` |
| PS05 | Record supplier promise — stale: a newer save by someone else; reload keeps your unsaved note | State | 1440 × 900 | `35:7509` |
| TB05 | Material demand — register at 1024 × 768 | Tablet | 1024 × 768 | `35:7990` |
| TB06 | Demand SYN-DEM-000094 — Material lines at 1024 × 768 | Tablet | 1024 × 768 | `35:8478` |
| PH04 | Supply Pulse on the phone — focus for today in rule order | Phone | 390 × 844 | `35:8838` |
| PH05 | Material demand on the phone — list grouped by need date, labelled rows | Phone | 390 × 844 | `35:8973` |
| PH06 | Material demand at 320 × 844 — narrowest phone, same rows, nothing truncated that matters | Phone | 320 × 844 | `35:9102` |
| — | Notes card: Material demand and Supply Pulse · SC-01 | Notes | 1440 wide | `35:9231` |

### Purchasing · SC-02

Page `11:5` · `scope:SC-02`, `/supply/purchasing` · 21 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| PU01 | Purchasing — Open orders, grouped by state; value withheld from non-Finance readers | Register | 1440 × 900 | `36:523` |
| PU12 | Purchasing — register with the accepted collapsed strip, as a Finance reader: the Value column appears | Register | 1440 × 900 | `36:1176` |
| PU04 | Purchase order SYN-PO-000220 Cable and gland kit — Lines, MYOB reference and send state Posted | Record detail | 1440 × 900 | `36:1848` |
| PU06 | Purchase order SYN-PO-000220 — Demand served: which demands each line serves | Record detail | 1440 × 900 | `36:2264` |
| PU05 | Purchase order SYN-PO-000228 Replacement DP-25 — Supplier commitments: not acknowledged for 6 working days, nudge shown | Record detail | 1440 × 900 | `36:2675` |
| PU08 | Purchase order SYN-PO-000215 SM-40 motor — Receipts: fully received | Record detail | 1440 × 900 | `36:3063` |
| PU09 | Purchase order SYN-PO-000236 — History with a revision recorded as a finished event | Record detail | 1440 × 900 | `36:3436` |
| PU02 | Purchasing — Demand to buy, three lines selected, Raise purchase request SYN-REQ-000041 with Cost sources prices and a reason for the one that differs | Form, dialog or panel | 1440 × 900 | `37:2157` |
| PU03 | Purchasing — Requests to approve, signed in as Quinn Avery: Approve SYN-REQ-000040 with the authority evidence | Form, dialog or panel | 1440 × 900 | `37:2736` |
| PU11 | MYOB send states for Purchasing — Prepared, Sent, Posted, Unknown, Refused with links; “Not configured” stated | Form, dialog or panel | 1440 × 900 | `37:3195` |
| X07 | Record purchase reference — the order was raised in MYOB; record its reference so the request becomes an order | Form, dialog or panel | 1440 × 900 | `37:3860` |
| X08 | Record acknowledgement — the supplier confirmed the order; acknowledged is not promised | Form, dialog or panel | 1440 × 900 | `37:4318` |
| X09 | Return request — the approver returns a request to its raiser with a reason | Form, dialog or panel | 1440 × 900 | `37:4719` |
| PU07 | Purchase order SYN-PO-000228 — promise date moved: the demand drops to Blocked and its owner is notified | State | 1440 × 900 | `37:5135` |
| PU10 | Raise purchase request — price differs from Cost sources and no reason is given: the form refuses and says why | State | 1440 × 900 | `37:5523` |
| PUS1 | Purchase request SYN-REQ-000041 opened by its raiser — Approve is disabled with the reason: the raiser never approves | State | 1440 × 900 | `37:6109` |
| PS06 | Purchasing — true-empty: Requests to approve for an approver with nothing waiting; the count is a known 0 | State | 1440 × 900 | `37:6472` |
| PS08 | Raise purchase request — bulk action partly failed: two lines added, one refused with its reason; nothing is silently dropped | State | 1440 × 900 | `37:6728` |
| TB07 | Purchasing — Open orders at 1024 × 768 | Tablet | 1024 × 768 | `37:7268` |
| TB08 | Purchase order SYN-PO-000220 — Lines at 1024 × 768 | Tablet | 1024 × 768 | `37:7701` |
| PH07 | Approve a purchase request on the phone — the approver, not the raiser | Phone | 390 × 844 | `37:8046` |
| — | Notes card: Purchasing and supplier commitments · SC-02 | Notes | 1440 wide | `37:8151` |

### Inbound shipments · SC-03

Page `11:6` · `scope:SC-03`, `/supply/shipments` · 14 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| SH01 | Inbound shipments — register grouped by status with ETA basis and freshness | Register | 1440 × 900 | `38:523` |
| SH09 | Inbound shipments — docked menu collapsed to the accepted strip, register widened | Register | 1440 × 900 | `38:1262` |
| SH02 | Shipment SYN-SHP-000013 SV-20 — Allocations with the shortfall: 10 → 8, exact reductions by demand | Record detail | 1440 × 900 | `38:1929` |
| SH08 | Shipment SYN-SHP-000013 — History, grouped by day | Record detail | 1440 × 900 | `38:2343` |
| SH03 | Shipment SYN-SHP-000014 Cable and gland kit — ETA history: versions with basis; older than the 7-day freshness limit | Record detail | 1440 × 900 | `38:2700` |
| SH04 | Shipment SYN-SHP-000010 DP-25 — Documents: arrived and in Receiving; supplier documents from SharePoint | Record detail | 1440 × 900 | `38:3119` |
| SH05 | Record ETA change — new ETA, basis and evidence, with the consequences listed before saving | Form, dialog or panel | 1440 × 900 | `39:1983` |
| SH06 | Correct shipment shortfall — exact reductions to named demands, never automatic; a suggested reallocation the coordinator can ignore | Form, dialog or panel | 1440 × 900 | `39:2425` |
| SH07 | Shipment SYN-SHP-000015 Tanks — delay to a customer date: handed to the project owner and to Dispatch & delivery for a delay notice | State | 1440 × 900 | `39:2878` |
| SHS1 | Shipment SYN-SHP-000018 EC/pH sensor pairs — arrived but not received: Open in Receiving is the primary | State | 1440 × 900 | `39:3244` |
| SHS2 | Shipment SYN-SHP-000013 — shortfall waiting on a demand owner | State | 1440 × 900 | `39:3611` |
| PS09 | Record ETA change — permission changed while the form was open: the save is refused, the text is kept | State | 1440 × 900 | `39:3975` |
| TB09 | Inbound shipments — register at 1024 × 768 | Tablet | 1024 × 768 | `39:4388` |
| PH08 | Inbound shipments on the phone — what arrives and what is late, labelled rows | Phone | 390 × 844 | `39:4835` |
| — | Notes card: Inbound shipments · SC-03 | Notes | 1440 wide | `39:4957` |

### Receiving · SC-04

Page `11:7` · `scope:SC-04`, `/supply/receipts` · 21 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| RC01 | Receiving — All receipts, grouped by disposition | Register | 1440 × 900 | `22:524` |
| RC02 | Receipt SYN-RCT-000081 Dosing pump DP-25 — Lines, quarantined | Record detail | 1440 × 900 | `22:1312` |
| RC04 | Receipt SYN-RCT-000081 — Quarantine: what the item waits on and the four … | Record detail | 1440 × 900 | `24:1014` |
| RC03 | Receipt SYN-RCT-000081 — Inspection: goods-in form for a pump, leak test … | Record detail | 1440 × 1860 | `24:1483` |
| RC07 | Receipt SYN-RCT-000086 Cable tray and kit — Affected demand: short by 1 … | Record detail | 1440 × 900 | `24:2052` |
| RC09 | Receipt SYN-RCT-000080 Flow sensor FS-10 — History with a correction by … | Record detail | 1440 × 900 | `26:1977` |
| RC11 | Receiving — Expected today, dock view with Record arrival from shipment … | Register | 1440 × 900 | `26:2381` |
| RC05 | Release from quarantine — DP-25 after the leak test, “use as is” with an … | Form, dialog or panel | 1440 × 900 | `26:2920` |
| RC06 | Record receipt — climate controllers CC-8 with serials, one serial already … | Form, dialog or panel | 1440 × 900 | `26:3404` |
| RC08 | Correct a receipt — FS-10 counted 7 of 8, correction by reversal, waiting on … | Form, dialog or panel | 1440 × 900 | `26:4208` |
| RC10 | MYOB events for Receiving — every send with its state, Unknown blocks a … | Form, dialog or panel | 1440 × 900 | `26:5025` |
| X01 | Record inspection — goods-in checks for a line, result and evidence | Form, dialog or panel | 1440 × 900 | `26:5805` |
| X02 | Reject — hand rejected goods to Returns & claims | Form, dialog or panel | 1440 × 900 | `26:6293` |
| RS01 | Record receipt — quantity mismatch: counted more than the docket, the form … | State | 1440 × 900 | `28:3930` |
| RS02 | Receipt SYN-RCT-000091 Climate controllers CC-8 — serial already in use … | State | 1440 × 900 | `28:4694` |
| RS04 | Receipt SYN-RCT-000084 Terminals — MYOB send not confirmed: Unknown, repeat … | State | 1440 × 900 | `28:5109` |
| PS03 | Receipt opened by an observer — counts as dashes, values withheld with the … | State | 1440 × 900 | `28:5476` |
| TB01 | Receiving — All receipts at 1024 × 768 | Tablet | 1024 × 768 | `30:5383` |
| TB02 | Receipt SYN-RCT-000081 — Lines at 1024 × 768 | Tablet | 1024 × 768 | `30:5873` |
| PH02 | Quarantine on the phone — labelled cards, what each item waits on and who … | Phone | 390 × 844 | `28:6792` |
| PH01 | Record receipt on the phone — count with serials, one already in use, a … | Phone | 390 × 844 | `30:6211` |
| — | Notes card: Receiving · SC-04 · flagship “Receive and find stock” | Notes | 1440 wide | `30:6330` |

### Inventory · SC-05

Page `11:8` · `scope:SC-05`, `/supply/stock` · 14 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| IV01 | Inventory — register, quantities per meaning, Unknown shown as Unknown, “84 … | Register | 1440 × 900 | `31:557` |
| IV03 | Inventory item Dosing pump DP-25 — Quantities: each meaning its own row … | Record detail | 1440 × 900 | `31:2152` |
| IV04 | Inventory item Dosing pump DP-25 — Activity: observations and allocations … | Record detail | 1440 × 900 | `31:2592` |
| IV08 | Inventory — find stock by serial: SYN-SN-260037 found in the Returns … | Register | 1440 × 900 | `31:3017` |
| IV09 | Inventory — location view, Warehouse North bins with the CP-4 contactor … | Register | 1440 × 900 | `32:1690` |
| IV10 | Inventory — native observation form, kept on its own route: records an … | Register | 1440 × 900 | `32:2298` |
| IV02 | Inventory — snapshot open for Dosing pump DP-25: locations, observation … | Form, dialog or panel | 1440 × 900 | `31:1306` |
| IV05 | Inventory item Contactor 25 A — Partial observation: totals read Unknown … | State | 1440 × 900 | `32:2648` |
| IV06 | Inventory item not linked to a product — mapping is a separate decision … | State | 1440 × 900 | `32:3039` |
| IV07 | Inventory item held or quarantined — Climate controller CC-8 with a link to … | State | 1440 × 900 | `32:3384` |
| PS07 | Inventory — MYOB unavailable: every quantity reads Unknown with the last … | State | 1440 × 900 | `32:3736` |
| TB03 | Inventory — register at 1024 × 768 | Tablet | 1024 × 768 | `32:4191` |
| TB04 | Inventory item Dosing pump DP-25 — Quantities at 1024 × 768 | Tablet | 1024 × 768 | `32:4680` |
| PH03 | Inventory on the phone — find stock by scan, result with the meanings | Phone | 390 × 844 | `32:5004` |
| — | Notes card: Inventory · SC-05 · flagship “Receive and find stock” | Notes | 1440 wide | `32:5125` |

### Workshop builds · CX-02

Page `11:9` · `scope:CX-02`, `/workshop` · 17 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| WB01 | Workshop builds — All builds, with the proposed Workshop entry and its … | Register | 1440 × 900 | `40:523` |
| WB02 | Build SYN-BLD-000042 4-channel dosing unit — Parts list and Booked out … | Record detail | 1440 × 900 | `40:1156` |
| WB03 | Build SYN-BLD-000042 — Steps from WI-FDU-4 revision 5: a welding step with … | Record detail | 1440 × 900 | `40:1708` |
| WB04 | Build SYN-BLD-000040 CP-4 — Tests and rework: earth continuity 1.4 Ω failed … | Record detail | 1440 × 900 | `40:2207` |
| WB05 | Build SYN-BLD-000040 — Release decision by the workshop lead; the builder is … | Record detail | 1440 × 900 | `40:2728` |
| WB06 | Build SYN-BLD-000040 — Released and handed over for dispatch: accountable … | Record detail | 1440 × 900 | `40:3190` |
| WB09 | New build from released materials — SYN-BLD-000046 planned | Form, dialog or panel | 1440 × 900 | `41:2391` |
| X10 | Book out parts — one material issue for the build, never two; MYOB hears once … | Form, dialog or panel | 1440 × 900 | `41:3051` |
| X11 | Record step — who, when and the evidence the work instruction asks for | Form, dialog or panel | 1440 × 900 | `41:3660` |
| X12 | Record test result — against a published test definition and a calibrated … | Form, dialog or panel | 1440 × 900 | `41:4175` |
| X13 | Record rework — the finding, the action and who did it; a retest must follow | Form, dialog or panel | 1440 × 900 | `41:4719` |
| X14 | Hand over for dispatch — name the accountable owner for the released unit | Form, dialog or panel | 1440 × 900 | `41:5258` |
| WB07 | Build SYN-BLD-000040 — released materials changed after the build was … | State | 1440 × 900 | `41:5742` |
| WB08 | Build SYN-BLD-000042 — booking saved, MYOB send not confirmed | State | 1440 × 900 | `41:6200` |
| WBS1 | Build ready to release, opened by its builder — Release is disabled with the … | State | 1440 × 900 | `41:6742` |
| TB10 | Build SYN-BLD-000042 — Parts list at 1024 × 768 | Tablet | 1024 × 768 | `41:7167` |
| PH09 | Record test result on the phone — reading against the limit with a … | Phone | 390 × 844 | `41:7534` |
| — | Notes card: Workshop builds · CX-02 | Notes | 1440 wide | `41:7636` |

### Kitting and controllers · CX-02

Page `11:10` · `scope:CX-02`, `/workshop/kitting` · 11 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| KC01 | Kitting & controllers — Kits register by state: Planned, Picking, Kitted … | Register | 1440 × 900 | `43:523` |
| KC02 | Kitting & controllers — Controllers register by state | Register | 1440 × 900 | `43:1075` |
| KC03 | Kit SYN-KIT-000034 for build SYN-BLD-000046 — Pick list: reserved, not … | Record detail | 1440 × 900 | `43:1509` |
| KC04 | Controller SYN-CTL-000014 DC-4 — Preparation steps against the EN-08 … | Record detail | 1440 × 900 | `43:2025` |
| KC05 | Controller SYN-CTL-000014 — Configuration loaded against the basis … | Record detail | 1440 × 900 | `43:2465` |
| KC06 | Check configuration — independent check by an engineer; backup to Equipment | Form, dialog or panel | 1440 × 900 | `43:2974` |
| KC07 | Issue a job kit — shade screen motor replacement kit SYN-KIT-000033 to Casey … | Form, dialog or panel | 1440 × 900 | `43:3506` |
| KC08 | Controller SYN-CTL-000016 — waiting for the released configuration: nothing … | State | 1440 × 900 | `43:4152` |
| KC09 | Kit SYN-KIT-000033 issued — MYOB send not confirmed | State | 1440 × 900 | `43:4574` |
| TB11 | Kit SYN-KIT-000034 — Pick list at 1024 × 768 | Tablet | 1024 × 768 | `43:5008` |
| PH10 | Record kitted line on the phone — scan the bin and the part, reserve it for … | Phone | 390 × 844 | `43:5362` |
| — | Notes card: Kitting and controller preparation · CX-02/kitting | Notes | 1440 wide | `43:5463` |

### Bench testing and returns · CX-02

Page `11:11` · `scope:CX-02`, `/workshop/bench-testing` · 12 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| BT01 | Bench testing & returns — All returns by state | Register | 1440 × 900 | `45:523` |
| BT02 | Bench return SYN-RTN-000018 SM-40 — Receive & inspect: received by serial … | Record detail | 1440 × 900 | `45:1015` |
| BT04 | Bench return SYN-RTN-000017 two-channel unit SYN-SN-260037 — Bench tests … | Record detail | 1440 × 900 | `45:1491` |
| BT05 | Bench return SYN-RTN-000017 — Repair RP-1 and retest; parts used from stock | Record detail | 1440 × 900 | `45:1992` |
| BT06 | Bench return SYN-RTN-000017 — Outcome decision: one of six outcomes, by the … | Record detail | 1440 × 900 | `45:2474` |
| BT07 | Bench return SYN-RTN-000017 — Outcome recorded and handed over: repaired … | Record detail | 1440 × 900 | `45:2905` |
| BT03 | Receive by serial — matched to an expected return; an unknown serial is kept … | Form, dialog or panel | 1440 × 900 | `45:3393` |
| BT08 | Record test result — instrument calibration expired: the result cannot be … | State | 1440 × 900 | `45:3984` |
| BT09 | Bench return SYN-RTN-000017 — outcome saved, MYOB send not confirmed | State | 1440 × 900 | `45:4469` |
| TB12 | Bench return SYN-RTN-000017 — Bench tests at 1024 × 768 | Tablet | 1024 × 768 | `45:4886` |
| PH11 | Receive by serial on the phone — matched, and an unknown serial kept visible … | Phone | 390 × 844 | `45:5229` |
| PH12 | Record bench test result on the phone — a failure raises a repair | Phone | 390 × 844 | `45:5341` |
| — | Notes card: Bench testing and returned units · CX-02/bench-testing | Notes | 1440 wide | `45:5442` |

### Dispatch and delivery · SC-06 · SC-07

Page `11:12` · `scope:SC-06` and `scope:SC-07`, `/supply/dispatch` and `/supply/deliveries` · 18 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| DL01 | Picking & dispatch — All open, grouped by stage, with carrier, consignment … | Register | 1440 × 900 | `46:523` |
| DL02 | Dispatch SYN-DSP-000058 CP-4 to Hillview Glasshouse 4 — Items: picked and … | Record detail | 1440 × 900 | `46:1097` |
| DL04 | Dispatch SYN-DSP-000058 — Customer notice: M1 Dispatch prepared here, sent … | Record detail | 1440 × 900 | `46:1512` |
| DL05 | Dispatch SYN-DSP-000058 — Delivery with proof of delivery: delivered Wed 14 … | Record detail | 1440 × 1180 | `46:1881` |
| DL07 | Dispatch SYN-DSP-000061 Block C site materials — partial shipment: the … | Record detail | 1440 × 900 | `46:2322` |
| DL08 | Dispatch SYN-DSP-000063 parts to technician Casey Ward — a custody transfer … | Record detail | 1440 × 900 | `46:2727` |
| DL03 | Dispatch SYN-DSP-000058 — Shipment tab with Record shipment: carrier … | Form, dialog or panel | 1440 × 900 | `47:1847` |
| DL09 | Record delivery exception — Coastal Herbs sensors damaged in transit, handed … | Form, dialog or panel | 1440 × 900 | `47:2330` |
| X15 | Record pick — only usable stock can be picked; a short pick keeps its … | Form, dialog or panel | 1440 × 900 | `47:2942` |
| X16 | Prepare dispatch notice (M1) — prepared here from the shipment facts, sent in … | Form, dialog or panel | 1440 × 900 | `47:3566` |
| X17 | Prepare delay notice (M2) — a draft from the date change, reviewed before it … | Form, dialog or panel | 1440 × 900 | `47:4014` |
| DL10 | Dispatch SYN-DSP-000061 — delivery date slipped, delay notice suggested and … | State | 1440 × 900 | `47:4425` |
| DL11 | Dispatch SYN-DSP-000065 Hillcrest — short pick: 15 of 16 zone valves … | State | 1440 × 900 | `47:4774` |
| DL13 | Record shipment — tracking number missing at dispatch: the form refuses and … | State | 1440 × 900 | `47:5147` |
| DL12 | Dispatch SYN-DSP-000061 — shipment saved, MYOB send not confirmed | State | 1440 × 900 | `47:5636` |
| TB13 | Dispatch SYN-DSP-000058 — Items at 1024 × 768 | Tablet | 1024 × 768 | `47:6040` |
| PH13 | Record proof of delivery on the phone — signature and photo, exact … | Phone | 390 × 844 | `47:6369` |
| PH14 | Dispatched with tracking on the phone — what left, with which carrier, and … | Phone | 390 × 844 | `47:6469` |
| — | Notes card: Picking & dispatch and Customer deliveries · SC-06 · SC-07 | Notes | 1440 wide | `47:6575` |

### Returns and claims · SC-08

Page `11:13` · `scope:SC-08`, `/supply/returns` · 14 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| RT01 | Returns & claims — register with four status columns: goods, customer … | Register | 1440 × 900 | `49:523` |
| RT12 | Returns & claims — Credits & reconciliation view as the Finance lead … | Register | 1440 × 900 | `49:1015` |
| RT02 | Return SYN-RTN-000015 FM-2 — Supplier claim: four-track strip, claim … | Record detail | 1440 × 1160 | `49:1420` |
| RT03 | Return SYN-RTN-000015 — Goods and custody: at bench, disposition … | Record detail | 1440 × 900 | `49:1842` |
| RT10 | Return SYN-RTN-000015 — History, grouped by day | Record detail | 1440 × 900 | `49:2299` |
| RT04 | Return SYN-RTN-000015 — Credit, Match credit note as the Finance lead … | Form, dialog or panel | 1440 × 900 | `50:1673` |
| RT05 | Raise supplier claim — SV-24 ×2 from quarantine: the claim pack and the … | Form, dialog or panel | 1440 × 900 | `50:2178` |
| RT06 | Record supplier response — the supplier answered the claim; the next owner … | Form, dialog or panel | 1440 × 1160 | `50:2689` |
| RT07 | Return SYN-RTN-000009 VA-41 — claim declined: the claim track closes, the … | State | 1440 × 900 | `50:3127` |
| RT08 | Return SYN-RTN-000020 SV-24 — MYOB send not confirmed: the “return to … | State | 1440 × 900 | `50:3503` |
| RT11 | Return SYN-RTN-000015 — Credit tab as the supply coordinator: amounts on her … | State | 1440 × 900 | `50:3879` |
| RT13 | Return SYN-RTN-000015 — Credit tab as the supply coordinator on the accepted … | State | 1440 × 900 | `50:4292` |
| TB14 | Return SYN-RTN-000015 FM-2 — Supplier claim at 1024 × 768 (tablet): the four … | Tablet | 1024 × 768 | `50:4693` |
| PH15 | Record goods received with a photo on the phone — DP-25 from Mallee Fresh | Phone | 390 × 844 | `50:5042` |
| — | Notes card: Returns & claims · SC-08 | Notes | 1440 wide | `50:5156` |

### Material change impact · SC-09

Page `11:14` · `scope:SC-09`, `/supply/changes` · 12 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| MC01 | Material change impact — register grouped by status | Register | 1440 × 900 | `51:523` |
| MC02 | Impact SYN-IMP-000031 CP-4 contactor — Summary: exact before and after … | Record detail | 1440 × 1120 | `51:1028` |
| MC04 | Impact SYN-IMP-000031 — Affected records and owner actions: the workshop … | Record detail | 1440 × 900 | `51:1545` |
| MC03 | Impact SYN-IMP-000029 FS-10 receipt correction — waiting on a demand owner | Record detail | 1440 × 900 | `51:2016` |
| MC06 | Impact SYN-IMP-000030 SV-20 shortfall — exact reductions chosen: −2 EA on … | Record detail | 1440 × 900 | `51:2439` |
| MC05 | Record follow-through — each module’s exact outcome reference, recorded by … | Form, dialog or panel | 1440 × 900 | `51:2882` |
| X18 | Notify owners — a New review names each affected record’s owner before anyone … | Form, dialog or panel | 1440 × 900 | `51:3369` |
| MC08 | Impact SYN-IMP-000031 — an owner has not acknowledged: a My Work reminder … | State | 1440 × 900 | `51:3976` |
| MC09 | Impact SYN-IMP-000031 — the source changed again: every owner is re-asked … | State | 1440 × 900 | `51:4403` |
| MC10 | Impact SYN-IMP-000031 — Partial: Purchasing unavailable, so the affected … | State | 1440 × 900 | `51:4863` |
| TB15 | Impact SYN-IMP-000031 — Summary at 1024 × 768 | Tablet | 1024 × 768 | `51:5314` |
| PH16 | My action on the phone — Acknowledge a material change; acknowledged is not … | Phone | 390 × 844 | `51:5668` |
| — | Notes card: Material change impact · SC-09 | Notes | 1440 wide | `51:5759` |

### Service stock · SC-10

Page `11:15` · `scope:SC-10`, `/supply/service-stock` · 15 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| SS01 | Service stock custody — All custody by holder, with the parts-ready signal 7 … | Register | 1440 × 900 | `52:523` |
| SS02 | Service van 1 (Casey Ward) — Holding: items held with their issue … | Record detail | 1440 × 900 | `52:970` |
| SS08 | Service van 1 — Upcoming jobs and the parts-ready signal per visit, read by … | Record detail | 1440 × 900 | `52:1511` |
| SS03 | Reconcile job SYN-WO-000060 — outcomes total the issue exactly; used matches … | Record detail | 1440 × 900 | `52:2025` |
| SS04 | Service van 1 — Counts: a variance and a write-off waiting on approval | Record detail | 1440 × 900 | `52:2579` |
| SS10 | Service van 1 — History, grouped by day | Record detail | 1440 × 900 | `52:3110` |
| SS05 | Resolve difference — a faulty PT-10 goes to Returns & claims; every unit … | Form, dialog or panel | 1440 × 900 | `53:2313` |
| SS06 | Approve write-off — signed in as Jordan Blake: the approver is not the … | Form, dialog or panel | 1440 × 900 | `53:2918` |
| SS09 | Transfer to van — spares to a holder; the MYOB transfer is sent when the van … | Form, dialog or panel | 1440 × 900 | `53:3464` |
| X19 | Reassign holder — a van changes hands: count first, then one custody closes … | Form, dialog or panel | 1440 × 900 | `53:3975` |
| SS07 | Service van 2 — job closed with parts unreconciled: the closure block | State | 1440 × 900 | `53:4467` |
| TB16 | Reconcile job SYN-WO-000060 at 1024 × 768 | Tablet | 1024 × 768 | `53:4931` |
| PH17 | My van stock on the phone — what I hold and for which visit | Phone | 390 × 844 | `53:5297` |
| PH18 | Confirm parts used on the phone — used must match the field capture; a … | Phone | 390 × 844 | `53:5417` |
| PH19 | Count my van on the phone — a count with a variance, submitted for the … | Phone | 390 × 844 | `53:5536` |
| — | Notes card: Service stock custody · SC-10 | Notes | 1440 wide | `53:5642` |

### Insights · RP-05

Page `11:16` · `scope:RP-05`, `/reports/reconciliation` (Supply extract) · 8 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| IS01 | Supply & Finance trust — Supply view, signed in as Avery Lin: KPI-10 38 % | Overview | 1440 × 2100 | `58:517` |
| IS02 | Readiness and promise performance — promises kept by supplier, ETA freshness … | Overview | 1440 × 1200 | `58:1276` |
| IS03 | Drill-through — from the count “3 of 8” to its rows: the 8 assessed packages … | Register | 1440 × 900 | `59:2140` |
| X20 | About this measure — KPI-10: definition, counts, what is left out, owner … | Form, dialog or panel | 1440 × 2100 | `58:2483` |
| IS04 | Supply & Finance trust — signed in as Robin Hale: sections she may not read … | State | 1440 × 2020 | `58:3279` |
| IS05 | Supply & Finance trust — partial source: MYOB credit notes unavailable … | State | 1440 × 2180 | `58:3977` |
| TB17 | Supply & Finance trust at 1024 × 768 (tablet), Supply view | Tablet | 1024 × 768 | `58:4745` |
| PH20 | Supply & Finance trust on the phone — summaries first, then one list of … | Phone | 390 × 844 | `58:5427` |
| — | Notes card: Insights · RP-05 (Supply extract) | Notes | 1440 wide | `58:5556` |

### Interaction states · SC

Page `11:17` · the Supply workspace as a whole; no route · 11 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| ST01 | Interaction states and accessibility — register, column, inline edit … | Reference sheet | 1440 × 4844 | `63:517` |
| ST02 | Register standard shown on Material demand — a column being dragged with its … | Register | 1440 × 900 | `67:709` |
| ST03 | Collapsed docked workspace menu — the accepted 12 px strip on hover; the … | Register | 1440 × 900 | `67:1288` |
| ST04 | Workspace flyout — the accepted Supply chain flyout opened from the rail … | Register | 1440 × 900 | `67:1849` |
| X21 | Address lookup — suggestions from the maps provider, with “Use as typed” | Form, dialog or panel | 1440 × 900 | `67:2557` |
| X22 | Address linked — the chip “Linked · Maps”, Open in Maps and Edit manually | Form, dialog or panel | 1440 × 900 | `67:3178` |
| PS10 | Address lookup — the maps provider is unavailable: the address is kept as … | State | 1440 × 900 | `67:3781` |
| PS11 | Inline edit — stale: someone saved the same cell first; their value is shown … | State | 1440 × 900 | `67:4385` |
| TB18 | Register standard at 1024 × 768 (tablet) — frozen first column, sideways … | Tablet | 1024 × 768 | `67:4993` |
| PH21 | Phone form at 390 × 844 — 16 px inputs, 48 px options, scanner field with … | Phone | 390 × 844 | `67:5551` |
| PH22 | Phone form at 320 × 844 — the same form stacked at the narrowest width | Phone | 320 × 844 | `67:5657` |
| — | Notes card: Interaction states · SC | Notes | 1440 wide | `67:5763` |

### Administration · SC · CX-02

Page `11:18` · Supply and Workshop settings; no route is built · 16 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| AD01 | Supply settings hub — what can be changed, by whom and at which scope; what … | Overview | 1440 × 1320 | `68:581` |
| AD02 | Readiness and promise rules — version 1 proposed and reviewed, ready to … | Settings | 1440 × 1160 | `68:1026` |
| AD04 | Receiving and goods-in — dispositions, goods-in form item classes and … | Settings | 1440 × 900 | `68:1432` |
| AD05 | Carriers and notices — carriers and the freight platform as placeholders … | Settings | 1440 × 900 | `68:1852` |
| AD06 | Returns and claims — return dispositions, claim templates and the credit … | Settings | 1440 × 900 | `68:2204` |
| AD10 | Notifications, saved views and layout — Robin Hale’s own Supply settings … | Settings | 1440 × 900 | `68:2559` |
| AD07 | Workshop settings — Overview: eight areas, each with its status in words … | Overview | 1440 × 900 | `69:1636` |
| AD08 | Test definitions — the register, and Earth continuity version 2 proposed | Settings | 1440 × 900 | `69:2023` |
| AD09 | Serial numbering and release rules — the serial never resets; the builder … | Settings | 1440 × 900 | `69:2475` |
| AD03 | Publish version — the affected open records are shown before the … | Form, dialog or panel | 1440 × 1160 | `69:2834` |
| X23 | Propose a change — Earth continuity limit 0.5 Ω to 0.2 Ω: a limit change is a … | Form, dialog or panel | 1440 × 900 | `69:3316` |
| AS01 | Review refused — the proposer opens Review on their own proposal and is … | State | 1440 × 900 | `69:3802` |
| AS02 | Readiness and promise rules — Robin Hale’s view: read only; proposing and … | State | 1440 × 1160 | `69:4265` |
| AS03 | Publish refused — the review is out of date: the proposal changed after it … | State | 1440 × 1160 | `69:4679` |
| TB19 | Supply settings hub at 1024 × 768 (tablet) — the settings menu folds away … | Tablet | 1024 × 768 | `69:5091` |
| PH23 | Review on the phone — Dean reviews Earth continuity version 2 as a … | Phone | 390 × 844 | `69:5401` |
| — | Notes card: Administration · SC · CX-02 | Notes | 1440 wide | `69:5508` |

## 4. Rules applied

- **Shell and layout.** The accepted shell without change: top bar, rail with Supply current, right strip, the docked Supply menu with its eleven accepted pages or the accepted collapsed strip; panels 432 px wide at the right without a scrim; dialogs 520 to 720 px with a navy scrim at 32%. Records carry the shared record header and toolbar (Addendum A1) with one state-driven primary, then a five-fact checks bar for their scope, a signals strip, a details column, tabs and main cards.
- **Registers.** One line per cell with an ellipsis and sideways scroll; no second search; view tiles with counts; a frozen first column and a frozen row menu; group bands across the full row; a footer with the count and the as-at time. The app-wide register standard (D9: column reorder, resize, inline edit, address lookup) is specified on ST01 and shown on ST02.
- **Book of record (D3).** No sheet posts, orders, reserves or moves stock. The MYOB card on a record lists each finished event with its state, time and reference and the link "See in Integration activity"; Unknown shows "Repeat blocked until the outcome is known"; corrections are reversals.
- **Readiness (D4).** PPO-SUP-DEC-01: Not assessed, Evidence needed, Ready for the stated material scope, At risk, Blocked, each with its rule in words and a "why this" trace. Only a SupplierConfirmed promise dated in time makes a line At risk; incoming never counts as usable. An approved demand with nothing allocated reads Blocked here and the sheet says the field readiness gate reads it Evidence needed.
- **Quantities (D5).** Every quantity carries its unit; Unknown and Partial are chips and never zero; a known zero stays 0. Forms show the inequality that would fail before submit: counted ≥ inspected ≥ usable + quarantined, pick ≥ staged ≥ moved ≥ delivered, and custody outcomes that total the issue exactly.
- **Money (D6).** AUD excluding GST, rarely, and never as a PPO balance. Goods, supplier claims and credits are three ageing tables that are never added; a return keeps four tracks with four statuses; an expected credit is labelled "not cash".
- **References (D7, Addendum A2).** `SYN-<TYPE>-<NUMBER>` with six digits, under PPO-REFERENCE-NAMESPACES-DEC.
- **Separation of duties.** The raiser never approves a purchase request; the person who quarantined never releases; the builder never releases a build; the proposer never reviews a settings change; credits need Finance authority; a technician sees and reconciles only their own van; observers see dashes.
- **My Work (SH-01, SH-02, SH-06).** Every item Supply contributes is shown on the Supply sheet that raises it, with where it came from and where it clears.
- **Accessibility.** Status always has words; focus is a 2 px brand/green-deep ring; phone inputs are 16 px with 48 px options and stack at 320; contrast is proved on ST01 from the PPO colour variables.
- **Page template (D11).** Six sections per scope page in one column with 360 px gaps: Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, Flows and notes.

## 5. Assumptions and proposed departures

| ID | Assumption or departure |
|---|---|
| A1 | File name. The file is "PPO - Supply module (proposal)" as created; the design-to-build standard names the module file "PPO - Supply Chain & Workshop". Recorded, not changed |
| A2 | The Workshop pages live in this file with a **proposed** twelfth "Workshop" entry in the accepted Supply menu (Workshop builds, Kitting & controllers, Bench testing & returns). A Shell departure for the Shell file to adopt (Q1) |
| A3 | Supply Pulse is a proposed page under Demand and supply with a proposed menu entry; My Work stays the cross-module queue (Q7) |
| A4 | The collapsed docked menu is the accepted Shell strip as drawn in the Shell file: 12 px wide with 1300 px of content. The brief described 80 px and 1232 px; the accepted component was used |
| A5 | Addendum A1 was not supplied as text. The shared record toolbar and its rules R1 to R10 were read from the Shell file's proposal page of 9 November 2026. That toolbar is itself a proposal in the Shell file |
| A6 | Phone bar: the accepted Workshop builds D8 bar (My Work, Receiving, Inventory, Workshop, More). Code carries the generic bar (My Work, Material demand, Dispatch & delivery, More); Dispatch and delivery sits under More (Q5) |
| A7 | The ETA freshness limit (7 days) and the acknowledgement waiting limit (5 working days) are illustrative proposed settings that read "Policy not configured" until Supply settings publishes them (Q4; SC-03 Q1) |
| A8 | Capabilities marked † in the brief are design assumptions, since no observed profile holds them: purchase request approval (Quinn Avery), release from quarantine by a delegate, write-off approval (Jordan Blake), the workshop lead and workshop technician profiles, the storeperson's warehouse scope, and settings propose, review and publish (Q6; SC-02 Q2) |
| A9 | The closure block while parts are unreconciled is a proposed rule (SC-10 Q5), drawn on SS07 |
| A10 | Supplier-credit amounts for a coordinator on her own claims (SC-08 D7) are drawn as proposed on RT11; the accepted pattern (RT13, IS04) shows Restricted (Q3) |
| A11 | The carrier "SYN Freight Co" and "Freight platform (to be named)" are placeholders (Q2) |
| A12 | Reference forms. The accepted Shell flyout keeps its Recent list wording (PO-000318, SH-0091, RA-0007) as accepted. Instrument tags (SYN-MEG-002), manufacturer serials (DP25-77341), unit serials (SYN-SN-260040) and test definitions keep their own forms. The `SYN-PPO-…` references on the earlier Design pages (for example `SYN-PPO-BLD-000042`, `SYN-PPO-PO-000215`) are legacy examples; the numbers carry over |
| A13 | Three earlier Design-page facts are replaced by this file's dataset (Q8): the DP-25 serial is DP25-77341 (earlier DP25-88412); the DP-25 shipment is SYN-SHP-000010 from SYN Drive Systems (earlier SYN-SHP-000007 from SYN Motion Parts); Glasshouse 4 belongs to Hillview Growers (earlier Riverbend) |
| A14 | Conflicts inside the brief's dataset were resolved one way everywhere: readiness counts are Ready 15, At risk 5, Blocked 4, Evidence needed 3, Not assessed 4 (not "17 further demands all Ready"); the two Unknown sends are the SYN-RCT-000084 correction and the SYN-RTN-000020 return to supplier, with the SYN-RCT-000080 correction drawn Posted; impact counts are New 1, Owners notified 2, In progress 1, Resolved with holds 1, with SYN-IMP-000024 drawn Resolved and SYN-IMP-000033 added |
| A15 | "MYOB send not confirmed" states for Workshop, Kitting, Bench testing and Dispatch are drawn as earlier moments that later Posted, so the week's ledger stays Posted 41, Sent 3, Unknown 2, Refused 1 |
| A16 | Page names follow the brief; the accepted menu labels differ and are kept in the menu: Inventory is "Stock & reservations", Receiving is "Receiving & inspection", Dispatch and delivery covers "Picking & dispatch" and "Customer deliveries" |
| A17 | SC-09 D1's "Material changes" side-menu group is superseded by the Shell's Reviews group |
| A18 | Insights. IS01 is drawn signed in as the Finance lead, who may read every section; the coordinator's view is the Restricted state IS04. The accepted figures (KPI-10 38%, 3 of 8; KPI-12 36%, 4 of 11) are kept; for this file's story the 31 demands regroup into 8 assessed packages and 3 left out, and the 4 demands that are Not assessed sit in those 3 packages, where the accepted page spoke of 3 demands. The side menu is the Supply docked menu, not the Reports menu of the accepted page. IS02 is a proposal |
| A19 | Sheet codes DL06, RT09 and MC07 are phone forms and are drawn as PH13, PH15 and PH16 |
| A20 | Settings pages draw the settings menu inside the content region with Settings current on the rail; the accepted Workshop settings page reached it under More |
| A21 | Reference types beyond the brief's dataset are synthetic: MYOB documents (PR, DKT, MI, TR, CRN) and internal records (SH outbound shipment, POD, CUS custody, RR, RO, FG, SRT). The supplier promise counts on IS02, the dispositions, item classes, test definitions other than Earth continuity, and the A$5.00 credit matching tolerance are synthetic examples |

Proposed features (section 10 of the brief): N-S1 Supply Pulse, N-S2 "why this state", N-S3 scan to find and N-S4 send-state watch are drawn as integrated features. N-S5 to N-S10 are shown on sheets or notes as proposals. Each is grounded in the record's own data, labelled as a summary or suggestion, reviewed before anything is saved, and writes nothing to a record or to MYOB.

## 6. Verification

- **Renders.** Representative sheets of every page type on every page were rendered inside Figma at 1200 to 1440 px and read during each batch; defects found were corrected and re-rendered. Not every one of the 233 sheets was read by eye.
- **Structural pass, all 15 scope pages.** Every sheet's direct children sit inside its bounds; no text in a register cell is taller than one line; Roboto is the only font family; every sheet has a label with the matching text at the sheet's x, 26 px above it and no wider than the sheet.
- **Position audit, all pages.** Six sections per scope page in template order at x 0 with 360 px gaps, each refitted with 60 px padding; no sheet, label or section overlaps another; nothing is loose, hidden or transparent; the two separator pages and Scratch are empty. One loose leftover cell on the Interaction states page was found by the audit and removed.
- **Scans.** No date in a style other than "Thu 5 Nov 2026", except the ISO format named in the export dialog; no dollar amount without the A$ prefix; every `SYN-` reference carries six digits except instrument tags, which keep the dataset's three.
- **Contrast.** Computed on ST01 from the PPO colour variables with the WCAG 2.1 formula. Lowest text pair in use: text/secondary on surface/hover, 5.14:1. Lowest control edge: line/control on white, 3.32:1; the focus ring, brand/green-deep on white, 3.57:1. One pair is below 4.5:1: white on brand/green-deep, 3.57:1, so the green button kind must not carry small text; no Supply sheet uses it. line/strong on white (1.30:1) is a decorative divider, not a control boundary.
- **Story.** The counts of the dataset were checked where they repeat across pages during the build (demands 31 with their readiness split, the MYOB send ledger, shipments, receipts, returns, impacts, parts-ready 7 of 9). A file-wide text comparison of every reference, date and quantity against the dataset was not run as one pass; it remains open.
- **Capability and authority.** Enabled commands follow the persona matrix; the separation-of-duties sheets are PUS1 and PU03, RC05, WBS1, AS01, RT04 with RT13 and IS04, PH17 and PS03. No sheet reads as a PPO stock balance, purchase or posting.
- **Not done.** No prototype flow is wired and none was played. No owner device, keyboard, screen reader or 200% zoom review is recorded. The sheets are design compositions and set no UI baseline.
- **Repository checks for this change.** `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

## 7. Not drawn and open questions

**Not drawn.** The Finance view and Integration backlog tabs of Supply & Finance trust; Workshop settings area pages for welding requirements, controller presets, bench test procedures and MYOB mapping (cards only, as in the accepted design); a demand record for a Forecast demand; the proposal form for a receiving disposition or serial-capture class (the propose, review and publish flow is drawn on the readiness rules); the publish dialog for the Earth continuity version (shown by the pattern of AD03); printed outputs (pick list, packing slip, labels); prototype links; tablet and phone variants of most dialogs.

**Open questions.**

| Question | State |
|---|---|
| Q1 to Q8 of the brief | Answered by their defaults; each is an assumption in section 5 and can be reversed without redrawing the set |
| SC-01 Q1 to Q6 | Open as recorded in the Material readiness design |
| SC-02 Q2 | Who holds the purchase approver permission |
| SC-03 Q1, Q3, Q4 | The ETA freshness limit; reallocation on a shortfall; freight mode and cost |
| SC-08 Q1 to Q6 | Open as recorded in the Returns and claims design, including credit visibility (D7) |
| SC-10 Q5 | Whether Service may close a job while its parts are unreconciled |
| DEC-CCE-10 | Open as recorded |
| The unallocated-demand rule | Supply reads Blocked and the field readiness gate reads Evidence needed; Dean's 17 October 2026 decision keeps both for now |
| New in this file | Who holds the settings permissions; the named carrier, freight platform and maps provider; whether IS02 joins the accepted report; whether the two limits are company-wide or per supplier |

## 8. Boundary and next steps

- **Design only.** No application code, route, read model, migration, permission, capability, grant, seed, MYOB endpoint or integration was created or changed. Nothing here authorises a business transaction, a customer communication or a migration.
- **The design register and page guidance follow in their own change.** This change does not edit `docs/design/development/`. Three register notes are stale and are recorded here, not fixed: every Supply route reads "Needs review"; the kitting and bench-testing contracts still say "not drawn"; the SC-05 record says the Inventory rename is unbuilt while the code has it ([pull request 805](https://github.com/deanrfiedler-gif/powerplants-one/pull/805)).
- **Shell follow-up.** The Workshop menu entry (A2), the Supply Pulse entry (A3) and the 20 added Supply icons are proposals for the Shell file to adopt. The brief's description of the collapsed strip (A4) should be corrected to the accepted 12 px.
- **Sales, Estimating and Projects follow-ups.** Demands SYN-DEM-000101 and SYN-DEM-000102 belong to Woodhaven's potting machine and Hillcrest's are SYN-DEM-000105 and SYN-DEM-000106, as the brief corrects the Projects story. Glasshouse 4's customer is Hillview Growers (A13).
- **Acceptance.** Dean reviews page by page, starting with the flagship pages Receiving and Inventory. Accepted pages move above the "— Proposals —" separator.

## 9. Audit — 10 November 2026

Run after the last batch. What was clearly right was applied; the rest is proposed.

**Scenario coverage.** S-01 to S-38 of the brief each map to at least one sheet; the mapping is on the file's audit card. Three are partly covered: S-02 shows the Forecast demands as register rows only; S-31 draws propose, review and publish on the readiness rules, with the receiving change as a command on AD04; S-32 draws the proposal and the refused review, with publish shown by the pattern of AD03.

| ID | Item | State |
|---|---|---|
| C1 | Photo and signature tiles collapsed to icon height on new sheets; the helper was fixed and ST01 corrected | Applied |
| C2 | Stat labels on MD05 and MD06 shortened so they are not cut | Applied |
| C3 | The not-ready visits on MD11 now match SS08 (SYN-WO-000066 and SYN-WO-000062) | Applied |
| C4 | Cut date and state columns widened on AD01, AD03, AD07 and TB19; the Version column on AD08 made visible; a tooltip that covered Filters on ST02 moved | Applied |
| C5 | A loose leftover cell removed from Interaction states | Applied |
| R1 | Re-render the record sheets drawn before the checks-bar fix (Workshop builds first) so the bar's note never clips at docked width | Proposed |
| R2 | IS01 Materials: widen Promise basis and Need date, or split basis and date | Proposed |
| R3 | IV03: widen the first column of Locations | Proposed |
| R4 | Tablet rail at 720 px: More and Settings crowd, as in the Sales file; needs a Shell rule for short viewports | Proposed |
| R5 | Define hover and pressed tokens in the Design file; ST01 uses the nearest existing variables | Proposed |
| R6 | Move the page kit from its Sales names to shared kit names when the kit moves to the Design file | Proposed |
| G1 to G6 | The items under "Not drawn" in section 7, plus a person's keyboard, screen reader, zoom and device review | Open |
| N-S1 to N-S4 | Drawn as integrated features (MD11 and PH04; MD02, MD10 and SS08; IV08, RC06, BT03 and PH03; PU11 and RC10) | Drawn |
| N-S5 to N-S10 | Shown as proposals (PU05 and IS02; SH06 and MC06; Receiving notes; DL10 and X17; KC03; notes) | Proposed |
| P1 to P4 | One wording for the same state across pages; one pattern for group-band meta; one "as at" footer wording; long sheet labels are cut at the sheet width by design | Proposed |

**Recommended order.** 1. Review the flagship pages Receiving and Inventory, then Material demand. 2. Confirm or reverse the defaults for Q1 to Q8. 3. Apply R1 to R3. 4. Wire one prototype flow for "Receive and find stock". 5. Take the Workshop menu entry and Supply Pulse to the Shell file. 6. Update the design register and page guidance in their own change. 7. Save the named version and accept page by page.

## 10. Named version

No named version is saved yet. The proposal state should be pinned by Dean saving the named version "Supply module · refined UI pages — proposal (10 November 2026)"; this section is updated when he does. Any later design change needs a new named version ([named-version build handoff](figma-named-version-build-handoff.md)).
