# Nursery Automation Configurator workbench specification

<!-- versioning: git; committed history is authoritative -->

Document ID: PPO-NURSERY-AUTOMATION-SPEC. Owner: Dean Fiedler. Prepared: 22 October 2026.
Review: proposed detailed design; owner, engineering and commercial review pending. Delivery: specification and template only.

## 1. Purpose and authority

Turn a nursery production requirement into a reviewed equipment configuration, explicit delivery scope and a traceable contribution to CPQ. Start with Javo potting lines; keep the model supplier-neutral for later families.

The [scope decision](../decisions/nursery-automation-specification.md) records the request and subsequent instruction to follow the updated **Powerplants One estimating and quotation implementation plan**, with O1–O15 and DP1–DP8 adopted on 22 October 2026. The private plan link and source content are not published here. Its newer direction governs this specification where the repository's proposed [parts-proposal schema 1](../contracts/workbench-parts-proposal.md) still lists those decisions as open. This package consumes the planned shared contracts; it neither amends them nor claims they are implemented.

The workbench owns technical configuration and measurable facts. Products links reviewed delivery profiles and exact Variants. CPQ resolves one activity ledger per alternative and calculates person-hours, costs and selling prices. Quotation preparation assembles approved wording from resolved scope. A provisional labour preview may call the shared CPQ model; there is no copied labour engine.

Existing parents EST-01–EST-09 remain unchanged. Discovery is `scope:ES-02`, CPQ receiving/costing `scope:ES-03`, quotation `scope:ES-05`; ES-08 remains Screen Systems. Proposed workbench type `nursery-automation` is a registration candidate, not an allocated ES number. Existing category `automation-javo-potting-machines` can advise the route after the company-scoped registry supports it. Classification is not suitability.

## 2. First release

| Included | Treatment |
|---|---|
| Single replacement, new connected line and staged retrofit | Separate alternatives/phases and saved configurations; reuse customer/site/equipment context. |
| Javo potting machine selection | Small curated set of exact model/options variants; estimator selection with explicit checks. |
| Pot dispensing, media supply, conveying and take-off | Include necessary ancillary equipment; manual and existing stages remain visible. |
| Crop/container/media scenarios and capacity | Assess every required scenario with source-qualified limits. |
| Installation, commissioning, training and enabling works | Capture responsibility, selection, coverage, profiles and labour drivers for shared CPQ resolution. |
| Concept process diagram and equipment schedule | Estimating studies; no fabrication or engineering release. |
| Material proposal and labour-fact projection | Separate versioned contributions, paired to the same exact run and scope. |
| Supplier enquiry preparation | Internal questions/evidence pack for deliberate export; no automatic sending. |

Later: tray automation, transplanting, advanced robotics, multi-supplier rule packs and richer line simulation. Initial discovery may capture these requirements, but unsupported sizing returns Not assessable. Automatic CAD layout, robot reach/collision design, electrical/safety design, PLC programming, live supplier integration, ERP transactions and customer self-service are outside this release.

A simple repeat/parts order can use Direct CPQ with a recorded reason. That route cannot suppress a known technical dependency.

## 3. Roles and workflow

Sales/advisers capture customer requirements and evidence. Estimators own scenarios, configuration, delivery selections and receiving decisions. Technical reviewers assess equipment fit, interfaces and sample trials. Products/profile owners maintain exact mappings and profile publication; standards/commercial owners review productivity, rates and clauses. Supplier confirmation is distinct from internal review and commissioning acceptance.

Read, edit, generate, receive, review and issue are separate actions under O15. Reuse suitable existing permissions; future additional capabilities require their own design and review.

1. Start from saved Discovery or Express context: company, workspace, alternative, site, system and exact scope revision. Express still needs specialist inputs; never fabricate Complete Discovery.
2. Capture the current process and required scenarios. Unknowns have an owner and next action.
3. Assemble process stages. Identify manual, retained, reused, customer-supplied and new equipment and their delivery phase.
4. Select candidates and options. Show checks per scenario, limit sources and conflicts; changing a scenario does not silently change equipment.
5. Resolve interfaces and delivery scope. Select exact profile versions, responsibilities and covered/additional activities.
6. Preview findings, quantities and facts. Save an immutable run with reason and exact catalogue/rule/mapping/source versions.
7. Preview and accept into CPQ. Review additions, changes, removals and overrides; CPQ resolves activities and pricing.
8. Use in a new estimate version, then prepare/review/issue through ES-04/ES-05. Receiving, Use, approval, issue and downstream acceptance remain distinct.

Logical records: workbench instance, immutable revisions/runs, scenarios, stage/equipment instances, connections, evidence, delivery selections and findings. Child IDs survive sorting/renaming. These are proposed logical objects, not SQL tables or API endpoints.

