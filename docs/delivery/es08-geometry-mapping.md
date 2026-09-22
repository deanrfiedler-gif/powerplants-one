---
document_id: PPO-ES08-GEOMETRY-MAPPING
revision: r01
date: 2026-09-22
owner: Dean Fiedler
status: Proposed mapping register; no automatic mapping activated
source_commit: 0c95c5af776c97374997623bd1070d9de480cf82
---

# ES-08 Field & Calculation Mapping Register

This register maps the retained r10 technical-study reference against the actual native ES-08 model at `0c95c5af776c97374997623bd1070d9de480cf82`. It is derived analysis under ES-08 / EST-06 / E5, CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009. It does not replace the [native 64-field contract](es08-field-contract.csv), its recovered definition or the 143 source positions.

The complete matrices are maintained as UTF-8 CSV registers so all required columns remain readable and filterable:

- [Field mapping: 49 records, F01–F49](es08-geometry-field-mapping.csv). Contains r10 field, meaning, unit, family applicability, native candidate and meaning/unit, classification, conversion, source authority, calculation/history impact, open question and evidence.
- [Calculation/output mapping: 38 records, C01–C38](es08-geometry-calculation-mapping.csv). Contains inputs, formula/method, unit, rounding/precision, family applicability, native equivalent/consumer, automatic-handover safety, classification, verification, failure/unknown behaviour and evidence status.

