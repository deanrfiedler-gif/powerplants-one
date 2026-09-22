---
document_id: PPO-ES08-GEOMETRY-AUDIT
revision: r01
date: 2026-09-22
owner: Dean Fiedler
status: Audit and proposed integration design; native implementation not authorised
source_commit: 0c95c5af776c97374997623bd1070d9de480cf82
---

# ES-08 Advanced Geometry Integration Audit

The recommended increment is a versioned Screen Geometry Study owned by the existing Specialist Configuration aggregate, with its own geometry calculations, drawings and preliminary panel schedule. Retain the recovered Screen Systems quantity engine and require an explicit, versioned reconciliation before any geometry value changes its inputs. No r10 panel/material output is currently demonstrated to be a compatible automatic input to the 143 quantity positions.

This publication checkpoint records the audit and planning work to date; the user requested continuation at a later date. It creates no native behaviour, migration, migration-number reservation, permission, navigation or application-test change. The architecture and acceptance cases below are proposals; repository publication is not business, supplier or engineering approval.

The four deliverables are this audit, the [field and calculation mapping register](es08-geometry-mapping.md), the [native refinement/build plan](es08-geometry-build-plan.md), and the [subsequent implementation prompt](es08-geometry-implementation-prompt.md). The [architecture decision proposal](../decisions/es08-screen-geometry-study.md) records the choice and alternatives. [Audit evidence](../testing/evidence/es08-geometry-audit/README.md) distinguishes checks executed now from future acceptance.

**Publication update:** PR #277 merged at 2026-09-22 10:22:56 UTC, final head `876e92ab288b682e85f58773c7b02e340a7ab63e`, with all 20 reported checks successful. Remote main advanced to `d6251b42f5c969f537a6397c1823f8c871e4d4d1`. The audit remains pinned to the original commit below; publication reconciles documentation only. WP-G00 must review the final merged contribution and any later changes.

## 1. Authority, scope and exact baseline

The user's current request governs the work. The two supplied Markdown handovers describe the requested audit detail; their embedded implementation instructions and historical baselines do not authorise a build now. Likewise the older native r02 build plan/prompt describes the already delivered ES-08 increment, not permission to replay it. Current repository code takes precedence over descriptions of what was once planned.

Scope remains ES-08 / EST-06 / E5, CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009. No parent IDs are added or renamed. IF-01–IF-03 remain the blueprint's external interface evidence obligations; this package creates no ERP, SharePoint or CAD interface. Proposed `ES08-G*` acceptance IDs are local derived cases only.

