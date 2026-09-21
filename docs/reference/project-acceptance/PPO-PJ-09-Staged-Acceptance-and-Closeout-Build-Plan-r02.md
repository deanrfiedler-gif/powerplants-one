---
document_id: PPO-PJ-09-PLAN
revision: r02
date: 2026-09-20
application: Powerplants One
module: PJ-09 — Staged Acceptance & Closeout
principal_requirements: PRJ-06; PRJ-08
retained_parent_scope: PRJ-01–PRJ-08
dependencies: EN-08; SV-06
status: Mockup-aligned build specification with VS Code prompt; implementation and acceptance pending
repository: deanrfiedler-gif/powerplants-one
source_commit: 98aa2b47a1f13e3d9fdd10984b088b7b00801548
source_tree: 1f70e2369740374fd2e3bed218823825918740d9
ui_basis: Actual theme board r22; shared application shell; My Work collapsible menu; latest PJ-09 desktop mockup r01
ui_reference: PPO-PJ-09-Staged-Acceptance-and-Closeout-Desktop-UI-Mockup-r01.png
companion_prompt: PPO-PJ-09-Staged-Acceptance-and-Closeout-VS-Code-Build-Prompt-r01.md
supersedes: Build Plan r01 reference/delivery wording; functional scope and acceptance matrix retained
delivery_boundary: Updated plan and implementation prompt only; no runtime implementation, repository mutation or deployment
---

# PJ-09 — Staged Acceptance & Closeout

**Powerplants One · Detailed server-backed application build plan · r02 · 20 September 2026**

## 1. Purpose and success definition

Build a Projects workspace that brings a defined part of a project from commissioning evidence to independently recorded technical acceptance, customer acceptance, Service receiving and commercial closeout. It must preserve the exact facility, greenhouse compartment, growing area, irrigation block, system, assets and revisions covered by each decision.

The workspace must answer: **What has been accepted, by whom, against which evidence, what remains outstanding, and what prevents this stage or project from being closed?**

PJ-09 is the page identifier in Coverage Register r06. Its explicit dependencies are **EN-08 — Commissioning Basis & As-Built Release** and **SV-06 — Service Review & Controlled Reports**. Its principal delivery requirements are PRJ-06 and PRJ-08; retain the register's broader PRJ-01–PRJ-08 relationships. BP-06 assigns staged acceptance and closeout to J5 and explicitly separates these decisions from milestone completion. [S01][s01] [S02][s02] [S03][s03]

A successful local journey lets a coordinator prepare a greenhouse acceptance stage, resolve missing evidence, issue an exact handover package, record an attributable customer response, obtain a separate Service receiving response, and complete a guarded closeout review. One area may be accepted while another remains blocked. Original failures, reservations, rejected submissions, superseded packages and remaining obligations survive refresh and application/database restart.

No universal green status or completion percentage should conceal these separate outcomes. A completed Gantt task does not establish technical acceptance. A document download does not establish customer acceptance. Naming a Service owner does not establish that owner's acceptance. Technical release does not settle a variation, start a warranty or establish payment entitlement.

This plan prepares a local Next.js/TypeScript/PostgreSQL implementation using synthetic data. It does not claim that PJ-09, EN-08 or the broader Service design is already implemented. The latest PJ-09 desktop mockup r01 now illustrates this specification. It is the composition reference for the companion VS Code Build Prompt r01; the written workflow/evidence rules and actual r22 components remain authoritative.

### 1.1 r02 change record

This is a focused update after the desktop mockup was generated and the user requested implementation instructions. It records that image and the companion prompt, fixes future-deliverable wording and adds attachment/startup guidance. Sections 3–17, 19 and 21–22 are unchanged from r01. Section 20 only refreshes its mockup-reference wording: the 56 planned checks and verification requirements are unchanged. No new business scope or completion claim is introduced.

“Server-backed application” means the functioning Powerplants One module in the existing application, with database persistence and server-side authority. The implementation prompt targets the user's VS Code checkout and running local server; hosted deployment remains a separate action under the repository's deployment workflow.

## 2. Verified foundation and source precedence

For this r02 update, repository main was refreshed and remains `98aa2b47a1f13e3d9fdd10984b088b7b00801548`, tree `1f70e2369740374fd2e3bed218823825918740d9`. The r01 source investigation therefore remains applicable at this checkpoint; the actual VS Code checkout must still be reconciled before implementation. The complete tree, design index, current project service, J1 reconciliation, project blueprint, acceptance procedures, document contract, shared operation service and actual My Work sources were reviewed. No dedicated PJ-09 design was located in the current index/tree. That observation is not a claim about every unpublished branch or private local file.

The current EN-08 Build Plan r02 was read as the incoming contract. Its earlier repository checkpoint remains historical; the PJ-09 plan uses the newer checkpoint above.

| Foundation | Observed position | Consequence for this build |
|---|---|---|
| Projects runtime | Existing Project/ProjectTask identities, scoped register and manual Gantt schedule, saved schedule history, operation receipts | Extend the same project UUIDs and PRJ references; preserve current Gantt behaviour and historical receipts |
| Project completion | Current service returns Active in bounded create/task commands; J1 reconciliation says controlled acceptance/closure is absent | Add an explicit closure contract and update affected readers/writers; do not reinterpret Gantt Complete or a hard-coded Active result |
| Shared follow-up | Shared Activities exist; J1 reconciliation identifies missing typed Project links | Recheck current checkout, then add the minimal typed Project/acceptance linkage if still absent; do not create a second task system |
| Delivery Readiness & Change Control | Separate six-view design, with its own implementation limits | Link readiness/change records where implemented; do not copy its whole programme or commercial engine into PJ-09 |
| EN-08 | Current detailed r02 plan and preferred desktop composition | Consume exact commissioning/as-built release scope and obligations; do not claim plan delivery proves runtime availability |
| SV-06/SV-07 | Dedicated r02 standalone design; bounded P09/P10 services also exist | Reuse applicable service review/report records; implement a distinct receiving contract where that capability is missing |
| Documents | Existing controlled issue, durable bytes, source/recipient checks and immutable history for selected outputs | Extend the shared framework only as required for OUT-13; verify actual template/output support instead of assuming it exists |
| My Work | Actual application shell/CSS provide menu, responsive overlay and scoped preferences | Reuse or carefully extract the menu primitive; preserve My Work appearance and behaviour |
| Runtime/tooling | Package specifies Node 24.21.0, npm 11.19.0; README specifies PostgreSQL 16.15; STATUS lists migrations through 0028 with 0016 reserved | Recheck the local checkout, live schema and migration registry before implementation; do not allocate a migration number from this report |

Read current and nested `AGENTS.md`, `README.md`, `docs/STATUS.md`, relevant services, live schema and package scripts at implementation start. Preserve newer work and issued source snapshots. Existing standalone HTML evidence is useful design evidence, not an authenticated server implementation. [S04][s04] [S05][s05] [S06][s06] [S07][s07] [S08][s08]

Apply source precedence by responsibility:

1. Current user instructions and this plan's explicit scope/domain requirements.
2. Actual r22 theme components and supplied specimens for visual styling; actual shared shell and My Work source for shell/menu behaviour.
3. Current EN-08 r02 plan for incoming technical handover semantics and the user-approved refinements retained here.
4. The latest PJ-09 desktop mockup r01 for composition, subject to the written contract; see section 18.1 for its exact identity.
5. Earlier project/service designs for behaviour where they do not conflict with newer decisions.

The supplied `powerplants-one-theme-style-board-r22(3).html` was inspected directly. SHA-256: `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`. The upload suffix `(3)` is not a new revision. The repository r22 reference is source S12. Use actual component specimens and loaded fonts; matching a few hex colours is insufficient.

## 3. Scope and ownership

### 3.1 Included local increment

- Six working route-backed views, accessible from Projects and a permitted project record.
- Versioned acceptance stages with exact included/excluded scope, shared dependencies and a complete project scope ledger.
- Individually evidenced requirements, source currentness, technical review references, defects, residual work, training, manuals and assets.
- Exact handover manifests and separate customer response, Service receiving and commercial decisions.
- Guarded stage closeout, explicit project closure and controlled reopening/amendment history.
- Scoped server permissions, durable commands, concurrency, immutable decisions and recovery after an unknown outcome.
- Synthetic fixtures demonstrating normal, blocked, partial, returned, stale, restricted and interrupted cases.
- Responsive review, accessible forms, actual r22 visual conformance, focused tests and a developer handover.

### 3.2 Boundaries

PJ-09 coordinates acceptance evidence. Engineering/Quality retain test criteria, competent review and hold-release authority. EN-08 retains commissioning results, redlines and as-built issue. Service retains its work/report and support receiving authority. Finance/Commercial retain financial facts, disputed claims and commercial decisions. Equipment retains installed-base identity/configuration.

The local increment sends no email, customer message, purchase order, ERP posting, invoice, credit, payment request or equipment command. It uses labelled synthetic source and recipient adapters where adjacent implementations are unavailable. An actual API integration may replace such an adapter later without changing historical synthetic decisions into real ones.

No live contract interpretation, statutory sign-off, operating permit or warranty rule is invented. Record supplied authoritative facts and explicit local fixture policy. Offline approval/issue/acceptance is not included; online recovery and honest unsaved/outcome-unknown states are required.

The current Project customer/site identity remains fixed. Stage scope may contain several facilities/areas within that permitted site. Cross-site projects, bulk scope migration, project cancellation, retention accounting and a general commercial contract engine remain separate increments.

### 3.3 Responsibility map

| Subject | PJ-09 owns | Authoritative source / receiving owner |
|---|---|---|
| Acceptance stage | Stage identity, scope revision, requirements, requested decisions and closeout history | Existing Projects identity and approved scope/contract references |
| Technical readiness | Readable exact evidence and missing/reassessment requirements | EN-08; Engineering/Quality reviewer and applicable hold owner |
| Defects/retests | Scope links, blocker explanation and follow-up ownership | Existing Quality/inspection/Service defect and retest records |
| Remaining obligations | Stage-specific obligation, ownership and receiving evidence | Source owner; My Work displays the same underlying action |
| Customer acceptance | Attributed response to exact issued scope; validated application of that response | Named customer representative and verified authority basis |
| Service receiving | Exact manifest/request, destination and independently returned response | Named Service recipient with current scope/capability |
| Commercial closeout | Requirement/evidence list and attributable decision | Authorised commercial reviewer; Finance/MYOB facts remain separate |
| Documents | Stage pack composition, review and issue request | Shared document/issue service; intended SharePoint authority |
| Warranty/maintenance | Source-linked handed-over context and outstanding requirements | Warranty/maintenance/contract owners; no date inferred from this screen |
| Project closure | Explicit complete-scope closure snapshot and controlled lifecycle transition | Scoped project closure authority plus all required independent decisions |