Facts carry value, unit, applicability, source and review attribution. Distinguish Unknown, Not applicable, Assumed, Customer advised, Supplier documented and Trial measured from Pending/Reviewed/Rejected review. Blank numeric fields are unknown, never zero. Contradictory sources remain until explicitly resolved.

## 4. Questionnaire mapping

The supplied questionnaire informs discovery; it is not executable operating policy. Preserve its question IDs and source identity. The commercial-in-confidence original remains outside public Git; this is a derived functional mapping.

| Source | Destination and treatment |
|---|---|
| ATT-01–ATT-12 | Evidence availability, requested owner/date, exact attachment reference and applicability. |
| A-01–A-05 | Reuse customer/site/contact records; capture seasonal and installation timing. |
| B-01–B-07; C-01 | One project-type answer with both mappings; separate alternatives, phases and delivery scope. |
| C-02–C-05 | Existing equipment, interfaces, condition and bottleneck observations. Estimating creates no installed asset. |
| D-01–D-05 | Process operations, manual/automatic stages, buffers and protected agronomic requirements. |
| E-01–E-06 | Normal/peak targets, operating patterns, baseline staffing and scenario rates. |
| F-01–F-07 | Exact container geometry/material/nesting, crops, tray layout and sample evidence. |
| G-01–G-07 | Media behaviour, supply format, loading, conditioning and dosing. |
| H-01–H-06 | Fill quality, compaction, hole pattern, finish and acceptance criteria. |
| I-01–I-06; J-01–J-03 | Infeed/outfeed, footprint, clearances, buffers, stability and robotics interfaces. |
| K-01–K-07 | Utility availability versus verified demand, unloading, access and enabling works. |
| L-01–L-04 | Control interfaces, test scope, commissioning, training and support. |
| M-01–M-04 | Supplier preference versus mandate, exclusions and adviser selection. |
| N-01–N-02; S-01–S-04 | Clarifications and attribution; information confirmation is not technical or quotation approval. |

Add batch quantity, required good output, gross/net rate basis, available production minutes, planned stops, changeover count/time, rejects and staffing. Add filled mass, plant height/stability, sample/trial IDs and measurable fill tolerance. Add transfer height/direction/width/spacing, control handshake, stop/restart boundary and integration owner. Add verified voltage/frequency/phase/current, air pressure/consumption and maintenance clearance. Record test product/media, duration, required output/quality and witness responsibilities.

Conditional sections reduce irrelevant questions. Hidden answers retain applicability history; hiding a section cannot erase a finding or quoted work. Customer-required, adviser-assisted and supplier-confirmation inputs remain distinguishable.

## 5. Technical selection and calculations

The following are proposed PPO rules requiring reviewed editions and independent cases before implementation. They are not Javo rules. Record rule ID, purpose, dimensions, sources, raw inputs, rounding, assumptions and explanation.

| ID | Proposed rule | Unknown/failure treatment |
|---|---|---|
| NAC-R01 | Check every scenario against exact variant/options: geometry, mass, nesting, plant handling, media and required operations. Boundary inclusivity follows the reviewed source. | Known mandatory violation: Not suitable. Missing applicable evidence: Needs confirmation. A score cannot cancel a failure. |
| NAC-R02 | Convert trays/hour using exact occupied pots/tray; retain original and converted quantities. Dimensional conversions use reviewed editions. | Unknown occupancy/unit: no comparable rate; no label-based conversion. |
| NAC-R03 | One compatible sequential line: indicative steady-state rate is the minimum comparable stage rate, including manual planting/take-off. | Missing stage rate: Not assessable. Branches, shared operators, recirculation or asynchronous cycles require another supported model/manual review. |
| NAC-R04 | Good batch output = gross running rate × available running hours × good-output fraction. Exclude planned stops/changeovers once. For an already net-good rate, omit the quality factor. | Stops cannot exceed shift time; fraction is 0–1; no universal efficiency or double loss adjustment. |
| NAC-R05 | Indicative buffer coverage minutes = usable positions / downstream pots per minute. | Zero demand: Not applicable; missing capacity: Unknown. No claim that buffering removes a persistent bottleneck. |
| NAC-R06 | Purchase count follows new selected instances. Options follow reviewed per-machine/per-line rules; shared items have one owner. | Reused/customer-supplied/stock items have explicit no-purchase disposition but may still require labour. |
| NAC-R07 | Separate technical, installed, spare, waste and purchase-pack quantities. Convert to exact Variant units before emission. | Missing conversion/nonrepresentable quantity blocks generation; no rounding at receiving. |
| NAC-R08 | Check mechanical, electrical, air, control/data and stop interfaces for each connection and direction. | Same supplier/nominal height does not prove compatibility; required confirmation blocks Use. |

