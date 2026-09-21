---
document_id: PPO-ES08-NATIVE-BUILD-PLAN
revision: r02
supersedes_revision: r01
date: 2026-09-21
owner: Dean Fiedler
product: Powerplants One
scope_id: ES-08
initial_family: Screen Systems
status: Implementation specification; native verification and operational acceptance pending
repository: https://github.com/deanrfiedler-gif/powerplants-one
inspected_main: 8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b
companion_prompt: PPO-ES-08-Specialist-Configuration-Workbench-VS-Code-Implementation-Prompt-r02.md
---

# Powerplants One — Specialist configuration workbench

**Native build plan · r02 · Initial family: Screen Systems**

This plan defines the native build, its retained source behavior, data and receiving contracts, delivery packages and acceptance evidence. It replaces neither the issued r03 design nor the engineering source pack. Attach the companion VS Code implementation prompt to begin implementation; it includes the essential execution contract and full acceptance matrix.

## Revision r02 — implementation audit

This revision was checked against both current r01 documents and the same GitHub main commit on 21 September 2026. Main had not changed. The additional audit inspected the real shared HTTP wrapper, receipt dispatcher, operation transaction, estimate authority, discovery authority and client command/recovery hooks. It found integration details that needed a precise contract before building.

| Audit finding | Required correction in r02 | Verification |
| --- | --- | --- |
| A proposed 256 KiB command cannot pass the existing 64 KiB shared command wrapper unchanged. | Add a narrowly scoped specialist HTTP contract; keep all existing route limits unchanged. Measure transmitted bytes as well as canonical payload. | ES08-T57 |
| New object types do not automatically enter the shared receipt dispatcher. Estimate receipt authority alone does not check configuration sources. | Register specialist identities/receipt dispatch and exact accepted-snapshot authorization for replay and GET recovery. | ES08-T58–T60 |
| Save draft allowed incomplete values without specifying which raw values could be persisted. | Separate bounded raw proposals, parsed values, required-field applicability and calculation validity. | ES08-T61–T62 |
| A user-deleted generated line could be mistaken for a new generated addition. | Preserve absence/decision history and require explicit reintroduction instead of automatically restoring it. | ES08-T63 |
| Receiving on a later run with unchanged money could discard the new evidence relationship. | Define no-change using complete adoption evidence, not totals; bind each accepted resolved state immutably. | ES08-T64–T65 |
| Lineage on ordinary saves was not enough to define later discovery adoption or tamper detection. | Cover every estimate-version writer, retain original contribution basis, and bind immutable lineage to the exact estimate hash. | ES08-T66–T68 |
| Discovery rebind was mentioned but had no safe command/compare behavior. | Add explicit same-alternative source rebase and separate cross-alternative copy semantics. | ES08-T69 |
| A synthetic-only bypass was insufficiently concrete. | Use a server-owned eligibility manifest for exact fixtures, bundle, mappings and permitted findings; no editable override switch. | ES08-T70 |
| Status labels and action availability could be implemented inconsistently. | Add independent state dimensions, blocker codes and an action eligibility table. | ES08-T71 |
| Recovery across reload and quote/evidence consequences needed explicit limits. | Retain only non-sensitive pending intent pointers; recover exact accepted outcomes; keep historical quote versions immutable. | ES08-T72–T75 |
| Acceptance tests had no compact independent numeric example pack. | Add hand-derived synthetic geometry, cloth-rounding, money and reconciliation examples, plus date-stable fixtures. | ES08-T76–T80 |

The requirements below incorporate these corrections; this is not an optional supplement to r01. This remains a specification, not proof that the native implementation exists. It is ready to guide development; engineering approval and implementation acceptance still require their own evidence.

### Navigation through this document

Read sections 1–2 for scope, 3–5 for product/calculation behavior, 6–9 for data and command contracts, and 10–12 for delivery/acceptance. Appendices A–B contain the retained field/parameter inventories; C contains pinned sources; D contains executable contract shapes and field limits; E contains independent worked examples. The VS Code prompt includes the complete contract, so the companion plan is useful for review but is not required to make the prompt actionable.

## 1. Purpose and inspected starting point

Build **ES-08 — Specialist configuration workbench** as a native Powerplants One estimating module, initially for **Screen Systems**. It must turn explicit technical inputs into traceable quantity proposals, preserve manual decisions, retain immutable calculation evidence, compare reruns safely, and transfer reviewed results into an exact saved estimate through an explicit receiving transaction.

The existing r03 design is substantial source work, not a native implementation. Preserve its useful interactions and recovered evidence while replacing its fixed context, local storage, fixture permissions and simulated save failures with the application's real records, authorization, persistence and recovery contracts.

This document is an implementation specification. Proposed contracts below are build decisions, not claims that those interfaces already exist or that recovered engineering rules have been approved. The authorized initial delivery remains within the repository's synthetic prototype. Engineering acceptance, current catalogue validation and operational release are separate outcomes.

### 1.1 Evidence inspected on 21 September 2026

GitHub main was inspected at `8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b`, including the shared presentation changes merged through PR #271. Reconcile the actual checkout before coding; do not reset newer work to this commit.

| Source fact | Build consequence |
| --- | --- |
| The current page register identifies ES-08 as the Specialist configuration workbench, initially Screen Systems. | Keep ES-08 / EST-06 / E5. An older screen specification uses ES-08 for quotation authoring; record that historical numbering conflict without repurposing this module. |
| r03 HTML, model and catalogue exist under the specialist design/reference folders. No native specialist route/service was found in the inspected implementation and navigation sources. | Port the bounded behavior into the app; do not deliver another standalone HTML or iframe. Recheck for concurrent implementation before adding files. |
| The r02 report is the main design description; r03 has a changelog, not a separate report. | Read the r02 report together with the r03 changelog and actual model. Do not invent a Report-r03 reference. |
| r03 contains 64 primary controls, five additional-screen slots with four numeric values each, 143 source positions, 14 manual quantity positions and six inclusion gates. | Preserve the complete supported field/position registry. Do not expose all 478 historical inventory entries as questions. |
| The provisional catalogue contains 101 part identities; 143 position rules reach 83 of them. | Catalogue existence and provisional mapping do not establish operational SKU approval. |
| There are 12 parameters: eight bound to consumers and four recorded only. | Keep applicability explicit; do not wire dormant parameters into guessed formulas. |
| The coverage record contains 142 compared fields, 21 untested options and 12 WAS discrepancies. | Preserve coverage and uncertainty. Commercial source values remain withheld. |
| Native estimating already has immutable estimate versions, explicit discovery-cost adoption and exact decimal costing. | Integrate with those contracts. Configuration preview and saved estimate totals must remain separate. |
| Native cost input and quotation choices currently cap at 100 lines. Quantity is positive, at most 100,000, with three decimals; amounts use two decimals. | Retain all 143 workbench positions, but validate the complete receiving result against existing limits. Never silently truncate, aggregate unlike lines or round away a mismatch. |
| Current shell includes a reusable secondary menu, icon-only toggle, internal collapse boundary, 24 px collapsed strip and globally centred search-plus-add group. | Reuse it. Do not rebuild the old r20 standalone shell or duplicate fixes already merged. |

The historical r03 evidence reports 41 model groups and 35 browser groups on bundled Chromium 141, plus 28 default-parameter parity scenarios. These are prior design checks, not results executed for this document or proof of native implementation. Native application tests, current browser evidence and owner acceptance must be produced during the build. The private workbooks were not independently re-audited for this plan; source findings are grounded in the repository's sanitized evidence and reports.

### 1.2 Source precedence

1. Current user decisions and the applicable repository instructions.
2. Current native authority, persistence, identity, money and receiving contracts; this plan's explicit additive changes.
3. r22 theme and current accepted native shell for visual construction.
4. r03 workbench behavior/model/catalogue plus r03 changelog, interpreted with the r02 report and recorded owner decisions.
5. Sanitized source evidence and historical examples, within their stated coverage.

A spreadsheet cache match is evidence of recovery, not engineering approval. A prototype control is not permission policy. When sources conflict, retain both identities and the decision; do not silently repair or rewrite issued evidence.


## 2. Scope, boundaries and completion lanes

### 2.1 Required initial delivery

Deliver the six workbench views: **Configure; Parts & working; Pricing; Compare & save; Definition review; Run history**. Include native scope selection, durable server drafts, typed inputs, deterministic server calculation, diagrams, complete position evidence, manual quantity review, line decisions, parameter snapshots, immutable runs, safe rerun, scoped exports and a working synthetic estimate-receiving path.

The workbench is a specialist calculation tool inside Estimating. It is not another commercial alternative, installed equipment record, engineering release, purchase order or quotation issue. Several configurations may contribute to one alternative; each has its own stable identity and source-line ownership.

| Delivery lane | What must work | What it does not establish |
| --- | --- | --- |
| Native review | Save/edit scoped drafts; calculate recovered rules; inspect warnings; review allowances; save immutable review runs; compare; export permitted evidence. | Engineering approval, complete prices or permission to order/install. |
| Synthetic receiving | A dedicated test fixture policy allows an explicitly synthetic, reviewed run to create a real saved version in a synthetic estimate, with lineage and atomic recovery. | Permission to use the recovered definition for operational projects. |
| Operational eligibility | Future receiving uses an exact approved definition/parameter/mapping/unit/pricing-policy combination under recorded authority. | No current approval is inferred from this plan, fixture or successful tests. |

Implement both of the first two lanes. The recovered definition may remain in Review required while those lanes work. Do not use a permanent disabled “Send” button as the integration deliverable. Equally, do not add a client flag or checkbox that makes an unapproved definition operationally eligible. Synthetic receiving eligibility is a server-owned policy restricted to explicit synthetic contexts and fixtures; the caller cannot grant it.

### 2.2 Explicit exclusions

Do not build irrigation, climate, lighting or nursery-machinery calculators in this increment. Their future definitions require separate evidence and acceptance. Do not infer missing Screen Systems engineering, unsupported ABRI/kit variants, motor SKUs, installation productivity, duty, commission or live supplier prices. Do not implement arbitrary Excel evaluation, macro execution, automatic workbook upload/import, MYOB posting, SharePoint upload, purchasing, customer communications or native CAD authoring. Offline estimating writes remain deferred; do not reuse the field offline queue.

Keep the family-selection concept: “Screen Systems” opens a supported calculator. Other families may show an honest unavailable state only where the existing app already exposes them. Do not add decorative cards that imply runnable engines or count catalogue entries as configured systems.

### 2.3 Independent delivery and dependencies

The ES-02 refinement plan proposes structured system IDs; that document does not make them deployed schema. Use the actual saved estimating workspace, alternative, discovery revision and permitted Facility context that exists. When a structured ES-02 system ID exists, validate and bind it. Until then use an explicit `scope_binding_kind` for the existing facility/scope association; never manufacture a system UUID or place an arbitrary ID in a work-tag field.

Native review can start from a saved incomplete discovery revision, with its incompleteness visible. Estimate adoption must meet the current receiving requirements for a selected Active alternative and Complete saved scope. Legacy E1 estimates retain their existing contract; initial receiving targets discovery-bound E2 estimates. Provide the existing path to a properly bound estimate rather than rebinding a legacy record silently.


## 3. Native information architecture and visual contract

### 3.1 Navigation and record context

Recommended route family, subject to current route conventions: `/estimating/configurations` for the scoped register, `/estimating/configurations/new` for creation, and `/estimating/configurations/[configurationId]/[view]` for the six views. Use stable explicit view segments; redirect the bare detail URL to Configure. Unknown IDs or segments must not silently display an unrelated configuration. Authorize the record before resolving labels.

Entry points: the Estimating secondary menu; a compatible system/family action in discovery; and an existing estimate's configuration contributions. All preserve a safe return context. Launching from discovery preselects the exact saved source revision and area; an unsaved proposal must be saved through its own flow first. Opening a configuration does not select an alternative or adopt a newer discovery basis.

Use the six workbench views in the expanded secondary menu, under a small Specialist configuration heading, with Back to estimating and context-aware return links. Do not duplicate them as six horizontal tabs or add a second permanent step sidebar. Configure's form sections are local anchors/accordions, not another module navigation rail. This is an explicit native-shell refinement of the standalone tab presentation.

Show a compact context strip: configuration name/ID; Screen Systems; customer and Site/Facility; alternative; exact discovery source revision; current draft status; last saved run; and synthetic marker. Separate the source revision from the configuration draft version and run sequence. Use short readable labels, with full IDs available in details/copy controls. Do not relabel all three as “r03.”

### 3.2 Shell and surface rules

Reuse the real Powerplants logo, loaded normal-width Roboto and current native shell components. Preserve the narrow navy rail and existing destinations; global More remains in its established position. Use the current header slot for the icon-only menu toggle and breadcrumb. The search-plus-add group stays centred across the whole app width, including the rail; the module must not reposition it.

The docked secondary menu starts around 240 CSS px, has a light grey surface, a white active row without a coloured edge, an internal collapse target and a 24 px collapsed strip. Reuse the current 1200 px docking behavior and modal overlay below that threshold. Remember preferences per the existing user/workspace convention; a narrow-screen overlay must not overwrite the wide-screen preference.

| Role | Theme reference |
| --- | --- |
| Primary text and primary actions | `#242a37` |
| Secondary / muted text | `#596779` / `#667181` |
| Actual links / focus | `#355b80` / `#365d8b` |
| Menu / content / hover | `#f5f6f8` / `#ffffff` / `#f0f2f5` |
| Dividers | `#e1e5eb` and `#e9ecf1` |
| Success text / fill | `#416d33` / `#edf5e9` |
| Attention text / fill | `#80530e` / `#fff2d9` |
| Neutral tags | `#526078` / `#edf0f5` |

Use adopted tokens where available. Do not copy the r03 standalone r20 amber/green literals over current theme semantics. Main tables/panels are flat and square; small controls may use approximately 6 px corners and tags 5 px. Use ordinary 13–14 px body text, 12–13 px metadata, 16–18 px sections and 18–20 px identity. Never shrink all text to fit a dense screen. Use one existing outline icon family.

At approximately 1920 × 1200, preserve a generous central form/table. On Configure and Pricing, a contextual right panel around 360–400 px can show results and source state. On Parts and Compare, collapse it by default if needed for columns. The panel is white, flush beneath the header and to the right edge, with a fine left divider and a restrained left-only shadow. Do not use a floating rounded card or let bottom actions extend underneath it.

### 3.3 Required views