## 4. Information architecture and routes

Use **Register / worklist** as the primary r20 page-type family, styled with r22 components. Supporting types are **Work queue + persistent detail**, **Review / comparison**, **Document & evidence workspace**, and focused **Form / guided workflow** dialogs. These are composition categories, not a direction to restore older r20 styling. [S13][s13]

| Menu destination | Proposed canonical route | Purpose |
|---|---|---|
| Acceptance register | `/projects/acceptance` | Find a stage, compare its distinct decisions and identify the next requirement |
| Scope & readiness | `/projects/acceptance/readiness` | Inspect exact included/excluded scope, dependencies and decision requirements |
| Defects & outstanding work | `/projects/acceptance/outstanding` | Resolve blockers or agree an eligible residual obligation without erasing its source |
| Training & handover | `/projects/acceptance/handover` | Review training/manual/configuration evidence and exact customer/Service handover packs |
| Acceptance & closeout | `/projects/acceptance/closeout` | Record independent decisions and perform stage/project closeout review |
| History | `/projects/acceptance/history` | Inspect immutable revisions, issued bytes, responses, corrections and reopening |

Record detail: `/projects/acceptance/stages/:id`. Project context is a validated `project` query parameter; a validated `stage` parameter can open the same inspector within a view. Existing project detail gains an Acceptance & closeout link. Final route names must be reconciled against the actual route/module registries; preserve the purpose and stable identity if routing conventions require an adjustment.

Keep selected project, permitted stage, view, search/filter/order and list position when navigating within the workspace. Browser Back restores prior state. A hidden/revoked stage must not be revealed by a remembered URL. Global register mode shows project identity in each row; project mode shows it once in the context strip.

Avoid a seventh dashboard or a second set of six horizontal tabs. Each view has a clear working surface, contextual controls and the same inspector pattern. Exported/shared URLs contain ordinary permitted identifiers/filter values, never document tokens or confidential narrative.

## 5. Desktop UI specification

### 5.1 Shared shell and compact heading

Reuse the application shell, navy rail, existing logo, global search, quick add, information/help, notification and account controls. The shared header owns these controls. Do not add a second app masthead or module icon stack.

Use **Projects / Staged Acceptance & Closeout** in the breadcrumb. The active subview is apparent from the menu and toolbar. Remove the repeated Powerplants One breadcrumb wordmark if needed to fit, using the shared breadcrumb mechanism. Keep logo branding in the rail.

Do not add a large page title, module-code kicker or explanatory subtitle above/below it. Place help in the existing page guide. Use a compact project selector/context strip with customer and site, then the view toolbar.

### 5.2 Collapsible menu — mandatory My Work match

**The collapsible left menu must be styled and behave the same as the menu on the actual “My work” page.** Use `src/activities/components/client/my-work-shell.tsx` and `src/app/styles/my-work.css` as the sources, rather than recreating a similar-looking sidebar. [S09][s09] [S10][s10]

- White secondary menu, approximately 220 CSS px docked width, fine right divider, existing internal spacing.
- Short menu heading **Acceptance & closeout**; project context belongs in the working-area strip.
- Existing 20 px outline icons, 42 px minimum links, 12 px icon/text gap, 6 px control radius.
- Active destination uses a neutral pale surface, medium-weight text and the 3 px navy left marker. No bright green filled menu item.
- Reuse header Show menu / Hide menu and the edge chevron. Do not implement breadcrumb portals or DOM positioning workarounds.
- First-use desktop state is collapsed, consistent with the retained EN-08 requirement. This is an explicit module default adaptation: the inspected My Work source currently defaults its menu to open. Preserve that My Work default. Remember the PJ-09 user's docked choice by actor/workspace and a PJ-09 preference version; do not overwrite the My Work preference key.
- Dock at the current My Work wide breakpoint, presently 1200 px. Below it, use its dismissible overlay; phone treatment follows its current 780 px breakpoint. Temporary overlay use does not alter the remembered desktop preference.
- Preserve keyboard focus, Escape/close behaviour and return to the opener. Resizing or menu toggling changes layout, not the selected record or entered form values.
- Add pinned views only if the existing saved-view infrastructure can support them; never show decorative fake navigation controls.

If extracting a shared menu component is the least invasive approach, preserve My Work's existing render and test it. PJ-09 does not authorise a redesign of My Work.

### 5.3 Flush table edges and density

**Table headers, rows, horizontal separators and footer must meet the left and right edges of their table container. There must be no thin white gutter between the table and its container.** Toolbar and cell content retain padding; the table wrapper itself does not have horizontal padding.

Declare the module layout as `full-bleed` within the shared shell. Use one main list scroll surface with a sticky header and visible footer; a docked inspector may have its own deliberate scroll area. Do not create a second page-height shell or unnecessary nested cards. If overflow is needed, keep it in the table region, not the whole application.

Reuse the r22 List specimen's grey header, fine borders, alignment and quiet row treatment. The compact specimen uses approximately 43 px header/52 px single rows with 12 px content. For this evidence-heavy register, propose a documented readability adaptation: **14 px/20 px main content, 12 px/16 px metadata and 60–68 px two-line rows**. Keep 12–16 px internal cell padding. Rows grow naturally for essential text; no squeezed or condensed lettering.

Use subtle hover `#F8FAF7` and inspected-row tint `#EDF6E9` as retained EN-08 adaptations. Inspection is not checkbox selection or approval. Do not colour an entire row red or green for routine statuses. Default view has no bulk approval checkboxes; bulk authority decisions are outside this increment.

### 5.4 Register columns and toolbar

| Default column | Content | Approximate share |
|---|---|---|
| Acceptance stage | Human title; project/reference metadata in global mode; open-detail link | 25% |
| Area / system | Named facility/compartment/block and system; exact scope in inspector | 19% |
| Technical | Scope-matched EN-08 release/acceptance summary | 12% |
| Customer | Exact response-derived state; pending/unknown states explicit | 12% |
| Service | Receiving state for the current manifest | 12% |
| Next requirement / owner | Plain-language next step, owner and due date or Date needed | 20% |

Commercial closeout, stage revision, source-check outcome and issue identity are visible in the inspector and optional columns. Do not compress every lifecycle into default columns. Small screens must still expose these facts in detail.

Toolbar: view/filter preset and search on the left; **+ Acceptance stage** as the navy primary creation control; Filters and a modest overflow menu on the right. Secondary row can carry active filters, exact matching count, sort and column options. Show only working controls. No redundant Board/List switch unless a board is separately justified and implemented.

Filters include Project, area/system, technical/customer/Service/commercial state, outstanding requirement type, owner, known overdue/date needed, current/superseded and source-check outcome. Sort by next due date, recently changed or stage reference, with a stable ID tie-break. Null dates have a documented position.

Counts are computed from the same permitted filtered dataset; show page completeness and total semantics. Never calculate project readiness or closure from currently displayed rows. A page of ten records is not the complete project.

### 5.5 Inspector and decisions

Use a square-edged right inspector: 448 px normally, up to 480 px on a wide desktop. Dock only when the remaining list has at least about 760 px; otherwise overlay or open full detail. Use actual available container width. At phone widths, open a full-width detail view.

Inspector sections: stage title/reference and revision; exact scope; four separate outcomes; next requirement; outstanding obligations; issued handover reference; source checks; recent history. Use 20–24 px section padding, readable label/value lines and dividers between sections. Avoid a dense micro-grid of boxed cells.

Choose one contextual primary action, such as **Resolve requirement**, **Prepare handover**, **Record response** or **Review closeout**. Do not show an enabled all-purpose Complete button. Explain why a controlled decision is unavailable, with a link to the actual requirement.

Short decisions use centred r22 dialogs with exact stage/revision/scope, consequence, required reason and confirmation. Long scope or pack composition uses full record detail. Entered decision text must survive opening a permitted evidence preview and returning. A dirty form gets an explicit save/discard choice before navigation.

### 5.6 Actual r22 tokens and status meaning

| Purpose | Text / primary | Surface | Border |
|---|---|---|---|
| Main text / primary action | `#242A37` | White text on navy buttons | Existing control token |
| Secondary / metadata | `#596779` / `#667181` | White | — |
| Success | `#416D33` | `#EDF5E9` | `#D4E3CB` |
| Caution | `#80530E` | `#FFF2D9` | `#EFDBB6` |
| Failure / blocking refusal | `#993B2A` | `#FFF1ED` | `#EDC6BD` |
| Information | `#346580` | `#E9F2F8` | `#CFE0EC` |
| Neutral | `#526078` | `#EDF0F5` | Existing neutral border |
| Canvas / quiet surface | — | `#F5F6F8` / `#F6F7F9` | `#E1E5EB` / `#E9ECF1` |
| List header | `#606977` | `#EEF0F3` | List specimen border |
| Links / focus | `#355B80` / `#365D8B` | — | Visible focus outline |

Use normal-width Roboto 400/500/700 with Verdana fallback. Verify fonts load; no `scaleX`, condensed fonts or artificial letter compression. Use about 16/24 px section headings and 20 px record titles. Routine controls are approximately 40–44 px high; phone targets at least 44 px. Existing r22 small status tags have about 3×8 px padding, 5 px radius, 12 px medium text and small outline icons.

| Domain label | Presentation |
|---|---|
| Accepted / Released / Closed, for the named decision only | Success |
| In review / Requested / Received, awaiting decision | Information |
| Accepted with conditions / Reservations / Evidence needed / Reassessment needed | Caution |
| Active blocking hold / Rejected / Verified overdue required action | Failure |
| Draft / Not requested / Not assessed / Not required with approved reason / Superseded | Neutral |
| Source unavailable / Outcome unknown | Caution plus explicit uncertainty; never a false success or zero |

