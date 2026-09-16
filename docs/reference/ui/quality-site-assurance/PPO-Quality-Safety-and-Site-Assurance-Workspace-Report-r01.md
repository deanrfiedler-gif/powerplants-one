---
document_id: PPO-QA-WORKSPACE-REPORT
title: Quality, Safety and Site Assurance Workspace — Detailed Design Report
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed interactive design; owner acceptance and application integration separate
source_commit: a4061c43b11d6a53604ec628cdf370ee72f54f7a
---

# Quality, Safety & Site Assurance

## Detailed workspace design report · r01

| Document control | Detail |
|---|---|
| Product | Powerplants One |
| Companion workspace | [PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html](PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html) |
| Design owner | Dean Fiedler |
| Primary users | Service coordinator, assigned technician and Assurance reviewer |
| Demonstration date | 16 September 2026; deliberately fixed for due-date and source-validity examples |
| Source baseline | Repository `main` at `a4061c43b11d6a53604ec628cdf370ee72f54f7a` |
| Visual reference | Powerplants One theme/style board r20 |
| Deliverables | Self-contained interactive HTML and this detailed companion Markdown report |
| Status | Proposed design. Repository publication, browser verification, owner acceptance and application integration are separate outcomes. |

## 1. Purpose and executive assessment

The workspace answers three connected questions: **Is this work ready to proceed? What evidence needs review? What must be corrected before release?** It gives coordinators, technicians and reviewers a shared view of the exact work package, equipment, growing-area context, applicable sources, submitted evidence, unresolved work and release boundary.

The design extends the inspection and retest concepts in Equipment & Installed Base r02. It retains the same Northbank fertigation equipment identity, work-order reference, installed location and served growing area. It adds a shared assurance review experience, connected to Work Orders, Field Technicians, Service Review and Project Readiness.

The principal demonstration starts with an unconfirmed access source. The coordinator records confirmation evidence. The technician acknowledges preparation and submits a failed pressure check. The reviewer returns it; the technician records corrective work and a passing retest. Reviewer acceptance closes the linked defect. A separate release decision records the exact scope, exclusions and remaining OEM action. The release then supports a locally prepared receiving handover.

All organisations, people, events, operational evidence and criteria are fictional. The interface demonstrates work coordination and evidence control. Its checklists do not establish real site permission, technical compliance or operational authority.

## 2. Package contents and how to open it

| Component | Included behaviour |
|---|---|
| Six connected views | Overview; Site readiness; Inspections; Defects & retests; Incidents & actions; Review & release |
| Three work packages | Northbank fertigation, Greenhaven ventilation and Cedar Vale lighting |
| Shared context | Organisation, site, installed area, served area, equipment, work order, scope revision and state |
| Editable demonstrations | Source confirmation, acknowledgement, draft, image evidence, submission, correction, retest, review, event, action and release |
| Record inspection | Equipment/work snapshots, readiness-source details and exact submitted-source snapshots |
| Retained history | Original submissions, corrections, review reasons, owners, due dates, decisions and release history |
| Resilience | Browser persistence, JSON export/restore, damaged-session recovery, failed-save and lost-response scenarios, concurrent-tab protection |
| Receiving handover | Local preparation for Service Review or Project Readiness, tied to an exact release |
| Reproducible source | Model, UI, CSS, fonts and template assembled by a repository build script |
| Verification | Focused model suite and native Chrome workflow, with results linked in the handover |

Download the companion HTML and open it in a modern desktop browser. The file embeds its fonts, styling, script and demonstration data; an application server is unnecessary. Browser storage availability determines whether local work survives closing the browser. Export the session when the file reports Session only.

Reference buttons need internet access and open existing GitHub design sources. Independent HTML files keep separate demonstration sessions; a reference link does not synchronise or update another module.

## 3. Information architecture and context

The unit of assurance is a **work package within an existing work order and scope revision**. It is not a second equipment master or replacement project record.

