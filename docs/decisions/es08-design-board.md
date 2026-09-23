---
document_id: PPO-ES08-DESIGN-BOARD-DEC
date: 2026-09-23
owner: Dean Fiedler
status: Owner-accepted design direction; native implementation, engineering and UI baseline acceptance separate
source_commit: 7bf972cbc38a9e62fd25b1bd635c6991895d76e6
versioning: git
---

# ES-08 Screen Configurator Workbench design board — owner decision

On 23 September 2026 Dean asked for the ES-08 input workbench (r02) and the r10 greenhouse blueprint and drawings to be merged into one professional design board. Dean then accepted every recommendation made in the audit that followed, asked for the structure drawings to be accurate, and accepted the resulting board. This record retains that decision, the accepted departures and the two design rulings, and states what each one changes in the existing [geometry proposal](es08-screen-geometry-study.md) and [build plan](../delivery/es08-geometry-build-plan.md).

Scope stays ES-08 / EST-06 / E5, tracing CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, migration, receiving policy change, deployment, supplier or engineering acceptance.

## 1. Decision and evidence

| Item | Classification | Evidence and scope |
|---|---|---|
| Merge r02 inputs and r10 drawings into one ES-08 module | User decision, 23 September 2026 | Design session request. ES-08 remains the Screen Systems configuration family; no new module |
| Board composition, departures D1–D15, rulings DEC-R1 and DEC-R2 | Owner-accepted design, 23 September 2026 | Dean accepted all recommendations, then the final board. Screen/device scope: the desktop (1440 px) and phone (390 px) compositions on the board |
| Structure drawing standard (section 6) | Owner-accepted design; formulas checked against r10 | Five roof profiles drawn by one shared component. Drawing only: no quantity consumer |
| Native implementation, route slug, migration, receiver change | Not decided | Requires separate authority; the build plan's WP-G00 gate still applies |
| Engineering, supplier and commercial acceptance | Not decided | Audit section 8 gaps remain open |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted board | Private Design artifact in Dean's claude.ai account, <https://claude.ai/artifact/KcbKXUxwZFB77vZCfnLe7c>, version 6 (`1790165671-bab5`), 12 artboards. Only the owner can open it. Its sources run only in the Design runtime and are not copied here; their SHA-256 values are in the retained manifest |
| Retained captures | [Design board r01](../reference/ui/specialist/design-board-r01/README.md): 12 PNG captures at exact board size, with hashes. These are the repository reference for this decision |
| Workbench source | [r03](../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r03.html) `3cc832c3…9b881` (current ES-08 reference) on [r02](../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r02.html) `bc06fa41…a72e5c`. The uploaded r02 matched the repository bytes |
| Drawing source | [r10](../reference/ui/specialist/PPO-Greenhouse-Blueprint-and-Screen-Calculator-r10.html) `9578be7a…4cf5c2`. The uploaded r10 matched the repository bytes |
| Quantity definition | `SS-RECOVERED-QTY-r02`, unchanged. Board defaults reproduce the r02/r03 default example: 24 cuts × 20.0 m × 4.3 m = 2,064 m², 3.68 m drive spacing, 12 drive positions, 1,032 m² per motor, 100 Nm band |