Not requested must have an unsent/neutral icon or none, never a completion check. Ordinary next-action descriptions remain plain text. Future due dates are neutral; missing dates are Date needed, not Overdue. Return for clarification normally uses caution, not the same treatment as a technical rejection. Green remains a brand accent; **no green primary buttons**. Do not copy Gantt-specific colours as universal state semantics.

## 6. Functional specification for the six views

### 6.1 Acceptance register

List current stages across permitted projects, with project-specific mode, search, filters, stable sorting, pagination and inspector selection. Distinguish no stages, no filter matches, loading, partial data and failed read. Create begins with permitted Project, title, existing area/system identities, coordinator and a named stage-purpose/requirements profile.

Stage creation may save a draft with missing evidence. It must not suggest that an incomplete draft can be accepted. The empty state explains the next useful action. A read-only user receives useful inspection controls without misleading edit buttons.

### 6.2 Scope & readiness

Show a scope ledger with included units, excluded units and reasons, systems/assets/configuration versions, shared dependencies and predecessor/successor stages. A scope unit is a controlled combination of location, system/function and delivery identity—not just a typed area name.

Requirements are individually listed with required-at decision, owner, source/version, evidence outcome, applicability, due date meaning and next action. Group by Technical; Defects/holds; Documents/configuration; Training; Customer response; Service receiving; Commercial. Group expansion does not change assessment.

Show full-scope results as **Ready for the named decision**, **Requirements outstanding**, **Blocked**, or **Cannot assess**. Expand the reason and exact relevant items. Missing/unavailable evidence is not a passed requirement. Do not display a weighted readiness percentage.

### 6.3 Defects & outstanding work

Show linked source defects, retests, customer reservations, incomplete deliverables and support obligations together, while retaining their record types and authority. Default columns: Item, affected scope, source outcome/blocker, owner, due, next action.

Open a source defect in its owning module; closing a PJ-09 action must not close that defect. Capture an obligation's acceptance conditions, responsible party, recipient, due basis, evidence required for completion and whether it prevents each relevant decision. Scope reassignment retains history and both owners' obligations until transfer is accepted.

Allow a proposed residual-work arrangement only for eligible nonblocking work under the policy described in section 9. It is not a generic waiver or a way to hide a failed test. Keep disputed and customer-raised items visible even if someone internally marks the task complete.

### 6.4 Training & handover

Separate evidence types: operator training, manuals, as-built references, configuration/backup references, asset list, warranty/maintenance context and remaining support obligations. Each has exact scope, source/version, owner, availability and relevant required stage.

Training records distinguish Planned, Delivered, Attendance evidenced and any separately required competency/authorisation assessment. Attendance alone is not competence. A document link alone is not proof that the recipient received the correct version. Backup available, hash/identity verified and restore verified remain distinct.

Prepare a handover manifest for a named audience and purpose. Preview exactly what the customer or Service recipient will receive, including exclusions and outstanding work. Reuse EN-08's issued content and issue infrastructure; do not reissue identical bytes merely to make another module look complete. PJ-09 may compose a broader stage-level OUT-13 pack referencing those exact technical issues.

### 6.5 Acceptance & closeout

For the selected stage, present Technical, Customer, Service and Commercial decisions as four readable sections with exact status, source/manifest revision, actor, recorded/effective time and unresolved conditions. They are parallel facts, not a forced four-step sequence.

Show received responses separately from whether they satisfy current requirements. Provide Record customer response, Review Service response, Record commercial decision, Review stage closeout and Review project closeout only where permitted. Review actions display a complete snapshot and explicit blockers. No click on a state tag should immediately commit an acceptance.

Project closeout mode must include every required stage/unit and uncaptured/unallocated project obligation, not only the selected stage. Display the scope/reconciliation policy and last successful source-check outcome. An unavailable required source blocks the decision, while permitting the user to record a draft review and owned follow-up.

### 6.6 History

Provide chronological and filterable events for scope revisions, requirements, evidence links, source changes, submissions/returns, issues, customer responses, Service receiving, commercial review, closeout and reopening. Show actor, recorded time, relevant effective date, reason, source/revision and successor links.

Open the exact historical scope snapshot and original issued bytes. Keep historical truth separate from current applicability. Corrections append a new event or successor; they never rewrite accepted signatures, original failures or issued content. Current permissions protect old labels, files and recipient metadata too.

## 7. Domain model and identity

The following is a logical contract, not an applied SQL schema. Reuse existing types and physical records where their authority matches. Keep typed foreign keys and workspace/company/project/site scope constraints. JSON snapshots can preserve exact reviewed content; they must not replace relational identity and authorisation.

| Record / aggregate | Required content and invariants |
|---|---|
| AcceptanceStage | UUID, workspace/company/project, title, coordinator, current draft/revision pointers, version, archived flag; existing Project context remains authoritative |
| StageScopeRevision | Immutable submitted scope: location/system/function/asset identities, source revisions, included and excluded units, exclusion reasons, shared dependencies, project scope baseline and content hash |
| ProjectAcceptanceScope | Complete versioned project scope ledger, required units/stages, approved scope removals and authoritative change references; prevents hidden/unallocated scope from disappearing |
| AcceptanceRequirement | Type, exact applicable scope, required-at decision, owner, due date/basis, mandatory/conditional status, source, permitted evidence, versioned applicability/exception policy |
| EvidenceBinding | Provider/entity/key/version or issue identity, exact relevant scope, reviewer/outcome, availability/currentness observations and observation time; no filename-only authority |
| OutstandingObligation | Source defect/reservation/work reference, scope, severity from its owner, decision effects, responsible person/team, due or date-needed, outcome evidence, optional receiving transfer and immutable changes |
| TrainingEvidence | Session/course and procedure version, covered equipment/areas, trainer, operator identities as permitted, delivery/attendance evidence, separate assessment and approval where required |
| HandoverManifest | Immutable exact content/scope/issue references, audience, purpose, recipients, required responses, excluded scope, obligations, template/source hashes and stage revision |
| HandoverRequest | Stable request identity, exact manifest, sender/destination, requested due date, transport state, recipient acknowledgement and separate decision history |
| CustomerResponse | Response identity, exact issued revision/scope, actual responder, authority basis, method/evidence, response time, recorded-by/time, outcome/reservations and successor/correction linkage |
| AcceptanceDecision | Kind (technical applicability/customer/Service/commercial/stage closeout), exact evidence snapshot, scoped authority/policy version, outcome, conditions/reason and immutable actor/time |
| ProjectCloseoutDecision | Whole-project scope/evidence snapshot, all required independent decisions, residual obligations/receiving receipts, closure policy, actor/time and later amendment/reopen links |
| SourceObservation / AuditEvent | Current checks and changes are append-only facts; current applicability is a separate projection |
| Activity / OperationReceipt | Existing shared task and durable operation infrastructure, extended with valid typed links and current permission checks |

Stable UUIDs remain the keys. Reuse the existing Project permanent reference allocator and naming standard. A new readable acceptance-stage reference requires a catalogue mapping consistent with PPO-STD-001; do not silently invent an externally meaningful number. Mockup identifiers such as `SYN-ACC-001` are labelled display fixture IDs only until the mapping is implemented.

### 7.1 Draft, submitted and historical versions

Draft editing uses optimistic versions and retains accepted change events. Submitting freezes an exact scope/requirements/evidence snapshot. A returned or materially changed submission gets a successor revision, with a comparison identifying additions, removals and changed sources. Old review decisions never migrate silently to a changed revision.

Scope additions after acceptance require a successor/amendment. Narrowing a stage cannot hide uncompleted project scope: excluded or removed units remain in the complete project ledger until an authorised source change explicitly removes the obligation or assigns it elsewhere. Overlapping stages may legitimately refer to the same asset for different functions; detect conflicting duplicate scope coverage and require an explicit relationship rather than double counting acceptance.

## 8. Scope, source currentness and readiness rules

### 8.1 Exact scope evaluation

Bind each requirement and decision to the smallest meaningful controlled scope. An area name alone is insufficient when an irrigation system serves multiple compartments or shares pumps, nutrient dosing, alarms or control channels. Identify shared dependencies and ask the owning technical domain for applicability to the proposed partial stage.

A stage cannot bypass a failed shared dependency by excluding the room in which the affected equipment sits. Installed location and served area are distinct. Technical independence must have explicit assessed evidence; UI filtering does not prove it.

Every required project unit must be accounted for as: included in a current stage; not yet assigned; or removed from project scope by an authorised source change with reason. A reassigned unit remains traceable to both prior and successor stage revisions. Final closure requires full ledger reconciliation, including hidden rows and unallocated scope.

### 8.2 Readiness gate

For a named decision, the server evaluates current permission, exact scope revision, current source availability/applicability, relevant independent decisions, required documents/training, active holds and outstanding obligations. Each requirement yields one of:

- Satisfied by exact permitted evidence.
- Outstanding, with known missing evidence/action.
- Blocked by an authoritative refusal/hold.
- Cannot assess because required source or authority is unavailable/unknown.
- Not required, with an approved applicability decision and source/policy reason.

Not required is not a default for an empty field. No user can waive a mandatory Engineering/Quality hold from this screen. A coordinator can record a proposed resolution and owned action, but only the source owner can resolve the source gate.

The decision snapshot captures its requirement set/policy version and full relevant scope. At commit, recheck or serialise source versions so a concurrent material source change cannot approve stale evidence. Where a source is external or simulated, use a defined version/capability token and state the limit. Do not claim atomic cross-system consistency from a recent timestamp alone.

### 8.3 Source observations and later changes

Display **Current · checked [time]**, **Changed**, **Unavailable**, **Restricted**, or **Not checked**, with provider capability and an actionable reason where allowed. A browser refresh does not imply that an upstream source was successfully checked. Last-known data may remain readable with its age and uncertainty; required unavailable evidence blocks the affected decision.

A later material EN-08 withdrawal, failed retest, redline change, changed contract scope or revoked evidence marks affected current readiness/acceptance applicability **Reassessment needed**. Preserve the historical acceptance as a fact against its original revision. Open one owned follow-up per relevant cause/scope, using deduplication. Do not invalidate unrelated areas or silently undo a customer's prior response.

