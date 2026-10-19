---
document_id: PPO-CX02-WORKSHOP-BUILDS-FIGMA-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner-accepted design; workshop data model, MYOB send adapter, native implementation and UI baseline acceptance separate
source_commit: 47e47361f3bc9f321795117d357a8053d923cfb9
versioning: git
---

# Workshop builds design — owner decision

On 19 October 2026 Dean confirmed the workshop as a full module of three pages and adopted option A: staff do the workshop's work in Powerplants One, and MYOB Acumatica stays the book of record ([workshop scope decision](workshop-settings-preferences-scope.md), WS-D2 to WS-D5). The same day he asked: "Draw the Workshop builds page (CX-02) in Figma as a proposal for my review." Claude drew the first of the three pages, Workshop builds.

Dean answered the six questions on the notes card: "Regarding the questions for me, I'm happy for you to proceed based on your recommendations." He then asked for an audit and polish, and for the prototype to be played on his computer: "You can take control of my computer and play the Workshop builds prototype in Present mode first." After both, Dean accepted the design: "I accept the Workshop builds CX-02 design with your recommendations, including D1–D8 and Q1–Q6. Lock it in."

Scope:
- `scope:CX-02` "Workshop assembly, testing and rework", the Workshop builds page, at `/workshop` with a build record at `/workshop/[id]` (both proposed). The other two pages, `scope:CX-02/kitting` and `scope:CX-02/bench-testing`, are not drawn.
- Traced to the master blueprint's conditional workshop scope ([BP-01](../blueprints/BP-01-master-blueprint.md) §14.4: production orders, released BOMs, work instructions, serialisation, testing, material consumption and rework). The workshop part of D-027 is settled by the scope decision. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, MYOB connection or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Workshop builds in Figma as a proposal | User decision, 19 October 2026 | Dean's request quoted above |
| Q1 Build reference | Resolved as recommended | SYN-PPO-BLD-000nnn, like other PPO records. No build model exists yet |
| Q2 Serial numbers | Resolved as recommended | A PPO workshop sequence, drawn as SYN-SN-26nnnn (year and build number), recorded at release and sent to MYOB with the finished item. Whether MYOB tracks serials for these items is to be confirmed with the MYOB partner |
| Q3 Who releases | Resolved as recommended | Only the workshop lead, and never the person who built the unit; the release form says so |
| Q4 Breadcrumb | Resolved as recommended | Build titles are too long for the 1440 breadcrumb under rule R6 of the [shell top bar amendment](shell-top-bar-amendment.md), so record pages show the build reference there and the title in the header |
| Q5 Labour | Resolved as recommended | Workshop hours are recorded per step in PPO in a later stage and sent with the release. Not drawn |
| Q6 Rail | Resolved as recommended | Workshop sits in the Supply chain rail, between Inventory and Dispatch & delivery. The Figma Supply chain rail's missing My Work item is left as it is |
| Audit and polish; play the prototype | User decision, 19 October 2026 | Section 5 |
| Departures D1–D8 | Accepted as recommended | Dean's acceptance, quoted above. Section 4 |
| Accept the design | User decision, 19 October 2026 | Quoted above |
| Named Figma version | Not yet saved | Waits for Dean's yes (section 5) |
| Building the page | Not decided | Section 7 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Workshop builds · CX-02" `1690:76`, after Inventory · SC-05 under the "— Supply chain —" divider. The page header holds the conformance declaration; the notes card `1690:1819` is in Flows and notes. File index: Supply chain group, row `1737:76` after Inventory |
| Desktop 1440 | All builds register `1690:113`; 4-channel fertigation dosing unit, Parts list `1690:528`; the same build, Steps, full length `1690:208`; climate screen control panel CP-4, Tests `1690:870`; CP-4 Release form `1690:1015`; CP-4 released, Hand over for dispatch `1690:1161` |
| Tablet 1024 | All builds register, rail and side menu collapsed `1690:1316` |
| Phone 390 and 320 | All builds `1690:1395`; 4-channel dosing unit, Steps, at 390 `1690:1421` and 320 `1699:452466`; boiler controller panel BC-3, Record test result `1690:1557` |
| States | Loading `1690:1655`; no builds match the filters `1690:1699`; could not load `1690:1728`; released materials changed during the build `1700:3144`; booking saved, MYOB send not confirmed `1700:3275` |
| Parts | Moved to Components at acceptance, node IDs unchanged: Rail · Supply chain with Workshop `1690:455107` in Shell and navigation; Workshop / Build grid header `1690:455242` and Workshop / Build grid row `1690:1843` in Service, Supply chain and Shared records parts. The Workshop rail item uses the Light screwdriver-wrench glyph on its selected tile; a Solid glyph is added from the Font Awesome Kit when the rail is built |
| Prototype | Flows "CX-02 — desktop" (register → 4-channel build Parts list ⇄ Steps → breadcrumb to register → CP-4 Tests → Release tab → Release build → Released → Tests) and "CX-02 — phone" (list → 4-channel record → back; list → BC-3 test-result form → close, Cancel or Save result) |
| Story | Synthetic, as at Tue 13 Oct 2026 09:00 AEST, signed in as Drew Collins (workshop lead), with technicians Jesse Moore and Kim Taylor and supply coordinator Robin Hale. Eight builds on the accepted projects of the Projects register and FN-03. SYN-PPO-BLD-000042, a 4-channel fertigation dosing unit for Block C fertigation upgrade, is in build with two lines short (one DP-25 pump held in quarantine at Receiving, the cable kit on order). SYN-PPO-BLD-000040, climate screen control panel CP-4 for Glasshouse 4 climate screens, failed earth continuity at 1.4 Ω, was reworked (RW-1), retested at 0.08 Ω, and released at 09:20 as SYN-SN-260040 |
| Retained captures | [Workshop builds design r01](../reference/ui/supply-chain/workshop-builds-design-r01/README.md): sixteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CX-02` at `/workshop` and `/workshop/[id]` (proposed), Supply chain rail item "Workshop" (proposed; no navigation entry exists). Traced to BP-01 §14.4, unchanged. No capability exists; a workshop read and record capability is a later permission decision |
| Page type (r20) | Register or worklist (builds); record detail with a checks bar and six tabs; side forms (release, hand over for dispatch); a phone form (record a test result) |
| Reused components | Shell v2 (Rail · Supply chain with the Workshop item, the top bar with the Conversations action, side menu), Grid header and cells, Record / Header, Readiness bar and check items, Field, Section heading, View tab, Filter chip, Tag, Button, Work order record / Blocker row, Technician list row (phone), Shell / Phone header · compact (the phone header amendment, `docs/decisions/phone-header-amendment.md`, pull request #606), v2 / Tab bar (phone). New: the parts listed in section 2 |
| Incoming handovers | The project and its released materials revision (Engineering, EN-06); stock and quarantined receipts (Inventory SC-05, Receiving SC-04); welder competence (Field team PL-02); the controlled inspection form (Inspections FI-03/FI-04); test instruments and their calibration (Equipment EQ-09); pre-configured controllers (Kitting & controllers, `scope:CX-02/kitting`) |
| Outgoing handovers | The released unit to Dispatch preparation (SC-06) with an accountable owner, or to workshop stock; a material issue to MYOB on booking out and the finished unit on release, each visible in Integration activity (`scope:AD-04`, `scope:AD-05`); returned units to Bench testing & returns (`scope:CX-02/bench-testing`) |
| Source authority | The CX-02 design register page and guide `guide.cx.02`; [workshop scope decision](workshop-settings-preferences-scope.md) WS-D2 to WS-D5; [PPO as daily workspace, MYOB as book of record](ppo-workspace-myob-book-of-record.md) EI-1 to EI-10; BP-01 §14.4; the accepted [Site surveys](site-surveys-figma-design.md), [Inventory](inventory-figma-design.md), [Field team](field-team-figma-design.md) and [Inspections](inspections-figma-design.md) designs |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 19 October 2026 |
| Decision record | This file |
| Named version | "Workshop builds — accepted", not yet saved |

## 4. What the design shows

| ID | Departure | Basis |
|---|---|---|
| D1 | Workshop is a Supply chain rail item between Inventory and Dispatch & delivery. Its side menu links Kitting & controllers and Bench testing & returns, then the Builds views (All builds, Planned & kitting, In build, Testing & rework, Ready to release, Released this month) and related Stock & reservations and Released materials | No workshop page or navigation entry exists; WS-D3 places the module after SC-04 |
| D2 | The register is a grid with the build title first, then status, project, steps, tests passed and due date; quantity, assigned person, short parts and reference scroll into view. Planned, Kitting, In build and Testing are neutral; Rework is danger; Ready to release is warning; Released is success | The accepted grid register pattern |
| D3 | The build record uses the shared record layout with a Build checks bar (parts list, booking out, welder, weld inspection, tests, release) and a details column (Build, Sent to MYOB Acumatica, People). Six tabs: Parts list, Booked out, Steps, Tests, Rework and Release | WS-D3 names these record contents |
| D4 | The parts list comes from the project's released materials revision and is read-only here. Booking out records who took which part, when and from where, and sends one material issue to MYOB. A short line stays visible with its reason and next owner. A mistake is corrected by returning the part to stock, which sends a reversing entry | Option A (WS-D5); EI-3 and EI-4 (send finished events; correct by reversal) |
| D5 | Steps follow one work-instruction revision. A weld step needs a welder with a current qualification from the Field team competence records and a weld inspection on the controlled inspection form. A test records its value, limit and instrument, and its result follows from the value and the limit. A failed test raises rework; the retest is a new result and the failed one is kept | WS-D4 |
| D6 | Only the workshop lead releases, never the builder, and only when every step is done, every test has passed, rework is closed and materials are booked out. Release records the serial number, sends the finished unit to MYOB, and hands the unit to Dispatch preparation with an accountable owner or holds it in workshop stock. A release is corrected by reversing it | Q2, Q3; EI-4 |
| D7 | PPO sends only finished events: a material issue on booking out and the finished unit on release. The record shows each send and its state. An unconfirmed send is checked and never posted twice. Recording steps, tests and rework sends nothing. Stock quantities, valuation and cost stay MYOB's | Option A; EI-1, EI-3, EI-5 |
| D8 | Phone views follow the phone header amendment: the list with the compact header ("All builds 8") and no toolbar rows; the record with back, position and More, title and status in the content and one full-width main action; a test-result form for the workshop phone or tablet; tab bar My Work, Receiving, Inventory, Workshop, More | Phone header amendment P1–P9 |

## 5. Audit, polish and verification

- Claude checked every frame with screenshots taken inside Figma. The audit measured every visible text against its box and found the register and tablet project names cut off; the columns were rebalanced (Build 239, Status 125, Project 237, Steps 70, Tests passed 96, Due 105) so no grid text is cut, the Ready to release tag keeps 8 px clear and the last column still ends at the visible edge.
- Story fixes from the audit: the 4-channel unit's Booked out count and MYOB issue became 6 lines (including the three pumps); the MYOB-not-confirmed state moved to Wed 14 Oct, after Receiving releases the fourth pump; the released-materials change moved to 10:30, after the 09:00 as-at time; the released CP-4 header offers Print serial label and Print build record. A sweep found no wording left from the Site surveys page the design was built from.
- Claude played both flows in Present mode in Dean's Figma desktop app. Every link worked; the phone test form's Cancel and Save result were then linked back to the list.
- The sixteen captures are copies of the accepted frames on the "Captures (icon-free)" page at y = 312,000 (`1736:215804` to `1736:220057`). Each copy's prototype links were removed and each of its Font Awesome icon instances was swapped for `Icon/placeholder`; a check afterwards found none left. The copies added no flow starting point to the Captures page.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/supply-chain/workshop-builds-design-r01/README.md).
- The named Figma version "Workshop builds — accepted" has not been saved; it waits for Dean's yes.
- Nothing is built, so there is no application or device evidence. No owner device or accessibility review is recorded. The captures are design compositions, not application captures, and set no UI baseline.

## 6. Relationship to other records

- [Workshop scope decision](workshop-settings-preferences-scope.md): this is the first of its three workshop pages. Kitting & controllers and Bench testing & returns are their own pages next.
- [PPO as daily workspace, MYOB as book of record](ppo-workspace-myob-book-of-record.md): the page sends material issues and finished units to MYOB and nothing else (EI-1, EI-3); each send and its outcome depend on Integration health (`scope:AD-04`) and External mapping and reconciliation (`scope:AD-05`).
- [Inventory design](inventory-figma-design.md): the Supply chain rail gains the Workshop item; Inventory's own rail component is unchanged.
- [Field team](field-team-figma-design.md) and [Inspections](inspections-figma-design.md): the welder qualification and the weld inspection reuse their records and form.

## 7. Not decided and not drawn

- **Building the page.** Not decided. No route, navigation entry or capability exists.
- **Prerequisites for a build:** a workshop build model (builds, steps, tests, rework, serials) with its migration and permissions; a released-materials read (EN-06); stock bookings and returns through the MYOB send adapter under its own decision, with the Acumatica tenant contract (DEC-CCE-10) settled; confirmation from the MYOB partner on serial tracking (Q2).
- **Not drawn:** the Booked out and Rework tabs at full size; the New build form; desktop states; a tablet record; the history view; workshop hours per step (Q5); the Kitting & controllers and Bench testing & returns pages.
- **Data in the frames:** the people, projects, builds, serials, measurements and dates are synthetic.
