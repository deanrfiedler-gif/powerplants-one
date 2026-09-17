---
document_id: PPO-DOCLIB-RPT
title: Document Register and Linked Library — Detailed Design Report
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Authorised standalone design; owner acceptance and application integration separate
source_commit: aa94dcdcb1dd08798be240325857c3d32d04af02
---

# Document Register & Linked Library

## 1. Purpose and delivered outcome

This package provides a shared Powerplants One workspace for locating a document, inspecting its exact source revision, assessing applicability, reviewing changes and identifying the business records that depend on it. It covers **DK-01 — Document register and linked library**, supported by **DK-02 — Document viewer, revision and review workspace**.

The [interactive HTML](PPO-Document-Register-and-Linked-Library-r01.html) contains six connected views, ten fictional document identities, selected historical revisions, four illustrative preview roles and a complete local review journey. The workspace is self-contained: its fonts, styles, source extracts, fixtures and interaction code are embedded. It can be downloaded and opened in a modern browser. No sign-in, installation or provider connection is required for this design review.

The primary demonstration follows a revised irrigation layout for a nursery. The drawing is inspected and compared with its predecessor; an owned finding is recorded, answered and independently reviewed; a technical decision is retained for that exact revision; and the user prepares a follow-up for the Service team whose issued job pack still references the older drawing. Source exceptions and interrupted saves are accessible through normal views and the Review guide.

This is a proposed design under Dean’s authorisation to create the package. It is not an accepted application baseline, live SharePoint integration or production document-control system. Actual executed checks and artifact identities are retained in the [verification record](../../../testing/evidence/document-library-r01/README.md).

## 2. Scope and design conformance

| Declaration | Package treatment |
|---|---|
| Primary scope | DK-01, Document register and linked library. |
| Supporting scope | DK-02, Document viewer, revision and review workspace. |
| Scope source | HTML Page Coverage Register r06; exact source hash in the source manifest. Its historic delivery statuses are not treated as current runtime evidence. |
| Parent requirements | DOC-01 through DOC-06; their original identities remain unchanged. |
| Primary r20 page type | Document & evidence workspace. |
| Supporting r20 page types | Register / worklist and Review / comparison. |
| Shell boundary | Workspace interior only; the application shell retains the rail, logo, global search, user account and application navigation. |
| Reused visual primitives | r20 typography, colours, focus treatment, spacing, cards, buttons, tabs, status pills, forms, tables and document context. The builder reuses the existing Supplier Pricing font and stylesheet sources under SHA-256 guards. |
| New composition | A six-view document workspace, a 448 px desktop snapshot, a flexible document viewer with a 292 px context column, revision comparison and owned impact cards. |
| Incoming handover | A permitted document reference, provider context, exact version, linked record context, applicability and source availability. |
| Outgoing handover | Exact technical-review evidence and locally prepared follow-up context for the relevant receiving domain. DK-03 remains responsible for its future output/issue/distribution-centre scope. |
| Departures requiring later acceptance | The document-specific layout, local review-role rules, demonstration fixture states and supporting comparison composition are proposals. They do not change an existing accepted UI baseline. |
| Verification boundary | Model, generated-file, browser and documentation checks establish only the tested standalone design behaviour. Native-device, screen-reader, owner and integrated application acceptance remain distinct. |

The [package conformance standard](../../../standards/html-module-conformance.md) governs the declaration. The existing [document contract](../../../contracts/document-issue-distribution.md) governs source identity, authority and revision boundaries.

## 3. Workspace structure and navigation

The workspace header identifies the module and its DK-01/DK-02 scope. A visible Synthetic preview label, fixed source assessment date and footer make the demonstration context clear. Review guide and Export review copy are available from the header.

A local context strip identifies the linked document workspace and permits switching the illustrative preview role. It is a design-review control, not a substitute for the application’s account controls. The six tabs provide:

