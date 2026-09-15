# Powerplants One — HTML page coverage audit r04

**Prepared 14 September 2026.** Extensive review of the r03 page register, incorporating commercial-horticulture context, current repository-head checks, expanded page briefs and a redesigned interactive register.

**Finding:** r03 had broad coverage and the correct site/facility direction, but several operational handovers were implicit. It also needed stronger planning detail, clearer evidence boundaries and a more useful review interface. R04 adds **7 briefs**, refines **27 existing briefs**, and enriches **all 149 entries** with planning metadata and suggested review criteria. All **142 original IDs and scope descriptions** are preserved.

There are **143 active completion briefs and 6 conditional proposals across 21 families**. A brief can contain a register/detail pair or be a tab, form or review flow. This is not a requirement to build 149 separate HTML files, and it is not an approved implementation backlog.

## Assessment against the seven requested criteria

| Requested assessment | R03 finding | R04 action and remaining limit |
|---|---|---|
| 1. Are there gaps? | Survey capture, control backup/recovery evidence, calibration evidence, remote OEM diagnosis and service-parts custody were implicit or dispersed. | Five active page candidates make these workflows explicit. Source absence is bounded by the checked material; existing foundations remain reusable. |
| 2. Could it be expanded? | Grower production/traceability and water/energy review lacked a clear future-scope boundary. | Two conditional briefs retain these possibilities without assuming PPO is already a crop-production management platform. |
| 3. Improvements and refinements? | Page descriptions alone did not give sufficient guidance on sequencing, ownership, inputs, source authority or review. | All entries gain proposed priority, reviewer role, record context, source authority, planning dependencies and three suggested checks; 27 descriptions gain specific operational detail. |
| 4. More professional? | Long rows, mixed historical/current evidence and indistinct planning status reduced clarity. | Stable IDs, consistent classification definitions, concise summaries/full details, a dedicated evidence view, structured audit findings and explicit review-note semantics. |
| 5. Commercial horticulture alignment? | The six facility examples were covered in r03, but crop-sensitive timing, control relationships and technical evidence could be stronger. | Preserve the full hierarchy; distinguish structure/use/crop, physical position/served area, site address/on-site destination, source-bound units/configuration, site-specific readiness and accepted handover evidence. |
| 6. More interactive? | Search/family/class filters supported reading but not sustained review. | Add priority/change/horticulture/shortlist filters, sorting, cards/table, detail drawer, linked dependencies, four scenarios, saved local reviews, validated import, filtered export and print. |
| 7. Additional details? | Field provenance, measurement evidence, review roles, operational exceptions and source lineage needed greater visibility. | Include these in briefs and audit matrices; retain all source, route and parent inventories. Actual policy values, integration contracts and acceptance results must still come from their owners. |

Visual polish has been applied in source. **Rendered browser validation remains open:** local HTML navigation was rejected by browser URL policy. The checks described below verify data and non-rendered DOM behaviour; they do not establish visual, mobile, keyboard-in-browser or WCAG acceptance.

## Coverage and change accounting

| Classification | R03 | R04 | Interpretation |
|---|---:|---:|---|
| N — New design candidate | 79 | 84 | A dedicated screen for the stated scope was not found in inspected sources. Partial designs, specifications or data models may exist; page packaging is sometimes proposed. |
| D — Dedicated refinement | 12 | 12 | Basic application screens or older prototypes exist; coordinated workspace behaviour needs refinement. |
| E — Extend existing design | 47 | 47 | Reuse an identified design and complete its scope, consistency, review or integration. |
| C — Conditional addition | 4 | 6 | Confirm business need, source authority and enabling capability before build. |
| **Total** | **142** | **149** | **No original IDs are deleted or reclassified in r04.** |

Five new active candidates plus two conditional proposals account for the entire increase. The 27 refined briefs are existing entries; they do not add to the total. Metadata enrichment applies to all entries, including those whose scope description is unchanged.

## Seven additional page briefs

### CS-08 — Site survey and as-found brief

**New design candidate · P2 recommended order · Page + capture form**.

Capture the exact site, structures and growing areas before design or upgrade: measured dimensions and units, photographs, utility/water connection observations, existing equipment, access constraints and owned unknowns. Record who observed each fact, when and by what method; distinguish customer statements, measurements and unverified assumptions. Issue a reviewed brief to estimating and engineering.

**Why include it:** The master blueprint’s upgrade journey names surveys and undocumented existing conditions. R03 had location records and later inspections but no explicit pre-design survey surface. This packages existing scope into a reviewable workflow.

**Suggested reviewer:** Engineering / site-survey lead. **Source authority:** Site owner for access; survey author for observations; reviewed design basis.

**Planning inputs:** CS-04, CS-05. These are proposed inputs, not verified runtime gates.

**Suggested design checks:**

- An unknown dimension stays unknown; a later measurement retains its source and does not rewrite an issued estimate.

- A survey can cover several areas and route unresolved questions to named follow-up.

- Reviewed survey revisions link to an exact estimate/engineering intake.


### EQ-08 — Control configuration backup and recovery record

**New design candidate · P2 recommended order · Tab + review flow**.

Record approved configuration backup references, software/firmware compatibility, capture date, configuration revision, custodian, recovery procedure and last verified recovery evidence. Link an upgrade to its pre-change backup and post-change handover. Keep secrets in the approved secret store; this page does not execute a controller restore.

**Why include it:** The master blueprint explicitly calls for software/configuration backup at upgrade completion. R03 tracked configuration history but omitted backup/recovery evidence as a named surface.

**Suggested reviewer:** Service / controls engineering lead. **Source authority:** Reviewed OEM procedure and exact controlled backup reference.

**Planning inputs:** EQ-01, EQ-03, DK-01. These are proposed inputs, not verified runtime gates.

**Suggested design checks:**

- A backup is linked to the exact asset/configuration and remains available after a successor is recorded.

- Unverified or incompatible recovery evidence cannot be displayed as recovery-ready.

- No password, controller connection command or automatic restore is exposed.


### EQ-09 — Test instruments and calibration evidence

**New design candidate · P2 recommended order · Register + linked panel**.

Identify the instrument used for each inspection: instrument ID, measurement type/range/unit, calibration certificate, calibration date, validity basis and status at the time of capture. Preserve the certificate/version used in historical submissions and flag evidence requiring review. This supports measurement trust; broader company-tool custody remains CX-01.

**Why include it:** Equipment r01 demonstrates an instrument check, but r03 did not name the evidence-maintenance surface needed to support reusable inspections. This is a proposed dedicated decomposition, not a claim that company asset management is approved.

**Suggested reviewer:** Quality / service lead. **Source authority:** Instrument custodian and controlled calibration evidence; master ownership to confirm.

**Planning inputs:** DK-01. These are proposed inputs, not verified runtime gates.

**Suggested design checks:**

- An expired, unknown or unsuitable instrument is flagged using the actual procedure’s rules.

- Updating a certificate does not replace evidence attached to a historical reading.

- Calibration intervals and acceptance limits come from supplied sources, never fixture defaults.


### SV-08 — Remote diagnosis and OEM escalation

**New design candidate · P2 recommended order · Page + evidence timeline**.

Coordinate customer-reported faults, consent and contact arrangements, exact asset/configuration, logs/screenshots, troubleshooting already attempted, OEM case reference, questions, response evidence and owned next action. Distinguish advice, an authorised technical intervention and a required site visit. Remote access uses separately approved tooling and current authority.

**Why include it:** R03 has triage and unresolved findings but no explicit customer-to-OEM diagnostic handover. This proposal fills that workflow gap without adding remote control or replacing OEM software.

**Suggested reviewer:** Service / technical support lead. **Source authority:** Authorised service contact and attributable OEM/source evidence.

**Planning inputs:** SV-02, EQ-01, EQ-03. These are proposed inputs, not verified runtime gates.

**Suggested design checks:**

- The OEM response is tied to the exact case and configuration, with unresolved advice still visible.

- An interrupted session preserves evidence and owns the next customer/site action.

- A troubleshooting note cannot approve scope, a crop-sensitive shutdown or extra charges.


### SC-10 — Service stock custody and job reconciliation

**New design candidate · P2 recommended order · Page + reconciliation flow**.

Trace approved stock transfers between warehouse, technician/van and job: issued, used, unused returned, damaged, quarantined or missing quantities with unit and serial/batch where applicable. Distinguish custody from consumption and chargeability. Reconcile against the authoritative inventory source before closing exceptions.

**Why include it:** SC-05/SC-06 cover availability and dispatch; field capture records consumption. A named reconciliation flow connects them and makes unused/returned service parts visible. It reuses the stock master.

**Suggested reviewer:** Supply chain / service lead. **Source authority:** MYOB inventory transactions; attributable physical custody and field evidence.

**Planning inputs:** SC-05, SC-06, FI-01. These are proposed inputs, not verified runtime gates.

**Suggested design checks:**

- Issued quantities reconcile to used, returned and explicitly owned variances in like units.

- A returned part cannot remain silently counted as both consumed and available.

- An uncertain ERP transfer is investigated through its original reference, not repeated blindly.


### CX-05 — Grower production and traceability integration

**Conditional addition · Conditional recommended order · Conditional integration view**.

If PPO is later extended for growers’ production operations, link crop batches, planting/harvest windows and existing traceability records to exact growing areas. Establish the source system, users, data rights and purpose first. Crop inventory, crop protection applications, harvest and food-safety certification remain a separate business-scope decision.

**Why include it:** Commercial horticulture alignment does not imply that a supplier/service platform must also become a farm-management system. This explicit boundary prevents missing a future integration while avoiding assumed production scope.

**Suggested reviewer:** Product sponsor / grower operations lead. **Source authority:** Confirmed production system and approved integration scope.

**Planning inputs:** CS-05, AD-05. These are proposed inputs, not verified runtime gates.

**Suggested design checks:**

- A scoped business case identifies the grower workflow and current record owner.

- Read-only integration preserves external batch identities and does not imply certification.

- Production data is not fabricated from equipment service records.


### CX-06 — Water and energy improvement review

**Conditional addition · Conditional recommended order · Conditional report + proposal**.

Where agreed metered data exists, compare water/energy observations over an explicit site/area/time basis and prepare reviewed improvement proposals. Retain units, meter coverage, missing readings, operating/crop context and baseline limitations. Estimated savings and measured outcomes stay distinct; no automatic irrigation or climate-control action follows.

**Why include it:** Resource efficiency is relevant to horticultural infrastructure, but r03 lacks an explicit evaluation surface. Its value depends on approved measurements and definitions, so it remains conditional.

**Suggested reviewer:** Product sponsor / technical performance lead. **Source authority:** Verified measurement source and reviewed comparison basis.

**Planning inputs:** CX-03, RP-06. These are proposed inputs, not verified runtime gates.

**Suggested design checks:**

- Incomplete meter coverage is visible and is not converted to a zero-use result.

- Comparisons declare baseline period, operating context and like units.

- An improvement proposal states uncertainty and has no automatic controller effect.


The five active additions mostly expose work already implicit in service, upgrade or evidence scope. The two conditional additions are deliberate expansion proposals. EQ-09 supplies calibration evidence for inspections; CX-01 remains the optional broader company-tool and loan-unit custody package. Neither requires duplicating the same instrument master.

## The 27 refined existing briefs

The following text was added to the retained r03 descriptions. All original descriptions remain in the complete register.

| Entry | Existing brief | Refinement added in r04 |
|---|---|---|
| CS-05 | Facilities and growing areas: registers, detail and forms | Retain separate location, structure, use, crop and service-group concepts. Record changed use/season as dated context without turning the facility record into a crop-production ledger; dimensional roll-ups must avoid nested-area overlap. |
| CS-06 | Site access and horticultural readiness | Add site-approved visitor/contact, movement and clean-down evidence with applicability and review dates; show seasonal work windows and crop-sensitive shutdown restrictions. A checklist acknowledgement is not blanket permission to work. |
| EQ-01 | Installed-base register and equipment workspace | Record customer-declared criticality, affected growing areas, redundancy and escalation contacts with source/date. A crop-impact label must not be treated as an automatic diagnosis or permission to intervene. |
| EQ-03 | Configuration and change history | Separate climate compartments, irrigation valves/blocks, sensor groups, control programmes and physical assets; retain exact protocol/interface and source revisions where established. |
| EQ-06 | Service bulletin applicability | Show affected and potentially affected site/area scopes, reviewed applicability and customer-contact follow-through; closure requires evidence for each affected asset. |
| ES-03 | Cost-source and supplier-price review | Include validity/lead-time assumptions, freight/import and commissioning cost basis, approved currency/tax context and responsibility for supplying each cost source. |
| ES-08 | Specialist configuration workbench | Keep irrigation, climate, lighting and other specialist calculations tied to approved formulae, input units, operating assumptions and source versions; the initial family remains the agreed Screen Systems scope. |
| EN-02 | Design basis and interface register | Make irrigation, climate, electrical, lighting, controls and utility interfaces explicit where in project scope. Specify interface owners and source drawings, not inferred live control access. |
| EN-08 | Commissioning basis and as-built release | Retain commissioning criteria, sensor/valve/area associations, backups where relevant, training evidence and a clear as-built versus intended-design comparison. |
| PJ-07 | Readiness and change-impact review | Include crop windows, seasonal timing, shutdown/contingency arrangements, supply lead time and customer prerequisites with explicit owners and a human review of affected commitments. |
| PJ-09 | Staged acceptance and closeout | Include customer/operator training, handed-over manuals/configuration references and outstanding support obligations as individually evidenced closeout items. |
| SV-01 | Service desk and triage worklist | Show customer-reported crop/process impact and a source-based escalation owner without inventing an SLA or letting urgency bypass required work authority. |
| SV-07 | Unresolved findings and follow-up worklist | Track recurrence and related failures across visits while preserving the difference between symptoms, suspected cause and verified root cause. |
| PL-01 | Service planner and unassigned demand | Show seasonal/customer work windows, permitted shutdown windows, weather/access constraints where supplied and explicit alternatives; no booking changes follow automatically from an advisory forecast. |
| FI-01 | Technician Today and job execution | Make field capture practical with large touch targets, limited typing, explicit measurement units, photo context and clear draft/saved/queued states. Voice remains optional and reviewed. |
| FI-03 | Inspection and commissioning form runner | Add instrument eligibility and calibration links, expected versus measured values, source-defined precision and evidence for Not performed; the procedure defines limits and reviewer authority. |
| FI-05 | Site induction, risk and biosecurity review | Record required clean-down/entry/exit evidence and customer/site instructions where applicable, without prescribing a generic chemical, method or re-entry interval. |
| MA-03 | Maintenance plans and task templates | Distinguish calendar, usage and inspection-triggered maintenance only when the actual source agreement/procedure defines the trigger; retain seasonal exceptions and deferred-work ownership. |
| SC-03 | Inbound shipments and line allocations | Include supplier manufacturing status, import/customs milestones and dated ETA confidence where supported, with separate customer/job promises and owned exception follow-up. |
| PD-01 | Catalogue and product technical workspace | Cover irrigation/fertigation, climate control, sensors, lighting and other supported product families through governed technical attributes and unit definitions; do not infer compatibility from a shared brand. |
| PD-04 | Compatibility, replacements and product lifecycle | Distinguish technical compatibility, supported firmware, physical replacement suitability and commercial availability; retain each source and review decision. |
| DK-04 | Knowledge search and article detail | Show source applicability to equipment model, firmware and growing context, plus review/expiry status; suspected fixes remain distinct from validated procedures. |
| AI-04 | Domain assistance and drafting flows | Make assistance useful for site-survey summaries, missing-information questions, sourced equipment history and draft handovers. Require review of names, measurements, scope and proposed actions; never invent horticultural operating limits. |
| AI-06 | AI assistance settings and quality review | Include evaluations for wrong-site context, stale configuration, unsupported units/limits, confidential sources and misleading confidence; user feedback is not automatic technical approval. |
| RP-04 | Service, maintenance and resource performance | Separate site/asset criticality, repeat-callouts, unresolved findings and planned maintenance from customer impact claims; define denominators and reporting cutoffs. |
| AD-02 | Business configuration and policy publication | Govern vocabulary and units for sites, structures, growing uses, area/block identities, irrigation/control groups and technical attributes; labels may change while stable identities remain. |
| CX-01 | Company tools, loan units and calibration | Use EQ-09 for instrument evidence required by inspections; this conditional page adds custody, reservation and broader company-tool/loan/fleet administration only if justified. |

