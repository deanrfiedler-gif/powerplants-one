---
document_id: PPO-ES02-DESIGN-BOARD-DEC
date: 2026-09-24
owner: Dean Fiedler
status: Proposed design reference; one user decision recorded; proposals and build findings await owner decisions
source_commit: 72b27694462a176529dc68343526dfda215cd298
versioning: git
---

# ES-02 Estimation Wizard design board — record, proposals and build findings

On 23 September 2026 Dean asked for a professional design board for the Estimation Wizard, working from [wizard r03](../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html) and five screenshots. In the same session Dean supplied the six equipment families and 108 categories that Powerplants uses, then asked for an audit and improvements. On 24 September 2026 Dean asked whether the board could be taken further, and left the approach to Claude ("Proceed however you believe is the most professional"). The board was then re-based onto the running application shell and [build plan r04](../reference/ui/estimating/PPO-ES-02-Estimation-Wizard-Discovery-Alternatives-and-Revisions-Refinement-Build-Plan-r04.md), compared with the running wizard on current `main`, audited for accessibility and retained here.

This record keeps what was decided apart from what is only proposed. It holds the one user decision, the board's proposals, one open decision, six findings against the running build and the consequences for the configuration definition. Scope stays `scope:ES-02`, route `/estimating/discovery/[id]`. [ADR-0035](ADR-0035-es02-structured-discovery.md) traces ES-02 to PPO-010 and EST-01–EST-09; the family decision bears on EST-02. No parent requirement ID is added or renamed, and all 78 remain. This record authorises no application code, migration, configuration-definition change, UI baseline entry or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence and scope |
|---|---|---|
| Six equipment families and 108 categories (section 3) | **User decision**, 23 September 2026 | Supplied in the design session as "all the families we use, and the sub-categories associated to them". Replaces r04 §4.7's four presentation groups for design. Implementation needs the successor definition in section 3 |
| Re-base the board onto the running application and r04; choice of method | Delegated by the user, 24 September 2026 | Delegation of approach. It is not acceptance of any proposal below |
| Board composition and proposals P2–P9 (section 4) | Proposed; **not accepted** | Board 07. Each needs an owner decision naming its screen and device scope before it becomes a baseline |
| O1: desktop control height (section 5) | **Open question** for the owner | Board 07 carries a recommendation |
| Build findings B1–B6 (section 6) | Observed on `main` `72b2769` | [Evidence](../testing/evidence/es02-design-board-r01/README.md). Not yet raised as issues or fixed |
| W1, W2 (section 4) | Withdrawn | Not carried into the board |
| Register discrepancy (section 8) | Open; nothing changed | Needs the register owner |

## 2. Design reference

| Reference | Identity |
|---|---|
| Board | Private Design artifact in Dean's claude.ai account, <https://claude.ai/artifact/Vbv36BDx24MruAiRgzytaL>, version 15 (`1790230338-f29b`). Its page *In the app · ES-02 r04* holds the thirty artboards; the page *Appendix · r03 study* holds the superseded r03-based boards. Only the owner can open it |
| Retained captures | [Design board r01](../reference/ui/estimating/design-board-r01/README.md): 30 PNG captures at exact board size, with the SHA-256 of every capture and source file. These are the repository reference for this record |
| Paired build evidence | [ES-02 design board r01 evidence](../testing/evidence/es02-design-board-r01/README.md): build captures at 1440, 1024 and 390 px, layout measurements at four viewports and axe-core results |
| Behaviour contract | Build plan r04, `0aaec063…3a5605`, unchanged |
| Functional study | Wizard r03, `7ce47597…52b2`, unchanged |
| Tokens and shell | `src/app/globals.css`, r04 §4.5 (r22 direction), `src/app/desktop-shell.css`, `src/components/estimation-wizard.css` |
| Fixture | Northbank climate & irrigation upgrade (r04 §4.9), synthetic. The paired build run used different synthetic data, created through the application's forms |

## 3. Equipment families — user decision