Nonmaterial source relocation can preserve identity when the provider still resolves the exact version/hash. A file with a similar name or a new latest version is not a substitute for missing original evidence. Source changes while a pack is being prepared retain a stale attempt and require a new reviewed candidate before issue.

## 9. State model and permitted transitions

Keep workflow state, independent outcomes and applicability separate. Read models may summarise them, but must return the underlying facts and explanation.

| Dimension | Proposed states | Transition controls |
|---|---|---|
| Stage submission | Draft, In review, Returned, Superseded | Submit exact snapshot; return reason and owned corrections; changed content produces successor |
| Technical applicability | Not assessed, In review, Accepted, Blocked, Reassessment needed | Read exact EN-08/Quality outcomes; a PJ-09 confirmation binds them to this stage and grants no Engineering authority |
| Customer outcome | Not requested, Awaiting response, Accepted, Accepted with conditions, Reservations, Declined, Disputed | Separate request/issue from actual response; verified responder, exact scope and evidence required |
| Service receiving | Not requested, Requested, Received, Accepted, Returned, Declined | Request/receipt/acceptance separate; current destination authority and exact manifest required |
| Commercial closeout | Not assessed, In review, Complete, Outstanding, Disputed, Not required | Current commercial authority and versioned evidence; no implied invoice/payment/waiver |
| Stage closeout | Open, Ready for closeout, Closed, Reopened | Readiness derived; close/reopen explicit with immutable decision; conditions and sources rechecked |
| Project lifecycle | Active, Closed | New controlled closure/reopen contract; historical Gantt status and old command receipts remain unchanged |

Archived is a presentation flag only, not a business outcome. Superseded preserves the original stage revision and decisions. Not required applies only where approved policy permits the named dimension, not as a general shortcut.

### 9.1 Required command sequences

**Prepare stage:** create draft → choose exact scope → derive versioned requirements → bind evidence → resolve missing/source issues → submit review. Drafts may be incomplete; submission must make every gap explicit and name responsible follow-up.

**Customer acceptance:** issue the exact audience-safe pack → make a local handover request → record or receive an attributable response → validate authority, scope and policy → apply the response to the current acceptance projection. Transmission/receipt is never inferred from issue.

**Service receiving:** prepare exact support manifest → submit one request to a named receiving destination → recipient independently accepts/returns/declines → sender resolves returned items with a successor manifest → recipient reviews that successor. Earlier acknowledgement/acceptance never automatically signs the successor.

**Closeout:** assess all gates → preview exact proposed decision and remaining obligations → authorised reviewer confirms → server rechecks current versions/authority → commit immutable decision, lifecycle projection, audit, receipt and internal outbox fact atomically.

### 9.2 Conditional acceptance and residual work

An eligible nonblocking obligation may remain after a scoped acceptance only when the source authority/policy permits it and the actual accepting party expressly agrees to the condition. Record exact work, affected scope, risk/control reference, owner, due date or an explicitly agreed date-needed condition, required completion evidence, accountable recipient and review/escalation rule.

The receiving owner must accept a transfer before it can satisfy a transfer requirement. Assigning a name, creating an Activity or ticking a checklist does not prove agreement. The original obligation remains visible until source completion evidence is accepted.

No generic override for mandatory tests, unresolved safety/site holds, missing required as-builts, unknown customer authority or inaccessible required sources. A permissive internal risk note is not customer consent. Conditional acceptance must remain visibly labelled; it cannot be rendered as unconditional Accepted.

An incoming customer response may be recorded even when it cannot currently satisfy an acceptance gate. Preserve the external fact and show **Response recorded · validation required** with the reason; do not discard the response or convert it into a technical approval. If the response concerns only part of the requested scope, retain it against those units and prepare an appropriate stage amendment. Do not mark the whole stage accepted.

## 10. Detailed evidence and obligation rules

### 10.1 Technical and defect evidence

Consume EN-08's exact released package, relevant test/retest acceptance, tested/installed configuration, redline disposition, exclusions and outstanding support obligations. Keep failed and superseded results accessible through their source. A passing test without required review is insufficient; a materials release does not prove installation; accepted-for-incorporation redlines are not already incorporated as-builts.

Requirements must refer to the same stage scope and compatible revision set. An EN-08 release for Greenhouse 01 cannot satisfy Greenhouse 02 because the procedure title is identical. Required shared-system tests remain gates for every affected scope.

Defect closure is owned by its source process and may require a fresh reviewed retest. PJ-09 can propose follow-up, request clarification and consume the outcome. Completing a linked Activity or commercial decision never erases the failed result or releases a hold.

### 10.2 Training, documents and configuration

Specify required operator group, equipment/area, procedure/manual revision, trainer and evidence standard per stage. Distinguish a scheduled session from delivery and signed attendance from separately required competence evidence. If a new configuration changes training applicability, create a scoped reassessment obligation.

Handed-over documents retain controlled identity, revision, audience, availability and relevant acknowledgement. Exact manuals/as-builts/configuration lists must remain accessible under current permissions. Unavailable required bytes are an explicit gate; a URL or filename is not evidence of durable availability.

Keep control-system backups as references/verified evidence under their owning module. Do not display secrets, private controller credentials or raw provider paths. A backup hash proves identity, not recoverability or successful restoration.

### 10.3 Warranty, maintenance and commercial facts

OUT-13 includes applicable warranty/maintenance context, owners and unresolved obligations. Record commencement dates only from an authoritative source and explicit policy/decision. Customer acceptance, Service receiving and project closure do not automatically start warranty, maintenance recurrence or payment deadlines.

Commercial review identifies obligations, approved/disputed variations, invoice/payment/retention observations and remaining claims separately where the source provides them. Each observation includes source/version, currency and as-at/completeness as applicable. Missing financial authority produces **Cannot assess**, not zero or Complete. Users without Finance scope see only the permitted closeout requirement/outcome, not amounts or confidential terms.

No invented financial formula, tax calculation, legal deadline or entitlement threshold is required for this increment. The synthetic policy specifies which source decisions are needed and who may record them. A dispute remains visible after technical/customer acceptance and can continue to block whole-project closeout.

## 11. Customer responses and Service receiving

### 11.1 Customer attribution

For every recorded customer response retain the actual responding person/organisation, role, authority basis, method, source evidence, response date/time (or explicitly date-only/unknown precision), exact issue/scope and recorded-by/time. The staff member entering it is not the customer signatory.

Selecting the primary contact does not prove acceptance authority. Authority may be a verified scoped appointment/contract reference, explicit confirmation or a labelled synthetic fixture. Unknown or disputed authority is visible and cannot satisfy the controlled acceptance gate. A response must not silently extend to other facilities, later revisions or additional work.

Manual recording in the local prototype is labelled **Recorded from evidence**. Simulated recipient actions are labelled **Synthetic recipient response**. Do not present either as a verified e-signature, actual email delivery or an authenticated customer-portal event. A future connector must retain its own provenance and evidence.

### 11.2 Receiving contract

The handover envelope includes stable request and manifest IDs, project/stage/scope revision, issued technical/document references, assets/configuration, training, excluded scope, outstanding work, expected receiving responsibilities, named destination and requested response date.

Model **Prepared**, **Submitted locally**, **Transport unavailable/simulated**, **Received**, and **Accepted/Returned/Declined** distinctly. When no real transport exists, the UI must not claim Sent or Delivered. Internal Service acceptance requires a separately authorised receiving actor; the sender cannot accept on the recipient's behalf.

Return/decline requires a reason, affected requirements and named follow-up. Clarification that changes content creates a successor manifest and fresh receiving decision. Pure request retries preserve original operation/request identity. Reassignment creates an attributable transfer with receiving evidence, not overwritten history.

EN-08 may already have a valid Service receiving request for the same exact technical manifest. PJ-09 references that response where its scope/purpose satisfy the requirement. It creates a new request only for a broader/different stage pack or genuinely changed obligations. One acceptance must not be counted twice as two independent reviews.

## 12. Stage closeout, project closure and reopening

### 12.1 Stage closeout

Readiness for stage closeout requires scope-matched technical evidence, a qualifying customer outcome where required, accepted Service receiving where required, commercial disposition required for that stage, all mandatory training/document evidence and no unresolved hard blocker. Eligible residual work must satisfy the explicit conditional/transfer policy; unresolved conditions remain visible after closeout.

The reviewer sees a read-only preview of the exact decision, all residual work, required sources and included/excluded scope. The server records an immutable closeout snapshot. It never edits the source acceptance or marks a linked Gantt task complete automatically.

If an allowed residual obligation remains, show **Closed · remaining obligations** with the permitted count and a direct link. Closed describes the recorded closeout decision; it must not conceal continuing conditions or imply that every underlying task is complete.

### 12.2 Whole-project closure

This is a separate explicit command. It must evaluate the complete project scope ledger, current stage decisions, unallocated work, active holds, shared dependencies, customer/Service obligations and the independent commercial closeout decision. It must not use current page filters, a row count, a progress percentage or the fact that all visible tasks say Complete.

Project closure requires every policy-required dimension to be satisfied or explicitly Not required by authorised applicability policy. Residual obligations can remain only where final-closeout policy allows them, the accountable recipient has accepted them, and their continuing visibility, due/review rules and completion evidence are preserved. An unaccepted transfer or a hard blocker prevents closure.

Add the smallest coherent project lifecycle extension to the existing Project aggregate. New project lifecycle defaults to Active for existing rows without backfilling acceptance. Audit all current readers and commands that emit a literal Active; current read models must show the controlled lifecycle after closure. Preserve old operation receipts exactly, since they describe the original accepted operation.

Closed projects remain readable and their external/source obligations continue. New acceptance/scope/schedule mutations that change the closed basis require an authorised reopen/amendment command. Recheck closure version in existing project schedule writes so a stale tab cannot silently alter closed scope. Do not freeze unrelated Service work, defect resolution, document access or Finance activity that legitimately continues after closure.

### 12.3 Reopening and post-close changes

