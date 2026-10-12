---
document_id: PPO-ES08-FIGMA-DESIGN-DEC
date: 2026-10-12
owner: Dean Fiedler
status: Proposal awaiting owner review; not accepted; application changes, captures and UI baseline acceptance separate
source_commit: a198e5ffcc4ccf02606794f9ed66d2a90864418f
versioning: git
---

# ES-08 Screen Configurator Workbench Figma design — proposal

On 12 October 2026 Dean asked for the ES-08 Screen Configurator Workbench to be designed in Figma "so that it looks, reads and behaves like the other Powerplants One pages already designed and accepted there". The page was [built the same day](es08-workbench-build.md) straight from the [ES-08 design board](es08-design-board.md), before ES-08 had a Figma design, so its look and format follow the board rather than the Figma pages accepted since [ADR-0053](ADR-0053-figma-page-design.md). This record names the Figma page and its nodes, the accepted patterns reused, the new components, every difference from the built page as a proposed application change, and what Dean still has to decide.

It is a proposal. Nothing is accepted, no named version is saved and no captures are retained yet. Lock-in follows ADR-0053 rule 3: Dean saves the named version "ES-08 Screen Configurator Workbench, accepted", then icon-free captures are retained and this record is updated.

Scope stays `scope:ES-08` at `/estimating/configurations/{id}/{view}`, tracing CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009. No parent requirement ID is added or renamed. This is a design proposal. It authorises no application code, migration, capability, grant, seed, receiving-policy change or deployment, and it changes neither the board decision nor the build record.