| Family (as supplied) | Categories | Category list, in the order supplied |
|---|---:|---|
| CLIMATE | 17 | Lighting; Circulation fans – Priva; Circulation fans – other; Exhaust fans & ventilation; Drive systems (vents & screens); Pad & fan cooling; Fogging & humidification; Heating – hydronic; Heating – direct-fired air; HVAC & dehumidification; CO2 systems; Screens – shade / thermal; Screens – blackout; Screens – outdoor; Insect screens; Roll-up walls; Sulphur burners |
| CONTROLS | 15 | Priva Compass; Priva Compact CC; Priva Connext; Priva FS Performance; Priva Blue ID; Grosound; Maximizer; Minigrow; Multigrow; Omnigrow; Nutridose; Sensors & weather stations; Electrical panels; Switchboards & circuit breakers; Electrical materials & installation |
| WATER | 20 | Priva NutriOne; Priva NutriFit; Priva NutriJet (bypass); Priva NutriJet (inline); Priva NutriFlex; Priva NutriMix; DirectJet dosing; EasyDose dosing; PeriDose dosing; Dosing racks; Neutralisers; Priva Vialux HP; Priva Vialux M; Ecolux recycling; RO & ultrafiltration; Irrigation; Wireless irrigation control; Moisture sensing & monitoring; Tanks; Stirrers |
| AUTOMATION | 38 | Javo potting machines; Tray fillers; Sowing lines; Seeding – drilling / dibbling; Transplanting – automatic; Transplanting – manual; Conveyors; Buffer belts; Dispatch systems (Willburg); Forklifts & forks; Pot-in-tray robots; Trailer loaders; Benches – fixed; Benches – mobile; Benches – NFT; Benches – sideshift; Grow systems – gutters; Grow systems – MGS; Grow systems – raft; Trolleys – crop (pipe-rail); Trolleys – crop (tyre); Trolleys – pick (pipe-rail); Trolleys – pick (tyre); Trolleys – spray (pipe-rail); Trolleys – spray (tyre); Trimming; Labelling; Washers; Vision grading; Soil handling; Soil storage; Rockwool handling; Automated booms; Automated watering; Growcoon systems; Weed-control equipment; Automation project (turnkey); Other nursery automation |
| STRUCTURES | 7 | Greenhouses; Greenhouse construction; Cravo retractable-roof structures; Cravo parts; Cladding; Flooring & weed mat; Earthworks |
| SERVICES | 11 | Project management; Design; Consulting; Training; Commissioning (standalone); Service; Maintenance contracts; Site costs & prelims; Freight (standalone); Extended warranty; Post-handover technical support |
| **Total** | **108** | |

The board shows the families as Climate, Controls, Water, Automation, Structures and Services (board 06, and the family overview in S1 and S2).

**What it changes.** r04 §4.7 lists four presentation groups (Controls & climate, Fertigation, Monitoring & weather, Nursery machinery) plus Shared infrastructure. For design, the six families replace the four groups. The retained r04 file is not edited.

**Why implementation needs more than a design change.** The running build fixes its families in configuration definition `PPO-ES02-CONFIG-r01` (`src/estimating/configuration-definition.ts`). ADR-0035 records the same enumeration in configuration snapshot schema 1, and migration 0039 rejects any other `definition_id`. Adopting the six families therefore needs a successor definition with family and, if P2 is accepted, category fields. It also needs a migration that accepts the successor, an ADR amending ADR-0035, explicit handling of r01 values and tests. None of that is authorised here.

**Assumed, to confirm:**

- **A1.** Shared infrastructure stays a separate compact group, as r04 §4.7 requires, rather than becoming a seventh family. It is not in the supplied list.
- **A2.** In the fixture, Climate control and Crop monitoring sit in Controls, Fertigation in Water, and Shared network in Shared infrastructure.
- **A3.** r01 values do not map one-to-one. Controls & climate splits across Climate and Controls. Monitoring & weather spans Controls (Sensors & weather stations) and Water (Moisture sensing & monitoring). Saved r01 values should stay readable under their r01 labels unless an explicit mapping is adopted, as r04 §4.7 already requires for unsupported historical values.
- **A4.** Families stay separate from the ProductSupply, DefinedLabour and Freight work tags (r04 §4.7). The Services categories Freight (standalone), Commissioning (standalone) and Service share wording with those tags; no mapping is implied.

## 4. Proposals and withdrawals

None of these is accepted. The board draws each one; the build and r04 behaviour it departs from is stated.

