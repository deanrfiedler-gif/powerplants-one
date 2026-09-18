---
title: EN-02 — Design Basis & Interface Register — Build Plan
revision: r01
date: 2026-09-17
owner: Dean Fiedler
scope_id: EN-02
status: Build plan prepared; HTML construction and verification pending
source_repository: deanrfiedler-gif/powerplants-one
source_branch: main
source_commit: 108b1600152ee12443c75ffaf7feb7cc857316f5
---

# EN-02 — Design Basis & Interface Register

**Powerplants One · HTML module build plan · r01**

| Document control | Position |
|---|---|
| Prepared for | Dean Fiedler |
| Purpose | Define a reviewable standalone HTML workspace and its detailed Markdown companion |
| Planning checkpoint | 17 September 2026; repository and open contributions inspected during preparation |
| Existing scope | EN-02 in HTML Page Coverage Register r06; Engineering & Design Control |
| Principal requirement | ENG-02 — requirements, design basis, assumptions and interface responsibilities |
| Delivery status | Planning only. This report does not claim that the HTML exists or that its proposed tests have passed. |
| Design basis | Accepted Engineering r02 structure; maintained scope/conformance rules; latest supplied theme board r22 |
| Operational boundary | Synthetic demonstration. Native engineering authoring, technical authority and actual source-system integration remain with their owners. |

## Contents