Reopening requires reason, affected scope/source, current project version and explicit closure authority. Retain the original closeout decision; record a new lifecycle event, reassessment requirements and owned follow-up. Reopening does not erase prior customer acceptance or reopen completed Service work automatically.

A changed source discovered after closure must immediately flag current applicability and prevent a misleading unconditional current state. It opens an owned reassessment case; it does not silently fabricate an authorised reopening. The authorised actor can reopen or record an evidence-backed amendment confirming unaffected scope. Keep the historical Closed event and current **Closed · reassessment needed** projection distinguishable until resolved.

## 13. Controlled outputs and history

Use **OUT-13 Handover pack** for the stage-level deliverable, reusing EN-08 OUT-12/OUT-13 issue references where appropriate. Verify existing output/template registration in the actual checkout. The current shared document contract implements selected outputs and cannot be assumed to provide a generic OUT-13 renderer. Extend its supported type, template registry, server projection, job/issue checks and tests as a bounded addition. [S03][s03] [S08][s08]

The pack includes project/customer/site, precise stage scope and exclusions, as-built/manual/configuration versions, relevant test outcome references, assets, training evidence, warranty/maintenance context, outstanding obligations and responsible owners. Include required customer and Service response instructions without confidential internal commentary.

Prepare an immutable manifest and audience-safe projection; render/validate/store exact bytes; verify durable retrieval, size and hash; then recheck current authority/source/template/audience before committing issue. Output preparation/reserved issue time is separate from actual issue time. Prepared, generated, issued, retrieved, received and accepted are distinct facts.

Retry after storage success/database failure must recover the original bundle by operation identity. Never regenerate a supposedly identical historical issue or alter its bytes to append a later signature. Later acceptance appears in a separate signed/attributed event or a newly issued decision summary with its own identity.

Customer and Service outputs use server-side allowlists. Exclude private commercial figures, internal risk discussions, raw provider paths, credentials and restricted contact data, while preserving relevant failures, exclusions and outstanding obligations. A private note must never be copied into a public title, filename, manifest, preview or error.

Read-only register CSV export may be included for permitted visible fields. It is labelled a working export, not a controlled acceptance certificate; neutralise spreadsheet-formula injection in user text. Formal stage/project closeout evidence uses the governed output contract. Browser print is not evidence of issue or recipient acceptance.

## 14. Roles, capabilities and access

Use existing scoped identity/grants. Names below describe proposed capabilities, not grants that already exist. Existing `project.read`, `project.create` and `project.edit` must not become technical, customer or commercial sign-off authority. Register new capabilities according to the actual platform catalogue.

| Actor | Permitted responsibility | Required restriction |
|---|---|---|
| Coordinator | Create/revise draft scope, bind evidence, propose obligations, prepare handover and request reviews | Cannot approve source technical work, waive mandatory gates, impersonate customers or accept for Service |
| Technical reviewer | Confirm applicability of exact authorised technical evidence; resolve only source-owned technical decisions they are authorised to make | Role name alone is not competence; no rewriting failed test facts in PJ-09 |
| Customer-response recorder | Record evidence and attribution; request validation | Staff entry does not grant customer authority or automatically satisfy acceptance |
| Customer-response validator | Validate responder authority, exact scope and response applicability under policy | Cannot change the actual response or invent agreement to conditions |
| Service receiving owner | Accept, return or decline the exact support manifest in current permitted scope | Separate from sender; cannot close commercial matters or customer acceptance |
| Commercial reviewer | Record scoped commercial disposition against source evidence | Relevant financial visibility required; no ERP posting, payment or entitlement inferred |
| Project closure reviewer | Review/close/reopen exact project scope under explicit policy | Cannot substitute for missing technical/customer/Service/commercial decisions |
| Viewer | Read permitted records, history and evidence | No mutation; file/receipt/export access independently checked |

Prefer operation-specific capabilities for scope editing, submission, customer response recording/validation, receiving, commercial review, stage closeout and project close/reopen. A single broad acceptance.edit grant is inadequate. A person may legitimately hold multiple capabilities, but any required independence is enforced by a versioned policy, not a hidden UI convention. The synthetic receiving fixture always uses a separate actor from the sender.

Server derives actor/workspace/company context from the session, resolves project/site visibility and rechecks active authority on every command. Apply the same predicates to lists, counts, search/autocomplete, nested evidence, history, exports, documents, operation recovery and issue downloads. Mixed-target Activities require visibility to every linked target; a visible project cannot expose a restricted Finance record.

Use typed links and reusable visibility predicates to avoid recursive cross-service authorisation. Former owners, revoked users and cross-site guesses must be refused even when they retained a URL or an old operation ID. Historical labels are protected by current permissions. Hidden evidence may be represented only by an authorised generic blocking explanation, without disclosing its title, actor or protected content.

## 15. Persistence, APIs and durable operations

### 15.1 Implementation shape

Extend the existing modular monolith with a bounded acceptance subdomain, for example `src/projects/acceptance/`, split into model/validation, pure readiness policy, scoped queries, command service and typed source/receiving adapters. Keep React render code separate from decision policy. Reuse shared controls, document services, Activities, audit/outbox and operation handling. Avoid a new framework, generic workflow engine or independent document store.

Read the live schema, not only the original Projects migration. Use forward additive migrations and explicit synthetic seeds. Add scoped foreign keys, version fields, immutable snapshot/event constraints, unique request/response/operation relationships and suitable register indexes. Preserve existing projects, schedules, saved histories, original issues and receipts. Do not reset or reseed away user work.

Suggested read API family: `/api/v1/projects/acceptance`, its scoped `options` and stage detail/readiness/history endpoints; project closure reads under the existing project context. Command route spelling should follow the current dispatcher conventions. Validate reserved route segments before dynamic IDs so `/acceptance` cannot be misinterpreted as a Project UUID.

### 15.2 Command contracts

| Command group | Required accepted input | Atomic result / effect |
|---|---|---|
| CreateStage | Project/scope context, valid draft fields, owner, operation identity | One draft and audit/receipt; no invented acceptance |
| ReviseDraft / SubmitStage | Expected versions, exact scope/requirements/evidence, meaningful change/submit reason | New draft version or frozen submitted revision; immutable event |
| ReturnReview / CreateSuccessor | Exact submitted revision, current authority, affected items/reason | Retained return plus owned follow-up; successor keeps ancestry |
| RecordEvidence / ReviseRequirement | Typed source/version, scope match, current access, authority and reason | Evidence/applicability event; recomputed affected readiness |
| ProposeResidual / AcceptTransfer | Exact obligation/version, eligibility/policy, conditions, owner and receiving decision | No completion until source evidence; one attributable receiving response |
| PrepareHandover / IssueHandover | Exact approved manifest/audience/template and durable output job | Existing issue pipeline with immutable bytes and original operation recovery |
| RequestReceiving / RespondReceiving | Exact manifest/request, destination role, expected version and outcome/reason | One request/response; sender/recipient boundaries enforced |
| RecordCustomerResponse / ValidateResponse | Exact issue/scope, respondent/authority/method/evidence/times, expected versions | Historical response retained; separate current validated outcome |
| RecordCommercialDecision | Exact relevant evidence/policy, current commercial authority and reason | Independent disposition; no financial transaction |
| CloseStage / CloseProject | Expected aggregate/scope/source versions, full gate snapshot, closure authority | Decision + guarded lifecycle projection + audit/receipt/outbox in one transaction |
| Reopen / RecordAmendment | Original decision, changed scope/source, current versions, authorised reason | New event/requirements and correct current lifecycle; old decision retained |

Every mutating command uses an operation ID, canonical payload, expected versions and server-side validation. Reasons are required for decisions/corrections/returns and meaningful when changing scope, ownership, dates or policy applicability. Enforce reasonable existing text limits; proposed defaults are 200 characters for titles, 160 for action summaries and 4,000 for decision narratives, with user-facing validation. Reject unsupported fields and body-supplied actor identities. Render narratives as text.

### 15.3 Idempotency and concurrency

Reuse `src/platform/operations.ts`: current authority is checked before original-receipt access, equal operation/payload returns the original accepted result, and a changed payload with the same operation ID is a conflict. Do not introduce a second idempotency table or alter hashes/namespaces of previous commands. [S11][s11]

Serialise conflicting updates at project/stage scope in a documented lock order. A project closure competes with stage scope/decision changes, source invalidation and existing project schedule mutations. Use aggregate/version predicates and rechecks so either ordering produces a valid current result or a clear conflict. Never accept a stale closure and then silently overwrite it with the losing transaction.

Readiness shown before a user opens a dialog is advisory until commit-time validation succeeds. On conflict, retain permitted input, show changed facts and require a fresh reviewed command; do not blindly replay with the latest version. Counts/read projections must not produce a successful close command without the underlying complete-scope evaluation.

### 15.4 Recovery and integration delivery

If the server may have accepted a command but its response was lost, display **Outcome unknown — check original operation**. Reconcile the original identity before allowing a new attempt. A confirmed pre-commit failure can be corrected and retried under the appropriate command contract; an unknown outcome cannot be treated as a failed save.

Persist internal outbox work and receiving-request identities in the same transaction as their accepted cause. Outbox delivery retries deduplicate at the receiver. A source adapter timeout is not recipient acceptance. Simulated local requests expose their simulated transport status; they cannot claim an external message was delivered.

Retain decisions, issued bytes and original request/response identities across application and PostgreSQL restart. Business decisions live on the server. Local storage is limited to scoped presentation preferences; do not persist authoritative acceptance, role grants or sensitive evidence there. No generic PJ-09 service-worker/API cache or offline approval queue is added.

### 15.5 Migrations and existing lifecycle compatibility

Allocate the next migration only after checking the current integrated registry. Preserve reserved 0016 and prior migration bytes. A new migration affects suites outside Projects: inspect all exact registry/version assertions identified in `AGENTS.md`, register seeds in increasing valid order and review the hosted upgrade comparison rather than mechanically bumping it. [S07][s07]

Reconcile the new closure lifecycle with create/task/read responses, project history, options, register filters and receipt semantics. Existing projects remain Active unless explicitly closed through the new guarded command. An upgrade must not backfill customer consent, inferred acceptance or completed support transfers. Original replayed receipts remain historical; a subsequent current read returns current state.