| ID | Proposal | Current behaviour | Screens |
|---|---|---|---|
| P2 | Add a system by family, then category | r04 §4.7: Add opens a draft prefilled with the family; there is no category concept | Add system |
| P3 | Open with the Estimating menu collapsed at 1440 px and below | Build: menu 240 px, summary narrowed to 320 px, main column 804 px. Design: menu 24 px, summary 380 px, main column 960 px. A saved menu preference still wins (r04 §4.2) | All Discovery steps ≤ 1440 px |
| P4 | Keep the summary in reach below 1200 px: a labelled bar at 1024 px, a sheet on phones | Build stacks the summary after the whole form (from 2,048 px down at 1024 × 768, 2,624 px at 390 × 844), with the action bar static at the form's end. r04 §4.4 permits collapse or a sheet | 1024 × 768, 390 × 844, 320 × 700 |
| P5 | Phone steps as a 44 px select with previous and next | Build wraps five step buttons onto two rows at 390 and 320 px | 390 × 844, 320 × 700 |
| P6 | Change markers carry a glyph and a word (Added, Changed, Removed, Unchanged, Not comparable) | r04 §9 requires difference never to rely on colour alone | Compare views |
| P7 | Evidence opens in a right-side panel that overlays and never replaces the summary | r04 §4.4 keeps the summary's identity; the conformance standard reserves right-side panels for record evidence | Configuration evidence |
| P8 | Phone breadcrumb shows the current page only, at 16 px | Build truncates both crumbs (50 px and 94 px at 390 px) | 390 × 844, 320 × 700 |
| P9 | Every summary finding is a linked row that names the system and opens its step and field | Build lists Configuration findings only, as amber text buttons that open the step but not the field (`estimation-wizard.tsx`). r04 §4.8 and §5 (Step 5) require findings to reach their step and field | Summary panel |
| W1 | Withdrawn: r03's margin meter with 15% and 22% bands, rule chips and rule-generated prices | Synthetic r03 policy (r04 §2.2, §5). Margin appears only as a labelled calculation; approval stays with ES-04 | Pricing |
| W2 | Withdrawn: collapsing global search to an icon at 1024 px | The running shell already keeps only the parent crumb at that width, so search never collides; the board now matches the build | Shell header |

## 5. Open decision O1 — desktop control height

The shared control token is 44 px (`src/components/ui/controls.css`), and global buttons have a 44 px minimum. The [UI style specification](../standards/ui-style-specification.md) asks for 44 px primary, filter and form targets. It allows dense desktop grid record buttons to use 40 px within roughly 54 px rows. The wizard overrides this with 36 px buttons and fields (`#ppo-estimate-wizard :is(button, .button)` in `estimation-wizard.css`). The board follows the build on desktop and uses 44 px on phones.

| Option | Effect |
|---|---|
| Keep 36 px as a documented exception | No visual change; adds an exception the specification does not provide for |
| 44 px throughout | Consistent with the token; every control row grows by 8 px, so the dense tables lengthen |
| **Recommended:** 44 px for fields and bottom-bar actions; the specification's 40 px dense-grid allowance for in-table and toolbar controls | Meets the specification without a new exception and keeps table density |

On phones, 44 px is not optional: see B4.

## 6. Build findings

Observed on `main` `72b2769` in a local synthetic run; details and raw results in the [evidence](../testing/evidence/es02-design-board-r01/README.md). The board already draws the corrected behaviour for each one. They are recorded here, not raised as issues, because this task did not include creating issues.

| ID | Finding | Source | Requirement | Suggested correction |
|---|---|---|---|---|
| B1 | The configuration attention strip has a full amber background | `estimation-wizard.css`, `.es02-attention { background: var(--warning-surface) }` | r04 §4.5: warning strips use neutral counts and small amber indicators | Neutral surface with an amber dot and a neutral count |
| B2 | The summary narrows to 320 px at 1500 px and below | `estimation-wizard.css`, `@media (max-width: 1500px)` | r04 §4.4: start around 360–400 px; collapse or use a sheet when space is short | Keep 380 px and gain width from the menu (P3) or collapse the summary |
| B3 | Every wizard field renders at 14–14.4 px on phones | `globals.css`, `.field { font-size: 0.9rem }`, inherited through `#ppo-estimate-wizard .field :is(input, select, textarea) { font: inherit }`; fields inside tables inherit 14 px | Page mobile contract and UI style specification: form inputs 16 px on phone | 16 px field text at the phone breakpoint |
| B4 | Phone buttons are 36 px, fields and selects 38 px, the Summary toggle 30 px | `estimation-wizard.css`: 36 px button `min-height` override; 38 px `.field` controls | 44 px shared control token; UI style specification | 44 px controls at the phone breakpoint |
| B5 | Search shortcut hint `#758091` on white at 10 px: 3.99 : 1 | `desktop-shell.css`, `.ppo-global-search kbd` (shared shell, every page) | WCAG 2.2 SC 1.4.3, 4.5 : 1 | `#667181` gives 4.95 : 1. Belongs to the shell, not ES-02 |
| B6 | The Areas and Systems table scroll regions cannot be reached by keyboard | `.es02-table-scroll` in `estimation-wizard.tsx` (three instances) | WCAG 2.2 SC 2.1.1 (axe `scrollable-region-focusable`) | `tabindex="0"`, `role="region"` and an accessible name on each scroll region |

