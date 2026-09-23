---
document_id: PPO-ES08-GEOMETRY-PLAN
date: 2026-09-22
owner: Dean Fiedler
status: Proposed native refinement plan; stop before implementation pending separate instruction
source_commit: 0c95c5af776c97374997623bd1070d9de480cf82
versioning: git
---

# ES-08 Advanced Geometry Refinement / Native Build Plan

Build one controlled ES-08 workspace combining the existing quantity workflow with a separate versioned geometry study and explicit mapping. The first native increment should deliver all four bounded geometry families, drawings, panel inspection, preliminary schedule, source adoption, immutable history and exact-run exports. It must not introduce unverified component/material/motor calculations. This is an executable proposal; none of the work packages below has been implemented by the audit.

Read the [audit](es08-geometry-audit.md), [mapping register](es08-geometry-mapping.md) and [architecture proposal](../decisions/es08-screen-geometry-study.md). Scope and all derived cases trace to ES-08 / EST-06 / E5, CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009. Do not renumber parent requirements or use the historical ES-08 quotation-authoring identity.

## 1. Entry gate and ordered work packages

| Package | Dependencies | Concrete work/files | Completion evidence |
|---|---|---|---|
| WP-G00 Refresh and reconcile | Separate user implementation instruction; #277/concurrent contributions resolved | Verify remote main and PR states; new `feat/es08-screen-geometry` branch/worktree from updated main; inspect AGENTS, schema, specialist/fertigation/shared diffs and source hashes. Record exact SHA and any changed decisions in this package | Refreshed route/command/DTO/schema/estimate-writer inventory, protected-worktree status and touched-file matrix; no stale migration assumption |
| WP-G01 Contract and fixtures | G00 | Proposed `src/estimating/specialist/geometry/{types,definition,validation,precision}.ts`; schema-1/2 dispatch in specialist types/validation. Define source adoption, findings, mapping statuses, geometry input/output, drawing model and byte limits. Independently author family fixtures | Contract coverage for every mapping row; valid/incomplete/invalid drafts and bounds; ADR recorded before changing technology |
| WP-G02 Pure geometry | G01 | `geometry/{engine,grid,panels}.ts` using bounded typed functions and rational arithmetic where appropriate. Port intended formulas, not DOM/import/state. Explicit numeric deviations from r10 | ES08-G01–G06 hand-derived examples, boundaries and stable results; preserve r10 observations as differential evidence, not sole oracle |
| WP-G03 Persistence and source adoption | G01/G02 | New additive migration **number TBD from then-current main**, only after schema review; specialist service/context/source/reads/recovery/HTTP integration and existing draft/run routes. Scoped Facility read adapter and transactional adoption | G10–G17/G23: save/reload raw draft, immutable run, old-schema read, access denial, source/version race, rollback and receipt recovery |
| WP-G04 Reconciliation and invalidation | G02/G03 | `geometry/mapping.ts`; specialist compare/service/receiving/lineage/fixture-policy as justified. Default mapping None; reviewed dimension proposal only when preconditions pass. New review-basis version and geometry-aware synthetic policy | G07–G09/G18/G19/G24. All 143 legacy quantities identical with mapping disabled; no old policy bypass or silent reprice |
| WP-G05 Drawing model and exports | G02/G03 | `geometry/drawing.ts`, proposed `src/components/specialist-geometry-drawings.tsx`; canonical SVG/text/CSV serializer and authorised run export extension under existing route family | Same model → same canonical drawing data/export independent of viewport; G03/G20; no raw imported SVG or current-source dependency |
| WP-G06 Native view and workflow | G03–G05 | `src/components/specialist-workbench.tsx`, proposed geometry inspector/panel components and scoped CSS, `definition.ts` local views, dynamic `[view]` route validation; reuse shell/menu/recovery/navigation | Seven native views, source comparison, source divergence, editable/readonly/history states; G15/G17/G21; source/native visual comparison |
| WP-G07 Full receiving journey | G04/G06 | Exact synthetic receiving fixture and explicit revised policy, estimate comparison + protected manual edits, immutable old quotation | Primary journey below passes in database/API/compiled browser; operational receiving remains blocked |
| WP-G08 Integrated assurance | G02–G07 | Existing specialist and Estimating/Facilities/fertigation relevant suites; all affected migration consumers; compiled browser workflow on actual current main | G00–G24 evidence tied to exact commit/runtime; disclose environment failures against unchanged baseline |
| WP-G09 Review handover | G08 | Updated audit decisions/contract/register/status, complete PR description and evidence paths; no deployment | Reviewable PR with executed checks, unresolved supplier facts and exact next step; code delivery separate from owner/engineering acceptance |