## 16. Integration contract and capability matrix

At implementation start, record for each dependency: actual runtime service/route; read/write/receiving capability; version/currentness guarantee; permission boundary; synthetic fallback; and unresolved limitation. Use a discriminated result such as Available, Changed, Unavailable, Restricted or NotImplemented. Missing capability must not resolve to empty success.

| Dependency | Incoming information | PJ-09 outgoing effect / boundary |
|---|---|---|
| EN-08 | Exact technical issue, approved scope, configuration, accepted tests, redlines, obligations and any valid receiving responses | Acceptance context and remaining work; no technical result rewrite or duplicate support request |
| SV-06 / SV-07 | Reviewed service evidence, exact reports, open follow-up and applicable customer responses | Scoped support receiving request; report acceptance does not automatically accept a broader project stage |
| Quality / inspection | Defects, holds, failed checks, retest outcomes and release applicability | Owned resolution request; source defect/hold lifecycle retained |
| Project readiness / EN-07 | Approved changes, affected scope/dependencies and reassessment obligations | Closeout impact/owned follow-up; no forecast or confirmed-booking cascade |
| Equipment / sites | Existing asset/facility identities, installed/served areas and configuration references | Reviewed handover reference or typed proposal; no silent canonical reassociation |
| Documents / DK-03 | Exact issue/template/audience/availability, distribution and response facts | Bounded OUT-13 composition/issue; no new document authority |
| Commercial / Finance | Source obligations, authorised disposition and permitted financial observations | Closeout decision request; no ERP write or fabricated financial totals |
| My Work / inbox | Shared owned actions, due meanings, outcomes and permissions | One canonical action per obligation/request, linked back to source; no fake notification sent |
| Shared shell / route registry | Header, breadcrumb, layout, navigation and identity slots | Registered Projects workspace; no duplicate shell or new app navigation design |

When an adjacent runtime is absent, implement only the minimal typed synthetic adapter needed to exercise PJ-09. Label fixtures and decisions accordingly in context/outputs, not with noisy implementation jargon in every cell. Do not rebuild all of Engineering, Quality, Service or Finance within this task. Real connectors can later implement the same contract after their authority/availability guarantees are established.

## 17. Exceptions, responsive behaviour and performance

| Condition | Required experience |
|---|---|
| Empty register | Explain that no acceptance stages exist and offer permitted creation |
| No filter matches | Preserve filters; provide Clear filters; do not suggest no project work exists |
| Loading / partial data | Stable skeleton/spacing, explicit completeness; no temporary false zero |
| Missing evidence | Name the affected requirement and permitted owner/action |
| Unavailable/restricted source | Distinguish unavailable from denied; reveal no protected metadata; block only affected decisions |
| Stale source / changed scope | Show exact difference, retained draft and reason for reassessment |
| Returned customer/Service response | Preserve original manifest/response, show conditions and owned successor work |
| Denied action / revoked role | Clear scoped explanation and safe navigation; server refusal even if stale UI offered the action |
| Failed save / unknown outcome | Retain permitted input; separate retry from original-operation reconciliation |
| Missing historical bytes | Owned recovery with original identity; never regenerate or use latest version as a substitute |
| Long names / many obligations | Natural wrapping, accessible full values and pagination; no clipped decision-critical content |

Use semantic tables and column headers on desktop, keyboard-operable sorting, explicit row links, labelled icon buttons and visible focus. Inspection tint and tag colour must not be the only signal. Use `aria-current`, appropriate expanded state, dialog focus containment/return and concise live announcements for accepted or uncertain operations. Do not announce every background refresh.

At 1024 px, use an overlay menu and avoid squeezing a six-column register beside a wide inspector. At phone widths, use a concise stage list with title, area, three named outcomes and next owner/action; open full detail for decisions. Keep all four outcome dimensions available. Review 200% zoom and 390 px phone width; no hover-only actions or horizontal page scroll.

Date-only targets stay calendar dates in the project/site zone; timestamped events store instants and display the zone. The synthetic examples use Australia/Brisbane. Do not shift a date-only obligation across days by converting it through UTC. Response time, recorded time, issued time, due date and agreed effective date remain distinct. Unknown precision remains explicit.

Use server-side pagination and indexed scope/state/owner/date queries. Load inspector evidence on demand and cache only within the current authorised session according to existing conventions. Cancel stale searches; avoid one source request per rendered cell. Source checks should be batchable and honest about partial availability. Counts must use the same visibility predicate as rows.

Proposed local performance target: warm register/detail interactions within about two seconds on a documented representative synthetic dataset, with immediate visual feedback on pending work. Record actual dataset, hardware/environment and timings; this is a proposed acceptance target, not a measured claim. Do not add virtualization until measured list size/rendering warrants it.

## 18. Synthetic demonstration and mockup content

Use fictional names and clearly identified synthetic records. Preserve existing fixture identity conventions and compatible project/site relationships. Dates are examples for the design; executable fixtures use a documented anchor/relative offsets so Overdue/Upcoming cases do not expire unnoticed. Do not change historical event ordering when shifting the anchor.

Primary scenario: **Nursery irrigation upgrade**, project `SYN-PPO-PRJ-000701`, **Willowbank Horticulture**, **Nursery & propagation site**, coordinated by **Sam Jordan**. Reuse this context only after validating the actual fixture identities from EN-08; names alone must not join records.

| Case | Stage / scope | Starting position and demonstration |
|---|---|---|
| A — main review | Greenhouse 01 irrigation | EN-08 test evidence accepted; redline RL-017 still pending incorporation; technical issue requirement outstanding; customer/Service Not requested; Resolve redline requirement opens EN-08 source |
| B — clean handover | Propagation house irrigation | Exact technical issue released, manuals/training evidenced, customer Awaiting response, Service Accepted; Record customer response is next |
| C — conditional acceptance | Irrigation block A | Customer Accepted with conditions for eligible labelling work; named owner/due and explicit agreement; unresolved obligation stays visible |
| D — shared dependency hold | Greenhouse 02 | A failed shared alarm dependency blocks acceptance despite local test passes; excluding another area cannot bypass it |
| E — returned support pack | Climate controls | Service returned missing configuration/backup reference; exact return retained; successor manifest needs fresh review |
| F — commercial exception | Pack room upgrade | Technical/customer/Service accepted; disputed variation keeps commercial closeout outstanding and prevents whole-project closure under fixture policy |
| G — partial response | Two-compartment stage | Customer response accepts only compartment 1; system retains partial scope and requires stage amendment |
| H — source unavailable | Pump station | Previously visible required issue cannot be verified; last-known facts retained with Cannot assess |
| I — authority uncertainty | Growing area handover | Response recorded from evidence, responder authority not verified; no qualified acceptance yet |
| J — interruption | Valid stage closeout | Response lost after commit; original operation recovers one decision without duplicate output/action |
| K — changed source | Previously accepted stage | Source withdrawal causes scoped reassessment; original customer/Service decisions remain exact |
| L — closed project | Fully reconciled synthetic project | Closed snapshot, accepted residual support responsibility if policy allows; new material change creates reassessment and authorised reopening |

The latest desktop mockup uses the planned wide-desktop composition, with the menu expanded to demonstrate its styling, eight legible rows, the six default columns, context/toolbar, selected first stage and spacious inspector. The implementation's primary wide-desktop review target is 1920×1200 CSS pixels; first-use runtime menu default remains collapsed. Do not convert raster pixel dimensions into fixed application layout dimensions. In case A, show **Tests accepted** separately from **As-built release pending**; do not falsely display overall Technical Accepted while RL-017 remains unincorporated. Use **Resolve requirement** as the primary action, exact unknown/pending outcomes and no fabricated all-green metrics.

Save the latest generated image as `PPO-PJ-09-Staged-Acceptance-and-Closeout-Desktop-UI-Mockup-r01.png` when attaching it in VS Code.

### 18.1 Latest mockup identity and implementation mapping

The image generated immediately before this implementation request is the PJ-09 composition reference: original generated filename `exec-2f318e49-2005-4298-ab0d-264b78e93831.png`, SHA-256 `9d3cf7edb1d6184d14bc9d1a4c42c97a4d3ba2ddc2c2d2004ca6e54febe3b242`. Renaming that file does not change its hash. This identifies the supplied raster; it does not establish application/device baseline acceptance.

| Mockup element | Implementation requirement |
|---|---|
| Expanded My Work-style menu and compact breadcrumb | Reuse actual shared menu/header mechanisms; keep the separate collapsed first-use PJ-09 preference |
| Eight-row, six-column register | Use server-backed query results and real counts; retain flush table/container edges |
| Selected Greenhouse 01 acceptance | Bind inspector to the selected stable stage identity; do not hard-code the inspector to the first seed |
| Release pending alongside 12 / 12 tests accepted | Preserve independent test/release meaning and RL-017 incorporation gate; Resolve requirement opens the relevant permitted source/action |
| Neutral Not requested / Not assessed / Not prepared | Neutral state with neutral symbol or no icon; never a completion check |
| Source check and handover readiness | Render actual adapter check outcome/time and exact current manifest state; timestamps and demo rows are not static production facts |
| Commercial state inside the inspector | Preserve the fourth independent outcome even though the default register displays Technical, Customer and Service |
| Supporting evidence and footer links | Working permitted source/detail/history navigation, with explicit unavailable/restricted states when applicable |

Reproduce the visual hierarchy and spacing using real components. Do not place the image in the app as a substitute for controls or copy typography artifacts from the raster. The eight pictured rows cover cases A–F, H and I; retain the remaining behavioural fixtures for partial response, interruption, reassessment and reopening. All amounts, dates, counts and status summaries in the implementation derive from the appropriate persisted records.

## 19. Implementation sequence and exit conditions

Deliver vertical slices on the existing application stack. A functioning local application is the implementation target; a standalone HTML preview can support design review but cannot satisfy server persistence and authority requirements.