The [audit](es08-geometry-audit.md#repository-evidence-map) defines evidence locators N1–N6, F1, D1, T1 and G1. `R10` is the [exact retained HTML](../reference/ui/specialist/PPO-Greenhouse-Blueprint-and-Screen-Calculator-r10.html), SHA-256 `9578be7aca13bbfc81a8f6c2c1b7359228079c88f6bb76a9f801681c8a4cf5c2`. Function names locate source even where long lines are inconvenient. Calculations around source lines 1144–1197 and presentation/export functions later in the file were inspected independently of the prompts. [Probe results](../testing/evidence/es08-geometry-audit/r10-calculation-observations.json) are observed reference execution, not accepted native or supplier results.

## 1. Classification and activation rules

| Classification | Meaning in this register | Required activation boundary |
|---|---|---|
| Direct | Same candidate physical meaning and compatible unit; stated contextual preconditions still apply | Explicit field/source adoption and versioned mapping profile. A Direct row is not evidence that an entire family or supplier system is valid |
| Derived | Candidate can be calculated through a stated, versioned transformation if preconditions hold | Preserve input operands/rule/units/rounding and review the full resulting tuple; refuse ambiguous or residual cases |
| Informational | Useful study, source, display or evidence content | Store/display within study; no automatic quantity-rule consumer |
| Unsupported | No valid current mapping/authority, or behaviour must be retired | Keep separate/replace with native control; no permissive numeric alias |
| Requires new definition | A legitimate future physical or quantity relationship is missing from the current definition | Supplier/domain evidence, versioned definition and independently accepted cases before using it commercially |

**No mapping is activated by this audit.** The proposed initial profile is None. “Automatic handover safe” in every calculation row describes this present state and any conditional future candidate. Even a demonstrated dimensional transformation must become a reviewed native input proposal, not a background overwrite or direct CE-LINE update. An explicit adoption can later allow a pure adapter to calculate the reviewed proposal; the user still accepts its changed basis.

## 2. Completeness index

| Rows | Coverage |
|---|---|
| F01–F06 | All six Venlo family inputs: width, length, gutter, module, spacing, roofPitch |
| F07–F12 | All six Quonset inputs: width, length, sidewall, ridge, spacing, screenElevation |
| F13–F18 | All six Gothic inputs: span, spans, length, gutter, spacing, roofAngle |
| F19–F25 | All seven Sawtooth inputs: span, spans, length, eave, spacing, roofPitch, ventHeight |
| F26–F37 | All twelve common state fields, including three drawing toggles |
| F38–F41 | All four optional project/title-block fields |
| F42–F46 | Both panel selection indices and each drawing's zoom/pan/viewport object; presentation only, not quantity inputs |
| F47–F49 | Baseline metrics object; portable schema/client timestamp; older Venlo alias handling |
| C01–C04 | Grid partition, whole-grid alternatives, physical width and area |
| C05–C17 | All family-specific rise/profile/arc/volume/vent/frame results |
| C18–C27 | Openings, panels, grouped schedules, lengths, roll fit, geometry/grid/eligibility |
| C28–C36 | Comparison, signature, front/side/plan/title blocks and SVG/CSV/JSON outputs |
| C37–C38 | Explicit rejected substitutions into native cloth/wire/drive/motor rules |

`GOTHIC_CROWN=0.35`, 96 half-arc segments, millimetre grid rounding and the assumed one-layer/one-panel-across basis are definition constants, not omitted editable fields. C01/C11–C13/C19–C25 and the build plan's precision contract identify them. The non-Quonset drawing offsets are drawing conventions called out in SG-F10, not secret screen-elevation inputs. No r10 input provides seams, hems, overlaps, parking, attachment extras, motor groups or engineering loads; their absence is a gap, not a default of zero approved extras.

## 3. Highest-risk semantic distinctions

| r10 concept | Tempting native match | Why it is unsafe / required treatment |
|---|---|---|
| Venlo module / two roof peaks | `span` or `spans` | One module contains two peaks; physical support-span interpretation is unconfirmed. Peak count is not span count |
| Sawtooth transverse “bay” | `bay` / `bays` | Native bay runs longitudinally. Candidate transverse mapping is span/spans only after confirmation |
| Longitudinal frame/hoop spacing | `spacing` | Native `spacing` means target drive spacing across a group. Longitudinal candidate is `bay`, with support semantics and exact cloth lookup checked |
| Panel count | Standard screens / across / down / motors | R10 has one panel per width×length cell; native count depends on screen groups/individual spans and odd adjustment; motors=across×down |
| Residual end section | `odd` or an extra-screen slot | Native odd replaces one bay with a parameter length and excludes part of cloth count; five extras have independent dimensions, materials and rounding |
| Opening mm | Cloth width / available drive width | R10 opening is transverse structural span/chord minus one allowance. Native clothWidth is a longitudinal bay lookup; drive width uses separate deduction |
| Installation overlength % | Shrinkage % | R10 multiplies longitudinal length by 1+p. Native divides transverse group width by 1−p; different axis and algebra |
| General roll allowance % | LS-wire spares % | Different material and quantity definition; no common consumer |
| Usable fabric roll width mm | Wider sheet m / LS-wire roll m | Unit conversion does not resolve fabric axis, usable width or material mismatch |
| Push-pull pipe / cable / fixed | Pinion / Cable enum | R10 concept does not specify mechanism, pipe/pinion diameter, speed, drive layout or capacity; fixed has no equivalent |
| Facility maximum height | Native height / gutter | Maximum envelope height does not identify the screen or gutter level |
| Recorded product/warp/weft | Verified material/parts mapping | R10 records context without changing geometry for orientation or validating supplier product rules |

### Worked incompatibility example

R10 default Venlo is 32 m ×60 m, module 4 m, longitudinal pitch 4.5 m. It produces eight widths and fourteen length sections (thirteen at 4.5 m and one at 1.5 m), hence 112 panels. Native `bays=14, bay=4.5, odd=No` would describe **63 m**, not 60 m. Toggling native odd does not correct it: the default odd parameter is 4 m, yielding 62.5 m and changing the cloth count. Neither substitution is valid.

Even a uniform grid only establishes possible physical dimension compatibility. At 32×60 m with a 4 m transverse module and 5 m longitudinal pitch, r10 has 8×12=96 panel cells. Native non-individual screens with `across=2`, `bays=12`, `odd=No` count 24 standard screens; their cut spans multiple physical spans. Equal house area does not make these two material arrangements interchangeable.

## 4. Source mapping supplements

| Source fact | Proposed study destination | Treatment |
|---|---|---|
| Facility `length_m`, `width_m` | Matching envelope dimensions | Offered observations only; adopt/override/unknown with version/unit/measurement basis and same-envelope confirmation |
| Facility `maximum_height_m` | Quonset ridge candidate or comparison to calculated max | Require same datum/envelope; not gutter or screen height; never solve roof pitch without a new derivation |
| Facility `footprint_m2` | Independent comparison fact | Retain separately from derived W×L; show discrepancy, do not overwrite either or derive a missing dimension by assumption |
| Facility `structure_type` / cladding | Context | Broad greenhouse/polytunnel does not determine the four study families or supplier screen suitability |
| Facility `bay_count` / `tunnel_count` | Context | Axes/envelope untyped for this purpose; not span, panel, motor or hoop count |
| Facility crop/use/season | Context, possibly engineering/supplier question | No geometry or motor-capacity coefficient inferred |
| Facility parent / relationship | Scoped context | Grouping and physically-within differ; no summing dimensions or double-counting areas |
| Discovery option/revision/system/area/scope IDs | Existing specialist binding | Exact immutable source context; area identity distinct from Facility UUID |
| Discovery Text/Zones facts | Evidence only | Existing `validateInherited` refuses numeric geometry use; retain that refusal |

## 5. Change control and evidence

Every row's historical treatment means **new draft/run only**; never rewrite old values, source IDs, precision policy, results or hashes. Semantic geometry/material/source changes invalidate study review and conservatively all fourteen manual allowances for schema 2; view-only controls do not. Rate values are preserved, with applicability reviewed separately. The existing estimate remains linked to its old run until explicit receiving.

The current definition remains `SS-RECOVERED-QTY-r02`, native calculation `SS-NATIVE-EXACT-QTY-r01`, provisional part identity `SS-PART-IDENTITY-r03-PROVISIONAL`, with bundle SHA-256 `f1ec5980ce6f1a68ba1a5b59eeda59a08da1851a6c7f7736d94041a5986d35c8`. No row in this register grants operational eligibility under `SYN-ES08-RECEIVE-01`.

WP-G00 must recheck all source files after #277 and other concurrent contributions resolve. A changed formula, new Facility fact or receiving contract requires an explicit register revision and new acceptance evidence. Existing numerical coincidence, a green geometry status, a supplier hyperlink or a passed source probe cannot close D-009, G06 or the retained REV/AUD/WAS findings.
