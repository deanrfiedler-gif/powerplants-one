---
document_id: PPO-EN02-RPT
title: EN-02 — Design Basis and Interface Register — Delivered Feature Report
revision: r01
date: 2026-09-17
owner: Dean Fiedler
scope_id: EN-02
status: HTML built; model and DOM checks passed; native browser review pending
source_commit: 108b1600152ee12443c75ffaf7feb7cc857316f5
---

# EN-02 — Design Basis & Interface Register

**Powerplants One · Delivered feature report · r01**

The [standalone HTML](PPO-Design-Basis-and-Interface-Register-r01.html) now implements the six-view workspace described in the authorised build plan. Engineers can retain requirements and uncertain inputs, assign both sides of an interface, review an exact basis, correct returned work and prepare a recoverable downstream handover. A later source change preserves the earlier decision while identifying current reassessment needs.

The delivered artifact is a synthetic design demonstration. **38 model checks and 22 DOM interaction checks passed. Native browser rendering and device review remain outstanding** because the review browser rejected the local file URL under its URL policy. No screenshots or visual acceptance are claimed. This is the principal verification limitation of r01.

## 1. Document control and delivery boundary

| Item | Delivered position |
|---|---|
| Scope | EN-02 — Design basis and interface register; Engineering & Design Control |
| Direct parent | ENG-02; existing ENG-01–ENG-07 identities preserved |
| Main source checkpoint | `108b1600152ee12443c75ffaf7feb7cc857316f5`, refreshed before construction |
| Incoming dependency | CS-08 Site Survey & As-Found evidence; existing Engineering package context |
| HTML revision | r01, self-contained with embedded fonts, styles, data and scripts |
| Primary page types | Record detail and Register / worklist, using the r20 conformance vocabulary |
| Supporting page types | Review / comparison, Form / guided workflow, Document & evidence workspace |
| Theme source | Supplied r22 board, version 2; exact source hash retained in the package manifest |
| Implemented runtime | Browser-local synthetic state only; no server route, database or live integration |
| Acceptance | Build authorization is recorded; screen/device acceptance and engineering authority remain separate |

The accepted Engineering r02 package coordination model is retained. Project and Opportunity are distinct context kinds. “In design” remains a coordination state; Draft, Submitted, Returned, Reviewed and Withdrawn are the proposed local **basis** lifecycle. Creating this HTML does not add those states to the application’s current Engineering database or API.

The source package includes a deterministic generator, pure model, UI source, canonical location fixture, exact-byte manifest, test runners, individual results, retained build plan and receiving decision. Existing issued HTML and accepted UI baseline hashes are unchanged.

## 2. Workspace composition

The workspace starts inside a selected Engineering package. Its header provides the package’s context, current basis revision, state and available next action. A small role preview allows the synthetic author, reviewer and discipline owners to exercise their different responsibilities. The local save indicator distinguishes saved changes, unsaved form input, conflicts and recovery.

| View | Main work | Principal controls |
|---|---|---|
| Basis & scope | Purpose, intent, exclusions, exact areas, source basis and next action | Edit basis; inspect source; navigate to the owned gap |
| Requirements | Sourced requirements and acceptance criteria | Search/filter; add/edit; inspect applicability, owner and verification method |
| Assumptions & questions | Owned uncertain inputs and response acceptance | Filter blocking/open/question records; record, accept or reject evidence response |
| Interfaces | Provider/receiver responsibilities on one exact boundary | Register/matrix; typed property; edit; separate side confirmations |
| Calculations & sources | Exact evidence versions and native calculation/model references | Source comparison, predecessor content, adoption, impact and input-basis check |
| Review & handover | Readiness, submission, correction, independent decision and receiving preview | Submit; return; successor; finding response; review; prepare; reconcile; history |

Record snapshots use a right-side inspection dock. “Open full detail” provides a larger reading surface. Typed editors use a scrollable centered dialog in r01; this is an explicit departure for the longer requirement/interface forms and needs native phone review. There is no competing application masthead, global navigation rail or separate Engineering intake flow.

The interface matrix is an alternative view of the same records. Empty cells say nothing about whether a missing interface is required; they are not interpreted as proof of completeness.

## 3. Basis, identity and applicability

Each package retains internal identity, readable reference, organization, site, Project/Opportunity identity, coordination state and expected version. The basis carries its own stable identity, edition, author, purpose, required date, summary, exclusions, applicable areas and exact source pins.