| View | Primary question | Main outcome |
|---|---|---|
| Document register | Which permitted document do I need? | A filtered result and selected document snapshot. |
| Document detail | What exact content and context am I inspecting? | An exact authored source extract, applicability and source identity. |
| Revision review | What changed, and is this source suitable for the stated purpose? | Findings, independently accepted responses and a retained technical decision. |
| Usage & impact | Which records still depend on this document? | Exact receiving context and an owned follow-up. |
| Source exceptions | Why can’t this exact source be relied upon? | Visible exception identity and a prepared recovery action. |
| History | Which sources and review actions led to the current position? | Retained original revisions and local review events. |

Record views keep a selected-document control and exact-revision selector above the content. Return to register restores the prior register view and scroll position during the session. Filtering closes an open snapshot and clears a selection excluded from the results. A record view then asks the user to select a visible document rather than silently opening a hidden match. Preview-role changes reset filters and recheck document scope.

## 4. Document register

### 4.1 Summary information

Four summary cards describe the permitted fixture scope, independently of the current search filter:

- Document identities, including withdrawn identities retained for historical inspection.
- Current references needing technical review.
- Exact source exceptions, including unavailable historical versions.
- Receiving records using an earlier document revision.

The register summary separately states the number of matching documents and the permitted population. Counts are unavailable while the simulated source read is loading or failed; an unknown count is never presented as zero.

### 4.2 Search, filters and saved preferences

Search matches the title, readable reference, customer, site, equipment, project, document type, model, firmware and named areas. The Register view selector offers All permitted documents and Needs attention. Needs attention includes review gaps, unavailable current sources and withdrawn identities; it is a convenience filter, not a readiness or approval verdict.

Show filters exposes customer, site, growing area, equipment, project, document type, revision status and audience filters. Options are derived only from the current preview role’s permitted records. Site and growing-area filters operate independently; incompatible combinations correctly produce No matching documents. Clear filters restores the permitted register without manufacturing a result.

The register lists one selected current identity per document. Its status filter covers Current and Withdrawn. Historical Superseded revisions are available through exact-revision selection and History; the register does not mix several versions of the same identity into duplicate rows.

Role, filter values and filter visibility are retained as optional local preferences. Named team views, sharing view definitions and cross-device preferences remain outside this increment.

### 4.3 Register rows

Each row includes document title, readable reference, document type, applicable growing areas, customer, site, current revision, current/withdrawn status, review state, availability and owner. Type markers help scanning but do not establish the format or authenticity of a source file. Selecting the title opens the right-side document snapshot.

The desktop table becomes labelled cards on phones. Document identity remains first; location, revision, review/source and owner remain readable without horizontal page scrolling.

## 5. Snapshot and full document detail

The desktop snapshot is 448 px wide and sits beside the register when sufficient width is available. At narrower widths it becomes a modal drawer; on phones it fills the viewport. It presents reference, revision, current/historical state, review state, customer, site, areas, equipment, owner, source, availability, date, latest change and applicability.

Open full document moves to the selected record’s document detail. Closing the snapshot returns keyboard focus to the originating document title where that control still exists. Escape closes it. Resizing closes an open drawer so a desktop layout is not stranded in an inappropriate phone mode.

Full detail places document identity and revision before the source extract. The viewer includes text-size adjustment and Download exact extract. A context column gives business links, audience, review due date, equipment/software applicability and a path to source-identity inspection.

The supplied content consists of authored synthetic text extracts. The irrigation drawing also contains a precise illustrative relationship diagram showing the pump supply and two compartments, with the revision-specific isolation arrangement. It is explicitly not to scale and not an installation instruction. It has an accessible text description.

Download exact extract generates a UTF-8 text copy of the selected authored revision, including its reference, revision, synthetic warning, exact fictional source version and section content. It is not a manufacturer document, customer PDF or controlled issue. Downloading creates no approval, issue, distribution or acknowledgement event.

## 6. Document information model

The design distinguishes the document identity from the selected revision and its current usability:

| Information | Meaning and treatment |
|---|---|
| Local fixture identity | Stable internal design key; production UUID allocation remains a receiving implementation concern. |
| Readable reference | A synthetic PPO reference for users, separate from the display title and provider item. |
| Title and document type | Search and display values; neither establishes approval. |
| Customer, site and areas | Explicit location context; area names retain their site context. |
| Equipment and project | Relevant business relationships, including explicit Not equipment specific / No project values. |
| Model and firmware | Recorded applicability, including Not confirmed and Not applicable. |
| Audience | Illustrative visibility classification used by the preview roles. |
| Owner | The responsible named fictional person. |
| Provider and item | Fictional provider context and stable item identifier where disclosed. |
| Source version | The selected exact source revision, independently of its filename or path. |
| Recorded path | A display locator; no promise is made that paths or URLs survive every provider move. |
| Availability | Available, Missing version, Source unavailable or Access restricted. |
| Source revision state | Current, Superseded or Withdrawn, distinct from technical review. |
| Review state | Seeded review information or the retained local exact-revision decision. |
| Source/review dates | Fixed demonstration dates, not a live synchronisation claim. |
| Review purpose and rationale | The bounded intended use and supporting explanation for a technical decision. |

Source identity inspection displays the fictional provider, exact source version, permitted locator and availability. The restricted fixture exposes only a safe placeholder, with no hidden real title, provider item, path or content. There are no credentials or live SharePoint URLs.

## 7. Applicability and horticultural context

Applicability is explicit at customer, addressed site, growing area, equipment, model and firmware level. The same document need not apply to every area at a site. The irrigation drawing covers Greenhouse 01 Compartments A and B and the Irrigation Shed 01 pump relationship; Outdoor Field A is explicitly outside its scope.

The climate-controller reference applies only to the named synthetic model and Demo 4.2 firmware in Compartment A. The historical r01 reference has different recorded applicability and unavailable exact content. A newer reference is not substituted merely because its title matches.

The Bayview fixtures demonstrate a tunnel block, Pack Room and Irrigation Shed. Firmware can remain Not confirmed. The commissioning fixture retains its missing calibration evidence instead of implying that a captured test record proves commissioning acceptance.

Applicability text is inspectable evidence in this design. The workspace does not calculate engineering suitability, determine safety of a procedure, connect to controllers or invent manufacturer settings.

## 8. Revision comparison and findings

Revision review compares a selected document revision with another available revision of the same document. Authored sections appear side by side on desktop and as labelled earlier/selected pairs on phones, with changed or added content highlighted. Unchanged text remains visible. Both exact sources must be available before comparison; otherwise the interface explains why comparison cannot be performed.

This is a section-level comparison of the embedded extracts. It does not claim native CAD, PDF redline, binary-file comparison or dependency inspection.

An editable finding records:

- Exact document identity and revision.
- Finding text, up to 2,000 characters.
- A named owner and a valid due date.
- Author and capture time.
- Retained responses and independent acceptance evidence.

The demonstrated finding lifecycle is **Open → Response awaiting review → Closed**. A response does not close the finding. The reviewer must independently accept it, and a response author cannot accept their own response. The original finding text and response remain visible after acceptance. A new unresolved finding returns the current review display to Review needed while preserving any earlier exact decision; that decision is not silently overwritten.

## 9. Technical review decision

Only the Technical reviewer preview role can record an independent decision. It requires an available current source, a stated review purpose, a rationale and the exact source basis. Reviewed is blocked while any finding remains unresolved. Returned remains available with a reason so concerns are not concealed by a positive state.

The decision retains the exact revision content, source identity basis, outcome, purpose, rationale, reviewer and timestamp. A second decision cannot overwrite the same local exact-revision decision. A returned or otherwise changed source requires a successor; the demo’s r04 source change illustrates that boundary.

Technical review is distinct from work authorisation, commercial approval, issue, dispatch readiness, customer acceptance and distribution. Existing seeded Reviewed labels are illustrative prior evidence, not an invitation to promote every reviewed document to operational use.

