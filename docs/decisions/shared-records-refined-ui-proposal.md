---
document_id: PPO-SHARED-RECORDS-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal in progress (claim); about half of the sheets are drawn in a new private Figma file and this record will list them all with their node IDs when the build is complete; no application code, route, read model, migration, permission, capability, grant, seed or deployment; every record shown is synthetic
source_commit: 9926da5fa9a3b60fbc22843d25ddea1af4830bf5
versioning: git
---

# Customers, sites and equipment refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposal in progress. This record claims the work and reports what is drawn so far. Once every sheet is drawn it will carry the full sheet inventory with node IDs, the nine-field conformance declaration per scope, the rules applied, the consolidated assumptions and proposed departures, the verification and the audit, in the same shape as the [Sales record](sales-module-refined-ui-proposal.md) (PPO-SALES-REFINED-FIGMA-PROP).

On 10 November 2026 Dean asked for the refined UI pages of the **shared records** to be built in a new private Figma file he created for the purpose, "PPO - Customers, Sites & Equipment module", inside the accepted shell and to at least the standard of the Sales module file, following the Customers, sites and equipment UI pages brief with Addendum A3 (persona and story reconciliation). His standing instruction applies: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The shared records are the records every module reads: Organisations (CS-01), People (CS-02), Stakeholders (CS-03), Sites (CS-04), Facilities and growing areas (CS-05), Access & readiness (CS-06), Account development (CS-07), Site surveys (CS-08) and the nine Equipment scopes (EQ-01 to EQ-09). This record is also the first repository record of the EQ-01, EQ-04 and EQ-09 proposals, whose rules otherwise live only on their notes cards in the reference design file.

Nothing drawn merges two records, confirms readiness from a booking or a note, books a visit from a plan, guesses a serial, decides a bulletin from a match, transfers warranty or defects to a replacement, performs a restore, or shows a restricted or unavailable source as empty or zero.

The file's link and key are not recorded in this public repository (ADR-0050, ADR-0053).

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)" | Source of truth for the chrome: top bar, collapsed rail, right strip, collapsed docked-menu strip, the record header toolbar set (Addendum A1; [rules R116 to R125](../design/development/systems/shell-refined-concept-rules.md)), the More workspaces panel and the New menu. Components are local copies under the same names so they can be swapped to the published library later |
| Private Figma file "PPO - Sales module (accepted)" | The page template, the kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile), 101 icon components, the tablet and phone chrome and the helper library. Its Contacts hub, Organisations register, Customer 360 Overview, person record, Stakeholders list, Sites register and record, New organisation and New person are reused by name and not redrawn |
| Private Figma file "PPO - Design", the "— Shared records —" pages | Frozen reference for content, accepted rules and stories; its shell is not the one copied. The Call / Control set was rebuilt from its rendered states because the file's large pages time out for scripted reads |
| Accepted page decisions | [Organisations](organisations-figma-design.md) (PPO-CS01-ORGANISATIONS-FIGMA-DEC), [People](people-figma-design.md) (PPO-CS02-PEOPLE-FIGMA-DEC), [Stakeholders](stakeholders-figma-design.md) (PPO-CS03-STAKEHOLDERS-FIGMA-DEC), [Sites](sites-figma-design.md) (PPO-CS04-SITES-FIGMA-DEC), [Facilities and growing areas](facilities-figma-design.md) (PPO-CS05-FACILITIES-FIGMA-DEC), [Access & readiness](access-readiness-figma-design.md) (PPO-CS06-ACCESS-READINESS-FIGMA-DEC), [Account development](account-development-figma-design.md) (PPO-CS07-ACCOUNT-DEVELOPMENT-FIGMA-DEC), [Site surveys](site-surveys-figma-design.md) (PPO-CS08-SITE-SURVEYS-FIGMA-DEC), [Bulletins and lifecycle](bulletins-lifecycle-figma-design.md) (PPO-EQ06-EQ07-BULLETINS-LIFECYCLE-FIGMA-DEC), [Configuration backups](configuration-backups-figma-design.md) (PPO-EQ08-CONFIGURATION-BACKUPS-FIGMA-DEC), [Calling](calling-figma-design.md) (PPO-CALLS-FIGMA-DEC; the phone numbers editor D8, stage 1c not authorised) |
| [BP-01](../blueprints/BP-01-master-blueprint.md) sections 7, 9, 13 and 17.3 | Parents CRM-01, CRM-03, CRM-04, CRM-06, PAR-07, PRJ-04, SVC-03, SVC-04, SVC-06, SVC-10, NFR-02; DAT-01 to DAT-03. No `EQ-` parent requirement exists: EQ-01 to EQ-09 are page-register scope IDs. All 78 parent IDs are unchanged |
| [PPO-STD-001](../standards/naming-conventions.md), [readable reference namespaces](readable-reference-namespaces.md), [site reference convention](site-reference-convention.md), [scope/design conformance](../standards/html-module-conformance.md), [design-to-build standard](../standards/design-to-build-standard.md) | References (`SYN-ORG-`, `SYN-SITE-` with the legacy `SYN-PPO-SITE-` beside it, `SYN-AST-`, `SYN-SRV-`), the deliberate absence of PER, FAC, SN, RDY and INS references, the nine-field declaration and the r20 page types |