| Stage | Work | Exit evidence |
|---|---|---|
| 1 — reconcile foundation | Inspect instructions/current branch, routes, live schema, source contracts, output support, capability catalogue and actual r22/My Work; record reuse/adapter/lifecycle decisions | Confirmed file/route map and dependency capability matrix; no unsupported assumption of adjacent runtime |
| 2 — data and scope | Add minimal migrations/types/permissions, complete project scope ledger, stage revisions, requirements, seeded fixtures and shared Activity links where absent | Scoped create/read/revise, immutable snapshots, migration/upgrade and negative access checks |
| 3 — shell and register | Register routes/layout/breadcrumb, reuse menu, build flush six-column register and inspector with useful empty/error states | Desktop/narrow/phone composition and actual component comparison; permitted navigation and persistence |
| 4 — readiness and obligations | Implement full-scope gates, source adapters, defects/retest links, training/doc evidence, residual/transfer rules and reassessment | Normal/blocked/unavailable/shared-dependency cases; source changes invalidate only affected scope |
| 5 — handover and decisions | Build exact OUT-13 composition/issue, customer response attribution/validation and independent Service receiving | Audience-safe durable bytes, returned/successor journey, distinct issue/receipt/acceptance and original-operation recovery |
| 6 — closeout and lifecycle | Add commercial disposition, stage closeout, complete-scope project closure, closure-aware existing project commands and reopening | Concurrent stale-tab refusals, retained old receipts/history, closed-project reads and controlled amendment |
| 7 — integration proof | Connect My Work/source links, complete focused end-to-end and restart/permissions/output checks, inspect visual states against actual references | Recorded relevant acceptance results and compiled-application conformance; existing Projects/My Work/document regressions addressed |
| 8 — developer handover | Explain routes/run steps, migrations, synthetic actors/policy, actual test results, sources and remaining integration/owner/device limits | Reviewable implementation report/PR package when implementation/publication is authorised; no claim of production or business acceptance |

Do not stop at the register while leaving all decisions as placeholder buttons. Conversely, do not expand this work into complete replacement implementations of EN-08, Service or Finance. Use the bounded source/receiver contracts to make the PJ-09 journey concrete and testable.

## 20. Acceptance and verification matrix

The following are **planned checks, not tests executed by this report**. Derived PJ09 IDs preserve the master PRJ and AT identities; they do not replace parent procedures. Implement meaningful policy/database/HTTP/browser tests at the appropriate layer, with selected end-to-end cases for connected behaviour.

| ID | Scenario | Required evidence |
|---|---|---|
| PJ09-01 | Entry and routes | Six destinations and permitted project/detail links work; deep link/Back preserves context |
| PJ09-02 | Shared shell | Single header/rail, correct breadcrumb, no duplicate title, correct module registry/full-bleed layout |
| PJ09-03 | My Work menu | Matching geometry/active style/icons; toggle/edge control, scoped default/preference, overlay focus and resize behaviour |
| PJ09-04 | Flush table | Headers/rows/dividers/footer meet container edges; only internal cell/toolbar padding remains |
| PJ09-05 | Actual r22 components | Loaded normal Roboto, correct controls/tags/surfaces, no green primary buttons or condensed text |
| PJ09-06 | Responsive/zoom | Wide and narrow desktop, 390 px phone and 200% zoom remain usable with complete decision access |
| PJ09-07 | Keyboard/accessibility | Labels, focus, row links, dialogs, menu close/return and noncolour state cues work |
| PJ09-08 | Register truth | Filters/search/order/paging/counts share permissions and completeness; no temporary false zero |
| PJ09-09 | Draft create/edit | Permitted identity/context; incomplete draft honest; invalid owner/scope/payload rejected atomically |
| PJ09-10 | Immutable submission | Frozen revision/evidence hash; changed/returned content creates successor with original retained |
| PJ09-11 | Scope precision | Correct facility/system/assets/configuration; installed versus served area kept distinct |
| PJ09-12 | Overlap/reassignment | Duplicate/conflicting scope detected; reassignment retains lineage and no double-counted acceptance |
| PJ09-13 | Hidden/unallocated scope | Filters/exclusions/page limits cannot remove a project requirement from closure assessment |
| PJ09-14 | Shared dependency | Failed shared alarm/pump dependency blocks all affected partial stages |
| PJ09-15 | Requirement outcomes | Satisfied/outstanding/blocked/cannot assess/not required have correct evidence and reasons |
| PJ09-16 | Source truth | Last-known timestamps do not assert currentness; unavailable/changed/restricted states accurate |
| PJ09-17 | Source race | Material source change during review/issue prevents stale commit or creates specified reassessment |
| PJ09-18 | Scoped reassessment | Changed technical scope affects only relevant stages; original decisions/failures retained |
| PJ09-19 | Defect/retest boundary | Activity completion cannot close defect/hold; fresh reviewed retest consumed from source |
| PJ09-20 | Conditional acceptance | Explicit actual-party agreement, eligible work, owner/due/conditions/evidence; no hard-gate waiver |
| PJ09-21 | Residual transfer | New owner independently accepts exact obligation; assignment alone is insufficient |
| PJ09-22 | Training | Planned/delivered/attendance/competence distinct; changed configuration flags applicable retraining |
| PJ09-23 | Manuals/configuration | Exact controlled versions accessible; missing bytes block required handover |
| PJ09-24 | Backups | Available/identity verified/restore verified distinct; no credentials or controller writes |
| PJ09-25 | Warranty/maintenance | Dates/obligations sourced; no automatic commencement or recurrence from acceptance |
| PJ09-26 | Customer authority | Exact responder and authority basis; recorder distinct; unknown authority cannot qualify acceptance |
| PJ09-27 | Partial customer response | Accepted units remain exact; response cannot approve remainder or a later revision |
| PJ09-28 | Reservations/dispute | Retained evidence and owned follow-up; internal completion cannot erase customer concern |
| PJ09-29 | Transport semantics | Prepared/issued/local submitted/received/accepted separate; simulated adapter never claims real delivery |
| PJ09-30 | Service independence | Sender cannot receive for another actor; permissions and manifest scope checked |
| PJ09-31 | Returned handover | Return reason/items retained; successor review required; no inherited signature/acceptance |
| PJ09-32 | Duplicate handover | Valid EN-08 request reused where exact purpose/scope matches; retries create no second request |
| PJ09-33 | Commercial separation | Source review distinct from financial observation; dispute can prevent closure after technical acceptance |
| PJ09-34 | Restricted Finance | Lists, inspector, output and errors expose only permitted outcome/requirement, not private amounts |
| PJ09-35 | Stage closeout | Complete exact gate snapshot and authority required; Gantt completion never substitutes |
| PJ09-36 | Whole-project closure | All scope units/stages/obligations independently reconciled; no filtered/all-visible shortcut |
| PJ09-37 | Closed-project compatibility | Current readers show lifecycle; closure-aware existing schedule writes; original receipts unchanged |
| PJ09-38 | Reopen/amend | Authorised reason and source; original closure retained; unrelated source work not silently reopened |
| PJ09-39 | Post-close source change | Closed historical fact retained with current reassessment warning and owned follow-up |
| PJ09-40 | Exact OUT-13 issue | Registered renderer/template; reviewed input equals issued durable bytes/hash; timestamp meanings distinct |
| PJ09-41 | Audience projection | Customer/Service allowlists remove internal canaries from bytes, names, metadata and manifests |
| PJ09-42 | Issue recovery | Storage success/finalisation failure recovers original bundle; no regeneration or duplicate issue |
| PJ09-43 | History availability | Renamed/moved source resolves exact identity; missing original version produces owned recovery |
| PJ09-44 | Idempotency | Same operation/payload returns original result; changed payload conflicts; authority rechecked first |
| PJ09-45 | Concurrent changes | Competing scope/response/closure/schedule writes serialize or conflict without lost updates |
| PJ09-46 | Unknown outcome | Lost response reconciles original operation after restart; one decision/request/action only |
| PJ09-47 | Permissions/revocation | Positive/negative API cases for all decision kinds, former owners, cross-site requests and revoked actors |
| PJ09-48 | Indirect access | Counts/search/history/receipts/blobs/exports/mixed-target Activities disclose no restricted data |
| PJ09-49 | My Work integration | One typed owned action per cause/obligation; real target permissions and independent outcome |
| PJ09-50 | Dates and time | Date-only zone integrity, separate recorded/effective/issued times, known overdue/date-needed truth |
| PJ09-51 | Failure and long content | Useful error/empty/partial states, retained permitted input, readable long names/conditions |
| PJ09-52 | Persistence and migration | Upgrade/repeat seed preserve original projects/schedules/issues/receipts; registry assertions reconciled |
| PJ09-53 | Complete journey | Draft → blocked → corrected evidence → exact issue → returned receiving → successor → acceptance → closeout survives restart |
| PJ09-54 | Regressions and conformance | Existing My Work, Projects/Gantt, Activities, document/receipt behaviour and compiled shell remain correct |
| PJ09-55 | Performance | Recorded representative dataset and timings; server paging/batched source checks avoid per-cell request storms |
| PJ09-56 | Handover honesty | Actual commands/results/limits recorded; no unexecuted check or parent AT procedure claimed passed |

### 20.1 Visual conformance procedure

Inspect the running module beside the actual r22 List, control, tag/icon and typography specimens and the actual My Work menu, at equivalent CSS viewport/zoom. Record loaded fonts and representative computed measurements/colours. A screenshot of the implementation compared with its own CSS does not establish conformance.

Capture wide desktop with menu/inspector open and closed, narrower desktop overlay, phone/detail, long/unknown values and decision dialog. Include a negative control for the previously observed table-gutter/theme drift. Do not update expected images merely to make a drifting implementation pass. The latest PJ-09 raster mockup governs composition only where consistent with written semantics and real components.

### 20.2 Execution guidance

Use current scripts and focused unit/database/HTTP/browser checks for the changed behaviour, followed by the necessary affected gates and compiled application proof. The inspected package provides `npm run typecheck`, `npm run lint`, `npm run build`, `npm run dev` and `npm run serve:compiled`; `npm start` intentionally refuses production startup. Recheck current scripts before running.

Database suites must use `ppo_synthetic_test`. Verify document-renderer prerequisites and distinguish known environment failures such as missing renderer or hosted-only `ppo.demo_testers` from a PJ-09 regression. Compare an unmodified baseline when necessary. Run foundation/prototype/naming assurance only for their applicable changes or required gate; preserve issued reference snapshots. Stop expanding tests once the identified risks and required gates are sufficiently covered.

