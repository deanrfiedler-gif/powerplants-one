---
document_id: PPO-DK01-R01-PLAN
title: Document Control & Controlled Publication workspace r01 — design build plan
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed plan for Dean's review; nothing below is built or approved
register_entry: DK-01 · Document register and linked library · P1 · N (new design candidate), with DK-02 and DK-03
source_commit: d0a660d21d52cd9128ee996ce2025bf11285a1b8
---

# Document Control & Controlled Publication workspace r01 — design build plan

## 0. What this plan is

A build plan for the next standalone module HTML page in Powerplants One: the **Document register and controlled publication workspace**, register entries **DK-01** (register and linked library), **DK-02** (viewer, revision and review) and **DK-03** (output, issue and distribution centre). It follows the delivery shape established by Work Orders r01, Quality & Site Assurance r01 (#208) and My Work r01 (#209), and the package discipline of the ES-05/ES-06 conformance standard.

Every field, state, command and rule named below is marked as one of:

- **Contract** — exists in migration 0006/0009/0011, the document issue and distribution contract, the service data dictionary or BP-01 §16, and is implemented in the running application.
- **Dictionary** — a canonical value, reference type or output identifier defined in the repository but not implemented as a runtime command.
- **Proposed** — a design extension this page would introduce; requires Dean's decision and is labelled as such in the HTML.

Nothing in this plan authorises a live SharePoint connection, a retention period, a real distribution channel, an approved template or delegation of real authority. It plans a synthetic design artefact for review.

---

## 1. Purpose and position in the chain

Your workflow controls require issued source/template revisions, hashes, scope and distribution evidence to be preserved, and require **approval, issue, sent, delivered and acknowledged to remain distinct**. Today those controls are implemented three times in three places — job packs (P06), service reports (P09) and Finance evidence (P10) — and are designed a fourth time for quotations (ES-05, in flight). **There is no surface anywhere that shows a document's identity, its revisions and its issue evidence in one place.** That is what this module is.

| Chain link | Design state today | What DK-01 r01 supplies |
|---|---|---|
| Source authority (SharePoint) | External; synthetic adapter only | Stable link identity, version, hash, availability projection |
| **Document register** | **No design; no surface** | **This page** |
| Viewer, revision, review (DK-02) | No design; `pack_checks` exists in runtime | Included — check/return decision against an exact revision |
| Output, issue, distribution (DK-03) | Runtime for OUT-09/OUT-10/OUT-14; ES-05 design in flight for quotations | Included — the **cross-domain** issue register, not a second approval decision |
| Knowledge (DK-04) | r01 built in PR #214 — **ahead of its only dependency** | The register and source identity DK-04 reads |
| Templates (DK-06) | No design | Out of r01 (§12.2); template version shown read-only on each issue |
| Equipment documents (EQ-05), drawings (EN-03), calibration evidence (EQ-09), answer evidence (AI-03) | All undesigned; all depend on DK-01 | The register they hang from |

Primary parents: **DOC-01–DOC-06**.

| Parent | Requirement | Where it lands in this page |
|---|---|---|
| DOC-01 | Link controlled documents using stable repository identifiers; renaming or moving follows supported reference-handling rules | Identity vs availability projection (§4.2) |
| DOC-02 | Separate working versions, approved revisions and issued records; preserve exact released/acknowledged content and issue purpose | Three-state separation (§4.3) |
| DOC-03 | Generate approved quotation, job-pack, service and handover outputs; template version, source snapshot and reviewer recorded | Issue manifest (§4.4) |
| DOC-04 | Maintain approved knowledge and technical reference content | Register rows and applicability only; DK-04 owns the article |
| DOC-05 | Manage communication drafts, approval, distribution and delivery outcomes; sent, delivered and acknowledged are not interchangeable | Evidence matrix (§4.6) |
| DOC-06 | Apply access, retention and confidentiality to files and search results | Classification and retention (§4.10) |

Supporting traceability: OUT-01–OUT-18 (BP-01 §16.1), D-012 (retention and access, **open**), D-024 (branding, output and acknowledgement wording, **open**), D-025 (communications integration, **open**), AT-20, AT-27, AT-36, AT-37.

DK-01 is classed **N — new design candidate**. The register's own evidence note is explicit: *"Exact issued-document detail and module attachments exist. Contextual Help has an HTML preview. A central document/knowledge operational workspace was not found on main."* Verified against the r02 design index at `d0a660d2` and the file list of open PR #214: no document register, viewer or issue centre exists on main or in any open contribution.

**Dependency position.** DK-01 blocks nine register entries — EQ-05, EQ-08, EQ-09, EN-03, DK-02, DK-03, DK-04, DK-06 and AI-03. Only EQ-01 blocks as many, and EQ-01 is already built at r02.

---

## 2. Governing sources

| Source | What it fixes for this design |
|---|---|
| [Minimum document, issue and distribution contract, r07](https://github.com/deanrfiedler-gif/powerplants-one/blob/d0a660d21d52cd9128ee996ce2025bf11285a1b8/docs/contracts/document-issue-distribution.md) | Ownership and content identity; output register; generation and issue protocol (seven steps); revision, material change and withdrawal; the **distribution and acknowledgement evidence matrix**; permissions, retention and outage handling; naming |
| [Migration 0006 — job packs](https://github.com/deanrfiedler-gif/powerplants-one/blob/d0a660d21d52cd9128ee996ce2025bf11285a1b8/db/migrations/0006-job-packs.sql) | `pack_templates`, `pack_sources`, `pack_source_locations`, `pack_revisions`, `pack_checks`, `pack_render_jobs`, `pack_render_attempts`, `pack_issues`, `pack_issue_events`, `pack_recipients`, `pack_acknowledgements`, `pack_distribution_events` — exact columns, CHECK constraints, immutability triggers |
| [Migration 0009 — service reports](https://github.com/deanrfiedler-gif/powerplants-one/blob/d0a660d21d52cd9128ee996ce2025bf11285a1b8/db/migrations/0009-service-reports.sql) | `report_templates`, `report_revisions`, `report_reviews`, `report_render_jobs`, `report_issues`, `report_presentations`, `customer_responses` |
| [Migration 0011 — Finance handoff](https://github.com/deanrfiedler-gif/powerplants-one/blob/d0a660d21d52cd9128ee996ce2025bf11285a1b8/db/migrations/0011-finance-handoff.sql) | `finance_templates`, `finance_render_jobs`, `finance_issues` — the restricted OUT-14 path |
| [Service data dictionary](https://github.com/deanrfiedler-gif/powerplants-one/blob/d0a660d21d52cd9128ee996ce2025bf11285a1b8/docs/contracts/service-data-dictionary.md) | `DocumentReference`, `DocumentTemplate/Policy`, `IssueManifest`, `DistributionEvent`, `PackFollowUp` definitions and their stated limits |
| [BP-01 §16.1 output register and §16.2 SharePoint boundary](https://github.com/deanrfiedler-gif/powerplants-one/blob/d0a660d21d52cd9128ee996ce2025bf11285a1b8/docs/blueprints/BP-01-master-blueprint.md) | OUT-01–OUT-18 catalogue; "generated, approved, issued, sent, delivered and acknowledged are separate events"; the mutable-latest-link prohibition |
| [PPO-STD-001 §10.2, §11.1, §11.2](https://github.com/deanrfiedler-gif/powerplants-one/blob/d0a660d21d52cd9128ee996ce2025bf11285a1b8/docs/standards/naming-conventions.md) | Reference type catalogue including **TRN transmittal**; synthetic output filename patterns; the drawing-number rule |
| [Shared UI style specification §7](https://github.com/deanrfiedler-gif/powerplants-one/blob/d0a660d21d52cd9128ee996ce2025bf11285a1b8/docs/standards/ui-style-specification.md) | Seven required baseline elements; token core; declared viewports; change record |
| [HTML module scope and design conformance, r01](https://github.com/deanrfiedler-gif/powerplants-one/blob/design/quotation-approval-issue-distribution-r01/docs/standards/html-module-conformance.md) | The nine-field package declaration and the r20 page-type catalogue. **Not on `main`** — it is in open PR #212. See §12.7 |
| Coverage register r06, DK-01/DK-02/DK-03 | Page scope, priority P1, reviewer role, three suggested checks, dependencies |
| Work Orders r01, Quality & Site Assurance r01 (#208), My Work r01 (#209) | The current standalone-module delivery shape: deterministic builder, r20 theme, embedded Roboto, fixed Willowbank context, local roles, storage, backup, fixed clock, scripted assistant, model + native browser checks, evidence JSON |

Assumed, not verified: the r20 theme board (SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`, as recorded by both the DK-04 and ES-05 reports) remains the current presentation authority. If a later board has been issued, its file and revision must be supplied before build.

### 2.1 Required conformance declaration

PPO-UI-CONFORMANCE r01 requires every new module to carry this declaration in the report and repeat the scope ID and design revision in the HTML.

| Field | This package |
|---|---|
| Scope identity | **DK-01 Document register and linked library**, with DK-02 and DK-03; coverage register r06; parents DOC-01–DOC-06 |
| Page type | Primary **Document & evidence workspace**; supporting **Register / worklist** for the library and issue queues, **Record detail** for the document, **Review / comparison** for revision and issue comparison |
| Reused components | r20 workspace page title, context strip, scoped tabs, named state badges, metrics, register/cards, action footer, 292 px supporting column, native decision dialogs, **448 px right-side inspection panel** for manifests and snapshots |
| Source authority | Contract / Dictionary / Proposed marking on every element (§0); source hashes retained for the theme board and every fixture manifest |
| Incoming handover | An approved or checked source revision from its owning module — pack, report, Finance handoff or quotation issue. This module never makes that approval decision |
| Outgoing handover | Issue identity, exact bytes and hash, recipient list and acknowledgement evidence. Customer acceptance, commercial negotiation and Finance processing stay with their owning modules |
| Exceptions and recovery | Normal · missing or moved source · stale source at render · returned check · read-only classification · failed storage or finalisation · unknown delivery · superseded and withdrawn |
| Departures | The cross-domain register is a **proposed generalisation** of pack-scoped `pack_sources` (§12.3); facility applicability has no API field (§12.4). Both labelled in the HTML |
| Verification | §10 below. Model and native browser checks, three documentation checks, marker scan, hash-bound evidence; native visual and device review reserved for Dean |

---

## 3. Scope boundary

### 3.1 In scope for r01

- A register of permitted documents and issued outputs, with attention queues, compound filters, sort and selection.
- One document workspace: identity, provider/item/version, content hash, byte count, owner, classification, availability projection, applicability, linked business records and revision history.
- Revision and review: check or return against an exact revision with reason; demonstration that editing invalidates a completed review.
- Issue and manifest: exact source and template IDs, versions and hashes; reserved preparation time distinguished from actual issue time; output bytes, hash and filename; adapter key; renderer version.
- Distribution and acknowledgement: recipients, the seven-fact evidence matrix per recipient, distribution event timeline, acknowledgement bound to the exact presented hash.
- Exceptions and recovery: render job states, storage-success/database-failure reconciliation, stale source, missing source version, repository unavailable, withdrawal and supersession.
- Eight rendered UI states, five local preview roles, local storage with validated backup and restore, fixed clock, scripted source-scoped assistant.
- Contract-exact check scripts and hash-bound evidence.

### 3.2 Out of scope for r01 (stays in its own module)

- Approving a quotation, deciding its terms or capturing customer acceptance — **ES-05 and ES-06**.
- Preparing, checking or issuing a job pack as a pack workflow — **Job Pack r03** and the P06 runtime.
- Reviewing a service report, correcting it or capturing the customer response — **SV-06 Service Review r02** and the P09 runtime.
- Finance handoff, allocation, reconciliation or any financial definition — **Finance r02** and P10.
- Knowledge article authoring, review and publication — **DK-04** (built, PR #214) and **DK-05**.
- Template authoring, approval and publication — **DK-06** (§12.2).
- Drawing register, discipline, native CAD relationships and supersession — **EN-03**.
- Any real permission, authentication, server validation, SharePoint operation, retention policy, email or outbound message.

### 3.3 Proposed extensions (labelled in the HTML, decided by Dean — §12)

- One cross-domain register spanning pack, report, Finance and quotation outputs (today `pack_sources` is site- and pack-scoped, and the dictionary states plainly: *no general document store*).
- Facility / growing-area / irrigation-block applicability on a document, so a site-wide document need not apply to every area.
- A transmittal (**TRN**) grouping several documents into one issue — the reference type exists in PPO-STD-001 §10.2 with no implementation.
- A "source changed since issue" watch over documents whose source version has moved on since an issue referenced it.

---

## 4. Information model the page must present

### 4.1 Document reference — Contract (`pack_sources`)

| Field | Rule |
|---|---|
| `id` | UUID; the identity. Never derived from a filename |
| `provider` | CHECK `provider='Synthetic'` — the only implemented provider |
| `item_id`, `version_id` | Source identity and version; `UNIQUE(workspace_id, item_id, version_id)` |
| `title` | Document title; not an identity |
| `media_type` | CHECK `media_type='text/plain'` — the runtime limit. PDF/HTML bytes live on the **issue**, not the source |
| `access_class` | RestrictedService · RestrictedFinance · Internal |
| `owner_id` | FK to users; the accountable owner |
| `byte_count` | CHECK `>0` |
| `content_hash` | CHECK `~ '^[a-f0-9]{64}$'`; SHA-256 |
| `company_id`, `site_id` | Composite FK to `sites`; a source is site-scoped today |
| Immutability | `BEFORE UPDATE OR DELETE` trigger. A corrected source is a **new record**, never an edit |

### 4.2 Availability and naming are projections — Contract (`pack_source_locations`)

`display_name`, `available` and a projection `version` sit in a **separate table** from the immutable source row. The design must make this visible rather than merely true: renaming or moving a document in the repository changes the projection; the identity, version and hash that an issue referenced do not change. This is DOC-01 rendered.

The register must therefore show, for every row, both *what it is called now* and *what the issue referenced*, and must show **Availability: unknown** rather than false when the projection has not been refreshed. BP-01 §16.2 is explicit: a mutable "latest file" link is not historical issue evidence.

### 4.3 Working, approved and issued — Contract, DOC-02

Three states that must never collapse into one another:

| State | Runtime evidence | Rule the page enforces visibly |
|---|---|---|
| Working attachment (OUT-16) | P07 field attachments only: Pending · Uploaded · Quarantined · Available · Rejected | A working attachment alone is not approved issue evidence. The general working-attachment store is **Dictionary**, not Contract |
| Approved / checked | `pack_checks` — decision Checked · Returned, reason, actor, `revision_id`, `content_hash`, immutable | A Checked/Reviewed state freezes the input revision. **Editing invalidates that review** |
| Issued | `pack_issues` — `manifest`, `output_hash`, `snapshot_hash`, `issued_by`, `issued_at`, immutable | An operational copy may exist before formal issue but must show its status |

### 4.4 Issue manifest — Contract

Exact source and template IDs, versions and hashes; source snapshot hash; stable adapter key; PDF/HTML/bundle bytes and hashes; filename and revision; **reserved issue time**; renderer and browser versions.

The single most instructive detail in the contract: because exact bytes must be durable before the issue transaction, the rendered file prints a **reserved issue timestamp and issue UUID, effective only on release**. Actual release is a later immutable database timestamp. The page must render these as two different facts in two different places and must never present a reserved time as `issued_at`. While a render job is live the UI says **Preparing output**, not Issued.

### 4.5 Issue lifecycle events — Contract (`pack_issue_events`)

`kind` CHECK ∈ **Issued · ReviewRequired · Superseded · Withdrawn**, each with a reason, actor and time, immutable. Supersession and withdrawal are **events and projections** — the manifest itself is never mutated. A withdrawn issue remains recoverable to authorised users with its withdrawal reason and time.

### 4.6 Distribution and acknowledgement — Contract

`pack_recipients` (issue, assignment, assignment version, user, `required`), `pack_distribution_events` (`kind` CHECK ∈ **TaskCreated · SimulatedSent · Opened · Downloaded**, evidence, actor, time, immutable), `pack_acknowledgements` (`presented_hash` SHA-256, `captured_at`, `acknowledged_at`, `operation_id` idempotency, `UNIQUE(workspace_id, recipient_id)`, CHECK `captured_at <= acknowledged_at + interval '5 minutes'`).

The evidence matrix below is rendered as a per-recipient table. It is the reason the module exists.

| Fact | Evidence required | Must not be inferred from |
|---|---|---|
| Generated | Durable render attempt with hash, template and source snapshot | A button click or a queued job |
| Approved / checked | Reviewer, exact source revision, time, delegated decision | A generated PDF |
| Issued | Immutable issue event, durable exact output, authorised recipients | Approval alone |
| Sent | Recorded channel action and evidence, or an explicitly simulated event | File or link creation |
| **Delivered** | Supported channel evidence of delivery | **Sent state, or the absence of an error** |
| Downloaded / opened | Measurable retrieval or open event, with limits | A delivery notification |
| Acknowledged | Explicit recipient response to the exact issue revision | Open or download tracking |

**Delivered has no evidence source in this prototype.** There is no `Delivered` value in the `pack_distribution_events` CHECK constraint. The row must render as *Unavailable — no channel evidence exists in this increment*, not be quietly omitted (§12.6).

### 4.7 Render pipeline and recovery — Contract (`pack_render_jobs`)

`state` CHECK ∈ **Queued · Running · Durable · Failed · StaleSource · Issued**; `attempts`, `lease_until`, `lease_token`, `error_code`, `output_manifest`, `operation_id`, `finalisation_operation_id`, `recovery_owner_id`. `pack_render_attempts.outcome` CHECK ∈ Claimed · Durable · Failed · StaleSource · Issued. A trigger makes render intent immutable and `Issued` terminal.

Behaviours the page must demonstrate, not describe:

- Step 5 of the protocol: if the checked scope, recipients, permissions or policy changed during rendering, the generated attempt is **retained and returned for review** — stale content is not issued.
- Storage succeeded, database finalisation failed: reconciliation locates the stored object by **operation ID and hash** and completes or abandons *the same attempt*. It does not blindly issue another document.
- Database request exists, no durable file: pending or failed, with an **owned recovery task**.
- A retry returns the same issue and result; it never creates a duplicate release event.

### 4.8 Revision, material change and withdrawal — Contract

New bytes require a new revision. **Cosmetic corrections are still new rendered content; the old hash or signature is never reused.** For a pack: record change summary and category, hold dispatch for a material pending change, check the new input, issue the successor, mark the predecessor Superseded, require acknowledgement from applicable recipients. For a report: the prior response is retained against the prior hash, the successor is created from reviewed evidence, and an accepted signature is **not copied** to a revised PDF. Acknowledgement is never inherited. An offline device may hold an old issue and must show its as-at.

### 4.9 Customer response — Contract, read-only here (`customer_responses`)

Choice with AcceptedWithReservations, Declined and Disputed each requiring detail; Unavailable records a reason and a next contact action with no invented signer; signature or image is optional protected evidence. The page shows the response as linked evidence bound to a specific presented hash. **It does not capture one** — SV-06 owns that surface.

### 4.10 Access, classification and retention — Contract and open decision

Authorise record and file access at every preview, download and export. The audience-filtered output must not leak internal fields through HTML, embedded metadata, attachment names or a cached payload. No tokens, private URLs, raw exception traces or author credentials in document metadata.

Retention, disposal, legal holds and source-version availability are **unresolved under D-012**. The page renders *Retention: not agreed (D-012)* on every document. It must not display a period, a disposal date or a countdown. The contract's instruction is explicit: do not introduce an arbitrary seven-year rule or other unsourced retention period.

### 4.11 Output catalogue coverage — Contract, Dictionary and planning

| Output | State in this prototype | Treatment in the page |
|---|---|---|
| OUT-09 Technician job pack | **Contract** — P06, issued, acknowledged | Full instance with manifest and recipients |
| OUT-10 Customer service report | **Contract** — P09, issued, customer response | Full instance with successor revision |
| OUT-14 Finance supporting evidence | **Contract** — P10, restricted, no customer distribution | Instance visible only to the restricted role |
| OUT-06 Customer quotation | **Contract in part** — E1 exact Draft output exists; ES-05 design in flight | Register row linking to the owning module; no approval surface here |
| OUT-08 Design/transmittal package | **Dictionary** — TRN reference type, no implementation | Labelled proposal; no fabricated drawing data |
| OUT-01–05, 07, 11–13, 15–18 | Planning identifiers only | Catalogue rows with **no instances**. The page must not invent examples to fill the table |

### 4.12 Proposed additions — Proposed

| Addition | Why | Boundary |
|---|---|---|
| Cross-domain register | Four issue implementations with no shared view is the gap DK-01 names | Labelled a proposed generalisation; no API field claimed; each row links to its owning module |
| Facility / growing-area applicability | DK-01 brief requires it; Customers r03 and Site Survey r01 define the hierarchy | Design-only; no API field exists |
| Transmittal (TRN) | PPO-STD-001 §10.2 defines the reference type | One labelled proposal row; no transmittal command, no fabricated manifest |
| Source-changed watch | DOC-01 and BP-01 §16.2 both turn on this distinction | Derived from the projection version vs the referenced version; no polling service implied |

Explicitly **not** added: a retention period; a Delivered state; a SharePoint connection status; an approved template editor; a document-level permission grant. Access is server-enforced and is not a field on this page.

---

## 5. Actors and preview roles

| Preview role | Mirrors capability | Can | Cannot |
|---|---|---|---|
| **Document coordinator** | `pack.prepare` | Register a source, record applicability and links, request an output, view manifests | Check, issue, acknowledge, see RestrictedFinance |
| **Reviewer** | `pack.check` / `report.review` | Everything above plus check or return a revision with a reason | Issue; bypass a returned decision |
| **Issuer** | `pack.issue` / `report.issue` | Everything above plus issue, supersede and withdraw with a reason | Acknowledge on a recipient's behalf; see RestrictedFinance |
| **Recipient** | `pack.acknowledge` | Read the exact issue addressed to them and acknowledge it | Read other recipients' evidence, issue, withdraw |
| **Restricted Finance observer** | `finance.read` + RestrictedFinance | Read OUT-14 evidence and its manifest | Mutate anything; distribute to a customer |

Roles are local previews demonstrating intended behaviour. They are not security. The decision record states this in the same words #197 used.

---

## 6. Views — six connected, one record collection

### 6.1 Register

Queue tiles for the current permitted scope: **Source changed since issue · Issued, unacknowledged · Withdrawn, no successor · Render failed or stale source · Availability unknown · Returned at check**. Tiles are filters, not states. Search on reference, title, item ID, customer, site and linked record. Filters: customer, site, facility (proposed), output type (OUT-xx), classification, issue state, revision currency, owner. Sort: attention first, then issue date, then reference. Selection opens the document workspace; a filter that hides the selected record clears the selection. Narrow widths render labelled cards.

**Presentation decision:** register with attention queues, **not** a board. Document states are not a pipeline, and a lane view would invite drag-to-issue, which §4.4 and the seven-step protocol forbid.

### 6.2 Document

Identity block (UUID, provider, item ID, version ID, SHA-256, byte count, media type), owner, classification, and the **identity vs projection** pair from §4.2. Applicability panel: site, facility (proposed), equipment model, validity. Linked business records: work order, appointment, pack, report, handoff, asset. Revision history with each revision's hash and its check decision.

### 6.3 Revisions and review (DK-02)

Revision selector with current and superseded. Comparison is of **metadata and manifest**, not a byte diff: which sources, which versions, which template, which reviewer, which hash. Check dialog with Checked or Returned and a mandatory reason. A demonstration control edits the input and shows the completed review going stale in place, with the reason stated.

### 6.4 Issue and manifest (DK-03)

The issue record in the 448 px right-side inspection panel: reserved preparation time and issue UUID above the line, actual `issued_at` below it, visibly different. Manifest table of source IDs, versions and hashes; template version and renderer version; output filename (`SYN-PPO-PACK-000001-job-pack-r01.pdf` pattern), bytes and `output_hash`; `snapshot_hash`; adapter key. A **verify hash** control recomputes the hash of the retained synthetic content and reports match or mismatch. Supersede and withdraw dialogs, each requiring a reason, each writing an immutable event.

### 6.5 Distribution and acknowledgement

Recipient list with assignment version. Per recipient, the seven-fact matrix of §4.6 with its evidence or an explicit Unavailable. Distribution timeline of TaskCreated, SimulatedSent, Opened and Downloaded events with their evidence text. Acknowledgement panel showing `presented_hash` against the current issue hash — and the case where they differ, so an acknowledgement held against a superseded revision reads as exactly that, not as acceptance of the current one.

### 6.6 Exceptions and recovery

Render job state machine with the six states and the attempt history. Four reconstructed scenarios: storage succeeded and finalisation failed, reconciled by operation ID and hash; database row present with no durable bytes, pending with an owned recovery task; stale source at step 5, generated attempt retained and returned; repository unavailable, last authorised cached issue shown with an honest last-known label. Retention and access panel stating D-012 and D-024 as open, with no invented values.

---

## 7. Interactive features — cross-cutting

| Feature | Behaviour | Source |
|---|---|---|
| Idempotent retry | Re-submitting an identical issue command returns the original issue and result; a changed payload against the same operation ID is rejected | Contract §4, `UNIQUE(workspace_id, actor_id, operation_id)` |
| Immutability made visible | Issued manifests, checks, events, acknowledgements and distribution events have **no edit control**, and each states why | 0006 immutability triggers |
| Eight rendered UI states | Loading · Empty · Read failed · Partial read · Denied · Saving · Saved · Conflict, reachable through a state control | Style spec §7.1 (3) |
| Keyboard | No drag anywhere; every action keyboard-reachable; native `<dialog>` with `showModal()`, Escape and focus return; native tabs with matching panel labels | Style spec §5, §5.2 |
| Local storage | Key `ppo-document-control-r01`; session-only fallback message when storage throws; explicit reset | #197 pattern |
| Backup / restore | Validated JSON export and import; a manifest whose hash does not match its content, an unknown template version and a cross-site source are rejected without replacing current data; restore requires confirmation | #197 pattern |
| Fixed clock | 16 September 2026, 10:00 AEST for repeatable queues; recorded times retained as recorded | #197 pattern |
| Scripted assistant | Source-scoped, modeless, inspectable: manifest summary; what changed between two revisions; unacknowledged recipient list; withdrawal reason draft. A stale source blocks copying a draft. No inference, no delivery claim | #197 pattern |
| Synthetic labelling | Every rendered output carries **Synthetic prototype — not for operational use** | Contract §1, STD-001 §11.1 |

---

## 8. Fixture data

Reuse the read-only Willowbank Horticulture Pty Ltd organisation, its two addressed sites and the pump in Irrigation Shed 01, continuing from Customers r03, Cases r02 and Work Orders r01, so the chain from work order to issued pack to acknowledgement is real in the demonstration. All references `SYN-PPO-…`; no migration seed, no operational record.

Six documents chosen to satisfy DK-01's three suggested checks plus the identity and recovery rules:

| Document | State | Demonstrates |
|---|---|---|
| DOC-A `SYN-PPO-PACK-000001-job-pack-r01` | Issued | Full manifest; two recipients; one acknowledged against the current hash, one outstanding; Delivered unavailable — **normal case** |
| DOC-B `SYN-PPO-RPT-000001-service-report-r01 → r02` | Superseded + successor issued | r01 acknowledged and its customer response retained against r01's hash; r02 issued with **no inherited acknowledgement**; the change was cosmetic and still produced a new hash — **interrupted/returned case** |
| DOC-C Manufacturer manual source | Moved and renamed at the repository | Projection changed, identity and hash unchanged; DOC-A's manifest still resolves the exact referenced version; availability reads **unknown**, not false — **missing-source case** |
| DOC-D `SYN-PPO-FH-000001-finance-evidence-r01` | Issued, RestrictedFinance | Visible only to the restricted role; no customer distribution route offered at all |
| DOC-E Pack revision awaiting output | Render job Durable, finalisation failed | Reconciliation by operation ID and hash; UI reads **Preparing output**; owned recovery task named |
| DOC-F Proposed transmittal (TRN) | Proposal only | Labelled Dictionary/Proposed; lists two drawing references with no fabricated content, no issue, no recipients |

---

## 9. Presentation standard

- **Theme:** r20 tokens, embedded Roboto, navy/green, shared choice menus, dialog treatment, responsive spacing. Verdana fallback. Font bytes and their combined SHA-256 declared in the change record.
- **Module only:** no rail, masthead, logo, login or global navigation (style spec §7.1 element 7; conformance standard's first reuse rule). Customer-facing document previews retain their own document masthead and do not justify a second app header.
- **Scope container:** `#ppo-document-control` with the token block declared on the container and a local reset of the `globals.css` elements, per style spec §7.1 elements 1 and 2.
- **Token core:** reuse the shared names before introducing any; declare which of the three known divergences this file adopts and record it in the change record.
- **Inspection surface:** 448 px right-side panel for manifests and snapshots; centred dialogs reserved for decisions, reasons and confirmations (conformance standard).
- **Viewports:** 1440×960, 1024×768, 820×800, 390×844; no horizontal overflow at any of them; 320 px CSS treatment.
- **Fixtures with real references** (§7.1 element 4) and a **sibling change record** (element 6).
- Australian English; dd Month yyyy in prose; ISO 8601 in filenames; no amounts appear in this record, so no AUD or GST is shown; units on any measurement.

---

## 10. Verification plan

| Check | Tool | Pass condition |
|---|---|---|
| Model checks | `scripts/check-document-control-model.mjs --write-evidence` | All named checks pass; evidence JSON bound to the HTML's SHA-256 |
| Contract fidelity | Assertions inside the model check | Every CHECK constraint in §4.1, §4.5, §4.6 and §4.7 enforced by the model; `Delivered` absent from the distribution event kinds; no retention period rendered anywhere; reserved time and `issued_at` are distinct fields; a cosmetic revision produces a new hash; acknowledgement is not inherited by a successor; a moved source changes only the projection; identical retry returns the original issue |
| Role boundaries | Model check | Coordinator cannot check or issue; reviewer cannot issue; issuer cannot acknowledge; recipient sees only their own evidence; only the restricted role sees OUT-14 |
| Composition | Model check | Only the module; six accessible views; single `#ppo-document-control` scope container; token names match the declared source; embedded font bytes match the declared hash |
| Eight UI states | Model check | Each reachable and distinct |
| Storage | Model check | Reload retains issues, manifests and hashes; a hash-mismatched backup is refused; restore requires confirmation |
| Native rendering and interaction | `scripts/check-document-control-browser.mjs` | Groups pass with zero page or console errors; five viewports measured; 0 px horizontal overflow; phone targets ≥ 44 px |
| Documentation | `check_foundation.py`, `check_prototype.py`, `check_naming.py` | All pass; 78 parents intact; instructions ≤ 8,000 characters |
| Conflict markers | `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | None |
| Whitespace | `git diff --check` | Clean |
| Determinism | Re-run the builder from a fresh clone | Committed HTML reproduced byte for byte |
| Native visual review | Dean, in a browser | **Not claimable from this environment.** Desktop geometry, dialog top-layer behaviour, 320/390 physical devices, zoom and print remain for Dean's review |

Target: **at least 55 model groups and 30 native browser groups**, in line with Work Orders r01 (62), order fulfilment (40 + 32) and ES-09 (39 + 29). The number is a floor, not the acceptance.

If the pinned Chrome channel is unavailable, record the substitute browser and its version explicitly and state that it is not evidence for the pinned runtime, as the ES-09 package did.

---

## 11. Deliverables and naming

| Deliverable | Path |
|---|---|
| Design HTML | `docs/reference/ui/document-control/PPO-Document-Control-and-Controlled-Publication-r01.html` |
| Detailed companion report | `docs/reference/ui/document-control/PPO-Document-Control-and-Controlled-Publication-Report-r01.md` |
| Maintainable sources | `docs/design/document-control/` — template, fonts, workspace.css, model.js, workspace.js, README |
| Deterministic builder | `scripts/build-document-control.py` |
| Model check | `scripts/check-document-control-model.mjs` |
| Native browser check | `scripts/check-document-control-browser.mjs` |
| Focused workflow | `.github/workflows/document-control-design.yml` |
| Decision and receiving handover | `docs/decisions/document-control-design.md` (`PPO-DK01-DES`) |
| Change record (§7.1 element 6) | `docs/reference/ui/document-control/PPO-Document-Control-and-Controlled-Publication-r01-change-record.md` |
| Verification evidence | `docs/testing/evidence/document-control-r01/README.md` (`PPO-DK01-VERIFY`) |
| Index row | `docs/reference/ui/README.md` — Shared customer and platform pages table (index rule 3) |
| Register rows | `docs/standards/document-register.csv` — design, HTML, change record, verification |
| Status row | `docs/STATUS.md` §3 Shared platform, Design-only column |
| Entry links | `README.md`, `docs/README.md` |
| Branch / PR | `design/document-control-r01` → PR `design: Document Control & Controlled Publication workspace r01` |

The PR description follows the repository template and states: sources and their commits, hashes, checks run and their results, what is not verified, no application, migration or deployment change, and that publication is not approval.

**Note on the workflow file.** The GitHub connector's app has no workflow scope — writing `.github/workflows/*.yml` returns 403 (demonstrated in the ES-09 session). If the branch is pushed through the connector rather than by git, the workflow file is the one deliverable that will need to land another way. Plan the push route before build, not after.

---

## 12. Decisions required before build

| # | Decision | Recommendation | Consequence of the alternative |
|---|---|---|---|
| 1 | Module span: DK-01 + DK-02 + DK-03 in one workspace, or DK-01 alone | **All three.** A register without the revision and issue sides is a list of filenames; the precedent is SV-06/07, MA-01–05, FI-03–06 and SC-05–07 | DK-01 alone is thin, and DK-03 — which SV-05 depends on — stays unbuilt |
| 2 | DK-06 template management | **Out of r01.** Show the template version and renderer on each issue, read-only | A seventh view with a different reviewer and no runtime editor; the module loses focus |
| 3 | Cross-domain register generalising pack-scoped `pack_sources` | **Include, labelled a proposed generalisation.** State in the HTML that no general document store exists | Restricting the page to job-pack sources reproduces the gap DK-01 was raised to close |
| 4 | Facility / growing-area applicability | **Include as a proposed extension**, visibly labelled; no API field claimed | DK-01 brief unmet; a site-wide document silently applies everywhere |
| 5 | Retention display | **Show "not agreed (D-012)".** No period, no disposal date, no countdown | Inventing a retention rule the contract explicitly forbids |
| 6 | Delivered state | **Render the row as Unavailable — no channel evidence.** | Omitting the row hides precisely the distinction DOC-05 exists to protect |
| 7 | Conformance standard dependency | **Branch after PR #212 merges** so `html-module-conformance.md` binds from `main`; if #212 stalls, declare against the PR copy and pin its blob SHA in the decision record | Building against a standard that may change in review, or silently ignoring it |
| 8 | Build method | **Deterministic builder** in `docs/design/document-control/` plus `scripts/build-document-control.py`, matching the last five packages | A hand-authored single file cannot be reproduced byte for byte from a fresh clone |
| 9 | Start condition | **Resolve the `Check documentation foundation` failure first.** It is failing on #214, #216, #217 and #218 — all four touch `docs/reference/ui/README.md`, `docs/standards/document-register.csv` and `docs/STATUS.md`, and so does this package | A tenth branch inherits the same failure and adds a tenth conflicting row to the same three files |

---

## 13. Build sequence

Each phase has an exit criterion. No phase is reported complete on the basis of having been attempted.

| Phase | Work | Exit criterion |
|---|---|---|
| 0 Preconditions | Decisions §12 recorded; clean `main` head confirmed; theme board hash confirmed; conformance standard source pinned; push route for the workflow file settled | Head SHA and source hashes written into the decision record |
| 1 Model and fixtures | In-file data model matching §4; six documents from §8; template and policy versions; role matrix | Model validates its own starter; every CHECK constraint in §4 encoded once |
| 2 Register and document | Views 6.1 and 6.2; queues, filters, selection; identity vs projection | Filter and selection checks pass; moved-source case renders correctly |
| 3 Revisions and review | View 6.3; check and return; review invalidation on edit | Stale-review and returned-decision checks pass |
| 4 Issue and manifest | View 6.4; reserved vs actual time; manifest; hash verification; supersede and withdraw | Hash verify, supersession and withdrawal checks pass |
| 5 Distribution and acknowledgement | View 6.5; evidence matrix; acknowledgement against presented hash | Delivered-unavailable and superseded-acknowledgement checks pass |
| 6 Exceptions and recovery | View 6.6; four scenarios; retention and access panel | Reconciliation and no-retention-value checks pass |
| 7 States, roles, storage, assistant | Eight states; five roles; storage, backup, restore; fixed clock; assistant | Role and storage checks pass; all states reachable |
| 8 Checks and evidence | Both check scripts; `--write-evidence`; deterministic rebuild from a fresh clone | ≥ 55 model and ≥ 30 browser groups pass; evidence bound to the HTML hash; zero diff on rebuild |
| 9 Documentation and PR | Decision record; report; change record; index row; register rows; STATUS row; README links; three doc checks; marker scan | All checks pass on the pushed head; PR opened with the template and the §2.1 declaration |

---

## 14. Risks and failure modes

| Risk | Effect | Control |
|---|---|---|
| Inventing a retention period | The page asserts a disposal rule the business has not agreed | §12.5; check asserts no date-interval or period string appears in any retention field |
| Inferring Delivered from Sent | The distinction DOC-05 protects is destroyed in the demonstration | §12.6; check asserts `Delivered` is absent from the event kinds and present only as Unavailable |
| Duplicating ES-05's approval decision | Two modules appear to approve the same quotation | §3.2; the quotation appears only as a register row linking to its owning module |
| Implying a SharePoint connection | A synthetic adapter reads as an integration | Every provider reads `Synthetic`; §16.2 boundary quoted in the page; decision record states it |
| Fabricating OUT rows | Fifteen planning identifiers acquire fake instances | §4.11; check asserts catalogue rows without instances render as empty, not populated |
| Acknowledgement inherited by a successor | The core revision rule is misrendered | DOC-B fixture; check asserts r02 has zero acknowledgements while r01 retains its own |
| Hash reused on a cosmetic change | Issued-byte integrity claim becomes false | DOC-B is deliberately cosmetic; check asserts the hashes differ |
| Availability projection mistaken for identity | A moved document appears to invalidate an issue | DOC-C fixture; check asserts the manifest still resolves the referenced version |
| Drawing number reallocated by a title change | STD-001 §11.2 breached in the TRN proposal | DOC-F carries references only, with no editable drawing number |
| Shared-file conflicts with nine open PRs | `document-register.csv`, `STATUS.md`, `docs/reference/ui/README.md` | §12.9; branch after the foundation check is green; rebase before PR |
| Workflow file cannot be pushed | The focused CI job is missing from an otherwise complete package | §11 note; settle the push route in phase 0 |
| jsdom stubs mistaken for visual acceptance | Native dialog, scroll and geometry unverified | Decision record and PR state the limit in the same words as #197 |
| Instruction-length ceiling | `chatgpt-project-instructions.md` sits near 8,000 characters | This design adds nothing there |

---

## 15. What this page will not claim

Design acceptance is acceptance of presentation only. It is not implementation, browser, print, accessibility, business or Finance acceptance, and it creates no data contract. A value in a fixture never becomes a server contract. Local roles are not permissions. A content hash proves byte identity of synthetic content, not retention, authenticity or legal effect. Rendering the evidence matrix does not mean the prototype can establish delivery. The register is a proposed generalisation, not an existing document store. SharePoint remains the intended authority for business documents, native CAD retains authoring and dependencies, and MYOB remains the ERP authority; none of them is touched by this package.
