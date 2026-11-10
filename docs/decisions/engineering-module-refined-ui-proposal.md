---
document_id: PPO-ENGINEERING-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal, 10 November 2026; design acceptance is Dean's and has not been given; no named version is saved yet; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, CAD, SharePoint or MYOB integration, or deployment; every record shown is synthetic
source_commit: 1888cc81d4c99e68836390110a6655e767fa17d5
versioning: git
---

# Engineering module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposal. Sections 1 to 8 are the proposal record; section 9 holds the audit run after the build and section 10 the named version. Later sections will record Dean's acceptance and any further batches exactly as the [Sales record](sales-module-refined-ui-proposal.md) does.

Dean asked for the refined UI pages of the Powerplants One Engineering module to be built in a new, empty private Figma file, "PPO - Engineering module (proposal)", inside the accepted shell and to the standard of the accepted Sales module file. His brief, "Design the Engineering module UI pages for Powerplants One in Figma", with Addendum A3 (persona and story reconciliation), set the scope (EN-01 to EN-08, the Engineering package record, the Engineering extract of RP-03 Insights, interaction states and administration), the decisions already taken (D1 to D12), one synthetic dataset as at Thursday 5 November 2026, 09:00 AEDT, signed in as design engineer Sam Jordan, and a standing order to decide rather than ask. The eight questions in the brief were therefore answered by their stated defaults; each is recorded in section 5 as an assumption Dean can reverse.