## Detailed audit findings

| ID | Area / impact | Finding | Action applied |
|---|---|---|---|
| A01 | Gaps / High | Pre-design survey capture was implicit | Added CS-08 for observed, measured and assumed site facts with reviewed handover. CS-08 |
| A02 | Gaps / High | Configuration history omitted named backup/recovery evidence | Added EQ-08; keeps approved backup references and verification without offering controller restore. EQ-08 |
| A03 | Gaps / High | Inspection evidence lacked its supporting calibration surface | Added EQ-09; separates evidence needed by inspections from optional company-tool custody. EQ-09, FI-03, CX-01 |
| A04 | Gaps / Medium | Remote diagnosis and OEM escalation had no explicit receiving workflow | Added SV-08 with source context, questions, response and owned next action. SV-08 |
| A05 | Gaps / Medium | Service parts custody and unused returns were dispersed | Added SC-10 to reconcile issued, used, returned and held parts against ERP. SC-10 |
| A06 | Expansion / Medium | Future grower operations and resource analysis needed an explicit boundary | Added CX-05/CX-06 as conditional proposals, with source ownership and business-case prerequisites. CX-05, CX-06 |
| A07 | Horticulture / High | Facility examples did not fully expose control/area relationships | Retained all six examples; refined structure/use/crop/area distinctions and cross-area service relationships. CS-05, EQ-03, EN-02 |
| A08 | Horticulture / High | Crop-sensitive timing and site-entry evidence were too easy to overlook | Expanded readiness, planning, field entry and project impact descriptions. Site-specific rules remain authoritative. CS-06, FI-05, PL-01, PJ-07 |
| A09 | Horticulture / Medium | Technical product and service context needed more depth | Refined product families, firmware/compatibility, failed-fix history and source-bound technical knowledge. PD-01, PD-04, SV-07, DK-04 |
| A10 | Information / High | Page rows lacked reviewable delivery briefs | Every entry now includes recommended priority, reviewer role, related records, source authority, dependencies and suggested checks. CS-05, FN-01 |
| A11 | Information / High | Coverage class could be mistaken for delivery or approval | Retained N/D/E/C meanings; separated proposal basis, source evidence and local planning notes. No completion percentage is shown. |
| A12 | Professionalism / Medium | Very long descriptions made the register hard to scan | Introduced concise table/card summaries with a full detail drawer and structured evidence. No original scope text is removed. |
| A13 | Interactivity / Medium | Only text, family and status filters were available | Added priority/change/horticulture filters, sort, cards/table, clickable dependencies and family navigation. |
| A14 | Interactivity / Medium | No way to retain personal review work | Added a local shortlist, review disposition and notes, with explicit save, download and validated import. These never change delivery status. |
| A15 | Professionalism / Medium | Sources, old snapshots and current findings were visually mixed | Added a dedicated evidence view, dated live-head check and a distinct r03→r04 change review. |
| A16 | Visual polish / Medium | The page behaved like a long report rather than a review workspace | Introduced a compact navy sidebar, lighter workspace, consistent typography, clear density and responsive drawer/controls. |
| A17 | Accessibility / High | Visual/mobile/keyboard acceptance had not been established | Added semantic controls, meaningful labels, focus return, reduced motion, print and narrow-width CSS. Browser URL policy blocks rendered validation; this remains explicitly open. |
| A18 | AI / High | Important AI expectations were hidden in broad descriptions | Expanded sourced assistance and evaluation scenarios; wrong-site context, stale revisions and unsupported units/limits are explicit. AI-04, AI-06 |

Impact expresses audit judgement about planning risk; it is not a measured incident rate, urgency commitment or assigned delivery priority.

## Horticultural model and required content

R03’s six-example coverage is retained and strengthened. The essential relationship model is:

| Record or relationship | Required behaviour | Main coverage |
|---|---|---|
| Organisation → multiple sites | Keep operator, owner and bill-payer roles distinguishable; provide exact permitted site links. | CS-01, CS-04 |
| Site → address | The site holds its physical address, time zone and site-level access/delivery context. Unknown/incomplete addresses remain visible. | CS-04, CS-06 |
| Site → facilities and growing areas | A structure, room, named area or field belongs to the exact site and has a stable identity plus an on-site position/reference. Do not require a copied postal address on every child. | CS-05 |
| Optional physical containment | A greenhouse can contain compartments; a pack room can be inside a structure; a field can belong directly to the site. Validate same-site parents and cycles. | CS-05, AD-03 |
| Structure, use and crop | Record construction/type separately from function and dated crop/season context. Unknowns and non-growing uses are valid. | CS-05, CS-06 |
| Equipment location | One installed asset has an exact physical location and historical identity, even when it serves multiple areas. | EQ-01, EQ-03, EQ-04 |
| Served areas and control groupings | Irrigation groups, controller zones, climate compartments, programme references and sensors need defined links. These do not automatically alter physical containment. | EQ-03, EN-02 |
| Address and work destination | Job packs and deliveries show site address plus named on-site destination. A receiving point can differ from the installation area. | SV-05, FI-03, SC-07 |
| Evidence and history | Preserve exact location, configuration, document revision, measurement unit and review status as at the work event. Avoid double-counting nested areas/shared equipment. | FI-03, EQ-08, EQ-09, RP-06 |

