---
document_id: PPO-WORKSHOP-SETTINGS-SCOPE-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner decision on page scope (19 October 2026); Figma designs, register reclassification, build and any MYOB integration separate
source_commit: 562b9a575d2500e40ab101fc0f278cb7fd826409
versioning: git
---

# Workshop, Settings and personal preferences — scope decision

On 19 October 2026 Dean asked which UI pages should be designed in Figma after Users and access (AD-01). Claude listed the remaining pages in order from the [UI build sequence](ui-build-sequence.md), ten at a time, ending with the six Phase 11 conditional options (CX-01 to CX-06). This record holds what Dean decided about those options, about the workshop, and about a Settings page and a personal preferences page. It changes no earlier decision.

## 1. What Dean said

| Topic | Dean's words, 19 October 2026 |
|---|---|
| Phase 11 options | "I don't think we need to include those Phase 11 options. If any, we could possibly include the Workshop Assembly." |
| What the workshop does | "We build fertigation dosing units, assembly control panels, kitting parts, pre-configuring controllers, bench-testing returned units, some welding and fabrication, etc." |
| How often | "Regular builds per project." |
| Where the work happens | "We use MYOB Acumatica, but I would prefer to carry out all the work in the Powerplants One app. We would then only use MYOB for detailed financially reporting, etc." |
| Settings and preferences | "Also, have we included some kind of "Settings" page and a "Personal preferences" page? If not, do you think these should be included?" |
| Adoption | "I have happy for you to record those decisions and adopt option A." |

## 2. Decisions

| ID | Decision | Classification |
|---|---|---|
| WS-D1 | The Phase 11 options CX-01 (company tools, loan units and calibration), CX-03 (remote monitoring and alarm review), CX-04 (advanced customer training and subscriptions), CX-05 (grower production and traceability) and CX-06 (water and energy improvement review) are left off the Figma design list. They stay in the design register as conditional scopes; nothing is deleted. | User decision |
| WS-D2 | Workshop assembly, testing and rework (`scope:CX-02`) is confirmed as a full module and leaves the conditional options. Powerplants builds fertigation dosing units and control panels, kits parts, pre-configures controllers, bench-tests returned units and does some welding and fabrication, with regular builds for each project. | User decision |
| WS-D3 | The workshop is designed as three Figma pages: **Workshop builds** (a register and a build record with tabs for the parts list from released materials, materials booked out, steps and work instructions, tests, rework, and release with a serial number); **Kitting and controller preparation** (parts kitted for a project or job, and each controller's pre-configuration and the configuration loaded); and **Bench testing and returned units** (receive, test, repair or reject, record the outcome). In the design order they sit after Receipt, inspection and quarantine (SC-04) and before Picking and dispatch preparation (SC-06). | Claude's recommendation, adopted |
| WS-D4 | Welding and fabrication need a welder's qualification checked against the competence records that the accepted [Field team design](field-team-figma-design.md) holds, and weld inspections recorded with the controlled-form pattern of the accepted [Inspections design](inspections-figma-design.md). | Claude's recommendation, adopted |
| WS-D5 | **Option A.** Staff do the workshop's day-to-day work in Powerplants One: build orders, parts lists, work instructions, material bookings, tests, rework, kitting, controller preparation and serial numbers. MYOB Acumatica stays the book of record behind it: PPO sends the resulting stock movements and costs (materials issued, finished units, work in progress) to MYOB, and MYOB does the financial reporting. MYOB keeps authoritative ERP items, stock and purchasing as [ADR-0048](ADR-0048-products-native-catalogue.md) and [ADR-0049](ADR-0049-native-supply-chain.md) record; both stay in force. Option B, making PPO the stock and purchasing authority with MYOB keeping only the ledger, was not adopted. | User decision on Claude's recommendation |
| WS-D6 | **Settings hub.** The Administration menu already lists "Settings" (`src/shell/navigation.ts`, readiness `unavailable`, no page). It becomes a Settings hub whose main content is Business configuration and policy publication (`scope:AD-02`), with links to every configuration area: Users and access, integrations, templates, assistant settings, retention and, once designed, workshop settings. No new scope is added. | Claude's recommendation, adopted |
| WS-D7 | **My account and preferences.** One personal page, opened from the account button in the top bar: profile, initials and email signature; default company and default workspace; notification preferences (`scope:SH-03`); personal saved views (`scope:SH-05`); the user's connected mailbox and calendar (`scope:EC-02`); offline devices; personal assistant settings; and sign-out and sessions. It takes the place of the separate SH-03 and SH-05 entries in the Figma design list. Today the only personal preferences page is "Updates & preferences" (`/work/updates`, notifications only), and the workspace and rail choices are kept in the browser. | Claude's recommendation, adopted |

## 3. Limits

- This is a decision about which pages to design. It authorises no route, application code, migration, permission, seed or grant. Routes for the Settings hub and the personal page are chosen when they are drawn.
- No MYOB endpoint, entity or posting is designed or connected. The Acumatica tenant contract is still open ([DEC-CCE-10](../architecture/cce-technical-specification.md)), and production integration, migration and business transactions remain outside this repository task.
- PPO's workshop records are operational records. They do not replace MYOB's stock valuation, cost accounting or general ledger.
- No parent requirement ID is added or renamed. The workshop pages trace to the master blueprint's conditional workshop scope (BP-01 §14.4) and to `scope:CX-02`.

## 4. Follow-up

- The design register still records `scope:CX-02` as `conditional`, so the generated [UI build sequence](../design/development/ui-build-sequence.md) still shows it as "Scope decision first" at rank 146. The pull request that draws the first workshop page reclassifies it, adds the two new workshop pages as entries, places them after SC-04, and regenerates the sequence.
- Decision D-027 (workshop, portals, fleet, telemetry and AI priorities) stays open for portals, fleet, telemetry and AI. Its workshop part is settled by this record.
- In the same conversation Dean asked for Claude's opinion on a wider idea: syncing MYOB with PPO across all modules so that staff do most operational work in PPO, possibly reducing MYOB subscription costs. Dean adopted it the same day; it is recorded in [PPO as the daily workspace, MYOB Acumatica as the book of record](ppo-workspace-myob-book-of-record.md) (PPO-ERP-OPERATING-MODEL-DEC).