Implement in reviewable increments, retaining a working schema-1 path. G01/G02 can be reviewed before schema/UI work, but do not stop the separately authorised complete build at a pure-engine scaffold. Do not activate an unsupported family-to-quantity bridge to manufacture a successful end-to-end result.

## 2. Proposed versioned native contract

Public UI label: **Screen Geometry Study**; TypeScript `ScreenGeometryStudy`; JSON/database fields snake_case and states PascalCase in line with PPO-STD-001. Version numbers below are proposed contract versions, **not database migration numbers**.

Use a discriminated Specialist proposal union: schema 1 unchanged; schema 2 retains existing quantity fields and optional `geometry_study`. A narrow `quantityProposalOf()` adapter creates the exact schema-1 input expected by the retained engine. Never alter the old bundle hash to include geometry. New run schema 2 holds the complete study result/review snapshot. Old runs remain schema 1 and report “No geometry study recorded”.

The geometry contract has its own `schema_version: 1` independent of its containing proposal. It is an owned subordinate value, not a second aggregate. Initially one physical study per configuration, with explicit selected Facility or explicitly recorded unknown source. Existing source binding remains mandatory.

| Contract section | Proposed exact content | Ownership/validation |
|---|---|---|
| Identity/context | Configuration UUID; draft/run UUID from envelope; workspace/company, estimating workspace/option/revision IDs; site, selected Facility, structured system/area IDs as applicable | Server-derived/validated; no client project/customer ID authority; enforce existing coverage relationships |
| Definition | `definition_id`, `definition_version`, `definition_hash`, `implementation_hash`, `precision_policy_id/hash`, `renderer_version/hash`, source r10 hash, snapshot of constants/formula identifiers | Server-owned immutable registry/code manifest; reject caller substitution. Retain previous versions for history |
| Source bindings | Per field: source kind, Facility ID/version, field key/raw value/unit, observation basis/date, immutable note source ID/version and recorded actor/time, captured observation hash; Discovery binding exact IDs/hashes; adoption choice/value/reason/actor/time | Exact offered observation and accepted value both retained. Authority rechecked at adoption; no invented Facility historical API |
| Family inputs | Discriminated Venlo/Quonset/Gothic/Sawtooth field sets covering F01–F25; `active_family`; optional bounded saved family drafts | Numeric raw strings; enum/preset membership explicit. Study family is a user decision, not inferred from broad Facility type |
| Screen inputs | Drive concept; total transverse opening allowance in mm; longitudinal installation overlength and general roll allowance in percent; product text/evidence ref; fabric direction; nullable usable roll width mm; explicit one-layer/one-panel-across basis | Keep percent-to-fraction conversion once. Proposed added `screen_plane_height_m` for non-Quonset families starts Unknown; never silently copy schematic offsets |
| Normalised inputs | Parsed Missing/Invalid/Value states, canonical decimal/unit, active applicability and recorded assumptions | Server produces; raw text survives incomplete drafts; no NaN/Infinity or blank→zero |
| Findings | Stable finding code, field/panel/rule ID, severity, blocking scope (Geometry/Schedule/Mapping/Receiving), evidence class, message/action, current basis hash | Server computes; acknowledgement is a separate record, never a client boolean that approves engineering |
| Geometry results | Exact dimensions/grid/areas where rational; approximate rise/chord/arc/volume with method and computational error/tolerance metadata; explicit unavailable values and reasons | Never wrap approximate numbers in ExactValue to imply proof. Each result names dependencies, unit, method and version |
| Panel/section schedule | Compact width/length partitions in m; panel IDs unique within study snapshot; opening mm, longitudinal section m, study length mm, multiplicities, residual flags; aggregates net/waste/standard-blank lm | Stable coordinate identity bound to grid hash; no matching across changed topology solely by W01-L01 or row number |
| Drawing model | Schema; canonical sheet dimensions, axes and transforms; typed primitives/instanced grid; labels and text equivalents; family convention; layout/style version; title-block snapshot; legend/findings | No DOM or arbitrary HTML/SVG. Model independent of viewport. Pointer selection uses the very same transform |
| Calculation/hash | `geometry_input_hash`, `geometry_result_hash`, `mapping_profile_id/hash`, `mapping_decisions_hash`; quantity calculation hash stays separate; `review_basis_hash`; full run evidence hash | Domain-tag canonical payloads; deterministic ordering, units/schema/definitions in scope; actors/timestamps only in evidence identity |
| Assumptions/evidence | Typed `RecordedFact`, `UserAssumption`, `DerivedGeometry`, `SupplierConfirmedRule`, `EngineeringReviewedDecision`, `CommercialQuantity`; statement, source/version, owner, relevant fields and review trigger | Last three cannot be inferred from defaults, successful geometry, user-entered roll width or a note alone |
| Review state | Geometry NotCalculated/Invalid/Current/Stale; technical review NeedsReview/RecordedWithFindings; release always Preliminary/NotIssued in this increment; mapping None/Proposed/Accepted/Stale/Blocked | Existing quantity/manual, price and receiving state dimensions remain separate |
| Historical reproduction | Source commit/manifests, raw/normalised inputs, complete results/schedules, retained drawing model, basis/review decisions, predecessor run ID, actor/time | Render original saved results/model with retained renderer; never recalculate old run using current defaults/source/catalogue |