## 7. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md); board 03 carries the same declaration.

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-02` Estimation Wizard · discovery, alternatives & revisions; route `/estimating/discovery/[id]`. Parents PPO-010, EST-01–EST-09 (ADR-0035). Increment: in-app design board re-based onto the shell and r04 |
| Page type (r20) | Form / guided workflow, with Review / comparison for Alternatives and Revisions (ADR-0035). Full-bleed; one scroll owner per view; the summary scrolls on its own |
| Reused components | Application shell (rail, header, centred search and quick add, secondary menu 240 / 24 px), record tabs, native fields and dialogs, shared Button, unsaved-changes handling, the repository logo asset, Roboto |
| Source authority | User decision in section 3; delegation in section 1. Behaviour r04; tokens `globals.css` and r04 §4.5; composition proposed by this board |
| Incoming handover | CR-02 sales-to-estimating: accepted submission with opportunity, customer and one site; permitted Facility and equipment references; CS-08 survey declared but not yet integrated |
| Outgoing handover | Prepared: immutable discovery revision and Draft quotation render. Received by the manual estimate through explicit adoption of a saved, Complete basis. Sent, accepted and converted belong to ES-05, ES-06 and ES-07. Review in the wizard is a completeness and source check, not approval (ES-04) |
| Exceptions and recovery | 24 states on board 08, covering r04 §9 and the §3.5 working-copy lifecycle; four drawn full size (X1–X4) |
| Departures | Sections 3–5 |
| Verification | Section 9 |

## 8. Register discrepancy

In `docs/design/development/register.json`, `route:/estimating/new` (Create estimate) is related only to `scope:ES-01` but its `html_path` points at wizard r03. The native wizard is `route:/estimating/discovery/[id]`. The entry keeps its imported provenance here; correcting it is for the register owner.

## 9. Verification

| Check | Result |
|---|---|
| Rendering | All 30 artboards rendered at exact board size in headless Chromium with embedded Roboto: no page errors, nothing beyond the board. Retained captures and hashes in the design board r01 README |
| Publication | The board was published as version 15. Every one of the 31 files was read back at the last version that changed it and matched the local source byte for byte |
| Paired build comparison | Running wizard on `main` `72b2769` (migration 0044), captured at 1440 × 960, 1024 × 768 and 390 × 844, with layout measured at 320 × 700 too. A first capture on `9bf90b6` was superseded after `main` moved; between the two, only the rail order and two shell labels changed, and the board was aligned to both |
| Accessibility, automated | axe-core 4.13.0, WCAG 2.0–2.2 A/AA and best practice: no violations on the 30 artboards. The build fails two rules (B5, B6) |
| Phone targets and text | Design phone artboards: 16 px fields and at least 44 px controls in view. Build: B3 and B4 |

**Not verified:**

- Manual keyboard order, focus return, 200% zoom and screen reader, on the board or the build.
- Real phones and tablets.
- Rendering inside the claude.ai canvas.
- The Alternatives and Revisions tabs, dialogs and error states of the build.
- Functional behaviour, and any business or owner acceptance.

## 10. Unchanged by this record

- **Retained sources.** Wizard r03, build plan r04 and the implementation prompt r03 keep their bytes.
- **Configuration definition.** `PPO-ES02-CONFIG-r01`, migration 0039 and ADR-0035 are unchanged; section 3 states what a successor needs.
- **Page register.** ES-02 and `route:/estimating/discovery/[id]` stay *Needs review*, with no reviewer or fingerprint. A proposed design reference is not a review of the application page.
- **UI baseline register.** Not updated. Promotion needs owner acceptance and an issued HTML successor or a native implementation with paired captures.
- **Application.** No code, style, migration, seed or permission change.
