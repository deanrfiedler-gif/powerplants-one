---
document_id: PPO-SERVICE-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal, 10 November 2026, build completed and audited 11 November 2026; design acceptance is Dean's and has not been given; no named version is saved yet; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, MYOB endpoint, Customer messages send or deployment; every record shown is synthetic
source_commit: a65ac3f4a9a675f68c47567d8070a098b4f31b3f
versioning: git
---

# Service module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026, completed 11 November 2026 · **Status:** Proposal. Sections 1 to 8 are the proposal record; section 9 is the audit and section 10 the named version. Later sections will record Dean's acceptance, any further batches and further named versions exactly as the [Sales record](sales-module-refined-ui-proposal.md) does.

On 10 November 2026 Dean asked for the refined UI pages of the Powerplants One Service module (the "Service operations" workspace, rail label "Service") to be built in Figma from a written brief and its Addendum A3 (persona and story reconciliation), inside the accepted shell and to at least the standard of the Sales module file. The brief names the new private file "PPO - Service module (proposal)" as the target. The link Dean sent opened his "PPO - Settings module" file, which already holds Settings pages; the Service pages were built in the file the brief names and the Settings file was only read, as the source of the page kit. His standing instruction applies: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The ten questions in the brief were therefore answered by their stated defaults; each is recorded in section 5 and can be reversed.

This record is a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions that remain. It changes no code, test, migration, seed, permission or route, and it authorises no business transaction, MYOB integration, manufacturer contact or customer communication. Four statements stay separate throughout: code delivery (none), design acceptance (Dean's, not given), production readiness (not inferred) and integration with MYOB, Customer messages, Supply, Engineering, Projects or a manufacturer (none exists, none authorised).

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026), pages "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked (accepted 8 November 2026)" | Chrome and geometry: 48 px top bar with global search, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, the 280 px docked workspace menu, the collapsed strip, the 1024 top bar (332 / 360 / 332), the Service operations flyout and docked menus with their nested views, the record header toolbar (Addendum A1) and sheet Z, the technician's sparse rail |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | Conventions mirrored: the page template, sheet labels, the page kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile), the phone header and tab bar pattern |
| Private Figma file "PPO - Settings module" | Read only: the source of the copied kit, chrome and helper library (A2) |
| Private Figma file "PPO - Design", the accepted and proposed Service pages | Rules, stories and vocabulary of the 23 reference pages and their notes cards |
| [BP-01](../blueprints/BP-01-master-blueprint.md) section 13 and [BP-07 Service operations](../blueprints/BP-07-service-operations.md) | Parents SVC-01 to SVC-12; transitions TR-01 to TR-16; business rules SR-01 to SR-20; the offline matrix; cross-module rules BR-09 to BR-16, BR-23 and BR-24. No parent requirement ID is added or renamed; all 78 remain |
| Service page decisions: [requests](service-requests-figma-design.md) (PPO-SV01-REQUESTS-FIGMA-DEC), [request capture and triage](service-request-capture-and-triage.md), [requests refinement](service-requests-native-refinement.md), [work orders](work-orders-design.md) (PPO-SVC-WORK-ORDERS-DESIGN-DEC), [work order record](work-order-record-page-design.md) (PPO-SVC-WO-RECORD-DESIGN-DEC), [work order register](work-order-register-backend.md), [job pack](job-pack-figma-design.md) (PPO-SVC-JOB-PACK-FIGMA-DESIGN-DEC), [job pack design](job-pack-design.md), [job pack integration](job-pack-integration.md), [field readiness gate](field-readiness-gate-proposal.md) (PPO-SVC-FIELD-READINESS-GATE-PROP), [planner](service-planner-figma-design.md) (PPO-PL01-PLANNER-FIGMA-DEC), [changes and follow-up](changes-follow-up-figma-design.md) (PPO-PL04-CHANGES-FOLLOW-UP-FIGMA-DEC), [travel review](travel-review-figma-design.md) (PPO-PL05-TRAVEL-REVIEW-FIGMA-DEC), [capacity review](capacity-review-figma-design.md) (PPO-PL03-CAPACITY-REVIEW-FIGMA-DEC), [appointment detail](appointment-detail-figma-design.md) (PPO-SV04-APPOINTMENT-FIGMA-DEC), [field team](field-team-figma-design.md) (PPO-PL02-FIELD-TEAM-FIGMA-DEC), [field technicians](field-technicians-design.md) | Accepted page decisions carried into the redrawn pages |
| Field decisions: [My jobs](my-jobs-figma-design.md) (PPO-FI01-MYJOBS-FIGMA-DEC), [field work timer](field-work-timer-design.md), [native timer](field-timer-native.md), [closed visit guidance](field-closed-visit-guidance.md), [field readiness](field-readiness-native.md), [time and labour review](time-labour-review-figma-design.md) (PPO-FI01-TIME-REVIEW-FIGMA-DEC), [inspections](inspections-figma-design.md) (PPO-FI03-FI04-INSPECTIONS-FIGMA-DEC), [service inspections](service-inspections.md), [reading instruments](inspections-reading-instruments.md) (PPO-INSPECTIONS-READING-INSTRUMENTS-DEC), [incidents](incidents-figma-design.md) (PPO-FI06-INCIDENTS-FIGMA-DEC), [field incidents](field-incidents.md), [site readiness](site-readiness-figma-design.md) (PPO-FI05-SITE-READINESS-FIGMA-DEC), [site access readiness](site-access-readiness-design.md) | As above |
| Review and aftercare decisions: [service review](service-review-figma-design.md) (PPO-SV06-REVIEW-FIGMA-DEC), [reports workspace](service-review-reports-workspace-design.md) (PPO-SVC-REVIEW-DES), [customer response](customer-response-figma-design.md) (PPO-FI07-CUSTOMER-RESPONSE-FIGMA-DEC), [field customer response](field-customer-response.md), [findings](findings-figma-design.md) (PPO-SV07-FINDINGS-FIGMA-DEC), [findings backend](service-findings-backend.md), [escalations](escalations-figma-design.md) (PPO-SV08-ESCALATIONS-FIGMA-DEC), [native escalations](service-escalations-native.md) (PPO-SV08-NATIVE-DEC), [service performance](service-performance-figma-design.md) (PPO-RP04-SERVICE-PERFORMANCE-FIGMA-DEC), [maintenance and warranty native](maintenance-warranty-native.md), [TS-02 decisions](maintenance-service-ts02-decisions.md) (PPO-MAINTENANCE-TS02-DEC), [agreements and maintenance](service-agreements-maintenance-design.md) (PPO-MA-WORKSPACE-DES), [warranty customer resolution](warranty-customer-resolution-design.md) (PPO-WAR-WORKSPACE-DES), [project delivery billing](project-delivery-billing.md) (PPO-PROJECT-DELIVERY-BILLING-DEC), [won delivery continuity](won-delivery-continuity.md), [Sales aftercare](sales-aftercare-figma-design.md) (PPO-CR05-SALES-AFTERCARE-FIGMA-DEC) | As above |
| [PPO workspace, MYOB book of record](ppo-workspace-myob-book-of-record.md) (PPO-ERP-OPERATING-MODEL-DEC), contracts `field-customer-response`, `finance-handoff`, `supply-chain-readiness`, `lead-to-delivery-continuity`, `sales-aftercare-receiving`, `quotation-conversion`, `myob-integration-blueprint` | Finance owns charging; MYOB is the book of record; one work order per handoff; parts readiness from linked demands |
| [Readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC) and Addendum A2 to the brief | Reference form `SYN-<TYPE>-<NUMBER>`; service requests stay TKT and work orders stay WO |
| [PPO-STD-001](../standards/naming-conventions.md), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [HTML module conformance](../standards/html-module-conformance.md), [named-version build handoff](figma-named-version-build-handoff.md) (PPO-FIGMA-NAMED-VERSION-HANDOFF-DEC), [design, build and review roles](design-build-review-roles.md) | Naming, page order, the nine-field declaration, r20 page types, and the rule that a named version pins a build basis |
| `src/shell/navigation.ts`, `src/components/product-navigation.tsx`, `src/platform/permissions.ts`, `db/migrations/` 0001 to 0124 as listed in the brief | The rail order and destinations, the nested views, the lifecycles in the schema and the Service capabilities; read only |

The files' links and keys are not recorded in this public repository ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

### 2.1 The module

| Field | Declaration |
|---|---|
| Scope identity | The Service operations workspace: `scope:SV-01` to `scope:SV-08`, `scope:PL-01` to `scope:PL-05`, `scope:FI-01` (with the proposed time review), `scope:FI-02` to `scope:FI-07`, `scope:MA-01` to `scope:MA-07` and the Service extract of `scope:RP-04`, under parents SVC-01 to SVC-12. Routes are listed per scope in 2.2. No scope ID or parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist; Record detail; Overview / dashboard (Service Pulse, Capacity review, the Service extract of Insights, the settings hub); Form / guided workflow as 432 px right panels, centred dialogs and full-screen phone sheets; Review / comparison (Policy impact, Changed since you acknowledged, Correct or clarify, Propose successor, propose, review and publish); the planner board; states; tablet and phone variants. Per scope in 2.2 |
| Reused components | Local copies of the accepted shell under the same names: Shell / Top bar, Shell / Rail · collapsed (a Current = Service variant added), Shell / Right rail · collapsed, Shell / Workspace menu · docked (Service operations, with nested views), Shell / Workspace menu · collapsed strip, the 1024 top bar, Shell / Record header · toolbar and its phone variant (Addendum A1); 101 shell icon components (Lucide stand-ins for Font Awesome Light) and the brand mark; the "PPO colour" variable collection (66 variables, same names as the Shell and Sales files); the Sales page kit under its Sales names. New in this file and proposed: the Service operations flyout as redrawn (A55); the coordinator and technician phone tab bars; drawn parts for the checks bar, gate bar, planner board, timer dock, reading row, requirement row, condition card, offline bar, evidence tiles, response card and signals strip |
| Source authority | Dean's brief and its decisions D1 to D13 as amended by Addendum A3; the accepted Service page decisions in section 1; the Maintenance and warranty proposals as design direction, not accepted; this file's compositions as proposals. The fixture is fictional and synthetic: as at Thursday 5 November 2026, 09:00 AEDT, signed in as service coordinator Ravi Kumar, phone sheets as Casey Ward unless the sheet names another person |
| Incoming handover | Per scope in 2.2. Arriving on a page creates no business record |
| Outgoing handover | Per scope in 2.2. Nothing drawn books a visit from a request, authorises work from a coverage decision, releases a hold without its criterion, sends anything to a customer or a manufacturer, posts to MYOB or shows an amount outside a labelled Finance figure. "Issuing sends nothing" appears on every issue form; Customer messages (EC-04) is named wherever anything reaches a customer |
| Exceptions and recovery | Drawn per page (section 3) and on the cross-cutting states: loading permitted evidence, true-empty, filtered-empty, could not load with the last good read kept, denied or not found, stale (a newer save by someone else), partial source, outcome unknown with recovery, read only, bulk action partly failed, permission changed while open, offline per-item states. A count that cannot be read shows a dash and an unavailable or restricted source is never zero |
| Departures | Section 5 |
| Verification | Section 6 |

### 2.2 Per scope

Lifecycles are independent and nothing advances another by itself (SR-04). Dispatch is gated on the exact issued pack, its acknowledgement by the required crew and allowed readiness (SR-07). Review, issue and response are separate and issuing sends nothing (TR-13). Coverage, billability, warranty claim and supplier credit are four decisions by their owners (SR-18). Finance owns charging and MYOB is the book of record.