The primary example uses the existing Willowbank Horticulture location fixture without changing its identifiers. One physical pump, `SYN-PPO-AST-000501`, is installed in Irrigation Shed 01. Separate relationships show that it serves Greenhouse 01, Tunnel 01 and Propagation House 01. The sketch makes no flow, sizing or surveyed-position claim. The Opportunity and field examples have their own contextual descriptions; the nursery pump diagram is not reused as field-site or screen-mounting evidence.

Editors restrict target areas to the selected basis scope. Cross-site assignments are refused. Removing an area used by current records is refused with an orphan count, allowing the engineer to reassign applicability deliberately first. Historical submitted applicability remains with the earlier snapshot.

The location fixture’s Australia/Melbourne site context is retained. Calendar dates display in Australian day–month–year form without timezone shifts. Fixture ageing uses 17 September 2026; event timestamps record actual local execution time. This does not implement a business-calendar or timezone scheduling service.

## 4. Requirements and uncertain inputs

Requirements include a local label, title, full statement, category, provenance, area, owner, acceptance criterion, verification method, source identities, dependencies and affected-deliverable references. These are package records, not new parent blueprint IDs. A customer statement stays explicitly classified as such.

An incomplete requirement can be saved as a draft. Missing owner, criterion or source appears in readiness and prevents a positive review. Editing a requirement invalidates dependent calculation checks and interface confirmations where the recorded dependency graph identifies them. The HTML does not silently recalculate a result.

Assumptions, constraints and technical questions retain an owner, due date, validation plan, consequence, applicability and sources. A blocking input must receive evidence and obtain independent reviewer acceptance before positive basis review. Recording a response produces **Response received**; it does not produce Supported. The reviewer can accept or reject it against the exact adopted source version.

An unresolved nonblocking input is allowed only with an owner, validation plan, consequence and due date. Its remaining obligation is carried into the handover payload and review export. A changed input or affected source invalidates earlier acceptance where applicable. An unowned material gap blocks submission rather than disappearing into a count.

The prototype records internal responses. It does not send an RFI, contact a supplier or claim customer agreement. EN-04 owns the eventual external technical-question workflow.

## 5. Interfaces and technical properties

Each interface contains its boundary category, applicable area, provider and receiver owners, responsibilities, required input, expected output, agreement criterion, supporting sources, revision and optional typed numeric property.

| Property state | Meaning and saved value |
|---|---|
| Known | Finite number and unit required; zero remains a valid number |
| Unknown | Numeric value and unit remain unasserted |
| Not applicable | Deliberate non-applicability, distinct from an unknown value |

Units are retained as entered display data. There is **no unit conversion, cross-unit arithmetic, sizing engine or compatibility comparator** in this release. Numeric validity does not establish engineering suitability.

The illustrative policy requires distinct responsible parties. Only the selected named side owner can confirm that side, and both confirmations must refer to the same interface revision. Confirmation is blocked by missing, disputed or changed supporting evidence. One side’s agreement does not satisfy the other.

Editing a boundary creates a successor interface revision and clears both confirmations. Prior agreement content is retained in event evidence or an earlier submitted snapshot. Adopting a source successor also invalidates directly and indirectly affected interfaces. Starting a basis successor requires fresh agreement and input checks for that edition.

The synthetic discipline owners are Alex Morgan for Hydraulics, Riley Chen for Controls and Taylor Reed for Electrical. Those previews are a bounded demonstration of responsibility, not a complete discipline/delegation model.

## 6. Source evidence and native references

Sources have stable IDs, readable references, classification, current version, availability, observed date and synthetic content. The basis separately pins a selected version. Available, unavailable and restricted references remain visible as different conditions.

“Add demonstration evidence” authors a new local synthetic source version and explicitly says that it does not obtain real evidence. Adoption is a separate action. The previous source content is retained, and the inspector lets the reader open those predecessor versions. A source successor cannot enter a submitted basis or response while it remains unadopted.

The original CS-08 example is not treated as an approved live survey. The primary EN-02 source explicitly identifies itself as an **authored demonstration successor**. That distinction is preserved in the retained content and export.

Calculation/model records describe authoring tool, tool version availability, source revision, input-basis edition, method reference, owner, checker, conclusion and supporting dependencies. “Record input-basis check” records what the reviewer examined. It does not run a hydraulic calculation or a CAD model.

After a relevant source change, the prior conclusion and check remain visible while current status reads Needs reassessment. Source adoption reopens both direct and indirect dependent checks. SOLIDWORKS and SharePoint remain contextual authoring/storage choices; versions, supported connectors, PDM and native dependency handling have not been established.