| Information | Purpose and treatment |
|---|---|
| Package ID/reference | Distinguishes a local review package. `SYN-QA-*` values are fixture aids, not a newly adopted production numbering policy. |
| Organisation and site | Identifies the customer and operating location. |
| Installed area | Identifies the actual equipment location used by the inspection. |
| Served growing area | Distinguishes the equipment location from the crop area it serves. |
| Equipment alias, reference and UUID | Reuses the Equipment design’s identity; a serial alone is not a reliable unique key. |
| Serial and configuration revision | Supports physical identification and inspection of the tested configuration. |
| Work order and scope revision | Binds evidence and release to the intended work. |
| Scope and exclusions | States the acceptance boundary and the work outside it. |
| Visit and timezone | Shows the fictional visit window and site timezone. |
| Coordinator, technician and reviewer | Keeps responsibilities distinct. |
| Due date and next action | Supports the worklist and overdue calculations. |

Selected work remains visible between views. If Overview filters exclude that package, the count line explicitly states that the selection is outside the results. Row actions open their actual row record; the separate selected-work card remains clearly labelled.

Source confirmation, technician acknowledgement, measured result, reviewer acceptance, incident outcome, scope release and receiving acceptance are separate concepts. None is inferred solely from another.

## 4. View 1 — Assurance overview

### 4.1 Summary cells

Four contiguous summary cells follow the r20 pattern:

| Cell | Calculation | Click outcome |
|---|---|---|
| Preparation blocked | Packages with an unconfirmed or expired readiness source | Filter to affected packages |
| Awaiting review | Packages whose latest submission lacks an Accept evidence decision | Open the latest-evidence review queue |
| Overdue corrections | Open actions, incidents and defects due before the fixed demonstration date | Show packages containing overdue obligations |
| Work not released | Packages without an effective current scope release | Show inspections and held scope |

Three cells count packages; Overdue corrections counts obligations. One package can contain several obligations. Captions identify the difference. Zero refers to the complete three-package fixture, not a live-system health claim.

### 4.2 Worklist and actions

Search matches work title, organisation, site, area, asset reference and work order. Search combines with the selected filter. Clear filters restores all packages. The empty state explains that no matching work was found.

Rows show work/location, current state, next action, owner and due date. The selected row has a restrained green indicator. On narrow screens, the table becomes labelled stacked records with the same content and actions.

The side column shows the selected package’s next step and owner, a continuation action, five connected-record snapshots and the demonstration guide. Record action creates a separately owned follow-up when the preview role permits it.

## 5. View 2 — Site readiness & access

### 5.1 Requirement groups

| Requirement | Information presented |
|---|---|
| Access and crop window | Exact work-area applicability, source revision, contact evidence, review owner and validity |
| Site entry and biosecurity | Reference to current site-approved entry, movement and clean-down instructions |
| Shutdown and work-scope controls | Source identifying the work boundary and responsible contact |
| Induction and assigned personnel | Fictional site-induction and assignment evidence |
| Required tools and instruments | Required-tool source; reading-specific instrument eligibility remains independent |

Each requirement shows a source ID/revision, owner, reviewed date, valid-until date, state, instruction and confirmation evidence. Inspect source opens a right-hand snapshot with the same work/location context.

### 5.2 Confirmation and acknowledgement

The coordinator or reviewer records source confirmation with a meaningful evidence statement, valid date and explicit confirmation of the displayed source, area and visit. This adds a source revision. Expired evidence cannot confirm current preparation.

The assigned technician separately acknowledges equipment identity, scope and the current source set. The acknowledgement retains actor, timestamp and work/location context. Submission requires that acknowledgement to match the current source binding.

The changed-access-source scenario adds a revision and returns access to Needs confirmation. A previous acknowledgement or effective release becomes stale, while its historical record remains intact. Reconfirming a changed source does not rewrite an earlier submission; a fresh successor is required.

The interface records applicable site-owned instructions. It does not prescribe chemicals, cleaning methods, re-entry intervals, equipment isolation procedures or crop-operating decisions.

## 6. View 3 — Inspections & commissioning

### 6.1 Procedure and capture

The view identifies procedure, template revision and draft revision. Northbank retains the Equipment r02 fictional criteria:

| Check | Required capture | Fictional criterion |
|---|---|---|
| Delivery pressure | Numeric value, unit, instrument and captioned evidence | 4–5 bar |
| Nutrient conductivity | Numeric value, unit, instrument and captioned evidence | 1.8–2.2 mS/cm |
| Visible condition | Satisfactory or Issue observed; explanation and evidence for an observed issue | Qualitative demonstration outcome |