## 2. Progress at 10 November 2026

The file is set up to the Sales page template: Read me, the separator pages "— Accepted —" and "— Proposals —", one page per scope area under "— Proposals —", Interaction states, Administration, Shell and kit, and Scratch. Each scope page has the six sections Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, and Flows and notes. The story is as at Thursday 5 November 2026, signed in as Sasha Cole (Equipment records owner) unless a sheet names another persona.

| Page | Scope | Drawn so far |
|---|---|---|
| Organisations | CS-01 | OR01 to OR10, the Accounts restricted state, TB01, TB02, PH01, notes card |
| Stakeholders | CS-03 | SK01 to SK07, TB04, TB05, PH04, notes card |
| Sites | CS-04 | SI01 to SI07 and a state, TB06, TB07, PH05 and its 320 variant, notes card |
| Access and readiness | CS-06 | AR01 to AR09, two states, TB09, PH07 and its 320 variant, PH08 and the camera-denied state, notes card |
| Equipment | EQ-01 · EQ-02 · EQ-03 · EQ-05 | EQ01 to EQ11, TB13, TB14, PH13, PH14 with its 320 and no-match variants, PH15, PH16, PH20, notes card |
| Movement, replacement and retirement | EQ-04 | Drawn; its sheet list is confirmed in the final structural pass |
| People | CS-02 | Not yet drawn |
| Facilities and growing areas | CS-05 | Not yet drawn |
| Account development | CS-07 | Not yet drawn |
| Site surveys | CS-08 | Not yet drawn |
| Bulletins and lifecycle | EQ-06 · EQ-07 | Not yet drawn |
| Configuration backups | EQ-08 | Not yet drawn |
| Test instruments and calibration | EQ-09 | Not yet drawn |
| Interaction states, Administration | ST01, page states, AD01 to AD08 | Not yet drawn |
| Read me | Header, Sheet index and notes, audit and page-template cards | Not yet drawn |

The build paused when the Figma tool-call allowance for the day was used up; it resumes when the allowance resets.

## 3. Decisions taken on the brief's defaults

Dean's standing instruction applies, so the brief's ten questions take their defaults: the file name as Dean created it (Q1); one proposed `Docked · Shared records` menu with Customers, Sites and Equipment groups nesting each page's accepted views (Q2); signed in as Sasha Cole with persona sheets for the other owners (Q3); SYN-AST-000311 as Hillview's removed M-4 motor and SYN-AST-000308 as the Block C dosing unit (Q4); the phone numbers editor drawn and marked as a proposed UI (Q5); bulletin dispositions in the accepted display words with the built enum beside them (Q6); Account development as its own page at the proposed `/customers/development` (Q7); Equipment changes as their own proposed register at `/equipment/changes` beside the record's lifecycle view (Q8); the relationship map as three columns with its list twin (Q9); and the test-instrument custodian read-only from Company tools, labelled conditional (Q10).

## 4. Assumptions and proposed departures recorded so far

Each item is for Dean's decision. Page-level items are numbered on each page's notes card (A-OR, A-SK, A-SI, A-AR, A-EQ, A-MV) and will be consolidated here when the build is complete.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | The brief describes the accepted collapsed docked-menu strip as 80 px wide; the accepted Shell component is 12 px. Registers use the 12 px strip as the Shell draws it, with content starting at x 92 | Keep the Shell's 12 px strip |
| A2 | Shared records have no docked menu in the Shell file. A `Docked · Shared records` menu (Customers, Sites and Equipment groups, nested views per R108, no accent chip per R102) is drawn as a component in this file | Proposal for the Shell file |
| A3 | The rail shows More, Sales › Contacts or Service › Equipment as the current item depending on the route of arrival; the More and Service rail variants were derived from the accepted rail | Keep; align with the Shell file on publication |
| A4 | The technician phone tab bar (My jobs, My Work, More) was derived from the accepted Sales phone tab bar | Confirm against the Service file |
| A5 | The Call / Control set was rebuilt from its rendered states, and the EQ-01 and EQ-09 notes cards could not be read, because the reference file's large pages time out for scripted reads | Re-read when the reference file is lighter; the EQ-01 and EQ-09 rules are taken from the brief, the register and the code |
| A6 | Where the story needs a record the brief does not name (for example a sensor serial or a prospect organisation), a `SYN-` filler is used and listed on the page's notes card | Keep; every filler is synthetic |

## 5. Boundary and next steps

Design only. No application code, route, read model, migration, permission, capability, grant, seed, integration or deployment is created; the design register, page guidance and the indexes are not edited here and follow in their own change. Delivery status (none), design acceptance (Dean's), production readiness (not inferred) and integration with MYOB, SharePoint, a maps provider, Teams or any manufacturer's tool (none exists and none is authorised) stay separate.

Next: draw People, Facilities, Account development, Site surveys, Bulletins and lifecycle, Configuration backups and Test instruments; then Interaction states (with the contrast table from the PPO colour variables), the page states and Administration; then the Read me cards; then the structural pass, position audit, identity, counts, story, capability and authority scans of the brief; then complete this record with the inventory, the conformance declaration, the audit and a recommended order. Dean then saves a named version; any later design change needs a new one.