### Bounds and defaults

Proposed calculation bounds start with r10's declared UI envelope as **technical study bounds**, not manufacturer limits: Venlo width 3.2–120 m, length 6–200 m, gutter 2–10 m, pitch 18–30 degrees; Quonset width 3–20 m, length 6–200 m, spring 0–4 m, ridge 2–10 m, screen elevation 0.5–8 m; Gothic 1–12 spans, length 6–200 m, gutter 2–10 m, equivalent angle 20–35 degrees; Sawtooth 1–12 spans, length 6–200 m, eave 2–8 m, pitch 5–30 degrees, vent 0.2–3 m. Exact presets are listed in the mapping CSV; do not round 4.27, 1.22, 1.83 or 3.66 to a convenient native bay value.

Opening allowance 0–500 mm; installation overlength 0–3%; general roll allowance 0–15%; roll width nullable or 100–10,000 mm. Allow finer valid source measurements up to 0.001 m/0.001 mm and decimal angles/percentages up to six places, subject to the precision policy. This is a proposed deliberate refinement of r10's UI step restrictions, not evidence of accepted tolerance. Grid partitions operate at integer millimetres; reject sub-mm grid extents or require explicit user-reviewed rounding in a later policy. Do not silently round adopted Facility observations.

Use raw numeric strings ≤300 characters and bound product/title/notes/reasons using existing native validators. Initially retain at most four family drafts, 1,900 panels total (largest r10 UI case), 164 longitudinal sections and 38 width modules; check counts before allocating. Bound schedule groups and drawing primitives independently, use compact instancing and deterministic label thinning while retaining numeric totals. If a future input exceeds these bounds, show unsupported study rather than truncating counts. G22 must prove valid max snapshots fit the existing request and run budgets with long valid metadata; limits may only change through a reviewed scoped contract.

Schema-1 hidden-field validation remains unchanged. Schema-2 saved inactive family drafts are structurally and numerically validated; incomplete data can save a draft but must be disclosed/reachable before a reviewed run. Do not carry incomplete disabled inputs invisibly into a supposedly reproducible run. Family defaults are labelled UserAssumption/ReferencePreset until confirmed and are never silently introduced into old records.

## 3. Numerical precision policy proposal

Call the initial policy `ScreenGeometryPrecision` version 1; final immutable hash must cover these rules and any implementation correction.