The r04 demonstration changes the current source pointer while preserving the r03 decision. Pending forms tied to the previous source epoch become stale. Historical or withdrawn revisions remain inspectable but cannot receive a new current-use review through this workflow. The new revision starts without inherited review.

## 10. Usage and change impact

Usage & impact displays the exact revision referenced by each receiving record. It deliberately shows each record’s own source basis rather than assuming that the selected viewer revision is already in use.

The irrigation demonstration contains three receiving records: an issued technician job pack, a project baseline and an accepted quotation basis. All initially reference drawing r02. The later drawing review leaves those references intact.

Each receiving card shows domain, record reference, record name, source revision, current-versus-earlier comparison, retained basis, responsible owner and the next assessment. Inspect receiving context opens a labelled destination preview. It does not claim a connected operational screen or mutate another module.

Prepare owned follow-up requires an action description, owner and due date. The task retains the source revision, receiving target and current-source context at preparation. Only one task can be prepared for that target in this increment; repeated clicks cannot create duplicates. The status is **Prepared locally**, with receiving acknowledgement pending.

The module does not determine the impact of a technical change automatically. Service owns pack/readiness reassessment; Projects owns baseline/programme implications; Estimating owns commercial scope; Knowledge owns article applicability. Earlier acknowledgements and customer acceptance remain with their original content.

## 11. Source exceptions and recovery

Four initial exact-source exceptions are supplied:

| Exception | Demonstration | Required response |
|---|---|---|
| Missing historical version | Climate-controller reference r01. | Locate the exact source if needed for historical evidence; do not substitute r02. |
| Source unavailable | Bayview receiving/access plan r01. | Ask the source owner to restore availability and recheck the exact source. |
| Access restricted | Supporting-document safe placeholder. | Ask the owner about permitted access; no source content is exposed. |
| Missing version | Calibration certificate r01. | Obtain and verify the exact evidence before relying on the commissioning record. |

Each exception preserves document identity, revision, customer/site, availability reason and next action. A recovery follow-up is prepared locally with an owner and due date. Preparing the action does not change availability, close the exception or send a message. The exception remains visible until a future verified source-recovery contract establishes a real outcome.

Withdrawn sources remain available for historical inspection when their exact content is accessible. They carry a historical warning and do not become valid current sources simply because their file can be read.

## 12. History and traceability

History combines authored source-revision entries with local review events, with the two sources identified separately. Source entries show revision date, change summary, state, availability and author. Inspect this revision opens the exact earlier content or its unavailable-source state.

Local events record finding creation, response, independent acceptance, technical decision, owned follow-up and simulated source advancement. Each event retains actor, timestamp, revision and event identity. Revision selectors, findings, decision snapshots and tasks preserve their original context.

This is an inspectable design event trail. It is not a tamper-resistant server audit log or an operational retention guarantee. Browser storage can be altered outside the application; the receiving implementation requires server permissions, immutable evidence, transaction boundaries and retention controls.

## 13. Preview roles and visibility

| Role | Demonstrated visibility | Demonstrated changes |
|---|---|---|
| Document steward — Alex | All ten fictional document identities, including the safe restricted placeholder. | Findings, responses and owned follow-up; cannot independently approve their source. |
| Technical reviewer — Sam | All ten identities and the same source-availability limits. | Findings, responses, independent response acceptance and technical decisions. |
| Site technician — Riley | Five permitted North Site Service/Internal technical documents. Commercial and other-site records are excluded. | Read only in this review workspace. |
| Observer — Jordan | Nine identities; restricted placeholder excluded. | Read only. |

Scope applies to register results, filter choices, record selectors, usage cards and the exported review copy. Service-visible usage excludes commercial/project receiving context. Role changes re-evaluate the selected document.