| View | Required content and behavior |
| --- | --- |
| Configure | Six input groups; progressive disclosure; five additional-screen slots; units and applicability; live diagnostic summary; plan/cut and cross/bay diagrams; clear preview freshness; explicit Save draft and Review calculation actions. |
| Parts & working | All 143 positions available, with an active-results default filter and visible counts. Columns: PPO part, source position, description, quantity, unit, origin/state and attention. Local search, section/state filters, columns control and working drawer. Zero/excluded/unresolved states remain discoverable. |
| Pricing | Recovered illustrative bridge and receiving-cost proposal clearly separated. Source/rate dates, cost currency, FX direction, missing values, no-purchase and policy provenance. Internal costs remain permission-scoped. No automatic production price refresh. |
| Compare & save | Exact previous run, current resolved lines and proposed new calculation; changed/added/removed/unmatched/manual decisions; unresolved decision count; resolved preview; Save review run. Separate estimate comparison/adoption action for an eligible saved run. |
| Definition review | Definition/source versions, findings, owner/review notes, parameter records, historical coverage, provisional part catalogue and mapping conflicts. Review notes do not confer approval. |
| Run history | Immutable runs, exact source basis, actor/time, predecessor, definition/parameter versions, adoption receipts, read-only inspection, permitted comparison/export and Create draft from run. No in-place edit of past runs. |

Tables meet the usable section edges, with fine dividers and readable single-line identifiers. Use a local horizontal scroll region when necessary, not a squeezed description/reference stack. Keep table headers and selected-row context understandable under filtering; filtered counts are not total source-position counts. A selected hidden row remains identifiable or selection is explicitly cleared.

The working drawer shows the stable rule key, worksheet/cell, recovered expression as escaped text, normalized inputs with units, intermediate values, rounding steps, generated result, reviewed result and source findings. It is not an editable formula interpreter. Describe why a result is unavailable without exposing private workbook data.

### 3.4 Interaction states and accessibility

Implement first-use/empty, loading, unavailable, read-only, invalid input, stale preview, unresolved mapping, source withdrawn, saved, concurrency conflict, pending operation and permission-revoked states. Keep user input after correctable validation failure. Do not present a stale successful total during recalculation without its stale label.

Use labelled controls, field-linked error text, an error summary with focus links, semantic tables, visible focus, keyboard-operable menus/dialogs and focus restoration. Announce validation/result state changes politely; debounce announcements rather than reading every numeric keystroke. Do not rely on colour alone. Provide diagram text equivalents and numeric dimensions.

Validate desktop 1920 × 1200 and 1440 × 900, intermediate 1280 × 800/1024 × 768, phone 390 × 844 and 320 px width, and 200% zoom. These are verification targets, not a request for bespoke layouts at every size. Under narrow widths, stack controls and move summary below the form; tables may use an accessible local scroll region or equivalent labelled records. Sticky actions must not cover the last field, focused error or browser safe area. Respect reduced motion and use the existing touch-target conventions, including 44 px phone controls.


### 3.5 Configuration register, creation and summary

The register is a native scoped worklist with columns for Configuration, Family, Alternative, Site/Facility coverage, Source discovery, Latest review run, Estimate adoption, Owner and Updated. Keep draft status, run status and adoption status distinct. Default to active records, most recently updated first with stable ID as tie-breaker. Provide local search, Active/Archived, alternative and family filters; respect the shared table/view conventions. Count only records the actor may read and apply scope filtering before pagination/counting. An empty filtered list is distinct from no configurations yet.

New configuration requires an existing permitted estimating workspace, Active alternative, exact saved Discovery revision and explicit coverage. The family is Screen Systems in this increment. Choose a descriptive name; show defaults with their provenance; create no run or cost lines on creation. Do not prefill fixture quantities/prices as customer-confirmed facts. A read-only user may inspect the register but cannot start creation.

The contextual summary shows configuration scope, saved draft/run identity, calculation freshness, manual reviews outstanding, unresolved active positions and receiving eligibility with its specific reasons. It may show a recovered illustrative preview and an earlier saved native estimate total only with different labels and exact source versions. Avoid a composite readiness percentage or a single green “Ready” label that hides engineering, pricing or scope uncertainty. When no estimate exists, offer the existing explicit discovery-costing entry point. Do not create an estimate as a side effect of opening this panel.

Actions are named for their effect: Save draft; Review calculation; Save review run; Review estimate changes; Apply reviewed changes; Review source change; Create draft from run. Continue is navigation only if used. A pending/unknown command disables conflicting mutations across the whole configuration, including parameter edits and adoption, while authorized reads remain available. Show the reason beside a blocked action rather than relying on an unexplained disabled button.

## 4. Screen Systems inputs, source rules and diagnostics

### 4.1 Field definitions

Use a versioned field manifest: stable field ID, label, data type, input unit, canonical unit, precision, allowed choices, applicability expression, default provenance, source reference, required condition and technical validation. Appendix A enumerates the 64 r03 controls. Treat them as the parity baseline, not a manufacturer-approved range set.

Each proposed value records attribution: inherited exact source, user entry, recovered default or explicit assumption. Fixture defaults are not automatically confirmed customer requirements. Keep raw entry and normalized canonical value separate; percentages such as shrinkage normalize once. Units are visible next to inputs, with no ambiguous mixed mm/m or points/fraction arithmetic. Unsupported selectors never fall through to a convenient default.

Preserve distinct identities for Pinion tube diameter (`C99`, 27/32 mm), Cable drive location (`C99`, Central/End) and drive pipe diameter (`C102`, 25/32/50 NB). The overloaded legacy cell does not justify one native field. Switching drive family preserves dormant typed values without using them in the other branch. Activation of a dormant value causes applicable validation and review; it does not inherit confirmation merely because the value was stored.

Keep truss shape and roof profile separate. Roof profile is a drawing-only input with no recovered worksheet cell. Height to screen is recorded/drawn without a surviving quantity consumer. Truss chord height follows the recovered seven-value list; only 30 and 50 currently have a matching clip in the provisional catalogue.

Five additional-screen slots retain stable IDs, count, length, overhang, width and material reference/provenance. Their 20 numeric controls are additional to the 64 primary controls. Count zero means inactive; active length/width must be positive. Preserve inactive values for history without including them in quantities. Do not silently combine different materials or claim missing material catalogues are available.

### 4.2 Non-negotiable rule distinctions

| Subject | Required behavior |
| --- | --- |
| Exact cloth lookup | Bay length → cloth width in metres: 2 → 2.2; 2.13 → 2.35; 3 → 3.25; 4 → 4.3; 4.5 → 4.7; 5 → 5.3. Other values withhold the affected calculation; no interpolation. |
| Cloth rounding | Preserve the recovered operation order. Standard cut rounds the shrunk length plus both overhangs upward to 0.1 m. Additional screens round their shrinkage-adjusted length before adding overhangs. |
| Physical versus calculation width | Extra wall-screen spans affect calculation width without silently enlarging the physical greenhouse footprint. |
| Odd bay | Use the versioned odd-bay parameter and preserve the unresolved additional-cloth finding. Do not invent a replacement cloth set. |
| Drive pipe | C102 affects Cable drum/protector quantities and relevant part selection; 50 NB affects sprockets when motors are included. Preserve r03 owner-decided rules. Correct stale helper text claiming all quantities are unchanged; equivalence is at the default 25 NB. |
| Pinion/Cable conflict | Keep conflicting positions 264, 266, 267 and 274 unresolved with candidates. Do not choose by name similarity. Keep the Cable 267 versus 268/269 conflict visible. |
| C273 | Remains a manual quantity under the authoritative r02 recovery. The secondary r04 formula does not silently replace it. |
| Torque | Recovered area bands are comparison results, not approved safe load or motor selection. Preserve unavailable Cable upper range and the Pinion missing-upper-bound warning. |
| Added screen motor area | Preserve and disclose the source omission of additional slots 3–5 and offcuts in motor-area logic. Do not silently correct it while claiming parity. |
| Installation | An enabled but unresolved installation branch produces unavailable required quantities/pricing and a finding, not a fabricated zero allowance. |
| LS wire | Preserve the documented source behavior and finding around the replacement selector; a proposed correction needs a new definition and tests. |
| Unknown versus zero | Blank/unavailable is distinct from an explicit reviewed zero, excluded line and not-applicable branch. Never coerce unknown into zero for totals. |

Do not copy display errors from source extracts: `cable_size_band_1` is the first Cable band's **Nm result**, not a millimetre threshold. `G95` Ultra Groove is derived for Cable, not a new selector. Keep the exact catalogue descriptions as source evidence; show interpretation notes separately for the “Endmm” texts rather than quietly rewriting the source.

### 4.3 Calculation engine

Extract an independently testable typed calculation module from the recovered behavior. The server is authoritative for every saved preview/run and receiving manifest. A shared pure engine may provide instant browser previews, but the server recomputes and validates before saving. Do not trust submitted totals, quantities, rule IDs, warnings or eligibility flags.

The engine accepts a pinned definition bundle, parameter set and normalized input snapshot, and returns all source positions, intermediate facts, unit/rounding evidence and structured diagnostics. No network, clock, random identity, database access or mutable catalogue lookup occurs inside calculation. Stable output order is defined by the rule registry; timestamps/UUIDs are added outside the deterministic result.

Use explicit decimal/rational or carefully bounded scaled arithmetic for the native port; preserve each recovered floor/round/round-up boundary. Do not reuse r03's floating epsilon as a blanket policy, round every intermediate to currency precision or introduce unreviewed tolerances. Before committing the engine representation, record its precision/rounding contract and prove the recovered examples and boundaries. Any deliberate numerical correction gets a new definition identity with an old/new comparison; do not relabel changed results as r02 parity. Retain the existing exact native money implementation unchanged.

Diagnostics need stable code, severity, affected field/rule/line IDs, source evidence and actionable text. Separate: invalid input; unavailable calculation; source finding; untested selection; stale manual review; provisional/missing/conflicting part; price unavailable; stale context; and receiving-policy block. A warning acknowledgement retains the warning and does not turn it into an approval.

Technical bounds prevent division by zero, non-finite values, overflow, negative derived quantities, excessive output and expensive drawings. The recovered controls accept up to six decimal places and bounded values; these are prototype input limits, not safe operating ranges. Preserve relevant constraints and add cross-field validation where a calculation would otherwise become invalid. Identify each added restriction as a technical guard; do not claim engineering certification.

### 4.4 Diagram contract

Retain the r03 Plan / Screen cut views and Cross section / Bay section views as deterministic SVG projections of the same normalized calculation facts. The plan preserves the true footprint ratio, actual drive positions/counts and motor groups across/along. Distinguish wall-screen extensions and the odd bay. The cut view separates coverage, shrinkage, both overhangs and rounding remainder, and explains the different additional-screen rounding order.

Cross section shows the chosen drawing-only roof profile, screen height, groups, drive lines and configured edge treatment. Bay section shows truss shape/chord height, cloth lap, leading edge, Cable/Pinion treatment, supports and odd-bay context. Preserve the Open / Closed illustration control as a view preference, not a new engineering input. Label nominal roof geometry, vertical exaggeration and break symbols. A schematic is not CAD, a certified drawing, structural analysis or installation instruction.

Show exact numeric dimensions/counts alongside the drawing. If rendering density is capped, thin only the visual marks and disclose that fact; do not cap calculation quantities. Out-of-date drawings must carry the same stale-preview state as their associated results. Drawing preferences do not dirty the business draft unless they are actual versioned inputs, such as roof profile.


## 5. Definition, parameter and evidence governance

A definition bundle is immutable and content-addressed. It identifies family, engine version, source manifest, field schema, formula/rule registry, parameter defaults, part resolver, units/conversions, known findings and accepted test evidence. Keep these separate version identities even if one published bundle pins them together.

The initial quantity identity is `SS-RECOVERED-QTY-r02`; the r03 provisional part identity is `SS-PART-IDENTITY-r03-PROVISIONAL`. Retain historical source IDs as evidence and create a distinct native implementation/bundle version rather than rewriting the issued files. A source manifest stores document name, revision as actually observed, hash, authority role and permitted document reference. A hash is not proof that the current actor can read the source document.

Definition state and run state are different. Use explicit definition statuses such as Recovered / Review required / Approved for stated scope / Retired, mapped into actual repository conventions. Store scope of applicability and approval evidence only when real. A simple estimator note, successful test or administrator role does not approve a bundle. Initial authoring/publishing of formula code is repository-governed; a general formula editor or new engineering approval workflow is outside this increment.

An estimator can create a versioned configuration-specific parameter proposal with a reason. It is not a mutation of published defaults. Persist all 12 parameters in draft/run signatures. Clearly identify the eight bound consumers and four recorded-only parameters in Appendix B. Keep individual source literals separate unless the recovered consumer mapping binds them; do not globally replace all matching numeric constants.

An accepted global/default parameter change requires a successor bundle or governed parameter-set version and its exact evidence. It never changes old runs. Any noncommercial configuration/parameter-basis change invalidates the 14 manual reviews under the conservative recovered rule, including recorded-only changes if that basis includes them; explain this in the UI. A future narrower invalidation graph is a separate tested definition decision.

Retain the 23 REV findings, three AUD findings and 12 WAS discrepancies with their original identities. Use separate fields for current disposition, owner, next action, evidence and resolved-by decision. Do not collapse unlike finding counts into one misleading readiness percentage. A review note may be saved without closing the finding. Preserve untested-option notices and historical coverage, including commercial-value redaction.

Snapshot the resolved part description, unit, mapping version and source metadata with each immutable native run. This intentionally strengthens r03's display-time description lookup: historical evidence must reproduce what was reviewed. A separately labelled “Current catalogue description” may be shown after permission checks; it must not replace the saved description or alter the run hash.


## 6. Native data model and durable draft contract

Use the existing PostgreSQL, transaction, shared operation, scope and identity patterns. Physical names below are proposed; confirm current schemas and migrations before choosing exact names. Prefer explicit typed columns for ownership, identity, versions and joins; bounded versioned JSON is appropriate for immutable calculation snapshots.