| Scope and route | Page types | Owns | Incoming handover | Outgoing handover |
|---|---|---|---|---|
| SV-01, SV-02 Service requests, `/service/tickets` | Register; Record detail; Form | The request, its statements and triage. Triage authorises no work and books no visit (TR-01) | Phone, email, manual and portal requests (CP-02); planned maintenance work requests (MA-04); aftercare referrals (CR-05) | A triaged request to a work order (SV-03); clarifications as owned follow-ups to My Work; a Sales lead through Hand to Sales |
| SV-03 Work orders, `/service/work-orders` | Register; Record detail; Form | Scope revisions and their authorisation. Authorisation freezes a revision, records the authoriser and books nothing (TR-02) | Triaged requests (SV-01); warranty remedies (MA-06); occurrences (MA-04); won deals and conversions (CR-03, ES-07); coverage decisions (MA-02) | Authorised scope to planning (PL-01) and packs (SV-05); work-order demand to Supply (SC-01); the handoff to Finance through review (FN-01) |
| PL-01, PL-03, PL-04, PL-05 Schedule, `/schedule` with Capacity review, Changes & follow-up, Policy impact and Travel review | Planner board; Register; Review / comparison; Overview | Bookings: a confirmed booking reserves the whole crew atomically and dispatch stays gated (TR-03); a move is a new confirmed version (TR-08) | Authorised work orders; schedule change requests from Projects (PJ-07, BR-09); impact reviews from Supply (SC-09) | Bookings to Appointment detail and My jobs; decisions on change requests to Projects; customer contact outcomes; scheduling policy versions with their impact |
| SV-04 Appointment detail, `/service/appointments/[id]` | Record detail | The visit's dispatch gate in words: parts, job pack acknowledged, site readiness, site and isolation controls, crew competency | Parts-ready from linked demands (SC-01, SC-10); the issued pack (SV-05); site readiness (FI-05); competence (PL-02) | Dispatch to My jobs; "Dispatch held until …" with its exact criterion |
| PL-02 Field team, `/service/technicians` | Register; Record detail; Panel | Availability and competence evidence for planning | Skill evidence and availability blocks | Competence to the dispatch gate; evidence reviews to My Work |
| SV-05 Job packs, `/service/packs` | Register; Record detail; Form | The pack and the field readiness gate: prepare, check and issue by different people where policy says so (TR-04, TR-05) | Authorised scope; readiness requirements (FI-05); outputs from DK-06 | The issued pack to the crew; acknowledgements and returns (TR-06); OUT-09 output to DK-03 |
| SV-06, FI-07, SV-07, SV-08 Service review, `/service/reports`, `/service/findings`, `/service/escalations` | Register; Record detail; Review; Form | Report review and issue (the author never reviews); the customer response (FI-07); findings by their source record; escalation cases | Submitted visits (TR-11); inspection outcomes (FI-04); responses by link | The issued report revision to Customer messages for sending (EC-04 owns sending); the Finance handoff on approval (FN-01); next actions to My Work; evidence packs a named person sends |
| FI-01 time review, proposed `/service/time` | Register; Record detail (day timeline); Form | Review of recorded time: planned, recorded, reviewed and billable are four rows; recorded time is never edited in place | Timer segments from the phone | Reviewed hours attached to the work order's handoff, which reaches Finance when the report is approved; no rate or amount |
| FI-01, FI-02, FI-05 My jobs, `/my-jobs` and Field site readiness | Phone register; Record detail (Work, Capture, Pack, Finish); full-screen sheets; Review (proposed coordinator site readiness review) | Capture, the timer and acknowledgements by the technician | Dispatched visits; the issued pack; readiness requirements by revision | Atomic submission with time and parts declarations (TR-11); equipment history to EQ-01; parts used to SC-10 |
| FI-03, FI-04 Inspections, `/my-jobs/inspections`, `/service/inspections` | Phone form; Register; Record detail | Attempts, readings with instrument and calibration at use, independent review and the outcome (the fixer never reviews the retest) | Templates and bindings (0055, shared with EN-08); instruments (EQ-09) | Defects to findings; the outcome, which sends nothing |
| FI-06 Incidents and actions, `/service/incidents` | Register; Record detail; Panel; phone form | Reports, triage, holds, corrective actions and closure; only closure releases a hold | Reports from the phone; Critical defects that prompt an incident (PJ-01) | Holds on exact scope to work orders and bookings; corrective actions to My Work; the prepared internal outcome |
| MA-01, MA-02, MA-05 Service agreements, `/maintenance/agreements`, Coverage & entitlement, Renewals & relationship review | Register; Record detail; Form | Agreement revisions, coverage decisions and renewal reviews. Covered authorises nothing | Commissioning obligations (EN-08); the signed contract (DK-01) | Coverage decisions to the work order owner and to Finance; the AgreementCharge handoff; renewal handovers to Sales |
| MA-03, MA-04 Maintenance, `/maintenance/due`, Maintenance plans | Register; Record detail; Review | Plans by revision, occurrences and their generation | Equipment and bulletins (EQ-01, EQ-06) | One owned service request per prepared occurrence (SV-01) |
| MA-06, MA-07 Warranty, `/warranty/cases`, Supplier recovery | Register; Record detail; Form | Cases, entitlement and remedy (proposed by the owner, approved by the named approver) and supplier claims | Bench results (CX-02); technician findings; credit notes observed in MYOB | The customer outcome prepared for EC-04; the supplier claim; a customer credit note request as a finished event; Finance decides goodwill and the credit |
| RP-04 Insights, Service extract | Overview | Nothing: Reporting owns the definitions | Facts already recorded in Service | Every count opens the rows on the page that owns them; "Definition pending" until a measure is published |
| Interaction states and Administration · SV | States; Settings; Review | The rules and lists Service reads its records by | Proposals from an administrator | Published versions with their impact on live visits and packs |

Ownership: SV-03 owns scope authorisation; PL-01 owns bookings, which Projects request; SV-05 owns the pack and the gate; FI-01 owns capture and the timer; SV-06 owns review and issue while Finance owns the handoff; FI-07 owns the response while EC-04 owns sending; MA-02 owns coverage while Finance owns the charge; MA-06 owns entitlement and remedy while Finance owns goodwill and credit and SC-08 owns the goods; EQ-01 owns the installed base.

## 3. Sheet inventory

288 sheets and 17 notes cards on 17 pages. Node IDs are those of the sheet frame in the file "PPO - Service module (proposal)". A sheet label reads `CODE · Page — state (scope ID) [source]`; labels longer than 170 characters are shortened here with an ellipsis, and the file's "Sheet index and notes" card carries every label in full. The bracket at the end of a label names the reference design the sheet was redrawn from.

| Item | Node |
|---|---|
| Read me: header card, "Sheet index and notes", audit card, page template card | `117:66487`, `117:66498`, `118:34901`, `117:66494` |
| Pages: Read me `0:1`, — Accepted — `11:2`, — Proposals — `11:3`, Shell and kit `11:21`, Scratch `11:22` | The separators and Scratch are empty |
| Shell and kit: shell components, shell icons, page kit, tablet and phone chrome, record header toolbar, workspace menus, the Service operations flyout `109:1112`, the hidden helper library | On page `11:21`; local copies until a PPO library is published |

By section (the View column): Desktop 111; Dialog or panel 49, of which one is the flyout sheet FL01; State 53; Tablet 22; Phone 53. By width: 1440 px 190; 1024 px 22; 390 px 72; 320 px 4. Phone-width sheets also sit in the Dialog and State sections of the phone-first pages.

### Service requests · SV-01 · SV-02