All fixtures are embedded in the standalone HTML and therefore are discoverable through file inspection. The preview roles demonstrate expected UI and model behaviour only. They provide no security boundary and are not suitable for protecting real data. Production read, preview, download, export and command permissions must be enforced by the server and source provider.

## 14. Save, reload and interruption behaviour

Review findings, responses, decisions, tasks and events are stored under the dedicated browser key `ppo.document-library.r01`. Optional role/filter preferences use a separate key. Successful saves report that the work is saved in this browser. Reloading restores valid review evidence.

Before every write, the controller compares its last-read saved value with current browser storage and supplies an expected model version. A detected external change pauses writes and offers Reload saved work. An open form is retained when its save is rejected. This demonstrates stale-state detection; browser storage does not provide an atomic compare-and-swap transaction across truly simultaneous tabs. A production implementation must enforce concurrency server-side.

Fail next save once is available in Review guide. It refuses the next mutation before saved state is changed. The form and its entries remain open, and retry creates one accepted local record.

Malformed saved data is retained without overwrite. Changes are paused, and the user can download the original saved data, reload or explicitly reset this module. Storage-access or quota errors keep form entries available for retry. Reset requires confirmation and removes only this module’s local evidence and preferences.

The JSON Export review copy contains only the current preview role’s allowed fixture summary and local evidence, with a synthetic warning. It is a review copy, not an importable backup, signed handover or provider synchronisation payload. File-URL browser storage behaviour may vary; use the same browser and file location during review, or serve the self-contained file locally.

## 15. Empty, unavailable and partial states

Review guide exposes controlled demonstrations of Loading, Empty scope and Failed source read. Loading and failed reads do not show misleading zero summary counts. Each state has an explicit path back to the supplied source results.

A relationship-read failure can be demonstrated separately. The exact document remains readable while linked-work information is shown as unavailable. Retry relationships restores the fictional relationship set. A failed relationship read cannot imply that there are no downstream uses.

Other reachable states include no matching filters, no selection, unavailable exact source, restricted source, withdrawn/historical source, unresolved finding, returned review, stale source form, read-only role, failed save, cross-tab conflict and malformed saved data.

## 16. Visual design, responsiveness and accessibility

The package uses the r20 navy/green palette, embedded PPO Roboto font, restrained white/grey surfaces, 6 px controls, 7 px cards and clear semantic state colours. The source family’s typography, tabs, focus rings, cards and form controls are reused by the deterministic builder. A module-specific stylesheet supplies the document composition.

The document viewer is the dominant surface. At suitable desktop widths, a 292 px supporting column carries context. At narrower widths, that information stacks below the viewer. Snapshot behaviour adapts from a desktop dock to a modal drawer. Register rows become labelled phone cards, and the source identity/revision remains before the extract.

The HTML provides semantic headings, labelled controls, native selects, live status/error messages, visible focus, a skip link, keyboard tab navigation and native modal focus behaviour. Tabs support Left/Right and Home/End. Snapshot Escape and focus return are implemented. Unsaved form dismissal requires confirmation. The diagram includes a text alternative; meaning is not conveyed by colour alone.

Declared content widths are 1440, 1024, 820, 390 and 320 px. The verification record separates measured overflow and browser checks from manual visual inspection, native-device testing and screen-reader acceptance.

## 17. Demonstration fixture catalogue

| Reference | Document | Main teaching case |
|---|---|---|
| SYN-PPO-DOC-000101 | Irrigation layout — Greenhouse 01 | r02/r03 comparison, findings, review, source r04 and retained receiving references. |
| SYN-PPO-DOC-000102 | Climate controller — operator reference | Exact model/firmware applicability and unavailable historical revision. |
| SYN-PPO-DOC-000103 | Irrigation upgrade — accepted quotation | Commercial visibility and retained acceptance basis. |
| SYN-PPO-PACK-000081 | Irrigation installation — technician job pack | Earlier drawing reference and original acknowledgement context. |
| SYN-PPO-RPT-000062 | Controller visit — reviewed service report | Factual correction, uncertain diagnosis and remaining work. |
| SYN-PPO-DOC-000106 | Site access and receiving plan | Source outage at a second customer/site. |
| SYN-PPO-DOC-000107 | Commissioning readings — Compartment B | Captured evidence requiring review and calibration support. |
| SYN-PPO-DOC-000108 | Restricted supporting document | Safe placeholder with source identity/content withheld. |
| SYN-PPO-DOC-000109 | Superseded tunnel arrangement | Withdrawn source retained for historical inspection. |
| SYN-PPO-DOC-000110 | Calibration certificate reference | Missing exact evidence with an owned recovery action. |