**These are design examples, not operating limits for real equipment.** The notice is visible beside capture. Cedar Vale demonstrates missing electrical criteria; its assessment remains unavailable.

Every check can be marked Not performed with a required reason. That records factual non-completion without converting it to a pass. Inspection-wide notes remain separate from per-check reasons.

### 6.2 Instruments and assessments

Measured values are separate from their calculated assessment. Instrument records include reference, revision, calibration evidence, valid-until date and supported unit. Missing instruments, expired calibration, incompatible units or missing criteria produce Unavailable.

The fixture includes current pressure and conductivity instruments and an expired pressure instrument. The general tools checklist does not establish calibration. A measured observation with unavailable assessment requires a reason before submission, creates an incomplete-check defect and cannot support acceptance or release.

Units must match the procedure; no automatic conversion occurs. Missing or non-finite readings are refused unless the check is explicitly Not performed with its reason.

### 6.3 Image evidence

Drafts support up to four evidence items, each linked to one or more procedure checks and supplied with a caption. PNG, JPEG and WebP images must be non-empty, no more than 2 MiB each and no more than 16 megapixels. MIME/signature agreement, native image decoding and positive dimensions are checked before acceptance.

Records retain original filename, bytes/data, MIME type, byte length, dimensions, caption and check associations. The preview does not resize or recompress uploads. Draft evidence can be removed; submitted evidence remains attached to its original revision.

Use labelled fixture inserts a diagram explicitly marked **Illustrative fixture — not a photo**. It supports the demonstration without requiring personal or operational images and does not masquerade as field evidence.

### 6.4 Draft, submission and successor

Save draft accepts incomplete capture. Review & submit requires a saved draft, current preparation acknowledgement and applicable field/evidence validation. The confirmation shows the exact results before submission.

Submission retains the procedure, readiness sources, scope, equipment/configuration/location, actor, timestamp, readings, instrument evidence, images and notes. It closes the editable draft. Further changes require a successor with predecessor ID and reason.

A successor starts with fresh readings, evidence and acknowledgement. Original content remains available. Navigation and work selection protect unsaved edits; role changes require current draft edits to be resolved.

## 7. View 4 — Defects & retests

Failed, unavailable or not-performed submitted checks create owned defects. Repeated failures reuse the open defect for that check and append submission references, avoiding duplicate obligations for the same unresolved condition.

| Defect information | Retained fields |
|---|---|
| Identity | Defect reference, check identity and failure/incomplete-result title |
| Scope | Work order, scope revision, equipment and event-time location |
| Ownership | Responsible person, due date and state |
| Lineage | Original and subsequent failed submission references |
| Corrections | Separate actor, time, explanation, evidence reference, owner and due date for each correction |
| Closure | Accepted retest, exact reviewer decision, reviewer identity and timestamp |

The technician records corrective work before starting a retest for open defects. The defect moves to Correction recorded; it remains open. The retest keeps its predecessor and starts fresh capture.

Numeric passing does not close a defect. Reviewer acceptance of the complete passing retest closes only its linked defects. Separate OEM work remains open, including after scoped release.

The inspection-history panel displays all submissions and individual reviews. Earlier returns, holds and clarification reasons survive later decisions.

## 8. View 5 — Incidents & corrective actions

### 8.1 Event capture

The technician can record Observation, Near miss or Incident. Required fields are summary, factual details, response already recorded, evidence/source reference, owner and due date. Work order, equipment, site, area and scope come from the selected package.

Separate controls record whether the event holds the selected scope and whether detailed display is restricted to the Assurance reviewer in this demonstration. Event classification is not a completed risk assessment or legal reporting decision.

Event evidence is a narrative/reference in r01. The image-upload component belongs to inspection evidence; this view is not a general incident-attachment repository.

### 8.2 Corrective review

The reviewer records Keep open or Close with evidence, with review basis, supporting evidence, owner, due date and explicit scope confirmation. Each decision is appended to the history.

An open event holding the scope blocks release independently of inspection results. Passing numeric evidence cannot close the event. Greenhaven’s fixture demonstrates this distinction.

Restricted details are omitted from other preview roles’ rendered view, while the scope hold stays visible. Client-side state is still available in the standalone file: this is a display demonstration, not a secure privacy boundary.

### 8.3 Remaining actions