Page `11:4` · `scope:SV-01`, `scope:SV-02`, `/service/tickets` · 17 sheets · notes card `53:6032`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| SR01 | Service requests — register, All open, grouped by status (SV-01) [SV-01 1249:9382] | Desktop | 1440 × 900 | `52:941` |
| SR02 | Service requests — two selected, snapshot of SYN-TKT-000212 (SV-01, D2) [SV-01 1254:3846] | Desktop | 1440 × 900 | `52:1785` |
| SR03 | Service requests — Board: New, Needs information, Triaged; the later lanes wait for ADR-0043 (SV-01, D6) [SV-01 1255:2587] | Desktop | 1440 × 900 | `52:2676` |
| SR05 | Service request SYN-TKT-000212 — Triage tab: before triage bar, the reported symptom, possible duplicate, 08:20 (SV-01, SV-02) [SV-01 1255:3172… | Desktop | 1440 × 900 | `52:3077` |
| SR06 | Service request SYN-TKT-000212 — Complete triage, editing inline with the save bar (SV-02, TR-01, N-N5) [SV-01 1256:287381] | Desktop | 1440 × 985 | `52:3505` |
| SR07 | Service request SYN-TKT-000209 — triaged, Linked work: request → work order → appointment; the later lanes wait for ADR-0043 (SV-01) [SV-01 125… | Desktop | 1440 × 900 | `52:3972` |
| SR07b | Service request SYN-TKT-000218 — not a service matter, handed to Sales as an Activity (SV-02, CR-05) [SV-01 states] | Desktop | 1440 × 900 | `52:4346` |
| SR08 | Service request SYN-TKT-000205 — needs information, clarification overdue 3 days, owned follow-up (SV-02) [SV-01 states] | Desktop | 1440 × 900 | `53:4137` |
| SR09 | Service request SYN-TKT-000214 — Updates grouped by day, a statement added from the portal (SV-02) [SV-01 updates] | Desktop | 1440 × 900 | `53:4508` |
| SR04 | Log a request — possible duplicate shown, advisory only: Riverbend pump P2, Ella Brandt, 08:05 (SV-01, D4) [SV-01 1259:3354] | Dialog or panel | 1440 × 900 | `53:3186` |
| SR10 | New service request — shared create form, unknown site with address lookup (SV-01, 6.3) [Create forms 3036:220] | Dialog or panel | 1440 × 900 | `53:3659` |
| SR11 | Service request — save refused: a newer revision was saved by someone else; your note is kept (SV-02) [SV-01 1261:289886] | State | 1440 × 900 | `53:4878` |
| SR12 | Service request — view only: Lee Nakamura reads the record, no commands (SV-01, 4.2) [SV-01 1261:289734] | State | 1440 × 900 | `53:5227` |
| SR01t | Service requests — tablet register (SV-01) [SV-01 1259:288310] | Tablet | 1024 × 768 | `53:5767` |
| SR13p | Service requests — phone register, coordinator (SV-01) [SV-01 1259:289789] | Phone | 390 × 844 | `53:5579` |
| SR14p | Complete triage — full-screen sheet with one error: priority basis missing (SV-02, D5) [SV-01 1259:290321] | Phone | 390 × 844 | `53:5691` |
| FL01 | Service operations flyout — open over Service requests: Create tiles, three columns, Favourites, Saved views, Recent in this file’s story; All 17 Service pages (Shell fl… | Dialog or panel | 1440 × 900 | `109:5460` |

### Work orders · SV-03

Page `11:5` · `scope:SV-03`, `/service/work-orders` · 22 sheets · notes card `51:7865`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| WO01 | Work orders — register, All, grouped by needs attention and planning (SV-03) [SV-03 196:24111] | Desktop | 1440 × 900 | `49:941` |
| WO02 | Work order SYN-WO-000062 — Authorisation tab: readiness 5 of 5, authorised r02, coverage Partly covered → Finance (full length) (SV-03) [SV-03… | Desktop | 1440 × 1290 | `49:1697` |
| WO03 | Work order SYN-WO-000062 — Scope r02, frozen: identification, intervention, inspection (full length) (SV-03) [SV-03 316:639] | Desktop | 1440 × 914 | `49:2244` |
| WO04 | Work order SYN-WO-000062 — Visits: SYN-APT-000083, dispatch held until the isolation approval is recorded, 10:45 (SV-03) [SV-03 318:1001] | Desktop | 1440 × 900 | `49:2741` |
| WO07 | Work order SYN-WO-000059 Sunline — scope needed, coverage unresolved, no visit proposed (SV-03) [SV-03 states 327:31344] | Desktop | 1440 × 900 | `50:3372` |
| WO08 | Work order SYN-WO-000058 CP-4 rectification — work complete, closure blocked: parts unreconciled (full length) (SV-03, TR-15) [SV-03 states] | Desktop | 1440 × 900 | `50:3789` |
| WO09a | Work order SYN-WO-000060 Goulburn — Evidence tab: field entries by visit (full length) (SV-03) [SV-03 318:1769] | Desktop | 1440 × 900 | `50:4220` |
| WO09b | Work order SYN-WO-000062 — History tab: revisions, authorisation, holds and visits (SV-03) [SV-03 318:2514] | Desktop | 1440 × 900 | `50:4642` |
| WO10 | Work order SYN-WO-000062 — Edit scope, successor draft r03 for the recurring fault (SV-03, BR-23) [SV-03 327:45008] | Desktop | 1440 × 900 | `50:5024` |
| WO12 | Work order SYN-WO-000047 Block C — Visits: Mon 16 and Tue 17 Nov proposed, Visit needs review after SYN-SCR-000019 (SV-03) [SV-03 visits] | Desktop | 1440 × 900 | `51:5859` |
| WO14 | Work orders — register with the collapsed strip: wider grid, a column being resized (SV-03, D9) [Shell K 29:3122] | Desktop | 1440 × 900 | `51:6738` |
| WO05 | Review a readiness criterion — Equipment identified by serial, from EQ-01 (SV-03, SR-02) [SV-03 319:2118] | Dialog or panel | 1440 × 900 | `49:3218` |
| WO06 | Ready to authorise — Authorise dialog with a required reason (Jordan Kim) (SV-03, TR-02) [SV-03 320:2567] | Dialog or panel | 1440 × 900 | `50:2569` |
| WO13 | New work order — shared create form: from a request, an occurrence, a warranty remedy or a won deal; linking authorises nothing (SV-03) [Create… | Dialog or panel | 1440 × 900 | `51:6242` |
| WO06b | Ready to authorise — the drafter sees Authorise disabled: You drafted this scope (SV-03, D3, R117) [SV-03 states] | State | 1440 × 900 | `50:2998` |
| WO11a | Authorised with no visit proposed — SYN-WO-000039 as at Thu 29 Oct 14:00 (SV-03) [SV-03 321:2930 states] | State | 1440 × 900 | `51:4782` |
| WO11b | Successor in draft — r02 in force, r03 draft open since 15:02 (SV-03) [SV-03 321:2930] | State | 1440 × 900 | `51:5132` |
| WO11c | Newer version while editing — Jordan Kim saved the r03 draft at 15:06; reload keeps your unsaved note (SV-03, S-33) [SV-03 states] | State | 1440 × 900 | `51:5489` |
| WO01t | Work orders — tablet register (SV-03) [SV-03 tablet] | Tablet | 1024 × 768 | `51:7336` |
| WO02t | Work order SYN-WO-000062 — tablet Authorisation tab (SV-03) [SV-03 tablet] | Tablet | 1024 × 768 | `51:7606` |
| WO15p | Work orders — phone list rows, coordinator (SV-03, W8) [SV-03 196:24496] | Phone | 390 × 844 | `51:7088` |
| WO16p | Work order SYN-WO-000062 — phone record, Details (SV-03) [SV-03 325:4093] | Phone | 390 × 844 | `51:7208` |

### Schedule · PL-01 · PL-03 · PL-04 · PL-05

Page `11:6` · `scope:PL-01`, `scope:PL-03`, `scope:PL-04`, `scope:PL-05`, `/schedule` · 20 sheets · notes card `48:6173`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| PL03 | Schedule — Week, 2 to 8 Nov (PL-01) [PL-01 1221:7163] | Desktop | 1440 × 960 | `42:1866` |
| PL01 | Schedule — Day, Thu 5 Nov, strip collapsed, three vans, two holds, tray (PL-01) [PL-01 1205:52] | Desktop | 1440 × 960 | `43:1541` |
| PL02 | Schedule — Day, visit selected, details panel: SYN-APT-000083 (PL-01, SV-04) [PL-01 1220:7149] | Desktop | 1440 × 960 | `43:1970` |
| PL06 | Changes & follow-up — Needs review, the Changes grid (PL-04) [PL-04 1326:4561] | Desktop | 1440 × 900 | `45:1541` |
| PL07 | Changes & follow-up — SYN-SCR-000019 selected: booked now, crew, travel, versions, what a change sets in motion (PL-04) [PL-04 1326:4656] | Desktop | 1440 × 900 | `45:2029` |
| PL09 | Policy impact review — proposed travel buffer 20 → 25 min, bookings that need review (PL-04 D7) [PL-04 1333:1881] | Desktop | 1440 × 900 | `45:2599` |
| PL10 | Travel review — Casey Ward, Thu 5 Nov: depot → Coastal Herbs → depot (kit) → Hillview (PL-05) [PL-05 1371:3524] | Desktop | 1440 × 900 | `45:3006` |
| PL11 | Travel review — comparing a different order: nothing recalculated, a controlled move is needed (PL-05) [PL-05 1373:1001] | Desktop | 1440 × 900 | `45:3403` |
| PL12 | Capacity review — grid by week, 2 to 15 Nov: Over on Kim Taylor Tue 10 Nov, Workshop as a fourth domain (PL-03) [PL-03 2245:733808] | Desktop | 1440 × 900 | `46:3054` |
| PL13 | Capacity review — Demand list by domain and Skill view: working at heights holders against demand (PL-03) [PL-03 2245:760883, 2245:762282] | Desktop | 1440 × 900 | `46:3419` |
| PL04 | Plan visit from the tray — SYN-TKT-000212 → a proposed visit Fri 6 Nov 13:00, Casey Ward (PL-01, N-N6) [PL-01 1221:276662] | Dialog or panel | 1440 × 960 | `48:4071` |
| PL05 | Move this visit? — after a drag: times compared, site readiness warning, a new confirmed version (PL-01, TR-08) [PL-01 1222:8031] | Dialog or panel | 1440 × 960 | `48:4450` |
| PL08 | Changes & follow-up — stale technician request: Kim Taylor, Westgate, the pack changed since (PL-04) [PL-04 1331:3860] | State | 1440 × 900 | `46:3754` |
| PL16 | Projects reader on a project-linked visit — Jamie Rossi can request a change, not move it (PL-04, BR-09) [PL-01 1214:275856] | State | 1440 × 900 | `46:4193` |
| PL15 | Schedule — last good read after a failure: counts dash, never zero (PL-01, SR-15) [PL-01 1214:276212] | State | 1440 × 960 | `48:4838` |
| PL06t | Changes & follow-up — tablet (PL-04) [PL-04 1333:313396] | Tablet | 1024 × 768 | `48:5389` |
| PL12t | Capacity review — tablet, by week (full length) (PL-03) [PL-03 2245:781167] | Tablet | 1024 × 768 | `48:5645` |
| PL01t | Schedule — tablet day, strip collapsed (full length) (PL-01) [PL-01 1222:9219] | Tablet | 1024 × 768 | `48:5883` |
| PL14 | Schedule — Needs attention and the tray on the coordinator’s phone, 09:10 (PL-01) [PL-01 1223:8067] | Phone | 390 × 844 | `48:5181` |
| PL01p | Schedule — Day on the coordinator’s phone: by technician, Thu 5 Nov (PL-01) [PL-01 1212:273202] | Phone | 390 × 844 | `48:5286` |

### Appointment detail · SV-04

Page `11:7` · `scope:SV-04`, `/service/appointments/[id]` · 9 sheets · notes card `41:3075`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| AP01 | Appointment SYN-APT-000083 — confirmed, dispatch held until the isolation approval is recorded (full length) (SV-04) [SV-04 1191:50] | Desktop | 1440 × 1527 | `40:941` |
| AP02 | Record customer site readiness — dialog: four checks bound to the schedule version (SV-04) [SV-04 1195:266625] | Dialog or panel | 1440 × 900 | `40:1475` |
| AP03 | Ready to dispatch — after Noah Patel recorded the approval by link at 11:20 (SV-04) [SV-04 states] | State | 1440 × 900 | `40:1980` |
| AP04 | Held again by a supply change after it was Ready to dispatch — the booking never moves (SV-04, gate R2) [SV-04 states] | State | 1440 × 900 | `40:2379` |
| AP01t | Appointment SYN-APT-000083 — tablet, dispatch held (full length) (SV-04) [SV-04 1193:264207] | Tablet | 1024 × 820 | `41:2776` |
| AP01p | Appointment SYN-APT-000083 — phone, coordinator, dispatch held, 10:45 (full length) (SV-04) [SV-04 1193:263684] | Phone | 390 × 1058 | `41:2291` |
| AP05a | Proposed, not booked — SYN-APT-000093 Riverbend pump visit, Fri 6 Nov 13:00 (SV-04) [SV-04 1195:1202] | Phone | 390 × 844 | `41:2476` |
| AP05b | Cancelled, read only — SYN-APT-000082 Westgate, Tue 3 Nov: actual work kept (SV-04, TR-16) [SV-04 1195:1880] | Phone | 390 × 844 | `41:2567` |
| AP05c | Site readiness overdue — SYN-APT-000089 Westgate, confirmation window closed Wed 16:00 (SV-04, R8) [SV-04 1195:2409] | Phone | 390 × 844 | `41:2653` |

### Field team · PL-02

Page `11:8` · `scope:PL-02`, `/service/technicians` · 7 sheets · notes card `103:3497`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| FT01 | Field team — Technicians: one row per person, competence for seven days (PL-02) [PL-02 field team] | Desktop | 1440 × 900 | `102:1513` |
| FT02 | Field team — Casey Ward selected, snapshot: today’s visits, van 1, competence summary, handover notes (PL-02) [PL-02 snapshot] | Desktop | 1440 × 900 | `102:1958` |
| FT03 | Technician Casey Ward — evidence bar, details, seven-day availability 07:00 to 18:00, competence, visits (full length) (PL-02) [PL-02 technician record] | Desktop | 1440 × 1027 | `102:2447` |
| FT06 | Field team — Needs preparation: visits without an issued pack within the window (PL-02, SV-05) [PL-02 needs preparation] | Desktop | 1440 × 900 | `102:2916` |
| FT04 | Review competence evidence — Pat Rowe first aid Expired: read-only evidence; Verified, Unverified, Expired; who verified (PL-02) [PL-02 evidence panel] | Dialog or panel | 1440 × 900 | `103:2694` |
| FT05 | Technician record on the phone, view only — Casey Ward sees her appointments without booking rights (PL-02) [PL-02 phone state] | State | 390 × 844 | `103:3102` |
| FT01t | Field team — tablet, Technicians (PL-02) [PL-02 tablet] | Tablet | 1024 × 768 | `103:3234` |

### Job packs · SV-05

Page `11:9` · `scope:SV-05`, `/service/packs` · 18 sheets · notes card `38:6606`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| JP01 | Job packs — register, All (SV-05) [SV-05 272:2038] | Desktop | 1440 × 900 | `35:941` |
| JP02 | Job packs — two selected, small panel: open in sequence, export list (SV-05) [SV-05 295:47432] | Desktop | 1440 × 900 | `35:1539` |
| JP03 | Job pack SYN-PACK-000071 r02 — issued, acknowledged 2 of 2, Job pack view (full length) (SV-05) [SV-05 291:4320] | Desktop | 1440 × 1625 | `35:2185` |
| JP04 | Job pack SYN-PACK-000072 r01 — Preparation view, checked, issue by 12:00 today (full length) (SV-05) [SV-05 288:3252] | Desktop | 1440 × 1204 | `37:1916` |
| JP07 | Job pack SYN-PACK-000070 r01 — returned by the technician: parts list incomplete (full length) (SV-05, gate R3–R6) [SV-05 A1 958:9305] | Desktop | 1440 × 914 | `37:2447` |
| JP08 | Job pack SYN-PACK-000070 — revision history: r01 Draft → Checked → Issued → Returned; r02 Draft (full length) (SV-05) [SV-05 290:4052] | Desktop | 1440 × 900 | `37:2896` |
| JP05 | Queue exact output for r01 — dialog (SV-05) [SV-05 303:6602] | Dialog or panel | 1440 × 900 | `38:2897` |
| JP06a | Check revision — dialog, the checker is not the preparer (SV-05, TR-04) [SV-05 303:6353] | Dialog or panel | 1440 × 900 | `38:3294` |
| JP06b | Return preparation — dialog with a reason, creates the preparer’s task (SV-05) [SV-05 303:6480] | Dialog or panel | 1440 × 900 | `38:3726` |
| JP10 | Withdraw the current issue — dialog, reason required, nothing erased, dispatch held (SV-05) [SV-05 303:6853] | Dialog or panel | 1440 × 900 | `38:4110` |
| JP11 | Record preparation change — material change assessment, dispatch held immediately (SV-05, TR-07) [SV-05 289:3660] | Dialog or panel | 1440 × 900 | `38:4501` |
| JP09 | Source changed since check — recheck required (SV-05, TR-04) [SV-05 306:8133] | State | 1440 × 900 | `38:4898` |
| JP12 | Checked, not issued, past the 12:00 cutoff — KPI-01 warning, still issuable (SV-05, R8) [SV-05 303:5318] | State | 1440 × 900 | `38:5300` |
| JP01t | Job packs — tablet register (SV-05) [SV-05 tablet] | Tablet | 1024 × 768 | `38:6017` |
| JP04t | Job pack SYN-PACK-000072 r01 — tablet preparation view (SV-05) [SV-05 tablet] | Tablet | 1024 × 768 | `38:6340` |
| JP13 | Technician acknowledges issued r02 — the whole current issue, Casey Ward, Wed 4 Nov 12:04 (SV-05, TR-06) [SV-05 307:9341] | Phone | 390 × 844 | `38:5670` |
| JP14a | Return with reason — sheet: six reasons, a required note, optional photo, Kim Taylor, Wed 4 Nov 17:48 (SV-05, gate R3) [SV-05 307:9533] | Phone | 390 × 844 | `38:5801` |
| JP14b | Returned, waiting for the preparer — Kim Taylor’s phone, Thu 5 Nov 07:55 (SV-05, gate R4–R6) [SV-05 304:48130] | Phone | 390 × 844 | `38:5924` |

### Service review · SV-06 · FI-07 · SV-07 · SV-08

Page `11:10` · `scope:SV-06`, `scope:FI-07`, `scope:SV-07`, `scope:SV-08`, `/service/reports`, `/service/findings`, `/service/escalations` · 28 sheets · notes card `84:9083`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| RV01 | Service review — register, All reports, grouped by state (SV-06) [SV-06 1269:3071] | Desktop | 1440 × 900 | `77:941` |
| RV02 | Service review — SYN-RPT-000041 selected, snapshot: Pat Rowe, Mallee Fresh, submitted Wed 4 Nov 17:20 (SV-06) [SV-06 1269:3502] | Desktop | 1440 × 900 | `77:1687` |
| RV03 | SYN-RPT-000041 — Evidence tab, reviewing the submission: entries approved or returned from their rows, one reading returned (no unit), the save bar (SV-06, TR-12) [SV-06… | Desktop | 1440 × 900 | `77:2487` |
| RV04 | SYN-RPT-000041 — Work outcome tab: outcomes per scope item, one Partial becomes remaining work (SV-06, TR-15) [SV-06 1270:3650] | Desktop | 1440 × 900 | `78:1943` |
| RV05 | SYN-RPT-000040 — Reviewed, Customer report tab ready to issue: customer-safe preview; issuing sends nothing (SV-06, TR-13) [SV-06 1271:3920] | Desktop | 1440 × 900 | `78:2386` |
| RV08 | SYN-RPT-000036 — Issued, Customer response tab: one card per subject; Disputed attendance → corrected → With reservations; history below (FI-07) [FI-07 1281:2210] | Desktop | 1440 × 900 | `78:3638` |
| RV09 | Present report — focused view: SYN-RPT-000040 r01 with its exact hash; Return to staff review; Record response; no rail, menu or notes (FI-07) [FI-07 1283:2402] | Desktop | 1440 × 900 | `80:3544` |
| RV10 | Record customer response — inline card: read-only facts, what the response concerns, five choices with what each needs; the mark is not legal signature assurance (full l… | Desktop | 1440 × 1170 | `82:4799` |
| RV13 | Findings — All open, the source record first (SV-07) [SV-07 1291:3220] | Desktop | 1440 × 900 | `82:5216` |
| RV14 | Findings — SYN-RPT-000035 selected, snapshot: what remains, the next action as one owned My Work activity, what closes it (SV-07) [SV-07 1292:3402] | Desktop | 1440 × 900 | `82:5883` |
| RV15 | Recurring fault — Hillview Glasshouse 4 screen drive motors: M-4 Tue 13 Oct (corrected), M-2 now, within 90 days; Request remote diagnosis (SV-07, SV-08) [SV-07 1293:361… | Desktop | 1440 × 900 | `82:6596` |
| RV17 | Escalations — Open cases: Diagnosing 1, Waiting on manufacturer 1, Reply to act on 1 (SV-08) [SV-08 1301:3410] | Desktop | 1440 × 900 | `83:6084` |
| RV18 | SYN-ESC-000003 — Waiting on manufacturer: diagnostics with who, when, result; settings snapshot read only; the evidence pack and what it leaves out (SV-08) [SV-08 1302:3… | Desktop | 1440 × 900 | `83:6566` |
| RV20 | SYN-ESC-000001 — Reply to act on: the reply with attachments; Create finding and next action; a settings change needs the grower’s approval (SV-08) [SV-08 1304:3990] | Desktop | 1440 × 900 | `83:7367` |
| RV22 | Commissioning handover received — SYN-CMS-000012 Hillview CP-4: Training, Manual, BackupReference, WarrantyMaintenance; Accept for Service or Return (EN-08, MA-01) [EN-0… | Desktop | 1440 × 900 | `83:8132` |
| RV06 | Issue report — dialog: exact revision r01, OUT-10, audience, what happens next (SV-06, TR-13) [SV-06 1272:4012] | Dialog or panel | 1440 × 900 | `78:2795` |
| RV11 | Correct or clarify — the Disputed attendance response kept as fixed facts; a correction with a reason makes a successor (FI-07) [FI-07 1285:2790] | Dialog or panel | 1440 × 900 | `80:4175` |
| RV16 | Needs an owner — assigning the next action: owner, due time, instruction, evidence needed (SV-07) [SV-07 1294:3790] | Dialog or panel | 1440 × 900 | `82:6973` |
| RV19 | Record as sent — who, how (mailbox or portal), when, the manufacturer’s reference, expected reply; PPO sends nothing (SV-08) [SV-08 1303:3801] | Dialog or panel | 1440 × 900 | `83:6969` |
| RV21 | Prepare evidence pack — review before it is recorded as sent: HTML and PDF with hashes; customer contact details and prices left out (SV-08) [SV-08 1303:3700] | Dialog or panel | 1440 × 900 | `83:7749` |
| RV07 | SYN-RPT-000039 — Returned to technician: Kim Taylor, two readings without units; the visit stays Completed pending review (SV-06, TR-12) [SV-06 states] | State | 1440 × 900 | `78:3226` |
| RV12a | Save not confirmed — the response was sent but PPO did not confirm it; Check receipt and Retry unchanged (FI-07) [FI-07 1286:2950] | State | 1440 × 900 | `80:4587` |
| RV12b | Response refused — the attendance it answers was corrected at 08:50; kept, not saved; present the corrected facts (FI-07) [FI-07 1286:3120] | State | 1440 × 900 | `80:4957` |
| RV01t | Service review — tablet register, All reports (SV-06) [SV-06 tablet] | Tablet | 1024 × 768 | `84:7948` |
| RV03t | SYN-RPT-000041 — tablet Evidence tab, reviewing entries (SV-06) [SV-06 tablet] | Tablet | 1024 × 768 | `84:8293` |
| RV08t | SYN-RPT-000036 — tablet Customer response tab, one card per subject (FI-07) [FI-07 tablet] | Tablet | 1024 × 768 | `84:8585` |
| RV01p | Service review on the coordinator’s phone — reports by state, Ravi Kumar, 09:05 (SV-06, W8) [SV-06 phone] | Phone | 390 × 844 | `84:8838` |
| RV10p | Record customer response — full-screen sheet on the phone: SYN-RPT-000040 r01, five choices, name and role, the mark (full length) (FI-07, SV-06 D) [FI-07 1284:2780] | Phone | 390 × 970 | `84:8963` |

### Time and labour review · FI-01

Page `11:11` · `scope:FI-01` time review, proposed `/service/time` (no route exists) · 14 sheets · notes card `89:5319`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| TL01 | Time & labour review — register, To review, strip collapsed: planned, recorded, reviewed and billable as four columns (FI-01 time review) [time review 1402:2210] | Desktop | 1440 × 900 | `87:941` |
| TL02 | SYN-APT-000079 Casey Ward, Tue 3 Nov, Goulburn — day timeline: four rows, segments by kind with words, evidence markers (full length) (FI-01 time review) [time review 14… | Desktop | 1440 × 966 | `87:1383` |
| TL04 | SYN-APT-000079 — Query tab: Riley’s question at 09:06 and Casey’s reply at 09:34, quoted as written (FI-01 time review) [time review 1404:2650] | Desktop | 1440 × 900 | `88:1774` |
| TL06 | SYN-APT-000079 — Billable marking with reasons: Work billable, Travel non-billable by default, Waiting billable (customer-caused); no amount (FI-01 time review) [time re… | Desktop | 1440 × 900 | `88:2558` |
| TL08 | SYN-APT-000079 — Reviewed and sent; History: the original beside the reviewed version, every change with actor, time and reason (FI-01 time review) [time review 1408:335… | Desktop | 1440 × 900 | `89:3362` |
| TL10 | Time & labour review — Exceptions: outside hours, long wait, time against a cancelled visit, query with no reply; each with its own side form (FI-01 time review) [time r… | Desktop | 1440 × 900 | `89:3783` |
| TL11 | Multi-visit allowance by crew and day — Block C, two days (rolled forward): work left is a best guess; the request to the planner; allowance Not established (FI-01 time… | Desktop | 1440 × 900 | `89:4160` |
| TL03 | Query the technician — about the 50 min wait, Riley Tran, 09:06 (FI-01 time review) [time review 1404:2510] | Dialog or panel | 1440 × 900 | `87:1858` |
| TL05 | Adjust a segment — Waiting 0 h 50 → 0 h 35 with a reason; the original kept; the technician sees both (FI-01 time review) [time review 1405:2790] | Dialog or panel | 1440 × 900 | `88:2151` |
| TL07a | Accept reviewed time — a short centred dialog, 09:50 (FI-01 time review) [time review 1407:3070] | Dialog or panel | 1440 × 900 | `88:2984` |
| TL07b | Send with the Finance handoff — attaches reviewed hours to SYN-FH-000044; it reaches Finance when Service review approves the report, 09:52 (FI-01 time review, FN-01) [t… | Dialog or panel | 1440 × 900 | `88:3423` |
| TL12 | Kim Taylor’s timer left running overnight — coordinator view, 07:40: flagged at 12 h; only Kim sets the finish, within 48 h, with a reason; nothing silently ended (FI-01… | State | 1440 × 900 | `89:4535` |
| TL02t | SYN-APT-000079 — tablet day timeline, four rows and segments (full length) (FI-01 time review) [time review tablet] | Tablet | 1024 × 768 | `89:4990` |
| TL09 | My time — Casey Ward: recorded and in review, no billable; a question waiting; her reply waiting to send, 09:31 (FI-01 time review) [time review 1410:3630] | Phone | 390 × 844 | `89:4879` |

### My jobs · FI-01 · FI-02 · FI-05

Page `11:12` · `scope:FI-01`, `scope:FI-02`, `scope:FI-05`, `/my-jobs` · 41 sheets · notes card `32:4729`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| MJ22a | My jobs — desktop register, today, Casey Ward, 13:20 (FI-01) [FI-01 861:1445] | Desktop | 1440 × 900 | `28:3349` |
| MJ22b | Visit — Work tab on desktop, working, 13:20 (FI-01) [FI-01 862:1737] | Desktop | 1440 × 900 | `28:3825` |
| MJ22c | Visit — Capture tab on desktop, 15:04 (FI-01, FI-02) [FI-01 864:2027] | Desktop | 1440 × 900 | `28:4197` |
| MJ23 | Site readiness review — coordinator view, upcoming visits, read only (proposed, FI-05 D7) [FI-05 2340:3414] | Desktop | 1440 × 900 | `28:4617` |
| MJ06 | Pause — choose a reason, 13:41 (FI-01) [FI-01 854:789, timer r05] | Dialog or panel | 390 × 844 | `27:2403` |
| MJ08 | Add a photo after taking it, 15:01 (FI-01, FI-02) [FI-01 851:725] | Dialog or panel | 390 × 844 | `27:2553` |
| MJ09 | Add a reading: value, unit and instrument, calibration expired → flagged, 14:58 (FI-01, FI-02) [FI-01 851:834] | Dialog or panel | 390 × 844 | `27:2706` |
| MJ10 | Record equipment history: motor M-2 replaced, hand-off to EQ-01, 14:55 (FI-01, EQ-01) [FI-01 visit capture] | Dialog or panel | 390 × 844 | `27:2874` |
| MJ14b | Waiting to send — one item needs attention, the rest keep sending, 15:31 (FI-01, A19) [FI-01 855:1069] | Dialog or panel | 390 × 844 | `27:3025` |
| MJ19b | Set when you finished: Kim Taylor, timer left running since Wed 16:05, 07:44 (FI-01) [timer r05 876:3289] | Dialog or panel | 390 × 844 | `27:3163` |
| MJ19c | Another job is timing: Kim Taylor tries to start Hillcrest, 07:50 (FI-01) [timer r05] | Dialog or panel | 390 × 844 | `27:3266` |
| MJ20b | End of day 1: how much work is left? Pat Rowe, Block C, Mon 16 Nov 16:00 (rolled forward) (FI-01) [time review D16] | Dialog or panel | 390 × 844 | `27:3417` |
| MJ12b | Finish — submit refused while your timer is running, 15:50 (FI-01, TR-11) [FI-01 states] | State | 390 × 844 | `27:3541` |
| MJ19a | Timer left running overnight: Kim Taylor, Wed 16:05 → Thu 07:42, flagged at 12 h (FI-01) [timer r05 876:3289] | State | 390 × 844 | `27:3677` |
| MJ19d | Timer stopped with Undo for 8 s: Kim Taylor, Glasshouse Valley, Tue 3 Nov 16:03 (FI-01) [timer r05] | State | 390 × 844 | `27:3789` |
| MJ24a | My jobs — couldn't refresh, last loaded 15:00 (FI-01) [FI-01 856:1210] | State | 390 × 844 | `27:3916` |
| MJ24b | My jobs — no visits today, Sat 7 Nov (FI-01) [FI-01 856:1487] | State | 390 × 844 | `27:4014` |
| MJ24c | Visit — permission changed while open: crew changed at 14:10, nothing ended silently (FI-01) [FI-01 states] | State | 390 × 844 | `27:4107` |
| MJ22t | My jobs — tablet register, today, Casey Ward (FI-01) [FI-01 865:2339] | Tablet | 1024 × 768 | `28:5201` |
| MJ22u | Visit — tablet Work tab, working (FI-01) [FI-01 865:2756] | Tablet | 1024 × 768 | `28:5500` |
| MJ01 | My jobs — today, Casey Ward, 13:20, timer pinned (FI-01) [FI-01 849:56] | Phone | 390 × 844 | `22:941` |
| MJ02 | My jobs — today at 320 (FI-01) [FI-01 849:250] | Phone | 320 × 844 | `22:1087` |
| MJ03 | Visit — can't start yet: dispatch held until the isolation approval is recorded, 11:10 (FI-01, FI-05) [A1 959:243133] | Phone | 390 × 844 | `22:1208` |
| MJ04 | Visit — ready to start, 12:58 (FI-01) [FI-01 850:314] | Phone | 390 × 844 | `22:1378` |
| MJ05 | Visit — working, Work tab, timer running, 13:20 (FI-01) [FI-01 850:438, timer r05] | Phone | 390 × 844 | `22:1550` |
| MJ07 | Visit — Capture tab, no signal, 4 items waiting, 15:04 (FI-01, FI-02) [FI-01 851:423] | Phone | 390 × 844 | `22:1691` |
| MJ11 | Visit — Pack tab, the whole current issue r02, acknowledged (FI-01, SV-05) [FI-01 visit tabs] | Phone | 390 × 844 | `22:1874` |
| MJ12 | Visit — Finish tab, stopped, declarations and how much work is left, 15:52 (full length) (FI-01) [FI-01 854:926] | Phone | 390 × 1560 | `22:2061` |
| MJ13a | Visit — submitted, completed pending review, 15:56 (FI-01) [FI-01 states] | Phone | 390 × 844 | `25:1576` |
| MJ13b | Visit — your part submitted, waiting for the crew (FI-01) [FI-01 states] | Phone | 390 × 844 | `25:1707` |
| MJ14a | My jobs — no signal, 4 items waiting to send, 15:10 (FI-01, A19) [A19 1070:13127] | Phone | 390 × 844 | `25:1811` |
| MJ15a | More — what works without signal (FI-01, D-016) [A19 1070:13206] | Phone | 390 × 844 | `25:1931` |
| MJ15b | My jobs — kept drafts after the copy ended, Fri 6 Nov 15:30 (FI-01, A19) [A19 1070:13206] | Phone | 390 × 844 | `25:2070` |
| MJ17a | Site readiness — requirement detail: shade screen isolation approval, after 11:20 (FI-05) [FI-05 2338:816] | Phone | 390 × 844 | `25:2166` |
| MJ17b | Site readiness — biosecurity rules for Glasshouse 4 with the zone sketch (FI-05) [FI-05 2338:816] | Phone | 390 × 844 | `25:2261` |
| MJ18a | Site readiness — changed since you acknowledged: crop-restriction zone, rev 3 → rev 4 (FI-05) [FI-05 states] | Phone | 390 × 844 | `25:2359` |
| MJ18b | Site readiness — acknowledgements queued without signal (FI-05, A19) [FI-05 states] | Phone | 390 × 844 | `25:2463` |
| MJ20a | Visit — multi-day job, Pat Rowe, Block C day 1 of 2, Mon 16 Nov (rolled forward) (FI-01) [time review D16] | Phone | 390 × 844 | `25:2579` |
| MJ16 | Site readiness for your next visit: Hillview Glasshouse 4, 5 of 6, 10:30 (full length) (FI-05) [FI-05 2338:816] | Phone | 390 × 1646 | `25:2848` |
| MJ16b | Site readiness at 320 (full length) (FI-05) [FI-05 2339:798453] | Phone | 320 × 1830 | `25:3023` |
| MJ21 | Customer response with a mark — after review: Noah Patel, SYN-RPT-000036 r01, Thu 15 Oct (FI-07) [FI-01 854:1154] | Phone | 390 × 844 | `27:4219` |

### Inspections · FI-03 · FI-04

Page `11:13` · `scope:FI-03`, `scope:FI-04`, `/my-jobs/inspections`, `/service/inspections` · 15 sheets · notes card `55:4032`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| IN04 | Inspection review — register, All attempts grouped by review state, Riley Tran (FI-04) [FI-04 1339:4220] | Desktop | 1440 × 900 | `55:1277` |
| IN05 | SYN-INS-000021 attempt 2 — retest, Readings, awaiting review: value, criterion, result in words, instrument and calibration (FI-04) [FI-04 1339… | Desktop | 1440 × 900 | `55:1885` |
| IN07 | SYN-INS-000020 — accepted, Outcome tab: the prepared internal outcome with its hash; Issue outcome sends nothing (FI-04) [FI-04 1339:4684] | Desktop | 1440 × 900 | `55:2791` |
| IN10 | Inspection capture — draft on desktop, Kim Taylor, 2 of 4 (FI-03) [FI-03 1339:317844] | Desktop | 1440 × 900 | `55:3153` |
| IN03 | Submit inspection — sheet: 1 check failed, names the failing check and the defect it raises, 09:40 (FI-03) [FI-03 1343:3284] | Dialog or panel | 390 × 844 | `54:1527` |
| IN06 | SYN-INS-000021 attempt 1 — failed check, review decision panel (FI-04) [FI-04 1339:4542] | Dialog or panel | 1440 × 900 | `55:2362` |
| IN09a | Not connected — last saved 09:32, new values are not saved until signal returns (FI-03) [FI-03 1344:3746] | State | 390 × 844 | `55:3445` |
| IN09b | Uncertain submit — the server did not confirm; check receipt before submitting again (FI-03) [FI-03 1344:3909] | State | 390 × 844 | `55:3536` |
| IN09c | Can’t record yet — not attending: Lakeside valve check opens when the visit starts (FI-03) [FI-03 1344:4086] | State | 390 × 844 | `55:3623` |
| IN09d | Instrument expired at use — reading kept and flagged, it cannot pass (FI-03, EQ-09) [FI-03 states] | State | 390 × 844 | `55:3694` |
| IN04t | Inspection review — tablet register (FI-04) [FI-04 1339:4792] | Tablet | 1024 × 768 | `55:3779` |
| IN01 | My inspections — assigned visits, Kim Taylor, 08:05 (FI-03) [FI-03 1339:317656] | Phone | 390 × 844 | `54:941` |
| IN02 | Inspection capture — draft, 2 of 4 checks, online only, last saved 09:32 (full length) (FI-03) [FI-03 1339:317680] | Phone | 390 × 1326 | `54:1061` |
| IN02b | Inspection capture at 320 (full length) (FI-03) [FI-03 1344:3577] | Phone | 320 × 1388 | `54:1225` |
| IN08 | Reviewer’s Retests tab on the phone — the chain from failure to outcome, Riley Tran (FI-04) [FI-04 1339:4851] | Phone | 390 × 844 | `54:1389` |

### Incidents and actions · FI-06

Page `11:14` · `scope:FI-06`, `/service/incidents` · 13 sheets · notes card `63:3695`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| IC01 | Incidents and actions — register, All, grouped by state (FI-06) [FI-06 1348:3008] | Desktop | 1440 × 900 | `56:941` |
| IC02 | SYN-INC-000010 — submitted, scope held, Factual report; the hold card first (FI-06) [FI-06 1348:3253] | Desktop | 1440 × 1112 | `56:1497` |
| IC04 | SYN-INC-000009 — Actions and evidence, accepting evidence: a separate person accepts or returns (FI-06) [FI-06 1348:3516] | Desktop | 1440 × 900 | `56:2363` |
| IC03 | Triage — assessment, priority Routine, accountable owner, due and a written basis (FI-06) [FI-06 1348:3382] | Dialog or panel | 1440 × 900 | `56:1927` |
| IC05 | SYN-INC-000009 — accepted, ready to close; Close incident releases the hold that SYN-WO-000062 item 2 depended on (FI-06) [FI-06 1348:4410] | Dialog or panel | 1440 × 900 | `56:2810` |
| IC06c | Submit incident — the scope is held until closure; submitting needs signal (FI-06) [FI-06 1354:3275] | Dialog or panel | 390 × 844 | `60:2896` |
| IC08a | Not connected — last saved 14:16; answers since are on screen, not saved; Submit needs signal (FI-06) [FI-06 1354:3435] | State | 390 × 844 | `63:2795` |
| IC08b | Uncertain submit — PPO could not confirm the submit; check before trying again (FI-06) [FI-06 1354:3571] | State | 390 × 844 | `63:2893` |
| IC08c | Restricted evidence withheld from a viewer — SYN-INC-000010 read only, Lee Nakamura (FI-06) [FI-06 1348:3253] | State | 1440 × 900 | `66:3396` |
| IC01t | Incidents and actions — tablet register, All, grouped by state (FI-06) [FI-06 1348:3756] | Tablet | 1024 × 768 | `63:3386` |
| IC06 | Report an incident — draft, near miss, Goulburn boiler room, as drawn Tue 3 Nov 14:18 (full length) (FI-06) [FI-06 1348:3985] | Phone | 390 × 1687 | `60:2532` |
| IC06b | Report an incident at 320 (full length) (FI-06) [FI-06 1354:3721] | Phone | 320 × 1815 | `60:2714` |
| IC07 | Reporter view — SYN-INC-000010 submitted and held; restricted evidence withheld, Casey Ward, 09:00 (FI-06) [FI-06 1348:4149] | Phone | 390 × 844 | `60:3016` |

### Service agreements · MA-01 · MA-02 · MA-05

Page `11:15` · `scope:MA-01`, `scope:MA-02`, `scope:MA-05`, `/maintenance/agreements` with Coverage & entitlement and Renewals & relationship review · 20 sheets · notes card `94:7116`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| AG01 | Service agreements — register, All agreements, status always in words (MA-01) [MA-01 agreements] | Desktop | 1440 × 900 | `90:941` |
| AG02 | SYN-AGR-000031 Hillview Growers r02 — Terms: commitments as written with clause numbers, no response clock; MYOB reference read only; the signed contract in the Document… | Desktop | 1440 × 970 | `90:1609` |
| AG03a | SYN-AGR-000031 — Coverage tab: covered equipment and facilities, exclusions (MA-01, MA-02) [MA-01 coverage] | Desktop | 1440 × 900 | `90:2040` |
| AG03b | SYN-AGR-000031 — Equipment & areas tab: what the agreement covers, read from Equipment (MA-01, EQ-01) [MA-01 equipment] | Desktop | 1440 × 900 | `90:2469` |
| AG04a | SYN-AGR-000031 — Maintenance plans tab: SYN-MPL-000034 annual screen drive service (MA-01, MA-03) [MA-01 plans] | Desktop | 1440 × 900 | `92:2211` |
| AG04b | SYN-AGR-000031 — Assessments tab and History: SYN-ENT-000042 Partly covered, the earlier SYN-ENT-000039 Historical (MA-02) [MA-02 assessments] | Desktop | 1440 × 900 | `92:2623` |
| AG06 | Coverage to decide — SYN-WO-000059 Sunline (no agreement) and SYN-TKT-000215 Coastal Herbs (Cannot tell) (MA-02) [MA-02 coverage] | Desktop | 1440 × 900 | `92:3476` |
| AG07 | Coverage decision SYN-ENT-000042 — Partly covered: labour Covered clause 4.2, motor Not covered under supplier warranty SYN-WAR-000012; event date Tue 3 Nov; Covered aut… | Desktop | 1440 × 900 | `92:3889` |
| AG09 | Renewals — grouped by window: 90 days before the end or 30 before notice; SYN-RNW-000004 Lakeside at Customer review (MA-05) [MA-05 renewals] | Desktop | 1440 × 900 | `93:4545` |
| AG10a | SYN-RNW-000004 — renewal review at Customer review: the brief drafted from Service history, reviewed by the renewal owner (MA-05, N-N12) [MA-05 renewal record] | Desktop | 1440 × 900 | `93:4971` |
| AG05 | Add source revision — r03 Proposed: CP-4 climate screens from the commissioning handover; r02 kept with its decisions; awaits Finance approval (MA-01) [MA-01 source revi… | Dialog or panel | 1440 × 900 | `92:3055` |
| AG08a | Record entitlement decision — four words, Disputed and Not applicable under More; Cannot tell needs an owner and a dated review (MA-02) [MA-02 decision form] | Dialog or panel | 1440 × 900 | `93:3772` |
| AG10b | Hand over to Sales — a relationship Activity for the deal owner; nothing changes terms or invents value (MA-05, CR-05) [MA-05 hand-over] | Dialog or panel | 1440 × 900 | `93:5337` |
| AG10c | Start renewal review — the window opened Fri 2 Oct, 90 days before Thu 31 Dec; owner and brief (MA-05) [MA-05 start review] | Dialog or panel | 1440 × 900 | `93:5712` |
| AG08b | SYN-ENT-000044 — Cannot tell: Coastal Herbs tank sensor, owner Ravi Kumar, review Mon 9 Nov; Finance holds the charge (MA-02) [MA-02 states] | State | 1440 × 900 | `93:4200` |
| AG12a | Read only — Riley Tran without maintenance edit rights: the agreement is readable, no commands, the reason stated (MA-01, 4.2) [MA-01 states] | State | 1440 × 900 | `94:5705` |
| AG12b | Partial source — SYN-AGR-000030 Coastal Herbs from a legacy scan: clause list incomplete; decisions that need a missing clause read Cannot tell (MA-01) [MA-01 states] | State | 1440 × 900 | `94:6073` |
| AG12c | Agreement ended during the job — the event date governs; work after the end with no renewal in force reads Not covered (illustration, SYN-AGR-000029 after Thu 31 Dec) (M… | State | 1440 × 900 | `94:6463` |
| AG02t | SYN-AGR-000031 — tablet Terms: commitments as written, no response clock (full length) (MA-01) [MA-01 tablet] | Tablet | 1024 × 768 | `94:6828` |
| AG11 | Coverage check on the technician’s phone — the answer first: Partly covered, the lines, why; this authorises nothing, Casey Ward, 12:50 (MA-02) [MA-02 phone] | Phone | 390 × 844 | `94:5598` |

### Maintenance · MA-03 · MA-04

Page `11:16` · `scope:MA-03`, `scope:MA-04`, `/maintenance/due` with Maintenance plans · 18 sheets · notes card `97:6487`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| MP01 | Due maintenance — All open, grouped by target week: Overdue, This week, Next week, Week of 16 Nov, Later (MA-04) [MA-04 due maintenance] | Desktop | 1440 × 900 | `95:941` |
| MP02 | SYN-MOC-000121 Coastal Herbs pump service — Scheduled, Obligation tab: the maintenance checks bar; fixed facts original due, plan revision, equipment snapshot; the agree… | Desktop | 1440 × 900 | `95:1658` |
| MP03a | SYN-MOC-000118 Mallee Fresh — Work tab: the work order and booking read only (MA-04) [MA-04 occurrence work] | Desktop | 1440 × 900 | `95:2067` |
| MP03b | SYN-MOC-000118 — Evidence tab: tasks completed only from the exact reviewed report revision; one task Partial → Prepare follow-on Service request (M-R4) (MA-04) [MA-04 o… | Desktop | 1440 × 900 | `95:2449` |
| MP06 | SYN-MOC-000119 Westgate — Deferred, Exceptions tab: customer not ready; target Thu 12 Nov; lateness against the original due visible (MA-04) [MA-04 occurrence exceptions] | Desktop | 1440 × 900 | `96:3426` |
| MP07 | Maintenance plans — All plans: To review 1 (Hillcrest), Reviewed, Held 1 (Lakeside, pending renewal) (MA-03) [MA-03 plans] | Desktop | 1440 × 900 | `96:3818` |
| MP08 | Plan SYN-MPL-000031 r2 Mallee Fresh quarterly — Task revisions: tasks per revision, interval with anchor and Australia/Adelaide, covered equipment; occurrences keep thei… | Desktop | 1440 × 900 | `96:4382` |
| MP04 | Prepare work request — SYN-MOC-000122 Hillview: one owned service request; the work order created with the plan’s tasks (M-R2); the Covered entitlement for the original… | Dialog or panel | 1440 × 900 | `96:2211` |
| MP05b | Defer or skip — owner (resolves no owner), action, a later target within the agreement, reason, source evidence; the original due kept (MA-04) [MA-04 defer] | Dialog or panel | 1440 × 900 | `96:3006` |
| MP09 | Generate due work — preview: every date in the window, “Already exists · kept”; creates due work only; window 3 months (built limit 1 to 12) (MA-03) [MA-03 generate] | Dialog or panel | 1440 × 900 | `97:4099` |
| MP10 | Propose successor r3 — effective date, owner, and a reviewer other than the proposer (MA-03) [MA-03 successor] | Dialog or panel | 1440 × 900 | `97:4493` |
| MP05a | SYN-MOC-000120 — Overdue with no owner: the owner is required before any action; the plan is Held pending renewal (MA-04) [MA-04 states] | State | 1440 × 900 | `96:2621` |
| MP11a | Plan changed after generation — the occurrence keeps the revision it was generated from (MA-03) [MA-03 states] | State | 1440 × 900 | `97:4882` |
| MP11b | Generate again — every date already exists; nothing is created (MA-03) [MA-03 states] | State | 1440 × 900 | `97:5235` |
| MP11c | Evidence partly received — SYN-MOC-000118: 3 tasks reported done, 1 Partial; the report is still in review (MA-04) [MA-04 states] | State | 1440 × 900 | `97:5588` |
| MP01t | Due maintenance — tablet worklist, All open by target week (MA-04) [MA-04 tablet] | Tablet | 1024 × 768 | `97:6190` |
| MP12a | Due maintenance on the coordinator’s phone — All open, by target week, 09:10 (MA-04, W8) [MA-04 phone] | Phone | 390 × 844 | `97:5962` |
| MP12b | Occurrence on the coordinator’s phone — SYN-MOC-000122 Due, Obligation: fixed facts and Prepare work request (MA-04, W8) [MA-04 phone record] | Phone | 390 × 844 | `97:6087` |

### Warranty · MA-06 · MA-07

Page `11:17` · `scope:MA-06`, `scope:MA-07`, `/warranty/cases` with Supplier recovery · 17 sheets · notes card `100:5311`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| WR01 | Warranty — register, All cases grouped by status; supplier recovery open 2 (MA-06) [MA-06 cases] | Desktop | 1440 × 900 | `98:941` |
| WR02 | SYN-WAR-000012 Shade screen motor M-4 — Failure tab: the case checks bar; details from MYOB read only; people; source SYN-WO-000040 (MA-06) [MA-06 case record] | Desktop | 1440 × 900 | `98:1587` |
| WR03 | SYN-WAR-000012 — Entitlement tab: Covered: installed Mar 2025, 24-month parts term, agreement read; proposed by Ravi, approved by Jordan Kim; dates alone never decide (f… | Desktop | 1440 × 900 | `98:2022` |
| WR04 | SYN-WAR-000012 — Cause & evidence: the bench result on SYN-RTN-000017 “winding failure” (CX-02); Casey’s failure evidence from the phone; documents linked in SharePoint… | Desktop | 1440 × 900 | `98:2445` |
| WR05 | SYN-WAR-000012 — Remedy and customer outcome: Replace approved by Jordan Kim → work request → SYN-WO-000062; the outcome prepared and handed to Customer messages (M5, a… | Desktop | 1440 × 900 | `99:2221` |
| WR06a | SYN-WAR-000012 — Supplier recovery tab: SYN-SCL-000320 to SYN Drive Systems Submitted Tue 3 Nov; four amounts as Finance figures; supplier approval is not a credit; good… | Desktop | 1440 × 900 | `99:2643` |
| WR06b | Supplier recovery — register: two open claims; amounts are Finance figures; a credit that differs is recorded by Finance (MA-07) [MA-07 register] | Desktop | 1440 × 900 | `99:3077` |
| WR07 | Decide entitlement — SYN-WAR-000014 PT-10: Unclear · needs evidence, the install date is missing; returned unit SYN-RTN-000019 Received (MA-06) [MA-06 decide] | Dialog or panel | 1440 × 900 | `99:3485` |
| WR08a | Approve remedy — the service manager approves; approver and time; goodwill limits A$1,000 excl. GST a case, above it Dean (proposed) (MA-06) [MA-06 approve remedy] | Dialog or panel | 1440 × 900 | `99:3931` |
| WR08b | Prepare customer outcome — contents and exclusions; handed to Customer messages for a second person to send (MA-06, EC-04) [MA-06 outcome] | Dialog or panel | 1440 × 900 | `99:4363` |
| WR09 | SYN-WAR-000013 Westgate — goodwill credit saved; the MYOB send not confirmed: checked, never posted twice (MA-06, S7) [MA-06 states] | State | 1440 × 900 | `100:4110` |
| WR01t | Warranty — tablet register, All cases (MA-06) [MA-06 tablet] | Tablet | 1024 × 768 | `100:5018` |
| WR10a | Add failure evidence on the technician’s phone — SYN-WAR-000015 Hillcrest dosing pump noise, Kim Taylor, 09:55 (MA-06, A52) [MA-06 phone] | Phone | 390 × 844 | `100:4515` |
| WR10b | Read only without warranty edit rights — Casey Ward reads SYN-WAR-000012; no commands, the reason stated (MA-06) [MA-06 phone states] | Phone | 390 × 844 | `100:4625` |
| WR10c | Entitlement unclear on the phone — SYN-WAR-000014 PT-10: needs evidence; what would decide it, Casey Ward (MA-06) [MA-06 phone states] | Phone | 390 × 844 | `100:4715` |
| WR01p | Warranty on the coordinator’s phone — cases by status, 09:15 (MA-06, W8) [MA-06 phone] | Phone | 390 × 844 | `100:4797` |
| WR02p | Warranty case on the coordinator’s phone — SYN-WAR-000012, the case checks and the next step (MA-06, W8) [MA-06 phone record] | Phone | 390 × 844 | `100:4906` |

### Insights · RP-04

Page `11:18` · the Service extract of `scope:RP-04` · 5 sheets · notes card `101:2425`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| IS01 | Service performance — Service view: field readiness first, scheduling, outcomes, data quality, REP-12 maintenance, capacity context; every tile states its rule or Defini… | Desktop | 1440 × 1009 | `101:941` |
| IS02 | Service Pulse — day start (proposed): Focus for today ranked by rule, Ravi Kumar, 09:00 (full length) (RP-04, N-N1) [proposed] | Desktop | 1440 × 1050 | `101:1277` |
| IS03 | Drill-through — KPI-01 to its rows: the six visits measured this week, 5 issued by the cutoff (RP-04 extract) [RP-04 drill-through] | Desktop | 1440 × 900 | `101:1636` |
| IS01t | Service performance — tablet, field readiness first (RP-04 extract) [RP-04 tablet] | Tablet | 1024 × 768 | `101:2112` |
| IS02p | Service Pulse on the coordinator’s phone — Focus for today in rule order, 08:55 (RP-04, N-N1, W8) [proposed] | Phone | 390 × 844 | `101:2300` |

### Interaction states · SV

Page `11:19` · app-wide states for Service; no route · 13 sheets · notes card `105:3109`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| ST01 | Interaction states and accessibility — register rows and headers, inline edit, address lookup, state chips per lifecycle, gate chips, planner blocks, timer dock, offline… | Desktop | 1440 × 3097 | `104:941` |
| PS01 | Loading permitted evidence — Work orders: skeleton rows; counts read a dash until they are known (SV, page states) [PS loading] | State | 1440 × 900 | `105:1161` |
| PS02 | Filtered, nothing matches — Service requests: the filters restated, each can be cleared (SV-01, page states) [PS filtered-empty] | State | 1440 × 900 | `105:1608` |
| PS03 | Denied or not found — Lee Nakamura reads SYN-WO-000060: coverage and charge withheld, restricted incident evidence withheld, the rest readable; a record Lee may not open… | State | 1440 × 900 | `105:1969` |
| PS04 | Bulk action partly failed — Service requests: Export list of 3: 2 exported, 1 changed while exporting; retry that one (SV-01, page states) [PS bulk partial] | State | 1440 × 900 | `105:2332` |
| PS05 | Offline items seen from the desk — SYN-WO-000038 Evidence: Pat Rowe’s phone still holds one segment; per-item states, nothing assumed (SV-03, FI-01, page states) [PS off… | State | 1440 × 900 | `105:2733` |
| PS06 | True-empty — Service requests, My requests for Jordan Kim: a verified 0, with what would appear here (SV-01, page states) [PS true-empty] | State | 1440 × 900 | `112:2647` |
| PS07 | Could not load — Work orders: the 08:40 read kept, counts read a dash, Try again (SV-03, SR-15, page states) [PS could not load] | State | 1440 × 900 | `112:2998` |
| PS08 | Stale — a newer version was saved by someone else while you were editing; reload keeps your unsaved note (SV-03, S-33, page states) [PS stale] | State | 1440 × 900 | `112:3402` |
| PS09 | Partial source — Supply not reachable, Engineering handover waiting, MYOB reference as last read; counts dash, never a verified zero (SR-15, S-34, page states) [PS parti… | State | 1440 × 900 | `112:3772` |
| PS10 | Outcome unknown — a save was sent and no answer came back: saved, failed and unknown told apart; Check receipt and Retry unchanged (S-33, page states) [PS outcome unknow… | State | 1440 × 900 | `112:4185` |
| PS11 | Read only — Lee Nakamura views the work order: no commands; the six reasons a record reads read only and where each is drawn (SV, page states) [PS read only] | State | 1440 × 900 | `112:4578` |
| PS12 | Permission changed while open — scope editing removed at 09:12: the unsaved note is kept, nothing ends silently (SV, 5.14, page states) [PS permission changed] | State | 1440 × 900 | `112:4971` |

### Administration · SV

Page `11:20` · Service settings; no route · 11 sheets · notes card `108:3660`.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| AD01 | Service settings — hub: what can be changed, by whom, at which scope; recent changes (SV, D8) [AD settings hub] | Desktop | 1440 × 900 | `106:941` |
| AD02 | Preparation policy and deadline follow-ups — v4 proposed: site confirmation window, pack issue cutoff 12:00 site time, return tasks 09:00 or 2 h before (SV-05, D-015) [A… | Desktop | 1440 × 900 | `106:1248` |
| AD04 | Scheduling policy — hours, travel buffer and time zone rules; v7 proposed with its Policy impact review (PL-04 D7) [AD scheduling policy] | Desktop | 1440 × 900 | `107:1766` |
| AD05 | Timer and time review rules — 8 s undo, 12 h flag, 48 h forgotten finish, long wait 45 min, working hours 07:00 to 18:00, travel non-billable by default (FI-01) [AD time… | Desktop | 1440 × 900 | `107:2064` |
| AD06 | Coverage, intervals and independence — decision words and routes; monthly, quarterly, six-monthly, yearly (no interval invented); goodwill limits (proposed); who may act… | Desktop | 1440 × 900 | `107:2377` |
| AD07 | Incidents, inspections and readiness — classifications and priorities; inspection templates and reading instruments (0055, EQ-09); readiness requirement groups (FI-03, F… | Desktop | 1440 × 900 | `108:2415` |
| AD08 | Numbering and templates — the reference families (D6) and the proposed additions to the type catalogue; pack OUT-09 and report OUT-10 via DK-06 (SV, PPO-STD-001) [AD num… | Desktop | 1440 × 900 | `108:2721` |
| AD09 | Notifications, saved views and layout — the nudges of section 6.9, saved views (Unassigned today, Overdue work orders, My team this week), columns, density and record la… | Desktop | 1440 × 900 | `108:3046` |
| AD10 | Support routes and message classes — equipment support routes (Email or Portal per manufacturer); Customer messages classes used by Service (report, warranty outcome, co… | Desktop | 1440 × 900 | `108:3358` |
| AD03 | Publish version — v4 reviewed by Jordan Kim: the visits and packs flagged for review and when it takes effect (SV-05, D8) [AD publish] | Dialog or panel | 1440 × 900 | `106:1827` |
| AD02b | Review refused — Ravi Kumar proposed v4 and cannot review it; a second person reviews (SV-05, D8) [AD states] | State | 1440 × 900 | `106:1533` |

## 4. Rules applied

- **Shell geometry and tokens.** Every desktop sheet instances the copied top bar, rail (Current = Service), right strip and either the docked Service operations menu with the current page and nested view, or the collapsed strip where the page needs the width (the planner, Capacity review, the time register) and on technician desktops. Content runs from x 80 to 1392; panels are 432 px at x 960 without a scrim; dialogs are 560 to 720 px over a 32 % navy scrim; Roboto 11 to 20 px; colours bound to the "PPO colour" variables.
- **One line per cell; no second search.** Register cells never wrap; the table scrolls sideways with frozen first columns and row menu. No search box appears in a page's content area; Find stays in the menus.
- **Page template.** Read me with four cards; separators; one page per scope area in rail order; six sections per page in the same order with 360 px gaps; desktop and dialog sheets at x 60, 1660, 3260 in rows 1060 apart, tablets at x 60, 1144, 2228, 3312 in rows 840 apart, phones at a 450 px pitch in rows 944 apart, full-length sheets on their own row; every sheet labelled 26 px above it as `CODE · Page — state (scope ID) [source]`.
- **Checks bars and gates.** Each record opens with its scope's checks bar (Before triage; Readiness n of 5; Dispatch gate; Before issue; Before outcome; Before closure; Case checks; the four time rows), each fact a chip with its rule and "why this" on derived states. Gate sentences name their exact criterion ("Dispatch held until …"); never "safe", "cleared", "compliant" or "ready to work".
- **Independence.** The person who cannot act sees the primary disabled with the reason (Addendum A1 rule R117): the drafter cannot authorise; the preparer cannot check; the author cannot review; the fixer cannot review the retest; the action owner cannot accept its evidence; the entitlement proposer cannot approve.
- **Phone first and offline.** Technician sheets at 390 and 320 with 16 px inputs, 48 px options and 56 px timer dock buttons; the connection state in words when it is not "Connected"; per-item Sending, Waiting for signal or Needs attention; a refused item kept with its reason; online-only actions say so before the attempt; no hash, receipt ID, UUID or sync jargon on a technician screen.
- **Content.** Counts state their rule; a dash when unreadable; every state a word with its chip tone; readings with value, unit, instrument and calibration; time segments with kind and duration; dates as "Thu 5 Nov 2026" with the site's time zone where it differs; no amount, rate or cost except Finance figures read back and labelled.

## 5. Assumptions and proposed departures

Each item is for Dean's decision. The working numbers A1 to A25 are those written on the sheets' notes cards; A26 to A42 record the items the brief asks to be listed; A43 to A55 were added while the second half was drawn and audited.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | The pages were built in "PPO - Service module (proposal)", the file the brief names. The link Dean sent opened "PPO - Settings module" (Settings pages in progress), which was only read. The design-to-build standard names the domain file "PPO - Service & Field"; the file's name is Dean's | Keep; rename only if Dean wishes |
| A2 | No published PPO library exists, so the shell components, kit, chrome and helper library were rebuilt in this file from the Settings file's copies under the same names. The collapsed strip copied is the accepted component as found, 12 px wide, not the 80 px the brief states | Swap to the published library on publication; confirm the strip width against the Shell file |
| A3 | Docked menu: Time & labour review added as a proposed page (17 pages), an Insights group, a clipped scroll region and the proposed Site readiness review view | Keep as proposed |
| A4 | Technician desktop sheets use the collapsed strip (the sparse technician rail, Shell sheet Z), not the coordinator's docked menu | Keep |
| A5 | Instruments: SYN-MEG-002 valid to Fri 30 Apr 2027 (Addendum A3 over the brief's Fri 29 Jan 2027); SYN-CLP-004 van 1 clamp meter expired Sat 31 Oct and flagged; SYN-CLP-006 renewed Tue 3 Nov is the calibrated alternative | Keep |
| A6 | Kim Taylor's timer: started Wed 4 Nov 16:05 at Westgate, finish set to 17:10 "forgot to stop", noticed Thu 07:42, flagged at 12 h; "Another job is timing" at Thu 07:50; the outside-hours exception moved to Tue 3 Nov 18:20 to 19:05 at Glasshouse Valley so one person never has two timers | Keep |
| A7 | Hillview visit timings: start 12:58; Travel pause collecting parts 13:41 to 14:02; stop 15:52 (labour 2 h 33); submit 15:56; no signal from 15:04; isolation approval recorded 11:20 | Keep |
| A8 | Glasshouse 4 readiness has six requirements (induction r2, heights r3, biosecurity r4, isolation approval r1 visit-specific, lock-out r2, access r1); rev 4 (Tue 3 Nov, Sam Patel) widened the crop restriction to bays 5 and 6 | Keep |
| A9 | The Waiting to send problem item is an observation kept for review because Ravi opened successor draft r03 at 15:02 (changed source) | Keep |
| A10 | The phone customer response shows the M-4 report SYN-RPT-000036 r01 of Thu 15 Oct, the only reviewed Hillview report | Keep |
| A11 | Block C day 1 rolled forward to Mon 16 Nov, Brisbane time (AEST) | Keep |
| A12 | The phone compact header has no back slot; a wrapper frame adds the back button | Replace with the accepted phone header when published |
| A13 | The phone visit dock shows no primary when the gate holds ("Can't start yet") | Keep |
| A14 | Jordan Kim both checks and issues before Riley Tran's pack check duty starts Mon 9 Nov (policy P-02, synthetic) | Keep as synthetic |
| A15 | The appointment's readiness Tag sits at the head of the gate bar, because the A1 header has one chip slot | Keep until the toolbar gains a second slot |
| A16 | SYN-APT-000093 added for the Riverbend pump visit | Keep |
| A17 | Depot stop at 11:40, not 11:15 | Keep |
| A18 | Pat Rowe's Block C 09:00 item is a remote session from the depot | Keep |
| A19 | The planner counts 7 appointments and 8 crew visits, not 11 visits | Keep |
| A20 | SYN-WO-000059 is not linked to SYN-TKT-000205 | Keep |
| A21 | Kim Taylor's inspection draft last saved 09:32 | Keep |
| A22 | Incident classifications drawn as Injury or illness, Near miss, Hazard, Damage to property or environment (the brief says four; the names are this file's; AD07 configures them) | Confirm the words |
| A23 | SYN-INC-000010 carries one Restricted item added by the review team on Wed 4 Nov, so the reporter's and the viewer's withheld states can be shown | Keep as synthetic |
| A24 | IC06 is Casey Ward's draft at Tue 3 Nov 14:18 (the report as it was being written), not a new report at the story time | Keep |
| A25 | Page titles are the rail labels (Service requests, Work orders, Schedule …) with the scope's full name as the sub-line (brief Q1) | Keep; the register records the departure |
| A26 | Ravi Kumar is the service coordinator; Sasha Cole keeps Equipment records (brief Q2, Addendum A3); the Design pages' "Sasha Cole, service coordinator" is an earlier fixture | Keep |
| A27 | Work-order stages In progress, Work complete and Closed are drawn as display stages derived from visits, reports and the handoff over the schema's Draft and Authorised, each with its "why" (brief Q3) | Keep as a proposed departure |
| A28 | A separate technician phone bar, My Work, My jobs, My inspections, Incidents, More, chosen by capability; the coordinator keeps the accepted W8 bar (brief Q4) | Keep; record for the register |
| A29 | Time & labour review is a proposed page after Service review, so the flyout shows 17 pages (brief Q5); no route exists | Keep as proposed |
| A30 | The Maintenance and warranty proposals' 680 px drawers are redrawn as 432 px panels; a long form scrolls (brief Q6) | Keep |
| A31 | Findings is a Service review view; the flyout's "Findings & follow-up" item stays as the Shell drew it, so it appears twice (brief Q7) | Keep; a Shell note |
| A32 | The coordinator's site readiness review (FI-05 D7, no read model) is drawn as a proposed view under My jobs (brief Q8) | Keep as proposed |
| A33 | Goodwill limit shown as proposed, A$1,000 excluding GST a case, above it Dean (brief Q9, MA-06 Q2) | Keep as proposed |
| A34 | Block C commissioning support follows Engineering, Mon 16 and Tue 17 Nov, over the Design's 1 to 2 Dec (brief Q10) | Keep |
| A35 | References use the short form; service requests keep TKT; INS, INC, ESC, AGR, ENT, MPL, MOC, RNW, WAR, SCL and SCR are proposed additions to the PPO-STD-001 type catalogue; findings carry no number | Propose to PPO-STD-001 in its own change |
| A36 | The Service Pulse (IS02) ranks the day by rule; it is proposed, with no route | Keep as proposed |
| A37 | The Service extract of Insights (RP-04) is drawn as an extract; the Reporting page is not | Keep |
| A38 | Duties the seeds give only to the single `coordinator` profile (scope authorise, pack check and issue, report review and issue, incident review, close and sensitive, maintenance and warranty assess) are split across Ravi Kumar, Jordan Kim and Riley Tran as a design assumption | Confirm before any seed change |
| A39 | Service settings change by propose, review by a second person and publish as a version with its impact on live visits and packs (D8) | Keep |
| A40 | Story reconciliation: this file's dataset (brief section 9 as amended by Addendum A3) supersedes the earlier fixtures Sasha Cole as coordinator, `SYN-PPO-WO-000040`, Riverbend's "pump service", `SYN-SR-000212`, Block C on 1 to 2 Dec, Alex Nguyen as the FM-2 technician and Hillview's PT-3 warranty case | Keep; align the earlier pages when next touched |
| A41 | The Shell's three Recent-row stand-ins are redrawn in this file's story: SYN-WO-000041 EC/pH sensor replacement, SYN-TKT-000212, Casey Ward | Align the Shell file in its own change |
| A42 | Stale register notes, recorded and not fixed here: `scope-sv-03.md` is a generic stub; `route-service-findings.md` and `route-service-escalations.md` are discovery stubs with module "Unassigned"; `route-supply-service-stock.md` is a stub; the Maintenance pages have no approved mock-up images | Fix in the design-register change |
| A43 | SYN-ESC-000003 is recorded as sent through the manufacturer's portal by a named person; PPO sends nothing | Keep as synthetic |
| A44 | Reference numbers the brief does not give are synthetic and kept clear of the story's own: work orders SYN-WO-000050, 000053, 000054 and 000057 for older reports; visits SYN-APT-000070, 000072, 000073, 000074 and 000077 (Kim Taylor's earlier visits are 000073 and 000074 because 000081 and 000086 are today's); SYN-RPT-000029; packs SYN-PACK-000065, 000067 and 000068; SYN-TKT-000199 | Keep as synthetic |
| A45 | RV05 and RV06 show SYN-RPT-000040 as it stood before it was issued on Wed 4 Nov at 10:15, so the issue step can be drawn | Keep |
| A46 | The "Response not accepted" report is SYN-RPT-000034 | Keep as synthetic |
| A47 | RV22 shows the commissioning handover SYN-CMS-000012 before it is accepted for Service | Keep |
| A48 | Mallee Fresh's agreement reads "Active · renewal in review"; Lakeside's is the one Expiring agreement | Keep |
| A49 | Occurrences SYN-MOC-000124, 000125 and 000126 and plans SYN-MPL-000032 and SYN-MPL-000038 are added so the plans register shows eight plans and the due list fills its weeks | Keep as synthetic |
| A50 | Weekdays that did not match their dates were corrected to the calendar: Sun 16 Nov 2025, Sat 1 Nov 2025, Thu 30 Oct 2025, Fri 5 Feb 2027, Mon 1 Jun 2026, Tue 31 Oct 2023 | Keep |
| A51 | Supplier recovery amounts are drawn as Finance figures excluding GST (WR06a, WR06b, WR09); Service shows no rate, cost or price of its own | Keep |
| A52 | Kim Taylor, not Pat Rowe, adds the warranty failure evidence at Hillcrest (WR10a), because Pat Rowe is at the depot and Hillview that day | Keep |
| A53 | The brief's own example of a connection state reads "last synced" while section 6.10 bans "synced" on a technician screen. The ban is applied: "Connected · up to date 13:20" and "No signal · last connected 15:04" | Confirm the words |
| A54 | Page states are numbered PS01 to PS12 in this file's order; the brief's scenario table cites PS05 to PS07 and SP01 with other meanings. Here stale is PS08 (and WO11c, SR11), outcome unknown PS10, partial source PS09 (and AG12b), and the Service Pulse is IS02 | Keep; the index on the Interaction states notes card maps each state |
| A55 | The Service operations flyout is redrawn in this file (FL01) with Time & labour review as the seventeenth page and three Recent rows in this story | Align the Shell file in its own change (with A41) |

## 6. Verification

- **Renders.** Representative sheets of every page type on every page were rendered inside Figma at 1024 to 1600 px and read during each batch; the defects found were corrected and re-rendered (among them icon scaling, docked-menu row heights, phone tab highlighting, text clipped in fixed-height fields, a collapsed register column, three sheets clipped at 900 px and the flyout's stacked Create tiles). Not every one of the 288 sheets was read by eye.
- **Structural pass, all 17 pages.** Every sheet's direct children sit inside its bounds; no text in a register cell is taller than one line; Roboto is the only font family; every sheet has a label with its code at the sheet's x, 26 px above it and no wider than the sheet.
- **Position audit, all pages.** Six sections per page in template order at x 0 with 360 px gaps, each refitted with 60 px padding; rows by measured height with full-length sheets on their own row; no sheet, label, section or card overlaps another; nothing is loose, hidden or transparent; the two separator pages and Scratch are empty; the four Read me cards do not overlap.
- **Inventory.** The node ID and size of every sheet in section 3 were read back from the file after the last change and matched (288 of 288).
- **Counts against the brief.** 48 dialog and panel sheets plus the phone sheets (minimum 44); page states PS01 to PS12 (minimum 12); ST01; 22 tablet sheets with every named one present (minimum 18); 72 phone sheets at 390 px and four at 320 px, MJ02, MJ16b, IN02b and IC06b (minimum 30 and four); AD01 to AD10 with AD02b (minimum 10).
- **Contrast.** Computed on ST01 from the PPO colour variables with the WCAG 2.1 formula: ink on white 14.37:1; secondary on white 5.77:1; link on white 7.10:1; ink on workspace 13.29:1; secondary on chrome 5.29:1 (the lowest text pair in use); ink on navy tint 12.33:1; warning chip 6.00:1; success chip 5.44:1; danger chip 6.32:1; info chip 5.58:1; white on navy 14.37:1; white on danger 6.97:1. Lowest control edge 3.32:1; the focus ring, brand/green-deep on white, 3.57:1. One pair is below 4.5:1: white on brand/green-deep, 3.57:1, so a green-filled button must not carry text; the one drawn on ST01 was removed and no Service sheet uses it.
- **Scans, by a text read of every sheet.** No date in a style other than "Thu 5 Nov 2026"; no "compliant"; "safe" and "cleared" remain only where ST01 states the rule and in the brief's own "Customer-safe" check on RV03 to RV07; no hash, UUID, receipt ID, "queued" or "payload" on a phone sheet, and after correction C1 no "sync" wording on one; short hashes appear only on coordinator sheets beside issued outputs. Amounts appear only as Finance figures (WR06a, WR06b, WR09) and as the proposed goodwill limit (WR08a, AD06).
- **Story.** Counts and references were checked where they repeat across pages during the build, and the scenario table of the brief was checked by code: S-01 to S-36 each name sheets that exist (the brief's SP01 is IS02 here, A54). A date checker confirmed every weekday and date pair (A50). The scan compares patterns and repeated counts; it does not prove every value in every row against the dataset.
- **Capability and authority.** Enabled commands follow the persona matrix. Independence is drawn on WO06b (the drafter cannot authorise), JP06a (the checker is not the preparer), IN08 (the fixer cannot review the retest), MP10 and AD02b (the reviewer is not the proposer) and WR03 (proposed by Ravi Kumar, approved by Jordan Kim). Viewers and withheld facts: SR12, AG12a, WR10b, IC07, IC08c, PS03 and PS11. A text scan for booking, release, sending and posting phrases found only sentences that say the sheet does not do so.
- **Offline.** Every technician phone sheet states its connection in words, with per-item states where items can wait and the copy's end shown. The coordinator-bar phone sheets and the reviewer's IN08 show no connection state, by the brief's rule.
- **Not done.** No prototype flow is wired and none was played. No owner device, keyboard, screen reader, glove or 200 % zoom review is recorded. The sheets are design compositions and set no UI baseline.
- **Tooling note.** The build paused three times on 10 and 11 November 2026 when the Figma tool-call limit for the seat (200 calls in 24 hours, shared with other sessions) was reached.
- **Repository checks for this change.** `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

## 7. Not drawn and open questions

Not drawn: Equipment pages EQ-01 to EQ-09 beyond chips, links and the "Record equipment history" hand-off; Service stock SC-10, Returns and claims SC-08 and Bench testing CX-02 (Supply and Workshop pages); Customer messages EC-04 and every customer-facing send; the Document library, Output issue and Template management beyond links and the issue action; Finance handoff pages beyond the Send and the handoff state; Sales aftercare and the deal; Projects and Engineering pages; the Reporting page RP-04; the customer portal; My Work (Service's contributions are shown on the Service sheets); prototype links. Also not drawn: the innovation candidates N-N7 to N-N11 (section 9); 200 % zoom and keyboard-only walkthroughs per page (specified on ST01); tablet and phone variants of most dialogs; and some dialogs of the brief's long list, which appear as a state of another sheet.

Open questions, cited and not resolved: D-005, D-007, D-011, D-012, D-015 (scheduling values and the gate's synthetic window: site confirmation 5 days to 24 hours before, pack issue by 12:00 site time on the last working day before, return tasks due 09:00 on the visit day or 2 hours before start), D-016 (device and offline scope), D-017, D-018, D-019, D-024, D-025 (who sends to a manufacturer), D-026, D-028; ADR-0043 (ticket lifecycle after triage, Proposed, not accepted: the later lanes are not drawn); PPO-015 (deferred Service items in BP-07 section 16); MA-01 Q1 to Q6; MA-03 Q1 to Q6; MA-06 Q1 to Q7; FI-05 D7 (the coordinator's site readiness review has no read model); time review F1 to F3 (drawn, not accepted); FI-01 Q9. Acceptance tests AT-10 to AT-14, AT-19, AT-25 and AT-30 to AT-36 are not claimed by any sheet.

## 8. Boundary and next steps

This record authorises nothing in the application: no code, route, read model, migration, permission, capability, grant, seed, integration or deployment. The next steps are: Dean reviews the proposal and the audit and decides the A-list; Dean saves a named Figma version (section 10), and any later design change needs a new one; the design register and the per-route page guidance in `docs/design/development/pages/` follow in their own reviewed change, which also fixes the stale notes of A42; the Shell file's Recent-row stand-ins are aligned with the reference families (A41); the proposed type-catalogue families go to PPO-STD-001 (A35); and the Supply and Engineering files are checked where Addendum A3 corrected their stories (the Service stock sheets SS01 to SS05 and the commissioning handover sheets CM12 and CM13 must read the same facts as this file).

## 9. Audit — 11 November 2026

Run after the last batch over the 288 sheets. What was clearly right was applied in the file; the rest is proposed. The same lists are on the file's audit card (`118:34901`).

**Scenario coverage.** S-01 to S-36 of the brief each map to drawn sheets by the codes in the brief's scenario table. Two notes: the Service Pulse of S-01 is IS02 here, and the stale, outcome-unknown and partial-source states of S-33 and S-34 are PS08, PS10 and PS09 as well as WO11c, SR11 and AG12b (A54).

| ID | Item | State |
|---|---|---|
| C1 | Sync wording removed from 38 technician phone states: "Connected · up to date 13:20", "No signal · last connected 15:04" (brief 6.10, A53) | Applied |
| C2 | AP04 "Dispatch had cleared" now reads "Ready to dispatch"; three sentences on AP01, AP03 and MJ23 no longer use "safe" or "cleared" | Applied |
| C3 | ST01: the green-filled button removed; white on brand/green-deep is 3.57:1 and fails for text | Applied |
| C4 | Page states PS06 to PS12 added so all twelve sit on Interaction states (seven had been drawn only on scope pages); the PS11 cross-references corrected | Applied |
| C5 | Service flyout: the Create actions on one row and three Recent rows, so all 17 pages fit 852 px | Applied |
| C6 | AD01 authority cells were cut and are shortened; AD03 says publishing flags records and never reinterprets them (SR-20) | Applied |
| C7 | Story: Kim Taylor's earlier visits renumbered SYN-APT-000073 and SYN-APT-000074; the coverage event for SYN-TKT-000215 on Wed 4 Nov; six weekday errors corrected (A44, A50) | Applied |
| C8 | IS01, IS02 and ST01 grown to their content; the RV03 save bar pinned; RV10 drawn full length; the IC06 text area and the IC08c file column no longer clipped | Applied |
| R1 | The record header toolbar carries six Sales-worded states and Service sheets borrow "Issued" and "Closed" for layout; give the toolbar a neutral state set when it moves to the library | Proposed |
| R2 | Flyout Recent rows wrap at 230 px; show the reference alone, with the title on hover | Proposed |
| R3 | Long forms in 432 px panels scroll (AG08a, MP05b, WR07); consider two steps for the longest | Proposed |
| R4 | Decide whether coordinator phone sheets should read "Connected" for parity with technician sheets | Proposed |
| R5 | Hover and pressed tokens are not in the colour variables; ST01 uses the nearest existing ones | Proposed |
| G1 | 200 % zoom desktop renders and keyboard-only walkthroughs are specified on ST01, not drawn per page; no person's device, screen reader or glove review is recorded | Open |
| G2 | N-N7 to N-N11 are proposed and not drawn | Open |
| G3 | Some dialogs of the brief's long list are drawn as a state of another sheet; most dialogs have no tablet or phone variant | Open |
| G4 | The items under "Not drawn" in section 7 | Open |
| N-N1 to N-N4 | Drawn as integrated features: Service Pulse (IS02, IS02p); why this state (AP01, MJ03, WO08); readiness ahead (PL01 tray, MJ23); recurrence and warranty link (RV15, WR02) | Drawn |
| N-N5, N-N6, N-N12 | Shown as proposals on sheets: triage suggestion (SR06); planner suggestion, "Suggested, not booked" (PL04); renewal brief (AG10a) | Proposed |
| N-N7 to N-N11 | Report draft (RV05); reading by photo (MJ09); voice observation (MJ07); query draft (TL03); evidence pack assembly (RV21). Each would be labelled a suggestion, reviewed before anything is saved, and would write, book, release or send nothing | Proposed, not drawn |
| P1 to P4 | One wording for the same state across pages; one "as at" footer wording; long sheet labels are cut at the sheet width by design; proposed pages (Time & labour review, Service Pulse, Site readiness review) carry "proposed" in the menu until they have routes | Proposed |

**Recommended order.** 1. Review the flagship: the technician's day on the phone (My jobs), then Schedule and Appointment detail. 2. Confirm or reverse the defaults for Q1 to Q10 and the A-list. 3. Save the named version so the reviewed state is pinned. 4. Decide R1 and R4 with the library and Shell files. 5. Draw G1 and whichever of N-N7 to N-N11 are wanted. 6. Update the design register and page guidance in their own change. 7. Align the Shell, Supply and Engineering files where Addendum A3 corrected their stories, then accept page by page.

## 10. Named version

No named version is saved yet. The proposal state should be pinned by Dean saving the named version "PPO - Service module (proposal) · 11 November 2026"; this section is updated when he does. Any later design change needs a new named version ([named-version build handoff](figma-named-version-build-handoff.md)).