The restricted supplier note is represented by a generic placeholder in normal views and review exports. Its hidden title/content are not included in those projections. The placeholder represents an already-known unavailable reference; the UI does not claim to enumerate a protected provider library.

## 7. Review, correction and exact receiving evidence

The author submits a snapshot of the basis, exact selected source content and illustrative review policy. Its SHA-256 fingerprint is computed from those serialized bytes. Submitted work is frozen. Editing Returned, Reviewed or Withdrawn work requires a new basis edition.

| Transition | Control |
|---|---|
| Draft → Submitted | Author; applicable scope and owned information gaps; no unadopted source successor |
| Submitted → Returned | Independent reviewer; reason retained; creates a correction finding |
| Returned → Draft successor | Author supplies change reason; earlier submission and decision retained |
| Submitted → Reviewed | Independent reviewer; exact content/policy current; all blocking readiness conditions resolved |
| Reviewed → Withdrawn | Independent reviewer supplies reason; positive historical decision remains visible |
| Reviewed → Prepared handover | Author; current eligibility; one receiving pack for the exact submission |

A returned finding has its own response and acceptance. The author cannot mark that response accepted. Positive review remains blocked until the reviewer has accepted the correction. The model also refuses author self-review and missing review-authority configuration.

When sources change after submission, the old snapshot remains intact. The UI offers return of that changed-source submission and a successor workflow. It does not silently apply a positive decision to new evidence. Revision comparison shows changed scalar fields and whole changed collections; it is not yet a record-by-record semantic or native CAD difference engine.

Reviewed describes the exact basis for its stated purpose. Current eligibility is evaluated separately and can become Needs reassessment or Held. Earlier review history is preserved. A reviewed basis never means that procurement, installation or live operation is authorized.

The prepared EN-03/EN-05 payload contains the exact submission, review, context, receiver and retained limitations. It has its own content fingerprint and original operation ID. The receiving simulator can accept or return it and can deliberately interrupt the response after retaining the receipt. Reconciliation recovers that original receipt; it does not create a second receiving effect. Other material actions are held while that outcome is unknown.

## 8. Traceability and change assessment

Dependencies connect sources, requirements, assumptions, interfaces, calculations and named deliverable references. Impact traversal follows direct and indirect links, handles cycles and deduplicates results. The impact panel reports whether the selected package’s context is complete.

This is a bounded recorded graph. “No recorded links found” is explicitly not proof of no engineering or commercial impact. Wider drawing issues, accepted quotations, materials, controls configuration and commissioned equipment require their owning reviews. Deliverable references are labels in this HTML, not synchronized downstream records.

The history records actor, time, action, edition and original operation. Relevant prior record content is retained when editable evidence changes. The full original history is available in the selected-package export. It remains client-held demonstration data, not a protected audit store or trusted digital signature.

## 9. Synthetic fixture catalogue

| Package | Context and initial condition | Purpose |
|---|---|---|
| SYN-PPO-ENG-000701 | Project: Nursery irrigation upgrade; Draft r01; complete context but missing supply evidence | Main complete demonstration: six requirements, three uncertain inputs, two interfaces, two calculation/model references |
| SYN-PPO-ENG-000702 | Opportunity: Screen & lighting coordination; review policy not configured | Presales context, supplier mounting/power unknowns and no permissive authority fallback |
| SYN-PPO-ENG-000703 | Project: Field controls upgrade; partial context | Exact field-site applicability, unknown firmware/protocol compatibility and incomplete-source treatment |

Alternate package records have distinct IDs. Their technical narratives are authored for their contexts rather than inheriting the nursery’s irrigation conclusions. All people, places, references and outcomes are fictional demonstration data. No real technical capacity or supplier support is implied.

## 10. Persistence, recovery and exports

Changes are stored under `ppo-engineering-basis-r01` with schema `ppo-engineering-basis/1`. The UI compares retained storage before writing and the model checks the expected package version. A stale write preserves input and directs the user to export or reload. This illustrates concurrency handling; simultaneous browser writes still need server atomicity in an implementation.

A simulated save failure retains the computed pending result and its original operation. Retry persists that same result, avoiding a duplicate command. Retry and export controls are reachable inside the dialog. The pending export includes the selected permitted package and unsaved form fields. Switching role or package is held while a save is pending.

Malformed or unsupported saved state pauses writes and retains original bytes. Recovery offers original-state export and a scoped reset. Reset affects only this module’s key. Unsaved form input prompts before discard or context change.