| Record | Minimum content and invariants |
| --- | --- |
| Configuration aggregate | Stable ID; workspace/company; opportunity/estimating-workspace/alternative; scope-binding kind and exact saved discovery reference; family; label; owner under existing authority rules; active/archived state; concurrency version; current saved draft/run pointers. |
| Saved draft version | Schema version; predecessor; raw/normalized input proposal; field attribution; extra-screen IDs; parameter proposal; manual evidence; gates/exclusions; pricing proposals; expected source hashes; actor/time/reason. Saves are durable and versioned; a draft need not be calculable. |
| Definition bundle | Immutable family/schema/engine/rule/source/parameter/mapping/unit/policy manifest; content hash; eligibility/review metadata under governed authority. |
| Calculation run | Stable run ID and monotonic configuration sequence; exact saved draft and base run; immutable definition and input snapshots; generated baseline; resolved lines; diagnostics; comparison decisions; arithmetic evidence; actor/time/reason/hash. |
| Current resolved configuration | Versioned pointer/state for the latest reviewed line set and manual changes since its run. Keep its generated baseline and edited values distinguishable. |
| Estimate adoption | Exact configuration/run/resolved-set version, target estimate/version/basis, expected versions, receiving policy, before/after line manifest, unit/price transformation decisions, receipt and resulting estimate version. |
| Estimate line lineage | Target estimate-version ID + cost-line UUID; configuration ID; stable generation key; run ID; generated baseline; adopted value; mapping/conversion/price-policy versions. Historical links are immutable. |
| Finding/review event | Exact affected object/version, disposition, actor/time/reason, evidence and current authorization. No invented approval actor. |

All related records must share valid workspace/company/alternative context. Enforce relationship checks and uniqueness in the database as well as services. No foreign key can be satisfied merely by a UUID belonging to another company. Archive retains history and adoption links; it does not delete source evidence or remove estimate lines. Initial UI does not hard-delete runs or adopted configurations.

### 6.1 Draft behavior

Editing changes an in-memory working proposal. **Save draft** explicitly creates a durable saved draft version. Do not autosave business evidence silently. **Review calculation** uses the complete current proposal; **Save review run** commits that exact proposal as a saved draft if needed, together with the run and resolved line set in one transaction. This avoids pretending the preview came from an older saved draft.

Use distinct labels: Unsaved changes; Draft saved; Calculation current/stale; Review run saved; Applied to estimate vNN. A saved draft can contain missing/invalid inputs; Save review run requires technically valid inputs, current manual review and resolved rerun decisions, while documented source findings or unavailable illustrative prices may remain. Such a run remains a review record and can be ineligible for receiving.

Intercept controlled navigation, alternative/context switches, browser back/forward where supported and unload through the existing unsaved-change system. Offer Stay / Save draft and leave / Discard local changes. No discard touches a prior saved draft/run. Handle a failed save without navigating away. Do not invent an unsaved-data guarantee for abrupt browser termination.

On reload, load the latest authorized saved draft, not another user's local-storage state. Client storage may retain existing non-sensitive view preferences only; it is not draft authority. A controlled recovery export is permitted only while the actor retains the relevant read authority. Permission revocation clears sensitive state and blocks exports, including offline recovery bundles.

The standalone JSON restore control is not a native database import contract. Initial native history/recovery uses saved server records and operation receipts. Evidence export remains read-only; do not add unrestricted JSON restore or accept an exported actor/approval/hash as trusted authority. Any later import requires its own scoped schema validation and identity remapping. A readable print view may reuse the existing print/document mechanisms, must identify the exact saved run and review status, and must not imply an issued engineering or customer document.

### 6.2 Hashing, schema and bounds

Canonicalize typed input/decision objects with explicit schema dispatch and deterministic ordering. Distinguish null, unavailable, zero and absent legacy fields. Include definition/bundle versions, parameter values, relevant part/unit/price manifests and exact scope basis in the preview signature. Do not hash display formatting, locale or volatile timestamps as the computational identity.

The run's evidence hash additionally covers all immutable snapshot content, provenance and saved descriptions. Store hashes and originating schema versions without rehashing old records under a new serializer. Reject unknown schema versions on write; preserve and safely display known legacy history.

For the new workbench command family, use a **256 KiB UTF-8 request-body ceiling**, enforced independently on the transmitted raw body and the whole canonical envelope, including reason/IDs/decisions. The existing shared command wrapper is 64 KiB; implement the narrow specialist override described in section 9.5 and keep existing estimating route limits unchanged. Bound strings, field maps, five extra slots, 143 generated positions, 14 manual entries, six source gates, 12 parameters and per-line decisions. Manual estimate lines are separate and remain within the target's 100-line limit. Use at most 50 history/register records per page with a scoped cursor. Confirm a worst-case valid fixture fits the workbench budget; reject oversize at transport and service boundaries without truncation. Evidence attachments are stored through the existing document system, never embedded as arbitrary base64 in command bodies.

Use UTC instants for storage and the application's configured business timezone for display. Retain ISO instants in evidence exports and show readable local dates with timezone context where needed. Never infer an ordering from formatted strings.


### 6.3 Independent states and action eligibility

Model these dimensions separately; they are proposed native enums/DTO fields, not additions to the recovered formula rules:

| Dimension | Values / meaning |
| --- | --- |
| Lifecycle | Active or Archived; archive does not remove estimate contributions. |
| Draft persistence | Clean, Unsaved, Saving, Conflict or Outcome unknown; this is local command state, not engineering readiness. |
| Calculation | Not calculated, Invalid, Current or Stale, bound to a proposal signature. |
| Review | Needs manual review, Needs reconciliation or Review recorded; recorded review may retain source findings. |
| Price completeness | Unavailable or Complete for the named policy; the two price policies have separate results. |
| Receiving eligibility | Blocked with structured reasons, Eligible for synthetic receiving, or Eligible under a separately governed operational contract. The last state is never seeded by this increment. |
| Adoption | Never applied, Applied to exact version, or New reviewed result not applied. A newer estimate manual edit can additionally make comparison necessary. |

| Action | Minimum requirements | Result |
| --- | --- | --- |
| Save draft | Current editing authority, permitted references, structurally valid bounded proposal, no unresolved prior command, correct aggregate version. Numerical completeness is not required. | New immutable saved draft and advanced aggregate version. |
| Review calculation | Authorized current context and valid manifest selection. | Read-only result or structured diagnostics; no receipt and no saved run. |
| Save review run | Technically valid exact proposal, current manual-review basis, complete rerun decisions, current versions and editing authority. | Immutable draft/run/resolved-set commit. Source warnings and unavailable illustrative rates may remain. |
| Review estimate changes | Exact immutable saved run/resolved set, readable target and existing editing authority required by the native receiver. | Complete proposed target change and structured blockers, without mutation. |
| Apply reviewed changes | All scope/target/eligibility/unit/part/price/line-cap/authority checks pass; exact preview and expected versions still match. | One atomic estimate successor with exact lineage, or explicit fully equivalent no-change outcome. |
| Review source change | Exact existing and proposed saved revisions under the same permitted alternative. | Read-only field/coverage/source comparison. |
| Apply source rebase | Editing authority; acknowledged incompatible/missing inherited facts; exact versions; explicit reason. | New draft/binding version with invalidated dependent review; no recalculation or cost adoption by implication. |
| Copy to another alternative | Read source; edit destination; validate and remap actual destination references. | New configuration identity and proposal with copy provenance, no carried adoption links. |

No boolean supplied by the browser can set a computed state. Read DTOs expose stable blocker codes, affected field/line IDs and a permitted resolution action. The server returns diagnostics for valid review contexts even if operational eligibility is blocked; it does not turn every engineering finding into a generic request failure.

### 6.4 Raw drafts and calculation values

A numeric draft entry is a bounded string, not a floating number. It may be blank or temporarily invalid, such as `-` or `1.`, and still be saved as an incomplete draft. Structural validation continues to reject wrong types, unknown keys, excessive length, invalid reference IDs and unauthorized context. Define parsed state separately as Missing, Invalid or Value; only Value participates in calculation. Do not convert blank to zero or persist NaN/Infinity.

Appendix D specifies calculation grammar and bounds. Keep raw text for evidence and show the canonical value alongside it when useful. Initial recovery-compatible validation covers all stored scalar fields as r03 does, including hidden branches; a hidden invalid value must have an error-summary link to reveal it. Do not silently exclude a hidden validation failure to make the run save. Applicability still controls which valid values influence formulas. Any relaxation to validate active fields only requires a separately versioned field-schema decision and branch tests.

The recovered design reviews all 14 manual quantities conservatively. An explicitly reviewed Unresolved entry can be recorded with its reason/basis and remain a review-run finding; it cannot satisfy an active required receiving quantity. Excluded/not-applicable positions remain visible with their distinct outcomes. “Review complete” means decisions have been recorded, not that every quantity or engineering question is resolved.

### 6.5 Explicit source rebase

The configuration's company, estimating workspace and alternative remain stable. A later saved Discovery revision within that alternative is adopted through Preview source rebase / Apply source rebase. Show old/new revision identities, scope hashes, Site/Facility/system coverage, inherited facts, removed references and changed confirmation evidence. Preserve entered overrides and their original provenance; require a decision where a source change conflicts with an override. New required facts start unanswered. Removed coverage is retained in history and cannot continue to satisfy the new scope.

Rebase creates a new immutable binding/draft version. Old runs retain their original binding. Mark calculation stale, invalidate dependent manual review and cancel old receiving signatures. A later saved run is required before receiving against the new basis, even where quantities happen to remain equal. Rebase never selects an alternative, adopts discovery into an estimate, updates installed equipment or copies old engineering approval.

If source access is lost, do not expose old protected values in a change comparison. Show permitted unavailability and retain the immutable server history. Cross-alternative, cross-workspace or cross-company moves are not rebase; use an authorized new configuration/copy flow with explicit reference mapping. Do not broaden scope checks to preserve a convenient link.

## 7. Manual quantities, line decisions and safe rerun

### 7.1 Manual quantities and participation

The 14 manual quantity cells are **C245, C273, C274, C275, C276, C278, C279, C280, C281, C282, C283, C285, C291 and C292**. Keep them explicit; no replacement formula is authorized by this build. Store decimal value or unresolved state, unit, reason, actor, timestamp and the exact definition/input/parameter basis reviewed. Zero is an explicit reviewed zero, not proof of exclusion. The six source inclusion gates are **B254, B263, B264, B266, B267 and B270**.

Changing geometry or another relevant noncommercial basis invalidates all 14 manual reviews under the recovered conservative contract. Retain values but mark them Needs review. A bulk review lists every affected value and asks for an explicit reason/acknowledgement; it cannot silently confirm hidden stale entries. Editing one value does not confirm the other 13.

Keep distinct: generated/manual quantity; source gate; estimator exclusion; no-purchase; target quote include/print choice. An excluded line retains its underlying quantity, reason and evidence while its effective receiving/pricing contribution is suppressed under the named policy. No-purchase can remain priced. Exclusion and restoration both require reasons. Commercial adjustment lines are governed by commercial inputs, not arbitrary quantity overrides. Record the consistent exclusion behavior as a deliberate refinement of the legacy gate defects.

### 7.2 Configuration rerun

Use three inputs: **B** = last accepted generated baseline; **C** = current resolved configuration lines, including manual edits; **N** = newly generated candidate. Stable generation identity is configuration ID + definition family + stable rule key + occurrence/slot identity where relevant. Preserve `CE-LINE-<row>` as the source key. A display description, row index, SKU alone or array order is not a matching key.

| Comparison | Default / required decision |
| --- | --- |
| N added with no prior key | Add candidate, clearly shown in preview. |
| C matches B and N unchanged | Keep unchanged. |
| C matches B and N changed | Propose generated change, visibly included in the comparison. |
| C differs from B | Explicit Keep current or Use generated for that line; retain reason and baseline. |
| Prior key disappears from N | Explicit Remove or Retain as manual contribution, with reason. |
| Current and candidate conflict in unit, identity or meaning | Unmatched/incompatible; preserve original and require an explicit mapping or separate retention. No fuzzy match. |
| Definition successor changes rule keys | Use an explicitly versioned reviewed key mapping or show unmatched old/new lines. Never assume matching row numbers imply compatible meaning. |

Part/SKU changes under a stable rule key are visible changes, not an unchanged row. An earlier manual override cannot silently become a blanket permanent override for all future parts. Quantity, unit, part identity, price basis and exclusions participate in meaningful comparison.

Recompute the **resolved** result after Keep/Use/Remove decisions. Label the unmodified calculation preview separately. Save only after all required decisions are resolved against the exact current signature and expected versions. Cancellation changes no draft, saved line, run, price or audit business state. Creating a preview is not a business mutation.

Never mutate an immutable run to reflect a later manual adjustment. That adjustment creates versioned current resolved state with evidence; the next run compares against its originating baseline. Creating a draft from an old run starts a new proposal and preserves the original. A different alternative gets a new configuration identity with copy provenance; viewing/copying does not select it or transfer its estimate adoption links.


### 7.3 Deletions, dormant outputs and incompatible changes

Retain the full 143-position generated baseline in the run, including inactive/zero/unresolved outcomes. The active receiving set is a separate projection. Preserve a decision history for a prior generated contribution that becomes inactive, is explicitly omitted or is retained as manual. Otherwise its later reappearance can be mistaken for a wholly new contribution.

Extend both B/C/N comparisons with these mandatory cases:

| B / current C / new N | Required behavior |
| --- | --- |
| No prior B or C; N present | A genuinely new candidate can default to Add. |
| B present; C absent; N present | Treat as a user deletion/omission since the baseline. Require Restore proposal or Keep omitted with reason. Do not auto-add. |
| B present; C absent; N absent | Preserve the removal history; no new cost line. |
| Previously excluded/zero/retained-manual key becomes active | Show its earlier disposition and require reconciliation when reintroduction could conflict or duplicate retained work. |
| Part identity or unit changes; current override exists | Show both identities/units. Keep current preserves the full old tuple as a retained/manual contribution; transferring just the old number to the new SKU/unit requires a separately reviewed mapping/conversion. |
| Duplicate generation key or cost-line UUID | Reject the whole proposal. Never deduplicate by keeping the first/last value. |

If an authoritative current manual estimate version has no line for a previously owned key, that absence is evidence of deletion for comparison purposes; no new permanent deletion table is mandatory if immutable versions/adoptions can establish it reliably. Decisions are versioned and never reconstructed from descriptions.

## 8. Estimate receiving and money contract

### 8.1 Separate preview, save and apply

The primary sequence is: **edit → calculate → review/resolve → save review run → preview estimate changes → apply reviewed changes**. These are separately labelled actions with separate operation IDs where they commit separate transactions. Saving a run does not change any estimate. Applying an existing run does not rerun its formulas. Selecting an alternative, adopting discovery for costing and adopting configuration outputs remain separate actions.