| Concern | Proposed policy | Required proof |
|---|---|---|
| Input/exact arithmetic | Decimal text parsing using existing rational utility; integer counts; m↔mm scale 1000 exactly; percentages divided by 100 once. Grid boundaries integer mm; exact sums/products for opening, study length and roll allowances when inputs are rational | Boundary/parser/unit tests and hand-derived partition conservation |
| Trig/curves | Isolated IEEE-754 Number functions for tan/cos/acos/sqrt/hypot with finite/domain checks. Degrees→radians explicitly. Return Approximate result, method and algorithm version | Compare against independently computed high-precision/reference analytical values; no source-only golden oracle |
| Geometry domain | Quonset 0 < rise ≤ width/2; screen 0 < elevation < ridge; Sawtooth 0 < vent < rise. Near approximate thresholds produce Indeterminate/NeedsReview within computational error, never an epsilon-expanded safe physical range | Both sides and equality cases; no clamp except documented floating-domain guard after validated physical inputs |
| Gothic arc | R10 uses 96 straight segments per half. Proposed native method: deterministic subdivision doubling from 96 to at most 1,536 per half until successive full-arc difference ≤0.000001 m; if not converged, unavailable with finding. Keep crown 0.35 as explicit study convention | Analytic/numerical independent integration and convergence fixtures across envelope. Do not claim a supplier tube length |
| Regression tolerance | Approximate reference comparisons: max(1e-6 m, 1e-10 × abs(expected)) for lengths; max(1e-5 m²/m³, 1e-10 × abs(expected)) for areas/volumes. These are software targets to validate against independent oracle, not construction tolerances or a guaranteed physical error bound | Recorded platform/runtime results; if target cannot be established, block affected result and revise the policy |
| Display | Ordinary dimension m: 3 decimals; opening/study length mm: 1 decimal; areas/volumes: 1 decimal; linear-metre totals: 3 decimals; angle: up to 3; integer counts exact. Half-up display rounding only; full retained calculation values remain | Display never feeds downstream formula/hash. CSV declares precision/method and raw canonical values where review needs them |
| Roll fit | Exact linear opening comparison when possible. For approximate chord, use computed uncertainty interval: Fits only if upper bound ≤ usable width; DoesNotFit if lower bound > width; otherwise Indeterminate. No assumed hem/selvedge/attachment allowance | Equality and ± boundary fixtures; unknown width stays NotChecked; suitability remains unresolved |
| Evidence/hash | Approximate canonical decimal representation at declared precision, method and uncertainty plus retained raw normalized inputs; version serializer. Save the server's exact result/model snapshot; don't demand browser bitwise transcendental parity | Same snapshot hashes across reload; consistent supported runtime; algorithm successor does not rehash old evidence |

Numerical equivalence to r10 is useful regression evidence only for its declared convention. Retain explicit deviations such as stricter invalid-result suppression, corrected hit transforms and improved arc convergence. Independent engineering review remains required for physical profiles and tolerances.

## 4. Mapping and source-adoption contracts

Every candidate binding follows the [register](es08-geometry-mapping.md). `Direct` describes shared physical meaning/unit, not permission to overwrite. A mapping is an explicit native proposal, never a source import side effect.

Proposed dimension profile preconditions: same selected physical envelope and axes; confirmed family/module interpretation; full uniform grid; no residual; positive integer span/bay counts; no wall-span conflation; exact current cloth lookup for longitudinal bay; explicit treatment of existing `odd`; supplier/definition applicability status shown. Compare old native inputs, geometry-derived candidates and source attribution; accept/reject per field and save decision/hash. Reject partial application that would leave width or length inconsistent. New semantics, residual layouts, fabric orientation, roll/nesting/allowances or mechanisms require a new reviewed quantity definition rather than forcing the old fields.

Initial profile is None. Native inputs can independently seed a **proposed** geometry draft when physical meaning is clear, with no implied reverse mapping or new approval. There is no safe automatic family choice from native `roof`, and no native default span width should become an observed Facility measurement. Family selection/unknowns are explicit.

Facility adoption route can be a narrow specialist `geometry-source-preview` and `geometry-source-adopt` if existing source-preview/rebase cannot express field-level Facility choices. Prefer extending existing specialist commands/envelopes with schema dispatch first; final route choice must be recorded at G01. Keep Discovery rebase separate from Facility observation refresh. No writes to Facilities or Discovery occur from geometry adoption.

Source preview returns offered field values, source versions, relationship/coverage hash and proposal signature. Apply rechecks source visibility, scope and version inside the transaction; a changed source returns a scoped conflict with no mutation. Existing override offers three choices: retain existing override and original basis, adopt new source with reason, or Unknown. Equal numbers with a new source version still require explicit provenance acceptance. Do not derive length/width from separately recorded footprint or maximum height into gutter/screen level.

## 5. Persistence, commands and recovery

### Existing contracts to preserve

The configuration route family is `/estimating/configurations/[id]/[view]`. API commands already exist for draft, preview, run, resolved, archive, copy, source-preview/rebase, receiving-preview/apply, finding, history/export and resolve-operation. Commands use `SpecialistConfiguration` identity; no new business identity/capability is proposed.

