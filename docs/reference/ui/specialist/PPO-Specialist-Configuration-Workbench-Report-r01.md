---
document_id: PPO-ES08-WORKSPACE-RPT
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed interactive design; specialist formula acceptance and application integration separate
source_commit: 0602db2b82013b5869b41bd1b88c623a9bc81f6b
---

# Specialist Configuration Workbench — detailed design report

## 1. Purpose and delivery

The [interactive HTML workspace](PPO-Specialist-Configuration-Workbench-r01.html) develops **ES-08, Specialist configuration workbench**, within Powerplants One estimating. It answers: **What configuration are we estimating, which definition supports its quantities, and can this change be carried forward without losing reviewed work?**

The initial family is **Screen Systems**. Retractable Shade is the illustrated variant. Retractable Blackout and Replacement Screens remain visible documented variants whose answers can be inspected. Irrigation, climate, lighting and other specialist calculators are unavailable until each has its own validated definition.

The delivery comprises a self-contained r01 HTML file, this feature and behaviour report, maintainable HTML/CSS/JavaScript source, deterministic assembly, targeted model and native-browser checks, a design decision and traceable verification evidence. The HTML embeds the supplied r20 Roboto assets and uses no CDN, external script, API or service.

### Calculation boundary

The source material provides a substantial field and workflow catalogue. It does **not** supply the executable Screen Systems formula library, approved input ranges, full parts mappings or accepted intermediate/final calculation examples. BP-04 explicitly says not to reconstruct the engine from the guide. These four evidence sets remain missing in every view and cannot be marked approved in this interface.

R01 includes **two authored synthetic reference cases** with fixed input, output and part snapshots. They demonstrate workflow and reconciliation. They are not anonymised customer jobs, approved engineering examples or mathematical acceptance oracles. Arbitrary geometric, component or operating changes suppress results. The interface never extrapolates a Screen Systems quantity from unvalidated formulae.

The only live arithmetic is illustrative pricing: decimal quantity multiplied by unit price, rounded half-up to cents per line and summed as integer cents. Five reference output quantities can be explicitly overridden and mapped directly to their corresponding sample part. That direct mapping is a design fixture, not an engineering dependency graph.

## 2. Evidence and traceability

| Basis | What it establishes | Limitation |
|---|---|---|
| User direction, 16 September 2026 | Proceed with Screen Systems specialist estimation and retain formula, unit, assumption and version boundaries | Does not approve engineering formulae or ranges |
| ES-08, coverage register r06 | Dedicated page for inputs, evidence, generated parts, overrides and safe rerun | Page coverage is not implementation acceptance |
| [BP-04 section 8](../../../blueprints/BP-04-estimating-quotation.md) | Versioned runs, compound apply, manual-edit preservation and partial recovery | No executable formula library |
| [Evidence register / G06](../../../blueprints/estimating-evidence.md) | Formulae, ranges, units, variants, rounding, mappings and accepted examples are prerequisites | D-009 remains open |
| CREMS rebuild specification v05, Appendices J and X | Secondary guide-derived Screen Systems fields and interaction behaviour | No original configuration export |
| [E5 implementation plan](../../../delivery/estimating-implementation-plan.md) | One specified Screen Systems variant after E2/E3 and G06 evidence | No new delivery sequence or prerequisite waiver |
| [E1 contract](../../../contracts/estimating-e1.md) | Synthetic decimal pricing and exact saved-version discipline | No approved FX, tax, margin, freight or specialist policy |
| [EA-16 / EA-17](../../../testing/estimating-acceptance.md) | Mathematical/parts acceptance and safe rerun/recovery outcomes | Reference demonstrations do not accept these outcomes |

The work traces to **EST-06, CRE-13–CRE-17, EA-16/EA-17, AT-04/AT-28, G06 and D-009**. Existing parent IDs remain unchanged. This is an E5 design contribution, not a new sequence, issue #10 closure or an operational specialist engine.