Normal JSON exports are synthetic review copies. They retain selected package identity, current basis, source/review history, limitations and snapshots, using the same restricted-source projection as normal reads. There is no JSON import route. The explicit **original saved-data export** is a separate recovery function containing original bytes; it is not a permission-filtered operational export. The file holder can also inspect all embedded fixtures in the HTML source.

The print surface includes current status/revision, purpose, scope, exclusions, requirements, interfaces, remaining input plans and consequences, sources, retained decision and latest submitted content identity. It is labeled SYNTHETIC REVIEW COPY. Historical submissions remain in JSON; choosing a historical revision for a dedicated print layout is deferred. Native download completion and pagination were not tested.

## 11. Visual and interaction treatment

The styles apply the supplied r22 board’s Roboto, navy/green palette, line icons, restrained borders, spacing and selected-state distinctions. Local tabs use a lifted selected panel with a green accent. The register/matrix selector uses an exclusive segmented state. Selection, focus and status have distinct treatments.

The desktop composition uses a primary work area plus a narrower context column. CSS rules stack those areas and turn register rows into labeled cards on smaller screens. At narrow widths the record dock becomes a modal surface with a close control and modeled focus containment. Long tables remain within their own scrolling container. Print and reduced-motion rules are included.

Buttons and fields have accessible names, visible-focus styling and native control semantics. Tabs use roving focus with arrow/Home/End handling and manual activation. The skip link targets the active panel; alerts and save state use live regions. Dynamic text is escaped before rendering, and user input is not converted into active links or executable markup.

These are implemented mechanics and DOM assertions. They have **not** established actual visual geometry, touch target usability, font rendering, native keyboard behavior, screen-reader output or accessibility conformance. The original plan’s desktop/tablet/phone/320 px and 200% zoom review remains an open gate.

## 12. Demonstration walkthrough

Open the HTML and use “View demonstration” for the in-product steps. The initial author is Sam Jordan.

1. Inspect the basis, site applicability, exclusions and six requirements.
2. In Calculations & sources, open Available supply, add demonstration evidence, then reopen it and adopt the new version.
3. In Assumptions & questions, record an ASM-01 response using that supply evidence. Switch to Casey Quinn and accept it.
4. In Interfaces, Alex Morgan confirms IF-01’s provider responsibility; Riley Chen confirms its receiver responsibility.
5. As Casey, record CALC-01’s input-basis check. This is a reference review, not a numerical calculation.
6. As Sam, submit the exact basis. As Casey, choose Reviewed for stated purpose and enter a rationale.
7. As Sam, prepare the receiving handover. In Review & handover, run the receiving preview with the interruption selected, then reconcile the original outcome.
8. Use Workspace information to demonstrate a later source revision. Inspect the impact and retained earlier decision; current eligibility now needs reassessment.

For the returned-work variant, submit the initial incomplete basis and return it as Casey. Start a successor as Sam with a reason. Resolve the technical inputs, reconfirm both interfaces and recheck both references because the basis edition changed. Respond to the finding and have Casey accept the response before submitting/reviewing the corrected successor.

Workspace information also exposes failed-save, partial-read and failed-read demonstrations. The screen/lighting Opportunity shows missing authority; the field package shows incomplete context. Reset can restore the fictional starting data after local work is exported.

## 13. Verification against the build plan

The exact source manifest and individual result files are in the repository contribution. Local checks used **Node 24.19.0** rather than the pinned **24.21.0**. DOM checks used **jsdom 26.1.0** and modeled dialogs, object URLs, print calls and width values. No application dependency was added.