Reuse current operation-lock → workspace-lock → authority/replay ordering, accepted-source authorization, expected configuration/workspace/target versions, exact proposal signature and terminal closure semantics. A new study command must join the same atomic aggregate transaction; do not save geometry and quantity run separately then repair pointers later.

| Action | Required contract |
|---|---|
| Preview geometry | Read/edit authority as current native preview requires; strict bounded proposal; no writes/receipt; server-derived calculation/errors and signature bound to raw proposal/source/definition/mapping |
| Save incomplete draft | Bounded raw fields and authorised references; new immutable draft, aggregate version advance, audit/receipt/outbox through existing operation helper. Invalid numerics allowed as draft, not trusted results |
| Save reviewed run | Recompute/verify exact server basis; technically valid study, explicit handling of supplier findings, current manual review, resolved configuration decisions; atomic draft/run/resolved set + review evidence + receipt. Invalid geometry blocks run; unknown supplier readiness may remain |
| Source adopt/refresh | Signed preview with exact source version; scoped transactional recheck; new draft/binding, fresh geometry/manual/mapping review; old run and estimate untouched |
| Historical read/export | Authorise configuration AND original source context; load exact run snapshot and retained model; never substitute current study or latest Facility values; private/no-store |
| Copy/archive | Copy raw study with explicit destination source remapping and reviews reset; no adopted estimate links. Archive retains history, refuses new content and still allows authorised original receipt recovery |
| Receiving preview/apply | Saved exact run/resolved set/policy/basis; mapping and study findings disclosed; explicit synthetic eligibility; B/C/N decisions, unit/price/line capacity; atomic version+lineage+adoption+receipt |
| Unknown outcome | Persist only minimal actor/workspace/configuration/operation pointer. Recover original accepted result; explicit terminal close before new operation if unaccepted. No local geometry/price copy as recovery authority |

Use `estimating.read/edit`, existing owner/whole-group Draft checks and related-record visibility. A permitted configuration does not imply permission to read every Facility/source. Redact/clear sensitive client state after scope change, permission loss or expired identity, including already rendered SVG and downloadable text. No broad permissions edit is justified by this audit.

### Schema implications, without allocating a migration

At the audit baseline, migrations through 0041 define the relevant schema. Migration 0040 checks draft proposal `schema_version='1'`; request/draft size is 262,144 bytes, run and resolved snapshots 2,097,152 bytes. JSON schema checks and relationship triggers must be inspected again on refreshed main and its actual synthetic database. Do not assume changing TypeScript alone permits new persisted shapes.

Future additive change: allow explicitly validated proposal schemas 1 and 2; check geometry schema/required version identities, selected Facility/source ownership and geometry result membership in schema-2 run; preserve all immutable triggers and old schema acceptance. Use existing configuration/draft/run identity and source-binding checks. Do not update old rows or rehash/backfill defaults. The schema-2 optional study and versioned reader must coexist with old pending receipts and history. A missing compatible schema returns geometry-unavailable while preserving usable legacy ES-08.

No new identity should be needed. If refreshed design does alter `ppo.business_identities`, honour `SET CONSTRAINTS ppo.identity_target IMMEDIATE` before ALTER and DEFERRED immediately after; prove upgrade across 0026 with estimates. Inspect current main before selecting the migration number; **0042 belongs to concurrent Priva work, not this plan, and no successor number is reserved here**.

When a migration is actually added, update all current exact consumers: field, finance-upgrade, offline, packs, planner, reports; `atVersion(N)` and both ≥18 lists in leads-projects integration; demo added-migration count. Review `scripts/demo-upgrade.ts` guard purpose before adjusting it. Keep seed versions valid/increasing and no unnecessary user/grant seed. If any grant/capability becomes justified later, follow all current AGENTS access-review generation/labels/counts/allowlists and upgrade snapshots; do not broaden permission scope to avoid a source-authority failure.

## 6. Review, parts, pricing and receiving details

Schema-2 `review_basis_hash` includes noncommercial native inputs, extras, parameters, active geometry/screen/source/mapping basis, definition and precision versions. All fourteen manual allowances retain values but become NeedsReview on a relevant change. Keep original `manualBasis()` and v1 hashes unchanged; a compatibility adapter must not accidentally stamp old basis on a new study. Drawing-only pan/selection changes do not invalidate quantity/manual review.