The reviewed main baseline is **0602db2b82013b5869b41bd1b88c623a9bc81f6b**. The v05 secondary catalogue is identified in the existing source manifest by SHA-256 **cd6a26b28a0446dc22a5c1ab30482dfb7d0f0c75680852ae50c6e41528cd2e1a**. Its citations to original guide pp138–151 are secondary references; this delivery reviewed the v05 catalogue, not a newly obtained executable library. Private source documents are not copied into the public repository.

## 3. Theme and visual organisation

R01 follows the **Powerplants One r20 style board**: navy typography/actions (#242a37), restrained green accent (#62bb46), pale page background (#f5f6f8), white panels, neutral dividers and embedded Roboto with Verdana fallback. The header is light; green marks the current tab and scope, without indicating calculation approval.

The supplied board remains unchanged. Its SHA-256 is **c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617**. Reused embedded font CSS has SHA-256 **57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef**.

Desktop Configure has a left step navigator, central form and right computed preview. Summary values use a contiguous strip. Parts are grouped in a table; detailed evidence opens in a side drawer. On smaller screens, computed values move below the form, tabs wrap, steps form a compact row and parts become labelled records. Phone inputs/actions have at least 44 px targets. Focus is visible and status/error meanings are textual.

The page is a module workspace for eventual composition inside PPO. It does not duplicate the full application navigation shell.

## 4. Connected views

| View | Information | Interactions | Outcome |
|---|---|---|---|
| **Configure** | Exact estimate/facility, four input steps, required fields, units/range status and eight results | Back/Next, current/completed steps, expandable fields, local draft, A/B loading, basis drawer and quantity override | Preserved draft with an exact reference match or an explicit unavailable result |
| **Results & parts** | Grouped parts, stable keys, quantities/UOM, unit and extended cost/sell, source versions, procurement handling | Preview/staged switch, manual part edit with reason, rerun entry | Transparent reference pricing and retained generated baseline |
| **Overrides & rerun** | Added, changed, removed and manually edited lines; overrides and fixed scope | Version review/reset, per-line dispositions, cancel, stage reference | Same configuration identity with a retained new run; cancellation changes no staged lines |
| **Definitions & evidence** | Family boundary, missing approval pack, logical owners, assumptions and references | Inspect six evidence records and sources | Actionable gaps with no fabricated approval button |
| **Runs & recovery** | Saved runs, audit, receipt, totals state and earlier issued illustration | Full snapshot, recover, repair totals, export/restore and simulated outcomes | Provenance and recovery without duplicate generation |

### Shared record context

The fictional example is **Northbank Nursery, Glasshouse 02**, estimate **SYN-PPO-EST-000042**, option **SYN-OPT-A**, draft **r03**, facility **SYN-FAC-NB-GH02** and proposed configuration **SYN-CFG-SCREEN-001**. Committed scope is Screen Systems / Retractable Shade / Supply + install.

These are authored reference identities. The proposed screen configuration is separate from the Northbank fertigation equipment and assurance job. No installed screen asset or operational estimate is claimed.

The facility stays fixed. Once staged, the variant control is fixed to the applied variant. Reruns use saved answers, without replacing them with mutable facility data. Facility power is read-only and, following the guide-derived catalogue, is not a quantity driver.

## 5. Implemented field inventory

Every implemented input is listed below. Numeric units are **proposed PPO display conventions**, not verified source units. Each numeric field reports that its approved range is not supplied. Values are authored reference data, not recommendations.

| Step | Field | Proposed unit / input type | Reference A value |
|---|---|---|---|
| Structure | Screen variant | Selection | Retractable Shade |
| Structure | Greenhouse builder | Text | Synthetic greenhouse builder |
| Structure | Greenhouse brand | Text | Reference house |
| Structure | Spans | count | 4 |
| Structure | Span width | m | 8 |
| Structure | Bays | count | 8 |
| Structure | Bay spacing | m | 4 |
| Structure | Extra wall spans | count | 0 |
| Structure | Height to screen | m | 3 |
| Structure | Gutter height | m | 4.5 |
| Structure | Long bay present | Selection | No |
| Structure | Odd bay size | m | Blank / not supplied |
| Structure | Truss shape | Text | To be confirmed |
| Structure | Truss chord height | mm | Blank / not supplied |
| Structure | Truss chord width | mm | Blank / not supplied |
| Structure | Keep motors and switchgear | Selection | Yes · Replacement only |
| Structure | Keep drive pipe and associated parts | Selection | Yes · Replacement only |
| Structure | Installation outside this quote | Selection | Yes · Replacement only |
| Screen & drive | Cloth reference | Selection | SYN-SHADE-01 |
| Screen & drive | Cloth unit cost override | AUD/m² | Blank / not supplied |
| Screen & drive | Cloth cost override reason | Text | Blank / not supplied |
| Screen & drive | Edge seal | Selection | Included |
| Screen & drive | Seal material reference | Text | SYN-SEAL-01 |
| Screen & drive | Overhang | mm | 150 |
| Screen & drive | Overhang edge fixing | Text | Reference fixing |
| Screen & drive | Shrinkage allowance | % | 2 |
| Screen & drive | Screens per span | count | 1 |
| Screen & drive | Cut from wider sheet | Selection | No |
| Screen & drive | Sheet width | m | Blank / not supplied |
| Screen & drive | Bed fastening reference | Text | SYN-FIX-01 |
| Screen & drive | Clip spacing | mm | 500 |
| Screen & drive | Support and lacing wire reference | Text | SYN-WIRE-01 |
| Screen & drive | Drive type | Selection | Cable |
| Screen & drive | Drive target spacing | m | 4 |
| Screen & drive | Drum reference | Text | SYN-DRUM-01 |
| Screen & drive | Drive location | Text | Reference end bay |
| Screen & drive | Drive pipe diameter | mm | 34 |
| Screen & drive | Motors across | count | 1 |
| Screen & drive | Motors down | count | 1 |
| Screen & drive | Facility recorded power | Text | 400 V · 3 phase · read-only |
| Screen & drive | Control box reference | Text | SYN-CONTROL-01 |
| Screen & drive | Leading edge profile | Text | SYN-EDGE-01 |
| Screen & drive | Motor mounting reference | Text | SYN-MOUNT-01 |
| Installation & travel | Bill hourly | Selection | No |
| Installation & travel | Hourly billing rate | AUD/h | Blank / not supplied |
| Installation & travel | Work hours per day | h/day | 8 |
| Installation & travel | Installer · screen fitting | person-days | 4 |
| Installation & travel | Electrician · control connection | person-days | 1 |
| Installation & travel | Travel time | person-days | 1 |
| Installation & travel | Expense margin | % | Blank / not supplied |
| Installation & travel | Job location | Text | Synthetic Northbank region |
| Installation & travel | Travel mode | Selection | Car |
| Installation & travel | Accommodation | nights | 0 |
| Installation & travel | Meals | person-days | 0 |
| Installation & travel | Car hire | days | 0 |
| Installation & travel | Parking | days | 0 |
| Installation & travel | Scissor lift | days | 1 |
| Allowances & label | International freight mode | Selection | Sea |
| Allowances & label | Local freight cost | AUD | 120 |
| Allowances & label | Freight allowance | % | Blank / not supplied |
| Allowances & label | Import duty allowance | % | Blank / not supplied |
| Allowances & label | Spares allowance | % | Blank / not supplied |
| Allowances & label | Customer configuration label | Text | Northbank · Glasshouse 02 · Retractable Shade |

### Conditional rules and validation

Required fields include variant, spans, span width, bays, bay spacing, screen height, cloth, overhang edge fixing, drive type, target spacing, motor counts, leading edge, job location and travel mode. Long-bay selection requires an odd bay size; cutting a wider sheet requires sheet width.

Itemised installation requires work hours per day. Hourly billing requires a rate. The future validated hourly rule must remove all itemised installation, travel and equipment lines to avoid double charging. R01 suppresses outputs for that changed branch rather than executing an unvalidated exclusion engine.

Cloth cost is separate from geometric matching. Blank uses the reference catalogue cost; zero is an explicit override requiring a reason. An override above sample sell blocks staging. No margin threshold or approval authority is invented.

Replacement-only inputs appear under additional structure fields. Their guide-derived defaults are Yes: keep motors/switchgear, keep drive pipe/associated components, and installation outside the quote. Replacement has no generated outputs in r01. Its eventual definition must distinguish excluded motors, sprockets, baseplates and controls; excluded pipe, drums, turnbuckles and protectors; and still-quoted bearings, pulleys, delay blocks, wire rope and specified fasteners. Installation exclusion must address labour, travel, airfares, accommodation, meals, car hire, parking and lift hire.

Import duty needs a declared freight allocation and one disclosed charge. Blank freight, duty and spares allowances remain unknown. The fixed reference snapshot does not establish that these unknown allowances are zero. Historical installation comparisons must never calculate days; r01 uses explicit role/task day entries.

Hidden or irrelevant field text is retained. No destructive applicability migration is implemented. Back does not validate; Next reports current-step errors without clearing answers. Unreached later steps are disabled; current and completed steps remain accessible.

The parser rejects negative, non-finite, exponent and unit-suffixed numbers, requires whole counts, and allows up to three decimal places for ordinary numeric inputs or two for AUD values. Most fields have a defensive one-million parsing ceiling. This is a software limit, **not an approved engineering range**.

Part quantities and quantity overrides use positive values up to 100,000 with three decimal places. Unit cost/sell use non-negative values up to AUD 1,000,000 with two decimal places, following the E1 synthetic arithmetic envelope. Motor overrides are whole counts. The customer label is limited to 300 characters.

### Catalogue detail awaiting definitions

The secondary source describes further detail beyond the compact r01 form: crosswires, clamps and plates; lacing wire colour/roll length; Omega profiles and brackets; twine, chains, end beams and braces; slip clutches and spring colours; pulleys, droppers and strainers; universal joints; seal/clip variants; location-derived airfare and car-hire rates; and a configurable labour role/task grid.

R01 represents these topics through support, fastening, mounting, profile and explicit labour fields plus evidence requirements. It does not claim complete legacy field reconstruction. Exact keys, units, choices, conditions and effects belong in the validated definition export.

## 6. Results, parts and costing

| Output | Reference A | Reference B | Proposed unit | Reference override |
|---|---:|---:|---|---|
| House width | 32 | 32 | m | Read-only |
| House length | 32 | 36 | m | Read-only |
| Covered footprint | 1,024 | 1,152 | m² | Read-only |
| Cloth allowance | 1,120 | 1,260 | m² | Corresponding cloth quantity |
| Drive cable | 240 | 270 | m | Corresponding cable quantity |
| Drive pipe | 32 | 36 | m | Corresponding pipe quantity |
| Drive motors | 1 | 1 | each | Whole-count motor quantity |
| Installation allowance | 40 | 48 | h | Corresponding labour quantity |

These values are stored explicitly. Plausible relationships between them are not an executable formula specification. Changing eight bays to nine matches B only when all other engineering answers remain exactly as authored. Ten bays, a different variant or a changed drive/operating branch has no matching result.

A uses **SYN-CASE-A-r01**, **SYN-PART-MAP-r01** and **SYN-PRICE-r01**. B uses **SYN-CASE-B-r02**, **SYN-PART-MAP-r02** and **SYN-PRICE-r02**. Changed source identities demonstrate retained provenance; they do not claim a real supplier update.

Both cases contain cloth, cable, pipe, motor, installation and freight. A also contains a bracket set. B introduces a support kit and no longer generates the bracket key, providing deliberate addition, change and removal cases.

The initial A reference extends to **AUD 6,684.00 cost and AUD 9,708.00 sell**; B extends to **AUD 7,633.00 cost and AUD 11,105.00 sell**, excluding GST. These are reference totals, not quote-ready amounts. Missing unit costs/sells retain an incomplete status and known subtotals rather than becoming zero.

Each part exposes stable rule and synthetic item identities, description, quantity/UOM, unit cost/sell, line cost/sell, group and procurement handling. **No purchase · priced** labour and freight remain in totals. Quote inclusion, printing, procurement eligibility and taxation remain separate concerns.

## 7. Overrides and safe rerun

The computed-value drawer identifies the missing expression, exact reference version, value/unit and range status. An override records original/replacement value, unit, reason, basis, synthetic actor and timestamp. It affects only its stated sample part; width, length and footprint stay read-only because there is no validated dependency graph.

Reset restores the current reference value. Loading B retains A overrides but blocks staging until each affected override is reviewed for the new version. Original reason/basis remain, with the new review reason in the audit.

After staging, a manual edit can change description, quantity, unit cost and unit sell with a reason. The current line changes; the original run and generated baseline remain intact. Matching uses stable keys, never description.

| Difference | Required disposition |
|---|---|
| Added key | Add proposed line |
| Changed generated value without manual edit | Update within the same configuration |
| Unchanged generated value | Retain |
| Matched manual edit | Explicitly keep manual or use new generated value |
| Removed generated line | Explicitly remove or retain as separate manual |
| Unmatched edited line | Explicitly remove or retain as separate manual |
| Retained manual key reappears | Manual conflict requiring review |
| Duplicate/ambiguous keys | Block reconciliation |

This improves on the older documented replacement behaviour: unmatched edits are never discarded after only a generic warning. Cancellation clears comparison choices while preserving input draft, staged lines and saved history.

Staging rechecks current preview signature, local editing permission, lock, scope-change scenario, cross-tab state, required fields, exact case match, override review and every required disposition. A stale preview cannot commit.

## 8. Apply and recovery

**Stage reference run/rerun** creates a local synthetic configuration only. Operational Apply remains blocked. Each run retains context, answers, overrides and version reviews, reference/map/price identities, generated baseline, resolved lines, dispositions, totals snapshot, timestamp and operation identity.

Reruns retain configuration SYN-CFG-SCREEN-001 and add a saved run such as SYN-RUN-002. They do not create a second configuration group. Past runs are read-only through the interface.

| Scenario | Visible state | Recovery |
|---|---|---|
| Normal save | Local run recorded | Continue review |
| Fail before commit | No line mutation; answers and confirmation retained | Retry proposal |
| Commit; lose response | Pending original operation, further writes paused | Recheck current role/lock/scope and recover its receipt without another run |
| Commit; fail totals | Saved lines, **Stale totals** banner | Repair from existing lines without regeneration |
| Cross-tab change | Draft retained, writes paused | Export current answers and reload |
| Malformed storage | Original raw bytes preserved | Export preserved data, then explicitly reset |
| Storage unavailable | Visible save failure | Export in-memory session |

Start fresh draft resets inputs/overrides only and retains staged lines, manual edits, runs and the issued illustration. Reset demonstration is a separate explicit local action.

The earlier issued illustration **SYN-ISSUED-EXAMPLE-r01** has a fixed AUD 11,840.00 total and separate basis. It remains byte-for-byte unchanged through source changes, overrides, part edits, fresh drafts and reruns. It is an authored history fixture, not a customer document.

## 9. Roles, storage and accessibility

**Estimator** can edit draft answers, record supported overrides, edit staged parts and stage/recover permitted local operations. **Read-only reviewer** can inspect and export; write controls are unavailable. Preview options independently exercise an editable draft, locked estimate or changed committed scope.

These are client-side behaviour examples, not authentication or a production role matrix. Future services must enforce current grants, record version, lock, definition validity and exact scope on each write and receipt recovery.

Drafts save locally after about 0.5 seconds. JSON export includes exact source state, runs and pending operation. Restore validates schema, fixed context, issued fixture, IDs, numeric bounds, units, provenance, timestamps and totals consistency. Restore opens with the read-only preview role. Role/options are not persisted credentials.

The HTML has a skip link, labelled inputs, textual errors, native dialogs, visible focus, arrow/Home/End tab navigation, Escape handling and focus return. Unsaved dialog changes require a discard decision. Full assistive-technology acceptance in the integrated application remains separate.

## 10. Receiving-module contract

| Concern | Future responsibility | R01 boundary |
|---|---|---|
| Estimate / option / revision | Exact IDs, locks, versions, configuration and cost-line identity | Fixed snapshot retained in every run |
| Questionnaire / E2 | Applicable versioned answers, units and provenance | Explicit local answers; no resnapshot service |
| Pricing / E3 | Published mapping, cost/sell/FX basis and incomplete diagnostics | Authored AUD source versions and arithmetic |
| Engineering control | Immutable approved definition, checksum and effective period | Missing evidence with responsible functions |
| Estimate output / E4 | Exact approved saved-offer basis and permissions | No quotation issued |
| Project / Service / E6 | Accepted scope and reviewed receiving evidence | No automatic work, asset or procurement record |
| MYOB / SharePoint | Intended ERP authority and business-document ownership | No transaction or external document write |

HTML links open pinned repository specifications and the Estimation Wizard Container r03. They are design references, not live record deep links. JSON is a synthetic review package, not an accepted API payload.

A production contract requires stable run/part-rule IDs, exact definition checksum, input/source snapshot, generated baselines, manual provenance, preview hash, current record version and idempotent receipt. Compound save and totals refresh must have independently reconcilable outcomes. **Recipe Refetch latest version must remain distinct from specialist mathematical rerun.**

## 11. Demonstration walkthrough

1. Inspect Northbank's fixed scope, four evidence gaps and four configuration steps.
2. Open a computed basis and confirm the output is a fixed authored result.
3. Review A's grouped parts and priced no-purchase lines; stage A with synthetic acknowledgement.
4. In staged parts, edit cloth to 1,180 m² and bracket quantity to six, recording reasons.
5. Load B. Inspect changed quantities, added support kit and unmatched edited bracket.
6. Cancel once and verify no staged lines change.
7. Reopen comparison; keep manual cloth and retain the bracket as a separate manual line.
8. Stage the rerun and inspect both immutable snapshots and the unchanged issued illustration.
9. In separate reset sessions, exercise failed save, lost response and stale totals; recover original effects.
10. Export and restore read-only. Review the definition evidence required before implementing a supported calculator.

An additional scenario sets cloth override to 1,200 m², loads B, reviews that retained override for the new version, then resets it to B's authored quantity.

## 12. Verification and outstanding acceptance

The [verification record](../../../testing/evidence/specialist-r01/README.md) identifies exact source/hash, original model/browser results and visual review. Checks cover calculation boundaries, decimal extension, zero/blank handling, versioned overrides, manual/unmatched reconciliation, cancellation, stale previews, permission scenarios, original-operation recovery, totals repair, immutable history and invalid restore rejection.

At initial review-package publication, **25 model groups pass; native browser execution and visual review are pending**. Final evidence will identify the exact verified HTML hash.

This is design assurance. **EA-16 and EA-17 are not accepted against approved Screen Systems definitions.** Real engineering correctness, source parity, full legacy fields, concurrent server persistence, operational permissions, quote approval, tax/FX policy, database integration and offline estimating remain outside the delivered prototype.

The next prerequisite is the validated definition pack: expressions/dependencies, exact input keys/units/ranges, catalogues, variant/branch matrix, rounding/assumptions, stable part mappings/cost sources and accepted intermediate/final plus rerun examples. Every other equipment family needs its own pack. This workbench is the concrete interface and workflow review baseline while those sources are obtained.