For initial receiving, require a selected Active alternative with Complete saved discovery under the current native E2 contract, a discovery-bound editable estimate, and a saved configuration run whose source revision/context exactly matches the estimate's adopted discovery basis. If a newer discovery exists, do not adopt it silently; route through the explicit discovery-cost adoption flow and then review/rebind/recalculate the configuration as necessary. Historical run reading must not depend on the record still being the selected alternative.

Use the actual source revision UUID/hash, not the text “r03.” Recheck scope permissions and current reference evidence at preview and commit. A customer/site/alternative change invalidates the proposal. A multi-area system is configured once per distinct configuration, with explicit coverage; do not duplicate its generated lines for each linked area.

### 8.2 Receiving manifest and line capacity

Build an immutable receiving proposal from an exact saved run/resolved state and an exact target estimate version. Its server-computed preview includes the full expected resulting estimate line set, predecessor, unchanged manual lines, every configuration-owned line transformation, prices, units, provenance, exclusions and before/after totals under the native estimate policy. The commit request supplies exact pinned identities, decisions and reviewed price/unit proposals; the server reconstructs the result rather than trusting a client-submitted replacement estimate. The UI may paginate the comparison; the server validates the entire set.

Only positive, fully resolved receiving lines become native `CostLine` entries. Zero, excluded, not-applicable and unresolved positions remain in the run/manifest with explicit outcomes; they are not inserted as zero-quantity cost lines. If an active required position is unresolved, block receiving rather than omit it. Retained manual contributions can be received only after their required units, prices and ownership are valid.

Respect the existing **100 total cost lines**, including unrelated manual and other-configuration lines. A proposal exceeding the cap fails atomically with counts and a readable explanation. Do not truncate, merge unlike lines, split into repeated partial applies, overwrite another configuration's lines or raise one validator while quotation selection still caps at 100. Capacity expansion, if later needed, must be an explicit end-to-end estimate/quote schema and consumer change with its own decision and tests; it is not required to complete the bounded initial receiver.

Use explicit source-to-estimate category and unit mappings. Native schema 2 categories include Product, Labour, Freight, Engineering and Subcontract, with explicit allowance Yes/No. Do not infer these from a description or map engineering units to “each” merely to pass validation. Keep calculation, estimate/pricing and procurement units distinct; a stock length, roll, pack, metre and square metre require an evidenced conversion, direction and rounding rule.

Native quantities use up to three decimals and must be greater than zero and at most 100,000. Native unit cost/sell use two decimals, must be within their supported bounds, and sell must not be below cost under the current synthetic policy. Required source/effective-date fields need actual proposal provenance; never use today's date to impersonate an old source date. If a recovered quantity cannot be represented exactly, require a reviewed, versioned unit/precision conversion and show its delta. Until such a policy exists, block that line. Never silently call `toFixed` and discard the difference.

### 8.3 Safe rerun against an estimate

Configuration comparison alone is insufficient: the estimator may have edited its previously adopted cost lines in the manual estimate. Receiving uses its own three-way comparison: last adopted contribution baseline; current target estimate lines; new receiving proposal. Preserve unrelated manual lines and contributions from other configurations byte-for-byte, including their IDs and provenance.

Existing cost-line UUIDs remain stable for compatible continuing contributions; new contributions receive new IDs. Removed contributions require an explicit remove/retain decision. A retained removed line becomes a manual contribution with source history and a deliberate ownership outcome, so it cannot be reclaimed or duplicated automatically on the next rerun. A later generated reappearance must show that retained contribution and require an explicit reconciliation decision.

For manually changed adopted quantity, description, unit, category, allowance, price or source, require Keep current / Use proposal / explicit separate retention as applicable. “Keep current” preserves the edited value but updates neither engineering approval nor source claims. Recalculate resolved target totals through native `math.ts` after all decisions; do not save the unmodified generated preview total.

Lineage must survive an ordinary manual estimate save that retains a line ID. Copy prior lineage forward to the new estimate version and compare actual new values against the adoption baseline. Removing a line records its absence without mutating old lineage. Newly created manual lines do not acquire configuration ownership by matching descriptions. Do not retrofit extra unrecognized fields into schema-1/2 `CostLine`; use a versioned sidecar/relationship or an explicitly versioned extension with compatibility tests.

### 8.4 Pricing separation

Keep the recovered illustrative `SYN-PRICE-02` price bridge available for evidence: its currency/FX direction, raw extensions, whole-dollar discount and final upward $10 rounding are not the native estimate arithmetic policy. A blank required rate makes the relevant complete total unavailable; an explicit zero needs provenance/reason. No-purchase does not make the selling value zero.

The recovered example's EUR costs are divided by EUR-per-AUD. Preserve the sea-freight cost/(1−margin) interpretation and explicit local-freight sell input as historical behavior, with their bounds. Do not silently activate recorded-only cloth markup/FX parameters, duty, commission or installation charging. No historical catalogue prices or private quote values may be embedded in the public app.

Receiving uses a separately reviewed native-cost proposal with explicit AUD amounts and the existing `SYN-EST-ARITHMETIC-01` policy. Provide a bridge showing which quantities/rates/conversions were used and the difference from the recovered illustrative total. Do not copy the rounded workbook total into a balancing cost line or relabel it as the native total. Preserve **Excluding tax · tax not calculated** where that is the actual native state. Margin approval, automatic repricing and live FX lookup are not introduced by this task.

### 8.5 Atomic commit

In one database transaction, reauthorize scope, verify expected configuration/resolved-set/estimate versions and the reviewed signature, verify exact source/definition/policy eligibility, validate all target lines, create the next estimate version, copy its exact discovery basis, persist complete lineage/adoption evidence, and write the shared receipt/audit/outbox records according to repository conventions. Either the whole adoption commits or none of it does.

Lock/read aggregates in the application's established deterministic order. Two concurrent applies cannot create duplicate lines or lose one contribution. Preview has no lock that survives a user review; commit must detect later changes. A fully equivalent same-run/same-target apply returns an explicit already-current/no-change result instead of creating spurious versions. Section 8.6 defines full evidence equality; matching amounts alone are insufficient.


### 8.6 Immutable receiving source and complete lineage integrity

Adoption may reference only an immutable saved resolved-set revision. It cannot reference a mutable `current lines` object or an unsaved line override. Use a run's resolved snapshot or an explicitly saved successor resolved-set record with its own ID/hash, linked to that run. Preview and commit pin that exact identity/hash. Editing it creates another revision and invalidates the prior preview; old adoption evidence remains unchanged.

Lineage is a typed relationship/manifest outside unchanged schema-1/2 CostLine objects. Every new estimate version carries an explicit lineage manifest identity/hash, bound to its exact existing estimate content hash, estimate-version UUID and discovery-basis UUID. The manifest records all owned contributions, retained/manual dispositions and predecessor lineage; no contributor is inferred from user-editable `source` text. Enforce one ownership association per target line in that version. Keep arithmetic input order meaningful; do not sort cost lines simply to get a stable lineage hash.

The service verifies immutable manifest bytes and their exact version binding before comparison, export or reuse. A mismatch refuses adoption and reports an evidence-integrity error; it does not drop ownership and treat every line as new/manual. Old estimate versions have no invented lineage; absence is explicitly legacy. Preserve their content hashes and DTOs. Use database permissions/constraints and service validation to prevent ordinary APIs from editing adopted manifests. Hashes support integrity checks but do not replace authorization or immutable storage.

Audit **all estimate-version creation paths**, including ordinary SaveEstimate, discovery-cost adoption, new estimate creation, schema upgrades and any copy/successor path found in the current checkout. When line IDs survive an ordinary manual save, carry their original adoption baseline into the successor manifest and derive the edit/deletion differences. This includes a newer discovery-cost adoption: retained lines keep their original run/source basis and are visibly marked Source basis changed / Needs specialist review where applicable. Do not relabel them as generated from the new discovery. A new specialist rebase/run/adoption resolves that difference explicitly.

No-change means the complete intended receiving result, line dispositions, exact run/resolved-set, mapping/price policy and basis already equal the current adopted evidence. Equality of quantity, total or description alone is insufficient. Applying a newer run or changed provenance creates a new estimate/adoption version even if all monetary values match. Repeating the exact same operation returns its original receipt; a fresh equivalent operation may return a reasoned Already current outcome referencing the existing adoption without incrementing the business version. Define its audit/receipt behavior through the existing shared-operation contract; do not hide a mutation behind a preview.

### 8.7 Concrete synthetic receiving policy

Initial eligibility is a seeded, immutable server-side manifest, proposed identity `SYN-ES08-RECEIVE-01`. It pins the allowed native bundle/hash, parameter set, part-rule/unit-map versions, supported input branch/fixture profiles, reviewed source-finding dispositions, category mapping and native price proposal policy. It is a deliberate **synthetic test policy**, not an engineering approval of the recovered catalogue. `synthetic: true` alone is not sufficient eligibility because the wider app is also a synthetic prototype.

Seed at least one complete, representable, bounded synthetic Screen Systems case and a changed successor case that can be received successfully. Each has explicit reviewed manual quantities/gates/exclusions, resolution of every required active part/unit, supported source scope, prices with synthetic provenance and the current native money policy. Do not clear engineering warnings to make these fixtures pass. Record which warnings are retained under the bounded synthetic policy. Active unknown/conflicting required mappings and missing required prices still block; a policy cannot treat them as zero or omit them silently.

No UI action, request property, role name, environment query parameter or general administrator grant can publish/approve this policy or activate operational receiving. Parameter/branch changes outside the policy keep native review available and return a precise receiving blocker. Tests must exercise allowed, changed-and-still-allowed, and outside-policy proposals. Extending the allowlist requires a versioned fixture/policy change and fresh tests, not an unrecorded bypass.

### 8.8 Downstream quotation and other consumers

A new estimate version does not regenerate, overwrite or relink an existing draft quotation or rendered document. Show that a draft quote is based on an earlier exact estimate version; preparation of a new quote remains a separate explicit action. New/changed cost lines require the existing per-line include/print decisions for the exact new saved version. Do not default technical details, internal costs, source findings or supplier allowances into customer-facing text.

Provide a safe contribution/readiness projection for internal estimate/discovery views using the existing access boundary. Where a synthetic draft quote is prepared from contributed costs, its established synthetic/draft identity remains true; it must not imply technical release. Future operational issue, engineering, procurement and ERP consumers must check their own adopted eligibility contracts. This task creates no automatic Activity, engineering release, purchase demand or outbound integration merely because a run is saved/applied. Page guides should explain these distinctions using ordinary product language.

## 9. Commands, authorization and failure recovery

### 9.1 Command inventory

Names are proposed domain commands, not existing endpoints. Follow the current route/validation conventions and shared operation machinery.

| Command/read | Required contract |
| --- | --- |
| List/read configurations; read run/history/working | Current scoped read authority; bounded results; no commercial leakage through aggregates or previews. |
| Create configuration | Exact permitted context, saved source binding, supported family, initial draft; server-issued identity/attribution conventions. |
| Save configuration draft | Full bounded typed draft, expected aggregate/draft version, reason; permits incomplete technical inputs but rejects malformed/unauthorized references. |
| Preview calculation | Full current proposal + exact manifests; server calculation and signature; no business mutation. |
| Save review run | Exact preview signature, expected versions, current manual review, complete rerun resolutions; atomic draft/run/resolved-state save. |
| Adjust resolved line / review manual quantity / change parameter | Exact basis and expected version, reason and permitted typed change; may be grouped into one explicit draft command if atomic semantics are retained. |
| Preview estimate adoption | Exact saved run/resolved-set and target estimate version; complete receiving comparison and eligibility reasons. |
| Apply estimate adoption | Original operation ID, expected versions, exact proposal signature, complete resolutions and reason; atomic receiving. |
| Archive / create draft from run / copy configuration | Explicit context/provenance and expected versions; retain history and never transfer adoption ownership by accident. |
| Read operation receipt | Original operation ID with current authorization over all referenced records; no side channel after access loss. |
| Export evidence | Exact permitted snapshot; schema/version/source manifest; internal/synthetic/review status clearly stated. |

Every mutation carries an operation UUID, schema version, expected versions and reason where required. Derive actor, tenant and permission scope on the server. Use strict allowed keys and reject spoofed ownership, source authority, approvals or synthetic eligibility. Receipts bind original canonical payload/command identity; reusing an operation ID with a different payload must fail.

### 9.2 Permissions

Reuse `estimating.read`, `estimating.edit`, owner rules, whole-group Draft checks and related-record visibility where they govern the current native E2/E1 path. Do not make a user editable merely because they can open a source attachment. A read-only configuration viewer can inspect permitted results/history without receiving edit authority. Internal cost/rate details follow actual estimating permissions and safe DTO boundaries, including exports/search/receipts.

Do not introduce a new global “specialist administrator” bypass. If a genuinely distinct capability is necessary after inspecting current access contracts, make it narrow, document its actions/scope and update the repository's generated access-review artifacts and grant tests. Definition approval requires a real adopted authority contract; this increment does not invent one. Review notes and configuration-specific parameter proposals stay within existing authorized editing scope.

All linked opportunity, customer/site/facility, alternative/discovery, equipment, documents and target estimate records must be currently readable under the actor's scope. Do not add unvalidated arbitrary target IDs to Activity or business-identity links. A source becoming unreadable produces an authorized-unavailable state, not a leak through a cached title, diagram tooltip or old receipt.

### 9.3 Recovery state machine

| Condition | Required result |
| --- | --- |
| Validation failure | No partial write; preserve authorized proposal; focus actionable errors. |
| Failure before commit | No draft/run/adoption partial business state; retain the original operation/payload for a known-safe retry. |
| Response lost / unknown outcome | Mark original operation Pending/Unknown; reconcile its receipt before another write. Do not create a new operation ID or resubmit changed content while uncertain. |
| Original commit found | Show the original result and exact resulting versions; clear pending state without duplicate work. |
| Version/context conflict | Preserve permitted local proposal; fetch current authorized state; explicit compare/rebase; new operation only after the original outcome is known. |
| Permission revoked | Clear sensitive client state; block read/write/export/recovery data; show safe unavailability. |
| Definition retired/withdrawn | Historical permitted runs remain readable; block new use according to eligibility policy. Do not mutate old results. |
| Totals/evidence mismatch | Refuse adoption and expose recovery/support path. Recompute only from exact saved lines/policy for a repair projection; never regenerate quantities silently. |
| Network unavailable | Keep existing in-memory edits with an unsaved indicator; no offline authority, queued adoption or fabricated save success. |