Parts remain resolved by the existing quantity definition. Family, material, mechanism, dimension or source changes reopen applicability findings; unchanged part IDs do not demonstrate physical suitability. New run B/C/N decisions can keep a reviewed manual quantity, but cannot silently carry a number across incompatible SKU/unit. Existing exclusions, inclusion gates, manual zero/unresolved and no-purchase meanings remain distinct.

Retain recorded rate and effective date. Recalculate money only from explicitly changed accepted quantities/resolved lines and the existing price policy; show price applicability stale where material/unit/scope changes. Do not automatically fetch prices or promote a geometry product reference into a supplier catalogue choice.

The current `SYN-ES08-RECEIVE-01` is an exact fixture manifest, not operational receiving. Geometry must not be ignored by its profile check. Preserve it for schema-1/no-study fixtures; a geometry-bearing synthetic journey needs a separately versioned server-owned successor with exact study/mapping/review conditions. No client `approved`/`eligible` flag and no role bypass. Unknown/unsupported geometry mappings cannot become commercial lines through a new blanket policy.

Run save does not modify estimate. Receiving preview compares exact immutable source against the current target, includes manual edits/removals, and explicitly accepts/rejects. Changed study provenance with equal money is not the same source adoption. Old quotations retain their estimate version; new geometry cannot rewrite an issued or draft old quotation source by changing configuration pointers.

## 7. Drawing and output implementation

Produce typed front elevation, side elevation, plan and selected panel/section detail; grouped panel schedule; title block, legend, assumptions, findings and preliminary status. Non-Quonset screen placement needs an explicit height or a clearly symbolic level. Do not preserve r10's hard-coded offsets as design inputs. Structural members/vents/mechanisms remain schematic and labelled; no construction member sizes or motor placements inferred.

Use one coordinate/transform object for drawing, hit testing and selection. Keep model axes (transverse width and longitudinal length) explicit even where plan displays length left-to-right. Boundary clicks choose a documented deterministic cell; residual cells remain selectable; selection stays correct at all zooms and on scroll/resize. Numeric selectors and keyboard action equivalents always work. Reconcile selected IDs against new grid hash; mark old selection unavailable when topology changes rather than reusing an unrelated ID.

Store compact canonical drawing data and exact results in the run; use fixed sheet size/layout and retained renderer edition for export. Avoid storing thousands of redundant primitives when grid instances and grouped schedules suffice. Store output manifest with run/evidence hash, renderer/style hash, sheet spec, units, generated artifact hash when produced and content audience. A future issued document needs its own document workflow; the proposed print/export is not issued engineering documentation.

CSV must declare opening/study basis and linear versus area units, preserve unavailable values, neutralise formula-leading untrusted cells, and omit unapproved stock/procurement conclusions. Unknown or failed roll fit can still have a **preliminary geometric panel schedule**, but any conditional material total must say Assumption/Unavailable as applicable. Invalid geometry blocks a normal schedule export; an optional diagnostic-only export must be explicitly labelled and contain no misleading valid quantities.

## 8. Verification and acceptance architecture

All cases here are **planned, not passed**. Existing ES08-T01–T80 remain; these add geometry-specific obligations. Use public synthetic examples, current pinned runtime and isolated `ppo_synthetic_test` only. Do not reuse a concurrent developer database/server or expose private source exports.