The approved Facility decision remains the adopted source for existing taxonomy, conditional fields, unknown values and reviewed change history. Reuse canonical Facility/Asset records where they fit; new grouping/served-area joins and their permissions need an explicit contract. This audit does not claim those additional relationships already exist in runtime. [Facility field decision](https://github.com/deanrfiedler-gif/powerplants-one/blob/ff90b8fcbff13a8b285d023fb2688d845358e567/docs/decisions/facility-field-proposal.md).

### Mapping the six examples

The labels below must be understandable and searchable in the UI. Existing approved structure/use fields should be reused where they fit; adding a named area or service relationship must not silently rewrite the existing data contract.

| Dean’s example | How it is represented in the page design | Important fields / distinctions | Covered by |
|---|---|---|---|
| Greenhouse | A structure on a site, with optional compartments or growing areas beneath it | Greenhouse structure type; actual cladding, footprint/bays where known; function/use and crop separate | CS-04, CS-05 |
| Tunnel | A named tunnel or tunnel block on a site | User-facing Tunnel label; reuse Polytunnel where the actual structure matches; cover, tunnel count and growing use where known | CS-04, CS-05 |
| Propagation House | A named facility whose function is propagation | Record its actual structure separately: it could be a greenhouse, tunnel, shade structure or indoor room. Do not assume construction from the facility’s name | CS-05, CS-06 |
| Pack Room | A non-growing packing facility or room, either standalone or within a structure | Packing function; local position, access and receiving arrangements; crop fields are not required for non-growing use | CS-05, SC-07 |
| Irrigation Block / Field | A named growing area/field directly on the site, or a defined irrigation grouping linked to the areas it serves | Local block/field identity and location; optional parent only for genuine physical containment; area/unit where known; irrigation/control links kept distinct | CS-05, EQ-03, EN-02 |
| Irrigation Shed | A non-growing structure or equipment room on a site | Pump/equipment-room function; local position; installed pumps/controllers/fertigation equipment linked as Assets, with separate served-area relationships | CS-05, EQ-01, EQ-03 |

Greenhouse, Tunnel, Propagation House, Pack Room, Irrigation Block / Field and Irrigation Shed are all explicitly named in CS-05. Keep the existing Other/Unknown options and conditional fields for useful incomplete records. “Propagation” describes use; “Raspberries” describes crop; neither alone identifies the physical structure. An irrigation block can exist independently of a known installed asset.

### What the pages must contain

| Page / surface | Required content and interaction |
|---|---|
| Organisation details and Sites tab — CS-01 | Multiple site links, permitted site/facility/growing-area counts, concise summary and View sites action |
| Site register and detail — CS-04 | Physical address, contacts/access, and the full named facilities/growing-areas hierarchy on that site; open or add the appropriate location |
| Facility / growing-area register and detail — CS-05 | List and hierarchy views; search/type/use filters; local name and stable identity; site/address context; optional parent; actual structure/area kind, function and crop; applicable dimensions/fields; exact on-site location; linked equipment, work and documents |
| Create/edit facility or area — CS-05 | Conditional fields for the selected kind/use; explicit unknowns; valid site/parent; controlled changes with comparison, cancellation and retained history; no requirement to invent a building, crop or equipment record |
| Site-plan / location references — CS-04/CS-05 | Local description and optional reviewed plan/drawing/photo reference to explain position. An interactive map or GIS provider is an optional later presentation enhancement, not a prerequisite for recording a location |
| Equipment and service coverage panels — CS-05/EQ-01/EQ-03 | Physical installation location and separate served growing areas/irrigation blocks; exact source and reviewed changes; controller references do not replace location identity |

The Facility page family can deliver these as coordinated registers, details, tabs and forms. “Growing area” does not by itself require a duplicate customer or site master. The implementation should reuse canonical Facility/Asset records where appropriate, and explicitly define any new irrigation-group or served-area relationship through a bounded contract change. This audit does not assert that those fields, joins or permissions already exist in runtime.

### Downstream location coverage

| Workflow | Entry updates | Required handover / behaviour |
|---|---|---|
| Search and navigation | SH-04, CS-01, CS-04, CS-05 | Find exact named on-site locations and distinguish identical names at different sites |
| Equipment and technical design | EQ-01–EQ-04, EN-02 | Separate where equipment is installed from what it supplies/controls; preserve physical and service relationships |
| Sales, estimating and project scope | CR-02, ES-02, PJ-01, PJ-09 | Select one or more exact facilities/areas/blocks beneath the site, retain scope through quotation/handover, and accept work by named area |
| Service, job packs and field work | CS-06, SV-03, SV-05, FI-03, FI-05 | Show site address plus on-site destination, applicable access/readiness instructions and exact location on inspection/retest evidence |
| Agreements and maintenance | MA-01, MA-03 | Distinguish whole-site coverage from selected facilities/areas/blocks and assets |
| Supply and delivery | SC-01, SC-07 | Preserve intended work-area allocation; distinguish the delivery/receiving point from the final installation area |
| Documents and customer portal | DK-01, CP-04 | Apply documents/reports to exact permitted sites and locations; show the customer only published and accessible scope |
| Data quality and reporting | AD-03, RP-06 | Validate relationships and names without automatic merging; avoid double-counting nested areas and shared assets |

### Acceptance examples for the future page designs

These are prospective design/implementation checks, not executed runtime tests:

1. One synthetic organisation has North Site and South Site, with different site addresses and separate facilities/growing-area lists.
2. North Site contains all six requested examples. Every record has a stable identity and an on-site location; none requires a duplicate site or a fabricated facility postal address.
3. Greenhouse 01 contains two named compartments. An outdoor Field A is a direct child of the site. A Pack Room may be standalone or a room inside a larger structure.
4. Propagation House retains its actual structure type and Propagation use separately. Pack Room and Irrigation Shed support non-growing use without mandatory crop values.
5. A pump physically located in Irrigation Shed 01 serves Block A and Block B. It appears once in the installed base, with separate served-area links. An irrigation grouping serving areas in multiple facilities does not rewrite their physical parents.
6. The same local name can occur at two sites without merging records. A name/parent/location change is reviewed and retains historical inspection, quotation and job-pack context; invalid cross-site parents/cycles are rejected.
7. An estimate and work order select multiple exact facilities/areas on the site. The resulting job pack shows the site address and each on-site destination; free-text scope notes alone are insufficient.
8. An inspection/retest retains its exact location and equipment context. Area-specific access restrictions are shown with their source; an unknown restriction is not treated as permission to proceed.
9. A maintenance agreement can cover selected areas and exclude others. A delivery can arrive at the Pack Room while materials remain allocated to a different installation area.
10. A restricted user cannot infer hidden facilities through search, hierarchy totals, documents or portal navigation. Reports do not sum a parent footprint and its contained areas as if they were disjoint.

### Additional horticultural review considerations

| Concern | R04 treatment | Confirmation still needed |
|---|---|---|
| Multi-site work | Stable organisation/site/facility context in search, surveys, estimates, work orders, documents and reports. | Exact access model and any cross-site service contract. |
| Seasonal constraints | Dated customer-provided crop-sensitive work/shutdown windows and site readiness, with owner/source. | Operational rules and actual schedule; no automatic booking or invented crop limits. |
| Biosecurity and access | Site-specific entry, cleaning, equipment movement and exit evidence. | Customer/site procedure, applicability and owner; no universal treatment instruction. |
| Climate/irrigation/fertigation systems | Explicit equipment, configuration, interface and served-area context. | Supported source protocols, OEM access and authorised operating tools. |
| Measurements | Instrument identity, units, calibration certificate/version and expected/measured/not-performed distinctions. | Domain tolerances, approved instruments and validity policy. |
| Recovery and handover | Exact configuration backups, reviewed recovery reference, as-built evidence and operator-training acknowledgement. | Actual recovery test and authorised controller process. |
| Stock and parts | Physical custody versus consumption, chargeability and ERP accounting; serial/quantity/unit reconciliation. | MYOB transaction ownership, warehouse/van setup and agreed recovery behaviour. |
| Grower production | CX-05 keeps crop/batch/harvest traceability integration visible. | A business case and authoritative external production source. |
| Resource improvement | CX-06 keeps water/energy analysis visible with baseline/period/coverage/units. | A justified measurement source and comparable business baseline. |

Industry context supports attention to people/equipment movement, hygiene and records; the proposed PPO screens are audit inferences and actual controls remain site-specific. [Farm Biosecurity](https://www.farmbiosecurity.com.au/). Connected climate and water systems are relevant context for horticulture equipment support; this does not establish an integration contract or authorise controls in PPO. [Priva](https://www.priva.com/).

## Professionalism, visual polish and interactions applied

| Area | Applied change | Boundary |
|---|---|---|
| Navigation | Compact navy family sidebar and four views: Page register, Horticulture fit, Audit findings, Evidence & scope. | On narrow widths, family filtering remains available in the main controls. |
| Visual hierarchy | Clear title/revision, five coverage metrics, restrained navy/green/neutral palette, consistent spacing and lighter content panels. | Counts describe scope; no artificial completion percentage. |
| Typography | Three embedded Roboto faces from the repository Finance r02 source, with fallback fonts. | No external font requests. The supplied attachment bytes are r16; direct inspection of the separately referenced r18 board is not claimed. |
| Density | Concise cards/table rows with complete descriptions and evidence in a docked inspection dialog. | Original scope text is retained; card summaries are intentionally abbreviated. |
| Search and filters | Search text/ID/record/requirement; family, class, priority, r04 change, horticulture focus and shortlist; count and reset. | Horticulture focus is an audit tag, not a complete semantic classifier. |
| Sort and alternate view | Family, ID, priority or page name; cards and table show the same filtered entries. | Sorting does not change the recommended scope. |
| Connected review | Clickable planning-input links and four synthetic horticultural scenario walkthroughs. | These illustrate page coverage, not live jobs or a simulated equipment controller. |
| Review work | Shortlist, Unreviewed / Keep for planning / Needs clarification / Defer, and notes with explicit save/discard. | Browser-local planning state, distinct from business approval or delivered status. |
| Review portability | Download JSON backup; validate schema, revision, known IDs, field types and size; preview import counts/overwrites, then apply explicitly. | Import merges the selected reviews and replaces matching IDs only. No server or shared synchronisation. |
| Export and print | Filtered briefs JSON and print output retaining full scope and saved notes. | Exports include the user's notes; the register does not transmit them. |
| Failure handling | Session-only review when storage is blocked/full, visible status, download backup, invalid-import rejection and unsaved-edit protection. | Changing browser or file origin can change the available local storage; use backup export. |
| Accessibility intent | Semantic labels/buttons/dialog, focus return, Escape handling, keyboard-operable actions, visible focus, reduced motion, 320px-targeted reflow CSS and no-JavaScript full list. | DOM checks do not prove native focus trapping, visual contrast, touch sizing, actual reflow or assistive-technology acceptance. |

The narrow-width CSS follows reflow principles, but rendered inspection is still required before claiming conformance. [W3C: Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

## Planning metadata and suggested sequencing

Every entry now includes its ID, title, family, full scope, proposed surface, coverage class, proposal basis, recommended priority, suggested reviewer role, records, source authority, planning inputs, three suggested checks, device context, change marker and source references. Family-level parent mappings are retained and labelled as such.

| Recommended order | Entries | Planning intent |
|---|---:|---|
| P1 | 46 | Core context, installed base, service/field, controlled evidence and essential shared data operations. |
| P2 | 81 | Domain completion and supporting technical/commercial operations, including the five new active specialist briefs. |
| P3 | 16 | Wider communication, customer collaboration and management review. |
| Conditional | 6 | Business-case-led extensions, separate from the active completion queue. |

These are **proposed priorities and functional reviewer roles**, not assigned people, committed dates, estimated effort or approved delivery gates. Technical dependencies, staffing and existing increments must determine the actual release plan. For example, CS-08 uses site/facility context before estimate handover; EQ-08/EQ-09 depend on reliable equipment/document evidence; SC-10 must reconcile to stock/dispatch/field and ERP ownership.

The largest remaining broad design packages remain service agreements/maintenance, engineering release, project controls, documents/knowledge, reporting and administration/data quality. Existing Finance r02, Equipment r01, customer/site foundations and other inspected previews should be reused. New detailed briefs must not create competing masters or duplicate acceptance workflows.

## Complete 149-entry register

The table in each family retains every full scope description. The HTML register also exposes each entry's complete planning metadata, linked inputs and suggested review checks. N/D/E/C are coverage classifications, not delivery statuses.

### SH — Home, My Work and shared navigation (6 briefs)

**Retained source baseline:** The shell, quick add, scoped global search and /work already exist. The notification control explicitly says it is not connected. Shell r14 also exists as a recent design.

**Family-level parent mapping:** CRM-03, DOC-06, NFR-01, NFR-05, NFR-08, NFR-11.

**Pinned sources:** [shell-controls.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/components/shell-controls.tsx); [model.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/shell/model.ts); [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| SH-01 · E | **Role-based home overview** — Page | Personal and team priorities, current jobs, upcoming commitments and meaningful drill-through; distinguish partial loading from an empty workload. | P1 |
| SH-02 · E | **My Work action centre** — Page | Extend shared Activities with approvals, blocked work, handovers, exceptions and follow-up; show the source, owner, due date or Date needed and exact next action. | P1 |
| SH-03 · N | **Notification inbox and preferences** — Page + panel | Unread updates, grouped changes, owned escalations, channel/digest preferences and deep links; reading a notice must not complete its business action. | P1 |
| SH-04 · E | **Global search results and record preview** — Panel + results page | Extend current search to newly delivered entities, exact documents and knowledge; type filters, source freshness, partial results and safe return to the originating page. Include named facilities, growing areas and irrigation blocks with organisation/site/location breadcrumbs; distinguish identical names at different sites. | P1 |
| SH-05 · E | **Personal and team saved views** — Panel | Name, save, duplicate, update, share within permitted teams and retire view definitions. Build on #179 URL state and the r35 preview; named persistent views remain an extension. | P1 |
| SH-06 · N | **Cross-module approvals and handover inbox** — Page | One entry point to domain-owned review tasks, ageing and returned submissions; each item opens the applicable approval screen rather than inventing one universal approval rule. | P1 |


### CS — Customers, contacts and sites (8 briefs)

**Retained source baseline:** Shared customer/contact/site routes and forms exist. The inspected Mobile CRM review r07 also contains organisation/contact screens, a Sites hierarchy and conditional Facility forms. FAC-D01–03 already define approved facility field/change rules. This family needs coordinated refinement and broader coverage; it is not an untouched module. R03 explicitly requires multiple addressed sites per organisation and named facilities/growing areas on each site. Structures, outdoor areas, optional physical nesting and irrigation service relationships are distinguished; the page register is clarified here, not marked implemented.

**Family-level parent mapping:** CRM-01, CRM-04, CRM-06, SVC-06.

**Pinned sources:** [context-screens.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/components/context-screens.tsx); [BP-03-crm.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-03-crm.md); [service-data-dictionary.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/contracts/service-data-dictionary.md); [facility-field-proposal.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/decisions/facility-field-proposal.md); [mobile-crm-handover.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/delivery/mobile-crm-handover.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| CS-01 · D | **Customer register and customer 360** — Pages | Refine the existing customer/organisation screens into a coordinated customer workspace with multiple linked sites. Show permitted site and facility/growing-area counts and View sites; keep the full hierarchy in Sites. Retain legal accounts, operator/owner/bill-payer relationships, linked deals, estimates, projects, service, equipment and communications. | P1 |
| CS-02 · D | **Contact directory and contact detail** — Pages | Extend the existing contact directory/detail with responsibilities, primary and secondary contacts, communication preferences, organisation/site relationships and relevant interaction history. | P1 |
| CS-03 · N | **Stakeholder and relationship view** — Tab | Decision makers, technical users, influencers, account ownership and relationship gaps; distinguish a recorded role from assumed purchasing authority. | P1 |
| CS-04 · D | **Site register and site workspace** — Pages | Provide a site register and site workspace for each of an organisation’s locations. Store the site’s physical address, time zone, access/delivery instructions and contacts. Show multiple structures, facilities and growing areas on that site, with names, location descriptions and optional site-plan references. Keep owner/operator/bill-payer roles distinct and open each canonical facility/area record. | P1 |
| CS-05 · D · Refined r04 | **Facilities and growing areas: registers, detail and forms** — Pages + hierarchy tabs + forms | Provide linked facility/growing-area registers, detail pages and create/edit forms for Greenhouse, Tunnel, Propagation House, Pack Room, Irrigation Block / Field and Irrigation Shed. Record site, local name/location, structure or area kind, function/use, crop where relevant, dimensions and optional parent. Support outdoor areas directly under a site and areas within structures. Retain approved type-change/history rules and separate equipment location from the areas it serves. Retain separate location, structure, use, crop and service-group concepts. Record changed use/season as dated context without turning the facility record into a crop-production ledger; dimensional roll-ups must avoid nested-area overlap. | P1 |
| CS-06 · N · Refined r04 | **Site access and horticultural readiness** — Tab + form | Record site access and facility/growing-area-specific readiness: crop-access windows, biosecurity, inductions, shutdown/irrigation constraints, visitor instructions and required tools, with source, owner and review date. Show which requirements apply to the chosen greenhouse, tunnel, block, field, room or shed; a facility type or parent relationship does not establish readiness. Add site-approved visitor/contact, movement and clean-down evidence with applicability and review dates; show seasonal work windows and crop-sensitive shutdown restrictions. A checklist acknowledgement is not blanket permission to work. | P1 |
| CS-07 · N | **Account development and visit plan** — Page | Territory/sector segmentation, relationship objectives, planned visits, customer reviews and accountable follow-up; a map is optional, not a separate customer master. | P1 |
| CS-08 · N · Added r04 | **Site survey and as-found brief** — Page + capture form | Capture the exact site, structures and growing areas before design or upgrade: measured dimensions and units, photographs, utility/water connection observations, existing equipment, access constraints and owned unknowns. Record who observed each fact, when and by what method; distinguish customer statements, measurements and unverified assumptions. Issue a reviewed brief to estimating and engineering. | P2 |


### EQ — Equipment and installed base (9 briefs)

**Retained source baseline:** Shared Equipment runtime already shows configuration snapshots, attributed technical history and retained location events. Draft PR #183 now supplies the dedicated Equipment and Installed Base r01 HTML, including identification and inspection/defect/retest flows. Its authored design exists; browser acceptance and application integration remain pending.

**Family-level parent mapping:** CRM-06, SVC-06, SVC-12, ENG-07, DOC-01.

**Pinned sources:** [page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/equipment/page.tsx); [page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/equipment/[id]/page.tsx); [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md); [context-screens.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/components/context-screens.tsx).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| EQ-01 · E · Refined r04 | **Installed-base register and equipment workspace** — Pages | Review and integrate Equipment r01 from draft PR #183: searchable installed-base register, precise customer/site/facility identity, model/serial, coverage unknowns, linked history/documents and inspection entry. Extend the wider lifecycle after visual acceptance; do not recreate this workspace. Show the equipment’s physical site/facility/area location separately from linked irrigation blocks or growing areas it serves; retain one asset record for shared equipment. Record customer-declared criticality, affected growing areas, redundancy and escalation contacts with source/date. A crop-impact label must not be treated as an automatic diagnosis or permission to intervene. | P1 |
| EQ-02 · E | **QR lookup and equipment identity confirmation** — Page + mobile flow | Extend r01 sample QR/manual reference/serial/UUID lookup and explicit identity confirmation to an implemented scanning journey. Include camera refusal/failure, unknown, moved, retired, inaccessible and unavailable records; retain manual lookup. Show the site address and precise on-site facility/area when confirming identity; a shed-mounted pump must not be shown as physically located in every block it supplies. | P1 |
| EQ-03 · E · Refined r04 | **Configuration and change history** — Tab | Extend existing runtime snapshots and r01 configuration/history into controlled configuration revisions: hardware, software/firmware, licences and connected components; preserve the exact configuration used by each historical visit. Include versioned equipment-to-served-area relationships and controller zone/block references where defined; changing a programme number must not change the area’s identity. Separate climate compartments, irrigation valves/blocks, sensor groups, control programmes and physical assets; retain exact protocol/interface and source revisions where established. | P1 |
| EQ-04 · N | **Equipment movement, replacement and retirement** — Form + history tab | Add the controlled change form around existing location history: effective-dated relocation, predecessor/successor equipment, removed components, replacement/retirement reason and reviewed impact on maintenance and open work. Review changes to both physical location and served-area links; retain historical site/facility/area references and their effects on open work and maintenance. | P1 |
| EQ-05 · E | **Equipment document and service timeline** — Tab | Extend r01 equipment-specific documents and service timeline with governed applicability, exact manual/drawing revisions, photographs, prior diagnoses, unsuccessful fixes, changed parts and unresolved findings; integrate the authoritative sources. | P1 |
| EQ-06 · N · Refined r04 | **Service bulletin applicability** — Page + tab | Supplier bulletin revision, model/serial/software criteria, affected and uncertain assets, reviewed applicability and individually owned follow-up. Show affected and potentially affected site/area scopes, reviewed applicability and customer-contact follow-through; closure requires evidence for each affected asset. | P1 |
| EQ-07 · N | **Support lifecycle and obsolescence** — Tab | Support dates, discontinued parts, supported replacements and upgrade candidates; unknown evidence remains visible and no automatic substitution is made. | P1 |
| EQ-08 · N · Added r04 | **Control configuration backup and recovery record** — Tab + review flow | Record approved configuration backup references, software/firmware compatibility, capture date, configuration revision, custodian, recovery procedure and last verified recovery evidence. Link an upgrade to its pre-change backup and post-change handover. Keep secrets in the approved secret store; this page does not execute a controller restore. | P2 |
| EQ-09 · N · Added r04 | **Test instruments and calibration evidence** — Register + linked panel | Identify the instrument used for each inspection: instrument ID, measurement type/range/unit, calibration certificate, calibration date, validity basis and status at the time of capture. Preserve the certificate/version used in historical submissions and flag evidence requiring review. This supports measurement trust; broader company-tool custody remains CX-01. | P2 |


### CR — CRM and sales extensions (5 briefs)

**Retained source baseline:** Deals Board/List, Leads, create/detail, stage movement, outcomes and owner transfer have designs and bounded runtime. Recent Deals r35 additionally demonstrates detail tabs, tasks, documents and insights. Preserve that work.

**Family-level parent mapping:** CRM-02, CRM-03, CRM-04, CRM-05, CRM-07, CRM-08.

**Pinned sources:** [BP-03-crm.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-03-crm.md); [crm-screen-specification.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/crm-screen-specification.md); [crm-handover-journey.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/crm-handover-journey.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| CR-01 · E | **Opportunity detail and internal work** — Page + tabs | Reconcile r35 Overview, Scope & estimating, Activities, Tasks, Conversation, Documents and Contacts with current runtime; retain separate deal and activity ownership. | P2 |
| CR-02 · E | **Sales-to-estimating handover** — Form + review page | Versioned customer brief, scope, attachments, required date, unknowns, receiving owner, accept/return and explicit follow-up; coordinate existing intake previews. Carry the exact site and selected facilities/growing areas or irrigation blocks in the brief; one handover may cover several on-site locations. | P2 |
| CR-03 · E | **Won-deal receiving handover** — Page | Turn existing Won/handover-due into controlled Service/Project/parts-order acceptance, preserved commercial basis, rejected/returned paths and original-result recovery. | P2 |
| CR-04 · E | **Pipeline insights and forecast review** — Page or expanded panel | Ageing, stage history, slipped dates, next-action coverage, forecast categories and denominators; extend r35 insights without inventing adopted probability or revenue rules. | P2 |
| CR-05 · N | **Sales aftercare and renewal worklist** — Page | Post-installation reviews, training follow-up, maintenance opportunities and renewal tasks linked to the original customer and service records. | P2 |


### ES — Estimating and quotation extensions (10 briefs)

**Retained source baseline:** Workspace, wizard, container, E2 walkthrough and quotation-builder HTML exist. E1 and the adopted E2 subset are on main. Recent quotation module r03 supplies a customer presentation/response design. E3–E6 remain wider work.

**Family-level parent mapping:** EST-01, EST-02, EST-03, EST-04, EST-05, EST-06, EST-07, EST-08, EST-09.

**Pinned sources:** [estimating-screen-specification.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/estimating-screen-specification.md); [estimating-implementation-plan.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/delivery/estimating-implementation-plan.md); [estimate-actual-feedback-design.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/estimate-actual-feedback-design.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| ES-01 · E | **Estimating intake and workload** — Page | Owned incoming requests, estimator allocation, priority, due dates, clarification, returned briefs and accepted work; extend the current estimating register. | P2 |
| ES-02 · E | **Discovery, alternatives and revision comparison** — Tabs | Finish the existing E2 design against delivered scope: selected option, locks, owned unknown answers, resnapshot differences and preserved historical basis. Add explicit facility/growing-area/block selection beneath the chosen site, including multi-area scope and source revisions. Retain those identities through estimate options, quotation and downstream handover; free-text notes alone do not complete structured scope. | P2 |
| ES-03 · N · Refined r04 | **Cost-source and supplier-price review** — Page + tab | Catalogue/manual provenance, supplier quotation validity, currency, freight and approved allocation basis; compare refresh effects before creating a successor estimate. Include validity/lead-time assumptions, freight/import and commissioning cost basis, approved currency/tax context and responsibility for supplying each cost source. | P2 |
| ES-04 · N | **Estimate review and pricing exceptions** — Page | Quantity/source checks, margin versus markup, discount exceptions and independent pre-bid findings; estimate review and approval remain separate decisions with supplied policies. | P2 |
| ES-05 · N | **Quotation approval, issue and distribution** — Page + review flow | Approved source estimate, exact scope/terms/template, output preview, quote approval, issue register, distribution evidence and superseded revisions. | P2 |
| ES-06 · E | **Quotation response and negotiation** — Page | Extend recent customer quotation r03 into a controlled lifecycle: exact revision, selected options, clarification, acceptance, decline, expiry and revised offers without inherited acceptance. | P2 |
| ES-07 · N | **One-off item resolution and conversion** — Page | Resolve unrecognised items, map company/entity keys, review target lines, show partial/unknown outcomes and reconcile retries without duplicate orders. | P2 |
| ES-08 · N · Refined r04 | **Specialist configuration workbench** — Page | Start with the specified Screen Systems family; inputs, approved ranges, formula/version evidence, generated parts, overrides and safe rerun. Further equipment calculators require separate validated definitions. Keep irrigation, climate, lighting and other specialist calculations tied to approved formulae, input units, operating assumptions and source versions; the initial family remains the agreed Screen Systems scope. | P2 |
| ES-09 · N | **Estimate-to-actual outcome review** — Page | Compare issued estimate, accepted estimate and attributable actuals; separate negotiation from delivery variance, retain reason codes and explicitly mark incomparable cases. | P2 |
| ES-10 · N | **Reference cases and calibration proposals** — Page + estimator panel | Reviewed comparable jobs, sample sizes and limitations, reusable scope and rate suggestions, and a reviewed calibration proposal; never silently reprice current or historical estimates. | P2 |


### EN — Engineering and design control (8 briefs)

**Retained source baseline:** Engineering Container r02 covers the register, request intake, Overview, Deliverables, Technical queries and Review/history. Its runtime is bounded intake/persistence; it does not complete technical release.

**Family-level parent mapping:** ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07.

**Pinned sources:** [PPO-Engineering-Container-r02.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/engineering-r02/PPO-Engineering-Container-r02.html); [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| EN-01 · E | **Engineering workload and deliverables** — Page + tabs | Extend r02 with accountable packages, discipline, authorised effort, prerequisite evidence, capacity and separate author/reviewer queues. | P2 |
| EN-02 · N · Refined r04 | **Design basis and interface register** — Tabs | Requirements, assumptions, calculation/model references and mechanical/electrical/control/irrigation responsibilities, each with owner and affected deliverables. Tie drawings and irrigation/control interfaces to the exact site, structures and served growing areas/blocks; distinguish physical containment from supply or control relationships. Make irrigation, climate, electrical, lighting, controls and utility interfaces explicit where in project scope. Specify interface owners and source drawings, not inferred live control access. | P2 |
| EN-03 · N | **Drawing and controlled technical document register** — Page | Drawing identity, discipline, native source link, revision, purpose, reviewer, release state and supersession; preserve CAD authoring relationships. | P2 |
| EN-04 · E | **Technical queries and supplier submittals** — Pages or tabs | Expand the r02 query area into response deadlines, approved answers, supplier/equipment/PO links, comments, resubmissions and consequential scope changes. | P2 |
| EN-05 · N | **Technical review, approval and transmittal** — Page + review flow | Exact drawings/calculations, reviewer findings, approval purpose, controlled issue set and distribution receipts; approval for review differs from approval for installation. | P2 |
| EN-06 · N | **Released materials and substitutions** — Page | Engineering material requirements, product/ERP item/unit mapping, substitution comparison, compatibility evidence and procurement handover. | P2 |
| EN-07 · N | **Engineering change-impact review** — Page | Technical change reason, source revision, affected purchased/installed assets, cost/date implications, recipients and required retest; preview before action. | P2 |
| EN-08 · N · Refined r04 | **Commissioning basis and as-built release** — Page | Approved test procedure, criteria, field redlines, installed configuration, final technical approval and service handover references; use the shared inspection engine. Retain commissioning criteria, sensor/valve/area associations, backups where relevant, training evidence and a clear as-built versus intended-design comparison. | P2 |


### PJ — Projects and commercial delivery (9 briefs)

**Retained source baseline:** Project register/detail, r02 interactive review and Gantt designs already exist; the Gantt runtime has manual schedules. J1 reconciliation and J1–J5 plans describe remaining work.

**Family-level parent mapping:** PRJ-01, PRJ-02, PRJ-03, PRJ-04, PRJ-05, PRJ-06, PRJ-07, PRJ-08.

**Pinned sources:** [BP-06-projects-commercial-delivery.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-06-projects-commercial-delivery.md); [projects-j1-reconciliation.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/delivery/projects-j1-reconciliation.md); [projects-implementation-plan.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/delivery/projects-implementation-plan.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| PJ-01 · E | **Project initiation and receiving review** — Page + form | Extend existing creation with accepted sales scope, delivery owner, milestones, open assumptions and explicit return/rework of incomplete handovers. Receive the exact site and one or more facility/growing-area/block scopes, retaining their identities through work packages and project changes. | P2 |
| PJ-02 · E | **Project overview and portfolio health** — Pages | Complete current detail/register with manual health rationale, owned recovery action, next milestone, next Activity and project-specific completeness. | P2 |
| PJ-03 · E | **Baseline, forecast and dependency review** — Gantt tabs + forms | Extend Gantt with approved baselines, meaningful predecessor relationships, calendars, actual progress, forecast changes and separately requested Service booking changes. | P2 |
| PJ-04 · N | **RAID, decisions and project actions** — Page or tabs | Distinct risks, assumptions, issues and dependencies; owner, impact, due date, mitigation and decision history with linked evidence. | P2 |
| PJ-05 · N | **Contract obligations, notices and variations** — Page + detail | Original/revised scope, deliverables, notices, proposed/priced/approved/disputed changes, contractual dates and evidence; use reviewed contract rules. | P2 |
| PJ-06 · N | **Subcontractor and specialist packages** — Page | Package scope, supplier, deliverables, dates, required competence evidence, technical reviews and work records linked to controlled procurement references. | P2 |
| PJ-07 · N · Refined r04 | **Readiness and change-impact review** — Page | Engineering, materials, site, crew and customer prerequisites with source/time/owner; show affected commitments and unknown effects before changes are requested. Include crop windows, seasonal timing, shutdown/contingency arrangements, supply lead time and customer prerequisites with explicit owners and a human review of affected commitments. | P2 |
| PJ-08 · N | **Stakeholder update preparation and publication** — Page | Create a customer-safe update from reviewed project facts; internal review, exact issued revision, audience, distribution evidence and withdrawal. | P2 |
| PJ-09 · N · Refined r04 | **Staged acceptance and closeout** — Page | System/area acceptance, training, documents, assets, open defects, service owner and separate technical, customer and commercial completion decisions. Record staged acceptance by named facility, greenhouse compartment, growing area or irrigation block and preserve its exact scope in service handover. Include customer/operator training, handed-over manuals/configuration references and outstanding support obligations as individually evidenced closeout items. | P2 |


### SV — Service desk and work coordination (8 briefs)

**Retained source baseline:** Requests, work orders, appointments, packs, review reports and My Jobs have runtime routes. Job Pack r03 and Field Technicians r05 are accepted design successors. The missing work is a cohesive service-desk design and wider operational detail.

**Family-level parent mapping:** SVC-01, SVC-02, SVC-03, SVC-05, SVC-10, SVC-11, SVC-12.

**Pinned sources:** [BP-07-service-operations.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-07-service-operations.md); [service-api.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/contracts/service-api.md); [job-pack-design.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/decisions/job-pack-design.md); [field-technicians-design.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/decisions/field-technicians-design.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| SV-01 · D · Refined r04 | **Service desk and triage worklist** — Page | Requests by urgency, site, equipment, owner, impact, awaiting customer/parts and stale follow-up; distinguish request state from work-order and appointment state. Show customer-reported crop/process impact and a source-based escalation owner without inventing an SLA or letting urgency bypass required work authority. | P1 |
| SV-02 · D | **Request detail and communication timeline** — Page | Reported symptoms, scope questions, public/private notes, attachments, triage decision, coverage uncertainty and linked work/visits. | P1 |
| SV-03 · D | **Work-order register and scope workspace** — Pages | Authorised tasks, equipment, exclusions, work/spend limits, coverage, prerequisites, multiple visits and remaining work with controlled revisions. Select the site and affected facilities/growing areas/blocks, including work without a known asset and work spanning several areas; preserve scope on each revision. | P1 |
| SV-04 · D | **Appointment coordination detail** — Page | Crew, contact arrangements, readiness, tentative/confirmed/cancelled attendance, pack version and change acknowledgements; link into the existing planner. | P1 |
| SV-05 · E | **Job-pack preparation and issue follow-through** — Page + tabs | Integrate/reconcile accepted r03; exact source documents, missing prerequisites, reviewed exceptions, issue revisions, change summaries and individual crew acknowledgement. Print/show the site address plus the exact on-site facility/area, access route, reviewed site-plan reference where available, equipment location and relevant served blocks. | P1 |
| SV-06 · D | **Service review and controlled report workspace** — Pages | Review submitted labour/parts/findings, return for correction, separate billability, exact report generation, customer responses and Finance handoff. | P1 |
| SV-07 · N · Refined r04 | **Unresolved findings and follow-up worklist** — Page | Owned technical problems, unsuccessful fixes, recommendations and next visits; a completed visit or issued report must not hide unresolved customer work. Track recurrence and related failures across visits while preserving the difference between symptoms, suspected cause and verified root cause. | P1 |
| SV-08 · N · Added r04 | **Remote diagnosis and OEM escalation** — Page + evidence timeline | Coordinate customer-reported faults, consent and contact arrangements, exact asset/configuration, logs/screenshots, troubleshooting already attempted, OEM case reference, questions, response evidence and owned next action. Distinguish advice, an authorised technical intervention and a required site visit. Remote access uses separately approved tooling and current authority. | P2 |


### PL — Resource planning and dispatch (5 briefs)

**Retained source baseline:** The day/week planner and Field Technicians views already exist. These pages extend resource and change coordination without replacing confirmed booking authority.

**Family-level parent mapping:** SVC-04, SVC-05, PRJ-04, ENG-01, NFR-08, NFR-09.

**Pinned sources:** [BP-07-service-operations.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-07-service-operations.md); [page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/schedule/page.tsx); [powerplants-one-field-technicians-r05.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/ui/field-technicians/powerplants-one-field-technicians-r05.html).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| PL-01 · E · Refined r04 | **Service planner and unassigned demand** — Page | Extend day/week planning to a useful multi-week outlook, crews, multi-day visits, travel, regions, skills and preparation blockers with keyboard alternatives to drag. Show seasonal/customer work windows, permitted shutdown windows, weather/access constraints where supplied and explicit alternatives; no booking changes follow automatically from an advisory forecast. | P2 |
| PL-02 · N | **Resource availability and competence** — Page + detail | Operational calendars, leave/unavailable periods, skills, certificates, expiry/review evidence and eligible work; exclude payroll and private HR records. | P2 |
| PL-03 · N | **Cross-domain resource demand and capacity** — Page | Engineering, installation and service demand; tentative versus committed work, bottlenecks and scenario effects without silently changing bookings. | P2 |
| PL-04 · E | **Rescheduling and acknowledgement centre** — Page + review flow | Review proposed old/new visits, conflict reasons, affected people and direct-contact outcomes for disconnected technicians; retain existing concurrent-change protection. | P2 |
| PL-05 · N | **Visit route and travel review** — Page or planner tab | Geographical grouping, explicit travel allowances and visit sequence with unknown address/time cases; any routing service remains separately selected and validated. | P2 |


### FI — Field work, inspections and site assurance (7 briefs)

**Retained source baseline:** My Jobs, controlled field capture, offline workspace and service report submission exist. Structured inspections and horticultural readiness are adopted extensions F02/F08; they should share one engine across Service and Projects. Equipment r01 in draft PR #183 now demonstrates structured readings, evidence, immutable submissions, owned defects and reviewed successor retests. FI-03/FI-04 therefore extend an existing design.

**Family-level parent mapping:** SVC-06, SVC-07, SVC-08, SVC-09, SVC-10, SVC-11, ENG-07, PRJ-06, NFR-07.

**Pinned sources:** [BP-07-service-operations.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-07-service-operations.md); [index.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/public/offline/index.html); [document-issue-distribution.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/contracts/document-issue-distribution.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| FI-01 · D · Refined r04 | **Technician Today and job execution** — Mobile pages | Refine assigned jobs, personal start, current pack, history, task progress, labour/travel, parts and findings into a cohesive field design with clear save status. Make field capture practical with large touch targets, limited typing, explicit measurement units, photo context and clear draft/saved/queued states. Voice remains optional and reviewed. | P1 |
| FI-02 · E | **Offline downloads, queue and conflict recovery** — Mobile pages | Refine existing offline UI for downloaded scope, last sync, pending photos, queued originals, failed/conflicted work and recoverable evidence after identity or assignment changes. | P1 |
| FI-03 · E · Refined r04 | **Inspection and commissioning form runner** — Page + mobile flow | Extend Equipment r01’s structured inspection demonstration into a reusable procedure runner: versioned templates, conditional questions, readings/units, approved limit sources, photos, instruments/calibration and assigned visits. Implement source, permission and persistence controls; example limits are not operating criteria. Bind each inspection and retest to its exact site and facility/growing area/block as well as equipment where applicable; retain location context with submitted evidence. Add instrument eligibility and calibration links, expected versus measured values, source-defined precision and evidence for Not performed; the procedure defines limits and reviewer authority. | P1 |
| FI-04 · E | **Inspection review, defects and retests** — Page | Extend r01’s failed-inspection, owned-defect and passing-retest journey into the shared review workspace: failed/missing checks, hold/release, corrective action, successor retests and partial acceptance. Preserve original evidence and keep work completion separate. | P1 |
| FI-05 · N · Refined r04 | **Site induction, risk and biosecurity review** — Page + mobile checklist | Site-approved access/cleaning instructions, relevant risk/safe-work references, acknowledgements and changing restrictions; requirements come from competent source owners. Identify the specific work area and applicable instructions at both site and facility/block level; do not infer safe access from a parent location or facility label. Record required clean-down/entry/exit evidence and customer/site instructions where applicable, without prescribing a generic chemical, method or re-entry interval. | P1 |
| FI-06 · N | **Incident and corrective-action record** — Page + form | Attributable event report, affected work, attachments, restricted details where needed, owner, response and reviewed closure; exact required content follows the site's management system. | P1 |
| FI-07 · D | **Customer attendance and report response** — Mobile review flows | Separate attendance confirmation from acceptance/remarks on an exact report; unavailable, declined and disputed paths retain context and do not authorise extra charges. | P1 |


### MA — Service agreements, maintenance and warranty (7 briefs)

**Retained source baseline:** SVC-12 and issue #15 define the wider lifecycle. Existing coverage/manual follow-up does not amount to a full agreement, recurrence or warranty workspace.

**Family-level parent mapping:** SVC-12, CRM-07, SCM-07, FIN-03.

**Pinned sources:** [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md); [BP-07-service-operations.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-07-service-operations.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| MA-01 · N | **Agreement register and agreement detail** — Pages | Contracting party, covered sites/assets, effective dates, scope, exclusions, response terms, billing ownership and exact source contract/version. Make covered and excluded facilities, growing areas and irrigation blocks explicit beneath each site; whole-site coverage and selected-area coverage must be distinguishable. | P2 |
| MA-02 · N | **Coverage and entitlement assessment** — Page or review panel | Known, unknown and disputed coverage; installation, commissioning and warranty dates separated; record evidence, decision, owner and billability handover. | P2 |
| MA-03 · N · Refined r04 | **Maintenance plans and task templates** — Pages | Covered assets/systems, versioned task sets, interval/anchor/time zone, responsible owner and next-due explanation; no invented service interval. Allow the defined maintenance scope to identify a facility/growing area/block or specific assets, keeping physical location, served areas and recurrence ownership distinct. Distinguish calendar, usage and inspection-triggered maintenance only when the actual source agreement/procedure defines the trigger; retain seasonal exceptions and deferred-work ownership. | P2 |
| MA-04 · N | **Due-maintenance occurrence worklist** — Page | Stable occurrences, generate/review/request work, skip/defer/cancel with reason and prevent duplicate generation; a due occurrence is not a confirmed booking. | P2 |
| MA-05 · N | **Renewals and service relationship review** — Page | Expiring agreements, customer review tasks, proposed successor terms and acceptance evidence; reuse CRM Activities and commercial records. | P2 |
| MA-06 · N | **Warranty case and customer resolution** — Pages | Failure evidence, responsibility/coverage review, repair or replacement, customer outcome and future maintenance effects; preserve removed/replacement asset history. | P2 |
| MA-07 · N | **Supplier recovery coordination** — Tab + linked worklist | Supplier claim, supporting technical evidence, response and outstanding recovery linked to Supply Chain returns and Finance credit evidence; retain separate states. | P2 |


### SC — Supply Chain and logistics (10 briefs)

**Retained source baseline:** Material Readiness r03 is a real off-repository design with four views: Material readiness, Purchasing, Inbound shipments and Receipts/inspection. Its new-demand, promise, receipt and allocation interactions already exist. Full SCM runtime is absent from main.

**Family-level parent mapping:** SCM-01, SCM-02, SCM-03, SCM-04, SCM-05, SCM-06, SCM-07, SCM-08.

**Pinned sources:** [supply-chain-readiness.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/contracts/supply-chain-readiness.md); [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| SC-01 · E | **Demand and material-readiness workspace** — Page | Reconcile r03 with the receiving contract: forecast versus approved demand, required-by dates, quantities, units, completeness, shortages and accountable blockers. Carry the selected facility/growing-area/block scope into demand and material allocation while retaining site and project/service identities. | P2 |
| SC-02 · E | **Purchasing and supplier commitments** — Page | Expand existing r03 with requisition approval, supplier RFQs/quotation comparison, purchasing references, manufacturing milestones and technical-submittal obligations. | P2 |
| SC-03 · E · Refined r04 | **Inbound shipments and line allocations** — Pages | Extend r03 with split shipments/PO lines, supplier dispatch, ETA changes, customs/broker references, freight documents and affected project/service allocations. Include supplier manufacturing status, import/customs milestones and dated ETA confidence where supported, with separate customer/job promises and owned exception follow-up. | P2 |
| SC-04 · E | **Receipt, inspection and quarantine** — Page + mobile form | Complete r03 partial receipts, damage, shortages, usable versus held quantities, evidence and reviewed disposition linked to authoritative ERP outcomes. | P2 |
| SC-05 · N | **Stock availability and reservations** — Page | Company/warehouse/bin/item/unit, on hand, available, reserved and quarantined states with source time; review competing demand and external confirmation of reservation. | P2 |
| SC-06 · N | **Picking and dispatch preparation** — Page + mobile flow | Job-linked pick lists, picked versus staged stock, substitutions requiring approval, packing, serial/batch evidence where relevant and dispatch confirmation. | P2 |
| SC-07 · N | **Customer delivery and proof of delivery** — Page + mobile flow | Delivery lines, partial delivery, contact arrangements, evidence, exceptions and outstanding quantities; carrier arrival and customer acceptance remain distinct. Separate the site delivery address and receiving point, such as the Pack Room, from the intended installation or use area, such as Greenhouse 02 or Irrigation Block A. | P2 |
| SC-08 · N | **Returns, supplier claims and credit tracking** — Pages + linked tabs | Return authorisation, receipt/disposition, supplier claim and ERP credit as separate records/outcomes; include warranty links and unknown external results. | P2 |
| SC-09 · N | **Material change-impact review** — Page or drawer | Compare promise/quantity/substitution changes against readiness, scheduled visits and project work; retain r03 interaction foundations and require explicit downstream actions. | P2 |
| SC-10 · N · Added r04 | **Service stock custody and job reconciliation** — Page + reconciliation flow | Trace approved stock transfers between warehouse, technician/van and job: issued, used, unused returned, damaged, quarantined or missing quantities with unit and serial/batch where applicable. Distinguish custody from consumption and chargeability. Reconcile against the authoritative inventory source before closing exceptions. | P2 |


### PD — Products and catalogue governance (5 briefs)

**Retained source baseline:** Products Preview r04 already contains catalogue/detail, specifications, parts/accessories, documents, commercial/history tabs and an estimate selection flow. No Products application route is on main.

**Family-level parent mapping:** EST-04, EST-05, EST-06, SCM-02, ENG-05, DOC-04.

**Pinned sources:** [BP-04-estimating-quotation.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-04-estimating-quotation.md); [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| PD-01 · E · Refined r04 | **Catalogue and product technical workspace** — Pages + tabs | Reconcile r04 with the governed data model: product/model/variant, technical specifications, compatible parts, source manuals and restricted commercial information. Cover irrigation/fertigation, climate control, sensors, lighting and other supported product families through governed technical attributes and unit definitions; do not infer compatibility from a shared brand. | P2 |
| PD-02 · N | **Catalogue authoring and publication review** — Page | Propose/edit records, compare source changes, validate required metadata, independent review where required, effective revision and withdrawal with history. | P2 |
| PD-03 · N | **Price books and supplier-source maintenance** — Page | Supplier quotation/catalogue version, currency, effective/expiry dates, cost visibility and reviewed price changes; retain the basis already used by an estimate. | P2 |
| PD-04 · N · Refined r04 | **Compatibility, replacements and product lifecycle** — Page or tabs | Approved accessory/part relationships, technical constraints, superseded models, replacement candidates and support evidence; no automatic cross-sell or substitution commitment. Distinguish technical compatibility, supported firmware, physical replacement suitability and commercial availability; retain each source and review decision. | P2 |
| PD-05 · N | **Catalogue import and exception review** — Page | Staged row validation, external-key/unit mapping, duplicates, missing technical evidence, change preview and controlled publication; reuse shared data-quality operations. | P2 |


### FN — Finance and commercial controls (6 briefs)

**Retained source baseline:** Finance r02 is on main through merged PR #184, preserving r01. It has Work queue, Handoff review, Customer accounts and Reconciliation, with no-posting/correction journeys and scripted source-bound assistance. It remains a proposed HTML design with visual acceptance and application integration pending; project Finance and approved financial definitions remain wider work.

**Family-level parent mapping:** FIN-01, FIN-02, FIN-03, FIN-04, FIN-05, FIN-06, FIN-07, FIN-08.

**Pinned sources:** [PPO-Finance-and-Commercial-Controls-r01.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r01.html); [finance-handoff.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/contracts/finance-handoff.md); [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md); [finance-workspace-design.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/decisions/finance-workspace-design.md); [PPO-Finance-and-Commercial-Controls-r02.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r02.html).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| FN-01 · E | **Finance workspace and service-handoff follow-through** — Pages + tabs | Integrate and visually validate Finance r02’s four-view design: queue, handoff review, accounts and reconciliation. Preserve no-posting, cancellation/return, corrections, role boundaries, exact quantities, source evidence and unknown-outcome recovery; live integration remains separate. | P2 |
| FN-02 · E | **Customer accounts, applications and exceptions** — Pages + tabs | Build on r02’s connected account contexts, invoice/payment/credit/deposit applications, reversals and dated read observations. Complete disputes, unapplied amounts and adopted ageing definitions with company/currency/source completeness and authoritative MYOB reads. | P2 |
| FN-03 · N | **Project financial performance** — Page | Original/revised approved budgets, actuals, commitments, remaining forecast, billed amounts and cash with approved non-overlapping definitions and drill-through. | P2 |
| FN-04 · N | **Milestone claims and commercial obligations** — Page | Claim evidence, approved variations, claim status and relevant retention/security obligations; show disputes and distinguish submissions from ERP invoices/revenue. | P2 |
| FN-05 · N | **Cash timing and commercial outlook** — Page | Expected billing/receipts and committed outflows on an explicit source/date/currency basis; scenarios and forecasts remain distinguishable from posted accounting results. | P2 |
| FN-06 · N | **Financial measure definitions and reconciliation review** — Page | FD-01–FD-10 versions, source field mappings, inclusion rules, tolerances, approvals and evidence; undefined or incomplete metrics never appear as verified zeroes. | P1 |


### DK — Documents, knowledge and controlled publication (7 briefs)

**Retained source baseline:** Exact issued-document detail and module attachments exist. Contextual Help has an HTML preview. A central document/knowledge operational workspace was not found on main.

**Family-level parent mapping:** DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06.

**Pinned sources:** [document-issue-distribution.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/contracts/document-issue-distribution.md); [contextual-help-design.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/contextual-help-design.md); [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| DK-01 · N | **Document register and linked library** — Page | Search/filter by customer, site, asset, project, type, revision and audience; stable SharePoint/source identities, applicability and current versus superseded states. Include facility/growing-area/block filters and exact location applicability for site plans, drawings, manuals and reports; a site-wide document need not apply to every area. | P1 |
| DK-02 · E | **Document viewer, revision and review workspace** — Page + tabs | Extend exact-issue view with source metadata, version comparison, comments, review findings, approval purpose and current/historical issue relationships. | P1 |
| DK-03 · N | **Output, issue and distribution centre** — Page | Track generated quotations, packs, reports, transmittals and updates; exact source/template/hash, audience, sent/delivered/acknowledged separately and actionable failed generation. | P1 |
| DK-04 · N · Refined r04 | **Knowledge search and article detail** — Pages | Reviewed troubleshooting, procedures and lessons with model/software applicability, sources, reviewer and review date; display uncertain or superseded advice clearly. Show source applicability to equipment model, firmware and growing context, plus review/expiry status; suspected fixes remain distinct from validated procedures. | P1 |
| DK-05 · N | **Knowledge authoring, review and learning intake** — Page | Draft from reviewed service/engineering evidence, proposed reusable guidance, source excerpts, technical review, publication/withdrawal and confidentiality checks. | P1 |
| DK-06 · N | **Document and form template management** — Page | Versioned templates, applicability, mandatory/conditional fields, preview, approval, publication and successor handling; retain old templates for issued history. | P1 |
| DK-07 · E | **Page guides and contextual help coverage** — Panel + guide pages | Extend the existing CRM guide preview to every delivered workspace; role/task steps, useful field explanations, keyboard alternatives and direct links to owned support. | P1 |


### EC — Email, calendar and communications (4 briefs)

**Retained source baseline:** An Email & Calendar HTML prototype and synthetic inbox/detail/calendar runtime already exist. The branch and runtime provider preparation do not establish a live mailbox integration.

**Family-level parent mapping:** CRM-03, DOC-05, DOC-06, NFR-03, NFR-05.

**Pinned sources:** [email-calendar-integration.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/email-calendar-integration.md); [index.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/email-calendar-prototype/index.html); [page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/calendar/page.tsx).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| EC-01 · E | **Connected inbox and record-linking review** — Pages + panels | Complete provider-aware folders/threads, explicit filing to permitted records, private/shared visibility, duplicate handling and recovery while retaining current synthetic journey behaviour. | P3 |
| EC-02 · N | **Mailbox connection and synchronisation status** — Page | Supported account consent, connection health, last sync, partial/unavailable data, reconnect and removal/purge status; expose no credentials and verify provider ownership first. | P3 |
| EC-03 · E | **Calendar and activity coordination** — Page | Personal/team activity views, record links, attendee handling, source/time zone, sync state and conflict visibility; a CRM meeting is not a Service booking. | P3 |
| EC-04 · N | **Communication draft, approval and delivery review** — Page or record tabs | Reusable approved content, proposed audience, attachment revisions, explicit send review, failed/unknown delivery and communication history; live sending remains separately authorised. | P3 |


### CP — Customer portal and external collaboration (6 briefs)

**Retained source baseline:** customer-portal-mockup.html already shows Overview, Support, Projects, Equipment/reports and Knowledge. The written specification also covers Documents and exact responses. Treat CP1–CP5 as completion/expansion, not a wholly missing design.

**Family-level parent mapping:** CRM-06, CRM-07, SVC-01, SVC-11, DOC-06, NFR-01.

**Pinned sources:** [customer-portal-mockup.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/customer-portal-mockup.html); [customer-portal-design.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/customer-portal-design.md); [customer-portal-implementation-plan.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/delivery/customer-portal-implementation-plan.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| CP-01 · E | **Portal home, organisation/site selection and access** — Pages | Complete the existing overview with explicit external identity, permitted organisation/site choices, customer tasks, partial data and safe inaccessible-link recovery. | P3 |
| CP-02 · E | **Customer support request and conversation** — Pages | Complete list/new/detail/reply flows, safe attachments, uncertain-submit recovery and clear customer-visible status; internal notes stay separate. | P3 |
| CP-03 · E | **Published project updates and customer actions** — Pages | Review current/exact historical publications, milestones, customer prerequisites, response requests and missing/withdrawn content; expose only approved facts. | P3 |
| CP-04 · E | **Customer equipment, documents and service reports** — Pages + tabs | Permitted installed assets, manuals, exact published reports and revision-bound remarks/acknowledgement; keep attendance and report acceptance distinct. Use permitted organisation → site → facility/growing-area navigation for equipment, documents and reports, showing only published information within the customer’s granted scope. | P3 |
| CP-05 · E | **Customer knowledge and guided support** — Pages | Search reviewed applicable articles, version/model filters, no-result recovery and support requests carrying the article/equipment context. | P3 |
| CP-06 · E | **Customer quotation, variation and account views** — Pages | Complete later CP5 commercial designs with separately granted quote/variation responses and verified account reads; reuse quotation r03 and Finance projections rather than duplicating them. | P3 |


### AI — PPO Assistant and AI workflows (7 briefs)

**Retained source baseline:** The assistant specification exists. The older feature/assistant-ai1-simulated branch has an assistant route/screen and simulated commands; current main has no assistant page and #66 remains open. Reconcile that branch before implementation. Theme-board examples are shared patterns, not proof of a shipped assistant. Equipment r01 and Finance r02 additionally contain scripted contextual assistants with source inspection and ordinary-form draft review. These are design foundations, not a live shared assistant or completed AI1 runtime.

**Family-level parent mapping:** CRM-01, CRM-02, CRM-03, DOC-04, DOC-06, NFR-01, NFR-02.

**Pinned sources:** [ppo-assistant-specification.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/ppo-assistant-specification.md); [ppo-assistant-handover.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/delivery/ppo-assistant-handover.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| AI-01 · D | **Assistant workspace and docked/mobile conversation** — Page + panel | Consistent Ask AI entry, explicit record scope, conversation, accessible composer, source cards, generation/cancel/error states and context-preserving return; reconcile the existing branch UI. | P2 |
| AI-02 · E | **AI proposal review and saved outcomes** — Page or panel | Editable proposed fields, provenance, changed-source comparison, exact actions requiring confirmation, saved record links and original-command recovery; extend the AI1 specification/branch. | P2 |
| AI-03 · E | **Source and answer evidence inspection** — Panel | Generalise the source inspectors already demonstrated in Equipment r01 and Finance r02: exact snippets/revisions/dates, captured answer context, missing or inaccessible evidence, conflicting findings and unsupported statements. Ordinary source content cannot grant action authority. | P1 |
| AI-04 · E · Refined r04 | **Domain assistance and drafting flows** — Contextual panels | Extend the existing scripted equipment summary/follow-up and Finance explanation/draft flows to customer summaries, estimate/scope explanation, technical history, project updates and report drafts. Use implemented records and ordinary domain review; real model integration is separate. Make assistance useful for site-survey summaries, missing-information questions, sourced equipment history and draft handovers. Require review of names, measurements, scope and proposed actions; never invent horticultural operating limits. | P2 |
| AI-05 · N | **Voice capture and transcript review** — Mobile panel | Explicit start/stop/cancel, editable transcript, names/numbers/units readback, job/equipment confirmation and failure recovery; real audio/provider handling remains a staged decision. | P2 |
| AI-06 · N · Refined r04 | **AI assistance settings and quality review** — Admin page | Enabled capabilities, permitted sources/actions, provider state, usage/cost limits where approved, feedback and source-grounding evaluation; simulation and live-provider status remain visible. Include evaluations for wrong-site context, stale configuration, unsupported units/limits, confidential sources and misleading confidence; user feedback is not automatic technical approval. | P2 |
| AI-07 · N | **Recurring checks and automation review** — Page + proposal panel | Owned monitoring schedules, declared scope, previewed effects, run history, partial/failed outcomes and controlled follow-up; each material effect uses an existing reviewed domain command. | P2 |


### RP — Reporting and management review (6 briefs)

**Retained source baseline:** BP-01 defines REP-01–REP-12 and KPI-01–KPI-15. Current worklists and preview insights are not a complete reporting workspace. These views should reuse their source registers and definitions.

**Family-level parent mapping:** CRM-02, CRM-04, EST-07, ENG-01, PRJ-02, PRJ-05, SVC-12, SCM-08, FIN-06, FIN-07, FIN-08.

**Pinned sources:** [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| RP-01 · N | **Management overview and report catalogue** — Pages | Role-scoped business questions, owned definitions and linked reports; show time window, grain, source-as-at and completeness rather than unexplained KPI tiles. | P3 |
| RP-02 · N | **Sales and quotation performance** — Report pages | Opportunity ageing/conversion, account development, quote response/cycle/revision performance and commercial exception queues; REP-01–REP-05 with explicit cohort denominators. | P3 |
| RP-03 · N | **Engineering and project delivery performance** — Report pages | Due deliverables/reviews, baseline versus forecast, dependency impacts, changes, defects and outstanding closeout; REP-06–REP-08. | P3 |
| RP-04 · N · Refined r04 | **Service, maintenance and resource performance** — Report pages | Pack readiness, report turnaround, recurring work, agreement expiry, unresolved follow-up, workload and captured/reviewed time; REP-12 and relevant KPIs. Separate site/asset criticality, repeat-callouts, unresolved findings and planned maintenance from customer impact claims; define denominators and reporting cutoffs. | P3 |
| RP-05 · N | **Supply and Finance trust/exceptions** — Report pages | Late promises, shortages, inspection holds, return/claim/credit age and financial freshness/reconciliation; REP-09–REP-11, linking to source operations. | P3 |
| RP-06 · N | **Report definition, saved views and scheduled review** — Page + panels | Controlled metric definitions, filters, permitted exports, saved review packs and accountable follow-up; reuse shared saved-view and publication controls. Support permitted site and facility/growing-area/block filters; prevent double-counting nested area measurements or shared equipment serving several blocks. | P3 |


### AD — Administration, data quality and operational support (10 briefs)

**Retained source baseline:** /admin and /admin/recovery/:id provide bounded owned exception recovery. They are not a full access/configuration/integration console. F07 and Q01–Q05 extend this foundation.

**Family-level parent mapping:** CRM-08, FIN-06, NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11, NFR-12.

**Pinned sources:** [page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/admin/page.tsx); [exception-screens.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/components/exception-screens.tsx); [BP-02-platform-architecture.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/architecture/BP-02-platform-architecture.md); [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| AD-01 · N | **Users, roles, teams and access review** — Pages | Identity status, role/capability and company/site scopes, reviewable grant changes and access history; authorisation must remain server-enforced. | P1 |
| AD-02 · N · Refined r04 | **Business configuration and policy publication** — Pages | Versioned statuses, classifications, units, calendars, numbering, approved pricing/routing/approval policies and effective dates; show Not configured where a rule is undecided. Govern vocabulary and units for sites, structures, growing uses, area/block identities, irrigation/control groups and technical attributes; labels may change while stable identities remain. | P2 |
| AD-03 · N | **Data-quality workbench** — Page | Duplicate candidates, missing identity/serial/site data, external-key/unit mismatches, source evidence and reviewed corrections with retained relationships. Check duplicate local names against stable identities, missing site/address/location links, invalid parents and equipment location/served-area mismatches; same names on different sites are not automatically duplicates. | P1 |
| AD-04 · E | **Integration health and exception recovery** — Pages | Expand current recovery with connector/source status, failed/partial runs, last success, owner, safe retry/reconcile and original-result lookup; never blindly repeat unknown external actions. | P2 |
| AD-05 · N | **External mapping and reconciliation detail** — Page | Company/provider/entity keys, intended direction/authority, mapping decisions, mismatches and comparison evidence for MYOB and future adapters. | P1 |
| AD-06 · N | **Migration, coexistence and cutover workbench** — Pages | Source inventory, dry-run/import batches, validation, duplicate/mapping review, counts, reconciliation and explicit cutover/rollback evidence; no live migration implied. | P2 |
| AD-07 · N | **Audit history and controlled export** — Page | Permission-filtered changes, actors, reasons, before/after revisions, command/approval links and reviewed export; suppress sensitive diagnostic payloads. | P2 |
| AD-08 · N | **Retention and information lifecycle** — Page | Applicable policies, review/hold status, permitted export/deletion requests, impacted records and outcomes; policies are supplied and approved, not invented. | P2 |
| AD-09 · N | **Operational health, recovery and release readiness** — Pages | Business-operation failures, backup/restore evidence, incident ownership, recovery procedures, release verification and known limitations; reuse P12 evidence rather than equating it with operating acceptance. | P2 |
| AD-10 · N | **User onboarding, learning and support** — Pages | Role-specific setup, page guides, training tasks, support requests, feedback and release notes; connect to maintained help and an accountable support owner. | P2 |


### CX — Conditional extensions to retain visibly (6 briefs)

**Retained source baseline:** These are conditional supporting scope or optional page decompositions. Keep them in the long-range backlog; they are not mandatory missing first-release modules.

**Family-level parent mapping:** SVC-12, SCM-03, SCM-07, ENG-07, DOC-04, NFR-03.

**Pinned sources:** [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md).

| ID / coverage | Page / surface | Full scope | Recommended order |
|---|---|---|---|
| CX-01 · C · Refined r04 | **Company tools, loan units and calibration** — Pages | Custody, reservations, loan return, maintenance and calibration for company equipment; distinguish this from customer-installed assets and stock for sale. Use EQ-09 for instrument evidence required by inspections; this conditional page adds custody, reservation and broader company-tool/loan/fleet administration only if justified. | Conditional |
| CX-02 · C | **Workshop assembly, testing and rework** — Pages | Only if in-house assembly is confirmed: released BOM, instructions, material consumption, serialisation, tests and rework, assessed against MYOB manufacturing capability. | Conditional |
| CX-03 · C | **Remote monitoring and alarm review** — Pages | Only after consent/OEM/security/response ownership is established: equipment observations, alarm context, source quality and owned review; no unrestricted control-system connection. | Conditional |
| CX-04 · C | **Advanced customer training and subscription coordination** — Pages | If justified: training sessions, attendance/follow-up and licence/subscription renewal references; supplier-billed subscriptions must not become assumed PPO revenue. | Conditional |
| CX-05 · C · Added r04 | **Grower production and traceability integration** — Conditional integration view | If PPO is later extended for growers’ production operations, link crop batches, planting/harvest windows and existing traceability records to exact growing areas. Establish the source system, users, data rights and purpose first. Crop inventory, crop protection applications, harvest and food-safety certification remain a separate business-scope decision. | Conditional |
| CX-06 · C · Added r04 | **Water and energy improvement review** — Conditional report + proposal | Where agreed metered data exists, compare water/energy observations over an explicit site/area/time basis and prepare reviewed improvement proposals. Retain units, meter coverage, missing readings, operating/crop context and baseline limitations. Estimated savings and measured outcomes stay distinct; no automatic irrigation or climate-control action follows. | Conditional |


## Shared components and states: required across the pages

These are cross-cutting requirements, not additional modules to inflate the count:

- Register/detail/create/edit patterns; filters, sorting, saved views, pagination, no-results recovery and preserved Back navigation. The same permission-filtered records must appear in alternative views.
- Loading, empty, partially loaded, unavailable, no access, stale, not configured and identity-changed states. An unavailable count or amount must not become a plausible zero.
- Saved, saving, unsaved, save failed, result unknown and concurrent-change comparison. Original-command recovery, recoverable input and repeat-action deduplication belong in each material workflow.
- Controlled attachments: intake, validation, upload progress, failed uploads, document revision, confidentiality, current/historical source and exact output preview.
- Approval/return/reject/withdraw, changed-source review, issued/sent/delivered/acknowledged and correction by successor. Use the appropriate domain's authority; an AI answer or generic approval inbox cannot approve technical or financial work by itself.
- Accessibility and responsive layouts: labelled controls, keyboard alternatives, focus return, readable errors, long-content handling, meaningful phone priority and reachable primary actions. Offline capability must be explicitly implemented and verified; responsive HTML does not provide it.
- Financial values: company, currency, tax basis, source-as-at, completeness and definition version. Keep captured, reviewed, billable and ERP-processed quantities separate.
- Theme: use PPO navy/green, Roboto/Verdana, supplied logo, restrained borders/shadows, established shell geometry and contextual panels. Preserve the recent user decision for docked Create/Filter windows to use bottom-corner radius only. The supplied attachment bytes are r16. Finance r02 records a separately verified r18 source; reconcile that exact source before claiming new designs conform to r18.
- AI: explicit context, source inspection, uncertainty, editable drafts, review before material effects, cancelled/failed generation, prompt-injection-resistant source handling and real saved-result evidence. Reuse the shared assistant and proposal-review components across modules.

## Utility screens to include in workspace completion

These are shared page states or reusable flows, already included in the relevant family scope. They do not add another set of independent modules to the 149-entry count.

| Utility surface | What to include | Related coverage |
|---|---|---|
| Sign-in, session expiry and return to work | Preserve the existing login design; clear identity changes, failed/expired sign-in, accessible error text and return to a still-permitted requested record. Account/workspace choice follows the actual identity contract. | Existing login; AD-01; shared state requirements |
| Missing, withdrawn and inaccessible links | Helpful not-found, no-access and retired/withdrawn-document states; safe navigation without revealing hidden record details. | SH-04; DK-02; CP-01–CP-06; every detail view |
| Offline start and reconnect | Existing offline page, downloaded-work scope, last sync, queued/failed evidence and reconnect; no claim that all desktop pages work offline. | FI-02; AD-04 |
| Attachments and file review | File selection/drop, progress, cancellation, unsupported/oversized or failed uploads, safe preview and source metadata; reuse across work records. | DK-01/DK-02; shared attachment control |
| Generated output and print preview | Exact revision, audience, output status, failed-generation recovery and accessible download/print presentation. | ES-05; SV-05/SV-06; DK-03/DK-06; CP-04 |
| Create/edit, discard and comparison | Validation, unsaved input, explicit discard, stale-version comparison and recoverable unknown saves; consistent dialog/page treatment on narrow screens. | All create/edit and controlled review flows |

## End-to-end omission check

| Business journey | Page chains that must connect | Important exception/closure checks |
|---|---|---|
| Product/parts sale | Customer → Deal/estimate → Quote/response → Item/order conversion → Picking/dispatch → Delivery → Finance | Partial stock, one-off items, unknown order outcome, delivery exception and returns; do not force every parts sale into a Project. |
| Planned/reactive service | Request → Work order/coverage → Readiness → Planner → Job pack → Field evidence → Review/report → Customer response → Finance/follow-up | Multiple visits, unavailable customer, unsuccessful fix, offline conflicts, non-billable outcome and separately owned remaining work. |
| Equipment upgrade | Installed asset → Discovery/configuration → Estimate/quote → Engineering release → Supply → Installation/commissioning → As-built/service handover | Original versus installed configuration, substitution approval, failed tests, warranty dates and retired/replacement assets. |
| Major greenhouse project | Sales receiving → Contract/WBS → Engineering/interfaces → Procurement/logistics → Readiness/install → Tests/staged acceptance → Claims/closeout | Baseline changes, real dependencies, subcontractors, variations/notices, disputed values, partial handover and separate Service bookings. |
| Warranty/return/supplier recovery | Asset/failure → Coverage assessment → Work/return → Supplier claim → Repair/replacement → Credit/customer outcome → Closure | Installation/commissioning/warranty dates, disputed responsibility, customer outcome versus supplier credit, remaining maintenance and original financial evidence. |

## Current source checkpoint and scope of this review

The r04 live check confirms main still at `42383fc2e3a85f6cf9c38c829683b14787578579`, tree `3cbafa352ad3399cf15ac54a0ea025f53f2c6842`. Consequently, the earlier inventory remains applicable: **1,243 tracked files, 23 HTML files and 58 application page routes**, with **78 original parent requirements**. This turn refreshed main and six open PR heads, inspected the changed-file inventories for Equipment #183 and quality #182, and rechecked the current Facility-decision lineage.

Equipment #183 has a newer head, but the inspected HTML blob remains `fd60d1efd3b3e78d27d957f4d2bb01d2ea513319`; inspected HTML SHA-256 is `24c8196564e1636c9ab846d5adf34dd462f66c9017ce8c28a83e7ea01e34d310`. The quality-register blob on #182 remains `c8e939de6559f5f5b49d1cb9015fff733f29da4e`. Advancing PR heads alone does not imply new page delivery.

| PR | Current checkpoint state | Head | Source |
|---|---|---|---|
| #183 — design: Equipment and Installed Base workspace r01 | Draft | `928c3fec7f64a5433b1f48139435df1205562226` | [PR #183](https://github.com/deanrfiedler-gif/powerplants-one/pull/183) |
| #182 — docs: adopt product-quality features and measurable release standards | Open | `0d33a2b8f2d9e26e9d571cc6c2a2c2b4dfce28d4` | [PR #182](https://github.com/deanrfiedler-gif/powerplants-one/pull/182) |
| #180 — fix: enforce retained contact visibility for estimating history and recovery | Open | `108590fcf3e2bb6252ffb620be9e3a88c0565b78` | [PR #180](https://github.com/deanrfiedler-gif/powerplants-one/pull/180) |
| #179 — Restore CRM worklist URLs and reconcile delivered issues | Open | `10b65ac6d54aaad69ea886d1a400c4a80a50a810` | [PR #179](https://github.com/deanrfiedler-gif/powerplants-one/pull/179) |
| #175 — Measure development and compiled performance on one retained load fixture | Open | `b8a2caae0ba3ff08b30628be2bcf8384c2fad162` | [PR #175](https://github.com/deanrfiedler-gif/powerplants-one/pull/175) |
| #172 — Reconcile delivered work and record the next audit continuation | Open | `a0b727fdf3076953d06888b5394659c21abd56ad` | [PR #172](https://github.com/deanrfiedler-gif/powerplants-one/pull/172) |

Finance r02 is already merged in [PR #184](https://github.com/deanrfiedler-gif/powerplants-one/pull/184). Equipment r01 is an authored draft design awaiting its own review/integration. No repository code, data, PR, deployment or business record was changed for this audit.

The original broad audit inspected the main HTML/route inventory, blueprint, specifications, contracts, delivery plans and requirements; it enumerated 100 branches and inspected selected additional branches and recent off-repository designs. R04 does not claim to have re-audited every historical branch or to have rerun application tests. The following inventories are retained source evidence, clearly distinguished from the current r04 findings and planning proposals.

## Existing designs to preserve

| Family | Verified starting point | Remaining direction |
|---|---|---|
| Shared customer context | Existing runtime; Mobile CRM r07; approved Facility field specification | Coordinate desktop/mobile customer, contact, site and facility journeys; add readiness and relationship planning. |
| Equipment / inspections | Equipment r01 in draft #183; existing shared runtime | Visual review, integration and wider movement/bulletin/support lifecycle. |
| CRM | Board/Grid, Leads, wireframes/states; recent Deals r35 | Complete downstream handovers, detail consistency, forecast and aftercare. |
| Estimating | Workspace, wizard, E2 walkthrough, quotation builder; quotation module r03 | E3–E6, reviewed pricing/conversion and estimate-to-actual feedback. |
| Engineering | Container r02 | Technical basis, controlled release, changes and commissioning/as-built handover. |
| Projects | Interactive review r02; Gantt runtime/design lineage | Baselines, dependencies, commercial controls, readiness and staged closeout. |
| Service / field | Job Pack r03, Field Technicians r05 and operational routes | Service desk breadth, review/follow-up, agreements and reusable inspection integration. |
| Supply Chain | Material Readiness r03 inspected outside GitHub | Governed runtime, logistics, stock/reservations, dispatch and returns. |
| Products | Products Preview r04 inspected outside GitHub | Catalogue/source governance, compatibility and import review. |
| Finance | Finance r02 on main, r01 preserved | Integrate/validate the four views; add wider project/commercial Finance. |
| Email & Calendar | Repository prototype and synthetic runtime | Provider connection, privacy, synchronisation and sending/filing recovery. |
| Customer Portal | Repository mockup and CP1–CP5 specification | Staged publication, access and customer response workflows. |
| Shell / help | Runtime shell/login/search/quick add; Shell r14; help preview | Home/My Work, notifications, saved views and full page-guide coverage. |
| Assistant | Older AI1 implementation branch; Equipment/Finance scripted assistants | Reconcile current source, verify bounded AI1, then extend against implemented domains. |

Evidence for individual families is supplied beside their page register. The primary main sources include [STATUS](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/STATUS.md), [master blueprint](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/BP-01-master-blueprint.md) and [78-parent register](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/requirements/requirements.csv). STATUS still carries historical snapshot/disposition wording; the actual pinned tree and PR state take precedence for delivery claims.

## Repository HTML inventory

All 23 main files below were inspected as source across the original audit and this reconciliation. Historical revisions count separately; this is not a completed-module count.

| File | Git blob | Treatment |
|---|---|---|
| [docs/blueprints/contextual-help-preview.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/contextual-help-preview.html) | `2f5fc26a87dc` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/crm-board-grid-mockup.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/crm-board-grid-mockup.html) | `05ac873254bb` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/crm-leads-desktop-preview.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/crm-leads-desktop-preview.html) | `3ff05ca19993` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/crm-leads-preview.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/crm-leads-preview.html) | `e8b98a0d11f4` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/crm-ui-mockups/states.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/crm-ui-mockups/states.html) | `157c2bc8fe62` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/crm-wireframes.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/crm-wireframes.html) | `e26d6d73029f` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/customer-portal-mockup.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/customer-portal-mockup.html) | `540723d92664` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/email-calendar-prototype/index.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/email-calendar-prototype/index.html) | `f316a0f97e02` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/estimating-e2-walkthrough.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/estimating-e2-walkthrough.html) | `c6160017d9a8` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/estimating-wizard-container.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/estimating-wizard-container.html) | `230263d992c3` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/estimating-wizard-mockup.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/estimating-wizard-mockup.html) | `458eada37695` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/estimating-workspace-mockup.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/estimating-workspace-mockup.html) | `d5c4f0373b68` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/projects-starter-visuals/r02/projects-design-review-r02.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/projects-starter-visuals/r02/projects-design-review-r02.html) | `8d5ee96862a0` | Design/reference HTML; acceptance and integration separate |
| [docs/blueprints/quotation-builder.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/blueprints/quotation-builder.html) | `a247d900f83e` | Design/reference HTML; acceptance and integration separate |
| [docs/reference/engineering-r02/PPO-Engineering-Container-r02.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/engineering-r02/PPO-Engineering-Container-r02.html) | `37b88b2ad2a9` | Design/reference HTML; acceptance and integration separate |
| [docs/reference/powerplants-one-field-technicians-r04.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/powerplants-one-field-technicians-r04.html) | `7f3a27444042` | Design/reference HTML; acceptance and integration separate |
| [docs/reference/ui/field-technicians/powerplants-one-field-technicians-r05.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/ui/field-technicians/powerplants-one-field-technicians-r05.html) | `f125b9b6052d` | Design/reference HTML; acceptance and integration separate |
| [docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r01.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r01.html) | `b95791b127ba` | Design/reference HTML; acceptance and integration separate |
| [docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r02.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r02.html) | `5e63955c72cb` | Design/reference HTML; acceptance and integration separate |
| [docs/reference/ui/job-pack/powerplants-one-job-pack-r02.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/ui/job-pack/powerplants-one-job-pack-r02.html) | `c6ca0d47a0dd` | Design/reference HTML; acceptance and integration separate |
| [docs/reference/ui/job-pack/powerplants-one-job-pack-r03.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/docs/reference/ui/job-pack/powerplants-one-job-pack-r03.html) | `c999da99766c` | Design/reference HTML; acceptance and integration separate |
| [public/offline/index.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/public/offline/index.html) | `61f287d22c28` | Runtime HTML asset |
| [src/login/login.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/login/login.html) | `fc03e1e23178` | Runtime HTML asset |

## Additional open-branch HTML inspected

| Design | Exact source | Status |
|---|---|---|
| Equipment and Installed Base r01 | [Equipment r01 HTML](https://github.com/deanrfiedler-gif/powerplants-one/blob/928c3fec7f64a5433b1f48139435df1205562226/docs/reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r01.html); blob `fd60d1efd3b3e78d27d957f4d2bb01d2ea513319`; SHA-256 `24c8196564e1636c9ab846d5adf34dd462f66c9017ce8c28a83e7ea01e34d310` | Draft #183, visual review and application integration pending |

## Application route inventory

All 58 page entry points were source-inspected in the original audit and are unchanged by the main delta. Shared wrapper routes do not prove full workflow behaviour.

| Route | Source |
|---|---|
| `/admin` | [src/app/(business)/admin/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/admin/page.tsx) |
| `/admin/recovery/[id]` | [src/app/(business)/admin/recovery/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/admin/recovery/[id]/page.tsx) |
| `/calendar` | [src/app/(business)/calendar/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/calendar/page.tsx) |
| `/crm/leads/[id]` | [src/app/(business)/crm/leads/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/crm/leads/[id]/page.tsx) |
| `/crm/leads` | [src/app/(business)/crm/leads/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/crm/leads/page.tsx) |
| `/crm/opportunities/[id]` | [src/app/(business)/crm/opportunities/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/crm/opportunities/[id]/page.tsx) |
| `/crm/opportunities/new` | [src/app/(business)/crm/opportunities/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/crm/opportunities/new/page.tsx) |
| `/crm/opportunities` | [src/app/(business)/crm/opportunities/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/crm/opportunities/page.tsx) |
| `/customers/[id]/account` | [src/app/(business)/customers/[id]/account/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/customers/[id]/account/page.tsx) |
| `/customers/[id]` | [src/app/(business)/customers/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/customers/[id]/page.tsx) |
| `/customers/new` | [src/app/(business)/customers/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/customers/new/page.tsx) |
| `/customers` | [src/app/(business)/customers/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/customers/page.tsx) |
| `/documents/[id]` | [src/app/(business)/documents/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/documents/[id]/page.tsx) |
| `/email/[id]` | [src/app/(business)/email/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/email/[id]/page.tsx) |
| `/email` | [src/app/(business)/email/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/email/page.tsx) |
| `/engineering/[id]` | [src/app/(business)/engineering/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/engineering/[id]/page.tsx) |
| `/engineering` | [src/app/(business)/engineering/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/engineering/page.tsx) |
| `/equipment/[id]` | [src/app/(business)/equipment/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/equipment/[id]/page.tsx) |
| `/equipment` | [src/app/(business)/equipment/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/equipment/page.tsx) |
| `/estimating/discovery/[id]/costing` | [src/app/(business)/estimating/discovery/[id]/costing/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/estimating/discovery/[id]/costing/page.tsx) |
| `/estimating/discovery/[id]` | [src/app/(business)/estimating/discovery/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/estimating/discovery/[id]/page.tsx) |
| `/estimating/discovery/new` | [src/app/(business)/estimating/discovery/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/estimating/discovery/new/page.tsx) |
| `/estimating/discovery` | [src/app/(business)/estimating/discovery/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/estimating/discovery/page.tsx) |
| `/estimating/estimates/[id]` | [src/app/(business)/estimating/estimates/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/estimating/estimates/[id]/page.tsx) |
| `/estimating/new` | [src/app/(business)/estimating/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/estimating/new/page.tsx) |
| `/estimating` | [src/app/(business)/estimating/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/estimating/page.tsx) |
| `/estimating/quotes/[id]` | [src/app/(business)/estimating/quotes/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/estimating/quotes/[id]/page.tsx) |
| `/finance/handoffs/[id]` | [src/app/(business)/finance/handoffs/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/finance/handoffs/[id]/page.tsx) |
| `/finance/handoffs/new` | [src/app/(business)/finance/handoffs/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/finance/handoffs/new/page.tsx) |
| `/finance/handoffs` | [src/app/(business)/finance/handoffs/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/finance/handoffs/page.tsx) |
| `/my-jobs/[id]` | [src/app/(business)/my-jobs/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/my-jobs/[id]/page.tsx) |
| `/my-jobs` | [src/app/(business)/my-jobs/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/my-jobs/page.tsx) |
| `/people/[id]` | [src/app/(business)/people/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/people/[id]/page.tsx) |
| `/people` | [src/app/(business)/people/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/people/page.tsx) |
| `/projects/[id]` | [src/app/(business)/projects/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/projects/[id]/page.tsx) |
| `/projects/new` | [src/app/(business)/projects/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/projects/new/page.tsx) |
| `/projects` | [src/app/(business)/projects/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/projects/page.tsx) |
| `/schedule` | [src/app/(business)/schedule/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/schedule/page.tsx) |
| `/service/appointments/[id]` | [src/app/(business)/service/appointments/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/appointments/[id]/page.tsx) |
| `/service/packs/[id]` | [src/app/(business)/service/packs/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/packs/[id]/page.tsx) |
| `/service/packs/new` | [src/app/(business)/service/packs/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/packs/new/page.tsx) |
| `/service/packs` | [src/app/(business)/service/packs/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/packs/page.tsx) |
| `/service/reports/[id]` | [src/app/(business)/service/reports/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/reports/[id]/page.tsx) |
| `/service/reports` | [src/app/(business)/service/reports/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/reports/page.tsx) |
| `/service/technicians` | [src/app/(business)/service/technicians/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/technicians/page.tsx) |
| `/service/tickets/[id]` | [src/app/(business)/service/tickets/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/tickets/[id]/page.tsx) |
| `/service/tickets/new` | [src/app/(business)/service/tickets/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/tickets/new/page.tsx) |
| `/service/tickets` | [src/app/(business)/service/tickets/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/tickets/page.tsx) |
| `/service/work-orders/[id]` | [src/app/(business)/service/work-orders/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/work-orders/[id]/page.tsx) |
| `/service/work-orders/new` | [src/app/(business)/service/work-orders/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/work-orders/new/page.tsx) |
| `/service/work-orders` | [src/app/(business)/service/work-orders/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/service/work-orders/page.tsx) |
| `/sites/[id]` | [src/app/(business)/sites/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/sites/[id]/page.tsx) |
| `/sites` | [src/app/(business)/sites/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/sites/page.tsx) |
| `/work/[id]` | [src/app/(business)/work/[id]/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/work/[id]/page.tsx) |
| `/work/new` | [src/app/(business)/work/new/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/work/new/page.tsx) |
| `/work` | [src/app/(business)/work/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/(business)/work/page.tsx) |
| `/foundation` | [src/app/foundation/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/foundation/page.tsx) |
| `/` | [src/app/page.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/42383fc2e3a85f6cf9c38c829683b14787578579/src/app/page.tsx) |

## Retained issue inventory from the r03 source baseline

This 15-issue inventory is retained for scope traceability; issue dispositions were not freshly re-audited in r04.

These are the 15 open issues, excluding pull requests. A stale open/closed issue label is not substituted for current source evidence.

| Issue | Title |
|---|---|
| [#181](https://github.com/deanrfiedler-gif/powerplants-one/issues/181) | Deliver adopted product-quality features and measurable release standards |
| [#167](https://github.com/deanrfiedler-gif/powerplants-one/issues/167) | E2: persist adopted options and scoped discovery without inventing routing policy |
| [#160](https://github.com/deanrfiedler-gif/powerplants-one/issues/160) | Maintain Azure login, Node and browser rendering runtime |
| [#145](https://github.com/deanrfiedler-gif/powerplants-one/issues/145) | CRM increment C — controlled opportunity owner transfer implementation |
| [#121](https://github.com/deanrfiedler-gif/powerplants-one/issues/121) | Shared UI specification — record bounded-scroll mechanics and a layering scale |
| [#120](https://github.com/deanrfiedler-gif/powerplants-one/issues/120) | CRM worklist — carry Board/Grid view, filters and sort in the URL |
| [#76](https://github.com/deanrfiedler-gif/powerplants-one/issues/76) | BP-04 E2 design: routing, alternatives and scoped questions |
| [#66](https://github.com/deanrfiedler-gif/powerplants-one/issues/66) | AI1: implement simulated customer CRM assistant and reviewed creation |
| [#16](https://github.com/deanrfiedler-gif/powerplants-one/issues/16) | [PPO-016] Define prototype delivery, recovery and future operating handover |
| [#15](https://github.com/deanrfiedler-gif/powerplants-one/issues/15) | [PPO-015] Specify service agreements, recurrence and asset lifecycle |
| [#13](https://github.com/deanrfiedler-gif/powerplants-one/issues/13) | [PPO-013] Define BP-08 material readiness and supply-chain interfaces |
| [#12](https://github.com/deanrfiedler-gif/powerplants-one/issues/12) | [PPO-012] Define BP-06 project controls and Smartsheet transition |
| [#11](https://github.com/deanrfiedler-gif/powerplants-one/issues/11) | [PPO-011] Define BP-05 engineering and technical-release scope |
| [#10](https://github.com/deanrfiedler-gif/powerplants-one/issues/10) | [PPO-010] Prepare CREMS rule evidence and BP-04 reconstruction scope |
| [#2](https://github.com/deanrfiedler-gif/powerplants-one/issues/2) | [PPO-002] Establish MYOB and service ownership evidence |

## Inspected recent design files outside the repository

These files were inspected locally to avoid listing their existing views as missing. Publication, business approval and runtime integration remain separate.

| File | Internal title | SHA-256 of inspected bytes |
|---|---|---|
| ppo-deal-pipeline_r35.html | Powerplants One — Deal Pipeline r35 | `9d7c0fc858a7a6114200fcc17f6c2ba09e0b2da8eaffad4e480e61ea8d696431` |
| PPO-Supply-Chain-Material-Readiness-r03.html | Supply Chain · Material Readiness & Inbound Logistics · r03 | `5157bf3bc3cc29a8aecc13574169e0124d3b68d5fb57e3b19fc6f664aabc03bb` |
| ppo-quotation-module-r03.html | Powerplants One · Customer quotation · Design r03 | `7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a` |
| PPO-Application-Shell-r14.html | Powerplants One — Application Shell · r14 | `9f4ab001225f7e538277870b9dcce4f467b158415c05a759af0870e45e8441d3` |
| PPO-Products-Preview-r04.html | Powerplants One · Products design r04 | `bd2d8074d824932fc259406994d5fd5f359058949ddede9bda652d50ff69fdbd` |
| Supplied theme-board copy | Powerplants One — Theme & Style Board · r16 | `19d96d383fadfda3bb03b5939cb933a64e4b220e69b8cb9a21df3f48d90b794f` |
| ppo-mobile-ui-design-review.html | Powerplants One · Mobile CRM review r07 | `f7dd91154d8ad022432a30eee7827b6f34542d2e89608c2a176583c804e6f835` |

The Mobile CRM source contains customer/organisation and contact views, Sites hierarchy and Facility forms. This inspection establishes design lineage; it does not claim current application integration of every field. The main Facility decision provides the approved receiving scope.

## Parent coverage index

This is an audit-level navigation mapping to the unchanged parent register. Each parent appears at least once; acceptance remains at the original requirement and receiving-increment level.

| Parent | Requirement | Audit families |
|---|---|---|
| CRM-01 | Manage prospects, organisations, people, sites and stakeholder relationships | CS, AI |
| CRM-02 | Manage qualified leads, opportunities, stages, next actions and close outcomes | CR, AI, RP |
| CRM-03 | Link calls, meetings, emails, notes, documents and tasks to appropriate records | SH, CR, EC, AI |
| CRM-04 | Support account plans, territory/sector segmentation, customer visits and follow-up | CS, CR, RP |
| CRM-05 | Link alternatives, estimate revisions and orders to one commercial pursuit | CR |
| CRM-06 | Provide approved visibility of projects, service cases, assets and ERP account information | CS, EQ, CP |
| CRM-07 | Manage post-delivery reviews, training follow-up, renewals and relevant growth actions | CR, MA, CP |
| CRM-08 | Preserve required Pipedrive capabilities and migration evidence | CR, AD |
| EST-01 | Route work using approved scope, complexity and commercial rules | ES |
| EST-02 | Manage discovery, design basis, facilities, scope and versioned questionnaires | ES |
| EST-03 | Manage options, revisions, estimates and quote versions | ES |
| EST-04 | Cost products, labour, freight, subcontractors and other permitted categories | ES, PD |
| EST-05 | Apply approved pricing, discount, margin and rounding rules | ES, PD |
| EST-06 | Preserve validated specialist configuration, including Screen Systems | ES, PD |
| EST-07 | Route estimate and quote approvals separately where policy requires | ES, RP |
| EST-08 | Generate and issue controlled quotations, record customer response and prepare ERP conversion | ES |
| EST-09 | Resolve one-off items and track conversion/reconciliation | ES |
| ENG-01 | Manage engineering requests, briefs, work packages and capacity | EN, PL, RP |
| ENG-02 | Maintain requirements, design basis, assumptions and interface responsibilities | EN |
| ENG-03 | Maintain a drawing/document register linked to supported authoring systems | EN |
| ENG-04 | Manage reviews, comments, approvals, revisions and formal issues | EN |
| ENG-05 | Release design material requirements and approved substitutions | EN, PD |
| ENG-06 | Assess technical changes against scope, cost, delivery and installed configuration | EN |
| ENG-07 | Control commissioning criteria, as-built information and technical handover | EQ, EN, FI, CX |
| PRJ-01 | Initiate projects from authorised scope and apply a proportionate project class | PJ |
| PRJ-02 | Manage work packages, milestones, predecessors, baselines and forecasts | PJ, RP |
| PRJ-03 | Maintain RAID, decisions, actions and interface responsibilities | PJ |
| PRJ-04 | Coordinate engineering, procurement, site readiness and technician demand | PJ, PL |
| PRJ-05 | Control contract obligations, variations and customer commitments | PJ, RP |
| PRJ-06 | Manage inspection/test plans, defects, retests and staged acceptance | PJ, FI |
| PRJ-07 | Produce approved stakeholder updates and delivery forecasts | PJ |
| PRJ-08 | Complete technical, commercial and service handover | PJ |
| SVC-01 | Capture and triage tickets against customers, sites and assets | SV, CP |
| SVC-02 | Manage authorised work orders separately from tickets and appointments | SV |
| SVC-03 | Assemble, check, issue and acknowledge revision-controlled job packs | SV |
| SVC-04 | Provide a visual drag-and-drop dispatch planner | PL |
| SVC-05 | Control rescheduling and reassignment | SV, PL |
| SVC-06 | Present relevant site/asset history and technical context | CS, EQ, FI |
| SVC-07 | Support appropriate offline preparation and field capture | FI |
| SVC-08 | Capture time, travel, breaks, waiting and task labour | FI |
| SVC-09 | Record parts consumption, returns and further requirements | FI |
| SVC-10 | Capture inspections, photos, readings, findings and service reports | SV, FI |
| SVC-11 | Capture customer acknowledgement and exceptions | SV, FI, CP |
| SVC-12 | Manage recurring maintenance, warranty, renewals and follow-up | EQ, SV, MA, RP, CX |
| SCM-01 | Link forecast and approved demand to projects, orders and service work | SC |
| SCM-02 | Display ERP items, warehouses, availability and purchasing references | SC, PD |
| SCM-03 | Manage requisitions, approvals, supplier quotations and procurement exceptions | SC, CX |
| SCM-04 | Track supplier commitments, manufacturing milestones and technical deliverables | SC |
| SCM-05 | Track inbound shipments and their line-level allocations | SC |
| SCM-06 | Coordinate receipt, inspection, shortages, damage, quarantine and partial delivery | SC |
| SCM-07 | Coordinate picking, dispatch, delivery, returns and supplier claims | MA, SC, CX |
| SCM-08 | Report material readiness and change impacts to delivery/service | SC, RP |
| FIN-01 | Display authorised customer-account transactions and balances | FN |
| FIN-02 | Link invoices, payments, credits, deposits and applications | FN |
| FIN-03 | Support financial review of orders, work and commercial exceptions | MA, FN |
| FIN-04 | Display project budget, actuals, commitments and operational forecasts | FN |
| FIN-05 | Coordinate milestone claim evidence, approved variations and relevant contract obligations | FN |
| FIN-06 | Reconcile imports, updates and dashboard measures | FN, RP, AD |
| FIN-07 | Maintain financial measure definitions, currency and tax treatment | FN, RP |
| FIN-08 | Provide approved profitability, cash-timing and exception views | FN, RP |
| DOC-01 | Link controlled documents using stable repository identifiers | EQ, DK |
| DOC-02 | Separate working versions, approved revisions and issued records | DK |
| DOC-03 | Generate approved quotation, job-pack, service and handover outputs | DK |
| DOC-04 | Maintain approved knowledge and technical reference content | PD, DK, AI, CX |
| DOC-05 | Manage communication drafts, approval, distribution and delivery outcomes | DK, EC |
| DOC-06 | Apply access, retention and confidentiality to files and search results | SH, DK, EC, CP, AI |
| NFR-01 | Enforce identity and action/record-level authorisation on the server | SH, CP, AI, AD |
| NFR-02 | Preserve attributable audit for material changes and approvals | AI, AD |
| NFR-03 | Protect credentials and information in transit, storage and device caches | EC, AD, CX |
| NFR-04 | Meet agreed response times under representative load | AD |
| NFR-05 | Provide useful degraded operation and visible external outages | SH, EC, AD |
| NFR-06 | Meet agreed recovery and data-loss objectives | AD |
| NFR-07 | Preserve offline input and resolve synchronisation safely | FI, AD |
| NFR-08 | Support accessible complete workflows | SH, PL, AD |
| NFR-09 | Prevent duplicate or conflicting material commands | PL, AD |
| NFR-10 | Apply approved retention, export and deletion policies | AD |
| NFR-11 | Provide monitoring, operational alerts and support diagnostics | SH, AD |
| NFR-12 | Support maintainable releases and data portability | AD |

## Adopted quality additions and omission check

The current [product-quality register](https://github.com/deanrfiedler-gif/powerplants-one/blob/0d33a2b8f2d9e26e9d571cc6c2a2c2b4dfce28d4/docs/requirements/product-quality-register.md) is on open PR #182 at `0d33a2b8f2d9e26e9d571cc6c2a2c2b4dfce28d4`. Its 21 entries elaborate existing parent requirements and remain distinct from delivered features. This audit includes them as follows:

| Adopted item | Where covered |
|---|---|
| F01 — QR-linked equipment and precise location | CS-04/CS-05; EQ-01/EQ-02; existing r01 scope plus real scanning/location integration |
| F02 — Structured commissioning and inspections | FI-03/FI-04; EN-08; PJ-09; reusable templates in DK-06 |
| F03 — Service bulletins and support lifecycle | EQ-06/EQ-07; PD-04; owned follow-up in MA/SV |
| F04 — Persistent personal and team views | SH-05; RP-06; shared register controls |
| F05 — Readiness explanations and change-impact previews | PJ-07; SC-09; PL-04; source/owner/freshness states across all affected pages |
| F06 — My Work and notification preferences | SH-02/SH-03/SH-06; unresolved work in SV-07 |
| F07 — Data-quality and integration operations | AD-03/AD-04/AD-05/AD-06 |
| F08 — Horticulture-specific visit readiness | CS-06; FI-05; job-pack readiness SV-05; Equipment r01’s bounded preparation sample |
| C01 — Customer portal and aftercare | CP-01–CP-06; CR-05; controlled publication and exact report response |
| C02 — Recurring maintenance | MA-03/MA-04; occurrence identity, reviewed generation and no implied booking |
| C03 — Warranty and supplier recovery | MA-02/MA-06/MA-07; SC-08; separate customer outcome and ERP credit |
| C04 — Reviewed technical knowledge | DK-04/DK-05; applicability, revision, review and withdrawal |
| C05 — Estimate-to-actual learning | ES-09/ES-10; comparable basis, reviewed calibration and no automatic repricing |
| C06 — Contextual AI assistance | AI-01–AI-04; source-aware proposals and existing command/recovery paths |
| C07 — Voice capture | AI-05; transcript review, equipment/job confirmation and explicit provider boundary |
| C08 — Global search | SH-04; expand the implemented scoped foundation as new entities join |
| Q01 — Security evidence | AD-01/AD-07/AD-08 plus current-permission checks on every list, detail, source and action |
| Q02 — Business-operation monitoring | AD-04/AD-09 plus owned operational exceptions |
| Q03 — Shared executable components | Cross-page register/form/review/state components; not a separate end-user module |
| Q04 — Usability, accessibility and performance | Shared responsive/keyboard states and evidence-led verification across every package |
| Q05 — Recoverable releases | AD-09 and existing P12 release/recovery evidence; not proof of operating acceptance |

These additions do not change the 78 original parent IDs or justify opening a duplicate issue for every audit row. Use the existing delivery owners and domain increments when converting the page register into work.

### Additional parent traceability for the new briefs

These proposed links supplement the retained family index without modifying the 78 original requirements or asserting new requirement approval.

| Brief | Suggested receiving requirement context |
|---|---|
| CS-08 | EST-02 discovery/design basis; CRM-01 exact site/customer context |
| EQ-08 | ENG-07 technical/as-built handover; SVC-06 equipment context; DOC-01/DOC-02 exact controlled reference |
| EQ-09 | SVC-10 measurement/inspection evidence; ENG-07 commissioning criteria |
| SV-08 | SVC-01 triage; SVC-06 technical context; SVC-10 evidence and findings |
| SC-10 | SVC-09 parts consumption/returns; SCM-02 ERP stock; SCM-07 dispatch/returns |
| CX-05 | Conditional new integration business case; CRM-01 location and DOC-01 source linkage alone do not authorise crop-production scope |
| CX-06 | Conditional new analytical business case; ENG-07/SVC-06 evidence context alone does not authorise resource-analysis scope |

## Verification performed on r04

The final register's embedded data and scripts were checked after generation. All main-branch source paths referenced by the page briefs resolve in the pinned local repository. The source assets needed by the HTML are embedded; it has no external script, stylesheet or font dependency.

| Check | Result and meaning |
|---|---|
| Scope accounting | 149 unique page IDs; 142 original IDs retained; 7 additions; 27 refined descriptions; 84 N / 12 D / 47 E / 6 C. |
| Original content | Every original r03 scope description remains within its r04 description. |
| Planning dependencies | Every referenced page ID exists; suggested dependency graph is acyclic. |
| Horticultural examples | All six requested examples occur explicitly, with site address/local position and physical/service distinctions retained. |
| Evidence inventory | Main is unchanged; 23 HTML files, 58 routes and 78 parent requirements retained. Refreshed PR heads and unchanged relevant source blobs recorded above. |
| Standalone source | Three embedded Roboto font faces, no external scripts/styles/images, 149-entry readable fallback without JavaScript. |
| Interaction checks | 16 groups passed against the shipped HTML using jsdom non-rendered DOM emulation: initialisation/IDs, combined filters, priorities/sort/table parity, complete detail/source content, explicit save/escaping, unsaved cancel/discard, dependency/Escape handlers, shortlist, reload, scenarios, exports/print, import preview/apply, invalid imports, storage failures and malformed input recovery. |
| Rendered browser / device / accessibility | **Not verified.** Browser URL policy rejected local HTML. Native dialog methods were stubbed in DOM tests; actual browser focus trapping, layout, reflow, mobile/touch, assistive technology and print pagination remain untested. |
| Application runtime | No app tests, integration validation, operating acceptance or deployment were performed or implied. |

## Remaining decisions and practical next steps

1. Review the seven additions and the proposed P1/P2/P3 order with the receiving domain owners. Confirm whether each is a page, tab or reusable flow, then record that disposition against its stable ID.
2. Define the facility/area/service-group relationship contract, including same-site validation, history, visibility and reporting behaviour. Preserve the adopted Facility field decisions and exact site/address context.
3. Confirm technical units/tolerances, calibration validity, authorised recovery references, seasonal/site-entry rules and ERP/source ownership. The register intentionally contains no invented business thresholds or operating permissions.
4. Review the existing Equipment r01 and Finance r02 through their current paths, coordinate customer/site foundations, and use the register to select bounded missing design packages. Retain source-backed documents/knowledge, service lifecycle, engineering/project controls and data-quality work.
5. Perform rendered desktop and narrow/mobile review, keyboard and assistive-technology checks, native dialog focus checks and print inspection in an authorised browser environment before accepting the visual design.
6. Treat grower production/traceability and water/energy analytics as explicit conditional decisions. Keep optional corporate tools, workshop, telemetry and advanced customer training visible without silently expanding the core product.

The audit is thorough within the inspected scope. Open design contracts and the browser-validation limit are visible; neither is hidden behind a completion score. The updated HTML is the working review surface, and this report preserves the detailed scope and evidence for handover.