Reuse existing receipts and transaction semantics. A single-database adoption must not intentionally support “lines committed but totals failed” as an ordinary outcome. That r03 failure demonstration should become a corruption/legacy-repair test or derived-projection failure case; atomic domain data remains consistent. Do not bolt on a second independent receipt store.


### 9.4 Exact platform integration

At the inspected commit, `sharedOperation` obtains an operation advisory lock, then a workspace-row lock, authorizes the current actor, checks the prior receipt and only then mutates. Retain that order. A specialist service must not take a configuration/estimate row lock before entering this shared order, start a nested independent transaction or make an internal HTTP request to another mutating endpoint. Use service helpers with the same transaction client to write the estimate version/basis/lineage atomically.

Authorization before replay must handle two cases: (a) a new operation checks current writable draft/selection/source state; (b) an already accepted original checks current permission over the **accepted immutable snapshots and all related records**. Later selection, archiving or pointer changes must not accidentally replay a mutation or make a still-authorized accepted result unrecoverable. Ownership/permission revocation can legitimately refuse recovery; do not weaken that protection. A 404 receipt lookup is not proof that nothing committed.

Recommended identity mapping: register `SpecialistConfiguration` as the business identity for configuration aggregate mutations, with immutable run/draft/resolved-set IDs in audited accepted details. Estimate adoption returns the existing Estimate identity and records `saved_version_id`, adoption ID, configuration/run/resolved-set IDs and exact source versions. Add explicit specialist dispatch in `src/shared/receipts.ts`; do not let new object types fall into its generic shared-record fallback. For the new adoption command, extend receipt authority to check both the accepted estimate version **and** all accepted configuration sources. `acceptedEstimateContext` alone only establishes the estimate side.

Use consistent command namespaces, recommended: `CreateSpecialistConfiguration`, `SaveSpecialistDraft`, `SaveSpecialistRun`, `SaveSpecialistResolvedSet`, `RebaseSpecialistSource`, `CopySpecialistConfiguration`, `ArchiveSpecialistConfiguration`, `RecordSpecialistFindingReview` and `ApplySpecialistConfiguration`. Parameters/manual quantities/gates/exclusions may be part of one SaveSpecialistDraft proposal; do not create hidden autosave mutations per control. Final names are recorded in the route/command/receipt matrix before implementation and retained in operation hashes.

Every accepted command must produce a result compatible with the existing receipt shape: record ID/version/state and authoritative timestamp, with the usual audit/outbox writes. A receipt identifies acceptance, not completion of any external job. Preserve existing outbox consumers and safely handle newly recorded event kinds under the established dispatcher conventions. Do not fabricate completed downstream task IDs or add an external worker solely for this module.

### 9.5 HTTP, body limits and error contract

Current `src/shared/http.ts` uses a fixed 65,536-byte body limit; `jsonBody` defaults to 16,384 bytes and can accept an explicit override. The existing discovery preview wrapper also uses 65,536 bytes. Introduce a narrowly scoped specialist wrapper or an explicit backward-compatible optional limit with the existing default unchanged. Specialist mutation and POST-preview routes use **262,144 bytes** at both the streamed raw-body boundary and the complete canonical service-envelope boundary. This does not change the existing costing routes' 64 KiB contract or their validators.

Measure actual UTF-8 bytes, including multibyte characters and whitespace; a compact canonical object fitting the limit does not permit a transmitted body above it. Apply structural depth/shape bounds before recursively canonicalizing or processing untrusted nested data. Require the existing local/hosted gateway, authenticated identity, Origin and JSON content checks; a POST preview is read-only but still uses this request boundary. Reject unsupported query keys and do not accept company/actor authority from URL/body values. Use dynamic, private no-store reads and current authentication rules; no workbench data enters a service-worker cache or offline mutation queue.

Preserve the existing `{code, message, field_errors, correlation_id, retryable}` error envelope. Reuse established 401/403/404, 409, 422 and 503 semantics; do not introduce an inconsistent success-shaped error response. New domain codes must be stable and covered by tests, for example: `SpecialistPreviewChanged`, `SpecialistReviewRequired`, `SpecialistSourceChanged`, `SpecialistMappingUnresolved`, `SpecialistCapacityExceeded`, `SpecialistPrecisionUnsupported`, `SpecialistEligibilityBlocked` and `SpecialistEvidenceMismatch`. Missing/forbidden IDs continue to return safe `RecordUnavailable` without revealing whether an object exists. Business blockers use diagnostics/409/422 as appropriate; a blocked engineering branch is not a retryable infrastructure failure.

### 9.6 Recovery across component reload

The existing `useCrmCommand` keeps a pending command in an in-memory ref. Do not claim that merely importing it preserves the original intent after remount or browser restart. Add a scoped recovery design: persist only a minimal non-sensitive pointer to operation UUID, actor/session scope, command type and safe origin route, or use an equivalent authorized server intent record. Do not place the cost-bearing body, inputs, formulas, source labels or prices in local/session storage.

During the same mounted session, retry only the retained original route/body/operation after receipt reconciliation; do not use the hook's normal `send` path to mint a new ID. After reload, resolve the original pointer under current authority and refresh the accepted result. If no receipt is visible and the original full payload is unavailable, do not infer non-commit or recreate it from current form values. Provide an explicit Resolve original outcome action using a bounded server reconciliation record keyed by workspace, actor and original operation UUID.

That action checks for an accepted original under its current accepted-snapshot authority. If one exists, return it without changing it. If none exists and the actor is authorized for the stated original command/context, atomically record a terminal Closed without acceptance disposition that every specialist command checks before mutation. A later-delivered original is then refused under the same ID, so the UI can safely start a fresh intent. Do not close an original on timeout, from a hidden/404 lookup alone or before taking the operation lock; if closure races a real commit, exactly one outcome wins. Retain the closure marker with operation history; do not expire it while a late replay could become valid again.

Give the resolution action its own operation UUID and audited reason, and reuse the existing receipt/audit mechanism rather than inventing a second receipt service. The recovery implementation must acquire the original and resolution operation locks in a deterministic order **before** the workspace lock, then reauthorize and check accepted/closed state. Add a narrowly scoped compound-lock helper if necessary while retaining existing single-operation behavior and old hashes. Do not wrap a lock-on-original call inside a callback that already holds the workspace lock. Tests must prove both race orders, repeated resolution, a late original after closure and denied access. This online reconciliation guard is not an offline command queue and stores no substitute full client payload.

Identity changes clear sensitive forms and must not expose another actor's operation pointers. Do not reuse an unresolved original ID for a different draft. Prevent background retries after user/session changes. Permission denial blocks disclosure and mutation even when a minimal local pointer exists.

## 10. Implementation work packages

Work sequentially through dependencies, preserving a working native path at each checkpoint. These are implementation packages within E5, not new parent scope IDs or an E7 increment. Do not stop after the first visual pass.

| Package | Work and exit evidence |
| --- | --- |
| S01 — current-code reconciliation | Read instructions/current state; inspect dirty worktree, concurrent ES-02/E1 work, route/shell/data/permission/migration boundaries; record source precedence and a concise gap/route/schema map. Capture proposed architecture decisions before selecting a new technology. |
| S02 — contracts and persistence | Define versioned manifests, scope bindings, draft/run/resolved-line/adoption/lineage models, command envelopes, errors, bounds, authorization and hashes. Add additive migration, deterministic fixtures, rollback-on-failure and upgrade proofs. Exit: authorized drafts persist/reload; unauthorized operations fail. |
| S03 — calculation/evidence engine | Port the bounded r03 registry and recovered semantics to typed pure code, including parameters/parts/diagnostics. Prove parity and boundaries with public synthetic fixtures. Exit: server preview returns all positions with evidence and explicit uncertainty. |
| S04 — native workbench | Implement all six views in the shared shell; input manifest, diagrams, parts working, pricing bridge, findings/coverage, history and responsive states. Exit: the estimator can configure, inspect and save a real review run without standalone storage or fake write gates. |
| S05 — safe rerun and receiving | Three-way configuration comparison plus independent target-estimate comparison; native money adapter, explicit limits, lineage on ordinary estimate saves, atomic adoption/receipts, source checks and synthetic eligibility. Exit: real synthetic estimate versions reflect only reviewed contributions; conflicts/cancel/retry behave correctly. |
| S06 — verification and handover | Complete meaningful unit/database/HTTP/browser/upgrade/access checks and visual review; record exact commit/environment/evidence; update maintained docs/status; prepare reviewable change with residual engineering decisions listed separately. |

### 10.1 Likely code anchors

Inspect and reuse `src/estimating/{math,validation,service,context,cost-basis-context,cost-basis-service,discovery-workspace-context}.ts`, `src/platform/{operations,permissions,database,errors}.ts`, the existing receipt dispatcher and document/Activity identity contracts. UI integration starts with `src/shell/secondary-menu.tsx`, current header slots/navigation and `src/app/desktop-shell.css`.

A cohesive `src/estimating/specialist/` domain folder is a reasonable proposed location for definition/types, field registry, engine, comparison, validation, scoped context, commands and read DTOs. Match actual repository organization instead of multiplying architecture layers. Keep renderer/UI state outside the pure engine and authorized service logic outside React components.

Source design code is under `docs/design/specialist/r03/`; issued HTML/report/changelog are under `docs/reference/ui/specialist/`. Use them as read-only sources. Do not add generated native code into the issued design snapshot or rewrite r01/r02/r03 to make tests pass.

### 10.2 Migration and compatibility obligations

Choose the next available migration from the actual current registry; the inspected main ended at 0029, but this plan does not reserve 0030. Preserve schema-1/2 cost lines, old version hashes, accepted receipts and issued source snapshots. Add scoped constraints/indexes and exact seed policy; no production migration or reset is authorized by this document alone.

Follow current AGENTS.md's global migration obligations: exact registry expectations in database field, finance-upgrade, offline, packs, planner and reports suites; `atVersion(N)` and upgrade lists in leads-projects integration; demo-upgrade counts and seed order. Inspect current files because these names/requirements may evolve. If altering `ppo.business_identities`, flush pending `ppo.identity_target` events with IMMEDIATE before the relevant ALTERs and restore DEFERRED afterward, as the repository requires; prove an upgrade across 0026 with estimates present.

If capabilities/grants change, regenerate access-review artifacts on LF bytes, update plain-English labels and pinned contract counts, and update quality/engineering grant allowlists plus estimating/demo upgrade evidence. Do not weaken existing tests to accept unauthorized grant drift. Preserve seed idempotence and the 0016 reserved migration gap.

### 10.3 Performance and observability

Debounce browser calculations and discard out-of-order preview responses using proposal identity. No stale asynchronous result may overwrite a newer input state. Scope and page register/history reads; index relationship/version lookups. Avoid a per-line database lookup for the 143-position result. Cap diagram rendering density while retaining exact numeric counts and disclose any visual thinning.

Record operation ID, command, outcome, duration and safe object references through existing observability conventions. Do not log full cost-bearing payloads, private workbook material, credentials or unauthorized record labels. Evidence should distinguish calculation latency, network latency and save latency. Establish measurements on the repo's actual test environment rather than inventing a production SLA.

### 10.4 Build verification commands

Recheck package scripts and supported runtime first. The inspected package declares Node 24.21.0 and npm 11.19.0; this work does not require a framework/runtime upgrade. Use the repository's lint, typecheck, unit, build, HTTP, browser and relevant database scripts. The database suites may run only against `ppo_synthetic_test`.

Retain the existing design checks as regression references where relevant: `node scripts/check-specialist-r03-model.mjs` and `node scripts/check-specialist-r03-browser.mjs`. These do not replace native application tests. Rebuilding the unchanged r02/r03 design is necessary only when verifying source generation or modifying its generator, not as a reason to rewrite issued evidence.

Run foundation/naming checks when the changed files require them; PP-01 prototype checks apply only if that package changes. A missing document renderer or hosted-only `ppo.demo_testers` relation may be an environment limitation: compare with unmodified main before calling it a regression, and report unexecuted checks honestly. Do not claim a pass from a skipped test.


### 10.5 Concrete implementation outputs and resumable delivery

S01 must produce a route/command/DTO map, entity/constraint map, field applicability/numeric contract and estimate-writer/receipt integration checklist, linked to the current code. S02 must prove a scoped Create → Save incomplete draft → Reload journey. S03 must supply a golden fixture manifest with independently authored expected intermediates and source references. S04 must deliver all six views, register/create flows and the action-state matrix. S05 must demonstrate exact contributions, source rebase, both three-way comparisons and recovery through reload. S06 must close the implementation checks with actual evidence or a precise, bounded limitation.

Use a maintained implementation checklist so a VS Code context restart can resume from recorded commit, files changed, last verified checkpoint and next dependency. The checklist is engineering handover, not an additional application feature. Do not broaden into every related module, write speculative live integrations, or finish with only a UI scaffold because the document is long.

Keep an additive migration and backward-compatible readers ahead of feature availability. A missing/mismatched schema returns a safe module-unavailable state rather than falling back to browser storage. Disable the module's navigation/entry if the compatible contract is unavailable; direct routes/API still enforce it. If rollback is needed during local development, disable the new entry points and preserve saved evidence rather than instructing a destructive database reset. Document any seed/migration that cannot be reversed automatically. No deployment authorization is implied.

Visual conformance evidence uses actual native captures and the adopted r22/shared-shell contract. Do not register an owner-approved screenshot baseline that has not been supplied or accepted. Preserve existing modules' registered baselines. Include review states and dense tables, not only a clean happy-path Configure view.

## 11. Acceptance and evidence matrix

The IDs below are derived implementation checks, **not new parent requirements**. They trace collectively to EST-06/E5, CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009. Preserve existing parent wording and add a precise requirement-to-test map in the repository when implementing. A planned test is not an executed pass.