| Observation | Exact identity / interpretation |
|---|---|
| Audited implementation | `deanrfiedler-gif/powerplants-one` at **`0c95c5af776c97374997623bd1070d9de480cf82`**, remote main verified on 22 September 2026; includes ES-08 #273 and Facilities #274, migrations through 0041, and Priva design #276 |
| Original working folder | `tmp/en07-change-impact`, branch `feat/priva-fertigation-native`, initial HEAD `9fa8bd5a40232e4f432b431a235bdb34a9dbbebe`; initial `git status --short` empty. Ignored fertigation logs/dependencies were present and left alone |
| Local main reference | `89c6c10d14c6096d9e894102fc1d790ea75a035e`; stale relative to remote main, deliberately not used as audit baseline |
| Isolated audit | `tmp/en07-change-impact/tmp/es08-screen-geometry-audit`, branch `docs/es08-screen-geometry-audit`, based directly on the exact audited commit; opened with `code --new-window` |
| Concurrent PR | [#277](https://github.com/deanrfiedler-gif/powerplants-one/pull/277), `feat/priva-fertigation-native`, initial head `9fa8bd5a40232e4f432b431a235bdb34a9dbbebe`, **OPEN** when first inspected; current observed state is recorded again in the evidence handover |
| Initial PR checks | 18 successful and two failed checks in the observed rollup: P01–P11 database proof and the integrated application/PostgreSQL proof. This audit neither diagnoses nor changes those failures |
| Source/schema method | Static code, all migration references to the relevant objects, retained contracts and tests. No database connected or live schema claimed. Fresh implementation must inspect its actual synthetic schema as well as all intervening migrations |

### Supplied and retained sources

SHA-256 values identify exact bytes, not vendor approval. The supplied estimating-folder r02 is byte-identical to the repository specialist-folder r02. r10 is retained unchanged as a new reference, not promoted to the accepted UI baseline.

| Source | Bytes | SHA-256 | Authority / revision |
|---|---:|---|---|
| `PPO ES-08 Screen Geometry Integration — Fresh Session Starter Prompt.md` | 17,292 | `f8ce4b05d81cdbe51e5eb0c4c3630bcf59a6b0615e3c12fd68fb4717b9abb259` | Supplied audit specification; current user boundary wins |
| `PPO Screen Systems Advanced Geometry Integration — Handover Summary.md` | 14,606 | `64bbf0ca9ac0267d02b4e1288c148ad9e244e3636495ccc1a0ab7ff99d2975d7` | Supplied handover dated 22 September; historical baseline confirmed independently |
| [Supplied r02 equivalent](../reference/ui/estimating/PPO-Specialist-Configuration-Workbench-r02.html) | 301,806 | `bc06fa41f1362145eb585431427ee5aebe94d1e3c8a40cc53b68ccc4d6a72e5c` | Historical standalone specialist design; 61 primary controls |
| [Repository r03](../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r03.html) | 417,185 | `3cc832c3368f5b7ac9eb3352eee0fc3525e5220984214eb6c459c6ae2fb79881` | Later retained design: part identities, 64 controls, parameters and richer schematics; [changelog](../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Changelog-r03.md) |
| [Supplied r10](../reference/ui/specialist/PPO-Greenhouse-Blueprint-and-Screen-Calculator-r10.html) | 217,032 | `9578be7aca13bbfc81a8f6c2c1b7359228079c88f6bb76a9f801681c8a4cf5c2` | Standalone technical study; schema `PPO-Greenhouse-Calculator-r10`; four independent geometry families |

The two supplied Markdown originals remain in the user's Downloads folder. Their complete contents were read; copies are not necessary to execute the new repository plan. Exact hashes and the operative boundary are retained here. All existing issued references remain unchanged.

### Repository evidence map

| ID | Source at audited commit | What it establishes |
|---|---|---|
| N1 | [types](../../src/estimating/specialist/types.ts), [definition](../../src/estimating/specialist/definition.ts), [field contract](es08-field-contract.csv), [manifest](../../src/estimating/specialist/source-manifest.json) | Draft/run schema 1; coverage binding; 64 fields, five extra slots, 143 positions, 14 manuals, six gates and 12 parameters |
| N2 | [engine](../../src/estimating/specialist/engine.ts), [rational](../../src/estimating/specialist/rational.ts), [hash](../../src/estimating/specialist/hash.ts) | Exact reduced rational quantities; distinct manual, calculation and evidence identities; source rounding |
| N3 | [service](../../src/estimating/specialist/service.ts), [context](../../src/estimating/specialist/context.ts), [source](../../src/estimating/specialist/source.ts), [validation](../../src/estimating/specialist/validation.ts), [HTTP](../../src/estimating/specialist/http.ts) | Authorised bounded proposals; source rebase/copy; draft/run transactions; expected versions; strict validation |
| N4 | [receiving](../../src/estimating/specialist/receiving.ts), [lineage](../../src/estimating/specialist/lineage.ts), [compare](../../src/estimating/specialist/compare.ts), [fixture policy](../../src/estimating/specialist/fixture-policy.ts) | Separate B/C/N configuration and estimate reconciliation; exact receiving policy, line units, prices and original quotation lineage |
| N5 | [reads](../../src/estimating/specialist/reads.ts), [recovery](../../src/estimating/specialist/recovery.ts), [client recovery](../../src/components/specialist-recovery.ts), [migration 0040](../../db/migrations/0040-specialist-configurations.sql) | Immutable drafts/runs/resolved sets, history/export and original-operation recovery; 256 KiB drafts, 2 MiB run snapshots |
| N6 | [workbench](../../src/components/specialist-workbench.tsx), [diagrams](../../src/components/specialist-diagrams.tsx), [CSS](../../src/components/specialist-workbench.css), [secondary menu](../../src/shell/secondary-menu.tsx) | Six route-backed views, real native controls and schematic plan/cut/cross/bay views |
| F1 | [Facility definition](../../src/shared/facilities/definition.ts), [reads](../../src/shared/facilities/reads.ts), [commands](../../src/shared/facilities/commands.ts), [0041](../../db/migrations/0041-facilities-growing-areas.sql) | Current Facility attributes, immutable reported-note sources, current row version and audit history; no public arbitrary-version Facility snapshot API |
| D1 | [Discovery configuration](../../src/estimating/configuration.ts), [revision authority](../../src/estimating/discovery-workspace-context.ts), [specialist binding](../../src/estimating/specialist/context.ts) | Saved option/revision/system/area/Facility scope. Text/Zones facts have no compatible inherited Screen Systems numeric mapping |
| T1 | [unit](../../tests/unit/specialist.test.ts), [database](../../tests/database/specialist.test.ts), [HTTP](../../tests/http/specialist.test.ts), [compiled browser](../../tests/browser/specialist-workbench.spec.ts), [native handover](es08-specialist-workbench-handover.md) | Existing verification architecture and historical results; these application suites were not rerun for this documentation audit |
| G1 | [ADR-0034](../decisions/ADR-0034-es08-specialist-workbench.md), [old build plan](../reference/ui/specialist/PPO-ES-08-Specialist-Configuration-Workbench-Native-Build-Plan-r02.md), [old prompt](../reference/ui/specialist/PPO-ES-08-Specialist-Configuration-Workbench-VS-Code-Implementation-Prompt-r02.md), [r02 report](../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Report-r02.md) | Recovered semantics, delivered native boundaries, unresolved REV/AUD/WAS findings and preserved lineage contracts |

## 2. Capability comparison

R10 locators below are function names in the retained HTML. R02 locators refer to its embedded model and the r02 report; the repository `docs/design/specialist/r02/` sources expose the same model for inspection.

| Capability | Existing native ES-08 | Standalone r02 | r10 | Overlap | Gap | Recommended native owner | Required action | Evidence |
|---|---|---|---|---|---|---|---|---|
| Geometry capture | Physical/calculation spans; bay count/length; drawing roof enum | Same core recovered geometry, without r03's roof/chord/pipe additions | Four family-specific parameter sets | Width/length context | Family physics, residual grid and axis semantics absent | Geometry study | Add typed family inputs; explicit dimension reconciliation | N1/N2; `geometrySpecs`, `partition` |
| Screen configuration | Grouping, cloth/edges, bed/wire, drive, extras | Recovered workflow | Single horizontal layer; opening allowance, overlength, roll context | Screen intent | R10 has no native motor groups, edge/seal/bed definitions | Existing quantity configuration plus study | Keep separate meanings and explicit assumptions | N1/N2; `screenSpecs` |
| Quantity calculation | Exact rational 143 positions | Binary JS recovered rules | Preliminary panels/linear metres, area/volume | Dimensions and quantities displayed | Material axes, precision and business purpose differ | Quantity engine for commercial positions | No automatic r10 output injection | N2; `finaliseSpanModel` |
| Parts | Provisional part identity/rule conflicts | No current SKU mapping | Free-text product reference only | Reference context | No supplier parts/capacity selection in r10 | Existing parts resolver | Preserve REV/WAS and unavailable mappings | N2/G1 |
| Manual quantities | Fourteen explicit values and basis review | Same local review demonstration | No manual parts model | User assumptions | Study changes not in current manual hash | Specialist review | Version review basis; preserve values and require re-review | `manualBasis`; N3 |
| Pricing | Separate illustrative and exact receiving policies | SYN-PRICE-02 illustration | None | None | No rate/unit evidence in r10 | Existing pricing/receiver | Preserve rates; explicitly reassess applicability | N4 |
| Drawings | Plan, cut, cross section, bay section; nominal roofs | Simple schematic plan | Front/side/plan, title blocks, selected panel, zoom/pan | Technical explanation | Native lacks family geometry; r10 has schematic placements | Study renderer inside ES-08 | Native vector model; retain quantity cut working | N6; `draw*`, `drawing` |
| Findings/readiness | Source and quantity diagnostics; receiving blockers | Review open; operationalReady false | Geometry/grid/opening/roll/release strip | Explicit uncertainty | r10's `fabricationAllowed` does not mean fabrication approval | Separate study findings + existing review | Use domain-specific readiness; never collapse to approved | `statusModel`, `renderReviewStrip` |
| Evidence | Exact source, actor, time, hashes and immutable runs | Local fixed-context snapshots | Project metadata, signature, assumptions | Trace labels | Browser data is untrusted and mutable | Specialist aggregate | Server provenance and retained study snapshot | N3/N5 |
| Comparison | B/C/N lines and independent estimate receiver | Local rerun comparison | Replaceable common-metric baseline | Before/after review | No r10 original-run identity or protected manual edits | Native comparison/history | Compare exact study snapshots plus existing line conflicts | N4; `currentComparisonSnapshot` |
| History | PostgreSQL immutable history and authorised replay | Browser local history | One mutable configuration/baseline | Stored state | R10 has no controlled revision history | Native history | Retain old render/model/schema versions | N5; `configPayload` |
| Exports | Authorised saved-run JSON/print | Local JSON backup/read-only restore | Three SVGs, CSV, JSON, print | Shareable study evidence | R10 draws from viewport and exports mutable state | Native saved-run export | Fixed sheets, safe SVG/CSV and exact run manifest | N5; export listeners |
| Source lineage | Exact Discovery binding → run → resolved set → estimate version | Fictional fixed context | User-typed project text | Context labels | No Facility/source authority in r10 | Existing source/lineage services | Add reviewed Facility observation bindings; no new customer identities | N3/N4/F1/D1 |
| Facility/Discovery | Coverage IDs, no numeric inheritance from Text/Zones | Fixed sample Facility | No connected source | Greenhouse context | Adoption UI and schema absent | Specialist source adoption | Adopt / Override / Unknown with captured values | F1/D1 |
| Responsive | Existing compiled desktop/touch proof at 320–1920 widths | Standalone responsive form | Stacked drawings and scrollable inspector | Responsive controls | Technical label density; drawing hit-test defect | Shared shell + geometry view | Focused phone details and equivalent numeric schedule | N6/T1; audit browser capture |
| Accessibility | Native dialogs, labels, unsaved navigation and status | Labels/dialogs in local prototype | Numeric panel selection, zoom buttons, SVG title/desc; pointer pan/table click | Alternatives partly exist | Keyboard pan and row action semantics incomplete | Native controls | Keyboard selection/pan; focus, announcements, reflow proof | `bindPan`, `bindPlanSelection`, `cutRows` listener |

## 3. Material audit findings

| ID | Finding and evidence | Required native disposition |
|---|---|---|
| SG-F01 | **Axes differ.** R10 opening width = transverse module/chord minus allowance; study length = actual longitudinal section × overlength factor. Native cloth width comes from longitudinal `bay`, and native cut runs across one or more calculation spans with shrinkage and two overhangs | Never map opening→clothWidth or studyLength→cut by label. Keep the two schedules visible with axes and units |
| SG-F02 | **Counts differ.** R10 counts width modules × longitudinal sections (one screen layer); native standard count uses motor grouping/individual spans and subtracts odd-bay screens | Panel count is not native count, motorCount, across, down or an extra-screen count |
| SG-F03 | **Residual is not odd bay.** R10 partitions exact entered dimensions to 1 mm and sizes residuals individually; native `odd` replaces a bay by `odd_bay_default_m` and retains an unresolved missing-cloth-set finding | Block inferred mapping from residual flag to `odd`; no forced entry into five extra slots |
| SG-F04 | **Drive concept is informational.** `pipe`, `cable`, `fixed` change notation; r10 does not compute drive spacing, motor count/torque or parts. Native Pinion/Cable branches and C99/C102 identities are distinct | Require supplier/system definition before mechanism mapping; fixed has no native drive-family equivalent |
| SG-F05 | **Family labels do not establish quantity support.** Native `roof` affects schematic presentation, not a tested supplier family envelope | All four start as geometry studies. Existing quantity workflow remains independently usable; family-compatible commercial mapping requires evidence |
| SG-F06 | **Raw result availability is inconsistent.** `fabricationAllowed` blocks invalid opening/whole-grid mismatch, but roll failure still allows study CSV. Summary/baseline retain some panel and length results even for invalid structure | Rename to preliminary schedule eligibility; withhold affected results on invalid inputs, keep Unknown/Failed distinct and label every export |
| SG-F07 | **Plan hit-test defect reproduced.** At 1440×1000, clicking the drawn centre of W08-L14 selected W07-L13. Drawing calls `planMap` with plot height; hit-test calls it with full sheet height including title block | Share one model-to-view transform for drawing/hit testing; test known panel centres, boundaries, zoom, scroll and resize |
| SG-F08 | **Import bypasses family validation.** `applyImported` spreads family objects without enforcing geometry specs; `partition(1,0)` timed out in a bounded VM probe. No file-size/array-count boundary protects that path | No raw standalone import in first increment. If later justified: strict schema, key/depth/bytes/count bounds, source-only proposal preview; no trusted results/actor/approval |
| SG-F09 | **Historical evidence absent.** 32-bit FNV-like signature covers selected geometry and screen data, excludes project and view state, and has no definition/version evidence. Local baseline is replaceable | SHA-256 with schema dispatch, immutable snapshot and separate computation/evidence/render hashes |
| SG-F10 | **Drawing conventions are invented study geometry.** Venlo has two peaks/module; native Venlo sketch has a different nominal convention. R10 non-Quonset screen elevations are drawn at gutter minus 0.46/0.42 m or eave minus 0.40 m, not entered installation elevations | Mark conventions; add explicit proposed screen plane height to native study or render symbolic level. Never derive C31 from these offsets |
| SG-F11 | **Numerical policy is implicit.** Grid partitions round to millimetres; many other calculations use JS Number; Gothic arc is a 96-segment half-profile sum; drawing uses a different sampling resolution; tolerances differ by check | Version a numerical policy; separate exact lengths/products from approximate curved results and display rounding |
| SG-F12 | **Export is viewport dependent.** `drawing()` uses DOM width/height; SVG export restores full viewBox but does not choose a canonical physical sheet. CSV quotes cells but does not neutralise spreadsheet formulas from metadata | Fixed versioned sheet model and safe text serializers; title block must distinguish reference revision r10 from native run revision |
| SG-F13 | **Legacy local-load mismatch.** `previousStorageKey` points to r09 while loader checks an r08 schema | Retire automatic local migration. Any later conversion must be explicit and tested per exact source version |
| SG-F14 | **Supplier defaults are unconfirmed.** Product text, fabric direction and roll width do not enforce seams, hems, shrink/stretch, parking, layers or loads | Preserve assumption categories and supplier evidence blockers; successful geometry is never fabrication release |

The browser observations above are bounded reference findings, not native ES-08 defects or acceptance. No source file was repaired to hide them.

## 4. Family-by-family assessment

| Family | What r10 genuinely calculates | Native understanding | Safe existing rule use | Geometry-only results | New definition needs | Required evidence |
|---|---|---|---|---|---|---|
| Venlo | Width and length partition; two equal roof peaks per module; rise/volume via tangent; rectangular openings and standard/residual panel groups | Physical spans, regular bays, nominal Venlo sketch; no dual-peak module contract | Existing engine on independently confirmed regular inputs. A reviewed whole-grid dimension tuple may later reconcile to span/bay inputs if axes and six-row lookup fit; this proves arithmetic, not supplier applicability | Roof pitch/volume, partial-width module reshaping, panel/roll schedule | Residual layouts, dual-peak physical-span equivalence, fabrication lengths/widths and product-specific rules | Structural-module definition; screen orientation/grouping; partial end details; attachment/roll/product rules |
| Quonset / high tunnel | Minor circular segment above sidewall; radius, hoop arc, cross-section/volume; horizontal chord at explicit elevation; residual hoop sections | `Arch` is a drawing choice; no circular radius/chord quantity semantics | No automatic family-specific mapping. Explicit screen elevation can match C31 as context after datum confirmation; supported bay length alone cannot validate other parts | Chord, arch length, volume and horizontal panel study | Hoops versus support bays; narrowed chord/group topology; frames/attachments; roll orientation; drives | Actual hoop profile, screen suspension and load path, roll direction, motor/attachment evidence |
| Gothic multi-span | Whole connected spans; pointed quadratic profile with crown factor 0.35; equivalent angle; analytic profile area; approximated roof arc; longitudinal residuals | No Gothic family; Gable/Arch/Venlo enum does not represent its physical profile | Whole span/count values are semantically candidate dimensions after explicit confirmation. Only 3/4 m frame presets overlap current cloth lookup; no generic family receiver | Curved roof and volume; horizontal screen at schematic level; panel schedule | Crown/profile fidelity, clearances, residual frame and actual screen installation details | Supplier cross-section, meaning of angle, installation plane, screen/product rules and hardware capacity |
| Sawtooth multi-span | Repeated single slopes; rise/slope length; triangular roof volume; gross vent area/ratio; vent-height check; horizontal panels | No Sawtooth model; r10 “bay” is transverse while native “bays” is longitudinal | Candidate transverse span/count only after axis confirmation; 3/4 m frame presets overlap lookup, 3.66 does not | Roof/vent geometry, gross rather than aerodynamic vent ratio, schematic screen plane | Transverse bay/longitudinal bay distinction, vent/parking conflicts, loads and mounting | Supplier bay/vent details, vent intrusion/clearance, suspension/drive design; no ventilation-performance inference |

## 5. Recommended architecture and source ownership

Use the existing TypeScript/React/PostgreSQL stack and pure, typed functions; no new generic rules engine, framework or service. The [decision proposal](../decisions/es08-screen-geometry-study.md) rejects an iframe, wholesale HTML port, browser-authoritative state, replacement of the quantity engine, and a separate top-level study identity.

`ScreenGeometryStudy` is a versioned subordinate value within new Specialist draft/run schemas. Its identity is `(configuration_id, draft_id/run_id, study schema/hash)`, not a duplicate customer or project. Keep `DraftProposal` and `RunSnapshot` schema 1 readable and hash-stable. A schema-2 adapter supplies the unchanged quantity input shape to the old quantity engine; geometry is optional, and legacy records mean **No geometry study recorded**, never an invented Venlo default.

The proposed contract separates source bindings, raw family/screen inputs, normalized values, findings, geometry results, compact panel schedule/drawing model, numerical policy/definition/implementation hashes, assumptions and review decisions. The server computes and saves them with the run and resolved set atomically. Detailed fields, bounds, state transitions and schema implications are in the build plan.

### Facility and Discovery relationship

Organisation → Site → Facility/Growing Area → saved Discovery option/revision → Specialist Configuration remains the identity chain. Native Facility is a shared scoped record; an ES-02 configured Area is an estimating-local identity, not automatically a Facility. Preserve both when present.

F1 exposes approximate `length_m`, `width_m`, `maximum_height_m`, separately recorded `footprint_m2`, `measurement_basis` (reported/approximate/measured), observation date and immutable reported-note source. `structure_type` is broad (greenhouse/polytunnel/etc.), not one of r10's four families. `bay_count` and `tunnel_count` do not declare geometry axes or screen grouping. Parent relationships distinguish grouping from physically within. Do not add child dimensions or footprint to the parent merely because a hierarchy exists.

The proposal initially binds one physical Facility per study, selected from permitted saved coverage; multi-Facility scope remains existing context and requires choosing the study's physical envelope explicitly. More physical envelopes require separate configurations or a later multi-study definition, not summed dimensions. A Facility edit never writes back from the specialist study.

| Source treatment | Native behaviour to build |
|---|---|
| Adopt | Preview exact Facility ID/current version, scoped site/company, field key/value/unit, observation basis/date, source ID/version/recorded actor/time. Confirm physical extent and family separately. Save copied value plus source observation hash and adopting actor/time/reason |
| Override | Retain the offered source value and pointer, entered design value, unit, reason and actor; future source refresh presents a conflict rather than replacing the override |
| Unknown | Store explicit unknown with reason; no blank-to-zero, family inference or default disguised as observation. Incomplete draft may persist, dependent calculations/run review are blocked |
| Later drift | Compare accepted observation with current version. Offer retain prior basis with reason, adopt successor, override or unknown. Unrelated Facility edits can be acknowledged as no relevant value change; still record the new source version if adopted |
| Access loss | Require current read authority for source previews, history and exports; do not leak old protected values. Preserve server evidence; receipt recovery follows authorised original accepted references |

There is no public F1 method to retrieve an arbitrary historical full Facility version. Capture the full relevant observation at adoption while authorised. Immutable `facility_sources` rows and audit entries support provenance; they are not a substitute for the captured values. The new write must recheck source version and relationships transactionally. D1's Text/Zones fields stay context only; do not weaken `validateInherited` to accept matching numeric text.

## 6. Native UX and output proposal

Retain ES-08 scope and canonical `/estimating/configurations/[id]/[view]`. Add a proposed seventh view, **Geometry & drawings**, at `geometry` after Configure. r20 page type remains Form / guided workflow, with a Document & evidence workspace for technical sheets and Review / comparison support. The existing shell owns viewport and navigation; the module owns the interior scroll. No new global navigation destination is needed.

Reuse `SecondaryMenuFrame`, current header/context composition, labelled fields, native tables, `Dialog` inspection treatment, `useDiscoveryNavigation`, `useSpecialistCommand`, `ErrorNotice`, scope preferences and unsaved-change controls. Apply current r22 tokens and root stylesheet order. Proposed departures are the seventh view, vertically stacked technical sheets and linked inspector; they require later native visual review and do not alter the accepted baseline now.

Desktop: context/revision and saved/unsaved state at top; compact source/family inspector alongside a broad drawing column; front, side and plan stacked vertically. Put selected panel details in an inspector with schedule access, retaining a textual unit-labelled calculation basis. Keep the existing cut/bay quantity diagrams accessible in Configure/Parts; they explain the commercial definition rather than the new study's physical roof.

Phone: sequential source/input cards, one readable drawing at a time with front/side/plan controls, fit/zoom, accessible numeric panel selection and an equivalent schedule. Confine drawing/table horizontal scroll; never shrink all technical labels to fit. Keyboard users can select width/length indices, previous/next panel, move the viewport with labelled controls, reset fit and open/close the inspector with focus restored. Colour is supplementary to Standard/Custom/Blocked/Unknown text.

Unsaved edits may calculate previews immediately but save only on explicit draft/run action. A late response cannot overwrite a newer input revision. Missing/invalid values remain visible; changing family preserves only explicitly retained per-family drafts, with hidden invalid fields reachable in the error summary. Historical mode is read-only and clearly labels its original source/review state.

Each immutable run retains front/side/plan drawing data, selected-section detail basis, grouped panel study, fixed sheet dimensions/renderer version, title-block context snapshot, legend, assumptions and findings. Export through authorised exact-run reads. Use **Preliminary estimating/coordination study — not for construction or fabrication**; never label successful geometry “engineering approved”. Technical title blocks show configuration reference, run sequence/time, study definition and relevant source revisions. `r10` remains source revision, not native drawing revision.

Generate SVG from safe typed primitives and escaped text, without imported script, external image URLs or arbitrary SVG. A canonical sheet coordinate system must be independent of device viewport, with no panning crop in export. Print/report handover retains run/hash/status and excludes unapproved commercial or personal fields as required by audience. SharePoint remains document authority; this plan defines a future evidence handover, not a connector, library, upload or document issue implementation. Native CAD retains structural/design authoring.

## 7. Review invalidation and history

| Change after reviewed run | Recompute / reopen | Retain unchanged |
|---|---|---|
| Geometry/grid/screen elevation | Study results, panel groups/drawings and findings; new geometry review basis; all 14 manual allowances need re-review under conservative schema-2 policy | Manual values/reasons, old run, current estimate contribution and quotation version |
| Product/direction/roll/allowance | Opening/material results, fit and supplier findings; affected part/product applicability and price applicability need review | Quoted rates remain as recorded; do not fetch/reprice automatically |
| Explicit mapped native dimensions | Quantity engine recalculates using its unchanged rounding/definition; B/C/N parts and receiving comparison required | Unrelated manual estimate lines, deletion/omission choices pending explicit resolution, older resolved sets |
| Family/mechanism change | Geometry and mapping compatibility blocked pending review; old part suitability cannot carry silently | Old accepted family/parts/price evidence; current configuration identity |
| Facility/Discovery source successor | Source comparison, scope checks, signed previews and source-bound review; even equal numbers have new provenance | Original adopted source snapshot in old runs; no automatic pointer replacement |
| Zoom/pan/hover selection | View only | Quantity hash, reviewed geometry and manual reviews; exported canonical sheet unaffected |
| Drawing title/note or saved presentation policy | New evidence/drawing review and run snapshot if saved | Mathematical quantity identity and previous exported evidence |

Geometry-only mode must produce exactly the same 143 quantities as before. It can make the new run need technical/manual review without fabricating quantity changes. The new receiving preview must disclose a different source run even where money is equal; preserve N4's evidence-aware no-change rules. Existing immutable quotations remain tied to their original estimate version.

## 8. Supplier and engineering gaps

| Gap | Evidence required / owner to nominate | Consequence until supplied |
|---|---|---|
| Physical module and profile | Project/supplier drawings for each family, real dimensions, support/frame axes, screen plane and datum | Geometry uses an explicit study convention; no approved structural model |
| Residual/custom conditions | Supplier/engineer details for shortened frames/modules, end supports and attachment | Custom finding remains open; no generic extra-screen conversion |
| Material orientation and usable roll | Product/version, usable rather than nominal width, warp/weft orientation, defects/selvedge limits, availability/date | Recorded roll check only; no order quantity or product suitability |
| Fabrication allowances | Confirmed shrink/stretch, seam, hem, overlap, reinforcement, attachment and parking rules with units/rounding | r10 percentages/clearance stay assumptions, never inherited supplier rules |
| Layers and arrangements | Number of layers, independent/linked panels, blackout seals, slope/obstructions and travel | Initial one-layer horizontal study only |
| Mechanism/drive/motors | Confirmed Pinion/cable/fixed semantics, leading edge, drive interval, motor groups, torque/speed/power and structural load limits | Preserve REV-04/09/19, WAS conflicts and untested notices; no motor SKU or capacity approval |
| Parts/procurement | Exact supplier/PPO/MYOB identity with company/entity keys, stock units/lengths, substitutions and price source | Existing unresolved mappings remain; no conversion of metres to rolls by factor one |
| Engineering precision | Accepted profile approximation, installation tolerance and source measurement accuracy | Numerical regression tolerance only; no physical construction tolerance |
| Historical quantity findings | REV/AUD/WAS resolution evidence, particularly manual finals, odd-bay cloth, LS wire and source catalogue conflicts | Retain findings and existing review/receiver restrictions |

Linked supplier websites inside r10 are reference context, not verified product rules in this audit. No current availability, installation rule or engineering tolerance is asserted from them.

## 9. Risk register

| ID | Severity | Consequence | Mitigation | Required acceptance evidence |
|---|---|---|---|---|
| SG-R01 Incompatible mapping | Critical | Plausible but wrong cloth/wire/motor quantities | Explicit axis/unit/definition compatibility; default mapping None | ES08-G07/G08/G09 |
| SG-R02 Duplicate authority | High | Facility/Discovery, study and quantity input disagree silently | Source adoption and signed reconciliation; display divergence | G10/G11 |
| SG-R03 Historical mutation | Critical | Earlier run/quote cannot be reproduced | Immutable schema dispatch and saved drawing model; never rehash v1 | G12/G18 |
| SG-R04 Numerical precision | High | Threshold/fit classifications vary by platform | Exact grid/decimal arithmetic; version approximate policy and uncertainty | G01–G06 |
| SG-R05 Unsupported family | High | Roof selection falsely authorises parts | Family support states separate geometry and quantities | G07/G09 |
| SG-R06 Supplier assumption | High | Study is ordered or fabricated as approved | Evidence class and fixed preliminary release status | G06/G20 |
| SG-R07 Panel/roll conclusion | High | Count/orientation or residual wrong; width fit mistaken for cut rule | Separate opening, study length, usable width and missing fabrication extras | G02/G05/G06 |
| SG-R08 Drive/motor mismatch | Critical | Wrong capacity or load implication | Profile has no automatic drive mapping; preserve current findings | G09 |
| SG-R09 Estimate lineage | Critical | New study overwrites accepted costs or manual edits | Existing independent B/C/N receiver and original run links | G18/G19 |
| SG-R10 Facility drift | High | Live source edits rewrite design basis | Capture values/version and explicit refresh; version race refusal | G10/G11/G15 |
| SG-R11 Capacity/import | High | Unbounded panels freeze browser/service | Validate before iteration; bounded grid/schedule; no r10 JSON restore | G14/G22 |
| SG-R12 Responsive detail | Medium | Tiny labels, clipped status or inaccessible drawing | Stacked sheets; contained zoom; numeric equivalent | G21 |
| SG-R13 Keyboard/hit testing | High | User reviews wrong panel | Shared transform; explicit numeric selection; keyboard controls | G03/G21 |
| SG-R14 Export fidelity | High | Wrong revision, clipped title block, unsafe SVG/CSV | Canonical fixed sheet; safe serialization; exact-run permission | G20 |
| SG-R15 Concurrent Priva integration | High | Lost receipt/Discovery changes or migration collision | Fresh main branch after resolution; explicit touched-file reconciliation | G00/G23 |
| SG-R16 Legacy compatibility | High | New schema breaks old draft/run/receiving hashes | Preserve v1 code paths and old bundle; nullable study, no backfill | G08/G12/G23 |
| SG-R17 Source access/recovery | High | Protected geometry leaked or accepted save duplicated | Current source authority plus exact accepted-operation recovery | G13/G16/G17 |

## 10. Parallel-work boundary and implementation gate

At the inspected PR head, #277 adds migration **0042**, a separate FertigationScope domain, Discovery/costing read projections, new receipt dispatch, routes and navigation, CSS and extensive verification. It does **not** change `src/estimating/specialist/*`, `src/components/specialist-*`, `src/platform/permissions.ts` or migration 0040. Do not mistake that present lack of direct specialist edits for absence of shared integration risk.

| Likely overlap | Current #277 change | Screen implementation handling |
|---|---|---|
| `src/estimating/cost-basis-service.ts`, `discovery-workspaces.ts` | Includes received fertigation handovers in previews/workspace reads | Preserve these projections and saved revision context; avoid changing shared readers unless required by verified source adoption |
| `src/components/discovery-costing.tsx`, `estimation-wizard.tsx` | Presents fertigation links/received notes | Geometry entry stays in ES-08 initially; regression prove incoming/outgoing source context |
| `src/shared/receipts.ts` | Fertigation accepted authority and unborn-create recovery | Reuse existing specialist commands where possible; preserve every original dispatch branch |
| `src/shell/module-workspaces.ts`, `navigation.ts`, `src/app/styles/my-work.css` | New fertigation module and shared menu selectors | Add only local ES-08 view; preserve fertigation registration and shared selectors |
| Migration registry/demo upgrade/exact-version tests | 0042 and upgraded guard/count expectations | Determine next number from then-current main; inspect actual schema and guard purpose; retain global upgrade proofs |
| Estimating CI and documentation registers | New compiled fertigation checks and new status/instructions/baselines | Merge documentation deliberately; do not replace fertigation status with this older main snapshot |
| Permissions | No permission-source change in inspected diff; existing permissions reused | No new capability planned; inspect current main again before deciding |

Recommended sequence: documentation-only review now; verify the now-merged contribution and any further concurrent work; refresh remote main and record the new SHA; create a new implementation worktree/branch from that main; reconcile this package and PR #277 plus every intervening change; implement the ordered build packages only after a separate user instruction to proceed. Do not branch the implementation from this old audit branch, cherry-pick fertigation application commits, reserve a migration slot, or rebase/reset its branch.

**Exact next bounded step:** review the mapping boundaries and proposed study contract in these four deliverables. Once implementation is separately authorised and concurrent work is resolved, execute **WP-G00 only as the first checkpoint**: fresh-main reconciliation, touched-file/schema/receipt inventory and refreshed source manifest, before allocating any migration or editing native behaviour. The supplied future prompt preserves that dependency.