Retain raw precision. Proposed display: whole units/hour and 0.1 hour; compare unrounded values. A displayed maximum whole output may be floored conservatively, but that is not the acceptance calculation. Emitted quantities follow adopted O2 after the shared numeric contract reconciles native 100,000 and the draft's larger envelope. Do not adopt the draft's larger limit by accident.

Synthetic expected cases: stage rates 3,200/2,400/2,800 pots/hour yield 2,400; 300 trays/hour at 12 occupied pots yields 3,600 pots/hour; 2,400 gross/hour × 6 running hours × 0.95 yields 13,680 good pots; 240 places / 40 pots/minute yields six minutes. Removing the planting rate makes the line result Unknown. These are invented test inputs, not equipment ratings.

## 6. Delivery profiles and labour facts

Apply the shared plan's DP1–DP8. Product/profile presence does not imply service inclusion. Keep applicability, commercial selection, delivery responsibility and review state separate. Base commissioning performed by the supplier and covered by its price is included scope with coverage evidence, not excluded work or a second PPO labour charge.

| Activity | Candidate driver | Coverage decision |
|---|---|---|
| Mechanical installation | Installed machines; conveyor sections/length; connections; access condition | Assembly versus components; include reused/customer-supplied units where installed. |
| Electrical/control integration | Confirmed circuits, interfaces, I/O/test points and engineered cable quantities | PPO, supplier or site contractor; separate enabling works from commissioning. |
| Commissioning | One line setup plus machine/interface tests and production-scenario trials | Supplier-covered work, local integration testing and repeat visits have distinct coverage. |
| Training | Sessions, cohorts, languages and agreed operator/maintenance scope | Offered versus selected; no automatic inclusion from purchase. |
| Setup and handover | Project/line mobilisation, documents and handover session | Count shared work once across systems and workbenches. |
| Freight/unloading/travel/accommodation | Shipment, visit or delivery basis | CPQ-owned charges and responsibility; not hidden in installation hours. |

The separate versioned fact projection binds to the accepted source and run. Candidate fields: fact key, subject/instance ID, driver, value/unit, evidence state, applicability/selection basis, source revision/hash and derivation. Candidate drivers: installed_machine_count, installed_conveyor_length_m, integration_connection_count, commissioning_scenario_count and training_session_count. The shared DP4 contract must confirm their exact names/shape; they are not arbitrary additions to material schema 1.

Profiles reference governed activity standards and approved content; equipment facts contain no prices or invented productivity defaults. CPQ resolves effective quantities and standards. Synthetic person-hour case: two installed units × 3 person-hours/unit + one 2 person-hour setup = 8 person-hours. A two-person crew must not multiply those hours again. Four elapsed hours would be an idealised division, not a schedule/customer promise.

The alternative's activity ledger identifies activity instance, system/line ownership, covered components, additive/replacement policy, exact fact/profile/standard versions and evidence. Detect overlaps among product defaults, assembly work and project setup. A reviewed assembly activity may cover components without separate profiles. A reasoned Manual activity is the pilot fallback for a missing automatic standard; unknown required effort cannot become zero.

Commercial quantity overrides do not rewrite engineering facts. Recompute dependent quantity-based activities through CPQ; require technical reassessment when adequacy changes. Profile/standard publication alerts draft owners but changes no saved estimate; explicit adoption compares affected quantities, effort and meaning.

## 7. Shared CPQ handover

| Contribution/control | Required treatment |
|---|---|
| Material/equipment proposal | Unpriced parts, exact quantities/units, findings and documents. Stable position/instance/role-based keys. No labour charges, money or ad hoc fact fields in schema 1. |
| Delivery facts and scope | Separate reviewed DP projection, profile links and selected responsibility. Pair with material contribution by exact run/source; refuse mixed revisions. |
| Mapping | Exact published Variant revision/hash/unit. Unmapped active material can be received for review but blocks Use until mapped or a reasoned one-off is resolved. |
| Options | O7 distinguishes base, selected, offered, excluded and parked scope. Offered options need complete separate quantity/mapping/cost/approval basis; alternatives are not summed. |
| No-purchase/route exit | O4 explicit empty contribution/removal preview; retain technical dependencies and delivery work. No fabricated positive or zero line. |
| Rerun | Three-way compare baseline/current/incoming for the same instance; preserve unrelated/manual work. Review removed/reintroduced lines and overrides; no quantity override across changed part/unit. |
| Recovery | Accept and Use are separate atomic operations. Same ID/exact payload recovers original authorised receipt; changed payload needs new operation/preview. Recheck current access. |
| Capacity | Keep O6's 100-active-line pilot; shared contract must define parked/retained counting. Refuse with counts/remediation, never truncate or split to evade limits. |