The board's page heading reads **Screen Configurator Workbench**, the name used in the request. The register title `Specialist configuration workbench`, `scope:ES-08` and the `/estimating/configurations` routes are unchanged. The native heading is settled at implementation.

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md); the board's own declaration artboard is retained as capture A.

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-08` Specialist configuration workbench, Screen Systems; route `/estimating/configurations`. Increment: bring r10's coordinated drawing set and roll-fit check into ES-08. No calculation rule added or changed |
| Page type (r20) | Configure: Form / guided workflow, supported by Planning workspace (live plan). Drawings: Document & evidence workspace, supported by Record detail (inspector). Parts & working: Work queue + persistent detail. Pricing and Compare & save: Review / comparison. Definition review and Run history carried over from r03 |
| Reused components | Application shell (boundary only), tabs, fields, mobile form, buttons, validation, status, drawer, dialog, read state, product patterns (PPO part identity), r20 foundations. Page-specific: shared cross-section component, drawing sheet frame with title block and bar scale, readiness strip, drawing overlay labels |
| Source authority | User decision and owner acceptance as in section 1. Reference: r03, r02, r10. Fictional fixture: Northbank (`SYN-*`), `SYN-PRICE-02`, run R03/R04 figures and times, `CFG 7C41-A2E0`, gutter height and roof pitch. Unavailable: approved numeric ranges, current catalogue prices, motor selection, MYOB mapping, engineering acceptance |
| Incoming handover | Estimate `SYN-PPO-EST-000042`, option A, draft R04, facility `SYN-FAC-NB-GH02`; estimator with edit rights; fixed context, definition version and parameter record. Read-only for reviewers, locked estimates and restored backups |
| Outgoing handover | Immutable run: resolved lines with PPO part outcomes, parameter snapshot and price bridge. Drawing set (A3 PDF or SVG) and cut schedule CSV are derived exports bound to the run. Next owner: the receiving estimate. Prepared only; Send stays disabled until definition approval |
| Exceptions and recovery | Sixteen states on artboard C: loading, missing context, validation withheld, untested option, read-only, locked, stale preview, changed in another tab, saving, failure before commit, lost response after commit, saved, missing rate, filtered empty, roll too narrow, restored backup |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Accepted departures

All fifteen are owner-accepted for the board's desktop and phone compositions. The last column says how each departure relates to the pinned [audit](../delivery/es08-geometry-audit.md), [mapping register](../delivery/es08-geometry-mapping.md) and build plan.

| ID | Departure | Source behaviour | Relationship to the geometry plan |
|---|---|---|---|
| D1 | Drawings becomes a seventh view | r03: six views; drawings in the Configure side card | Matches audit section 6's proposed seventh view. Label **Drawings**; the route slug (`geometry` was proposed) is decided at WP-G06 |
| D2 | Structure entered once, as the recovered grid | r10: overall dimensions, end treatment, residual sections | Changes WP-G01/G02: drawings derive from the recovered spans and bays plus drawing-only profile inputs, not a second family dimension set (F01–F25). Residual modules (SG-F03) remain unsupported and visible, never converted to odd bays |
| D3 | Drawings show the priced cut layout | r10: per-module panel schedule | The r10 schedule becomes an unpriced coverage cross-check. Addresses SG-F01 by showing one priced quantity beside one explained cross-check; ES08-G02 panel scope changes accordingly |
| D4 | Installation overlength and roll allowance removed | r10: 1% overlength, 5% roll allowance | F30 and F31 are not captured: they would double-count shrinkage and overhang. ES08-G05 falls away unless supplier evidence reintroduces them |
| D5 | Roof profile adds Gothic and Sawtooth | r03: Gable, Arch, Venlo | Five drawing profiles. Profile remains drawing-only (SG-F05, SG-R05) |
| D6 | Venlo drawn with two roofs per span | r03: one roof per span | Default of D12; heights equal r10 |
| D7 | Plan length runs left to right | r03: length runs down the page | Landscape A3 sheets |
| D8 | Readiness strip in the module header | r03: release cell only | Six gates visible on every view |
| D9 | Scratch baseline inside Compare & save | r10: capture baseline | One comparison concept; the scratch baseline is session-only and never evidence (SG-F09) |
| D10 | Selects shown as segmented buttons | r03: select controls | Options visible, one action, 44 px targets. Impact on the shared fields component not yet assessed |
| D11 | Help button removed from the module header | r02, r03: "?" button | The shell owns the information icon |
| D12 | Venlo draws any whole number of roofs per span | r10: exactly two peaks per module | Generalises D6. Roof width 3.2, 4.0 or 4.8 m; the span must be a whole multiple. Restates ES08-G01's Venlo case |
| D13 | Arch is a gutter-connected circular arc; one span is the Quonset | r10: separate Quonset with sidewall and ridge inputs | Same circle as r10, entered as a chord angle. A sidewall/ridge conversion for single tunnels is not yet defined |
| D14 | Drawing-input errors withhold drawings, not quantities | r02: any invalid input withholds all results | Profile inputs have no quantity consumer, so a drawing error cannot invalidate the 143 quantities. Consistent with SG-R01 and mapping profile None |
| D15 | One shared cross-section component | r03 and r10: drawing code inside each page | Configure, the drawing set and the families standard cannot drift. Matches WP-G05's one drawing model and ES08-G03's shared transform |

## 5. Rulings

**DEC-R1 · Rounding policy.** ES-08's price bridge applies its definition's recovered policy (whole-dollar discount floor, then an upward $10 final rounding), so every run reproduces its own total. The E1 money contract applies in the receiving estimate after handover, as [ADR-0034](ADR-0034-es08-specialist-workbench.md) already requires through `SYN-EST-ARITHMETIC-01`. Any difference appears there as a named reconciliation line; neither policy silently overrides the other. The reconciliation line is new receiving behaviour: it needs a change to the receiver and its synthetic policy (audit N4, WP-G07) before it exists.

**DEC-R2 · Roll-fit check.** A run is a design record, so neither Not checked nor Too narrow blocks saving. Not checked shows a notice. Too narrow keeps the procurement unit unconfirmed and blocks Send to estimate until a wider roll or a different bay length resolves it. Consistent with ES08-G06 (a failed fit never claims procurement readiness); the Send block is an addition. Usable roll width stays an entered value (F34), not a supplier rule.

## 6. Structure drawing standard

Every cross section is drawn at true proportion by one component (the bay section detail alone exaggerates its vertical scale, and says so). Width and height share one scale and sheets carry a bar scale. θ is the entered angle, *sw* the span width and *k* the Gothic crown factor.

| Profile | Rise above gutter | Default | Range | Other rules | Basis |
|---|---|---|---|---|---|
| Venlo | roof width ÷ 2 × tan θ | 22° | 18–30° | Span must be a whole number of 3.2, 4.0 or 4.8 m roofs; lattice truss 0.45 m deep | r10 formula, default and range; roof widths and truss depth proposed |
| Gable | *sw* ÷ 2 × tan θ | 22° | 15–35° | One roof per span; Fink truss | r03 profile; range and default proposed; r10 has no gable family |
| Arch | *sw* ÷ 2 × tan θ (chord angle) | 27° | 15–45° | Circle R = (*sw*²/4 + rise²) ÷ (2 × rise); minor segment only (rise ≤ *sw*/2) | r10 circular segment; angle input, range and default proposed |
| Gothic | *sw* ÷ 2 × tan θ | 27° | 20–35° | y = rise × ((2 − *k*)t − (1 − *k*)t²), *k* = 0.35, t from gutter to mid-span | r10 formula, default and range |
| Sawtooth | *sw* × tan θ | 14° | 5–30° | Vent opening > 0 and < rise (0.75 m default); high side faces +width | r10 formula, pitch range and defaults; vent rule proposed (r10 allows 0.2–3 m) |

Common rules:

- The entered screen height is drawn. r10's fixed schematic offsets (gutter − 0.42/0.46 m) are not used (SG-F10).
- The screen must sit below the structure underside: gutter − 0.45 m for Venlo, otherwise the gutter or eave. A breach withholds the section, never the quantities.
- Truss webs (Venlo lattice, Gable Fink, Arch and Gothic king and queen struts, Sawtooth verticals) identify the structure type only. They are not member sizes, bracing design or load paths.
- Every sheet title block reads "Estimating study · not for fabrication".

**Known:** Venlo, Gable, Gothic and Sawtooth heights and the Gothic curve equal r10's formulas. The Arch circle is r10's circular segment.

**Assumed (proposed conventions):** the 0.45 m Venlo truss depth, Venlo roof widths, the Gable and Arch angle ranges and defaults, and web layouts.

**Uncertain:** real Powerplants and supplier profiles have not been compared. Supplier drawings for each family remain the evidence required by audit section 8.

## 7. Verification

These checks ran in the design session against the final board sources. Their scripts are not retained as repository evidence.

| Check | Result |
|---|---|
| Geometry against r10's formulas | Venlo ridge 4.6464 m (6.4 m span, 3.2 m roofs, 22°) and 4.8081 m (8.0 m span, 4.0 m roofs) equal r10. Gable ridge 5.2929 m. Arch R 3.9554 m, with the quarter point on the circle to 4 × 10⁻¹⁶. Gothic curve identical to r10 at all 65 sample points. Sawtooth high side 5.5957 m. Every validation rule fires: Venlo non-multiple span, arch rise above half span, vent at or above rise, screen above underside |
| Logic smoke test | All 12 artboards evaluate without runtime error |
| Rendering | Every artboard rendered locally with the Design type's runtime and React 18.3.1 at its exact board size: no page errors and no content beyond the board. Captures retained with hashes |
| Publication | All 12 artboards and the index were published from the verified local files in one version. The index and the two new artboards (Section, Structures) were read back and match byte for byte; the other ten were not read back |

**Not verified:**

- The 1024 × 768 layout, 200% zoom, keyboard order, focus return and screen reader.
- The phone boards on real devices.
- Rendering inside the claude.ai canvas itself.
- A3 print output.
- The repository's native Chrome evidence workflow.
- Application integration.

## 8. Unchanged by this decision

- **Retained records.** The audit, mapping register, field and calculation CSVs, implementation prompt and architecture proposal keep their pinned r01 content. WP-G00 must record the section 4 changes in the build plan once implementation is separately authorised.
- **UI baseline register.** The accepted [UI baseline register](../standards/ui-baselines.json) is not updated. Its entries pin a self-contained HTML design with a scope selector and token harness, and this board is not such a file. Promotion needs an issued HTML successor or native implementation with paired captures.
- **Page register.** ES-08 visual review stays Needs review. Owner acceptance of a design reference is not a review of the application page.
- **Parts and pricing.** C99 and C102 stay separate identities. REV, AUD and WAS findings, provisional part identities and unresolved mappings remain as recorded.
- **Open evidence.** Approved ranges, motor capacity, MYOB mapping, catalogue prices, Facility adoption (ES08-G10/G11) and engineering acceptance remain open. The board does not design Facility adoption.