Coordinator, technician and reviewer can create non-blocking follow-ups with title, reason, owner and due date. Exact duplicate open titles within the same package are refused. Actions remain visible after release. Completing a separate obligation belongs to its receiving workflow; r01 does not provide a general-purpose Close action that implies that work was performed.

## 9. View 6 — Review & release

The view separates preparation, submitted evidence, reviewer acceptance and scoped release. It presents blockers, latest exact evidence, reviews, retained release history, remaining work and receiving handover.

### 9.1 Evidence decisions

| Decision | Behaviour |
|---|---|
| Return for correction | Retains reason, owner and due date against the exact submission |
| Request clarification | Records an owned clarification without changing readings |
| Hold review | Records the hold and its basis, including for passing numeric evidence |
| Accept evidence | Requires complete passing results and a matching current source/scope binding |

Acceptance does not itself release the work. Stale source, scope or configuration prevents current acceptance.

### 9.2 Release conditions

Release requires current confirmed readiness; a submitted inspection matching current sources and scope; passing results for every check; an Accept evidence decision for that submission; no unresolved inspection defects; no open incident or blocking action holding the scope; no successor draft; and explicit reviewer confirmation of the release boundary and basis.

The release record retains actor, timestamp, work/location/configuration context, submission/review references, source binding, scope, exclusions, reason and remaining-action snapshot. Duplicate release for the same effective scope is refused.

This is **partial acceptance by work scope**. It does not complete the project, book attendance, operate equipment, close separate OEM work, issue a service report or establish customer acceptance.

### 9.3 Later changes and handover

Current release applicability is derived from current sources and unresolved blockers. If these change, the earlier release remains visible but is no longer effective. Reconfirmation cannot rewrite its original evidence.

After a current release, coordinator or reviewer can prepare a Service Review or Project Readiness handover. It retains target, release ID, work context, actor, time, note and outstanding obligations. Repeating the same release/receiver handover is refused.

Prepared locally means a demonstration record. It does not write to another module or assert receiver acceptance. A handover based on a now-stale release is labelled for reassessment.

## 10. Roles and responsibility

| Preview role | Controls |
|---|---|
| Robin Ellis — Service coordinator | Source confirmation, changed-source scenario, remaining actions and receiving handover |
| Alex Morgan — Assigned technician | Preparation acknowledgement, draft, evidence, submission, correction, retest, event capture and remaining action |
| Casey Reed — Assurance reviewer | Source confirmation, evidence review, incident outcome, scoped release, actions and handover |
| Jamie Walker — Read-only observer | Inspection of the demonstration views without ordinary mutation controls |

The model checks role/action combinations in addition to rendered controls. Nevertheless, a role selector and client-side JSON are not authentication. Runtime delivery must use existing identity, grant, scope, assignment and document contracts with server-side checks.

## 11. Demonstration identities

| Package | Equipment | Work order | Scenario |
|---|---|---|---|
| Northbank Nursery — Propagation site / Irrigation room, serving Glasshouse 02 | `SYN-PPO-AST-000101`, Fertigation unit 01 | `SYN-PPO-WO-000241` | Access blocker, failure, correction, retest, release; separate OEM action |
| Greenhaven Berries — Berry tunnels / Tunnel 06 | `SYN-PPO-AST-000105`, Vent drive 05 | `SYN-PPO-WO-000245` | Passing submission awaiting review with an independent incident hold |
| Cedar Vale Growers — Young plant facility / Bay 03 | `SYN-PPO-AST-000106`, Lighting circuit 06 | `SYN-PPO-WO-000246` | Missing criterion and overdue Engineering action |

Equipment UUIDs and location aliases match Equipment r02. Northbank uses UUID `11111111-1111-4111-8111-111111111101`, installed area `f2` / Irrigation room, serving Glasshouse 02. These identities are retained in submissions, corrections, incidents and release snapshots.

The assurance records and visit are newly authored synthetic scenarios. Their presence does not claim that runtime work orders or source-system records have changed.

## 12. Main walkthrough