| Plan checks | Evidence and limitation |
|---|---|
| T01–T05: context, asset, scope, provenance, draft completeness | M01–M05; D05/D10. Canonical location JSON comparison and actual form save checked. Native presentation pending. |
| T06: unknown/zero/not-applicable | M06–M07; D18. Saved values and actual DOM form zero checked. |
| T07: incompatible unit comparison | Deferred: r01 has no conversion or cross-unit comparison command. |
| T08–T10: ownership, rejection impact, response acceptance | M08–M10, M36–M37; full DOM journey D11. |
| T11–T13: interface sides and changed agreement | M11–M13, M34; D08/D11. Same-party assignment explicitly refused. |
| T14–T15: changed calculations and restricted/history sources | M14–M15, M33; D09/D17. Client projection only, not server access assurance. |
| T16–T20: exact submission, independence, findings, limitations, missing policy | M16–M20, M35, M38; D10–D12. |
| T21: stale source/policy decision and form retention | M21–M22, M29, M37; D14. Native simultaneous-tab behavior pending. |
| T22–T24: receiving recovery, original-operation conflict, later changes | M23–M25; D11. One retained preview receipt; no provider integration. |
| T25–T26: orphan scope and cyclic/indirect impacts | M26–M27; M14/M34 propagation. Wider engineering impact not inferred. |
| T27–T30: incomplete reads, recovery, scoped export, safe text | M28–M33; D06/D09/D13–D17/D22. Raw recovery export intentionally preserves original bytes. |
| T31: full native keyboard journey | Pending. D02–D04/D19/D21 assert selected DOM mechanics only. |
| T32: native responsive/zoom review | Pending. Responsive CSS exists; no layout engine or original screenshots inspected. |
| T33: print/export every historical state | Partial. D20 asserts current print content; JSON retains earlier snapshots. Historical print selector and native output review deferred. |
| T34: deterministic package | Rebuild/manifest, source hashes, repository link/naming/whitespace assurance. |

**Actual result: 38 model groups and 22 DOM groups passed, zero failures in the retained run.** The full resolve → submit → review → prepare → interrupted receiving → reconcile → source-change journey ran through generated UI event handlers. A returned-work/finding path and recovery paths also ran. Passing these checks does not satisfy the outstanding native-browser gate.

Source, model and UI fixes made during verification include indirect dependency invalidation, retained predecessor evidence, refusal of unadopted sources, failed-save controls inside the dialog, retained stale form export, sanitized pending exports, correct matrix selection, accessible menu naming, reachable source inspection and corrected secondary fixture narratives.

## 14. Receiving implementation and remaining decisions

| Owner/boundary | Required next implementation decision |
|---|---|
| Engineering governance | D-002/D-019 competence, delegation, independence and purpose-specific review policy |
| Existing Engineering package | Server-scoped reads/writes, immutable context, record schemas and transactionally enforced expected versions |
| CS-08 / DK-01 / DK-02 | Authoritative exact source retention, unavailable history, provider permissions and successor notification |
| Native authoring | Supported SOLIDWORKS/tool versions, model dependencies, published extracts and calculation verification |
| EN-03 / EN-05 | Exact drawing/review handover contract, receiver acceptance and source-change obligations |
| EN-04 | External question/RFI issue, response identity and technical acceptance |
| EN-06 / EN-07 | Separate material release and commissioning/test evidence; no inferred downstream authorization |
| Shared shell / accessibility | Style containment, adopted role model, native device, keyboard, assistive technology and zoom review |

Bulk import/export grids, configurable columns, semantic per-record comparison, unit conversion, formula execution, full attachment viewers, native provider integration and a historical print selector are outside r01. Technical fields are intentionally references and assertions rather than invented engineering calculations.

The artifact does not close issue #11, BP-05, AT-15 or AT-37. It supplies a concrete EN-02 design for those broader receiving workflows to assess.

## 15. Source register

The build uses the sources below as context and authority boundaries; their historical test results are not attributed to this new artifact.

| Source | Application to r01 |
|---|---|
| [Current repository checkpoint](https://github.com/deanrfiedler-gif/powerplants-one/commit/108b1600152ee12443c75ffaf7feb7cc857316f5) | Existing implementation and contribution baseline |
| [Page Coverage Register r06](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | EN-02 identity, Tabs placement, priority and CS-08 dependency |
| [Master Blueprint](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/blueprints/BP-01-master-blueprint.md) | ENG-02 and broader Engineering release/change responsibilities |
| [Engineering r02 decision](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/decisions/engineering-r02-integration.md) | Accepted composition and bounded runtime intake scope |
| [Engineering runtime model](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/src/engineering/model.ts) | Context kinds, disciplines and coordination states |
| [CS-08 Site Survey HTML](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/reference/ui/customers/PPO-Site-Survey-and-As-Found-Workspace-r01.html) | Canonical exact location fixture; authored successor evidence explicitly distinguished |
| [Document Register handover](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/decisions/document-register-linked-library-design.md) | Exact sources, history, availability and technical review semantics |
| [HTML module conformance](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/standards/html-module-conformance.md) | Scope, page type, component reuse, handover and acceptance separation |
| Supplied theme board r22, version 2 | Controls, selected-state semantics, palette and three unchanged embedded Roboto font blocks |

The theme source SHA-256 is `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`. Build and source hashes are recorded in the generated manifest rather than asserted through a visual match. The retained plan, this report, decision and individual results make the uncompleted verification and implementation obligations explicit.