1. [Purpose and intended outcome](#1-purpose-and-intended-outcome)
2. [Verified starting point](#2-verified-starting-point)
3. [Scope and design conformance](#3-scope-and-design-conformance)
4. [Ownership and handover boundaries](#4-ownership-and-handover-boundaries)
5. [First HTML release](#5-first-html-release)
6. [Primary demonstration journey](#6-primary-demonstration-journey)
7. [Workspace composition](#7-workspace-composition)
8. [Basis and scope](#8-basis-and-scope)
9. [Requirements register](#9-requirements-register)
10. [Assumptions and technical questions](#10-assumptions-and-technical-questions)
11. [Interface register and responsibility matrix](#11-interface-register-and-responsibility-matrix)
12. [Calculations, models and source evidence](#12-calculations-models-and-source-evidence)
13. [Review, revisions and handover](#13-review-revisions-and-handover)
14. [Traceability and change assessment](#14-traceability-and-change-assessment)
15. [Information model and identity](#15-information-model-and-identity)
16. [States, commands and validation](#16-states-commands-and-validation)
17. [Roles and information access](#17-roles-and-information-access)
18. [Synthetic examples](#18-synthetic-examples)
19. [Visual design and accessibility](#19-visual-design-and-accessibility)
20. [Persistence and recovery](#20-persistence-and-recovery)
21. [Technical construction and package](#21-technical-construction-and-package)
22. [Build sequence](#22-build-sequence)
23. [Planned verification and acceptance](#23-planned-verification-and-acceptance)
24. [Open decisions and later implementation](#24-open-decisions-and-later-implementation)
25. [Source register and planning assurance](#25-source-register-and-planning-assurance)

## 1. Purpose and intended outcome

EN-02 should give an engineer and reviewer a clear answer to six questions:

1. What must this design achieve, and for which exact site, equipment and growing areas?
2. Which information is established, assumed, disputed or still missing?
3. Which source revisions and calculation/model references support the design basis?
4. Where do disciplines, suppliers or systems meet, and who owes each input or decision?
5. What is affected when a requirement, source or interface changes?
6. What exact basis has been reviewed, for which purpose, and what remains outstanding?

The central outcome is an **owned, evidenced and versioned design basis** that later drawing, review, material-release and commissioning workflows can reference. It should replace scattered assumptions and ambiguous responsibility with explicit records and a practical next action.

The principal experience is a selected Engineering work package with six connected views. EN-02 should extend the accepted Engineering workspace, retaining its work-package identity and source context. It should not introduce a second Engineering intake process. The page-register classification is “Tabs”; a standalone HTML is the review packaging for those tabs. [S02–S05]

A strong demonstration will let Dean follow one survey observation into a requirement, inspect a two-sided interface, return incomplete evidence, review a corrected successor and prepare an exact downstream handover. A later source change should show precisely what needs reassessment while retaining the original review.

## 2. Verified starting point

| Source or existing capability | Observed position | Consequence for this plan |
|---|---|---|
| Repository main | Inspected at `108b1600152ee12443c75ffaf7feb7cc857316f5`; latest inspected main commit merges AD-01 PR #232 | Use this commit for the planning source links; refresh before construction |
| Existing Engineering implementation | Persisted package intake, scoped reads, coordination changes, notes, events, expected versions and original-operation receipts | Reuse the package context; do not portray the wider technical lifecycle as already implemented |
| Accepted Engineering r02 | Register and package inspection structure accepted on 10 September 2026 | Preserve familiar package context, line icons, table behaviour and record inspection |
| Current runtime model | Project or Opportunity context; disciplines Mechanical, Layout, Hydraulics, Electrical, Automation and Controls; coordination states Queued, In design and Awaiting information | Keep those states and disciplines intact. EN-02 review states and horticultural system categories are separate proposed concepts |
| Coverage register r06 | EN-02 is a P2 new-design scope with explicit dependency CS-08; family traceability includes ENG-01–ENG-07 | Build from the Site Survey evidence contract; distinguish the direct ENG-02 contribution from adjacent future work |
| Engineering backlog #11 | Broader technical-release scope remains open | This plan and its eventual HTML do not close BP-05, AT-15 or AT-37 |
| CS-08 Site Survey | Reviewed exact survey snapshots, distinct observation types, owned information gaps and prepared Engineering handover | Receive the reviewed snapshot and its unresolved questions; survey review does not prove equipment capacity or design suitability |
| DK-01 / DK-02 | Exact document references, applicability, revision review, unavailable sources and retained history | Reuse these semantics for Engineering evidence rather than creating a competing document library |
| Design index | Lists Engineering r02 and its workflow map; no dedicated EN-02 workspace is listed at the inspected checkpoint | Treat EN-02 as the next defined design increment, preserving existing files |
| Open contributions | #234 Screen Systems r03, #235 AD-01 verification and #236 module upload | No inspected PR title identifies an EN-02 build. Recheck files before publishing a future package |
| Latest theme reference | Supplied r22, version 2, selected-state and control sections inspected; main index still points to r20 | Retain r20 page-type/conformance vocabulary and apply the inspected r22 interaction refinements |
| Native engineering environment | Later accepted decision confirms SOLIDWORKS and SharePoint; product versions, dependencies, PDM and supported integration remain unresolved | Use controlled references and synthetic published previews. Do not assume browser CAD editing or safe native-file relocation |

The older master paragraph describing the CAD package as unknown is qualified by the later Engineering decision naming SOLIDWORKS. That decision does not establish a supported integration. Likewise, STATUS contains historical aggregate baselines; the inspected main commit above is the planning checkpoint. [S01, S03–S06]

This source review is not a new application test, visual acceptance exercise or live Engineering-account inspection.

## 3. Scope and design conformance

| Required declaration | EN-02 proposal |
|---|---|
| Scope identity | EN-02 — Design basis and interface register, Page Coverage Register r06 |
| Direct parent | ENG-02 |
| Family relationships | ENG-01 for package ownership; ENG-03 for deliverable references; ENG-04 for exact review; ENG-05–ENG-07 for downstream use |
| Primary page types | Record detail and Register / worklist |
| Supporting page types | Review / comparison, Form / guided workflow, Document & evidence workspace |
| Shell boundary | Workspace interior only, within the existing application shell |
| Reused components | Engineering r02 package context and register conventions; CS-08 evidence classification; DK-01/DK-02 exact-source inspection; r22 controls and selected-state treatments |
| Incoming basis | Permitted Engineering package, immutable Project/Opportunity context, selected site/areas/assets, reviewed survey revision, commercial scope references and source documents |
| Outgoing basis | Exact reviewed design-basis snapshot, requirements, interface agreements, calculation references, exclusions, unresolved obligations and prepared receiving references |
| Exceptions | Missing, partial, restricted, changed or unavailable evidence; unowned interfaces; returned review; stale edits; failed saves; unknown receiving outcomes |
| Proposed departures | Six EN-02 local views, typed requirement/assumption/interface records, a basis-review lifecycle and a dependency comparison surface |
| Verification | Model, native-browser, visual, responsive and access-boundary checks with exact artifact evidence; owner and operational acceptance remain separate |

EN-02’s local records must not be mistaken for new parent requirements. Preserve all 78 parent IDs. Local requirement labels identify package content; they do not reallocate ENG-02 or create another corporate requirements scheme. [S02, S03, S12, S13]

The first build should explicitly record the differences between r22 guidance and the older accepted Engineering r02 composition. Applying the newer component guidance to this new workspace does not silently replace other accepted screens.

## 4. Ownership and handover boundaries

| Area | EN-02 responsibility | Responsibility retained elsewhere |
|---|---|---|
| Engineering package | Read package identity, owner, discipline and source context; link the design basis | Existing Engineering intake owns package creation, coordination and assigned owner |
| Site survey | Select exact observations as evidence; record applicability and outstanding inputs | CS-08 owns observations, photographs, survey corrections and its review history |
| Customer/site/equipment | Reference canonical identities and labelled scope | Shared customer/location and equipment owners control master records, moves and configuration history |
| Commercial basis | Reference exact accepted/proposed scope, exclusions and assumptions | CRM, Estimating and Projects own commercial acceptance, price, contractual change and work authority |
| Requirements and assumptions | Own the package’s design-basis interpretation, rationale, links and review | Source owners remain accountable for source facts; regulatory interpretation requires supplied competent evidence |
| Interfaces | Own boundary descriptions, the two sides’ obligations, evidence and agreement history | Discipline/supplier owners confirm their input, output and responsibilities |
| Calculation/model references | Register exact references, applicability, checked status and findings | Native tools and responsible engineers own execution, formulae, models and technical validation |
| Drawings and formal technical issue | Prepare exact required/affected deliverable references | EN-03 and EN-05 own drawing register and formal technical approval/release |
| Queries and submittals | Prepare a question with owner, context and exact response reference | EN-04 owns the wider RFI/submittal workflow and external exchange |
| Material requirements/substitutions | Identify constraints and affected material references | EN-06 and Supply Chain own release, substitution review and procurement handover |
| Change impact | Identify direct links and request a wider assessment | EN-07 and Projects own full technical/commercial impact and authorised changes |
| Commissioning | Reference proposed verification criteria and required evidence | EN-08 and the shared inspection workflow own execution, retests and as-built release |
| Documents and distribution | Retain exact source links and export a permitted review copy | SharePoint remains business-document authority; DK-03 owns controlled issue/distribution |
| Actions and approvals inbox | Prepare source-owned follow-up and review references | Shared Activities/My Work and SH-06 provide routing; their routing does not grant authority |

The distinction between an **interface owner** and a **technical approver** is essential. A person may be responsible for obtaining an electrical supply statement without being authorised to approve the electrical design. A Project Manager’s coordination acceptance also does not substitute for a technical decision. [S03, S06]

## 5. First HTML release

The proposed r01 should demonstrate:

- A package selector using existing Engineering-style synthetic records, with preserved context when switching.
- One primary multi-area irrigation/control example, plus two smaller contrasting examples.
- Six local views with meaningful search, filtering, editing and evidence inspection.
- Separate typed requirements, assumptions, constraints, questions and decisions.
- Two-sided interfaces with owners, required inputs, expected outputs and version-bound agreement.
- Calculation/model records that link to evidence without executing an invented engineering calculator.
- Immutable submission snapshots, returned findings, successor revisions and comparison.
- A reviewed basis with a precise permitted purpose and visible unresolved non-blocking obligations.
- A prepared EN-03/EN-05 receiving pack and a labelled receiving simulation.
- Source-change assessment showing direct dependencies and unassessed wider impact.
- Honest browser save, conflict, unavailable-source and recovery states.
- A detailed Markdown companion describing actual delivered behaviour, checks and limits.

Full CAD authoring/viewing, engineering sizing algorithms, automatic substitutions, real SharePoint/MYOB connections, external messages, customer acceptance, live approvals and production migrations are subsequent work. The HTML should use synthetic references and explicit simulations.

The priority is a complete bounded journey. Do not add unrelated dashboards, an AI chat system, a second document library, a general ERP mapping console or a universal approval engine to complete EN-02.

## 6. Primary demonstration journey

**Fictional scenario:** an existing Willowbank site requires an irrigation and controls design basis for several growing areas. A pump is physically installed in an irrigation shed and serves multiple areas. Its physical location and served areas must remain separate.

The design should reuse the established CS-08 synthetic context after copying the exact fixture identities from that package. New EN-02-only records receive distinct synthetic identities. The narrative below is proposed fixture content, not a real site assessment.

| Step | User action | Observable result |
|---:|---|---|
| 1 | Open the existing Engineering package and Design basis | Project/Opportunity context, site, package owner, coordination state and current basis revision are visible |
| 2 | Inspect the reviewed Site Survey snapshot | Measured, Observed, Customer statement, Assumption and Unknown remain distinct; review does not convert a claim into a measured fact |
| 3 | Define design scope | Select the shed and served growing areas; identify included systems and explicit exclusions |
| 4 | Create a requirement from a survey/customer source | The new requirement links to the exact source observation and states its own interpretation, owner and verification method |
| 5 | Record an assumption about operating mode | It has a validation owner, due-date state, consequence if wrong and affected requirements/calculations |
| 6 | Define a Hydraulics–Controls interface | Provider and receiver duties, inputs/outputs, exact area/controller context and confirmation requirements are visible |
| 7 | Register calculation/model evidence | The referenced revision, input basis, author and check status are inspectable; missing outputs stay unavailable |
| 8 | Run readiness checks and submit a snapshot | A blocking unknown prevents positive review; the user can still save the draft and request information |
| 9 | Return a finding, obtain synthetic evidence and create a successor | The response, independent acceptance and before/after change remain attributable; the earlier submission is unchanged |
| 10 | Review the corrected exact basis | Reviewer, stated purpose, scope, evidence set and remaining owned limitations are retained |
| 11 | Prepare a receiving pack and simulate an interrupted receipt | The original operation is reconciled; retry does not create another handover or alter its content |
| 12 | Introduce a later survey/source revision | Existing review remains historical evidence; current-use eligibility requires reassessment, with affected links and an owned next action |

The demonstration should finish with a readable record of what was reviewed, what was handed over in the simulation and what the subsequent change has reopened. There should be no misleading “Project complete” or “Approved for installation” result.

## 7. Workspace composition

The standalone file should open in a selected package, with a compact package switcher. The integrated entry point is **Engineering package → Design basis**. A synthetic chooser is sufficient for the standalone demonstration; it is not another authoritative Engineering register.

| View | Main question | Principal content and actions |
|---|---|---|
| **1. Basis & scope** | What are we designing, for whom and why? | Package context; purpose; scope/exclusions; site/areas/equipment; source basis; readiness summary; next owned action |
| **2. Requirements** | What must be achieved? | Searchable requirements table; category; exact applicability; owner; acceptance/verification method; evidence; linked deliverables |
| **3. Assumptions & questions** | What remains uncertain? | Distinct assumption/constraint/question records; source classification; validation plan; responsible owner; due-date state; consequences; response review |
| **4. Interfaces** | Where do responsibilities or systems meet? | Register; two-sided detail; responsibilities; input/output contracts; applicable assets/areas; agreement evidence; optional compact matrix |
| **5. Calculations & sources** | What supports the basis? | Calculation/model index; exact revisions; input-basis links; review status; source availability; supported static evidence previews |
| **6. Review & handover** | What has been reviewed and what can proceed? | Readiness findings; immutable submissions; return/correction; comparison; purpose-bound basis review; prepared handover; history and change assessment |

The title area should contain package reference/title, basis revision and state, source context and save state. Keep the main action contextual: Edit basis, Submit for review, Review submission or Prepare handover. Secondary actions belong in a quiet menu.

History should be reachable from any record and fully available in Review & handover. Do not force users to leave an unsaved form to identify the exact source they are editing against.

Counts such as Open questions, Unconfirmed interfaces and Changed sources should open the relevant filtered records. Counts can overlap and must not be summed into an unsupported completion percentage.

## 8. Basis and scope

### Required information

| Field group | Information | Behaviour |
|---|---|---|
| Identity | Existing package UUID/reference; basis UUID; draft version; revision label; title | Package identity and source relationship are retained; a title change is not a new identity |
| Context | Project or Opportunity; organisation; company; site | Context comes from the permitted source package. Missing site is explicit and requires an applicability decision |
| Purpose | Presales assessment, detailed-design preparation or another explicitly labelled fixture purpose | Purpose controls the demonstration’s evidence expectations; it does not authorise effort or installation |
| Scope | Systems, facilities/growing areas, equipment, boundaries and exclusions | Exact selected IDs; no inferred inclusion of every area at a site |
| Ownership | Basis author/coordinator, Engineering package owner, proposed reviewer and next action | Assignment, eligibility and technical authority are separate |
| Source basis | Survey snapshot, commercial scope, client requirements, existing drawings and supplier evidence | Exact version, date, availability and applicability shown for each reference |
| Limitations | Missing input, excluded responsibility, conditional assumption and unassessed impact | Every material gap has an owner or an explicit owner-needed state |
| Dates | Required basis date, review due date, source-as-at and next-action date | Store distinct dates; missing values do not become overdue or default to today |
| Review scope | Selected purpose, applicable revision, reviewer policy and review basis | Not configured remains visible when operational authority is unknown |

Scope changes must present the affected requirements, assumptions, interfaces and evidence before saving. Removing an area must not silently orphan records or erase their history. Draft records can be reassigned deliberately; submitted records require a successor.

A basis spanning several areas at one site is supported. A cross-site requirement or shared service must identify both site contexts and be explicitly reviewed; the first HTML can demonstrate a refusal with an owned follow-up rather than invent multi-site authority.

Use distinct relationship labels: **installed at**, **serves**, **controls**, **measures** and **applies to**. A pump serving three areas remains one asset. A controller programme or valve number is an external/local reference, not the growing area’s identity. [S02, S07]

## 9. Requirements register

Each requirement should be concise enough to review and precise enough to trace. Avoid combining unrelated obligations into a single long text field.

| Field | Required treatment |
|---|---|
| Local identity and title | Stable UUID and readable package-local label; retain predecessor/successor links |
| Requirement statement | Plain-language outcome; separate rationale and source quotation/summary |
| Type | Proposed categories such as Functional, Performance, Interface, Site constraint, Documentation or Verification |
| Origin | Customer statement, contractual source, survey evidence, supplier source or Engineering-derived proposal |
| Source reference | Exact document/observation revision and location; author/observed date where available |
| Applicability | Site, facility/area, equipment and system scope; explicit inclusions/exclusions |
| Owner | Responsible Engineering owner; separate source owner where needed |
| Acceptance criterion | Supplied measurable criterion or a reason that it is not yet defined |
| Verification method | Review, inspection, calculation/model reference or future test, with its own evidence state |
| Dependencies | Related assumptions, interfaces, calculation inputs and deliverable references |
| Decision history | Proposed interpretation, finding, response, accepted revision, rationale and actor |
| Use status | Current draft, included in reviewed basis, changed/needs reassessment or superseded |

An origin labelled “Customer statement” is not proof of performance. An Engineering-derived requirement must show its rationale and review. A cited standard should retain title, edition and relevant reference when supplied; the prototype must not invent a standard, clause or compliance conclusion.

The register should support keyword search and filters for type, owner, area, source readiness, review state and affected deliverable. Selecting a row opens its snapshot with **Open full detail** for editing/review.

Validation should identify missing acceptance criteria without preventing draft capture. Positive basis review is refused where a criterion is required for the selected purpose but remains undefined. A requirement can be excluded from the current reviewed scope only through a visible reason and retained scope record; filtering it out does not exclude it.

## 10. Assumptions and technical questions

Use a common worklist for navigation, with distinct typed records and distinct state meanings.

| Record type | Purpose | Additional fields |
|---|---|---|
| Assumption | A proposition currently used in design work but not established | Basis for use, validation method, owner, due date, consequence if wrong, validity/review trigger and affected work |
| Constraint | A supplied boundary or limitation | Source, applicability, effective period where relevant and change authority |
| Technical question | Information or a decision needed from a named source | Question, required respondent, requested-by date, related requirement/interface, response and review |
| Basis decision | An attributable Engineering interpretation or disposition | Exact input revision, rationale, decision scope, actor and resulting links |

Assumption states should distinguish Open, Validation in progress, Supported, Rejected, No longer applicable and Superseded. “Supported” records the accepted evidence for that exact assumption; it does not assert universal truth or grant authority outside its scope.

A question can be Draft, Prepared for owner, Awaiting response, Response received, Response accepted or Closed with reason in the demonstration. Receiving a response and accepting its technical adequacy are different actions. External sending remains outside the file.

### Working rules

- Every assumption used by a requirement or calculation must be visible in that dependency chain.
- A blocking assumption needs resolution before positive review for the affected purpose.
- A non-blocking assumption can remain in a reviewed basis only under an explicit illustrative policy, with owner, limitation, validation plan and due-date state.
- Missing policy is **Not configured**, not permission to accept a risk.
- A rejected assumption identifies affected requirements, interfaces and calculation references; the system does not silently rewrite them.
- A late answer is linked to the original question and compared with the basis already used.
- A question prepared for EN-04 carries an exact reference and receiving owner; EN-02 does not create a parallel full RFI register.
- Closing with “No longer applicable” requires evidence or a scope decision; it must not conceal an unresolved obligation.

An action card should make the next meaningful activity clear: Obtain source evidence, Review response or Reassess affected requirement. Rescheduling keeps the action identity and does not record a technical outcome.

## 11. Interface register and responsibility matrix

An interface represents an explicit boundary between systems, disciplines or responsible parties. It is not merely a pair of tags.

### Interface content

| Group | Fields and behaviour |
|---|---|
| Identity and boundary | Stable identity; title; boundary description; interface category; revision |
| Physical and functional scope | Exact site/areas/assets, location, connection point and system/function |
| Provider side | Responsible party/discipline, accountable owner, required input/output and supplied evidence |
| Receiver side | Responsible party/discipline, accountable owner, expected input/output and acceptance evidence |
| Engineering basis | Related requirements, assumptions, calculation/model references and exact drawings/documents |
| Technical properties | Typed property, value state, unit, source and applicable version; no unsourced default rating or tolerance |
| Acceptance | Agreed criterion/method, required confirmations, review purpose and outstanding findings |
| Timing | Input-needed date, response due date, validity/review trigger and downstream dependency |
| Outcome | Draft, awaiting evidence, awaiting confirmation, agreed for the stated basis, disputed, changed or superseded |
| History | Earlier versions, both parties’ confirmations, changed fields and follow-up |

Categories can cover mechanical connection, electrical supply, hydraulic/process flow, controls/signals, data/protocol, structural attachment and utility/service boundaries. These are proposed interface categories, separate from the current Engineering discipline enum.

For example, a system may be called “Climate” while its responsible disciplines remain Controls, Electrical and Mechanical. Do not add Climate or Lighting to the runtime enum as an incidental UI choice. [S10]

### Two-sided agreement

A provider confirmation and receiver confirmation must bind the same interface revision and evidence basis. Where the fixture policy requires a separate reviewer, that review is a third record. A confirmation is refused if the person is ineligible for the specified responsibility, the evidence changed, required information is missing or the agreement is disputed.

Changing a material field creates a successor and makes previous confirmations historical. It must not retain an “Agreed” label for the new content. A party can withdraw its current confirmation with a reason; prior evidence remains.

If one person represents both sides in a fixture, display that fact. The demonstration policy should require independent review for its positive result; it must not invent a company-wide prohibition or authority rule.

### Register and matrix

The default is a readable register with boundary, provider, receiver, owner, status, next input and due date. An optional matrix shows discipline pairs or package/system boundaries. Each matrix cell opens the underlying interfaces; counts and state badges are derived from the same filtered records.

The matrix is a navigation aid, not a schematic, wiring diagram or live-control map. On phones, use interface cards with the two sides labelled explicitly. Blank cells mean no recorded interface in the current scope, not proof that no interface is required.

## 12. Calculations, models and source evidence

EN-02 should register the evidence needed to understand the design basis. It should not become a replacement for native engineering tools or ES-08’s governed specialist calculation family.

| Record area | Required information |
|---|---|
| Reference identity | Calculation/model UUID, title, source identifier, exact source version and engineering revision where applicable |
| Purpose and scope | Design question addressed; site/area/equipment applicability; linked requirement |
| Authoring context | Tool name and version when known; author; preparation date; source owner |
| Inputs | Exact basis revision, requirement/assumption/input references, units and source dates |
| Outputs | Referenced result, conclusion and limitations; unavailable results remain unavailable |
| Method evidence | Supplied method/formula/standard reference and its version; unknown is explicit |
| Check evidence | Checker, scope, date, outcome, findings and exact checked content |
| Deliverable links | Drawing, material or verification references that consume the result |
| Availability | Available, unavailable, restricted, unsupported preview or integrity mismatch |
| Reassessment | Trigger, affected inputs, owner and resolution evidence |

Source **file version**, **engineering revision**, **design-basis revision**, **software version** and **review state** are separate fields. Do not store them in a single “Version” string.

A reviewed source can still be inapplicable to this equipment model, firmware, site or intended use. Applicability and availability must be evaluated separately from source review.

### Preview and attachment limits

Use embedded synthetic text, tables and static drawing extracts that can be verified. A native CAD file can have metadata and an **Open source** reference, but the HTML must not claim to render, traverse or preserve its assembly dependencies.

For r01, prefer a bounded embedded evidence catalogue to unrestricted file import. A future upload feature needs an explicit supported-format, size, integrity and active-content contract. Safe source references should reject active URL schemes and must not fetch arbitrary content automatically.

Where exact bytes are available, compute their actual content hash during packaging. Where only a link or metadata is known, show **Exact content not retained**. Never generate a hash-looking value to imply evidence that the prototype does not possess.

A newer source revision should appear as an available successor with a comparison/review action. It must not replace the source already bound to a submission, calculation check or handover.

## 13. Review, revisions and handover

### Submission and review

The user submits an immutable snapshot containing the basis scope, included records, exact evidence references, input dependencies and current policy/profile used by the demonstration. Store author, submission time and fingerprint.

A reviewer sees:

- Stated review purpose and exact applicable scope.
- Sources and their availability/applicability.
- Blocking findings and unresolved non-blocking limitations.
- Requirements without sufficient criteria or evidence.
- Assumptions awaiting validation.
- Interfaces missing ownership, response or matching confirmations.
- Calculation/model checks and changed inputs.
- What changed since the previous submitted revision.

The review outcome is **Return for correction** or **Reviewed for the stated purpose**. A missing operational reviewer rule is shown as Not configured. The local fixture policy can demonstrate a permitted outcome while remaining explicitly fictional.

Returned findings have a record target, severity/impact description, owner, response and reviewer acceptance. A response alone does not close a finding. The corrected content is a successor snapshot; the reviewer’s original decision and the returned bytes remain intact.

### Reviewed basis and current eligibility

A positive review is an immutable historical fact about exact content. Current-use eligibility is a separate assessment that can become Needs reassessment, Unavailable or Held when sources, scope, permissions or policy change.

This distinction avoids two failures: rewriting history to erase a valid earlier review, and presenting that review as authority to use changed content.

“Reviewed for detailed-design preparation” must never be displayed as “Released for construction”, “Approved for procurement” or “Safe to operate”. EN-03/EN-05 retain formal technical-release responsibility. [S03, S04, S08]

### Receiving pack

The first handover should target the future drawing/technical-review workflow and contain:

| Payload area | Exact retained content |
|---|---|
| Source | Basis identity/revision, submission and review IDs, content fingerprint and purpose |
| Context | Package, Project/Opportunity, company, organisation, site and scope identities |
| Requirements | Included requirement revisions and verification criteria |
| Interfaces | Included interface revisions, required parties, agreement evidence and unresolved boundaries |
| Evidence | Exact survey, drawing, calculation/model and source references with availability |
| Limitations | Exclusions, accepted non-blocking assumptions, unresolved questions and permitted-use limits |
| Receiving work | Required deliverable references/types, receiving owner and next action |
| Recovery | Original operation identity, prepared time, simulation outcome and linked receipt |

Prepared, receiving outcome unknown and receiving preview accepted/returned must remain distinct. Retry uses the same operation identity and payload; changed content requires a new operation and normally a new reviewed basis.

The receiving simulation records its own outcome. It cannot create real drawings, change a Project, send a message or mark another module’s work complete.

## 14. Traceability and change assessment

The plan requires explicit directed links, not inferred relationships from matching names.

A source observation can support several requirements. A requirement can depend on multiple assumptions and be realised through several interfaces and calculations. A deliverable can consume several requirements. These are many-to-many relationships with clear link types.

| Change | EN-02 response |
|---|---|
| Survey observation corrected | Retain the old observation reference; show related requirements/assumptions and request reassessment |
| Customer requirement revised | Preserve the earlier commercial/source version; review the new interpretation and affected records |
| Interface property changed | Create a successor; invalidate current applicability of prior confirmations for that successor |
| Calculation input revised | Mark dependent result/check as needing reassessment; do not recalculate or claim a new result |
| New drawing/model revision available | Show availability of the successor and compare selected metadata/evidence; no automatic substitution |
| Growing-area scope changed | Identify included records whose applicability changed and require deliberate disposition |
| Installed configuration changed | Distinguish historical basis from the current equipment context and prepare Engineering review |
| Downstream deliverable already issued | Preserve issued information; prepare a change-impact request for EN-07 and the owning domain |
| Impact source partly unavailable | Label the assessment incomplete; show known links and an owner for the missing assessment |

The comparison should identify Added, Removed, Changed and Unchanged records, then show field-level differences with clear old/new labels. Removed means removed from the successor’s scope, not erased from history.

Traversal must avoid cycles and duplicate effects. It should distinguish **directly linked**, **indirectly linked** and **not yet assessed**. An empty query against incomplete source data is not “No impact”. The HTML should not estimate engineering cost or programme delay without a supplied reviewed basis.

A compact relationship view can complement the tables, with a fully equivalent accessible list. The default should remain useful without dragging a graph.

## 15. Information model and identity

The following are proposed typed design records, not an adopted database migration or API schema.

| Type | Key fields and relationships |
|---|---|
| `DesignBasis` | `id`, `engineering_package_id`, `company_id`, `context_id`, `current_draft_version`, `current_reviewed_revision_id` |
| `DesignBasisRevision` | `id`, `basis_id`, `revision_label`, `predecessor_id`, scope IDs, purpose, exclusions, author and snapshot fingerprint |
| `DesignRequirement` | Identity, type, statement, rationale, applicability, owner, acceptance criterion, verification method and source links |
| `BasisAssumption` | Identity, proposition, evidence state, owner, validation plan, consequence, due-date state and disposition |
| `TechnicalQuestion` | Question, required respondent, target record, response revision, reviewer acceptance and prepared EN-04 reference |
| `DesignInterface` | Boundary, provider/receiver responsibilities, applicable entities, typed properties, required evidence and version |
| `InterfaceConfirmation` | Party/role, exact interface revision, evidence fingerprint, actor, decision and timestamp |
| `CalculationReference` | Source identity/version, engineering revision, tool metadata, exact input basis, output reference and check evidence |
| `SourceReference` | Provider/company/entity identity, file/version or observation identity, content hash when known, location, availability and source-as-at |
| `BasisLink` | Typed from/to IDs and revisions, relationship purpose, author and effective/supersession history |
| `BasisSubmission` | Immutable content snapshot, manifest, policy/profile version and submitted actor/time |
| `BasisReview` | Exact submission, purpose, reviewer, findings, decision, rationale and limitations |
| `BasisHandover` | Exact reviewed revision, receiving domain/owner, original operation, retained payload and outcome |
| `BasisEvent` | Attributable change/decision, target, before/after versions, reason, time and related operation |

Use snake_case fields, PascalCase types and stable UUIDs in line with PPO-STD-001. Human-readable fixture references should use the adopted SYN-PPO convention; any new readable record-type allocation requires a deliberate naming decision. Do not treat labels such as “Interface 03” as global keys. [S12, S13]

Dates need clear semantics: a calendar due date, evidence capture time, source observation time, submission time and review time serve different purposes. Store instants consistently and display the relevant named timezone. Use an explicit demonstration clock for repeatable overdue scenarios.

Numeric properties need quantity/value state and unit. Unknown, Not applicable and Zero are separate. Unit mismatch blocks comparison unless a supported, explicit conversion with retained original values is supplied. The first build need not perform conversions.

## 16. States, commands and validation

The runtime package’s coordination state remains unchanged. The following are proposed EN-02 states.

| State family | Proposed values | Meaning |
|---|---|---|
| Draft lifecycle | Draft, Submitted, Returned, Reviewed, Superseded, Withdrawn | Basis revision lifecycle; older snapshots retained |
| Current eligibility | Not assessed, Eligible for stated purpose, Needs reassessment, Held | Whether an exact reviewed basis can currently support a specified next step |
| Evidence read | Loading, Complete, Partial, Unavailable, Restricted | Completeness/availability of a source read |
| Local save | Unsaved, Saving, Saved in this browser, Save failed, Conflict | Browser persistence only |
| Handover | Prepared, Outcome unknown, Preview accepted, Preview returned, Superseded | Labelled receiving simulation; no external transmission implied |

### Command rules

| Command | Preconditions | Result and refusal behaviour |
|---|---|---|
| Save draft | Editable local role; expected current version; valid identity/scope references | Save a successor draft version; preserve input on failure/conflict |
| Add/edit requirement | Draft/returned working copy; permitted source context | Validate fields and links; never edit a submitted snapshot |
| Record assumption response | Exact assumption/question and response source | Append response; independent acceptance remains separate |
| Confirm interface | Eligible fixture role, current interface revision, required evidence complete | Store exact confirmation; refuse stale/disputed/incomplete agreement |
| Submit basis | Required context, readable included evidence, all material gaps classified and owned | Freeze snapshot; unresolved blocking items can be exposed for review but prevent positive review |
| Return review | Exact current submission and reviewer authority in the fixture | Retain findings and reason; create editable successor workflow |
| Record positive review | Required findings accepted; blocking gaps resolved; compatible purpose; exact current evidence/policy; independent reviewer where fixture requires it | Immutable purpose-bound review; missing policy refuses the action |
| Prepare handover | Reviewed exact basis; current eligibility established; receiver and obligations specified | Freeze payload and original operation; no remote action |
| Reconcile simulation | Original operation and unchanged payload; current permitted visibility | Recover original outcome without duplicate effect |
| Start successor | Existing basis and reason; source snapshot available | New draft retains predecessor and links; no inherited review/confirmation |
| Withdraw current use | Appropriate fixture authority and reason | Retain history, revoke current-use indication and create owned follow-up |

Required cross-record checks include referential integrity, company/site scope, record version, source version, purpose compatibility, source availability, duplicate original operations, orphaned references and current actor eligibility. UI disabling supplements the model guard; it is not the guard itself.

## 17. Roles and information access

All role profiles in the standalone HTML are demonstration controls. Embedded synthetic fixtures are inspectable by anyone holding the file. UI filtering cannot protect real operational or personal information.

| Proposed demonstration role | Permitted behaviour | Boundary |
|---|---|---|
| Basis author | Edit drafts, link evidence, prepare questions and submit | Cannot independently accept their own review where the fixture requires separation |
| Discipline/interface owner | Provide input, respond and confirm their exact interface responsibility | Cannot confirm another party’s duty without an explicit demonstrated delegation |
| Basis reviewer | Inspect exact submissions, return findings and record purpose-bound review | Requires configured fixture scope; no automatic installation or procurement authority |
| Project coordinator | Inspect readiness, own coordination actions and receive a prepared reference | No implicit technical approval from project ownership |
| Observer | Read permitted fixture records/history | No commands; restricted detail and counts withheld in the simulated view |
| Recovery reviewer | Inspect original operation and resolve a simulated uncertain outcome | Recovery does not bypass source visibility or grant missing review authority |

The eventual server implementation must extend current engineering.read/create/edit contracts deliberately. Those existing capabilities do not establish basis-review, interface-agreement or formal-issue authority. New capability names and delegation rules should be adopted in the receiving implementation contract, not presented as existing permissions. [S04, S10, S11]

Scope applies to lists, selectors, snapshots, comparison, exports, counts and original-operation receipts. A role/context change clears restricted cached selections and unsent command context. User-entered text must render safely as text.

## 18. Synthetic examples

| Fixture | Purpose | Required distinctions |
|---|---|---|
| A — Willowbank irrigation/control basis | Primary end-to-end journey using CS-08 lineage | One shed-mounted pump; several served areas; reviewed survey with remaining unknowns; Hydraulics–Controls interface; corrected evidence |
| B — Nursery screen/lighting coordination | Mechanical, Electrical and Controls boundary example | Supplier mounting/power requirements remain sourced; unsupported compatibility is unknown; no invented screen or lighting calculation |
| C — Berry-site controls upgrade | Existing equipment/configuration context | Firmware/protocol source applicability, existing versus proposed configuration, access/shutdown constraints and a future commissioning reference |
| D — Changed-source successor | Reassessment after a reviewed basis | Earlier review retained; changed inputs identify affected interfaces/calculations/deliverables |
| E — Incomplete/restricted evidence | Honest readiness and access behaviour | Unknown count, exact unavailable historical reference, partial source and missing reviewer policy |

Use fictional organisations, people, dates and technical evidence. Any reused fixture identity must be copied from the inspected source package and recorded in the source manifest. A new narrative must not silently overwrite the meaning of an existing synthetic asset.

The r01 fixture set should contain enough records to show each type and exception, without padding the table with meaningless duplicates. Suggested bounded seed: three packages, approximately 12 requirements, six assumptions/questions, eight interfaces and six calculation/source records. These are implementation targets, not claims about existing data.

No technical numerical example should be presented as a supplier recommendation, approved equipment rating or valid design limit. Missing flow, electrical capacity, structural suitability or software compatibility should remain unresolved until the demonstration supplies clearly fictional evidence.

## 19. Visual design and accessibility

### Theme and layout

Use the accepted Engineering lineage with current r22 control guidance: embedded Roboto where licensed/source-provided, Verdana fallback, PPO navy `#242a37`, green `#62bb46` accents, neutral work surfaces and the existing outline icon family. Primary actions use navy with white text.

Provide one workspace content surface with deliberate gutters. Avoid successive bordered “container inside container” frames. The shared shell owns rail, logo, global search and user controls; the standalone review file should contain the module interior and a small synthetic-context note. [S05, S09, S14]

Use a modeless right-side snapshot for ordinary record/source inspection, with Close and Open full detail. Reserve centred dialogs for short decisions, reasons and confirmations. A modal phone detail must have a named dialog, controlled focus, inactive background and predictable return.

### Selected-state choices

| Interaction | Proposed r22 treatment | Required semantics |
|---|---|---|
| Six package content views | Tab into the panel, adapted to the available width | Real tabs with a labelled associated panel; one selected panel; keyboard movement |
| Interface register / matrix | Compact segmented control | Exclusive view choice; no unrelated business-state meaning |
| Optional summary filters | Restrained Ring and lift if tiles add value | Selection distinct from focus; selected state does not imply approval |
| Prominent two-choice comparison | Inverted fill only where necessary | Small exclusive choice set; white text and persistent selection cue |
| Independent filters | Plain toggles or the r22 recessed treatment | Explicit AND/OR rules; overlapping counts not summed |

Do not demonstrate every visual pattern on the same screen merely because it exists in the board. Geometry should remain stable when selected, focused or hovered. Green accents must not become a generic “safe/approved” signal.

### Responsive and accessible behaviour

- Review at 1440, 1024, 768, 390 and 320 px, plus short viewports and 200% zoom.
- Keep the six tabs in a labelled horizontally scrollable strip or provide an equivalent compact navigation control; avoid clipped active tabs.
- Convert wide requirement/interface rows to labelled cards. Preserve provider/receiver and old/new labels.
- Confine necessary table/matrix scrolling to its own named region; avoid whole-page horizontal overflow.
- Use readable phone form text, persistent labels, associated help/errors and adequate touch targets.
- Preserve filters, selected record, scroll position and draft input when opening evidence and returning.
- Provide visible focus, keyboard alternatives to resizing and graph/matrix navigation, Escape/Close behaviour and focus restoration.
- Announce saves, validation errors, changed sources and count updates without excessive live-region repetition.
- Distinguish unavailable, missing, not applicable and zero in text; do not rely on colour or icons alone.
- Respect reduced motion and test long references, long organisation names, error summaries and the last form field.

The theme sections were inspected as source content during planning. No rendered EN-02 visual review is claimed.

## 20. Persistence and recovery

Use a versioned EN-02-specific local state envelope for the synthetic HTML. Persist draft records, exact submissions, reviews, interface confirmations, handovers and the original-operation ledger. Keep filter/view preferences separately where practical.

| Situation | Required behaviour |
|---|---|
| Unsaved draft | Visible unsaved state; explicit save/discard before leaving material edits |
| Successful local save | “Saved in this browser” only after persistence succeeds |
| Failed save/quota | Retain visible input; show failure and retry/export options; do not advance a material command twice |
| Stale tab/version | Refuse overwrite, retain local edits and offer comparison/reload |
| Simultaneous browser writes | Detect known conflicts; disclose that localStorage is not a server transaction/lock |
| Invalid schema/corrupt saved state | Pause writes, preserve recoverable original bytes and provide deliberate module-scoped reset |
| Exact source unavailable | Retain identity/revision, limitation and owner; no latest-version substitution |
| Source returns partial data | Show known data, completeness and time; never display a failed count as zero |
| Review interrupted | Resume against the same submission; no duplicate decision |
| Handover result unknown | Reconcile the original operation before allowing a replacement |
| Changed original retry | Refuse operation-ID reuse with different content |
| Access/role changed | Clear forbidden visible context and revalidate commands and exports |
| Reset demonstration | Confirm and reset only EN-02 state; preserve other modules’ browser storage |

For r01, offer a permitted JSON review export and a print-friendly basis summary. Treat exported copies as synthetic review artifacts, not authoritative technical issues. General backup import and merge can be deferred; avoid adding an unsafe restore path simply for convenience.

The print summary should identify exact basis revision, purpose, scope, source-as-at, unresolved limitations, review status and included records. A draft must remain prominently Draft in both browser and print/export.

The future application must keep operational evidence, authority and original receipts on the server. A standalone local save does not establish durable offline operation, multi-user integrity or production security.

## 21. Technical construction and package

### Construction approach

Build a self-contained HTML review artifact with embedded CSS, JavaScript, approved font assets and synthetic fixtures, using the existing repository’s design-builder approach. Use separated maintainable sources and deterministic assembly where available.

Keep domain records, validation, commands, projections and rendering separable. Derive counts and readiness from the same records used by the detail views. Do not maintain hand-edited duplicate counters or a second hidden dataset for the matrix.

No new framework is required for this standalone package. Later application work should follow the existing TypeScript/Next.js modular monolith, PostgreSQL, domain services, scoped server permissions, durable receipts/outbox and replaceable adapters. No service split, new database or dependency upgrade is proposed. [S11]

### Proposed package paths

These are planned destinations, not files created by this planning task.

| Deliverable | Proposed path/name |
|---|---|
| Issued standalone HTML | `docs/reference/ui/engineering-basis/PPO-Design-Basis-and-Interface-Register-r01.html` |
| Detailed delivered-feature report | `docs/reference/ui/engineering-basis/PPO-Design-Basis-and-Interface-Register-Report-r01.md` |
| Maintained build plan | `docs/delivery/design-basis-interface-register-build-plan.md` |
| Design and receiving handover | `docs/decisions/design-basis-interface-register-design.md` |
| Maintainable source package | `docs/design/engineering-basis/` |
| Verification evidence | `docs/testing/evidence/engineering-basis-r01/` |
| Builder/check entry points | Follow established repository naming after inspecting the current builders; do not duplicate an existing script |

The source manifest should record reused files/editions, exact source commits, generated HTML hash, embedded evidence hashes where available and any source not retained. Preserve accepted Engineering r02 and issued theme/document files unchanged.

On future repository delivery, update the latest-family design index, affected document register and concise STATUS entry in the same branch. Link PPO-011 and retain the explicit limits. A plan alone does not warrant marking EN-02 implemented.

### Detailed companion report requirement

The eventual companion report should describe the delivered screens, every meaningful command, field catalogue, state rules, scenarios, source reuse, handovers, responsive behaviour, data persistence, recovery, exact verification results and remaining work. It must be written against the completed HTML, distinguishing implemented, simulated and deferred features.

This build plan is not that delivered-feature report. Future results must replace planned assertions with actual evidence rather than copying this plan’s test matrix as though it passed.

## 22. Build sequence

| Stage | Work | Exit condition |
|---:|---|---|
| 1 | Refresh main/open PRs; confirm EN-02 scope, current theme and package conventions; capture source manifest | No competing package or unacknowledged baseline contradiction |
| 2 | Define typed records, source fixtures, links, policies and state transitions | Main journey and exception cases can be represented without overloaded states |
| 3 | Implement commands, revision snapshots, readiness projection, comparison and original-operation ledger | Focused model checks demonstrate immutability, scope validation, stale rejection and retry behaviour |
| 4 | Build Basis & scope, Requirements and Assumptions & questions | A user can prepare a sourced draft and navigate gaps without losing input |
| 5 | Build Interfaces and Calculations & sources | Two-sided responsibilities, source applicability and exact input-basis links are usable |
| 6 | Build Review & handover, history and changed-source assessment | Full submit → return → correct → review → prepare → recover → reassess journey works |
| 7 | Apply r22 components, responsive treatment, keyboard behaviour, recovery and exports | All planned surfaces remain usable across the agreed viewports |
| 8 | Run meaningful model/browser checks and inspect original captures; fix observed defects | Evidence records exact source, runtime, assertions and remaining limits |
| 9 | Write the delivered-feature report and handover; update repository navigation | Report matches observed HTML and preserves future receiving boundaries |
| 10 | Publish the reviewable package within the authorised scope | HTML/report/evidence are available; owner acceptance and application integration remain separately stated |

The minimum coherent build is the complete primary journey across all six views. Optional matrix polish, relationship graphics and extra fixture families follow only after that journey and its failure states are dependable.

Do not make UI work wait for live MYOB, SharePoint or CAD access. Those are future receiving obligations; clearly synthetic source adapters are sufficient for the authorised standalone design.

## 23. Planned verification and acceptance

**All EN-02 tests below are planned and unexecuted in this planning task.** The local labels are package test references; they do not replace existing acceptance IDs.

| Test | Scenario | Required observable result |
|---|---|---|
| EN02-T01 | Open package from Project and Opportunity examples | Exact context retained; no inference that an Opportunity is awarded work |
| EN02-T02 | Inspect a shed-mounted asset serving several areas | One asset identity; installed and served relationships remain distinct |
| EN02-T03 | Select an out-of-scope site/area reference | Clear refusal or explicitly supported reviewed relation; no silent cross-site assignment |
| EN02-T04 | Derive a requirement from a customer statement | Source type and exact revision retained; statement not promoted to measured fact |
| EN02-T05 | Remove required criterion/source in a draft | Draft can be retained; readiness explains the affected positive-review refusal |
| EN02-T06 | Enter unknown, zero and not-applicable numeric properties | Distinct values and labels survive reload/export |
| EN02-T07 | Compare incompatible units | Comparison refused without an explicit supported conversion |
| EN02-T08 | Leave a material assumption unowned | Submission/readiness identifies the owner-needed gap |
| EN02-T09 | Reject an assumption used by several records | All known affected references appear once; no silent recalculation |
| EN02-T10 | Receive then accept a question response | Receipt and technical acceptance remain separate attributable events |
| EN02-T11 | Confirm only one side of an interface | Agreement remains incomplete where both sides are required |
| EN02-T12 | Change an interface after confirmation | Successor needs fresh confirmation; earlier confirmation remains historical |
| EN02-T13 | Use one actor on both sides under the demonstration policy | Independent review requirement and actor context are explicit |
| EN02-T14 | Open a calculation with changed input basis | Prior result/check visible with Needs reassessment; no invented fresh result |
| EN02-T15 | Open unavailable/restricted historical source | Exact reference and limitation retained; no substitution or leaked content/count |
| EN02-T16 | Submit and attempt to edit its frozen snapshot | Mutation refused; correction uses a successor |
| EN02-T17 | Author attempts prohibited self-review | Model refuses; permitted reviewer can continue against the same exact submission |
| EN02-T18 | Reviewer responds to an unresolved blocking finding | Positive review refused until response acceptance/resolution is recorded |
| EN02-T19 | Review with a permitted non-blocking assumption | Purpose, limitation, owner and validation plan remain visible in handover/export |
| EN02-T20 | Reviewer policy is not configured | No permissive fallback; owned next action explains the missing rule |
| EN02-T21 | Source/policy changes while review form is open | Stale decision refused and reviewer input retained for comparison |
| EN02-T22 | Prepare exact handover, lose simulated response, retry | Original outcome recovered; one receiving effect and identical payload |
| EN02-T23 | Reuse an operation ID with changed content | Conflict; original receipt and content unchanged |
| EN02-T24 | Change source after reviewed handover | Review history retained; current eligibility and affected receiving work reassessed |
| EN02-T25 | Remove a scoped area with linked records | Impact shown; no orphan or historical deletion |
| EN02-T26 | Traverse indirect/cyclic dependencies | No infinite loop, duplicate effects or unsupported no-impact conclusion |
| EN02-T27 | Failed/partial source read | Last known context and completeness visible; failure not reported as zero records |
| EN02-T28 | Local save fails, stale tab saves or state is corrupt | Edits/original state preserved; conflict/recovery path honest; no duplicate command |
| EN02-T29 | Switch role/context and export | Visible, comparison and export data respect the same simulated scope |
| EN02-T30 | Enter markup/active URL content | Safe text rendering and URL refusal; no script execution or unintended fetch |
| EN02-T31 | Keyboard-only full journey | Tabs, filters, source panels, forms, review and recovery reachable with correct focus |
| EN02-T32 | Desktop/tablet/phone/320 px and 200% zoom | No unintended page overflow; labels, actions and final fields reachable |
| EN02-T33 | Print/export Draft, Reviewed and Superseded bases | Exact identity/purpose/status/limitations preserved; no false issue claim |
| EN02-T34 | Rebuild the standalone artifact | Deterministic output matches manifest; report and fixture references resolve |

### Verification methods

Use focused model tests for business invariants and native browser journeys for interaction, persistence, focus, downloads and real layout. DOM-only checks can support the work but cannot establish geometry, keyboard focus correctness or visual acceptance.

Inspect original captures of all six views at desktop and phone widths, plus a two-sided interface, a returned finding, old/new comparison, unavailable source, save conflict and unknown-handover recovery. Record browser/page errors and fix observed defects before recapturing.

Run the repository’s applicable assurance commands when the package is added:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
git diff --check
```

Use runtime/dependency pins from the refreshed build commit. Record any substitute runtime explicitly. Documentation checks do not prove server permissions, technical correctness, accessibility conformance or operational acceptance. Broader application tests become necessary when application code changes or an identified shared-asset risk requires them.

### Owner review walkthrough

Dean should be able to complete the primary journey without developer explanation, identify why an item is held, distinguish both interface responsibilities, explain the scope of the review and find what changed after the later source revision.

Acceptance of this HTML should be recorded against its exact revision and reviewed device scope. It does not close AT-15 or AT-37: those procedures cover a broader engineering release/change lifecycle. [S03, S06]

## 24. Open decisions and later implementation

| Decision | Working treatment for HTML r01 | Evidence needed for operational implementation |
|---|---|---|
| Technical review and delegated authority | Clearly fictional reviewer profiles; missing-policy example | D-002/D-019 discipline, competence, independence and delegation rules |
| Review-purpose catalogue | Small illustrative purpose set with explicit limits | Engineering agreement on permitted uses and readiness requirements |
| Handling open assumptions | Block material unknowns for affected purpose; demonstrate one bounded non-blocking case | Adopted classification, acceptance responsibility and reassessment triggers |
| Interface responsibilities | Provider/receiver responsibilities plus independent reviewer in the chosen fixture | Actual Engineering, supplier and contractor responsibility model |
| CAD environment | Metadata and controlled published previews | SOLIDWORKS versions, assembly links, PDM/storage, licences and supported viewing under D-008 |
| Source retention | Exact embedded synthetic evidence or explicit not-retained status | SharePoint stable IDs, exact-version retrieval, retention and permission contracts |
| Requirement numbering | Package-local synthetic labels backed by UUIDs | Approved readable-reference allocation if a new business type is introduced |
| Systems and discipline taxonomy | Preserve current discipline enum; separate proposed system categories | Configuration owner and controlled vocabulary |
| Dates and overdue | Explicit demo clock, named timezone and missing-date state | Business calendar, timezone and escalation policy |
| Cross-site interfaces | Explicitly constrained fixture or refusal | Permitted multi-site relationship and access model |
| Calculation methods and standards | Register supplied references only | Competent source owners, applicable editions and reviewed methods |
| Downstream handover | Prepared pack and clearly labelled receiving simulation | EN-03/EN-05/EN-07 command, receipt and ownership contracts |
| Operational integration | Follow existing domain/server architecture in a later increment | Scoped API/data/permission changes, migrations, concurrency and original-result tests |

No consequential unresolved fact blocks preparation of the synthetic HTML. The build should represent undecided operational rules honestly rather than silently adopting company policy.

The next bounded action after this report is to build EN-02’s standalone HTML and delivered-feature Markdown report using the six-view scope above. Formal drawing/release implementation and live integration remain separate increments.

## 25. Source register and planning assurance

Repository links below are pinned to the inspected main commit unless explicitly identified otherwise. Source documents contain dated historical verification; those results have not been rerun for this plan.

| Ref | Source | Use in this plan |
|---|---|---|
| S01 | [README](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/README.md), [STATUS](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/STATUS.md) and [AGENTS](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/AGENTS.md) | Current project context, contribution discipline and bounded Engineering implementation |
| S02 | [HTML Page Coverage Register r06](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | EN-02 title, Tabs placement, P2 priority, CS-08 dependency and Engineering family mapping |
| S03 | [Master Blueprint, section 11](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/blueprints/BP-01-master-blueprint.md#11-engineering-and-design-control-capability-blueprint) | ENG-01–ENG-07, technical authority, interfaces, calculation review, AT-15/AT-37 and decision context |
| S04 | [Engineering r02 integration decision](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/decisions/engineering-r02-integration.md) and [intake handover](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/delivery/engineering-intake-handover.md) | Accepted design, implemented intake limits, source context, permissions, SOLIDWORKS/SharePoint confirmation |
| S05 | [Engineering Container r02](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/reference/ui/engineering/PPO-Engineering-Container-r02.html) and [Engineering Workflow Map r01](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/reference/ui/module-workflow-maps/PPO-Engineering-and-Design-Control-Workflow-Map-r01.html) | Existing workspace composition and target lifecycle context; map is a planning reference |
| S06 | [PPO-011 / issue #11](https://github.com/deanrfiedler-gif/powerplants-one/issues/11) | Open BP-05 technical-release scope and broader acceptance obligations; live issue inspected |
| S07 | [Site Survey & As-Found handover](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/decisions/site-survey-workspace-design.md) | Exact survey snapshots, evidence types, owned unknowns, site/asset context and receiving boundary |
| S08 | [Document Register & Linked Library handover](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/decisions/document-register-linked-library-design.md) | Exact document identity/version, applicability, history and independent source/review handling |
| S09 | [HTML module conformance](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/standards/html-module-conformance.md) | Required scope declaration, page types, reuse, shell boundary and acceptance separation |
| S10 | [Current Engineering model](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/src/engineering/model.ts) | Actual package fields, discipline enum, context kinds and coordination states |
| S11 | [BP-02 platform architecture](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/architecture/BP-02-platform-architecture.md) | Domain ownership, server permissions, expected versions, receipts/outbox and adapter boundaries |
| S12 | [PPO-STD-001 naming](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/standards/naming-conventions.md) | Stable identity, readable references, fields/types, working versus issued filenames |
| S13 | [ADR-0005 naming adoption](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/decisions/ADR-0005-project-naming-adoption.md) | Independent PPO naming and preservation of existing identities |
| S14 | User-supplied `powerplants-one-theme-style-board-r22.html`, version 2; controls and Selection & active states sections read. [Repository upload reference](https://github.com/deanrfiedler-gif/powerplants-one/blob/607eccff92f4071feb8c22d24b0a846690274155/docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html) | Current selected-state semantics and tokens; supplied source was read, not freshly rendered; byte equivalence with the upload is not asserted |
| S15 | [Current design index](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/reference/ui/README.md) and open [PR #236](https://github.com/deanrfiedler-gif/powerplants-one/pull/236) | Existing designs, adjacent packages and newer theme upload; inventory counts remain dated observations |

### Planning assurance

The report has been prepared against the EN-02 scope, existing Engineering runtime model, current authority boundaries and inspected design references. Recommendations about the six-view composition, local records, fixture policies, handover simulation and build sequence are proposals.

The planning task creates this Markdown report. It does not create or deploy the EN-02 HTML, change application permissions, introduce a migration, alter native engineering files or execute the planned acceptance matrix.

The construction handover should retain this plan as r01, record any deliberate scope changes, and report actual source/runtime evidence when the HTML is delivered.