If the fact receiver/profile engine is not ready, that is a delivery dependency. Do not add fields to schema 1 or omit labour silently. A material-only demonstration is partial and cannot count as the complete Nursery pilot.

## 8. Findings and readiness

Keep completeness, technical suitability, receipt readiness, CPQ Use and quotation readiness distinct.

| Condition | Proposed gate |
|---|---|
| Invalid required quantity, missing binding, inconsistent parts/facts or failed required output | Block receipt; repair saved source. Optional failed output can be withheld explicitly. |
| Required scenario outside limits, essential interface unknown or required supplier confirmation missing | Technical finding blocks Use. |
| Unmapped active part, missing cost/labour, unknown responsibility/coverage or duplicate activity ownership | Receive valid scope for review; block Use until its owning decision resolves it. |
| New source/profile/standard | Show difference and impact; adopt deliberately. Rerun affected technical/mixed changes; commercial-only changes need CPQ recalculation rather than invented technical reruns. |
| Missing essential qualification or contradictory clauses | Block quotation approval/release. |
| Contextual optional note | Warning/information; not every open note blocks receipt. |

Findings have stable key, input/subject, severity, affected gate, action and owner. Reviewed does not mean known/suitable. No global Ignore all action; exceptions require the governing authority and evidence.

## 9. Outputs and quotation

Seal a concept process diagram, selected equipment/option schedule, scenario assumptions and utility/interface summary where applicable. Keep the internal clarification list separate. Design outputs say “Estimating study — not for fabrication”; diagram geometry does not certify clearances or performance.

Generate customer content at system/package level from resolved scope and approved library versions. Distinguish supply, installation, commissioning, training, prerequisites, exclusions, qualifications and handover. Profiles link content; they do not own every project clause. Editing prose cannot silently change structured scope.

Before ES-05 approval, reconcile every promised service to its priced activity or evidenced supplier/assembly coverage. Internal hours, productivity, costs, margin and supplier correspondence remain Internal by default. Fixed-price wording does not imply an hour cap or duration promise. Offered services have separate complete commercial bases.

Only outputs from runs adopted into the exact estimate may become appendices. O5 requires successor source/manifests for changed bytes, even with unchanged quantities. Pure clause/editorial changes follow the shared impact/reapproval route without fabricated technical reruns. Preserve issued bytes and approvals. MYOB Acumatica, SharePoint and native CAD retain their authorities.

## 10. Equipment data and onboarding

Use the [equipment-data template guide](../templates/nursery-automation/README.md), editable workbook and reviewable field definitions. They stage equipment, options, interfaces, delivery profiles, activity standards, content links and evidence. They neither import nor publish Products records.

Nominate the first frequently quoted models and regional/options variants with a supplier/Products owner. Confirm container/media scenarios, resolve contradictory sources, then bind exact Products Variants and reviewed profiles/content. Operational quotations and supplier documents remain in the approved private store.

Javo's [application range](https://www.javo.eu/en/applications/) supports these family boundaries. Its [Standard 2.0 page](https://www.javo.eu/en/product/javo-standard-2-0/), consulted 22 October 2026, gives different minimum pot diameters in descriptive and technical sections. No web value is promoted into an approved template limit; source conflict and applicability require confirmation.

## 11. Delivery and acceptance

| Slice | Deliverable | Evidence required |
|---|---|---|
| N0 | Specification/template/source mapping | Documentation and template assurance; owner review separate. |
| N1 | Curated equipment data and discovery/scenarios | Reviewed sources; synthetic save/reopen/unknown/conflict cases. |
| N2 | Stages, checks and outputs | Independent quantity/rate cases; desktop/mobile workflow review. |
| N3 | Shared parts/facts and delivery activities | O/DP contracts available; exact lineage, one ledger, override and duplicate-charge proof. |
| N4 | Quotation and complete pilot | Scope/price/content/appendix reconciliation through controlled handover. |

N3 consumes the parallel shared CPQ/Products implementation. Recheck its merged contracts and current work claims before building. This package selects no new framework, service, schema migration, route or capability.

Use the [acceptance catalogue](../testing/nursery-automation-acceptance.md) and [working design note](../design/development/nursery-automation.md). Proposed test cases are not executed evidence.

Open before dependent implementation: model shortlist/source owner, reviewed regional/options limits, supported topology, productivity/coverage standards, exact shared fact/profile/content contracts and numeric/count semantics, nominated reviewers and complete synthetic pilot data. Specification/template preparation can proceed while these remain open.