All business content and people are fictional. No real supplier documentation, customer export, commercial price, controller instruction, credential or signature is included.

## 18. Source and receiving-system boundaries

SharePoint remains the intended authority for business documents. PPO owns document-to-record relationships and relevant review/issue evidence under the maintained architecture. Native CAD tools retain authoring and file dependency responsibilities; MYOB retains its intended ERP authority. No integration endpoint is introduced or invented by this package.

A future incoming document contract must verify provider/tenant/site/drive/item context, exact source version, byte identity, permissions, availability, applicability and record scope. A filename, mutable URL or current provider listing is insufficient evidence of the exact issued content.

A future outgoing review contract must retain the reviewed revision, source identity/hash, purpose, findings, actor authority, timestamp and exact evidence. Receiving domain actions must use their own state transitions, stale checks, permissions and deduplication. Prepared, sent, received and accepted remain separate outcomes.

DK-03 is the next output/issue/distribution-centre design boundary. It must preserve the existing distinctions between Generated, Reviewed, Issued, Sent, Delivered, Opened and Acknowledged. This package does not add those commands or infer any of those outcomes from viewing, reviewing or downloading.

## 19. Implementation package and reproducibility

The maintained source is [document-library](../../../design/document-library/README.md):

- `model.js`: synthetic records, visibility, exact-revision rules, review transitions, task guards, state validation and scoped export.
- `workspace.js`: six-view rendering, selections, forms, snapshots, file exports and local recovery.
- `workspace.css`: document-specific responsive composition over shared primitives.
- `template.html`: accessible standalone document structure.
- `source-manifest.json`: SHA-256 identities of the reused visual and scope/contract sources.

The [builder](../../../../scripts/build-document-library.py) assembles the standalone HTML deterministically and refuses an unreviewed source-manifest change. The package adds no application route, dependency, database migration, live adapter, deployment workflow or accepted-baseline change.

The shared stylesheet is appropriate to this isolated standalone artifact. Application integration must scope the reused global selectors to the module host and use established shared components; copying the whole standalone stylesheet into the application would not be the receiving implementation.

## 20. Verification, limitations and acceptance

The model suite covers scoped visibility, missing exact versions, restricted placeholders, independent decisions, invalid data, findings and responses, immutable reviews, source successors, retained receiving references, prepared-task deduplication, stale state and scoped export. The browser suite exercises complete workflows, actual controls, downloads, save/reload, failures, responsive layouts and keyboard behaviour.

The [verification record](../../../testing/evidence/document-library-r01/README.md) is the authoritative location for actual results, tested source, HTML SHA-256, captured images and remaining limits. Check names in this report describe the supplied verification coverage, not a claim that an unrecorded run passed.

Operational acceptance still requires:

1. Dean’s review of the proposed desktop and phone experience.
2. Confirmed document ownership, classifications, review authority and retention rules.
3. Verified SharePoint configuration, supported identity/version behaviour and source-access controls.
4. Server-side concurrency, scoped commands, audit history, durable files and recoverable handovers.
5. Native PDF/CAD/document preview strategy and accessibility review appropriate to actual formats.
6. Accepted receiving contracts for Engineering, Service, Projects, Estimating, Knowledge and DK-03.

The next bounded design step is DK-03 — Output, Issue & Distribution Centre, using exact source identities and review evidence established here while preserving each domain’s authority.