This record is a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions that remain. It changes no code, test, migration, seed, permission or route, and it authorises no business transaction, technical release, customer communication or integration. Four statements stay separate throughout: code delivery (none in this change), design acceptance (Dean's, not given), production readiness (not inferred) and integration with CAD, SharePoint, MYOB or any receiver (none exists, none authorised).

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell", named version "Shell refined concept — accepted" (8 November 2026), with the accepted record header toolbar of Addendum A1 (accepted 9 November 2026, rules R116 to R125) | Chrome and geometry: 48 px top bar with global search, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, the accepted Engineering flyout and docked menus (nine pages in four groups, nested views per rule R108, no Quick create tiles per rule R107), the collapsed strip, the 1024 top bar (332 / 360 / 332), the record header toolbar set and its phone variant. Components were rebuilt in the new file by value under the same names |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | Conventions mirrored: the page template and its four Read me cards, sheet labels, the page kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile), Filters, Columns, Export, the settings hub, configuration editor and Publish version patterns, the phone header and tab bar pattern |
| Private Figma file "PPO - Supply module (proposal)" and the Estimating and Projects module files | Component names kept identical; their datasets are the truth where the Engineering story touches them, as amended by Addendum A3 |
| Private Figma file "PPO - Design", the earlier Engineering pages | Rules, stories and vocabulary: Engineering workload EN-01 (accepted 11 October 2026), Delivery performance RP-03 (accepted 1 November 2026), and the proposals of 23 October 2026 for EN-02 to EN-08, which the design-to-build standard classes as tier 2, to be redrawn in the new language before a build |
| [BP-01](../blueprints/BP-01-master-blueprint.md) section 11 | Scopes EN-01 to EN-08 with parents ENG-01 to ENG-07 (EN-01 → ENG-01; EN-02 → ENG-02; EN-03 → ENG-03; EN-04 → ENG-02, ENG-04, ENG-06; EN-05 → ENG-04 with ENG-05 outgoing; EN-06 → ENG-05; EN-07 → ENG-06; EN-08 → ENG-07 with PRJ-06 and PRJ-08). No parent requirement ID is added or renamed; all 78 remain |
| [ADR-0047](ADR-0047-engineering-native-control.md) and [engineering native control interface](../interfaces/engineering-native-control.md) | Immutable revisions; a review bound to exact revisions under a hash; issue only after an accepted current review for the identical purpose by an independent issuer; Sent, Delivered and Acknowledged as separate events; withdrawal erases nothing |
| [Engineering workload design](engineering-workload-design.md), [engineering R02 integration](engineering-r02-integration.md) | Accepted EN-01 rules: Queued, In design, Awaiting information (only with a recorded blocker); "Released" means a current, exactly issued formal issue with unchanged sources; effort "To be assessed"; SOLIDWORKS and SharePoint as authoring and storage |
| [EN-02 design](engineering-basis-interface-register-design.md), [EN-06 design](engineering-materials-substitutions-design.md) (PPO-EN06-INT, E1 to E14), [EN-07 design](engineering-change-impact-review-design.md) (PPO-EN07-INT, D1 to D16), [EN-08 design](engineering-commissioning-as-built-design.md) (PPO-EN08-INT, D1 to D20, X1 to X10), [inspections reading instruments](inspections-reading-instruments.md) | States, gates, receiving and verification vocabularies carried into the redrawn pages |
| [ADR-0066](ADR-0066-configuration-rule-sets.md), [project initiation design](project-initiation-figma-design.md), [site assurance design](site-assurance-figma-design.md), [project specialist handover](../contracts/project-specialist-handover.md), [Delivery performance design](delivery-performance-figma-design.md) | Interfaces: the named engineering owner and "to confirm" values (Q7, Q9); the PJ-01 design-basis request; PJ-09 and Site assurance read exact EN-08 versions; the PJ-06 brief in the version-2 Supply handover; Engineering owns REP-06 and KPI-11 on RP-03 |
| [Readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC), standing in for Addendum A2 | Reference form `SYN-<TYPE>-<NUMBER>`, six digits minimum |
| [PPO-STD-001](../standards/naming-conventions.md), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [HTML module conformance](../standards/html-module-conformance.md), [named-version build handoff](figma-named-version-build-handoff.md), [design, build and review roles](design-build-review-roles.md) | Naming, page order, the nine-field declaration, r20 page types, and the rule that a named version pins a build basis |
| `src/shell/navigation.ts`, `src/engineering/control/navigation.ts`, `src/platform/permissions.ts` | Workspace label "Engineering", rail and page routes, page-level views, and the `engineering.*` capabilities; read only |

The file's link and key are not recorded in this public repository ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

### 2.1 The module

| Field | Declaration |
|---|---|
| Scope identity | The Engineering workspace: `scope:EN-01` (workload, Pulse and the package record) to `scope:EN-08`, the Engineering extract of `scope:RP-03`, and Engineering settings. Routes are listed per scope in 2.2. No scope ID or parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist; Record detail; Overview (Engineering Pulse, Insights, the settings hub); Form / guided workflow as right-side panels and centred dialogs; Review / comparison (two-revision compare, exact handover preview, propose, review and publish); states; tablet and phone variants. Per scope in 2.2 |
| Reused components | Rebuilt by value under the accepted names: Shell top bar, collapsed rail, right strip, Engineering docked menu (one variant per current page), collapsed strip, Engineering flyout, 1024 top bar, record header toolbar (six states) and its phone variant; 101 shell icons and 12 added icons (Lucide stand-ins for Font Awesome Light); the "PPO colour" collection (66 variables, same names as the Shell and Sales files); the Sales page kit under its Sales names. New in this file and proposed: an Engineering phone tab bar (My Work, Engineering, Drawings, Technical reviews, More, as the code carries it); drawn parts for the checks bar, signals strip, the four-identity card, impact matrix, results grid, gates, tiles for photos, redlines and signatures, and "why this" traces |
| Source authority | Dean's brief and its decisions D1 to D12 with Addendum A3; the accepted EN-01 and RP-03 designs; the EN-02 to EN-08 proposals as design direction, not accepted; this file's compositions as proposals. The fixture is fictional and synthetic: as at Thursday 5 November 2026, 09:00 AEDT, signed in as Sam Jordan unless the sheet names another person |
| Incoming handover | Per scope in 2.2. Arriving on a page creates no business record |
| Outgoing handover | Per scope in 2.2. Nothing drawn authors a file, places an order, books work or edits another module's record. Native CAD authors, SharePoint stores and PPO controls: a revision records the typed native file version, engineering revision, output reference and SHA-256 |
| Exceptions and recovery | Drawn: loading permitted evidence, true-empty, filtered-empty, could not load, denied or not found, stale (a newer save by someone else), partial source (SharePoint unreachable, metadata shown), outcome unknown with recovery (saved, failed and unknown told apart, E14), read only for five reasons, bulk action partly failed, permission changed while open, reviewer is the author, reviewer is the responder, source changed since submission, review policy not configured, Authority not configured, release blocked by unmapped lines, preview out of date, an action owner declined, retest failed, instrument calibration expired, release blocked by an open redline, handover waiting on Service. A count that cannot be read shows a dash, never zero |
| Departures | Section 5 |
| Verification | Section 6 |

### 2.2 Per scope

On every scope native CAD tools author, SharePoint stores and PPO controls. Review, authorise and issue are separate operations by independent people; where no policy is published the sheet reads "Authority not configured". A technical release authorises nothing commercial.

| Scope and route | Page types | Owns | Incoming handover | Outgoing handover |
|---|---|---|---|---|
| EN-01 Engineering workload, `/engineering`; package record `/engineering/[id]`; proposed Engineering Pulse | Register; Record detail; Overview | Coordination status, blockers, notes and accountable deliverables of a package. Creating a request authorises no effort and issues nothing | Design-basis request from Projects (PJ-01); the sold scope from Sales (CR-01, CR-03); service needs | Package status and released outputs to the deal and project; blockers as Waiting on others to My Work (SH-01, SH-02) |
| EN-02 Design basis & interfaces, `/engineering/basis` | Register; Record detail; Review (compare); Form | Basis revisions with requirements, assumptions, questions, interfaces and cited calculations | The PJ-01 request; site surveys and growing areas (CS-08, CS-05); typed calculation results; accepted changes (EN-07) | The released basis to Drawings, Materials and Commissioning; questions raised as technical queries (EN-04); "to confirm" values to Rules studio as evidence, approving no rule set (ES-02, ADR-0066) |
| EN-03 Drawings & controlled documents, `/engineering/drawings` | Register; Record detail; Form | The control record of each revision: four identities kept apart, status, deliverable, Where used | Links to SharePoint files (DK-01) | Exact revisions to reviews (EN-05), materials, changes and commissioning bases |
| EN-04 Technical queries & submittals, `/engineering/queries` | Register; Record detail; Form | Queries, their formal responses and dispositions; supplier submittals and their dispositions | Supplier answers received outside PPO (recorded by the owner); basis questions | Answers and accepted submittals as evidence to EN-02 and EN-06; purchase order references are context only |
| EN-05 Technical reviews & issues, `/engineering/reviews` | Register; Record detail; Form | **Review and formal issue**: findings, completion, issues with purposes, distribution evidence and withdrawal | Submissions binding exact revisions under a hash | Formal issues to recipients, including a customer for information only by link (S-32); Customer messages EC-04 owns sending; DK-03 owns distribution records |
| EN-06 Materials & substitutions, `/engineering/materials` | Register; Record detail; Form | **The materials release and the Supply handover**: lines with content revision and hash, mapping, substitutions, review, authorise and issue | Released basis and drawings; the frozen PJ-06 brief; compatibility evidence (PD-04) | Released materials as demand to Supply (SC-01); the whole payload, version 2 with the PJ-06 brief, for Supply to accept or return; the parts list read only by the Workshop (CX-02). "Technical release does not authorise purchasing" |
| EN-07 Change review, `/engineering/changes` | Register; Record detail; Review; Form | **The technical decision**: impact across nine areas, review, decision with purposes, verification and closure. Implementation authority is the project manager's (Projects), drawn as a side form where the decision is read (Q7) | Field redlines and site discrepancies; supplier product changes; Workshop observations | Exactly previewed actions to Workshop (rework), Purchasing (order lines), Inventory (reservations) and Projects (customer variation, PJ-05); SC-09 reads changes. Dates and costs are owned elsewhere |
| EN-08 Commissioning & as-built, `/engineering/commissioning` | Register; Record detail; Form | **The test basis and the as-built release**: criteria with exact decimals, results with instruments, differences, redlines, eight release gates | Released design and materials; calibrated instruments (EQ-09); results captured on the controlled inspection form (FI-03, FI-04). **Workshop owns test definitions** (CX-02) | Exact test, release and configuration versions to PJ-09 and Site assurance; obligations to **Service**, which accepts or returns (MA-01, MA-03); the outcome to **Equipment**, which records it and writes no installed base (EQ-01, EQ-08); **Projects** receives the versions; outputs OUT-12 and OUT-13 |
| RP-03 Insights, Engineering extract | Overview; Register (drill-through) | Nothing: Reporting owns the definitions; Engineering owns the content of REP-06 and KPI-11 | Facts recorded in EN-04, EN-05, EN-07 and EN-08 | Every count opens the rows on the page that owns them |
| Administration, Engineering settings | Overview; Settings; Review | The policies and lists Engineering reads its rules by, as published versions | Proposals from an administrator; a second person reviews | Published versions to every Engineering page from that moment; nothing re-decided silently |

## 3. Sheet inventory

193 sheets and 12 notes cards on 12 scope pages. Node IDs are those of the sheet frame. Titles are shortened; the file's "Sheet index and notes" card and each sheet's label carry the full text. A sheet label reads `CODE · Page — state (scope ID) [source]`. Unless stated, desktop sheets are 1440 × 900, tablets 1024 × 768 and phones 390 × 844.

| Item | Node |
|---|---|
| Read me: header card, page template card, "Sheet index and notes", audit card | `78:2`, `78:6`, `79:2`, `80:2` |
| Pages: Read me `0:1`, — Accepted — `7:2`, — Proposals — `7:3`, Shell and kit `7:16`, Scratch `7:17` | separators and Scratch are empty; the scope pages sit under — Proposals — |
| Shell and kit: shell components `13:6` (top bar `13:9`, rail `13:123`, right strip `13:215`, collapsed strip set `13:243`, docked menu set `13:1141`, flyout `13:1142`, record toolbar set `14:528`, phone toolbar `14:529`), kit `11:2`, icons `8:2`, chrome `13:7` (1024 top bar `13:68`, phone header `14:556`, tab bar set `14:745`, status bar `14:746`) | on page `7:16` |

### Engineering workload and Pulse · EN-01

Page `7:4` · `scope:EN-01`, `/engineering` · 25 sheets.

| Code | Sheet | View | Node |
|---|---|---|---|
| WL01 | All packages, grouped by status | Register | `17:8` |
| WL02 | Two packages selected, snapshot panel for the row in focus | Register | `18:1200` |
| WL03 | Register with the Engineering menu docked | Register | `17:935` |
| WL04 | Author actions view: what Sam owes as an author | Register | `17:2758` |
| WL05 | Awaiting information: blocker recorded and shown in My Work | Record detail | `18:2088` |
| WL06 | Engineering Pulse, day start: Focus for today ranked by rule (proposed N-N1) | Overview | `18:2577` |
| WL07 | Register with the docked menu collapsed to the accepted strip | Register | `17:1900` |
| WL08 | New engineering request, right-hand form panel | Form | `18:3000` |
| X02 | Update coordination with a reason | Form | `20:2416` |
| X03 | Add note | Form | `20:3244` |
| X04 | Record blocker: sets Awaiting information and contributes to My Work | Form | `20:4044` |
| X05 | Clear blocker: returns the package to In design | Form | `20:4865` |
| X06 | Filters, every filter stated in words | Form | `20:5682` |
| X07 | Columns: frozen and visible columns, order and density saved with the view | Form | `20:6541` |
| X08 | Export register: scope, columns and format; restricted facts never exported | Form | `20:7472` |
| X09 | Reassign packages while an owner is away, logged as a new decision (S-31) | Form | `20:8285` |
| PS01 | Loading permitted evidence: counts read a dash until known | State | `21:4598` |
| PS02a | True-empty: no packages yet, counts read 0 | State | `21:4960` |
| PS02b | Filtered-empty: filters restated in words | State | `21:5233` |
| PS04 | Could not load: counts show a dash, never zero | State | `21:5508` |
| PS09 | Bulk update partly failed: saved, failed and unknown told apart | State | `21:5783` |
| TB01 | Register at 1024 × 768 with the collapsed strip | Tablet | `21:6678` |
| PH01 | Engineering Pulse on the phone (N-N1) | Phone | `21:7202` |
| PH02 | Workload list, labelled cards grouped by status | Phone | `21:7381` |
| PH03 | Workload list at 320 × 844 | Phone | `21:7570` |
| — | Notes card | Notes | `63:6179` |

### Engineering package · EN-01

Page `7:5` · `scope:EN-01`, `/engineering/[id]` · 11 sheets.

| Code | Sheet | View | Node |
|---|---|---|---|
| PK01 | Overview: the record that ties the eight scopes together | Record detail | `22:8` |
| PK02 | Coordination: status history, blockers and notes | Record detail | `22:548` |
| PK03 | Deliverables: accountable deliverables with owners | Record detail | `22:1019` |
| PK04 | History, grouped by day | Record detail | `22:1531` |
| PK05 | Released: a current, exactly issued formal issue with unchanged sources, and what would un-release it (N-N2) | State | `25:1103` |
| PS03a | Opened by a viewer: restricted sources and cost withheld with the reason (S-23) | State | `25:1540` |
| PS03b | Denied reads as not found | State | `25:1903` |
| PS08 | Read only: the five reasons, each said in the header (A1 rule R117) | State | `25:2113` |
| PS10 | Permission changed while open: the unsaved note kept, commands off with the reason | State | `25:2499` |
| TB02 | Overview at 1024 × 768 | Tablet | `25:2834` |
| PH04 | Package record with the A1 phone toolbar | Phone | `25:3195` |
| — | Notes card | Notes | `64:2626` |

### Design basis and interfaces · EN-02

Page `7:6` · `scope:EN-02`, `/engineering/basis` · 24 sheets.

| Code | Sheet | View | Node |
|---|---|---|---|
| DB01 | All bases, grouped by project | Register | `26:8` |
| DB02 | Woodhaven rev A Draft, created from the PJ-01 request (S-02) | Record detail | `26:612` |
| DB03 | Block C rev B In review, Requirements with source types (S-03) | Record detail | `26:1105` |
| DB04 | Assumptions & constraints with evidence | Record detail | `26:1675` |
| DB05 | Questions: Q-03 raised as SYN-TQ-000018, answered, awaiting review | Record detail | `27:1088` |
| DB06 | Interfaces: two-party confirmation, linked site address (N-N9 proposed) | Record detail | `27:1597` |
| DB07 | Calculations cited by exact revision; a "to confirm" value owed to Rules studio (S-22, N-N10 proposed) | Record detail | `27:2098` |
| DB08 | Review & handover: rev B with its reviewer, rev A released snapshot | Record detail | `27:2602` |
| DB11 | Glasshouse 4 rev C Draft with its revisions; requirement from SYN-ECR-000014 (S-04) | Record detail | `28:2146` |
| DB12 | Compare rev B (Released) with rev C (Draft), differences in words | Review | `28:2655` |
| DB09 | Raise technical query from a question | Form | `28:2968` |
| DB10 | Release design basis: the independent reviewer, blocked while a question is open | Form | `28:3446` |
| DB13 | Submit for review: reviewer named; "the reviewer is the author" refusal | Form | `28:3941` |
| X10 | Add requirement sourced from an accepted change | Form | `28:4401` |
| X11 | Add assumption with its evidence and what happens if it is wrong | Form | `28:4871` |
| X12 | Confirm my side, as Alex Lee recorded it on Fri 30 Oct 2026 | Form | `28:5361` |
| X13 | Address lookup through a maps provider | Form | `28:5830` |
| DB14 | Superseded revision opened: read only, successor named | State | `29:4572` |
| PS05 | Stale: a newer draft saved by someone else; reload keeps your unsaved text (S-24) | State | `29:4948` |
| PS06 | Outcome unknown: the original is kept, three outcomes told apart (S-24, E14) | State | `29:5266` |
| TB03 | Block C rev B Requirements at 1024 × 768 | Tablet | `29:5610` |
| TB04 | Compare rev B with rev C at 1024 × 768 | Tablet | `29:6042` |
| PH05 | Interface cards: each party confirms its own side | Phone | `29:6320` |
| PH06 | Confirm my side, full-screen form | Phone | `29:6419` |
| — | Notes card | Notes | `64:8292` |

### Drawings and controlled documents · EN-03

Page `7:7` · `scope:EN-03`, `/engineering/drawings` · 17 sheets.

| Code | Sheet | View | Node |
|---|---|---|---|
| DR01 | All controlled documents, grouped by project | Register | `31:8` |
| DR02 | SYN-DWG-000318 CP-4 panel schematic, Revisions and the four identities (S-05) | Record detail | `31:598` |
| DR03 | Reviews: each review binds one exact revision | Record detail | `31:1068` |
| DR04 | Where used: every reader of this revision and its state (N-N3) | Record detail | `31:1530` |
| DR05 | History, grouped by day | Record detail | `32:1045` |
| DR08 | SYN-DWG-000322 Block C fertigation P&ID, the accountable deliverable and its review (S-06) | Record detail | `32:1403` |
| DR09 | Blocked view: why each document is blocked and who resolves it | Register | `32:1863` |
| DR06 | Add revision: native file version, output reference, SHA-256 and engineering revision, all typed | Form | `32:2197` |
| DR07 | Output hash does not match: the revision is refused (proposed check, EN-03 D11) | Form | `32:2647` |
| DR10 | Add document: type, package, system and reference | Form | `32:3011` |
| X14 | Send for technical review: binds one exact revision under its hash | Form | `32:3541` |
| DR12a | Superseded revision opened: read only, the current revision named | State | `33:2692` |
| DR12b | Add revision, uncertain save: what was typed is kept, nothing recorded twice | State | `33:3040` |
| PS07 | Partial source: SharePoint cannot be reached; links say so and the metadata is shown (S-25) | State | `33:3363` |
| TB05 | SYN-DWG-000318 Revisions at 1024 × 768 | Tablet | `33:3811` |
| PH07 | Check a copy on site (DR11, S-07) | Phone | `33:4192` |
| PH08 | Check a copy, result: revision B, superseded; current is C (DR11) | Phone | `33:4253` |
| — | Notes card | Notes | `64:11931` |

### Technical queries and submittals · EN-04

Page `7:8` · `scope:EN-04`, `/engineering/queries` · 14 sheets.

| Code | Sheet | View | Node |
|---|---|---|---|
| TQ01 | Open queries with response time and who acts | Register | `34:8` |
| TQ03 | SYN-TQ-000018 water supply pressure, answered, awaiting technical review | Record detail | `34:582` |
| TQ07 | All supplier submittals with their disposition (S-09) | Register | `34:994` |
| TQ08 | SYN-SMT-000011 DP-25 pump datasheet, accepted as substitution evidence | Record detail | `34:1466` |
| TQ02 | Raise query: origin, recipient and response time (S-08) | Form | `35:1005` |
| TQ04 | Record formal response (N-N5 proposed) | Form | `35:1522` |
| TQ05 | Dispose answer: the reviewer resolves or returns | Form | `35:2027` |
| TQ09a | Record submittal with its source | Form | `35:2449` |
| TQ09b | Dispose submittal: accept, return or reject | Form | `35:2943` |
| TQ06 | SYN-TQ-000020 overdue: a nudge is owed | State | `35:3434` |
| TQ10 | SYN-SMT-000013 returned, awaiting the supplier's successor | State | `35:3795` |
| TQ11 | Dispose answer refused: the reviewer is the responder | State | `35:4158` |
| TB06 | SYN-TQ-000018 at 1024 × 768 | Tablet | `35:4557` |
| PH09 | Record formal response, full-screen form (TQ04) | Phone | `35:4881` |
| — | Notes card | Notes | `64:15036` |

### Technical reviews and issues · EN-05

Page `7:9` · `scope:EN-05`, `/engineering/reviews` · 20 sheets.

| Code | Sheet | View | Node |
|---|---|---|---|
| TR01 | Reviews to do, as the reviewer sees them | Register | `36:8` |
| TR02 | SYN-REV-000041 CP-4 climate screens, Submission: the exact sources and the hash (S-10) | Record detail | `36:455` |
| TR04 | Issue tab: the formal issue that rests on this review | Record detail | `36:883` |
| TR05 | SYN-REV-000044 Block C P&ID returned with a Required finding (S-06) | Record detail | `36:1344` |
| TR09 | SYN-ISS-000017 Recipients: Sent, Delivered, Acknowledged per recipient (S-32) | Record detail | `36:1736` |
| TR03a | Record finding against an exact source | Form | `37:1257` |
| X15 | Respond to finding: the source is not edited in place | Form | `37:1669` |
| X16 | Accept finding: the acceptor is never the owner | Form | `37:2074` |
| TR03b | Complete review: Reviewed, findings accepted, sources unchanged | Form | `37:2469` |
| TR07 | Submit for review: the resubmission names its revision and predecessor | Form | `37:2873` |
| TR08 | Create issue: purpose, bound review and recipients, by the independent issuer | Form | `37:3267` |
| TR11 | Record sent or delivered, one event at a time | Form | `37:3685` |
| TR12 | Withdraw issue: a reason is required and nothing is erased (S-12) | Form | `37:4462` |
| TR13 | SYN-ISS-000018 issued but not sent | State | `37:4099` |
| TR06 | SYN-REV-000045 screen motor schedule: source changed since submission (S-11) | State | `39:3511` |
| TR14 | Review policy not configured: what applies today | State | `39:3881` |
| TB07 | SYN-REV-000041 Submission at 1024 × 768 | Tablet | `39:4148` |
| TB08 | SYN-ISS-000017 Recipients at 1024 × 768 | Tablet | `39:4495` |
| PH10 | Acknowledge receipt (TR10) | Phone | `39:4823` |
| PH11 | Acknowledge receipt, saving not confirmed (TR10, E14) | Phone | `39:4886` |
| — | Notes card | Notes | `65:4422` |

### Materials and substitutions · EN-06

Page `7:10` · `scope:EN-06`, `/engineering/materials` · 20 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| MT01 | Materials register, grouped by project | Register | 1440 × 900 | `40:8` |
| MT02 | Block C SYN-MAT-000031 R3, Lines with content revision and hash (S-13) | Record detail | 1440 × 900 | `40:651` |
| MT03 | Block C R4 draft, Item & unit mapping; MYOB mapping read only | Record detail | 1440 × 900 | `40:1266` |
| MT04 | Substitutions: SYN-SBS-000007 accepted on criteria | Record detail | 1440 × 900 | `40:1824` |
| MT05 | Review & release: reviewed, authorised and issued by three people (E9) | Record detail | 1440 × 900 | `41:1356` |
| MT06 | Supply handover: the whole payload, version 2 with the PJ-06 brief, accepted by Robin Hale (E11) | Record detail | 1440 × 1383 | `41:1876` |
| MT12 | CP-4 SYN-MAT-000028 R2 raised after release; Workshop booked out R1 parts (S-15, N-N3) | Record detail | 1440 × 900 | `41:2434` |
| MT14 | Changes & history, grouped by day | Record detail | 1440 × 900 | `41:2913` |
| MT07 | Request substitution against stated criteria | Form | 1440 × 900 | `42:2622` |
| MT08 | Decide substitution SYN-SBS-000009, a result per criterion | Form | 1440 × 900 | `42:3171` |
| X17 | Submit materials review: blocked while lines are unmapped | Form | 1440 × 900 | `42:3715` |
| MT09 | Authorise and issue release, as Alex Morgan recorded R3 on Fri 23 Oct 2026 (E6, E9) | Form | 1440 × 900 | `42:4248` |
| X18 | Prepare Supply handover: the whole issued payload, version 2 (E11) | Form | 1440 × 1383 | `42:4749` |
| MT10 | R4 release blocked by two unmapped lines | State | 1440 × 900 | `43:4298` |
| MT11a | Water treatment SYN-MAT-000034 R1 draft: Ambiguous and Missing rows (S-14) | State | 1440 × 900 | `43:4797` |
| MT11b | Company B (SYN Greenhouse Demonstration) reads "Authority not configured" (E6) | State | 1440 × 900 | `43:5270` |
| MT13 | Supply has not received: awaiting the receiver for 3 working days | State | 1440 × 900 | `43:5691` |
| TB09 | Block C R3 Lines at 1024 × 768 | Tablet | 1024 × 768 | `43:6129` |
| TB10 | Block C R3 Supply handover at 1024 × 768 | Tablet | 1024 × 768 | `43:6569` |
| PH12 | Decide substitution on the phone (MT08) | Phone | 390 × 844 | `43:6908` |
| — | Notes card | Notes | 1440 wide | `66:6014` |

### Change review · EN-07

Page `7:11` · `scope:EN-07`, `/engineering/changes` · 20 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| CR01 | Open changes by stage; decision, implementation and verification kept apart | Register | 1440 × 900 | `44:8` |
| CR02 | SYN-ECR-000014 K3 contactor rating, Change tab (S-16) | Record detail | 1440 × 900 | `44:657` |
| CR03 | Impact assessment across changes | Register | 1440 × 900 | `45:1160` |
| CR04 | Impact: nine areas by affected record, receiving state per cell, menu collapsed (S-28, N-N4) | Record detail | 1440 × 1524 | `44:1124` |
| CR05 | Decision: Technical accepted by Alex Lee after an independent review, with purposes | Record detail | 1440 × 900 | `44:1728` |
| CR09 | Actions: Drew Collins accepted, Quinn Avery declined with a reason, Robin Hale pending | Record detail | 1440 × 900 | `45:1669` |
| CR10 | Verification: Required, "Test pending", retest in SYN-CMS-000012 | Record detail | 1440 × 900 | `45:2134` |
| CR11 | History, grouped by day | Record detail | 1440 × 900 | `45:2575` |
| CR06 | Record technical decision, purposes stated | Form | 1440 × 900 | `46:2224` |
| CR07 | Authorise implementation: the project manager's side form, a Projects authority (Q7) | Form | 1440 × 900 | `46:2650` |
| CR08 | Confirm handovers: the exact preview of every action | Form | 1440 × 900 | `46:3057` |
| X19 | Assess impact: one area at a time, pre-filled rows reviewed (N-N4) | Form | 1440 × 1524 | `46:3497` |
| CR13 | SYN-ECR-000009: an action owner declined; the change is Returned (S-17) | State | 1440 × 900 | `46:4080` |
| CR14 | SYN-ECR-000008: retest failed on Fri 16 Oct, shown as at that day | State | 1440 × 900 | `46:4403` |
| CR15a | Confirm handovers: preview out of date | State | 1440 × 900 | `46:4736` |
| CR15b | Decision Accepted, implementation Not authorised: nothing is sent | State | 1440 × 900 | `46:5179` |
| TB11 | Actions at 1024 × 768 | Tablet | 1024 × 768 | `47:4205` |
| TB12 | Impact matrix at 1024 × 768, scrolling sideways | Tablet | 1024 × 768 | `47:4560` |
| PH13 | Change action accepted on the phone (CR12) | Phone | 390 × 844 | `47:4954` |
| PH14 | Change action declined with a reason (CR12) | Phone | 390 × 844 | `47:5006` |
| — | Notes card | Notes | 1440 wide | `66:10643` |

### Commissioning and as-built · EN-08

Page `7:12` · `scope:EN-08`, `/engineering/commissioning` · 23 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| CM01 | Packages by project and system | Register | 1440 × 900 | `48:8` |
| CM02 | SYN-CMS-000012 Test basis r02, approved for test; criteria with exact decimals (S-18) | Record detail | 1440 × 900 | `48:660` |
| CM03 | Results & retests: T06 3.1 A failed Thu 15 Oct, SYN-DEF-000027, retest 2.1 A passed Mon 19 Oct | Record detail | 1440 × 1420 | `49:1367` |
| CM08 | Configuration & redlines: RL-001 referred to change, D-02 open (S-19) | Record detail | 1440 × 900 | `48:2049` |
| CM10 | Release, as-built: eight gates, blocked by the open redline on screen drive 3 (S-20, N-N2) | Record detail | 1440 × 900 | `51:1532` |
| CM12 | Handover: obligations to Service; Equipment and Projects receive exact versions | Record detail | 1440 × 900 | `51:2018` |
| CM14 | History, grouped by day | Record detail | 1440 × 900 | `51:2480` |
| CM15 | SYN-CMS-000013 Block C dosing unit, test basis r01 Draft (S-21) | Record detail | 1440 × 900 | `51:2904` |
| CM04 | Record result: value, unit, limit, instrument and calibration; "Unable to assess" never passes | Form | 1440 × 1420 | `52:2629` |
| X20 | Approve test basis: the reviewer approves; the author cannot | Form | 1440 × 900 | `52:3352` |
| X21 | Decide difference | Form | 1440 × 900 | `52:3948` |
| CM11 | Release as-built: StagedArea excluding screen drive 3, by the independent authority | Form | 1440 × 900 | `52:4449` |
| CM13 | Hand over to Service: obligations, receiver and what Equipment records | Form | 1440 × 900 | `52:4908` |
| CM07 | Instrument calibration expired: the retest with SYN-MEG-001 is flagged and cannot pass | State | 1440 × 900 | `52:5384` |
| CM16a | Handover waiting on Service: SYN-CMS-000011 as at Fri 30 Oct 2026 | State | 1440 × 900 | `52:5794` |
| CM16b | The project manager reads SYN-CMS-000012: exact versions, no commands | State | 1440 × 900 | `52:6217` |
| TB13 | Test basis r02 at 1024 × 768 | Tablet | 1024 × 768 | `53:5114` |
| TB14 | Results and retests at 1024 × 768 | Tablet | 1024 × 768 | `53:5496` |
| TB15 | Release gates at 1024 × 768 | Tablet | 1024 × 768 | `53:5893` |
| PH15 | Today's tests, Taylor Brooks on site, Thu 15 Oct 2026 (CM05) | Phone | 390 × 844 | `53:6240` |
| PH16 | Record result outside its limit: retest required, defect raised (CM06, N-N7 proposed) | Phone | 390 × 844 | `53:6395` |
| PH17 | Add a redline: stored as a redline, never as a revision (CM09, N-N8 proposed) | Phone | 390 × 844 | `53:6453` |
| PH18 | Handover summary as the Service receiver sees it (CM12) | Phone | 390 × 844 | `53:6512` |
| — | Notes card | Notes | 1440 wide | `66:16577` |

### Insights · RP-03

Page `7:13` · `scope:RP-03`, Engineering extract · 5 sheets.

| Code | Sheet | View | Node |
|---|---|---|---|
| IS01 | Delivery performance, Engineering view: REP-06 and KPI-11 with their rules (S-30) | Overview | `54:8` |
| IS02 | Review cycle time, query response and finding patterns (proposed N-N6) | Overview | `54:509` |
| IS03 | Drill-through: KPI-11 Screen drives, from the count to its nine rows | Register | `54:933` |
| TB16 | Delivery performance, Engineering view at 1024 × 768 | Tablet | `55:984` |
| PH19 | Engineering measures on the phone | Phone | `55:1234` |
| — | Notes card | Notes | `68:1246` |

### Interaction states · EN

Page `7:14` · the Engineering workspace as a whole; no route · 3 sheets.

| Code | Sheet | View | Size | Node |
|---|---|---|---|---|
| ST01 | Interaction states: chips, revisions, buttons, checks, gates, impact cells, results, identities and headers, each in words | Reference sheet | 1440 × 2288 | `58:502` |
| ST02 | Register standard on EN-01: reorder, resize, inline edit with a change reason, why a cell cannot be edited (S-27) | Register | 1440 × 900 | `57:556` |
| ST03 | Contrast and keyboard: every text pair computed from the PPO colour variables; one Tab stop per region | Reference sheet | 1440 × 900 | `56:979` |
| — | Notes card | Notes | 1440 wide | `69:755` |

### Administration · EN

Page `7:15` · Engineering settings; no route is built · 11 sheets, desktop only.

| Code | Sheet | View | Node |
|---|---|---|---|
| AD01 | Engineering settings hub: what can be changed, by whom, at which scope; recent changes | Overview | `59:8` |
| AD02 | Review policy: Dean Fiedler's proposal for Technical release for procurement, in review by Casey Quinn (S-26) | Settings | `59:434` |
| AD04 | Release authority per company; Company B reads "Authority not configured" (E6) | Settings | `59:746` |
| AD05 | Query response times and the overdue rule | Settings | `59:1065` |
| AD06 | Disciplines, purposes, document types, revision letters and the output-hash check | Settings | `60:799` |
| AD07 | Redline, difference and obligation kinds | Settings | `60:1144` |
| AD08 | Numbering: the reference families, and the link to Workshop settings for test definitions | Settings | `60:1452` |
| AD09 | Notifications, saved views, columns, density and record layout | Settings | `60:1787` |
| AD03 | Publish version: the open reviews and releases affected, stated before publishing | Form | `60:2085` |
| X22 | Delegate release authority for a week, logged as a new decision (S-31) | Form | `60:2332` |
| AD02b | The proposer opens Review and is refused | State | `60:2592` |
| — | Notes card | Notes | `69:2841` |

## 4. Rules applied

- **Shell and layout (D9).** The accepted shell without change: top bar, rail with Engineering current, right strip, the docked Engineering menu with its nine accepted pages in four groups and the nested views of the current page (rule R108), or the accepted collapsed strip; no Quick create tiles (rule R107). Panels 432 px at the right without a scrim; dialogs 560 to 720 px with a navy scrim at 32 %. Records carry the record header and toolbar of Addendum A1 with one state-driven primary; the preparer or author sees it disabled with the reason (rule R117).
- **Records (6.8).** A checks bar of five facts per scope, each a chip with its rule (Package, Basis, Document, Review, Release, Change, Commissioning), a signals strip in words, a 380 px details column, view tabs and main cards. Side forms name the exact record and revision they bind and show the gate that would fail before submit.
- **Registers (6.2, 6.3).** One line per cell with an ellipsis and sideways scroll; no second search; view tiles with counts; a frozen first column with the reference and name and a frozen row menu; group bands across the full row; a footer with count and as-at time. The app-wide register standard (column reorder, resize, inline edit with a change reason, address lookup) is specified on ST01 and shown on ST02.
- **Control (D4, ADR-0047).** Review, authorise and issue are three operations by different people; the reviewer is never the author; the acceptor of a finding is never its owner; issue needs an accepted current review for the identical purpose; Sent, Delivered and Acknowledged are separate events; withdrawal erases nothing. Where no policy is published the sheet reads "Review policy not configured" or "Authority not configured" (E6).
- **Identities and revisions.** Every document shows its four identities apart (document, native file version, engineering revision, published output hash) with a copy control each; every revision shows its letter or number with its state; every review and issue shows the exact revisions it binds and the hash in short form.
- **Results (D9 of EN-08).** Exact decimals with the unit and limit beside the value, the instrument and its calibration state per row; "Unable to assess" never passes; one unresolved defect per check; a flagged instrument greys the row with the reason.
- **Ownership.** Cost and effort never appear as PPO figures; dates and costs are owned elsewhere on the impact matrix; the implementation authority on a change is the project manager's; receivers accept or return and never edit; Equipment records an outcome and writes no installed base.
- **References (Addendum A2).** `SYN-<TYPE>-<NUMBER>` under PPO-REFERENCE-NAMESPACES-DEC; supplier submittals are `SYN-SMT-` (Q2).
- **My Work (SH-01, SH-02, SH-06).** Blockers surface as Waiting on others; reviews and approvals as review items; every item is shown on the Engineering sheet that raises it.
- **Accessibility (6.6).** Status always has words; focus is a 2 px brand/green-deep ring inside the element; disabled is 45 % opacity; phone inputs are 16 px with 48 px options and stack at 320; contrast is proved on ST03 from the PPO colour variables.
- **Page template (D11, 6.7).** Six sections per scope page in one column with 360 px gaps: Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, Flows and notes, the last carrying the nine conformance fields for its scope.
- **Addendum A3.** One person per duty everywhere (Sam Jordan design engineer, Alex Lee controls engineer, Riley Chen drafter, Casey Quinn reviewer, Alex Morgan release authority, Taylor Brooks verifier) and one truth per fact; the CP-4 timeline of D7 on every sheet that touches it.

## 5. Assumptions and proposed departures

| ID | Assumption or departure |
|---|---|
| A1 | File name. The file is "PPO - Engineering module (proposal)" as Dean created it; the design-to-build standard names the domain file "PPO - Engineering & Projects", and Projects has its own file. Recorded, not changed |
| A2 | Page titles are the rail labels, with the module's full name as the sub-line (Q1); the route register's long titles differ. A departure for the register |
| A3 | Reference families follow PPO-REFERENCE-NAMESPACES-DEC: supplier submittals are `SYN-SMT-` so `SYN-SUB-` stays the subcontract package family (Q2); the EN-04 and PD-04 fixtures that used `SYN-SUB-` are earlier examples. The flyout's Recent rows use this file's fixtures; the Shell file's accepted stand-ins (DRW-, TQ-, CH-) remain to be aligned there |
| A4 | The collapsed docked menu is the accepted Shell strip as drawn in the Shell file: 12 px wide with 1300 px of content. The brief described 80 px and 1232 px; the accepted component was used (Q8) |
| A5 | No library is published to this file, so the shell, kit and icons are local rebuilds by value with the accepted names, ready to be swapped for the library |
| A6 | Capabilities marked † in the brief's persona matrix (technical review, issue and distribute; material review, release and receive; change review, decide, receive, verify and close; commissioning capture, review, issue and receive) are design assumptions: the observed role profiles of 10 October hold only read, create, edit, source and receive |
| A7 | The Engineering Pulse is a proposed page under Workload (Q5, N-N1); My Work remains the cross-module queue |
| A8 | Insights is the Engineering extract of the accepted RP-03 page; IS02 and its finding patterns are proposed (N-N6) |
| A9 | The output-hash check on Add revision (EN-03 D11) is drawn as a refusal marked proposed, not built (Q3) |
| A10 | Review policy and release authority are settings versions (Q4): release authority version 1 published Thu 1 Oct 2026 for Powerplants AU and reviewed by Alex Morgan; the review policy is not configured and Dean's procurement proposal is in review; SYN Greenhouse Demonstration (Company B) reads "Authority not configured" |
| A11 | D7 and Addendum A3 are adopted over the earlier Design pages (Q6): Glasshouse 4 belongs to Hillview Growers (earlier Riverbend on EN-08); the CP-4 dates follow D7 (T06 on Thu 15 Oct, not Mon 12 Oct as on Site assurance); drawings are `SYN-DWG-` (earlier `SYN-EDOC-` on EN-03); submittals are `SYN-SMT-` (earlier `SYN-SUB-` on EN-04) |
| A12 | Released 4 = SYN-ENG-000718 and 000720 (issued Fri 30 Oct 2026), 000711, and 000709 (re-issued as SYN-ISS-000017 on Thu 5 Nov 2026 at 08:55 after change; first released Fri 25 Sep as SYN-ISS-000009). "Released this week 2" counts first releases in the last seven days: 000718 and 000720. Their coordination status stays In design |
| A13 | Sam's "Reviews assigned to me 2" are change-impact reviews he did not author: SYN-ECR-000012 and SYN-ECR-000009. Casey Quinn's "Reviews to do" are SYN-REV-000046 and SYN-REV-000045 |
| A14 | The brief gives SYN-OPP-000301 to the Hillview Glasshouse 5 design basis; the Sales file uses SYN-OPP-000301 for Mallee Fresh Produce's irrigation pump station. Kept as the brief says; the clash is open |
| A15 | SYN-CMS-000012 test basis r02 (approved for test Tue 13 Oct 2026) cites SYN-DWG-000318 revision B, because revision C did not exist until Tue 3 Nov; the r03 draft adds T13 and cites C. The brief's "from 000318 C" is read as the current revision |
| A16 | Sheets drawn as at an earlier moment, each saying so in its header or banner: MT09 (R3 authorised and issued on Fri 23 Oct 2026; the brief names R4, which is still a blocked draft), MT13 (Thu 29 Oct), CR14 (Fri 16 Oct), CR15b (Tue 3 Nov, 11:00), CM13 and CM16a (SYN-CMS-000011, Fri 30 Oct) |
| A17 | New synthetic fixtures where the dataset was silent: SYN-MAT-000035, SYN-ECR-000013, SYN-TQ-000017, 000022, 000023 and 000024, SYN-SMT-000009, 000012 and 000015, SYN-REV-000031, 000042, 000043 and 000046, SYN-ISS-000009, 000012 and 000015, instruments SYN-MUL-004, SYN-INS-003, SYN-ROT-001, SYN-CAL-002 and SYN-MEG-001 (calibration expired Sat 31 Oct 2026), SYN-BKP-000017 and SYN-ACR-000008 |
| A18 | Contrast is computed from the variables in this file, which carry the accepted values by copy (A5); the one failing pair is audit item C1 |
| A19 | The rail shows Engineering current on the settings pages; Settings current would be truer (audit R2) |
| A20 | Addenda A1 and A2 were not supplied as text: A1 was read from the Shell file's record header toolbar components and rules R116 to R125; A2 is [readable reference namespaces](readable-reference-namespaces.md) |
| A21 | Three design-register notes are stale and are recorded here, not fixed: every Engineering route reads "Needs review"; `scope-en-01.md` gives parents ENG-01 to ENG-04 where ADR-0047 gives ENG-01; `route-engineering.md` and the EN-01 record disagree on who published the guide |
| A22 | Engineering settings are drawn at desktop only; their tablet and phone sections carry a note saying so |
| A23 | Where the brief gives a phone sheet its scope code (DR11, TQ04 on the phone, TR10, MT08 on the phone, CR12, CM05, CM06, CM09, CM12 on the phone), it is drawn as PH07 to PH18 and the index maps the codes; a letter suffix splits one brief code into two sheets (PS02, PS03, DR12, TQ09, TR03, MT11, CR15, CM16) |

Proposed features (section 10 of the brief): N-N1 Engineering Pulse (WL06, PH01), N-N2 "why this state" (PK05, CM10), N-N3 Where used everywhere (DR04, MT12) and N-N4 impact pre-fill (CR04, X19) are drawn as integrated features. N-N5 to N-N10 are drawn as proposals (TQ04, IS02, PH16, PH17, DB06, DB07). Each is grounded in the record's own data, labelled as a summary or suggestion, reviewed before anything is saved, and writes nothing to a record, a file or a release.

## 6. Verification

- **Renders.** Sheets were rendered inside Figma at 1200 to 1440 px and read during each batch; defects found were corrected and re-rendered. Not every one of the 193 sheets was re-read by eye after the last batch.
- **Structural pass, all 12 scope pages (Tue 10 Nov 2026).** 193 sheets, 0 issues: every sheet's direct children sit inside its bounds; no text in a register cell is taller than one line; Roboto is the only font family; every sheet has exactly one label starting with its code, at the sheet's x, 26 px above it and as wide as the sheet; no sheet is hidden or transparent.
- **Position audit, all pages.** Six sections per scope page in template order with 360 px gaps; every child inside its section; no sheet, label, notes card or section note overlaps another; empty sections carry a note; nothing is loose; the two separator pages and Scratch are empty. The Read me page holds the four cards without overlap.
- **Scans.** No cost or effort figure appears on any sheet. "Open in SharePoint" appears only as a link beside the recorded metadata; no sheet presents a file viewer. Dates: about 360 texts write the date without the year ("Fri 30 Oct", "Thu 15 Oct · 09:20") in cells, timelines and sentences, as the accepted Sales sheets also do; the brief's style is "Thu 5 Nov 2026" (audit R1).
- **Contrast.** Every text pair in use was computed on ST03 from the PPO colour variables with the WCAG 2.1 formula. One pair is below 4.5:1: white 14 px Medium on brand/green-deep, 3.57:1, used by the record toolbar primary of Addendum A1 (audit C1).
- **Story.** Counts were checked where they repeat across pages during the build (14 packages and their status split, Released 4, author actions 3, open queries, review and issue states, the CP-4 timeline). The query counts on the package record were corrected to 1 open and 1 answered. A file-wide text comparison of every reference, date and value against the dataset was not run as one pass; it remains open.
- **Capability and authority.** Each sheet is signed in as Sam Jordan unless its header names the actor; enabled commands follow the persona matrix and withheld ones state why. No sheet authors a file, derives Released from coordination progress, issues without an accepted current review, or shows a cost as a PPO figure.
- **Not done.** No prototype flow is wired. No person's keyboard, screen reader, 200 % zoom or device review is recorded. The sheets are design compositions and set no UI baseline.
- **Repository checks for this change.** `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

## 7. Not drawn and open questions

**Not drawn.** The Change tab of SYN-ECR-000014 at 1024 (the tablet shows Actions); a 200 % zoom proof of the desktop pages; a dialog of its own for Record retest (Record result is shared); a linked address on the Sites map and Site record (the Sites page's); a keyboard-only walk-through per flow; tablet and phone variants of Engineering settings and of most dialogs; the printed outputs and transmittal documents themselves (Documents owns them); prototype links.

**Open questions.** Cited with the repository's numbers and not resolved here.

| Question | State |
|---|---|
| Q1 to Q8 of the brief | Answered by their defaults; each is an assumption in section 5 and can be reversed without redrawing the set |
| D-002, D-008, D-012, D-019 | Technical authority and sources; open |
| PPO-011 | SOLIDWORKS versions, PDM and dependencies; open |
| EN-02 Q1 to Q6 | Open as recorded in the EN-02 design |
| EN-03 D11 | The output-hash check is drawn as proposed and is not built |
| EN-05 review policy | Which purposes and disciplines need which reviews; drawn as a settings proposal in review (AD02) |
| EN-06 E6 policy | The release authority policy per company; Company B has none |
| EN-07 D8 | The commercial prerequisite: accepting a change is never a Project, Finance or booking approval |
| EN-08 X7, X8 | Equipment records an outcome and writes no installed base; no My Work link type for commissioning yet |
| AT-15, AT-37 | Not claimed by this design |
| New in this file | SYN-OPP-000301 (A14); the contrast of the toolbar primary (C1); the date style in cells (R1); who holds the settings permissions; whether IS02 joins the accepted report |

## 8. Boundary and next steps

- **Design only.** No application code, route, read model, migration, permission, capability, grant, seed or integration was created or changed. Nothing here authorises a business transaction, a technical or commercial release, a customer communication or a migration.
- **The design register and page guidance follow in their own change.** This change does not edit `docs/design/development/`; the three stale register notes are recorded in A21.
- **Shell follow-up.** The record toolbar primary's contrast (C1); the Recent-row stand-ins in the Engineering flyout to align with the reference families (A3); the brief's description of the collapsed strip corrected to the accepted 12 px (A4).
- **Projects, Supply and Sales follow-ups.** Where Addendum A3 corrected their stories: Glasshouse 4 belongs to Hillview Growers; the Woodhaven demands are SYN-DEM-000101 and 000102 and Hillcrest's are 000105 and 000106; SYN-OPP-000301 is to be settled with the Sales file (A14).
- **Acceptance.** Dean reviews page by page; accepted pages move above the "— Proposals —" separator (moving a page keeps every node ID).

## 9. Audit — 10 November 2026

Run after the last batch. Every sheet was read against first impression, usability, hierarchy, consistency and accessibility while it was built, then the file was checked by script (section 6). What was clearly right was applied; the rest is proposed.

**Scenario coverage.** S-01 to S-32 of the brief each map to at least one sheet: S-01 WL01, WL06, PH01 · S-02 WL08, DB02, X04, WL05 · S-03 DB03 to DB10, TQ03 · S-04 DB11, DB12, DB13, X10 · S-05 DR02 to DR07, DR12a, DR12b · S-06 DR08, X14, TR05, TR07 · S-07 PH07, PH08 · S-08 TQ02 to TQ06, PH09 · S-09 TQ07 to TQ10 · S-10 TR02, TR03a, X15, X16, TR03b, TR04, TR08, TR09, TR11, PH10, PH11 · S-11 TR06 · S-12 TR12, TR13 · S-13 MT02 to MT10, X17, X18 · S-14 MT11a, MT11b, AD04 · S-15 MT12, CR02 · S-16 CR02 to CR10, X19, PH13, PH14 · S-17 CR13, CR14, CR15a, CR15b · S-18 CM02 to CM04, PH15, PH16 · S-19 CM07, CM08, X21, PH17 · S-20 CM10 to CM14, CM16a, CM16b, PH18 · S-21 CM15, X20 · S-22 WL04, DB07 · S-23 PS03a, PS03b · S-24 PS05, PS06 · S-25 PS07 · S-26 AD02, AD02b, AD03 · S-27 ST02, X13 · S-28 CR04, WL07 · S-29 WL06, PH01 · S-30 IS01, IS03 · S-31 X09, X22 · S-32 TR09, PH10. Every lifecycle state of the brief's sections 5.1 to 5.8 appears on a sheet or on the ST01 ramps; PS01 to PS10 cover 5.9 except 200 % zoom and keyboard-only completion (G2, G5).

| ID | Item | State |
|---|---|---|
| C1 | White 14 px Medium on brand/green-deep is 3.57:1, below 4.5:1, on the accepted A1 toolbar primary. Proposed for the Shell file, for every module: a darker primary such as #34832f (4.74:1) or status/success #416d33 (6.07:1); 18.67 px bold labels would meet the 3:1 large-text threshold but break the 32 px toolbar | Open, the Shell owner's |
| C2 | "CO2" written as CO₂ on 14 package rows | Applied |
| C3 | Query counts on PK01 to PK04 and PH04 corrected to 1 open, 1 answered (SYN-TQ-000019 open, SYN-TQ-000018 answered) | Applied |
| C4 | PH13's note corrected to "on site"; MT11b's company switcher reads SYN Greenhouse Demonstration | Applied |
| C5 | Two ST02 tooltips that covered Columns and ran under the right strip moved inside the content | Applied |
| C6 | During the build: CM03 results overflow and CM02 check column rebuilt; IS01 bar rows rebuilt; collapsed photo and redline tiles fixed in the helper; ST02 overlays rebuilt | Applied |
| R1 | Dates without the year in cells, timelines and sentences (about 360 texts), as the accepted Sales sheets do. Options: a rule that one-line cells and timelines omit the current year, or the year everywhere. Recommended: the rule, stated on ST01 for every module | Proposed |
| R2 | Settings pages to show Settings current on the rail (A19) | Proposed |
| R3 | CR08's background to show the actions before confirmation, not after | Proposed |
| R4 | The Shell file's flyout Recent stand-ins aligned to the reference families (A3) | Proposed |
| G1 | The Change tab of SYN-ECR-000014 at 1024; TB11 shows Actions | Open |
| G2 | A 200 % zoom proof of the desktop pages | Open |
| G3 | Record retest as its own dialog | Open |
| G4 | A linked address on the Sites map and Site record (with the Sites page) | Open |
| G5 | A keyboard-only walk-through per flow | Open |
| N-N1 to N-N4 | Drawn as integrated features (WL06 and PH01; PK05 and CM10; DR04 and MT12; CR04 and X19) | Drawn |
| N-N5 to N-N10 | Drawn as proposals (TQ04, IS02, PH16, PH17, DB06, DB07) | Proposed |
| P1 | X09's Package column truncates long package names | Proposed |
| P2 | MT06's Step column truncates | Proposed |

**Recommended order.** 1. Decide C1 in the Shell file, since it affects every module. 2. Decide R1, the date rule. 3. Draw G1. 4. Apply P1 and P2. 5. Apply R2 and R3. 6. Draw G3. 7. Decide N-N5, N-N9 and N-N10, which reuse existing records. 8. Draw G2 and G5 on the states page. 9. Draw G4 with the Sites page. 10. Take R4 to the Shell file. 11. Decide N-N6 to N-N8, which need Reporting's adoption and phone capture. Then update the design register and page guidance in their own change, save the named version and accept page by page.

## 10. Named version

No named version is saved yet. The proposal state should be pinned by Dean saving the named version "PPO - Engineering module (proposal) · 10 November 2026"; this section is updated when he does. Any later design change needs a new named version ([named-version build handoff](figma-named-version-build-handoff.md)).