## 1. Request and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design ES-08 in Figma in the accepted family | User request, 12 October 2026 | The request names the shell, header, tabs, register tables, record panels, buttons, pills, typography, spacing, colour variables and phone patterns of the accepted pages, and asks that differences from the built page be listed as proposed application changes |
| Order of authority | User instruction, same request | (1) The accepted Figma pages set look, style and format. (2) The application sets content and behaviour. (3) The design board sets which ES-08 elements must exist (D1–D15, DEC-R1, DEC-R2, the drawing standard) |
| Content and figures | Read from the application | The build on branch `feat/es08-screen-configurator-workbench` (PR #441, `0ef50e1`), run locally on 12 October 2026 against the synthetic Northbank fixture `e5080000-0000-4000-8000-000000000005` with the coordinator identity. Text, figures and states were read from the running page, including the states produced by entering Bay length 4.2 m, Roof pitch 40°, Usable roll width 4,200 mm, Bays along length 11, a blank screen-cloth rate and the search "clamp 50". Nothing was saved in the application |
| Drawings | Application geometry | The live section, live plan and sheets 01–05 are the application's own SVG output imported into Figma as components. Labels were checked to be identical to the application's; only coordinates were rounded to one decimal. Two drawing details are approximated in Figma: hatch patterns become flat bands and text halos become white backing rectangles |
| Acceptance | Not decided | Section 7 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Proposal file | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository, because it holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Page | "ES-08 · Screen Configurator Workbench" `406:2`, placed before Captures (icon-free) |
| Desktop 1440, secondary menu docked | Configure `416:92770` · Drawings, sheet 01 and inspector `418:1793` · Parts & working with the working panel open `419:94560` · Pricing `419:95661` · Compare & save, bays 12 → 11 unsaved `420:8837` · Definition review `421:8962` · Run history `421:9635` |
| Desktop 1440, secondary menu collapsed | Configure, Drive & motors with the untested option and the Plan toggle `423:3707` · Drawings with the sheets rescaled to the wider column `423:4233` |
| Phone 390 | Configure section stepper `425:5176` · Drawings sheet 01 with the field inspector sheet `426:5248` · Parts & working, working panel full screen `426:100047` · Compare & save `426:5695` |
| States | Section "ES-08 workbench — states (proposal)" `427:5640`, S1–S11 (section 6) |
| Notes | "Proposal notes · ES-08 Screen Configurator Workbench" `431:5990`: frames, reused patterns, new components, proposed changes P1–P23 and questions Q1–Q7 |
| Prototype | Flows "ES-08 workbench — desktop (proposal)" from `416:92770` and "ES-08 workbench — phone (proposal)" from `425:5176`. The seven view tabs, the in-page links and the phone tabs navigate between frames (77 links). The secondary menu collapses with the existing `sidemenu/open` and `sidemenu/collapsed` switches |
| Shell template | `413:95033`, a clone of the accepted Quotations shell (`123:41`) with Specialist configurations selected. Used to start new ES-08 frames; not part of the flows |
| Frame size | Desktop frames are full length so that every element can be read on the canvas; in the application the top bar stays fixed and the save bar is sticky. Phone frames are 390 × 844 with scrolling content |

## 3. Accepted patterns reused

| Pattern | Node | Used for |
|---|---|---|
| Estimating rail | v2 / Rail `84:197` with Icon/solid/sliders `401:19755` | Specialist configurations selected as the white tile with the Solid icon |
| Shell | Shell / Top bar `35:138`; v2 / Menu strip `73:63`, Menu heading `73:48`, Menu item `73:46`, Menu edge `73:54`, More panel `79:51` (cloned with the Quotations shell `123:41`) | Breadcrumb, search and account; the flush secondary menu, docked and collapsed |
| Record header | Record / Header `224:32` | Title, status tag, record line, Method & limitations and "…" |
| Readiness | Record / Readiness bar `239:1800` with Record / Check item `239:1799` | The six gates on every view |
| View tabs | Record / View tab `312:16` | The seven views with numeric counts |
| Notices | Record / Banner `251:2310` (Info, Warning) | Read-only, drawing withheld, outcome unknown |
| Chips | Record / Filter chip `224:31` | Drawing layers, phone sheet chips |
| Side panel | Work order "Review a readiness criterion" `319:2181` | The working panel: 440 px, left border, shadow, header with close, footer |
| Needs attention card | Project record Overview `345:5185` | Untested option and LS wire notices on Configure |
| Register grid | Grid / Header cell `74:13`, Grid / Cell `74:40`, Grid / Row actions cell `74:50`; Quotations toolbar `123:41` | Parts & working positions, search, dropdown filter and count |
| Phone record | Work order record phone `326:53619` | Header with back, status row, text tabs, footer with "…", secondary and primary, action sheet |
| States board | Work order record states `327:31344` | Section 6 |
| Base | Tag `3:13`, Button `3:41`, PPO/* text styles, PPO colour and PPO layout variables, Font Awesome Light icons | Throughout |

## 4. New components

Proposed for the design system and the component register. None is added to `docs/design/development/components.json`, because no application component exists for them yet; they are registered when the page is rebuilt.

| Component | Node | Reason |
|---|---|---|
| Workbench / Context strip, Workbench / Context fact | `415:4566`, `413:93834` | The five-cell context band (board F) as a flush strip under the record header |
| Record / Check item · Blocked | `413:93839` | Proposed fourth state of `239:1799` for gates that block: Withheld, No match, Too narrow |
| Record / Banner · Danger and Success | `413:93854` | Proposed tones of `251:2310`: validation withheld, failed save and missing rate; saved |
| Workbench / Segment | `413:93796` | One option of a segmented control (D10): navy selected, 44 px, 32 px in card heads |
| Workbench / Field | `413:93832` | Value, unit, recovered source cell and note; Default, Error and Disabled; "Drawing only" and "Check only" badges (D14) |
| Workbench / Result row | `415:4710` | Calculation working; the selected result expands the recovered formula term by term |
| Workbench / Definition row | `413:93866` | Label, detail and value for the price bridge, coverage cross-check and facts |
| Workbench / Sheet header, Workbench / Sheet title block | `417:92945`, `413:93868` | Every drawing sheet: number, caption, SVG export and the A3 title block reading "Estimating study · not for fabrication" |
| Drawing / Live section, Live plan, 01 Plan, 02 Cross section, 03 Longitudinal section, 04 Bay section, 05 Screen cut | `408:83278`, `422:3782`, `408:84090`, `410:83942`, `410:84036`, `410:84850`, `410:84899` | The application's drawing geometry as components (D15, one drawing model) |
| Workbench / Field inspector, Workbench / Drawing legend | `417:92959`, `417:93027` | The selected screen field across all sheets, and the shared legend |
| Workbench / Rule strip | `417:93079` | The five commercial rules above the priced lines |
| Workbench / Change row, Workbench / Decision row | `415:4712`, `415:4738` | Line changes by stable key, and in-place decisions on saved lines and on receiving |
| Workbench / Save bar | `415:4693` | Reason, status and actions (A1): Saved, Unsaved, Saving, Outcome unknown, Read-only |
| Parts grid header, Parts grid row | `419:1942`, `419:2025` | The positions register on accepted Grid cells |
| Workbench / Working panel | `419:2027` | The calculation working as the accepted side panel |
| Workbench / Section stepper (phone) | `417:93096` | The six Configure sections on phones |
| Variables `drawing/*` and text style PPO/Code | Nine colour variables; PPO/Code (Roboto Mono 12/18) | The drawing palette the application uses, and source cells, formulas and keys in the application's monospace |

## 5. Proposed application changes

Each is a difference from the built page, proposed so that ES-08 follows the accepted Figma pattern. None changes a quantity, a rule, a command or a saved record.

| ID | Built page today | Proposed in Figma | Reason |
|---|---|---|---|
| P1 | h1 "Screen Configurator Workbench" with the configuration on a record line | Title is the configuration name; the module name moves to the breadcrumb leaf and the record line | Record header pattern `224:32` (open point, Q2) |
| P2 | In-page caps breadcrumb "Estimating / Configurations / ES-08 · Screen Systems" | The shell top bar carries "Estimating / Specialist configurations / Screen Configurator Workbench" | The shell owns breadcrumbs |
| P3 | Green-dot status "Draft v2 · saved …" beside Method & limitations | Status tag "Draft v2" and record line "saved 12 Oct 2026, 08:09"; unsaved, saving and outcome text on the record line and in the save bar | One status place per pattern |
| P4 | Context band as a bordered card of five cells | A flush strip, one line per value | Readiness-bar strip metrics |
| P5 | Six bordered gate cells with label, value and detail | Record / Readiness bar: one 41 px line, icon and "label · value"; details on hover | One readiness pattern across records |
| P6 | Word badges "5 sheets", "11 active", "26 findings" | Record / View tabs with numeric counts (26 in attention); accessible names keep the words | Accepted view-tab pattern |
| P7 | Secondary menu repeats the seven views | The menu lists the current view's contents (sections with status, sheets, position filters, report parts, finding kinds, runs) and Related links | Job pack `280:2684` precedent; views stay as tabs (work order R2) |
| P8 | Horizontal six-section strip on desktop Configure | Sections and status live in the menu; the card header carries "n of 6", status and the source-cell tag; Previous and Next stay in the card foot. Phones keep the stepper | Avoids repeating navigation |
| P9 | Separate untested-option and LS-wire notices | One "Needs attention" card with a count | Project record pattern |
| P10 | Sheet links in the drawing toolbar | Sheet links in the menu; layers as Record / Filter chips; exports in the view head | Menu holds contents |
| P11 | Bay section Closed / Open in the sheet header | "Screen position" control in the sheet body | Uniform sheet header |
| P12 | Title block labels the configuration ID as Estimate | "Estimate" shows Estimate v1 · option A; "Configuration" shows the record ID with CFG 49DE-134E | Correct labelling |
| P13 | Positions table with segmented filters, section select and Working buttons | A flush register grid; position filters in the menu with counts; the section filter as a toolbar dropdown (A5 kept); basis and unit in separate columns; a calculator row action | Accepted register pattern |
| P14 | Persistent working panel column (a side dialog below 1,100 px) | The accepted 440 px side panel over the grid; full screen on phones | Accepted side-panel pattern |
| P15 | Price bridge column beside the lines | Price bridge and rounding side by side under the lines; the receiving proposal as a card with a disclosure | 960 px content column with the menu docked |
| P16 | Change rows "2064 m² → 1892 m²" with delta "-172.00" | "2,064 m² → 1,892 m²" with delta "−172 m²" | Consistent number formatting |
| P17 | Record-run checklist with tick glyphs | Icon rows; Save review run shows its blocking reason; Send to estimate nests the receiving proposal | Accepted criterion rows and cards |
| P18 | Findings list; parameter rows as running text | Findings table with severity tags; parameters split into Binding, Consumer and Default | Scannable tables |
| P19 | Run row buttons Inspect, Export evidence, Create draft from run; actor and source as ID fragments | Inspect plus a "…" menu; actor and source shown by name | Accepted row actions; readable provenance |
| P20 | Save bar status beside the buttons; the last status kept while saving | Status under the reason field; disabled buttons at 45 % opacity; "Saving draft v3…" in words | Board state 09; Button `3:41` has no Disabled state, so one is proposed |
| P21 | No confirmation after Save review run beyond the status | Success banner "Run R02 saved · View run R02" | Board state 12 |
| P22 | Roll too narrow shown only in the gate and cut schedule | Also a message at the Usable roll width field | Board state 15 |
| P23 | Phone header stacks the full module header | Record phone pattern: back, readiness summary, text tabs, footer with "…", Save draft and Next section, a live summary bar; inspector as a bottom sheet; working panel full screen (A6 kept) | Accepted phone record pattern |

## 6. States drawn

S1 validation withheld (Bay length 4.2 m); S2 drawing withheld while quantities stay valid (Roof pitch 40°); S3 untested option (Pinion); S4 read-only; S5 outcome unknown with recovery; S6 saving; S7 saved; S8 missing rate (screen cloth); S9 filtered empty ("clamp 50"); S10 roll too narrow (4,200 mm against 4,300 mm); S11 saved-line decision needed, shown with the component's slots because the Northbank fixture has no manually edited saved line. Each card states when it appears, what it shows and how to recover, as on board C.

Figures used are the application's: 6 spans × 12 bays of 6.4 m × 4.0 m, 38.4 × 48.0 m, 1,843 m² floor, 24 cuts of 20.0 × 4.3 m, 2,064 m² standard cloth, 3.68 m drive spacing, 12 drive positions, 1,032 m² per motor, 100 Nm torque band, 11 active lines, review total $13,870.00 ($13,864.00 before the upward $10 adjustment), CFG 49DE-134E, run R01. The Compare & save frames show the application's own comparison after Bays along length changes from 12 to 11: 22 cuts, 1,892 m², review total $12,720.00, nine changed lines, CFG 523C-5BEF.

Observation, no design change: the Definition review tab counts 26 findings (REV and AUD) while the view says "38 findings open" (with WAS).

## 7. Open for Dean before the named version

| Question | Recommendation |
|---|---|
| Q1 Route slug of the seventh view (build record point 1) | Keep `drawings` |
| Q2 Heading and record line (build record point 1) | Title = configuration name, module name in the breadcrumb leaf and record line (P1). Alternative: keep the module name as the title |
| Q3 Drawing-input persistence (build record point 2) | Keep them remembered per browser, marked "Drawing only" and "Check only", until a separate migration decision |
| Q4 Send to estimate gating (build record point 3) | Keep the working synthetic receiving flow (A2), blocked while the roll is too narrow (DEC-R2) and until the draft is saved; the board's "disabled until definition approval" stays a later decision |
| Q5 Secondary menu as the current view's contents (P7) | Accept |
| Q6 Compact readiness bar with details on hover (P5) | Accept |
| Q7 Adopt PPO/Code, the `drawing/*` variables and the proposed shared-component states (Check item Blocked, Banner Danger and Success, Button Disabled) | Adopt with this page |

## 8. Verification

| Check | Result |
|---|---|
| Content against the application | Text, figures and states read from the running build on 12 October 2026 (synthetic fixture, task database and server stopped afterwards) |
| Drawing geometry | Seven SVG drawings from the application imported as components; label text identical to the application's |
| Figma audit | Text only in Roboto and Roboto Mono; no default placeholder text; 77 prototype links and two flows; no stale cross-page links after cloning |
| Repository | `npm run studio:check` and `python3 scripts/check_naming.py` (results in the pull request) |

Not verified: a Present-mode click-through in the Figma desktop app, icon-free captures, keyboard order, screen reader, 200 % zoom and real phones.

## 9. Unchanged

- The application, the [build record](es08-workbench-build.md) and its retained [native captures](../reference/ui/specialist/workbench-native-r01/README.md).
- The [design board decision](es08-design-board.md) and its [captures](../reference/ui/specialist/design-board-r01/README.md).
- The page register's visual status (Needs review) and the [UI baseline register](../standards/ui-baselines.json).
- Engineering, supplier and commercial acceptance, and the open evidence listed in the board decision.