| ID | Layer / case | Expected result and evidence |
|---|---|---|
| ES08-G00 | Baseline/parallel boundary | Fresh main SHA, #277 disposition/head, intervening diffs, clean isolated branch and schema inventory recorded before application edits |
| ES08-G01 | Pure family geometry | Venlo two peaks/module; Quonset circular segment/chord; Gothic profile/area/arc convergence; Sawtooth rise/slope/vent/volume. Independently authored intermediates and approximate tolerance evidence |
| ES08-G02 | Grid/panels | Sum of section lengths/widths equals entered extent exactly; default Venlo 104 normal + 8 residual =112; width+length residual yields four groups; whole mode blocks residual; no odd-bay conversion |
| ES08-G03 | Drawing coordinates | Known panel centres/corners select intended IDs in fit/zoom/pan/scroll/resize; include r10 W08-L14 negative-control case. Same transform drives all three views and keyboard numeric selection |
| ES08-G04 | Domains/precision | Zero/negative pitch/spacing, missing input, boundary counts, rise=0, semicircle, rise>half-width, screen at ridge, vent at rise, finite checks and sub-mm partitions; no NaN/Infinity/loop |
| ES08-G05 | Material arithmetic | Overlength affects longitudinal panel length; waste affects totals only; no shrink/overhang/LS-wire substitution. Test exact percentages and round/display boundaries |
| ES08-G06 | Roll/engineering state | Unknown, fits, does not fit and indeterminate near approximate chord; one-panel-across assumption; failed fit cannot claim procurement/fabrication readiness; release always NotIssued |
| ES08-G07 | Mapping/reconciliation | Direct/Derived preconditions, axes, uniform grid, lookup and supplier status checked. Residual, ambiguous spans, fixed drive, 1.5/3.66/4.27 misapplication blocked; reject partial inconsistent tuple |
| ES08-G08 | Quantity regression | All 143 quantities/exact numerator-denominator evidence and legacy calculation hashes identical without activated mapping, across existing 28 scenarios plus all four geometry attachments. Preserve three existing documented decimal corrections; no new differences silently accepted |
| ES08-G09 | Manual/parts/drive | All fourteen manual values preserved but review stale after semantic study change; drawing pan alone does not stale. Preserve C99/C102 distinctions, REV/AUD/WAS findings and no motor capacity inference |
| ES08-G10 | Facility adoption | Adopt/Override/Unknown retain source ID/version/value/unit/basis/date and actor. Reported approximate source never labelled measured; maximum height not gutter; parent/child and bay/tunnel counts not auto-combined |
| ES08-G11 | Discovery/source drift | Reject Text/Zones geometry inheritance; authorised selected Facility coverage only; source update preview without silent overwrite; equal-value new provenance and access-loss redaction |
| ES08-G12 | Persistence/history | Draft/run schema 1 unchanged; schema 2 reload/restart; current Facility/definition/renderer edit does not change old results/drawings/export. Old hashes verify without reserialization |
| ES08-G13 | Server permissions | Cross-workspace/company/site/alternative/source, read-only and owner/locked-group restrictions; current and original accepted references checked on detail/history/export/replay |
| ES08-G14 | API validation | Wrong types/enums/keys/schema; duplicate IDs; overly deep/large body; fake results/actor/review/hash; imported zero spacing; active/hidden incomplete fields; 256 KiB byte boundary independently at HTTP/service |
| ES08-G15 | Stale/concurrent saves | Two writers, source drift and definition change; exact signature/version failures leave no partial draft/run/resolved set. Late browser preview does not replace current geometry |
| ES08-G16 | Atomic operation/recovery | Failure before/after each transactional write, lost response after commit, retry same ID/payload, changed-payload refusal and accepted-original versus closure race; one durable outcome |
| ES08-G17 | Reload/access withdrawal | Minimal pending pointer only; no geometry/price localStorage; exact accepted operation after reload/archive; withdrawn permission clears model, SVG and export data |
| ES08-G18 | Estimate/quotation | Explicit receiving accept/reject/cancel; old contribution remains old run until adoption; original quotation estimate ID/hash unchanged after two geometry runs and a later receiving operation |
| ES08-G19 | Receiving/manual edits | B/C/N keep/generated/remove/omit/restore/incompatible tuple; 100/101 line boundary, exact money/units, unchanged totals with changed provenance creates correct successor; geometry cannot bypass old fixture policy |
| ES08-G20 | Exports | Canonical SVG/CSV/print across viewports; title block references exact run; script/link/formula-injection strings safe; no blank/invalid values become zeros; findings and status visible; current read authority/private-no-store |
| ES08-G21 | Compiled browser/accessibility | Full seven-view workflow at 320/390/960/1024/1280/1440/1920 widths, 200% zoom, keyboard/focus/Escape/return, long names, error summary, screen-reader text equivalents; inspect real captures, no baseline blessing implied |
| ES08-G22 | Performance/size | At least maximum 1,900-panel Venlo, 164-section Quonset and full metadata; bound allocation and snapshot bytes, preserve complete numeric totals with disclosed visual thinning. Record latency/memory, abort obsolete calculations; no invented production SLA |
| ES08-G23 | Upgrade/shared regression | Upgrade from legacy ES-08 through current main/new migration, estimates across 0026, seeds/grants/receipts retained; all exact registry consumers. ES-02, Facilities and #277 fertigation handover/receipt/navigation remain intact |
| ES08-G24 | Independent evidence/review | Definition/input/output/renderer hashes pinned; source r10 differential results separated from independent expected values; unresolved supplier questions remain visible and owned; no engineering/commercial approval from a check pass |