1. Open the file with Northbank and Service coordinator selected.
2. In Site readiness inspect the access source and record a meaningful fictional confirmation for the exact area and visit.
3. Switch to Assigned technician in Preview options and acknowledge preparation.
4. In Inspections enter 5.60 bar with instrument 000009, 2.00 mS/cm with instrument 000010, and Satisfactory visible condition.
5. Add fictional images or the labelled fixture associated with pressure and conductivity. Save draft; Review & submit the exact revision.
6. Inspect the created defect. Switch to Assurance reviewer and return the submission with a reason, owner and due date.
7. As Assigned technician, record corrective work/evidence and start a successor.
8. Acknowledge preparation again. Enter 4.60 bar, 2.00 mS/cm and Satisfactory with suitable instruments and fresh evidence; save and submit.
9. As Assurance reviewer, accept the exact passing evidence. Verify that the pressure defect closes and OEM action remains open.
10. Release only the stated scope, preserving exclusions and remaining work. Prepare a Service Review handover.
11. Optionally simulate changed access instructions. The release remains in history and requires reassessment.

For the independent hold scenario, select Greenhaven and inspect its passing submission and open event. For missing criteria, select Cedar Vale and inspect the Engineering follow-up.

## 13. Persistence, errors and recovery

| Situation | Delivered response |
|---|---|
| Ordinary save | Stores the local session and reports storage status |
| Failure before mutation | Preserves original state and form entries; offers retry |
| Response lost after save | Recovers the original operation/receipt without a duplicate effect |
| Operation identity reused with different content | Refuses the operation |
| Stale form version | Refuses save and retains the entered form |
| Another tab changes the session | Reloads when idle; otherwise blocks saving and retains local work for export/reload |
| Storage failure/quota | Retains in-memory state and reports Session only |
| Export | Downloads JSON with current records and navigation context |
| Restore | Validates structure and saved image decoding; confirms replacement and opens read-only |
| Damaged saved content | Preserves original bytes with export and separately confirmed reset |
| Reset | Restores the three fixtures after explicit confirmation |
| Unsaved inspection edits | Requires a choice before navigation or package change |

The storage key is `ppo-quality-site-assurance-r01`; other module sessions are independent. JSON export is not a durable server receipt or offline synchronisation queue. Local state is neither encrypted nor tamper-proof. Runtime persistence, access, concurrency and recovery require existing application services and full journey verification.

## 14. Visual, responsive and accessibility design

The workspace uses r20 embedded Roboto with Verdana fallback, navy `#242a37`, green `#62bb46`, pale grey background, white surfaces, thin borders and restrained status colours. Navy marks primary actions; green marks selection and accepted progress.

The module is content for the shared shell, without a duplicated global rail. Six view buttons preserve selected context. Summary cells are contiguous and square. Record snapshots open on the right, with headings matching the actual entity. Editable actions use centred native dialogs.

At smaller widths, columns stack, filters fill rows, context controls expand and the table becomes labelled records. The tab strip scrolls within its own boundary. Forms use single-column fields where needed. Dialog height remains bounded to the viewport.

Colour is accompanied by text. Controls have labels and visible focus. The skip link targets content; Left/Right, Home and End move through view controls; native dialogs support Escape and focus return. Targeted checks do not establish full accessibility conformance or real-device acceptance.

## 15. Receiving-module relationships

| Module | Shared context | Receiving boundary |
|---|---|---|
| Equipment & Installed Base | UUID/reference, serial, installed/served locations, configuration and inspection lineage | Existing equipment model remains canonical |
| Work Orders | Reference, exact scope revision, limits and exclusions | Assurance does not authorise new work independently |
| Field Technicians | Assignment, visit, preparation and evidence | Field/offline authority remains in the field workflow |
| Service Review | Accepted evidence, released scope and unresolved work | Report issue and customer response remain separately controlled |
| Project Readiness | Package release, exclusions, holds and actions | Package release does not establish whole-project acceptance |

Reference buttons open existing GitHub design sources. Runtime deep links must resolve current permitted entities and exact versions; the preview does not invent runtime routes or transfer local state to another design.

## 16. Traceability and provenance

| Identifier | Application in this design |
|---|---|
| CS-06 | Exact-area site access and horticultural readiness |
| FI-03 | Versioned inspection runner, readings, evidence and instruments |
| FI-04 | Review, defects, retests and partial acceptance |
| FI-05 | Site-owned induction, risk and biosecurity references |
| FI-06 | Attributable event and corrective-action record |
| F01 / F02 / F08 | Equipment identity, structured inspection and visit preparation |
| ENG-07; PRJ-06/08 | Technical criteria, retest evidence and staged closeout |
| SVC-03/06/10 | Preparation, service/equipment history and field evidence |
| DOC-01/02/03; NFR-01/07/09 | Source relationships, exact versions, access and recovery |
| D-019 | Operational policies and competent source/reviewer decisions remain required |
| AT-17 | Bounded failed-check, retest and phased handover demonstration; not full acceptance |