| ID | Area | Required evidence | Verification |
| --- | --- | --- | --- |
| ES08-T01 | Scope and source | ES-08 remains Screen Systems within EST-06/E5; current route/contract reconciliation is recorded; no other calculator is implied. | Review |
| ES08-T02 | Native shell | All six views use actual logo, font, shared menu/header and current tokens; no duplicate rail, iframe or standalone shell. | Browser + visual |
| ES08-T03 | Header/menu | Global search/add centring, icon-only toggle, white active row, internal collapse boundary and 24 px strip survive all views. | Browser + visual |
| ES08-T04 | Responsive/accessibility | Target widths, 200% zoom, keyboard/focus/error summary/dialog return and diagram equivalents remain usable. | Browser + manual |
| ES08-T05 | Scoped navigation | Direct URL, list, detail, history, preview and export cannot reveal a forbidden configuration or reference. | HTTP + database |
| ES08-T06 | Source context | Exact workspace/alternative/revision/facility binding is enforced; unsaved discovery and fabricated system IDs are rejected. | Integration |
| ES08-T07 | Field completeness | 64 primary fields, five stable extra slots and typed dormant values follow the manifest; no 478-field questionnaire is invented. | Unit + browser |
| ES08-T08 | Input provenance | Recovered default, assumption, inherited evidence and user confirmation remain distinguishable. | Unit + browser |
| ES08-T09 | Exact lookup | Six cloth mappings work; 4.9, 5.1, 5.3, 2.1 and 6 withhold rather than interpolate. | Unit |
| ES08-T10 | Rounding order | Standard versus additional cloth rounding and boundary values match the explicit recovered rules. | Unit |
| ES08-T11 | Physical geometry | Wall-screen calculation width, physical footprint, odd bay and screen cut terms are distinguished. | Unit + visual |
| ES08-T12 | Drive identities | C99 Pinion diameter, C99 Cable location and C102 pipe diameter never overwrite or coerce each other. | Unit + browser |
| ES08-T13 | Pipe changes | 25/32/50 NB changes preserve r03 quantities/part behavior and show 32 NB untested status; stale helper copy is corrected. | Unit + browser |
| ES08-T14 | Source gaps | Motor-area omissions, Cable unavailable upper band, Pinion missing upper bound and broken motor selection are not presented as approved engineering. | Unit + review |
| ES08-T15 | Invalid arithmetic | Zero divisors, invalid counts, non-finite/overflow/negative derived values and impossible geometry produce stable diagnostics. | Unit |
| ES08-T16 | Parts registry | All 143 positions remain inspectable; five part outcomes, provisional mapping and 101-entry catalogue remain distinct. | Unit + browser |
| ES08-T17 | Part conflicts | 264/266/267/274 conflicts and missing truss clip variants remain unresolved; no description-based automatic replacement. | Unit |
| ES08-T18 | Manual quantities | All 14 positions retain reason/actor/basis; C273 stays manual; unresolved and explicit zero differ. | Unit + database |
| ES08-T19 | Manual review invalidation | Changing the relevant configuration/parameter basis marks all 14 for review while preserving their values. | Unit + browser |
| ES08-T20 | Gate semantics | Six source gates, estimator exclusion, no-purchase and quote presentation choices have separate effects and evidence. | Unit + integration |
| ES08-T21 | Parameters | All 12 snapshot correctly; eight bound changes affect their named consumers; four recorded-only values do not gain formulas. | Unit |
| ES08-T22 | Historical parity | Port the 28 default-equivalence scenarios and relevant r03 checks; report exact differences rather than blanket parity. | Unit + evidence |
| ES08-T23 | Pricing unknowns | Blank active required rate withholds complete total; explicit zero and no-purchase retain their stated semantics. | Unit + browser |
| ES08-T24 | Money policy | Recovered bridge and native AUD arithmetic are labelled separately; FX direction and rounding are explicit; no balancing line. | Unit + integration |
| ES08-T25 | Immutable evidence | Old runs retain inputs, descriptions, mappings, prices, warnings and hashes when current catalogue/parameters change. | Database |
| ES08-T26 | Durable draft | Save/reload works on the server; incomplete draft saves are distinguishable from valid run saves; no localStorage authority. | Database + browser |
| ES08-T27 | Preview authority | Tampered totals/eligibility/part IDs are rejected or recomputed; a changed proposal cannot save an old signature. | HTTP + unit |
| ES08-T28 | Run atomicity | Save review run commits exact draft/run/resolved state together; failure leaves prior state intact. | Database |
| ES08-T29 | Configuration rerun | Added/changed/unchanged/manual/removed/unmatched outcomes use B/C/N and stable keys, including a changed SKU. | Unit + browser |
| ES08-T30 | Resolved totals | Keep-current and retained-removed choices calculate actual resolved totals rather than the unmodified candidate. | Unit |
| ES08-T31 | Cancel | Cancelling either configuration or receiving comparison changes no business state. | Database + browser |
| ES08-T32 | Definition successor | Key/unit changes require reviewed mapping; old runs remain immutable and readable. | Unit + database |
| ES08-T33 | Copy/archive | New alternative copy gets new identity/provenance without adoption links; archive preserves all history and cost references. | Database |
| ES08-T34 | Estimate separation | Saving/recalculating does not change saved costs, alternative selection, discovery adoption or quote output. | Database + browser |
| ES08-T35 | Receiving eligibility | Recovered review remains usable; synthetic receiving works only under server-owned synthetic policy; client bypass fails. | HTTP + database |
| ES08-T36 | Exact cost basis | Wrong/incomplete/unselected/replaced discovery basis and legacy unbound target block receiving without hiding historical permitted reads. | Database |
| ES08-T37 | Line capacity | 100 resulting target lines succeed if otherwise valid; 101 fail atomically, including manual/other-configuration lines in the count. | Database |
| ES08-T38 | Precision/units | Unrepresentable quantity or missing conversion fails; evidenced conversion shows delta; zero/unresolved positions never become invalid cost lines. | Unit + database |
| ES08-T39 | Receiving money fields | Categories/allowance/source/date/AUD precision/sell-below-cost follow current validators; private or guessed rates are absent. | Unit + HTTP |
| ES08-T40 | Target manual edits | Three-way estimate comparison detects manual quantity, unit, description, category, allowance, price and source edits. | Unit + browser |
| ES08-T41 | Contribution ownership | Other configurations/manual lines retain IDs/content; same configuration cannot duplicate itself per area or repeated apply. | Database |
| ES08-T42 | Retained removal | Retained removed contribution has explicit manual ownership; reappearance requires reconciliation and does not duplicate it. | Unit + database |
| ES08-T43 | Ordinary estimate save | Lineage copies into a manual saved successor by line ID; altered values remain visible against the adopted baseline. | Database |
| ES08-T44 | Adoption transaction | New estimate version, exact discovery basis, complete lineage, receipt and audit commit atomically. | Database |
| ES08-T45 | Concurrent adoption | Two writers cannot overwrite contributions; changed target/configuration versions force renewed comparison. | Database |
| ES08-T46 | Idempotency | Same operation/payload returns original result; changed payload fails; no-change same-run apply avoids spurious duplicate versions. | Database + HTTP |
| ES08-T47 | Unknown outcome | Lost response is reconciled through original operation before further write; no second operation bypass. | Browser + HTTP |
| ES08-T48 | Permission loss | Revoked access clears sensitive state and refuses old receipt/export/working-detail access. | HTTP + browser |
| ES08-T49 | Locked contexts | Owner, whole-group Draft and current estimate locks are enforced on services, not only buttons. | Database + HTTP |
| ES08-T50 | Redaction | Public fixtures, coverage, exports, logs and errors contain no private workbook prices, quotes or credentials. | Review + targeted test |
| ES08-T51 | Snapshot export | Authorized export identifies schema, exact scope/run/definition, units, warnings and synthetic status; it is not an ERP import. | HTTP + browser |
| ES08-T52 | Freshness/races | Out-of-order previews cannot overwrite newer results; source withdrawal and stale totals have explicit states. | Unit + browser |
| ES08-T53 | Bounds | Full-envelope request limit, unknown keys/schema, overlong strings, excessive arrays and duplicate keys reject without truncation. | HTTP + unit |
| ES08-T54 | Upgrade/replay | Fresh and cross-0026 upgrade paths, seeds, old cost hashes and receipts remain valid; all registry/grant consumers are updated. | Database + upgrade |
| ES08-T55 | Visual evidence | Configure, parts working, pricing separation, rerun conflicts, history and read-only/error states are inspected at actual native sizes. | Visual |
| ES08-T56 | Handover accuracy | Evidence identifies actual commit, environment, commands, pass/fail/not-run and residual decisions; no production/engineering approval claim. | Review |

| ES08-T57 | Transport contract | Specialist preview/write accept a valid body above 64 KiB within 256 KiB; raw or canonical oversize is refused; existing routes retain 64 KiB. Multibyte bytes are counted. | HTTP |
| ES08-T58 | Identity and receipt dispatch | Every new aggregate command registers the correct identity and can recover through the real shared dispatcher; no generic shared-record fallback. | Database + HTTP |
| ES08-T59 | Accepted-source authorization | Adoption receipt GET/replay checks accepted estimate and configuration sources under current permission; later pointers do not substitute newer evidence. | Database + HTTP |
| ES08-T60 | Replay and lock order | Replay of an accepted original after permitted selection/archive changes returns the original; revocation denies it; mixed writers use one established lock order. | Database |
| ES08-T61 | Raw incomplete drafts | Blank, incomplete numeric text and an invalid hidden scalar can save/reload as incomplete draft; malformed structure/references still fail. | HTTP + browser |
| ES08-T62 | Validation and hashes | Raw, normalized, parameter-basis, proposal and evidence hashes have explicit roles; percentage normalization happens once; inactive validation remains discoverable. | Unit |
| ES08-T63 | Deleted contribution | A cost/configuration line removed since its baseline is not auto-restored when a rerun generates it; explicit Keep omitted/Restore decisions are required. | Unit + browser |
| ES08-T64 | Unchanged money/new provenance | A newer run or mapping/basis with identical amounts creates new accepted evidence; an entirely equivalent reapply does not add a business version. | Database |
| ES08-T65 | Immutable resolved sets | Unsaved overrides cannot be adopted; exact resolved-set revision/hash is rechecked at commit and retained by every adoption. | Database + HTTP |
| ES08-T66 | Lineage integrity | Sidecar/manifest hash or version/basis mismatch blocks reuse; old versions without lineage remain explicitly legacy and retain old hashes. | Database |
| ES08-T67 | All estimate writers | Ordinary saves and new discovery-cost adoption carry lineage by stable line ID, preserve deletions and mark retained older-basis contributions for review. | Database |
| ES08-T68 | Identity/unit override conflict | A kept old quantity cannot attach silently to a replacement SKU/unit; explicit retention or evidenced conversion is required. | Unit |
| ES08-T69 | Source rebase | Same-alternative rebase compares facts/coverage and saves new binding/draft only; cross-alternative copying remaps identities and carries no adoption links. | Integration + browser |
| ES08-T70 | Synthetic eligibility manifest | Exact seeded valid and changed cases receive successfully; altered branch/parameter/policy/fixture context cannot bypass eligibility by setting synthetic flags. | Unit + HTTP |
| ES08-T71 | Action/state contract | Draft, calculation, manual review, price completeness, eligibility and adoption states produce the specified enabled actions and blocker text. | Browser |
| ES08-T72 | Recovery after reload | A non-sensitive original-operation pointer survives the supported remount/reload path; no payload cache, duplicate intent or indefinitely stranded recovery. | Browser + HTTP |
| ES08-T73 | Recovery-not-found ambiguity | 404/timeout/denied lookup does not imply non-commit; accepted-versus-closure races resolve once, and a late original after terminal closure cannot execute. | Database + HTTP |
| ES08-T74 | Downstream quote separation | New adoption leaves existing quote/document bound to its earlier version; new quote preparation rechecks exact line choices and does not leak technical/internal fields. | Integration |
| ES08-T75 | Safe output and cache | Evidence export/print identifies exact run/policy/review status; customer-safe projections, service-worker behavior and identity change do not leak internal costs. | HTTP + browser |
| ES08-T76 | Hand-derived geometry | Appendix E geometry/cut/spacing/area values are independently asserted; they are not read from the engine during expected-value generation. | Unit |
| ES08-T77 | Rounding boundary pack | Additional versus standard cut order and exact torque thresholds include just-below/at/just-above values under the declared decimal contract. | Unit |
| ES08-T78 | Native receiving example | Keep current, Use proposal and Keep omitted produce Appendix E quantities/totals and unchanged unrelated-line IDs. | Unit + integration |
| ES08-T79 | Envelope/security boundaries | Strict shapes, bounded raw strings, key allowlists/depth, cross-company IDs and prototype-like payload keys cannot bypass validation or cause unbounded processing. | HTTP + unit |
| ES08-T80 | Date-stable complete fixtures | Fixture catalogue includes valid receive, conflict, deletion, rebase, unknown outcome and permission loss; future-required dates use the adopted repository date policy. | Integration + review |


Use meaningful behavior tests rather than snapshots that merely duplicate implementation. The suite must cover relevant branch/boundary combinations with authored expected results and provenance, not only outputs generated by the same engine under test. The original workbook's two quote-specific cached differences and untested branches remain limitations; no test-count total closes them.

Screenshots should include the native route/context and identify the tested commit/viewport. Inspect text legibility, table edges/columns, diagrams, source labels, status restraint, menu/panel geometry and action placement. Automated accessibility checks support, but do not replace, keyboard/focus and visual inspection.


## 12. Decisions that remain separate from build completion

| Decision area | Current disposition / required owner evidence | Effect on initial build |
| --- | --- | --- |
| Engineering ranges and branch validity | Recovered limits are not approved ranges; accepted boundary examples and scope-specific engineering decisions remain required. | Native review works; operational eligibility stays withheld. |
| Manual quantities and six legacy gates | Preserve 14 explicit allowances and six recorded gates until replacement rules are validated. | Build reviews/invalidation; do not guess formulas. |
| Part identity, unit/stock conversion and motor mapping | Provisional 101-part extract and conflict candidates require catalogue/engineering review. | Inspect all outcomes; block unresolved active receiving contributions. |
| Commercial policy | Historical FX/freight/discount/rounding and incomplete installation rules are not current production pricing policy. | Preserve illustrative bridge; synthetic native receiving uses explicit reviewed AUD proposal. |
| Wider calculator families | Further families require independent versioned definitions and accepted examples. | No generic placeholders masquerading as finished calculators. |
| Source authority | Private normalized r02 workbook/rules report and secondary r04 evidence remain separately controlled. | Use sanitized public metadata and synthetic fixtures; do not publish raw evidence. |

These are scoped product/source decisions, not a reason to stop independent native implementation or repeatedly request approval for routine coding. Complete the review and synthetic receiving lanes with honest limitations. If an unavailable dependency blocks one affected path, expose the precise reason and complete the other authorized work.

### 12.1 Definition of done