Model, database, HTTP and browser checks are component evidence. Native visual inspection, physical-device review, assistive-technology review, owner business acceptance and deployed verification remain separate statements. PA-16/PA-18 and AT-17/20/38 can only be marked passed when their full written procedures actually run. [S14][s14]

## 21. Operational decisions and local defaults

These items do not block the synthetic build. Make local rules explicit and versioned; obtain real operational inputs before applying the relevant capability to live work.

| Decision | Local implementation default | Required operational input |
|---|---|---|
| Customer acceptance authority | Named synthetic representative with explicit scoped authority reference; unknown blocks qualification | Actual authority/contract evidence and response validation policy |
| Required stage outcomes | Technical/customer/Service required for main fixtures; commercial stage applicability explicit; final project commercial closeout required | Agreed contract/stage obligations and department authority |
| Conditional acceptance | Only explicitly eligible nonblocking residual work with recorded party agreement | Approved exception/condition policy; mandatory technical/site controls remain source-owned |
| Project closure with residual work | Only approved policy plus accepted receiving responsibility and continuing tracked obligations | Actual closure criteria and support accountability |
| Source currentness | Typed synthetic version/availability observations; missing capability visible | Provider-specific revision/withdrawal/currentness guarantees |
| Sender/receiver independence | Separate synthetic sender and Service receiver; explicit grants | Actual delegation and separation rules |
| Training evidence | Fixture distinguishes delivery/attendance/competence; requirements specify which is needed | Approved operational training and competence standards |
| Commercial measures | Sourced synthetic decisions; no calculated entitlement, tax or retention release | D-010/D-017 approved definitions and authority |
| QHSE/site constraints | No coordinator override of authoritative hard holds | D-019 applicable controls and qualified review |
| Output/recipient model | Local exact OUT-13 issue plus labelled simulated receiving | Approved templates, retention, destination and real communications integration |
| Multi-site scope | Existing fixed Project site; multiple areas within it | Future project identity/scope/permission impact contract |

Record deviations from these defaults in the implementation decision note; do not silently weaken a gate to make the demonstration reach Closed. Do not impose routine approval pauses for reversible local implementation already authorised by a later build instruction.

## 22. Traceability and package conformance

| Requirement / design rule | Coverage |
|---|---|
| PJ-09, dependencies EN-08/SV-06 | Sections 1–4, 8–13, 16: source-bound technical evidence, support receiving and complete acceptance scope |
| PRJ-01–PRJ-04 | Existing Project identity/schedule retained, stage ownership/follow-up, no automatic booking or schedule changes |
| PRJ-05 | Independent commercial obligations/decisions, source evidence and disputed changes |
| PRJ-06 | Exact tests/defects/retests, partial-stage and shared-dependency gates |
| PRJ-07 | Audience-safe controlled pack and attributed customer response; no automatic communication |
| PRJ-08 / OUT-13 | Documents/assets/training/support ownership/open issues and separately evidenced closeout |
| PA-16 / PA-18; AT-17 / AT-38 | Retained failed results, staged acceptance and independent technical/customer/commercial/Service outcomes |
| AT-20 | Exact issued-version availability and rename/move handling |
| NFR-01 / NFR-09 | Scoped server authority, immutable evidence, durable recovery, verified implementation limits |
| User's retained UI decisions | Sections 5, 18, 20: flush table, compact breadcrumb title, actual My Work collapsible menu, actual r22 styling |
| Scope/design conformance | Primary Register/worklist; supporting review/detail/document/form types; explicit incoming/outgoing contracts and adaptation register |

Declared adaptations: six default register columns; 14 px main text/60–68 px two-line rows for acceptance evidence; approximately 760 px minimum list space before inspector overlay; collapsed first-use desktop menu with a PJ-09 scoped preference. These are proposed module layout choices carrying forward EN-08 refinements. They do not promote a new accepted UI baseline automatically.

The shell owns navigation/viewport. The module owns its interior and declared scroll surfaces. Register actual routes, layout mode, reference hashes, control edition and justified adaptations in the appropriate implementation conformance records. Preserve existing baseline identities until an explicit owner decision establishes the new screen/device baseline. [S13][s13]

## 23. Deliverables and definition of done

This update delivers **`PPO-PJ-09-Staged-Acceptance-and-Closeout-Build-Plan-r02.md`** and **`PPO-PJ-09-Staged-Acceptance-and-Closeout-VS-Code-Build-Prompt-r01.md`**, aligned with the previously generated desktop mockup r01. Application routes, migrations, runtime tests, PR publication and deployment remain implementation work; none was performed by this document update.

The subsequent local implementation is complete when all six views work with server-backed state; scoped evidence/acceptance/receiving/closeout journeys connect; mandatory gates and permissions are enforced; original operations and exact documents recover after interruption; existing Projects/My Work behaviour is preserved; and relevant functional/visual acceptance evidence is recorded.

Expected future implementation deliverables:

- Application/domain code, additive migrations, explicit synthetic policy and fixture records.
- A documented dependency/adapter capability matrix and stable source/receiving contracts.
- Focused tests and actual browser/component conformance evidence.
- A maintained decision note and developer handover covering route/run instructions, schema changes, actual results and remaining limits.
- Repository status/document register updates where implementation publication is subsequently authorised, with existing parent IDs and historical source snapshots preserved.

### 23.1 Using the files in Visual Studio Code

Open the existing `powerplants-one` repository. Attach this r02 plan and the latest PJ-09 mockup r01 to the Codex/OpenAI coding conversation. Make the exact r22 theme HTML available if it is not already in the checkout. Open `PPO-PJ-09-Staged-Acceptance-and-Closeout-VS-Code-Build-Prompt-r01.md` and paste its complete contents as the implementation instruction.

The prompt requires inspection of current work, implementation of all eight stages, relevant verification, actual theme/menu comparison and startup of the existing local server. It asks for a concise final handover with the URL, run commands, real results and remaining limits. It does not ask the coding agent to regenerate this plan or create another standalone mockup.

If a supplied reference is absent, first look for the exact file in the authorised workspace. Continue with this written contract and repository components where sufficient, disclose any unavailable visual comparison and request only an indispensable missing input. Never claim an unseen image was inspected. Preserve local changes and use a separate worktree/branch when necessary; do not reset/reseed or overwrite unrelated work. No timing estimate or production readiness claim is implied by this plan.

## 24. Source register

GitHub references are pinned to the inspected checkpoint. Older source documents retain their own dates and implementation limits; their historical Not run/design-only claims are not converted into current runtime claims. Current user instructions take precedence over older visual choices.

| Source | Evidence used |
|---|---|
| S01 | [Coverage Register r06][s01]: exact PJ-09 title/scope, EN-08/SV-06 dependencies, retained parent IDs and horticultural stage definition |
| S02 | [BP-06 Projects & Commercial Delivery][s02]: J5, independent decisions, partial acceptance and source-owned commercial controls |
| S03 | [Master Blueprint][s03]: PRJ-05/06/08, OUT-12/13, AT-17/20/38 and open D-010/017/019 inputs |
| S04 | [J1 current-code reconciliation][s04]: existing Gantt/project identity, missing controlled completion/closure and typed Project Activity linkage |
| S05 | [Projects service][s05]: actual register/schedule/command/version/receipt foundations and bounded Active projection |
| S06 | [Delivery Readiness design][s06] and [Service Review & Reports design][s06b]: adjacent design behaviour with explicit runtime limits |
| S07 | [AGENTS.md][s07]: live-schema inspection, source preservation, migration registry and honest evidence requirements |
| S08 | [Document issue/distribution contract][s08]: immutable content, audience filtering, durable bytes, actual issue time and original-operation recovery |
| S09 | [My Work shell][s09]: actual menu toggle, breakpoint, scoped preference and header integration |
| S10 | [My Work CSS][s10]: actual menu geometry, neutral active treatment, icons and responsive styling |
| S11 | [Shared operations][s11]: canonical payload/operation receipts, current authority, transactions and outbox |
| S12 | [Theme board r22][s12] plus the directly inspected supplied r22(3) HTML: actual component palette, font, controls and status specimens; hash in section 2 |
| S13 | [HTML module conformance][s13]: scope/page-type declaration, source ownership, shell boundary and application integration evidence |
| S14 | [Projects acceptance procedures][s14]: PA-16/18 and limits on component versus parent acceptance claims |
| S15 | [Package scripts][s15], [README][s15b] and [STATUS][s15c]: stack, local startup, schema checkpoint and implementation/design boundaries |
| S16 | [UI reference index][s16]: current design-family inventory; no dedicated PJ-09 entry located at this checkpoint |
| S17 | Current saved `PPO-EN-08-Commissioning-Basis-and-As-Built-Release-Build-Plan-r02.md`, revision r02, read in full for this task: incoming scope/release/receiving contract and retained UI refinements |
| S18 | User's visible My Work/Deals/menu screenshots and explicit refinements in this conversation: flush tables, breadcrumb title, menu consistency, simple readable professional UI |
| S19 | Latest generated PJ-09 desktop mockup r01, identified in section 18.1: composition reference for this implementation request; actual component and domain rules retain precedence |

[s01]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html
[s02]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/blueprints/BP-06-projects-commercial-delivery.md
[s03]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/blueprints/BP-01-master-blueprint.md
[s04]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/delivery/projects-j1-reconciliation.md
[s05]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/src/projects/service.ts
[s06]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/decisions/project-delivery-readiness-design.md
[s06b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/decisions/service-review-reports-workspace-design.md
[s07]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/AGENTS.md
[s08]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/contracts/document-issue-distribution.md
[s09]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/src/activities/components/client/my-work-shell.tsx
[s10]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/src/app/styles/my-work.css
[s11]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/src/platform/operations.ts
[s12]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html
[s13]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/standards/html-module-conformance.md
[s14]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/testing/projects-acceptance.md
[s15]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/package.json
[s15b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/README.md
[s15c]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/STATUS.md
[s16]: https://github.com/deanrfiedler-gif/powerplants-one/blob/98aa2b47a1f13e3d9fdd10984b088b7b00801548/docs/reference/ui/README.md