### Required independently authored examples

- Venlo W=32, L=60, module=4, spacing=4.5: 8 widths; 13×4.5+1.5 longitudinal sections; 112 panels; opening 3.95 m at 50 mm allowance. With 1% overlength, net=8×60×1.01=484.8 lm; 5% allowance gives 509.04 lm; standard-blank=112×4.5×1.01×1.05=534.492 lm. These are study lengths, not CE-LINE-223 cloth m².
- Venlo W=33 at the same basis: 9 width sections (last 1 m); 126 panels; 104 full/full, 8 full/residual-length, 13 residual-width/full, one corner residual. The residual module is a geometry convention requiring structural confirmation.
- Quonset W=8, spring=2, ridge=6 gives a semicircle radius 4 m; at screen height 2 m chord=8 m, at 4 m chord=4√3 m. Cross-section=16+8π m²; compare volume at a stated length. At ridge the screen opening is invalid, not a zero-width valid panel.
- Gothic span=8, rise computed from a declared angle: analytical roof profile area = span×rise×(3−0.35)/6; compare independently integrated arc and convergence. Do not match only r10's 96-segment number.
- Sawtooth span=8, pitch chosen in the supported envelope: rise=8 tan(pitch), roof length=8/cos(pitch); gross vent ratio=100×vent/span. Equality vent=rise is invalid. Gross ratio is not effective ventilation.
- Native no-mapping control: preserve existing Appendix E/28-scenario golden expectations, including floor(area), exact cloth-width lookup, shrink divisor and both additional-screen rounding orders. Attaching any family cannot alter them.

### Primary end-to-end journey

1. Open a saved authorised Screen Systems configuration; identify its exact Discovery revision, old run and estimate/quotation links.
2. Select an authorised in-scope Facility and preview its observation. Adopt/override/mark unknown per field, confirm extent/axes and choose one of the four supported **study** families.
3. Enter complete geometry and screen/material basis; disclose assumptions. Generate front/side/plan, choose a panel numerically and by drawing, inspect the exact formula/unit basis and preliminary schedule.
4. Keep mapping None or explicitly review a demonstrated synthetic mapping profile. Review all required manual quantities and findings; save an immutable run.
5. Change one relevant geometry or material input. Confirm calculation/review/mapping/part/price-applicability states become stale as specified, without changing old run, rates or estimate.
6. Compare exact old/new studies and configuration lines; review and save a second run. Reopen the first: geometry, quantities, source, drawings and evidence hashes remain unchanged after source edits/restart.
7. Preview the new estimate contribution under its server-owned synthetic policy; reject once and show no mutation; then explicitly accept with required B/C/N decisions. Demonstrate original-operation recovery.
8. Prove existing quotation still references its original estimate version and all unrelated target lines/fertigation handovers survive. Capture bounded desktop/phone/keyboard evidence and unresolved supplier status.

## 9. Verification commands and handover limits

Re-read package scripts/runtime pins after G00. Expected starting commands are `npm run lint`, `npm run typecheck`, appropriate `node --import tsx --test` specialist/geometry unit files, `npm run build`, focused database suites on the isolated test database, existing specialist HTTP proof against a task-owned server and `npx playwright test --config=playwright.es08.config.ts`. Expand the existing configuration deliberately to include new geometry journeys; keep source/design comparisons and compiled proof in a required existing CI lane. Preserve the separate fertigation compiled workflow and current service prerequisites.

Run `python scripts/check_foundation.py` and `python scripts/check_naming.py` for affected documentation; `python3` is equivalent where installed. Run PP-01 prototype assurance only if that package changes. Do not call application suites passed because this audit's reference probe passed. Confirm environment-only report renderer or hosted `demo_testers` failures against unmodified main before attributing them to geometry.

The implementation handover must give exact commit/worktree, migration chosen from refreshed main, sources/definition hashes, files changed, checks actually executed, deviations from r10 and their evidence, residual supplier/engineering questions and the new bounded next step. No deployment, production migration, external write, customer communication or procurement release is implied.