The authorized initial scope is complete when all six native views operate against real scoped server records; recovered calculations and uncertainty are traceable; drafts and runs persist with correct identities; both rerun comparisons preserve manual work; synthetic receiving demonstrably creates the exact intended estimate successor atomically; old estimates/discovery/history remain compatible; required checks and visual review are evidenced; and maintained documentation identifies remaining source approvals honestly.

Handover must include changed files/architecture and migrations, source/bundle identities, native routes and deterministic demo steps, verification table with failures/limitations, screenshots, parent-ID traceability, unresolved engineering/catalogue/commercial decisions and proposed next work. Distinguish implemented, verified, owner-accepted and operationally eligible. Prepare a reviewable branch/PR according to current repository instructions; do not merge, deploy, connect production systems or perform business transactions without separate authorization.

### 12.2 Suggested demonstration

1. Open a synthetic Northbank Screen Systems configuration linked to an exact saved alternative/discovery scope. The fixture context is explicitly synthetic and is not silently borrowed from the ES-02 climate example.
2. Inspect geometry, cloth cut and part working; select an untested variant and see its evidence notice.
3. Change one bay or parameter; observe stale preview/manual reviews. Review the 14 allowances and save a durable review run.
4. Preview native estimate receiving with explicit supported AUD prices/conversions. Review the price-policy difference and apply; inspect exact run/line provenance from the resulting estimate version.
5. Manually edit one contributed estimate line. Rerun the configuration, retain that edit in the receiving comparison and verify unrelated lines are unchanged.
6. Exercise cancel, changed target version, lost response recovery, line-cap/precision refusal, locked context and read-only viewer. Show immutable earlier runs and no automatic repricing.


## Appendix A. r03 primary input inventory

This table was extracted from the inspected r03 model, not inferred from screenshots. IDs are source implementation keys for traceability; final native naming must follow PPO conventions with an explicit mapping. Listed defaults are **synthetic/recovered design defaults**, not confirmed requirements or approved engineering/commercial values. Numeric technical limits, applicability and cross-field checks are governed by sections 4–6. The five additional-screen slots add count, length, overhang and width inputs plus material attribution.

| Group | Source key | Label | Unit / choices | Source cell | Design default |
| --- | --- | --- | --- | --- | --- |
| Greenhouse | `spans` | Physical spans | count | C24 | 6 |
| Greenhouse | `wallSpans` | Extra wall-screen spans | count | G24 | 0 |
| Greenhouse | `span` | Span width | m | G25 | 6.4 |
| Greenhouse | `bays` | Bays along length | count | C26 | 12 |
| Greenhouse | `bay` | Bay length | m | G26 | 4 |
| Greenhouse | `odd` | Extra-long bay | No / Yes | C27 | No |
| Greenhouse | `truss` | Truss shape | SQUARE / ROUND | C30 | SQUARE |
| Greenhouse | `chordHeight` | Truss chord height | 20 / 25 / 30 / 35 / 40 / 50 / 60 | G30 | 30 |
| Greenhouse | `height` | Height to screen | m | C31 | 3.5 |
| Greenhouse | `roof` | Roof profile | Gable / Arch / Venlo | Drawing only; no source cell | Gable |
| Cloth & edges | `overhang` | Overhang at each end | m | C67 | 0.3 |
| Cloth & edges | `shrink` | Shrinkage allowance | % | G67 | 1 |
| Cloth & edges | `individual` | Individual screens per span | No / Yes | C68 | No |
| Cloth & edges | `seals` | Include edge seals | No / Yes | C69 | No |
| Cloth & edges | `wider` | Cut from wider sheet | No / Yes | C71 | No |
| Cloth & edges | `sheet` | Wider sheet width | m | G71 | 4.7 |
| Cloth & edges | `edge` | Overhang fixing | Hooks / Weights / Blackout | C73 | Hooks |
| Cloth & edges | `hookSpacing` | Edge clip spacing | m | G73 | 0.4 |
| Cloth & edges | `leading` | Leading edge | Tube - Alum / Tube - Steel / Profile | C63 | Tube - Alum |
| Bed & wire | `bed` | Bed fastening | Crosswire / Truss Clip | C43 | Crosswire |
| Bed & wire | `supports` | Crosswire supports per bay | count | C44 | 1 |
| Bed & wire | `strainers` | Strainers per crosswire | count | C47 | 1 |
| Bed & wire | `replaceLS` | Replace LS wire | No / Yes | C59 | No |
| Bed & wire | `roll` | LS wire roll length | m/roll | G58 | 1700 |
| Bed & wire | `spares` | LS wire spare allowance | % | G211 | 1 |
| Bed & wire | `twine` | Baling twine | No / Yes | G53 | Yes |
| Bed & wire | `footy` | Oval edge-wire clamps | No / Yes | C55 | No |
| Bed & wire | `crossClips` | Crosswire clips | No / Yes | C56 | No |
| Bed & wire | `crossSpacing` | Crosswire clip spacing | m | G56 | 0.8 |
| Bed & wire | `plates` | Edge-wire plates | No / Yes | C52 | No |
| Bed & wire | `omega` | Omega strips for edge wires | No / Yes | G59 | No |
| Drive & motors | `drive` | Drive family | Pinion / Cable | C95 | Pinion |
| Drive & motors | `diameter` | Pinion tube diameter | 27 / 32 | C99 | 27 |
| Drive & motors | `cableLocation` | Cable drive location | Central / End | C99 | Central |
| Drive & motors | `pipeDiameter` | Drive pipe diameter | 25 / 32 / 50 | C102 | 25 |
| Drive & motors | `across` | Motor groups across | count | C88 | 2 |
| Drive & motors | `down` | Motor groups along | count | C89 | 1 |
| Drive & motors | `spacing` | Target drive spacing | m | C97 | 4 |
| Drive & motors | `droppers` | Central-drive droppers | No / Yes | C103 | No |
| Drive & motors | `dropPerSpan` | Droppers per calculation span | count | C104 | 1 |
| Drive & motors | `dropPerStock` | Droppers per 8 m stock | count | G103 | 2 |
| Drive & motors | `dropStrainers` | Strainers per dropper | count | C105 | 2 |
| Drive & motors | `dropWire` | Wire per dropper | m | G105 | 10 |
| Drive & motors | `delay` | Delay units | No / Yes | C108 | No |
| Drive & motors | `wallPulleys` | Wall pulleys | No / Yes | G108 | No |
| Drive & motors | `motors` | Supply motors and switchgear | No / Yes | E295 | No |
| Supports & tape | `endBeams` | Supply end beams | No / Yes | C37 | No |
| Supports & tape | `braces` | End braces | No / Yes | C40 | No |
| Supports & tape | `braceLength` | Brace length | m | C41 | 4 |
| Supports & tape | `chain` | Support chain | No / Yes | C42 | No |
| Supports & tape | `chainLength` | Chain per span | m | G42 | 3.5 |
| Supports & tape | `internalOmega` | Internal omega brackets per span | count | C39 | 2 |
| Supports & tape | `externalOmega` | External omega brackets per span | count | G39 | 0 |
| Supports & tape | `extraTeks` | Extra LS-wire fixing screws | No / Yes | G38 | No |
| Supports & tape | `tape` | Double-sided tape | No / Yes | C75 | No |
| Supports & tape | `tapeRolls` | Tape rolls of 50 m | count | G75 | 0 |
| Commercial | `fx` | Quoted exchange rate | EUR/AUD | C211 | 0.60 |
| Commercial | `discount` | Materials discount | % | C389 | 10 |
| Commercial | `freight` | Include transport | No / Yes | E355 | No |
| Commercial | `seaCost` | Sea-freight cost | AUD | G203 | 500 |
| Commercial | `seaMargin` | Sea-freight gross margin | % | C204 | 15 |
| Commercial | `localCost` | Local-freight cost | AUD | G208 | 120 |
| Commercial | `localSell` | Local-freight sell | AUD | G209 | 160 |
| Commercial | `installation` | Include installation | No / Yes | C152 | No |

Do not copy source helper text that conflicts with recorded r03 changes. In particular, the drive-pipe note must describe quantity effects correctly; the default 25 NB case, not every diameter, preserves r02 equivalence.


## Appendix B. Parameter behavior registry

Defaults are recovered design values and must not be promoted to approved limits. Every change is reasoned, attributed, versioned and included in the run signature. Consumer text governs applicability; similarity of constants does not authorize rebinding other formulas.

| Parameter | Default / unit | Behavior | Bound consumer or limitation |
| --- | --- | --- | --- |
| `odd_bay_default_m` | 4 metres | Bound | Physical length and every length-driven quantity |
| `end_beam_divisor` | 8 divisor | Bound | CE-LINE-250 end-beam stock |
| `crosswire_waste_factor` | 1.05 factor | Recorded only | Legacy use is the crosswire length helper G43, which this bounded model does not calculate. Other 5% allowances (C243, C248) are separate literals and are not rebound. |
| `baling_twine_factor` | 1.2 factor | Bound | CE-LINE-260 baling twine rolls |
| `ls_wire_spacing_m` | 0.4 metres | Bound | Bottom LS wire count C61, used by CE-LINE-243 crimps and the extra-screw allowance in CE-LINE-277; CE-LINE-247 truss clips, with CE-LINE-248 following 247 |
| `cloth_markup_divisor` | 0.45 divisor | Recorded only | Cloth sell price derivation. This workbench prices cloth with synthetic SYN-PRICE-02 rates, so the constant is recorded but not applied. |
| `cloth_fx_uplift` | 1.2 factor | Recorded only | Cloth cost FX uplift. Not applied for the same reason as the cloth markup divisor. |
| `cable_size_band_1` | 100 Nm | Bound | Recovered Cable torque result for the first area band (below 600 m²) |
| `drive_span_deduction_m` | 0.8 metres | Bound | Drive spacing, drive positions and every drive-count quantity |
| `delay_unit_interval_m` | 50 metres | Bound | CE-LINE-293 delay units |
| `crosswire_clip_spare` | 20 count | Bound | CE-LINE-247 truss clips, with CE-LINE-248 following 247 |
| `drum_spare_factor` | 1.04 factor | Recorded only | Legacy use is a formula at C273 in the r04 workbook. In the authoritative r02 register C273 is one of the 14 manual quantities, so no formula is adopted. |


## Appendix C. Source register and companion references

The following GitHub links are pinned to the inspected commit. They document the starting point; implement against the actual current checkout after reconciliation.

| Source | Role |
| --- | --- |
| [Repository instructions](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/AGENTS.md) | Authority, synthetic scope, migrations, grants and verification. |
| [Current status](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/docs/STATUS.md) | Current native implementation context; recheck before coding. |
| [Estimating blueprint](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/docs/blueprints/BP-04-estimating-quotation.md) | EST-06/E5, configuration/rerun/receiving and permission boundaries. |
| [Page coverage audit r04](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md) | Current ES-08 module identity and initial family. |
| [Specialist decision record](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/docs/decisions/specialist-screen-systems-design.md) | Recovered source scope and unresolved acceptance. |
| [Workbench report r02](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/docs/reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Report-r02.md) | Main design narrative, rule findings, manual review and receiving contracts. |
| [Workbench changelog r03](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/docs/reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Changelog-r03.md) | Owner-resolved identities, parameter/part/diagram changes and conflicts. |
| [r03 calculation model](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/docs/design/specialist/r03/model.js) | Actual fields, quantity/price logic, comparison and local review behavior. |
| [r03 catalogue extract](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/docs/design/specialist/r03/catalogue.js) | Provisional part rules, 12 parameters and historical coverage; no prices. |
| [r03 historical evidence](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/docs/testing/evidence/specialist-r03/README.md) | Prior bounded model/browser evidence and its environment limitations. |
| [Native estimate validation](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/estimating/validation.ts) | 100-line limit, three-decimal positive quantities, amount/category/source/date rules. |
| [Native money policy](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/estimating/math.ts) | Exact decimal E1 arithmetic and quotation presentation. |
| [Native estimate service](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/estimating/service.ts) | Saved versions, hashes, receipts and copied discovery basis. |
| [Discovery cost context](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/estimating/cost-basis-context.ts) | Exact saved scope basis and current access/evidence checks. |
| [Discovery cost adoption](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/estimating/cost-basis-service.ts) | Selected Active Complete source and explicit adoption transaction. |
| [Shared secondary menu](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/shell/secondary-menu.tsx) | Dock/overlay, toggle, collapse strip and focus behavior. |
| [Current shell CSS](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/app/desktop-shell.css) | PR #271-era shell geometry, typography and header group positioning. |
| [Native navigation](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/shell/navigation.ts) | Current Estimating destinations and shared navigation conventions. |
| [Migration registry](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/scripts/migration-registry.ts) | Current additive migration/seed track; do not reserve a stale number. |
| [Runtime scripts](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/package.json) | Actual runtime and verification scripts at the inspected commit. |

