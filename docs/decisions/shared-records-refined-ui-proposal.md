---
document_id: PPO-SHARED-RECORDS-REFINED-FIGMA-PROP
date: 2026-11-13
owner: Dean Fiedler
status: Proposal awaiting Dean's acceptance; the full sheet set is drawn in a private Figma file and listed here with node IDs; no application code, route, read model, migration, permission, capability, grant, seed or deployment; every record shown is synthetic
source_commit: a65ac3f4a9a675f68c47567d8070a098b4f31b3f
versioning: git
---

# Customers, sites and equipment refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 13 November 2026 · **Status:** Proposal awaiting Dean's acceptance. The claim version of this record (10 November 2026) is superseded by this one; sections 1 to 8 now describe the drawn file and section 9 carries the audit with a recommended order. On 12 November 2026 every sheet that had been checked by script only was rendered and inspected, the defects found were repaired, and the fourteen dialogs and panels the first audit listed as gaps were drawn (sections 3, 6 and 9). On 13 November 2026 the polish items P2 to P8 from that audit were applied and checked by render (sections 6 and 9.3).

On 10 November 2026 Dean asked for the refined UI pages of the **shared records** to be built in a new private Figma file he created for the purpose, "PPO - Customers, Sites & Equipment module", inside the accepted shell and to at least the standard of the Sales module file, following the Customers, sites and equipment UI pages brief with Addendum A3 (persona and story reconciliation). His standing instruction applies: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The shared records are the records every module reads: Organisations (CS-01), People (CS-02), Stakeholders (CS-03), Sites (CS-04), Facilities and growing areas (CS-05), Access & readiness (CS-06), Account development (CS-07), Site surveys (CS-08) and the nine Equipment scopes (EQ-01 to EQ-09). This record is also the first repository record of the EQ-01, EQ-04 and EQ-09 proposals, whose rules otherwise live only on their notes cards in the reference design file.

Nothing drawn merges two records, confirms readiness from a booking or a note, books a visit from a plan, guesses a serial, decides a bulletin from a match, transfers warranty or defects to a replacement, performs a restore, or shows a restricted or unavailable source as empty or zero.

The file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)" | Source of truth for the chrome: top bar, collapsed rail, right strip, collapsed docked-menu strip, the record header toolbar set (Addendum A1; [rules R116 to R125](../design/development/systems/shell-refined-concept-rules.md)), the More workspaces panel and the New menu. Components are local copies under the same names so they can be swapped to the published library later |
| Private Figma file "PPO - Sales module (accepted)" | The page template, the kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile), 101 icon components, the tablet and phone chrome and the helper library. Its Contacts hub, Organisations register, Customer 360 Overview, person record, Stakeholders list, Sites register and record, New organisation and New person are reused by name and not redrawn |
| Private Figma file "PPO - Design", the "— Shared records —" pages | Frozen reference for content, accepted rules and stories; its shell is not the one copied. The Call / Control set was rebuilt from its rendered states because the file's large pages time out for scripted reads |
| Accepted page decisions | [Organisations](organisations-figma-design.md) (PPO-CS01-ORGANISATIONS-FIGMA-DEC), [People](people-figma-design.md) (PPO-CS02-PEOPLE-FIGMA-DEC), [Stakeholders](stakeholders-figma-design.md) (PPO-CS03-STAKEHOLDERS-FIGMA-DEC), [Sites](sites-figma-design.md) (PPO-CS04-SITES-FIGMA-DEC), [Facilities and growing areas](facilities-figma-design.md) (PPO-CS05-FACILITIES-FIGMA-DEC), [Access & readiness](access-readiness-figma-design.md) (PPO-CS06-ACCESS-READINESS-FIGMA-DEC), [Account development](account-development-figma-design.md) (PPO-CS07-ACCOUNT-DEVELOPMENT-FIGMA-DEC), [Site surveys](site-surveys-figma-design.md) (PPO-CS08-SITE-SURVEYS-FIGMA-DEC), [Bulletins and lifecycle](bulletins-lifecycle-figma-design.md) (PPO-EQ06-EQ07-BULLETINS-LIFECYCLE-FIGMA-DEC), [Configuration backups](configuration-backups-figma-design.md) (PPO-EQ08-CONFIGURATION-BACKUPS-FIGMA-DEC), [Calling](calling-figma-design.md) (PPO-CALLS-FIGMA-DEC; the phone numbers editor D8, stage 1c not authorised) |
| [BP-01](../blueprints/BP-01-master-blueprint.md) sections 7, 9, 13 and 17.3 | Parents CRM-01, CRM-03, CRM-04, CRM-06, PAR-07, PRJ-04, SVC-03, SVC-04, SVC-06, SVC-10, NFR-02; DAT-01 to DAT-03. No `EQ-` parent requirement exists: EQ-01 to EQ-09 are page-register scope IDs. All 78 parent IDs are unchanged |
| [PPO-STD-001](../standards/naming-conventions.md), [readable reference namespaces](readable-reference-namespaces.md), [site reference convention](site-reference-convention.md), [scope/design conformance](../standards/html-module-conformance.md), [design-to-build standard](../standards/design-to-build-standard.md) | References (`SYN-ORG-`, `SYN-SITE-` with the legacy `SYN-PPO-SITE-` beside it, `SYN-AST-`, `SYN-SRV-`), the deliberate absence of PER, FAC, SN, RDY and INS references, the nine-field declaration and the r20 page types |

## 2. Conformance declaration

Fields that are the same for every scope:

| Field | Declaration |
|---|---|
| Reused components | Local copies of the accepted shell (Shell / Top bar, Shell / Rail · collapsed with More, Sales and Service variants, Shell / Right rail · collapsed, Shell / Workspace menu · collapsed strip, Shell / Record header · toolbar set and its phone component, the More workspaces panel and New menu); the Sales kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile); 114 icon components (Lucide stand-ins for Font Awesome Light); the "PPO colour" variable collection (66 variables); the tablet top bar, phone header, status bar and the Sales and technician phone tab bars; the Call / Control set (ten states). New in this file and **proposed for the Shell file**: `Shell / Workspace menu · docked · Shared records` (Customers, Sites and Equipment groups, nested views per R108, no accent chip per R102) |
| Source authority | Dean's 10 November direction; the accepted page decisions above; the brief and Addendum A3. The EQ-01, EQ-04 and EQ-09 rules are proposals (tier 2) carried from the brief, the register and the code. The fixture is synthetic: as at Thursday 5 November 2026, signed in as Sasha Cole (Equipment records owner) unless a sheet names another persona; second story times (Riverbend Thu 12 Nov; Woodhaven Mon 9 Nov) are labelled on their frames |
| Departures | Section 5. All are proposals awaiting Dean's decision |
| Verification | Section 6. Design delivery is separate from acceptance (Dean's), build (none) and runtime integration (none) |

Fields per scope area (authority stays with the owner named in the outgoing column; section 5.12 of the brief):

| Scope | Scope identity (route) | Page types (r20) | Incoming handover | Outgoing handover | Exceptions and recovery |
|---|---|---|---|---|---|
| CS-01 Organisations | `/customers`, `/customers/[id]` (the Sales file drew the register and Overview) | Record detail with seven tabs; Register views; create form with Check before creating | More panel, Sales › Contacts, global search, My Work | Deals (opens Deals), Service, Projects, Sites, Account development, Data quality (possible duplicates, never merged) | Restricted Accounts without Finance; Unavailable source shown as a word with a dash; possible duplicate opens in Data quality |
| CS-02 People | `/people`, `/people/[id]` | Record detail (Relationships, Relied on by, Notices, History); side form; dialogs; Register views | People register, Stakeholders handover, Site contacts | Data quality; the sending pages read notice preferences; Calling reads numbers (stage 1c) | Restricted channels read "Mobile restricted"; flagged and unreadable numbers; inactivation with the site-contact warning |
| CS-03 Stakeholders | `/customers/[id]/stakeholders` | Record (tabbed) with a grouped register | Customer 360 "…" › Stakeholders; Related › Stakeholders | People Correct details (Change primary contact handover); Sites contacts; Data quality | Gaps derived and linked to the fixing page; viewer sees names and roles only |
| CS-04 Sites | `/sites`, `/sites/[id]` | Register; Record detail (workspace) | More panel, Organisations Sites tab, Service work | Access & readiness (never confirmed here), Start service request (Service), Facilities, Equipment, external maps | Readiness Unknown, Biosecurity unknown, Address to review; phone at 320 moves Readiness into More |
| CS-05 Facilities | `/facilities`, `/facilities/[id]` | Register with List or Hierarchy and a snapshot; Record detail; Review changes comparison | Sites › Facilities & areas; Site surveys as measurement source | Equipment links (reason and source); Service and Projects read areas | Details to complete; a failed or stale save keeps entries |
| CS-06 Access & readiness | `/sites/[id]/readiness` | Record detail with check, requirements, evidence, windows, preparation | Site record; Service visits (schedule version); Projects readiness inputs | Recheck signal to packs and the planner; nothing granted (five "Not" words) | Recheck required; acknowledgement with a blocker; changed source refuses save; capturer cannot review evidence |
| CS-07 Account development | `/customers/development` (proposed), `/customers/[id]/development` | Register; Record detail with six tabs; side forms; outcome form; phone car-park view | Organisations; My Work | Calendar (Plan a visit), Deals (Raise in Deals), My Work (next actions) | No plan; owner's own review refused; Waiting to send and "Kept, not sent" on the phone |
| CS-08 Site surveys | `/surveys`, `/surveys/[id]` | Register; Record detail with six tabs; New survey form; phone capture | Sites; Estimating basis waiting on a survey | Estimating or Engineering (Record reviewed handover); Facilities measurements | Returned (Unknown entered as 0); owner, submitter and recorder cannot review |
| EQ-01 · EQ-02 · EQ-03 · EQ-05 Equipment | `/equipment`, `/equipment/[id]`, `/equipment/lookup` | Register; asset Record detail; Identify (scan, typed, private no-match); configuration succession; documents and timeline | Service requests and visits; Engineering as-built outcome; Supply serials at release | Service (work), Data quality (identity corrections), Backups, Bulletins | Unresolved and Disputed identity; private no-match; camera denied; Waiting to send |
| EQ-04 Movement | `/equipment/changes` (proposed) and the record's lifecycle view | Register; Review / comparison; dialogs | Proposals from Service and Equipment records | Applied changes read back by Service and Sites | Blocked by open work; proposer cannot apply; history never rewritten |
| EQ-06 · EQ-07 Bulletins and lifecycle | `/equipment/bulletins`, `/equipment/lifecycle` | Registers; Review / comparison; dialog; Record with handover panel | Manufacturer bulletins; supplier evidence | Service (one owning workflow, read back); Sales aftercare (Date needed) | Cannot tell with next step; superseded revision re-reviewed; Unknown support never read as supported |
| EQ-08 Configuration backups | `/equipment/backups` | Register with Backups and Gaps; Record with stage timeline; side forms | Configuration changes (EQ-03); Supply controller backups | My Work gaps and nudges | Verifier equals tester refused; Historical backup; no credentials stored |
| EQ-09 Test instruments | `/equipment/instruments` | Register; Record with validity bar; side forms | Inspections and bench tests (uses); Company tools custody (read only) | Inspections read validity | Expired; Withdrawn with effective date; renewal never repairs earlier readings |
| Administration | Settings › Shared records (proposed) | Configuration editors with propose, review and publish | Administrators and policy owners | The record pages read published versions | Proposer cannot review or publish; publish lists sites affected |

## 3. Sheet inventory

198 sheets on 15 pages: 76 desktop, 46 dialogs and panels, 31 states (5 of them on the phone), 16 tablet at 1024 × 768 and 29 phone (4 of them at 320). Fourteen of the dialogs and panels were added on 12 November 2026 (PE10, PE11, SK08, FA09, FA10, AR10, EQ12, BL07 and X01 to X05 with X03-restricted); no earlier sheet changed its node ID. TB and PH codes run across the file (TB01 to TB16; PH01 to PH20 with their variants). Each page also carries a "Flows and notes" card. The Read me page holds four cards: the header `90:2`, "Sheet index and notes" `90:23`, the audit `90:87` and the page template `90:126`. The "Shell and kit" page holds the copied shell components, the kit, the icons, the chrome, the Call / Control set and the proposed `Shell / Workspace menu · docked · Shared records` set `16:1719`.

**Organisations · CS-01**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| OR01 | Hillview Growers, Sales tab (full length) | Desktop 1440 | `38:8` |
| OR02 | Hillview Growers, Service tab | Desktop 1440 | `38:615` |
| OR03 | Hillview Growers, Projects tab | Desktop 1440 | `38:1061` |
| OR04 | Hillview Growers, Sites tab | Desktop 1440 | `39:1030` |
| OR05 | Hillview Growers, Activity tab | Desktop 1440 | `39:1456` |
| OR07 | Hillview Growers, Accounts tab (Finance reader) | Desktop 1440 | `39:1897` |
| OR08 | Organisations, Possible duplicates | Desktop 1440 | `39:2310` |
| OR10 | Organisations, Without a current site and Inactive | Desktop 1440 | `39:2595` |
| OR06 | About this source | Dialogs and panels | `40:2350` |
| OR09 | New organisation with Check before creating | Dialogs and panels | `40:2731` |
| OR07R | Accounts tab restricted | States | `40:3023` |
| TB01 | Hillview Growers Sales tab at 1024 | Tablet 1024 | `40:3402` |
| TB02 | Possible duplicates at 1024 | Tablet 1024 | `40:3785` |
| PH01 | Hillview Growers on the phone | Phone 390 and 320 | `40:4030` |

**People · CS-02**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| PE01 | Priya Shah, Relationships | Desktop 1440 | `53:8` |
| PE02 | Relied on by | Desktop 1440 | `53:577` |
| PE03 | Notices | Desktop 1440 | `53:1095` |
| PE04 | History | Desktop 1440 | `53:1597` |
| PE08 | People, Channels to review | Desktop 1440 | `53:2095` |
| PE05 | Correct details | Dialogs and panels | `53:2451` |
| PE06 | Phone numbers editor (proposed UI) | Dialogs and panels | `56:1836` |
| PE09 | Inactivate an affiliation over the Site contacts view | Dialogs and panels | `56:2288` |
| PE10 | Add number (proposed UI) | Dialogs and panels | `113:713` |
| PE11 | Flag number, "Number needs checking" (proposed UI) | Dialogs and panels | `113:1114` |
| PE07 | Flagged and unreadable numbers on the phone | States | `57:2625` |
| TB03 | Priya Shah at 1024 | Tablet 1024 | `56:2783` |
| PH02 | Priya Shah on the phone | Phone 390 and 320 | `57:2754` |
| PH02-form | Correct details on the phone | Phone 390 and 320 | `57:2916` |
| PH03 | Phone numbers editor as a full-screen sheet | Phone 390 and 320 | `57:3002` |

**Stakeholders · CS-03**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| SK01 | Hillview Growers / Stakeholders, People (full length) | Desktop 1440 | `42:8` |
| SK02 | Site parties | Desktop 1440 | `42:721` |
| SK03 | Relationship map and its list (full length) | Desktop 1440 | `42:1130` |
| SK04 | Gaps | Desktop 1440 | `46:954` |
| SK05 | History | Desktop 1440 | `46:1398` |
| SK06 | Change primary contact (handover) | Dialogs and panels | `46:1845` |
| SK08 | Add site party | Dialogs and panels | `113:336` |
| SK07 | Who to contact, restricted (viewer) | States | `48:1903` |
| TB04 | Stakeholders at 1024 (full length) | Tablet 1024 | `48:2053` |
| TB05 | Relationship map at 1024 (full length) | Tablet 1024 | `48:2573` |
| PH04 | Who to contact | Phone 390 and 320 | `48:1753` |

**Account development · CS-07**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| DV01 | Account development, All accounts (full length) | Desktop 1440 | `64:8` |
| DV02 | Hillview plan SYN-ADP-000002, Overview | Desktop 1440 | `64:724` |
| DV03 | Objectives tab | Desktop 1440 | `64:1247` |
| DV05 | Next actions and Commitments | Desktop 1440 | `64:1801` |
| DV06 | Opportunities, Reviews & history and Since the last visit | Desktop 1440 | `64:2309` |
| DV04 | Visits tab and Plan a visit | Dialogs and panels | `65:1590` |
| DV07 | Record visit outcome | Dialogs and panels | `65:2086` |
| DV09 | No plan and Start a plan | Dialogs and panels | `65:2506` |
| DV09-review | Review revision | Dialogs and panels | `65:2877` |
| DV09-refused | Own review refused | States | `65:3218` |
| DV08 | Waiting to send | States | `66:3440` |
| TB10 | Account development at 1024 (full length) | Tablet 1024 | `66:3537` |
| TB11 | Hillview plan at 1024 | Tablet 1024 | `66:3994` |
| PH09 | Account development car-park view | Phone 390 and 320 | `66:3101` |
| PH10 | Record visit outcome on the phone (full length) | Phone 390 and 320 | `66:3290` |
| PH10-320 | Record visit outcome at 320 | Phone 390 and 320 | `66:3392` |

**Sites · CS-04**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| SI01 | Sites register (full length) | Desktop 1440 | `21:444` |
| SI02 | Glasshouse 4, Overview | Desktop 1440 | `20:9` |
| SI03 | Glasshouse 4, Facilities & areas | Desktop 1440 | `21:1310` |
| SI04 | Glasshouse 4, Equipment (full length) | Desktop 1440 | `21:1800` |
| SI05 | Glasshouse 4, Work and visits | Desktop 1440 | `23:1345` |
| SI06 | Glasshouse 4, History | Desktop 1440 | `23:1799` |
| SI07 | Start service request | Dialogs and panels | `24:2245` |
| SI06A | Packing shed 3, Address to review | States | `23:2237` |
| TB06 | Sites register at 1024 | Tablet 1024 | `24:2928` |
| TB07 | Glasshouse 4 at 1024 | Tablet 1024 | `24:3418` |
| PH05 | Glasshouse 4 on the phone at 390 | Phone 390 and 320 | `24:2651` |
| PH05-320 | Glasshouse 4 on the phone at 320 | Phone 390 and 320 | `24:2797` |

**Facilities and growing areas · CS-05**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| FA01 | Facilities, All facilities (full length) | Desktop 1440 | `61:8` |
| FA02 | Hierarchy view | Desktop 1440 | `61:790` |
| FA04 | Bay 4 record, Overview | Desktop 1440 | `61:1165` |
| FA05 | Bay 4, Equipment tab | Desktop 1440 | `61:1708` |
| FA08 | Details to complete, with Sources and History | Desktop 1440 | `61:2304` |
| FA03 | Snapshot over the grid | Dialogs and panels | `63:1380` |
| FA06 | Correct details, then Review changes side by side | Dialogs and panels | `63:1879` |
| FA07 | Add growing area with Check before creating | Dialogs and panels | `63:2284` |
| FA09 | Link equipment to a facility | Dialogs and panels | `113:1481` |
| FA10 | End a link | Dialogs and panels | `113:1879` |
| TB08 | Facilities at 1024 | Tablet 1024 | `63:2730` |
| PH06 | Facilities at Glasshouse 4 on the phone | Phone 390 and 320 | `63:3185` |
| PH06-bay4 | Bay 4 on the phone | Phone 390 and 320 | `63:3354` |

**Site surveys · CS-08**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| SU01 | Site surveys register (full length) | Desktop 1440 | `67:8` |
| SU02 | SYN-SRV-000031, Survey tab | Desktop 1440 | `67:765` |
| SU03 | Observations tab | Desktop 1440 | `67:1273` |
| SU04 | Photos tab (full length) | Desktop 1440 | `67:1959` |
| SU05 | Review & handover | Dialogs and panels | `68:1305` |
| SU07 | New survey | Dialogs and panels | `68:2496` |
| SU05-refused | Owner's review refused | States | `68:1723` |
| SU06 | Returned | States | `68:2070` |
| TB12 | SYN-SRV-000031 at 1024 | Tablet 1024 | `68:2884` |
| PH11 | Survey list on the phone | Phone 390 and 320 | `68:3238` |
| PH12 | Observation capture with photos | Phone 390 and 320 | `68:3350` |

**Access and readiness · CS-06**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| AR01 | Glasshouse 4 readiness at 08:58 (full length) | Desktop 1440 | `26:8` |
| AR02 | Glasshouse 4 readiness at 11:20 (full length) | Desktop 1440 | `26:661` |
| AR03 | Requirements tab, revision 4 | Desktop 1440 | `27:728` |
| AR05 | Visit preparation and Work windows | Desktop 1440 | `27:1236` |
| AR06 | Evidence tab with Review evidence | Desktop 1440 | `27:1641` |
| AR08 | Northbank Farm · Block C readiness | Desktop 1440 | `27:2098` |
| AR04 | Record customer confirmation (P4) | Dialogs and panels | `28:1894` |
| AR07 | Acknowledge with a blocker | Dialogs and panels | `28:2339` |
| AR09 | Edit requirements, revision 5 | Dialogs and panels | `28:2743` |
| AR09R | Review revision 5 | Dialogs and panels | `28:3213` |
| AR10 | Review evidence | Dialogs and panels | `113:2255` |
| AR07A | Acknowledge refused (changed source) | States | `28:3612` |
| TB09 | Glasshouse 4 readiness at 1024 | Tablet 1024 | `29:3338` |
| PH07 | Readiness on the phone at 390 | Phone 390 and 320 | `29:3694` |
| PH07-320 | Readiness on the phone at 320 | Phone 390 and 320 | `29:3844` |
| PH08 | Evidence capture on the phone | Phone 390 and 320 | `29:3973` |
| PH08-denied | Evidence capture, camera denied | Phone 390 and 320 | `29:4059` |

**Equipment · EQ-01 · EQ-02 · EQ-03 · EQ-05**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| EQ01 | Installed base register (full length) | Desktop 1440 | `30:8` |
| EQ02 | CP-4 panel SYN-AST-000214, Overview (full length) | Desktop 1440 | `30:911` |
| EQ03 | CP-4, Lifecycle view | Desktop 1440 | `31:724` |
| EQ04 | CP-4, Inspections, Backups and Support | Desktop 1440 | `31:1180` |
| EQ05 | CP-4, Configuration succession r1 to r2 | Desktop 1440 | `31:1653` |
| EQ06 | CP-4, Documents and service timeline | Desktop 1440 | `31:2089` |
| EQ07 | Identify equipment | Desktop 1440 | `32:1961` |
| EQ09 | Screen drive 4 motor SYN-AST-000219, History | Desktop 1440 | `32:2324` |
| EQ11 | Installed base, Unresolved and Disputed | Desktop 1440 | `32:2773` |
| EQ10 | As-built release SYN-CMS-000012 arrives | Dialogs and panels | `32:3133` |
| EQ12 | Record history on the desktop | Dialogs and panels | `114:2` |
| EQ08 | Identify, private no-match | States | `32:3485` |
| TB13 | Installed base at 1024 | Tablet 1024 | `33:3313` |
| TB14 | CP-4 panel record at 1024 | Tablet 1024 | `33:3697` |
| PH13 | Equipment at Glasshouse 4 on the phone | Phone 390 and 320 | `33:3997` |
| PH14 | Identify equipment on the phone (scan) | Phone 390 and 320 | `33:4153` |
| PH14-320 | Identify equipment at 320 (typed) | Phone 390 and 320 | `33:4264` |
| PH14-nomatch | Identify equipment, camera denied and no match | Phone 390 and 320 | `33:4353` |
| PH15 | Screen drive 2 motor on the phone | Phone 390 and 320 | `34:4032` |
| PH16 | Record history from the visit | Phone 390 and 320 | `34:4135` |
| PH20 | Offline, Waiting to send | Phone 390 and 320 | `34:4243` |

**Movement, replacement and retirement · EQ-04**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| MV01 | Movement & changes register | Desktop 1440 | `36:8` |
| MV04 | Applied replacement (Block C dosing unit) | Desktop 1440 | `36:582` |
| MV02 | Propose change: Replace M-2 | Dialogs and panels | `36:965` |
| MV03 | Review decision: Apply or Reject | Dialogs and panels | `36:1372` |
| MV05 | Relocate VB-4 | Dialogs and panels | `37:1196` |
| MV05B | Correct recorded location TS-5 | Dialogs and panels | `37:1578` |
| MV06 | Retire VA-41 | Dialogs and panels | `37:1943` |
| MV03B | Apply blocked while SYN-WO-000062 is open | States | `37:2307` |
| MV06S | VA-41 retired | States | `37:2640` |
| PH-MV1 | Record a replacement on the phone | Phone 390 and 320 | `37:2977` |

**Bulletins and lifecycle · EQ-06 · EQ-07**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| BL01 | Bulletins register | Desktop 1440 | `70:8` |
| BL02 | SA-SB-26-014 rev A | Desktop 1440 | `70:705` |
| BL04 | SYN-BUL-000006 r2 supersedes r1 | Desktop 1440 | `71:1399` |
| BL05 | Lifecycle register | Desktop 1440 | `70:1209` |
| BL03 | Review a candidate | Dialogs and panels | `71:988` |
| BL06 | Climate controller 02 support record and the aftercare handover | Dialogs and panels | `71:1844` |
| BL07 | Record support evidence | Dialogs and panels | `114:475` |
| TB15 | SA-SB-26-014 at 1024 | Tablet 1024 | `71:2263` |
| PH17 | Bulletin compare-then-review on the phone | Phone 390 and 320 | `71:2600` |

**Configuration backups · EQ-08**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| BK01 | Configuration backups register | Desktop 1440 | `73:8` |
| BK02 | SYN-BKP-000019 for the CP-4 panel | Desktop 1440 | `73:649` |
| BK04 | Gaps | Desktop 1440 | `73:1068` |
| BK03 | Record backup | Dialogs and panels | `74:946` |
| BK03-stage | Record stage | Dialogs and panels | `74:1308` |
| BK03-refused | Verifier equals tester, refused | States | `74:1665` |
| BK05 | Historical backup | States | `74:1985` |
| TB16 | SYN-BKP-000019 at 1024 | Tablet 1024 | `74:2321` |
| PH18 | Record backup on the phone | Phone 390 and 320 | `74:2633` |

**Test instruments and calibration · EQ-09**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| TI01 | Test instruments register | Desktop 1440 | `75:8` |
| TI02 | SYN-MEG-002 insulation tester | Desktop 1440 | `75:679` |
| TI04 | Renew | Dialogs and panels | `75:1711` |
| TI04-withdraw | Withdraw and Record use link | Dialogs and panels | `75:2069` |
| TI03 | Expired SYN-FLO-001 | States | `75:1047` |
| TI03-withdrawn | Withdrawn SYN-TMP-003 | States | `75:1375` |
| PH19 | Instrument validity on the phone | Phone 390 and 320 | `75:2412` |

**Interaction states · CS · EQ**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| ST01-1 | Word families and chips (full length) | Desktop 1440 | `77:8` |
| ST01-2 | Controls, register rows and the Call control (full length) | Desktop 1440 | `77:515` |
| ST01-3 | App-wide register standard (full length) | Desktop 1440 | `78:594` |
| ST01-4 | Keyboard order and the contrast proof (full length) | Desktop 1440 | `78:933` |
| X01 | Filters | Dialogs and panels | `114:878` |
| X02 | Columns | Dialogs and panels | `114:1503` |
| X03 | Export | Dialogs and panels | `114:2061` |
| X03-restricted | Export for a restricted reader | Dialogs and panels | `114:2598` |
| X04 | Save view | Dialogs and panels | `114:3129` |
| X05 | Address lookup | Dialogs and panels | `114:3673` |
| PS01 | Loading | States | `79:1045` |
| PS02 | True empty: No equipment at this site | States | `79:1350` |
| PS03 | True empty: Nothing to review | States | `79:1567` |
| PS04 | Filtered empty | States | `79:1767` |
| PS05 | Could not load | States | `79:1991` |
| PS06 | Private no-match on Identify | States | `79:2262` |
| PS07 | Restricted | States | `79:2474` |
| PS08 | Unavailable | States | `79:2731` |
| PS09 | Stale | States | `79:2951` |
| PS10 | Change blocked by open work | States | `79:3183` |
| PS11 | Verifier equals tester refused | States | `79:3420` |
| PS12 | Owner or recorder review refused | States | `79:3648` |
| PS13 | Offline on the phone | States | `79:4117` |
| PS14 | Camera denied | States | `79:4221` |
| PS15 | Permission changed while open | States | `79:3877` |

**Administration · CS · EQ**

| Code | Sheet | Section | Node ID |
|---|---|---|---|
| AD01 | Shared records settings hub | Desktop 1440 | `76:8` |
| AD02 | Identity and duplicate rules | Desktop 1440 | `76:364` |
| AD03 | Readiness policies | Desktop 1440 | `76:689` |
| AD04 | Account development rules | Desktop 1440 | `76:1018` |
| AD05 | Survey rules | Desktop 1440 | `76:1300` |
| AD06 | Equipment change and lifecycle rules | Desktop 1440 | `76:1589` |
| AD07 | Bulletin, support, backup and calibration policies | Desktop 1440 | `76:1878` |
| AD08 | Numbering, notifications and nudges | Desktop 1440 | `76:2228` |

## 4. Rules applied

- **Shell geometry and tokens.** 48 px top bar with global search, 80 px collapsed rail, 48 px right strip; registers open with the accepted 12 px collapsed strip and records with the docked menu; content to x 1392; 432 px right panels without a scrim; centred dialogs with a navy 32 % scrim; colours bound to the "PPO colour" variables; Roboto 11 to 20 px.
- **Record header toolbar (Addendum A1, R116 to R125).** One primary, state-driven and singular; Actions as a labelled menu; Outputs absent where a record has none; "n of N in view"; a refused role sees the primary disabled with its reason; Read only where nothing is allowed.
- **One line per cell; no second search; counts state their source and are never combined;** Restricted and Unavailable are words, never zero; a dash only for a value that cannot be read.
- **Derived words carry their basis** (readiness, applicability, support, backup status, measurement, identity); one tone per meaning; words never colour alone.
- **Identity.** One record per identity; the path is a facility's identity; a person has no readable reference; possible duplicates and duplicate serials go to Data quality and are never merged here.
- **Roles.** The proposer does not apply or review; the owner, submitter and recorder do not review; the capturer does not review evidence; the tester does not verify.
- **Handovers.** Plans hand to Calendar and Deals; surveys to Estimating or Engineering; bulletins to one owning Service workflow; end of support to Sales aftercare as Date needed; nothing on these pages books, quotes, forecasts, approves or authorises work.

## 5. Assumptions and proposed departures

Each item is for Dean's decision. Page-level items are numbered on each page's notes card in the file.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | The brief describes the accepted collapsed docked-menu strip as 80 px wide; the accepted Shell component is 12 px. Registers use the 12 px strip as the Shell draws it | Keep the Shell's 12 px strip |
| A2 | A `Docked · Shared records` menu (Customers, Sites and Equipment groups, nested views per R108, no accent chip per R102) is drawn as a component in this file | Proposal for the Shell file |
| A3 | The rail shows More, Sales › Contacts or Service › Equipment as the current item by route of arrival; the More and Service rail variants were derived from the accepted rail | Keep; align with the Shell file on publication |
| A4 | The technician phone tab bar (My jobs, My Work, More) was derived from the accepted Sales phone tab bar | Confirm against the Service file |
| A5 | The Call / Control set was rebuilt from its rendered states, and the EQ-01 and EQ-09 notes cards could not be read, because the reference file's large pages time out for scripted reads | Re-read when the reference file is lighter; the EQ-01 and EQ-09 rules are taken from the brief, the register and the code |
| A6 | Where the story needs a record the brief does not name, a `SYN-` filler is used and listed on the page's notes card | Keep; every filler is synthetic |
| A7 | Proposed routes `/customers/development` (CS-07 Q6) and `/equipment/changes` (EQ-04) | Keep as proposals |
| A8 | The phone numbers editor is drawn as a proposed UI (Calling D8; stage 1c not authorised) | Keep as proposal |
| A9 | Bulletin dispositions in the accepted display words with the built enum beside them (the EQ-06 departure) | Keep |
| A10 | Page-level assumptions are numbered on each page's notes card: A-OR1 to A-OR4, A-PE1 to A-PE5, A-SK1 to A-SK5, A-DV1 to A-DV4, A-SI1 to A-SI4, A-FA1 to A-FA4, A-SU1 to A-SU4, A-AR1 to A-AR3, A-EQ1 to A-EQ4, A-MV1 to A-MV3, A-BL1 to A-BL4, A-BK1 to A-BK3, A-TI1 to A-TI3, A-ST1 to A-ST3 and A-AD1 to A-AD2. They cover synthetic fillers, worked examples, persona choices and the role assumptions marked ◇ (no capability is proposed) | Read with each page |
| A11 | After-hours is drawn as a fifth primary-contact purpose so the Glasshouse 4 gap has a fixing route (A-SK1); the accepted decision names four | Dean to decide |
| A12 | The brief's survey state counts add to 13 of 14; drawn as Reviewed 10 (A-SU1) | Dean to confirm the count |
| A13 | SYN-BKP-000019's four stages are dated 12 to 15 October in the brief, before configuration r2 was applied on 4 November; drawn as given (A-BK1) | Re-date the stages, or treat r2 as prepared on the bench first |
| A14 | The brief's "Tue 30 Jun 2027" is a Wednesday; drawn as Wed 30 Jun 2027 (A-TI1) | Keep |
| A15 | Reconciliations carried from Addendum A3.9: SYN-AST-000311 is Hillview's removed M-4 motor and SYN-AST-000308 the Block C dosing unit; serial SYN-SN-250318 (corrected from SYN-SN-250314, SYN-DQF-000047); Noah Patel (not the earlier "Noah Clarke"); Tatura VIC; the Nutrient Room is a facility within Glasshouse 4. Earlier fixtures in the reference file are superseded by these | Keep; align the module files named in section 8 |
| A16 | The Receiving against Inbound DP-25 serial inconsistency is left visible and unresolved; no sheet here resolves it | Keep visible |
| A17 | Bay 4 shows four current equipment links (Installed in 2, Serves 2) and one ended. The brief names one installed asset; the second is TS-5 after its recorded location was corrected (MV05B). The Equipment tab count was corrected from 3 to 4 on 12 November | Keep, or remove TS-5 from Bay 4 |
| A18 | The sheets added on 12 November use fillers: SYN Coolroom Services, HS-5 humidity sensor SYN-AST-000246 (serial SYN-SN-240315; first drawn as SYN-AST-000228, which is VB-4, and corrected on 13 November), five mobile numbers and recorded roles for Hillview people on the People register, and a Mildura address for Packing shed 3 | Keep; every filler is synthetic |
| A19 | Filters, Columns, Export and Save view are drawn once, on the People register (X01 to X04), as the pattern for every shared-records register; the Sales file's X07, X23 and X24 remain the reference | Keep |
| A20 | Registers open with the docked menu collapsed to the strip and records with it shown, as the brief asks. Eleven register sheets drawn with the menu shown (BL01, BL05, BK01, BK04, TI01, SU07, X01 to X04, X03-restricted) were corrected on 13 November | Keep |
| A21 | A register table fits its columns to the content when the content fits the page; when it does not, the columns keep their natural width and the table scrolls sideways with a scroll bar. A cell is never ellipsised to avoid a scroll. Small tables inside cards wrap instead | Keep; confirm as the register rule |
| A22 | The technician phone tab bar uses 10 px labels so its five items fit ("My inspections"); the Sales tab bar keeps 11 px | Confirm against the Service file with A4 |
| A23 | The content drawn on 13 November behind side panels and on the state sheets PS08 and PS09 uses fillers consistent with the registers: the r6 backup of Climate controller 02, three lifecycle rows on PS08, and the three kept entries on PS09 (the newer version is saved by Sam Patel, since the reader is Sasha Cole) | Keep; every filler is synthetic |

## 6. Verification

Run on 11, 12 and 13 November 2026 over all 15 pages after the last change:

- **Structural pass.** Nothing loose on any page; the separator pages and Scratch are empty; no section, sheet, label or notes-card overlap; no child outside its sheet; no register cell taller than one line; Roboto is the only font family (mixed runs are Roboto weights); every sheet has exactly one label with its own unique code, aligned 26 px above the sheet and truncated to its width; no sheet's content is taller than the sheet.
- **Rendered inspection.** Every sheet has been rendered at full size and inspected. Sites, Access and readiness, Equipment, Movement, Organisations and the first Stakeholders sheets were inspected as they were built. On 12 November the other 101 sheets were rendered and reviewed sheet by sheet; defects were found on about half of them and repaired (section 9.2). Eight repaired sheets (AD02, AD07, FA04, DV06, SU02, SK03, TI02, TB08) and seven of the fourteen new sheets (SK08, PE11, FA09, EQ12, X02, X03-restricted, X05) were then rendered again and inspected. On 13 November, after the polish pass, 32 changed sheets were rendered and inspected; that check found a further handful of defects of the same kinds (a blank page behind one more panel, ellipsised cells on other registers, a tile selection contradicted by its rows), which were repaired and rendered again.
- **Overflow and truncation scan.** A script measured every text against its container on every sheet. After the polish pass it finds no text wider than its frame, no truncated value in a fact strip or a small table, no register table that overflows without a scroll bar, and no sheet whose content is taller than the sheet. Three frozen first-column cells still shorten a name (on SI01, SI04 and EQ01).
- **Identity scan.** Every `SYN-` reference and serial on every sheet was extracted (over 200 distinct references) and checked against the brief's dataset, Addendum A3.9 and the fillers ledger. One legacy quotation reference was corrected to the short form. The legacy `SYN-PPO-SITE-000012` appears only beside its short form; `SYN-PPO-AST-000002` and `000003` are the seed fixtures the brief names. Every replacement shows two identities (SYN-AST-000311 and 000219; 000312 and 000221; 000308 and 000216).
- **Counts.** Register view counts were written from the brief's section 9.9; the Site surveys views were reconciled to 14 (A12); Glasshouse 4's per-facility equipment counts sum to its 23 assets; no total is drawn across sources. The visual pass corrected two counts that contradicted their own sheet (FA01's footer; Bay 4's Equipment tab, A17).
- **Wording.** The words merged, transferred, score, likelihood and healthy appear only inside rules that forbid them. Gendered pronouns were replaced with names. A weekday check over every dated text in the build scripts found one mislabelled date in the brief (A14) and none in the drawn sheets; the review passes of 12 November found no wrong weekday on the sheets they read.
- **Contrast.** Computed on sheet ST01-4 from the "PPO colour" variables (WCAG 2.1 relative luminance): all 14 text pairs pass 4.5:1 (lowest: grey chip 5.14:1; secondary text on chrome 5.29:1); the control edge (3.32:1) and the focus ring (3.57:1) pass 3:1; `line/strong` is 1.3:1 and fails as a control border (audit R1).
- **Repository checks.** `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`.

Limits: this is a visual proposal. The table refit and the tile outline of 13 November touched more sheets than were rendered again (32); the others were re-checked by script only, and a script cannot judge whether a table reads well. No prototype links, dark mode, 200 % reflow sheets, screen-reader behaviour or comparison with the built application were done. The EQ-01 and EQ-09 notes cards in the reference file could not be read (A5).

## 7. Not drawn and open questions

Not drawn (audit G3 and G4): tablet sheets for Test instruments and Administration; dark mode, 200 % reflow sheets and prototype links. The dialogs and panels listed as gaps on 11 November (audit G1 and G2) were drawn on 12 November.

Open questions, cited and not resolved here:

- Acceptance of the EQ-01, EQ-04 and EQ-09 proposals, which this file redraws.
- CS-01 Q1 to Q4, CS-06 Q3 (weekdays in work windows) and Q4 (the shared readiness signal on the planner), CS-07 Q1 to Q11, EQ-06 Q1 to Q6 and EQ-08 Q1 to Q4, as the accepted records list them.
- Calling stage 1c (the phone numbers editor UI) and whether it replaces the single phone field on People in one step.
- CX-01 custody, reservations and loans (conditional); a readable PER reference (optional); the Data quality correction workflow (AD-03 proposal); the hub switch's third tab (Sites).
- From this build: whether After-hours is a recorded purpose (A11); whether a technician sees the owner party in Who to contact; whether Channels to review includes organisation numbers; whether a Grouping facility may hold equipment directly; whether a Reviewed survey not yet handed over shows Record reviewed handover on the register row; whether a policy publish is blocked or only warns when visits in the next seven days are affected; the survey count (A12) and the backup stage dates (A13).

## 8. Boundary and next steps

Design only. No application code, route, read model, migration, permission, capability, grant, seed, integration or deployment is created; the design register, page guidance and the indexes are not edited here and follow in their own change. Delivery status (none), design acceptance (Dean's), production readiness (not inferred) and integration with MYOB, SharePoint, a maps provider, Teams or any manufacturer's tool (none exists and none is authorised) stay separate.

Next steps after acceptance: Dean saves a named version of the file; the design register and page guidance (`docs/design/development/`) are updated in their own change; the Sales file's shared-record sheets are aligned where Addendum A3.9 corrected a name; the Service, Supply, Engineering and Settings files' references are aligned; the Shell file takes the Shared records docked menu as a proposal. Any later design change needs a new named version.

## 9. Audit — 11 to 13 November 2026

The audit card on the Read me page (`90:87`) carries the same lists.

### 9.1 Corrections made during the audit (fixed in the file)

| ID | Correction |
|---|---|
| C1 | Stakeholders SK02: the main nursery's after-hours gap was removed so the gap count reconciles at 3 |
| C2 | Ten sheets that shared a code were given unique codes (PH02-form, DV09-review, DV09-refused, PH10-320, PH06-bay4, SU05-refused, BK03-stage, BK03-refused, TI04-withdraw, TI03-withdrawn), the four ST01 parts became ST01-1 to ST01-4, and every label was realigned to its sheet |
| C3 | Phone header view lines truncated on six earlier phone sheets (Sites, Access and readiness) |
| C4 | The Shell and kit sections were restacked without overlap |
| C5 | Thirteen texts with gendered pronouns were rewritten with names |
| C6 | `SYN-PPO-QUO-000151` corrected to `SYN-QUO-000151` on OR01 and TB01 |
| C7 | Avatars for 11 people outside the persona list showed full names; they now show initials |
| C8 | Eight tables wider than their column now fill it and scroll sideways; the SU03 observation columns were fitted so Value and Units show |
| C9 | Backup and calibration chip tones aligned to the tone rule (Out of date and Withdrawn danger; Unverified warning) |
| C10 | The phone numbers editor's Call controls were clipped and showed the wrong number; they are now icon-only. The Call control specimens on ST01-2 no longer overlap |
| C11 | The Site surveys docked-menu count for Reviewed was aligned with the register (10) |
| C12 | The full-length phone sheet PH10 was refitted to its content |

### 9.2 Corrections from the visual pass of 12 November (fixed in the file)

| ID | Correction |
|---|---|
| V1 | The More item of the rail was clipped at 768 high on 15 tablet sheets; the rail's spacing was tightened so every item shows |
| V2 | Fact, check and context strips that truncated at 1440 with the docked menu shown now wrap to a second row (17 sheets). This closes the earlier polish item P1 |
| V3 | Small tables whose middle column had collapsed (every Administration editor, and 11 other sheets) were rebalanced, and long values wrap |
| V4 | Text running out of its card or control was fixed on 12 frames (DV06, PE07, BK03-refused, OR07, AR01, AR02, SI01, EQ01, ST01-1); 54 truncated row sub-lines now wrap |
| V5 | Counts and words: FA01's footer reads 14 of 96; Bay 4's Equipment tab reads 4 (A17); "1 asset"; a literal "undefined" count was removed from the DV01 docked menu |
| V6 | The docked menu marks the open view on SK02 to SK05, BK04 and TI03; the view tiles on BK01, BK04 and TI01 no longer show a selection their rows contradict |
| V7 | The header chip on the two Record stage sheets reads Unverified; the Withdrawn banner uses the danger tone; story-time notes were moved from the UI into the sheet labels (DV07, TI04-withdraw) |
| V8 | SK03 stacks the relationship map above its list so the connectors and role labels show; the table group bands on SK01, TB04 and FA01 keep their owner or site reference |
| V9 | The phone header's chevron sits beside the view name (23 sheets); the TI02 validity captions no longer overlap |
| V10 | The confirming button in 32 dialogs and panels uses the primary style, matching the pages built first; SU04, AR01, AR02, ST01-1, ST01-4 and SK03 were refitted to their content |

### 9.3 Corrections from the polish pass of 13 November (fixed in the file)

| ID | Polish item | Correction |
|---|---|---|
| V11 | P2 | Side panels whose form is longer than the panel show a scroll thumb (PE05, SK06) |
| V12 | P3 | The selected view tile carries a 1 px outline on every register (32 tiles). A selection that its own grouped rows contradicted was cleared on BL01, BL05 and BK04 |
| V13 | P4 | The page behind a side panel is drawn on BK03, BK03-stage, BK03-refused, TI04, TI04-withdraw, DV09-review, SK06 and SU07 |
| V14 | P5 | Eleven register sheets now open with the collapsed strip (A20). Every register table was refitted by content need (A21): the columns fit on SU01, SU06, BK04, TI01, OR10, TB13 and X01 to X04, and scroll at natural width with a sized scroll bar on the others. The small tables on SK04 and DV03 were rebuilt as wrapping tables |
| V15 | P6 | PS08 shows the last complete read as rows and says so; PS09 shows the kept entries beside version 8 |
| V16 | P7 | The relationship map on SK03 and TB05 has three rows, so every connector has a source and the subcontractor hangs off Glasshouse 4. The DV05 commitments table shows its By and State columns (repaired by V3, confirmed by render) |
| V17 | P8 | The technician tab bar labels are 10 px (A22). The last shortened values in small tables wrap (AR03, EQ04, AD08) |
| V18 | — | Counts and words found by the render check: the CP-4 Inspections tab reads 4; three pagers agree with the highlighted view (TI04, TI04-withdraw, SU06); SU06 says 3 of 7 observations are shown; AD08 points to AD02 for numbering; a name on SK04 lost stray initials |
| V19 | — | TB05 is full length; the filler asset on FA09 has its own reference (A18) |

### 9.4 Corrections needing Dean's decision (conflicts inside the brief)

| ID | Conflict | Drawn as |
|---|---|---|
| C13 | Survey state counts add to 13 of 14 | Reviewed 10 (A12) |
| C14 | SYN-BKP-000019 stage dates precede configuration r2's applied date | As given, flagged (A13) |
| C15 | "Tue 30 Jun 2027" is a Wednesday | Wed 30 Jun 2027 (A14) |

### 9.5 Refinements (R)

| ID | Refinement |
|---|---|
| R1 | Use `line/control` (3.32:1) rather than `line/strong` (1.3:1) for the borders of unselected radios, choice chips, filter chips and photo placeholders. This touches the shared kit copied from the Sales file, so it is proposed rather than applied |
| R2 | Movement MV04: retitle the "What transferred" card so the word appears only in the rule |
| R3 | Give every register footer the same range wording ("1 to 16 of 96") |
| R4 | Shorten long record sub-lines (BL02, BK02) to kind · reference · state and move the rest to the bar |
| R5 | Re-read the EQ-01 and EQ-09 notes cards when the reference file can be read, and reconcile |

### 9.6 Gaps (G)

| ID | Gap | State |
|---|---|---|
| G1 | Filters, Columns, Export and Saved view panels; Export for restricted readers (permitted rows, no channels); Address lookup | Drawn 12 November: X01, X02, X03, X03-restricted, X04, X05 |
| G2 | Add number, Flag number, Add site party, Link equipment, End a link, Review evidence, a desktop Record history form, Record support evidence | Drawn 12 November: PE10, PE11, SK08, FA09, FA10, AR10, EQ12, BL07 |
| G3 | Tablet sheets for Test instruments and Administration | Not drawn (the 16 tablet sheets the brief lists are drawn) |
| G4 | Dark mode, 200 % reflow sheets and prototype links | Not drawn |

### 9.7 Automation candidates (N; rules first, none decides anything)

| ID | Candidate | Where |
|---|---|---|
| N-N1 | Check before creating: possible matches with reasons, "Continue anyway" and "Open match"; never a block, never a merge | OR09, FA07 (drawn) |
| N-N2 | Bulletin candidate matching: criteria met and criteria that could not be checked; the disposition stays with the service lead | BL02 (drawn) |
| N-N3 | Readiness check assembly with each unmet item's resolving action; any source change marks it out of date | AR01, AR02 (drawn) |
| N-N4 | Backup and calibration gap detection by rule, each with owner, due date and source | BK04, TI01 (drawn) |
| N-N5 | Serial scan on the phone with the same private no-match for unknown and inaccessible assets | EQ07, PH14 (proposal) |
| N-N6 | Since the last visit: a dated list across permitted sources, restricted sources left out | DV06 (proposal) |
| N-N7 | Duplicate serial and same-name findings to Data quality with both identities kept | OR08, EQ09 (proposal) |
| N-N10 | Relationship gaps derived from recorded roles, each naming the fixing page | SK04 (proposal) |
| N-N11 | Survey observation capture on the phone, kept offline as Waiting to send | PH12 (proposal) |
| N-N12 | Site-name differences from handovers raised as Address to review, never resolved automatically | SI06, SI06A (proposal) |
| N-N8, N-N9 | Knowledge for this equipment; configuration drift note | Noted only |

### 9.8 Polish (P)

| ID | Polish | State |
|---|---|---|
| P1 | Fact strips truncating at 1440 | Closed by V2 |
| P2 | Scroll affordance on long side panels | Closed by V11 |
| P3 | Stronger selected view tile | Closed by V12 |
| P4 | Page body behind a side panel | Closed by V13 |
| P5 | Last column under the scroll edge | Closed by V14 |
| P6 | PS08 and PS09 promise content they did not show | Closed by V15 |
| P7 | TB05 connector without a source; DV05 commitments columns | Closed by V16 |
| P8 | Technician tab bar label; three small tables | Closed by V17 |
| P9 | Three frozen first-column cells still shorten a name (SI01, SI04, EQ01); a record header star can sit under a side panel's edge | Open, minor |

### 9.9 Recommended order

1. Dean decides C13 to C15 and the open questions of section 7.
2. Apply R1 in the shared kit together with the Sales file.
3. R2 to R4 and P9.
4. R5 when the reference file is readable.
5. Draw G3 if wanted.
6. Dean accepts and saves a named version; the design register and page guidance follow in their own change.