Primary sources:

- [Master blueprint](../../../blueprints/BP-01-master-blueprint.md).
- [Product-quality requirements](../../../requirements/product-quality-register.md) and [delivery plan](../../../delivery/product-quality-plan.md).
- [Equipment r02 design/handover](../../../decisions/equipment-workspace-design.md).
- [Service data dictionary](../../../contracts/service-data-dictionary.md), [Service API](../../../contracts/service-api.md) and [document issue/distribution contract](../../../contracts/document-issue-distribution.md).
- [Quality/Safety/Site Assurance workflow map](../module-workflow-maps/PPO-Quality-Safety-and-Site-Assurance-Workflow-Map-r01.html).
- [Page coverage r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) and [theme/style board r20](../theme-style-board/powerplants-one-theme-style-board-r20.html).

The r20 SHA-256 is `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`; its embedded Roboto declarations are retained. The existing standalone source/build pattern is reused without new frameworks, application dependencies, migrations or external services.

## 17. Verification and review evidence

The [design handover](../../../decisions/quality-site-assurance-design.md) and [verification record](../../../testing/evidence/quality-site-assurance-r01/README.md) retain actual results, exact hashes and remaining checks.

Model checks cover failure/correction/retest/release, repeated review reasons, incident holds, missing criteria, expired instruments, receipt recovery, wrong-role/stale-version refusal, source invalidation, saved-state validation and preserved identity.

The native Chrome suite exercises real forms, snapshots, images, unsaved edits, reload, save failure/recovery, role display, keyboard/dialog behaviour, export and damaged-session handling. It checks all six views at 1440, 1024, 820, 390 and 320 pixels and retains screenshots for visual inspection.

Local preview navigation was blocked by the available browser. Native verification therefore uses the repository’s established Chrome/runtime pattern in GitHub Actions. Only completed results are reported as passed. Full application, policy, screen-reader, real-device and owner acceptance remain separate.

## 18. Runtime implementation boundary

This package demonstrates the workspace; it does not deliver production authentication, persistence, integrations or operational policy. Receiving implementation should:

1. Map assurance records to canonical WorkOrder, ScopeRevision, Asset, Site, Facility, assignment, Activity and document identities.
2. Define server-side coordinator, technician, reviewer and restricted-event access.
3. Establish template ownership, actual approved criteria and instrument/calibration sources.
4. Reuse durable submissions, corrections, receipts and source/concurrency controls.
5. Integrate supported field/offline capture without treating cached acknowledgement as authority.
6. Define Service Review and Project Readiness receiving commands and acceptance records.
7. Resolve applicable site and incident-management policies with responsible owners.
8. Verify one complete equipment-to-receiving-handover journey with original evidence retained.

R01 includes reference-based event evidence, non-blocking follow-up creation and fixed procedures. General incident attachments, template authoring, instrument administration, action completion, automated notifications, camera scanning, voice capture and full document publication remain receiving work.

## 19. Owner review criteria

- Confirm the six views support the coordinator, technician and reviewer journey.
- Check that equipment identity, installed location, served area and work scope remain clear.
- Confirm the source-confirmation/technician-acknowledgement distinction is understandable.
- Verify that missing prerequisites, failures and incident holds remain actionable.
- Inspect original submissions, repeated review reasons and retest history.
- Confirm scoped release preserves exclusions and separate obligations.
- Review receiving context for Service Review and Project Readiness.
- Assess desktop and phone usability with representative long evidence notes.

An acceptance decision should identify this exact revision and approved scope. A merge or browser test does not substitute for owner acceptance.

## 20. Revision record

| Revision | Date | Change |
|---|---|---|
| r01 | 16 September 2026 | First six-view assurance workspace and detailed report; existing Equipment identity and inspection concepts, scoped release, incident review and local recovery. |

Font attribution: Roboto, copyright 2011 Google Inc., [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). Demonstration illustrations are labelled code-native fixtures.