| [Shared operation transaction](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/platform/operations.ts) | Actual lock order, authorization before replay, canonical operation hash and atomic receipt/audit/outbox. |
| [Shared command HTTP wrapper](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/shared/http.ts) | Actual 64 KiB command body limit and receipt HTTP response contract. |
| [HTTP body and error boundary](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/platform/http.ts) | Streamed byte limit, gateway/Origin/content type, identity, no-store and error envelope. |
| [Shared receipt dispatcher](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/shared/receipts.ts) | Typed identity dispatch and additional authority needed for specialist originals. |
| [Estimate and accepted-version authority](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/estimating/context.ts) | Owner/read/edit conditions and exact accepted estimate version on recovery. |
| [Discovery workspace authority](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/estimating/discovery-workspace-context.ts) | Workspace owner, option/revision relationships and historical source authority. |
| [Cost adoption request validation](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/estimating/cost-basis-validation.ts) | Current complete canonical 64 KiB costing envelope and existing version/source checks. |
| [Client resource and command state](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/components/crm-state.ts) | In-memory pending intent, original-operation retry, permission-loss clearing and stale-read handling. |
| [Discovery POST preview wrapper](https://github.com/deanrfiedler-gif/powerplants-one/blob/8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b/src/estimating/discovery-http.ts) | Read-only preview still uses identity/Origin/body checks; no business receipt. |


The supplied/current `PPO-Specialist-Configuration-Workbench-r03.html` was read as source. Its evidence record identifies the historical issued SHA-256 `3cc832c3368f5b7ac9eb3352eee0fc3525e5220984214eb6c459c6ae2fb79881`; this plan does not assert a new byte-for-byte hash verification or native visual acceptance. The r22 theme board and current app govern the native appearance rather than the HTML's older r20 shell.

Relevant companion work: `PPO-ES-02-Estimation-Wizard-Discovery-Alternatives-and-Revisions-Refinement-Build-Plan-r04.md` and its implementation prompt r03. These propose structured discovery refinements; reconcile their actual deployment status rather than assuming a document has changed the database. The ES-02 climate fixture and the Screen Systems replacement-study fixture are different examples and must not have their totals/counts merged.

Traceability retained: **ES-08; EST-06; E5; CRE-13–CRE-17; EA-16/17; AT-04/28; G06; D-009**. Received formula evidence advances the source position; it does not close G06 or certify the recovered definition.


## Appendix D. Native contract shapes and validation detail

These are normative semantic shapes, not a claim that the exact TypeScript declarations exist. Use existing PPO naming/schema conventions; document any equivalent implementation. UUIDs and hashes below are types/placeholders, not fabricated real records. Do not paste them into production fixtures.

### D1. Ownership, identifiers and bounds

| Value | Contract |
| --- | --- |
| Server context | Actor, tenant/workspace and effective grants come from authenticated Principal. Company/alternative/source relationships are resolved server-side. |
| Source binding | Estimating-workspace UUID, alternative UUID, Discovery-revision UUID, scope/answer-snapshot UUIDs, source/content/context hashes, Site and explicit Facility/area/system references supported by the deployed schema. |
| Configuration name | Required trimmed single-line text, 1–200 characters. No user-entered identity replaces its stable UUID/display number. |
| Scalar draft input | One allowed field key from the 64-field schema; raw text at most 300 characters, no arbitrary control characters. Known categorical choices are explicit; blank is a missing draft choice. |
| Normalized numeric input | Exact decimal value with canonical unit or Missing/Invalid state. Up to six fractional places in recovered input; no exponent, locale grouping, NaN or Infinity in canonical values. UI localization must normalize explicitly before validation. |
| General reason | 1–1,000 characters using the existing reason contract; multiline notes use an explicit bounded narrative field rather than silently widening reason semantics. |
| Draft counts | Exactly the family schema's field/parameter IDs; at most five extra slots, 14 manual positions, six source gates and 143 position exclusions/decisions. Each stable key occurs once. |
| Target result | Entire native estimate remains at most 100 lines; no independently unbounded manual/adoption array. |
| Response/pagination | Register/history page ≤50; stable scoped cursor; working rows remain a bounded 143-position set. Do not return every full run snapshot with every history row. |
| Schema bounds | Reject unrecognized object keys, excessive depth and wrong primitive types before computational hashing. Establish a small schema-appropriate depth limit in validation and test it; do not run a general evaluator on any user text. |

A request may contain a source reference and an observed version/hash, but the server resolves and checks it. User text cannot establish a catalogue match, evidence classification, approval, actor or effective price date. User-chosen price dates must be valid dates with explicit synthetic/source provenance, not server-invented historical dates.

### D2. Calculation-validation registry

Retain the r03 recovery rules below. They are technical validity/parity rules, **not approved operating limits**. All other enumerations are in Appendix A; parameters and consumers are in Appendix B.

| Field set | Calculation constraint |
| --- | --- |
| All numeric primary fields | Non-negative decimal, ≤1,000,000, at most six fractional places; missing/invalid raw input blocks calculation. |
| Count-unit fields | Whole non-negative integer within the same ceiling. Preserve zero where the source permits it. |
| `spans, span, bays, bay, roll, across, down, spacing, hookSpacing, crossSpacing, dropPerStock, fx` | Strictly greater than zero. |
| `shrink, seaMargin` | 0 ≤ value <100 percentage points, including denominator checks after normalization. |
| `discount, spares` | 0–100 percentage points inclusive in this recovered model. |
| `bay` | Exact six-value cloth lookup only. Numeric-equivalent entry such as 4.00 normalizes to 4 before lookup. |
| `sheet` when `wider=Yes` | At least the exact looked-up cloth width. |
| Extra slots | All four stored values satisfy bounded numeric grammar; count is whole. Count>0 requires length>0 and width>0. Count=0 is inactive without erasing the other values. |
| All 12 parameter values | Positive decimal, ≤1,000,000, ≤six fractional places, with reason/provenance; applicability remains Bound/Recorded only. Do not invent approved tolerances. |
| Manual quantity | Explicit Unresolved or non-negative bounded six-decimal value with current review basis/reason. Zero is explicit. |
| Geometry-derived guards | Available drive width >0; rounded drive spaces >0; standard screen count ≥0; every derived value finite and within the stated engine output limit. |
| Source position output | Non-negative finite quantity ≤10^12 in the recovered preview, or explicit Unavailable. Receiving has much narrower native quantity/precision bounds. |
| Primitive rate proposal | Recovered illustrative cost/sell may be blank or non-negative bounded six-decimal value with known AUD/EUR treatment; receiving requires native AUD amount precision and policy independently. |

Do not infer that an output of `each` must be integral if the recovered rule produces a fraction: preserve the result as evidence, identify the unit/rounding issue and require a receiving policy. Do not silently round the source engine to procurement packaging. Separate normalized fraction (e.g. shrink 1% → 0.01) from the source model's percentage-point interface; an adapter must convert exactly once.

### D3. Draft, preview and saved evidence

```ts
// Semantic contract; map to actual PPO UUID/hash/decimal conventions.
type DraftValue = {
  raw: string;
  attribution: { kind: "entered" | "inherited" | "recovered-default" | "assumption";
    sourceRef?: PermittedSourceRef; note?: string };
};
type SpecialistDraftProposal = {
  schema_version: 1;
  definition_bundle_id: UUID;
  definition_bundle_hash: SHA256;
  inputs: Record<AllowedFieldId, DraftValue>;
  extra_screens: ExtraScreenProposal[];
  parameters: Record<AllowedParameterId, ParameterProposal>;
  manual_quantities: Record<AllowedManualPosition, ManualReviewProposal>;
  gates: Record<AllowedGate, GateProposal>;
  exclusions: PositionExclusionProposal[];
  illustrative_prices: IllustrativePriceProposal[];
};
type PreviewFacts = {
  proposal_signature: SHA256;
  expected_configuration_version: PositiveInteger;
  source_binding: ExactSourceBinding;
  calculation_state: "Invalid" | "Current";
  normalized_inputs: NormalizedInput[];
  positions: PositionResult[]; // full 143-position evidence when calculation succeeds
  diagnostics: Diagnostic[];
  manual_review_required: StablePositionKey[];
  illustrative_price_result: PriceResult;
};
```

The named supporting types must be explicitly defined in the implementation; they are not `any`, arbitrary JSON or client-trusted authority. An invalid preview returns field diagnostics and no misleading current numeric result. A previous result may remain visible only as explicitly stale reference.

Use three separately named hashes: **calculation-input hash** for normalized computational inputs and exact bundle/parameters; **proposal signature** for the complete reviewed raw proposal, source/version expectations, decisions, exclusions and price/mapping proposal; **evidence hash** for the immutable saved snapshot with provenance/actor/time. Manual-review basis follows the conservative recovered noncommercial basis, not the current UI tab or a timestamp. The existing operation-payload hash remains the shared platform hash; do not replace its canonical algorithm globally. Cosmetic numeric reformatting can preserve the calculation-input hash while requiring a new exact proposal signature if raw evidence changed.

### D4. Receiving command and response

```ts
type ApplySpecialistConfigurationInput = {
  operation_id: UUID;
  schema_version: 1;
  reason: string;
  expected_configuration_version: PositiveInteger;
  expected_workspace_version: PositiveInteger;
  expected_estimate_version: PositiveInteger; // existing bound estimate only
  run_id: UUID;
  resolved_set_id: UUID;
  resolved_set_hash: SHA256;
  estimate_id: UUID;
  estimate_version_id: UUID;
  discovery_revision_id: UUID;
  source_context_hash: SHA256;
  receiving_policy_id: PolicyId;
  receiving_policy_hash: SHA256;
  proposal_signature: SHA256;
  decisions: ReceivingDecision[];
  price_and_unit_proposals: ReviewedNativeLineProposal[];
};
```

The configuration ID comes from the authorized route/command target; every submitted ID is cross-checked against it. The body contains no trusted `operationalReady`, `approved`, `actor_id`, computed totals or arbitrary complete replacement lines. The server reconstructs the full result from the pinned current estimate, immutable run/resolved set and explicit reviewed decisions/price proposals. Prices are still untrusted user input until scope, provenance and native policy validation pass.

Return the existing OperationReceipt envelope. Fetch the committed result through an authorized read, not a client-side assumption that the preview became the saved version. Audit details retain result version/run/adoption IDs for recovery. Expected version zero is not used here to create a first estimate: use the existing explicit discovery-costing path first. This keeps first-estimate identity creation out of the specialist receiver.

Preview may return structured blockers without exposing forbidden records. Examples: target not yet created; wrong saved basis; unreviewed manual position; unresolved part/unit; price missing; cap exceeded; unsupported precision; outside synthetic policy; changed source; pending original operation. Every blocker names a real permitted resolution path or an honestly unavailable dependency.



## Appendix E. Independent synthetic worked examples and fixture pack

These examples are authored verification fixtures, not historical quote values or engineering acceptance. They test stated recovered arithmetic and native receiving behavior independently. Expected values must be committed as reviewed literals/rational derivations, not obtained by calling the implementation under test.

### E1. Geometry and cloth example

Use 6 physical spans at 6.4 m; no extra wall spans; 12 bays at 4 m; no odd bay; 2 motor groups across and 1 along; grouped rather than individual screens; shrinkage 1%; overhang 0.3 m at each end; drive-spacing target 4 m; drive-span deduction 0.8 m. Additional-screen counts are zero. Other retained inputs follow a declared synthetic fixture; this table validates geometry only and does not make an entire receiving pack approved.

| Result | Hand derivation | Expected |
| --- | --- | --- |
| Physical width | 6 × 6.4 | 38.4 m |
| Physical length | 12 × 4 | 48 m |
| Unrounded footprint | 38.4 × 48 | 1,843.2 m² |
| Recovered floor-area result | floor(1,843.2) | 1,843 m² |
| Group width | 38.4 ÷ 2 | 19.2 m |
| Standard screen count | 12 × 2 | 24 |
| Standard cut | ceil to 0.1 m of (19.2 ÷ 0.99 + 0.6) | 20.0 m |
| Exact cloth width | lookup(4 m) | 4.3 m |
| Standard cloth area | 24 × 20 × 4.3 | 2,064 m² |
| Available drive width | 19.2 − 0.8 | 18.4 m |
| Drive spaces | round(18.4 ÷ 4) = round(4.6) | 5 |
| Actual drive spacing | 18.4 ÷ 5 | 3.68 m |
| Total drive positions | (5+1) × 2 × 1 | 12 |
| Legacy area per motor | 2,064 ÷ (2 × 1) | 1,032 m² |
| Recovered torque comparison | 1,032 is below Pinion 1,800; Cable is in 600–<1,800 band | Pinion 100 Nm; Cable 300 Nm; neither is approved motor sizing |

Test the relevant recovered torque boundaries independently, including Cable 600, 1,800, 2,400 and 5,800 m² and Pinion 1,800, 5,900 and 7,000 m², with just-below/at/just-above values representable by the chosen numeric contract. Cable ≥5,800 yields Unavailable; Pinion ≥7,000 retains its source 800 Nm comparison plus missing-upper-limit uncertainty. Changing the first Cable Nm parameter must not change the Pinion first band or area thresholds.

### E2. Rounding order example

For one **additional** screen with entered length 1 m, shrinkage 10%, overhang 0.02 m at each end and width 2 m: 1 ÷ 0.9 = 1.111…; round upward to 0.1 m → 1.2; then add 0.04 → 1.24 m cut; area = **2.48 m²**. If the overhang were incorrectly added before rounding, the area would be 2.40 m². Assert 2.48 for this additional-screen arithmetic test. This is a rounding-unit test, not a complete valid greenhouse configuration.

### E3. Native exact-money example

For native quantity `1.005`, unit cost `1.00` and unit sell `2.00` AUD: exact extended cost is 1.005 AUD, rounded half-up to **1.01**; extended sell is **2.01**. This verifies native three-decimal quantity/two-decimal rate arithmetic. An input quantity `1.0004` is not silently reduced to `1.000`; it requires an explicit supported conversion/precision decision or is refused. Do not use the historical upward-$10 bridge for these native amounts.

### E4. Receiving reconciliation example

An unrelated manual line M has quantity 1, cost 5.00 and sell 8.00. A configuration contribution X originally generated/adopted quantity 10 at cost 1.00 and sell 2.00; the estimator changed its current quantity to 12. The new run proposes 11. The source/run/mapping context is otherwise valid under the synthetic receiving policy.

| Decision for X | Resulting X quantity | Complete estimate cost | Complete estimate sell |
| --- | --- | --- | --- |
| Keep current | 12 | 17.00 | 32.00 |
| Use proposal | 11 | 16.00 | 30.00 |
| Current X was deleted; explicitly Keep omitted | No X cost line | 5.00 | 8.00 |
| Current X was deleted; explicitly Restore proposal | 11 | 16.00 | 30.00 |

M's UUID, source and values remain unchanged in every case. Keeping 12 does not mean it was generated by the new run; store generated 11, current/adopted 12 and the reason separately. If X's SKU/unit also changed, these simple quantity decisions are insufficient: require the identity/unit resolution described in section 7.3.

### E5. Required deterministic scenario pack

Create named public synthetic fixtures for: base valid review; the full eligible receiving case; changed geometry with all 14 stale reviews; each drive family; unsupported cloth lookup; untested pipe/truss choice; part conflict; active missing rate; explicit zero; excluded/no-purchase line; additional slots 3–5; recorded-only parameter change; manual override; manual deletion; removed/reappearing contribution; source rebase; wrong company/alternative; read-only/revoked actor; locked group; exact 100/101-line target; precision mismatch; identical totals/new run; duplicate submit; response lost before/after commit; remount recovery; tampered lineage; and a saved earlier quote left unchanged.

Do not use real customer quote values or dates copied from private workbooks. Separate fixed historical source dates from fixture dates that must remain in the future. Follow the current repository fixture-time decision; use the adopted test clock/date mechanism where applicable and preserve intentionally historical assertions. Avoid a test that passes today only because 23 September 2026 has not arrived. Test in the supported business timezone and UTC/date boundaries without treating a date-only source value as an instant.

