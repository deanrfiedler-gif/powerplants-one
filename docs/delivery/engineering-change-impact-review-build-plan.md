---
title: EN-07 — Engineering Change-Impact Review — Local Application Build Plan
date: 2026-09-20
owner: Dean Fiedler
scope_id: EN-07
principal_requirement: ENG-06
status: Updated build plan and VS Code prompt prepared; implementation and runtime verification pending
delivery_target: Existing local Powerplants One application
source_repository: deanrfiedler-gif/powerplants-one
source_branch: main
source_commit: 1a69e93c266f6b8d5a7d25d6423b7520690ab71c
ui_basis: Audited EN-07 desktop mockup r02; actual My Work menu; theme board r22
ui_reference: PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r02.png
companion_prompt: PPO-EN-07-Engineering-Change-Impact-Review-VS-Code-Build-Prompt-r01.md
supersedes: Build Plan r01 visual guidance; all retained domain controls still apply
versioning: git
---

# EN-07 — Engineering Change-Impact Review

**Powerplants One · Local application build plan · r02 · 20 September 2026**

## 1. Purpose and delivery decision

Build a coherent workspace for assessing a proposed engineering change against the exact technical basis already reviewed or released. Users must be able to establish what changes, what it affects, which decisions are required, who receives the resulting work, and what evidence is needed before the change can be closed.

The principal business requirement is **ENG-06**. The page/module identifier is **EN-07**. These identifiers belong to different registers and must not be conflated. **EN-08**, under ENG-07, remains the owner of commissioning basis and as-built release. [S01][s01] [S02][s02]

Continue the delivery approach established in the current EN-06 plan: implement inside the existing local Next.js/TypeScript/PostgreSQL app, with synthetic records, durable review history and server-enforced decisions. This report defines that future build; it does not implement the module, publish repository changes or claim any runtime checks have passed.

The design should answer five questions without forcing users through several screens:

1. What is changing, and against which exact approved or released revision?
2. Which requirements, drawings, materials, purchased items, assets and growing areas may be affected?
3. What remains unresolved, and who owns the next action?
4. What technical decision has been made, and what separate receiving decisions remain?
5. What evidence proves that the required actions, revised releases and retests are complete?

The primary experience is a **register with a closable right inspector**, supported by focused assessment, review, handover and verification views. Carry forward the EN-06 refinements: edge-to-edge tables, compact breadcrumbs, no repeated large title, a collapsible left menu styled exactly like My Work, restrained status colour and a clear distinction between inspecting a row and selecting it.

### 1.1 Success definition

A user can create a fictional change, capture its exact baseline and proposed revision, assess complete relevant scope, obtain independent technical decisions, prepare an explicit downstream handover, recover its original outcome after an interrupted response, track retesting and close the change against retained evidence. Reloading or restarting the app retains those records. Existing source records and issued files remain intact throughout.

Technical acceptance establishes a bounded engineering decision. Drawing issue, material release, commercial approval, purchase amendment, site work, booking confirmation and commissioning acceptance retain their own controls and evidence.

### 1.2 r02 changes and implementation handoff

This revision incorporates the latest audited EN-07 desktop image and provides an executable companion prompt for the existing local app. It retains r01's assessment, authority, receiving, persistence and recovery scope. All six destinations require working behaviour; a screenshot background, standalone HTML, iframe or browser-only simulation does not complete this increment.

| Audit / earlier position | r02 requirement |
|---|---|
| EN-06 composition as the only visual reference | Use the audited EN-07 desktop r02 image for composition, with this written contract resolving generated-image ambiguity |
| Different colours for identical Review required labels | One shared semantic mapping; the same condition receives the same tone and icon |
| Saturated orange/red cautions | Exact dark r22 text/icon tokens and restrained surfaces, consistent with My Work |
| Revision identities without currentness | Explicit current/unavailable/reassessment status and real source-check timestamp |
| Generic follow-through task names | Exact per-task progress, source request/evidence and separate ownership |
| Review handover as the only main action | Open commercial review for the shown unresolved commercial prerequisite; action changes with the actual next task |
| Approximate menu styling | Mandatory reuse of the My Work menu's actual appearance and interaction, with scoped EN-07 preference and regression evidence |
| Future image/prompt references | Concrete r02 image filename and companion VS Code Build Prompt r01 |

The final mocked screen is the one with **Sources current**, individual follow-through states and **Open commercial review**. Earlier images with bright orange warnings or only Review handover as the main action are retained design history, not the build target.

## 2. Evidence, starting point and source precedence

For r02, repository main was refreshed to `1a69e93c266f6b8d5a7d25d6423b7520690ab71c`; r01's domain audit used `99c32aed5032393b7658713cca53aa4c1a2ab2dd`. The current saved EN-07 r01 report was re-read before editing. The EN-06 r02 source and coverage findings remain identified in the source register. EN-07 is **Engineering change-impact review**, priority P2, dependent on EN-05. That planning dependency is not evidence that EN-05 or EN-06 has a complete current runtime. [S01][s01]

The refreshed tree still exposes the bounded `src/engineering/model.ts`, `validation.ts` and `service.ts` foundation; its service capabilities are `engineering.read`, `engineering.create` and `engineering.edit`. Dedicated EN-07 review/decision/handover capabilities must be designed and enforced within existing permission conventions. No complete EN-06 or EN-07 runtime is inferred from these files. Inspect newer local work before adding either integration or reusable components.

Re-read `AGENTS.md`, `README.md`, `docs/STATUS.md`, `package.json`, live schema and any nested instructions at implementation time. The refreshed package specifies Node 24.21.0 and npm 11.19.0; use the checked-out project's pinned requirements rather than upgrading dependencies to match an old report. The latest numbered migration in the inspected tree remains 0028. Choose the next actual available number locally.

| Source or observation | Consequence for this build |
|---|---|
| Master Blueprint, section 11, ENG-06 | Cover scope, cost, delivery, installed configuration, authority, recipients and retest |
| Coverage Register r06 | Retain EN-07 identity and the EN-05 dependency; EN-08 owns commissioning/as-built release |
| EN-06 Build Plan r02 | Carry forward the approved workspace refinements and material/release boundaries |
| Existing Engineering model/service | Reuse package identity, Project/Opportunity context, scoped reads, permission checks, expected versions and shared-operation conventions |
| My Work shell and CSS | Reuse actual menu geometry and behaviour; do not approximate the screenshot with a new component system |
| Project Delivery Readiness & Change Control decision | Integrate technical findings with its existing project assessment and receiving design; preserve its distinct ownership |
| Supply Chain readiness contract | Retain quantity, source, demand, receiving and booking boundaries |
| Theme board r22 | Reuse typography, colour, register, focus, dropdown and docked-panel treatments |
| Repository design index | Design presence, owner acceptance and runtime implementation are separate statuses |

The master blueprint references BP-05, but a separate BP-05 Markdown specification was not found at the inspected checkpoint. Do not cite an assumed BP-05 document as if it had been read. Use the master blueprint's Engineering section, the actual Engineering decisions and the specific adjoining contracts listed in section 23.

The local Windows checkout may contain newer work. Inspect it before implementation; preserve uncommitted changes and reconcile any existing EN-06, EN-07 or shared-menu components before adding new ones. Do not reset the checkout to this source checkpoint.

Apply this precedence when sources disagree:

1. Current user instructions and the expressly requested EN-06 refinements.
2. This plan's domain boundaries, state rules and written UI requirements.
3. Current shared-shell and My Work components for their respective behaviour and geometry.
4. Supplied theme board r22 for relevant component profiles.
5. Audited EN-07 desktop mockup r02 for composition, hierarchy and selected-record presentation; EN-06 and supplied screenshots support continuity.

The EN-07 desktop r02 mockup has been generated in this conversation. Save that latest image using the filename in section 22 and attach it in VS Code. The image guides composition; written semantic tokens, data rules and actual My Work geometry govern precise implementation. No phone-specific EN-07 mockup has been audited or approved in this work; responsive behaviour below remains an implementation requirement.

## 3. Scope and delivery boundaries

### 3.1 Included in the local application increment

- Six route-backed destinations within the existing app, with a discoverable entry from Engineering.
- Change creation, revision, search, filtering, sorting, saved presentation preferences and source-linked inspection.
- Exact before/proposed comparisons, affected-object relationships and explicit scope-completeness assessment.
- Discipline-owned impact findings, alternatives, rationale and independently recorded technical decisions.
- Current-source checks and review invalidation when relevant evidence changes.
- Exact handover previews, separate receiving outcomes and retained return/correction history.
- Retest requirements, evidence references, revised-release references and controlled change closure.
- Server persistence, scoped permissions, optimistic concurrency, durable operation receipts and restart recovery.
- Accessible desktop composition, responsive review, focused verification and implementation handover documentation.

### 3.2 Outside this increment

Live CAD/model comparison, automated BOM extraction, MYOB or SharePoint writes, supplier communications, financial posting, purchasing, inventory movements, controller configuration, site instructions issued to real workers and automatic booking changes are outside this local synthetic build. Native design tools retain authoring; source modules retain their transactions.

The build may create synthetic, source-owned receiving records through real local adapters where those runtimes exist. Where they do not exist, use a typed synthetic receiver with clearly labelled outcomes. A simulated acceptance must never appear as an actual ERP, SharePoint, Project or Service transaction.

The module does not require an AI assistant, graph visualisation, dashboard of large metric cards, new UI framework or standalone HTML application. A developer may create a small visual review fixture during implementation, but it does not substitute for the working local module.

## 4. Ownership and cross-module contracts

| Area | EN-07 responsibility | Source/receiving owner and boundary |
|---|---|---|
| Design basis and interfaces | Identify exact affected requirements, assumptions and interfaces; request reassessment | EN-02 owns basis and interface records |
| Drawings, technical review and issue | Compare exact current/proposed sources and record required successor issue | EN-03/EN-05 own reviews, approved purposes and formal technical issue |
| Materials and substitutions | Link the original requirement/release and proposed replacement; assess broader consequences | EN-06 owns material comparison, item/unit binding and material release |
| Products and compatibility | Link exact product/evidence versions and unresolved criteria | Products/PD-04 retain catalogue and compatibility authority |
| Project delivery and commercial effects | Provide a technical impact package with affected milestones, options and assumptions | Projects owns programme changes, readiness, variations and delivery acceptance |
| Supply Chain | Identify affected demand/PO/receipt/stock observations and request review | Supply Chain owns procurement/receiving decisions; MYOB remains intended ERP authority |
| Installed base | Assess the applicable asset/configuration and physical/served-area scope | Equipment/Service owns installed configuration observations; proposal is not installation |
| Retest and as-built | Define obligations and inspect exact completion evidence | Shared inspection capability and EN-08 own test execution, commissioning and as-built release |
| Documents and recipients | Prepare exact manifests and required recipient actions | DK-01/02 retain document/revision context; DK-03 owns controlled distribution evidence |
| Personal work and inboxes | Create/link an owned action or receiving request using shared identities | My Work and shared handover inbox present those same records, not copied tasks |

A change can affect several departments without becoming several independent engineering changes. Keep one stable change identity, one versioned assessment and linked receiving requests with separate owners and outcomes. Link an existing Project change record where present; do not silently create a second commercial variation for the same issue. [S04][s04] [S05][s05]

## 5. Desktop visual contract

### 5.1 Shell, breadcrumb and context

Reuse the existing narrow navy application rail, supplied full Powerplants mark, fixed bottom More control and global header. Do not add another department icon rail or duplicate global search, quick add, help and account controls.

Display **Engineering / Engineering Change-Impact Review** in the global breadcrumb, with the current destination identifiable when the menu is collapsed. Remove the redundant Powerplants One breadcrumb text on this route if needed. Omit the large page title, EN-07 eyebrow, subtitle and introductory paragraph from the working canvas. Preserve one accessible page heading in the semantic structure.

Use the actual header menu slot for Show menu / Hide menu. The inspected `HeaderContent` supports `menu`, `search` and `account`; it has no breadcrumb slot. Update the existing route-aware title resolver if needed instead of inventing a portal or editing global DOM nodes.

Below the header, keep a compact context/control strip: package/project picker, customer/site context, optional area/system scope and **New change** as the primary navy action. The picker resolves the Engineering package UUID. A visible project title does not become the package's identity.

### 5.2 Flush table geometry — mandatory

**Every register table extends to the left and right edges of its own container. There must be no thin white strips beside the table.** Apply this to the main register, affected-items table, review list, handover register and verification list.

- Use the existing full-bleed module layout; remove outer card margin, padding, border radius and shadow around table surfaces.
- The table header, row backgrounds and horizontal dividers span the same full container width.
- Retain normal internal cell padding, initially 12–16 px according to the reused profile. Flush layout does not mean text touches the edge.
- Toolbars and context strips retain their own compact padding. They must not impose side padding on the table's scroll container.
- With the left menu expanded, the table begins at the menu divider. With it collapsed, it begins at the workspace boundary without an empty menu track.
- With a docked inspector, the table ends at the inspector divider. Closing it releases that space immediately.
- Use one table scroll container, stable sticky headers and a bottom horizontal scrollbar where needed. Avoid duplicate page/table scrollbars and clipping the last row behind the footer.
- Default to fine horizontal dividers and restrained header separators. Do not add a heavy spreadsheet grid, zebra striping or rounded individual rows.

### 5.3 Theme and density

| Element | Required treatment |
|---|---|
| Typography | Existing Roboto assets, Verdana fallback; 14 px working text/controls and 12–13 px secondary metadata where legible |
| Primary controls | Navy `#242A37`; white text; no green action buttons |
| Brand accent | Green `#62BB46` used sparingly for brand/context, not generic approval authority |
| Working surfaces | White with pale grey headers and fine neutral dividers |
| Register rhythm | r22 register profile: approximately 43 px header and 52 px regular rows; explicitly expand rows only when content requires it |
| Hover and inspected row | Pale hover `#F8FAF7`; pale green emphasis `#EDF6E9`; keyboard focus remains separately visible |
| Controls | Existing 6 px control treatment, shared line icons, restrained dropdown shadows |
| Inspector | White, square docked edges, thin dividing border; no nested card stack |
| Status | Labelled neutral/amber/red/green meanings; colour never carries the only indication |
| Counts | Compact scoped text/badges, not oversized KPI cards; unavailable counts do not become zero |

Use theme tokens and shared components rather than copying all styles into a new global stylesheet. Differences between a menu active state and a register inspected state are intentional: preserve the actual My Work neutral active-link treatment.

### 5.3.1 Semantic formatting contract

Use the r22 semantic palette adopted by the current My Work implementation, plus r22's information token. The theme board preserves source-specific alternatives; do not mix them into this module or sample approximate colours from the raster image.

| Meaning | Text / icon | Optional surface | Example |
|---|---|---|---|
| Neutral | `#526078` | `#EDF0F5` | Draft, Assessing, Decision recorded, Assessment needed |
| Information | `#346580` | `#E9F2F8` | In review, ordinary Review required |
| Caution | `#80530E` | `#FFF2D9` | Source changed, Cost review, Scope clarification, blocking Evidence needed, Returned |
| Failure | `#993B2A` | `#FFF1ED` | Retest failed; explicit overdue/error condition where applicable |
| Confirmed positive outcome | `#416D33` | `#EDF5E9` | Exact technical acceptance or passed verification; source currentness only when established |

Warning borders use `#EFDBB6`; danger borders `#EDC6BD`; success borders `#D4E3CB`. Supporting links use `#355B80`, keyboard focus `#365D8B`, primary buttons `#242A37` with white text. The information token is verified in r22 even if no existing My Work variable names it. Define a scoped alias if needed; preserve the actual shared source values.

Implement one typed presentation mapping from domain condition to label, tone and icon. Both In review rows and both Review required rows in the reference use identical informational treatment. A separate overdue or blocking condition must carry its own explicit label; colour cannot silently encode an extra rule.

Keep Decision recorded neutral: its underlying decision may be accepted or rejected. Use green only on the actual positive fact. Future due dates remain neutral. Missing dates are Date needed, not overdue. Permission restriction uses an explanatory neutral access treatment; a pending implementation prerequisite uses caution. Row inspection, checkbox selection, keyboard focus, urgency and lifecycle are independent.

Prefer a small icon plus text in the register, with minimal pill backgrounds. Reserve the subtle amber surface for the inspector's concrete blocking prerequisite. No full-row red/amber fills; the pale-green inspected row is an interaction treatment and does not mean approval.

### 5.4 Inspector and responsive behaviour

Use a closable right inspector, initially around 448 px where space permits. Treat this as a composition target, not a replacement for an existing shared-panel token. Dock only when the remaining register viewport remains usable; target at least 760 px for the EN-07 register, with horizontal scrolling for additional columns. Otherwise overlay the inspector or open its full detail route.

Support 1920, 1440, 1366 and 1280 px desktop widths, both menu states, and 200% zoom. The actual available workspace width governs docking. On narrow screens use full-width focused details and concise record summaries with access to all fields. Preserve all workflow controls; do not shrink the desktop grid until text is unreadable.

Only one right-hand panel is active. Opening evidence replaces the panel content with a clear Back action that retains the selected change and unsaved permitted input. Overlay panels require focus containment, Escape, close controls and focus restoration. A modeless docked inspector must not trap focus.

## 6. Collapsible menu, destinations and routes

**The collapsible left-side menu must be styled and behave the same as the menu on the My Work page.** Reuse or extract its visual/behaviour primitive. Do not import My Work-specific activity queries, weather, personal dashboard content or unrelated pinned views.

This is a required conformance check, not an optional visual suggestion. Inspect `/work`, `src/activities/components/client/my-work-shell.tsx` and `src/app/styles/my-work.css`; use any shared primitive already extracted for EN-06. Preserve the exact menu typography, padding, link spacing, borders, active treatment, outline icons, header toggle and edge handle. The edge handle belongs on the menu's right divider against the register. Do not redesign My Work while adding EN-07.

Observed My Work geometry includes a 220 px desktop menu, 42 px minimum links, 20 px icons, 3 px navy active marker, white surface, fine right border, source spacing and 6 px controls. It docks from 1200 px, overlays below that width, and has a phone breakpoint at 780 px. Recheck the current code before building. [S07][s07] [S08][s08]

Use menu heading **Engineering changes**, with small descriptor **Engineering workspace**. Retain Show menu / Hide menu, the edge chevron, `aria-expanded`, `aria-controls`, hover/focus behaviour and `aria-current="page"` on the active route. There are no duplicate horizontal module tabs.

First-use desktop preference is **collapsed**, matching the EN-06 register decision. Persist later choices per workspace and actor using an EN-07-specific versioned preference. Temporary overlay opening must not overwrite the saved desktop choice. Preserve My Work's own defaults and preference keys. A preview image can show the expanded menu to demonstrate its appearance.

| Menu destination | Proposed route | Purpose |
|---|---|---|
| Change register | `/engineering/[id]/changes` | Package changes, attention, search, filters and inspector |
| Impact assessment | `/engineering/[id]/changes/impact` | Exact comparison, affected objects, alternatives and completeness |
| Review & decisions | `/engineering/[id]/changes/reviews` | Discipline findings, independent review and technical decision |
| Actions & handovers | `/engineering/[id]/changes/handovers` | Required source-owner work, receiving outcomes and corrections |
| Retest & verification | `/engineering/[id]/changes/verification` | Test obligations, evidence, revised releases and closure readiness |
| Changes & history | `/engineering/[id]/changes/history` | Proposal revisions, decisions, sources, operations and retained evidence |

Provide `/engineering/changes` as an entry/context selector. Reuse existing equivalent routes if newer local work already defines them. Here `[id]` is the Engineering package UUID. `?change=<uuid>` identifies the selected change in any destination; an optional revision/snapshot parameter opens a clearly labelled historical view. Validate every identifier and package relationship server-side.

Opening a new destination preserves valid package/change context, back/forward history, filters and scroll position where appropriate. Without a selected change, show a usable package queue and a clear selection instruction. Invalid, removed or restricted selection must not leave the last permitted change displayed under the wrong URL.

## 7. Change register and inspector

### 7.1 Toolbar and table

Use two compact control rows where needed. The first contains package context and New change. The second contains a saved-view selector, module search, filter controls and active chips on the left; scoped result count, Sort and Columns on the right. Keep rare export/archive actions in the existing overflow pattern.

Initial views: **Open changes**, **My actions**, **Awaiting review**, **Source changed**, **Awaiting receiving outcome** and **Closed**. These are filters over the same records. They do not create new lifecycle states or imply that a user owns a technical review merely because they follow the record.

| Default column | Content |
|---|---|
| Selection | Named checkbox; independent of row inspection |
| Change | Stable reference and concise title; avoid repeating package context in every row |
| Affected scope | Site/area/system summary with an inspectable count of distinct linked objects |
| Basis → proposal | Exact baseline/proposal labels; mixed revision sets show a source-set reference |
| Review state | Draft, Assessing, In review, Returned, Decision recorded or Closed; linked decision visible in inspector |
| Next action owner | Full permitted name or Unassigned; separate from author/reviewer |
| Due | Real due date and overdue indication, or Date needed |
| Attention | Most actionable reason such as Source changed, Review required, Receiving returned or Retest failed |

Optional columns include discipline, change reason, technical decision, implementation state, source currentness, required retests and latest update. Commercial amounts are permission-controlled optional detail, not a default wide column. Unknown sort values remain last. Counts clearly state whether they cover the filtered page or complete permitted package.

Search by change reference/title, drawing number, material reference, asset identifier or permitted external reference. Filters cover state, discipline, owner, affected area, attention reason, source currentness and receiving status. Multi-select permits scoped export or supported assignment actions after server validation; it never enables bulk technical acceptance, handover acceptance or closure. Default selection is empty.

Clicking a row opens the inspector and applies the inspection highlight without checking its selection box. Checkbox clicks do not navigate. Use accessible explicit links/actions alongside pointer row activation; Enter on the named change link opens it. Selection count stays accurate across filter changes, with hidden selection disclosed and safely clearable.

### 7.2 Inspector hierarchy

Show change reference/title and close control first, followed by separate review, technical-decision and implementation facts. Then show reason, exact baseline/proposal, affected scope, current-source condition, next owner/due date and the nearest permitted action.

Below that, present concise impact findings, outstanding review/receiving obligations, retest requirements and linked evidence. Use labelled sections and dividers. The inspector provides a summary and navigation to focused views; it is not a compressed version of every form.

Use specific actions such as **Continue assessment**, **Review findings**, **Review handover** or **Inspect retest**. Disabled positive actions require a nearby reason. Avoid a generic Approve button that hides whether it approves technical content, receiving work or closeout.

### 7.3 Audited inspector: source checks, follow-through and next action

The shown record is `SYN-EN07-003`, **Control interface revision**, in Irrigation Shed 01 / Controls. It has an accepted technical decision but implementation is not authorised because commercial review is outstanding. Revision D is proposed and not issued; acceptance of the change does not issue that drawing.

Immediately after the As released / Proposed comparison, show a compact source-currentness indicator, the actual source-check time, and **View exact sources**. The screenshot's “Sources current · Checked 20 Sep 2026 · 3:30 pm” belongs only to its fixed synthetic fixture. Never stamp a new current time merely because the UI loaded or a user opened the panel.

Evaluate currentness from the required source set, exact observed versions, permitted scope, source completeness and adapter capability. If a required source is unavailable, restricted, withdrawn or changed, display that condition or a permitted limitation instead of Sources current. Preserve the earlier assessed snapshot and its observation time. An unrelated row's Source changed condition must not alter the selected record's indicator, and vice versa. A source-check success does not establish technical release or commercial authority.

The impact summary remains concise: installed assets, material lines, retest and cost decision. Counts derive from distinct affected identities within the authorised scope, not fixture labels or served-area counts.

Required follow-through uses one line per obligation, with concise independent state and a link to the source-owned request/evidence. The reference shows **Revised technical release — Not requested**, **Supply Chain review — Awaiting response** and **Control interface retest — Test pending**. These phrases are display projections over the retained request/test models; do not replace those models with a new unconnected status enum. Opening a task does not complete it. Missing/unavailable outcome is not Not requested.

For this selected record, use **Open commercial review** as the primary navy action; **Review handover** and **Open impact assessment** are secondary. Navigation has no approval or issue effect. If the user cannot resolve the prerequisite, provide a permitted read-only review or owned clarification path with an explanation. If a commercial runtime is absent, open an in-module, server-persisted synthetic prerequisite record with a clear source/authority boundary; never link to a nonexistent page or present a simulated result as an actual Project/Finance approval.

After the relevant prerequisite is resolved, derive the next action from actual outstanding work and actor permissions. Do not hard-code Open commercial review on every change or leave it displayed after the task is complete. Source-owner preparation requests remain available while implementation handover is blocked where section 11 permits them.

## 8. Impact assessment and exact technical basis

### 8.1 New change and revision capture

The creation form records title, reason/category, Engineering package, company/customer/site context, affected area/system, author, next-action owner, due date or explicit missing date, and initial baseline/proposed evidence. Start as Draft; incomplete capture can be saved with clear outstanding requirements. Include an optional declared priority and reason using existing app choices; urgency does not grant authority or bypass review. Display it separately from lifecycle and technical impact.

Suggested reason categories are design correction, requirement change, supplier/product change, site/as-found discrepancy, interface conflict and field redline. They are local design choices, not an assertion of company policy. Free-text rationale remains mandatory before review.

Baseline and proposal must each identify the source record, engineering revision, file version/hash where available, approval/issue purpose, relevant scope, observed time and source owner. File version, engineering revision, technical approval and issue are separate fields. A newer file is not automatically an approved successor.

Capture the comparison as a retained snapshot. A later source update must not rewrite it. Show **As reviewed** alongside **Current source** and explain discrepancies. Native CAD remains linked evidence; the first increment compares entered structured attributes and controlled published references, not unproven geometry or drawing-pixel differences.

### 8.2 Affected scope and completeness

Present a flush affected-items table with object type/reference, current state/revision, proposed effect, impact finding, evidence, owner and next action. Support requirements/interfaces, drawing issues, EN-06 lines/releases, product/mapping references, supply observations, installed assets, site/growing-area scope, milestones, job packs and tests.

The user explicitly records whether each relevant assessment category is **Assessed**, **Not applicable with reason**, **Evidence needed** or **Not yet assessed**. Categories include technical function, interfaces, materials/supply, installed configuration, work method/site constraints, cost, dates, recipients and retest. An empty list is not evidence of no impact.

Related-record discovery suggests candidates with the relationship that led to them. An authorised reviewer confirms inclusion or a reasoned exclusion. Incomplete, unavailable or restricted sources prevent a blanket Complete claim. Unsupported relationships remain Unknown; the build must not claim exhaustive automated dependency analysis.

Distinguish an asset's physical location from the areas it serves. One pump in an irrigation shed serving three growing areas is one asset with three service relationships, not three purchased pumps. Shared hydraulic, control or electrical interfaces may prevent separate implementation even when area names differ.

### 8.3 Current/proposed comparison and options

Use aligned current/proposed columns with consistent labels and units. Changed values receive restrained emphasis and a textual change description. Provide an affected-items list for cross-record review; a dependency diagram is optional later and must not replace the list.

Support documented options such as retain current design, adopt the proposed change, or investigate a staged alternative. Each option retains its own assumptions, impacts, evidence and review result. Selecting an option does not copy acceptance from another option. Whole-scope decisions are the first increment's default.

Partial implementation is permitted only through an explicitly assessed independent child scope with its own exact manifest and decisions. The local build must refuse partial execution handover where shared dependencies remain unresolved. Hiding rows or choosing a subset of checkboxes does not narrow the technical assessment.

### 8.4 Overlapping changes

Identify other open or accepted changes that reference the same baseline, asset, material line or interface within the permitted context. Show the shared relationship and its evidence. Concurrent work is allowed, but a conflicting proposed configuration requires an explicit compatibility/sequence decision before implementation handover.

Do not automatically merge two proposals or rebase one on another's accepted successor. The author captures a new baseline/proposal revision when appropriate and obtains the reviews affected by that change. Recheck overlap at handover confirmation: a second accepted proposal must not silently authorise a contradictory configuration. If related scope is unavailable or restricted, expose a permitted dependency warning and route resolution to an authorised owner.

## 9. Impact rules by domain

| Impact domain | Required assessment and constraints |
|---|---|
| Technical performance | Record affected requirement/criterion, evidence and reviewer result; do not infer equivalence from a similar description |
| Interfaces | Identify both sides, responsible owners and changed dimensions, signals, electrical/hydraulic/control assumptions as applicable |
| Materials | Link exact original/proposed material lines, quantities, units, mapping and release purpose; EN-06 remains source owner |
| Purchased/received items | Distinguish ordered, shipped, arrived, received, inspected, usable, quarantined and returned observations; identify disposition owner |
| Installed configuration | Compare intended, observed/as-found, technically accepted and verified installed configuration separately |
| Cost | Show sourced known amounts, unknown components, currency, tax basis, observation date and confidence/completeness; estimates and approved variations remain separate |
| Dates | Distinguish requested date, supplier promise, project forecast, customer window and confirmed appointment; show proposed effect without moving commitments |
| Site/crop constraints | Identify relevant access, isolation, growing-cycle, biosecurity or shutdown evidence and responsible owner; no invented engineering thresholds |
| Recipients | Identify who must review, receive work, acknowledge an issue or inspect affected evidence; recipient selection does not send a message |
| Retest | Identify changed criterion/configuration, required test, evidence source, responsible verifier and closure condition |

Known cost components may be summed only when their currency and tax basis match. Label a partial sum **Known cost impact**, alongside unknown components. Do not treat blanks as zero, mix cost and price, invent exchange rates, or refresh an estimate/customer quotation automatically.

Quantities retain exact decimal values and evidenced unit conversions. Do not total unlike units or count both a purchased kit and included children. Reuse EN-06/Supply quantity rules where implemented. The fact that an item was purchased or installed does not make the proposed change compatible or authorised.

## 10. Reviews, decisions and current eligibility

### 10.1 Distinct state dimensions

| Dimension | Proposed values / meaning |
|---|---|
| Work stage | Draft → Assessing → In review → Returned or Decision recorded → Closed; Withdrawn is an explicit terminal work outcome |
| Technical decision | None, Accepted, Rejected; a return for clarification is not a rejection |
| Review applicability | Current, Reassessment required, Evidence unavailable; retained decisions remain historical facts |
| Implementation progress | Not requested, Requested, Partly accepted, Returned, In progress, Verification required, Complete; derived from exact linked outcomes |
| Individual receiving outcome | Pending, Accepted, Returned, Declined, Cancelled; each submission/outcome retained |
| Verification | Not required with rationale, Required, Awaiting evidence, Failed, Passed; exact criterion/configuration identified |

Source changes may make a prior accepted decision ineligible for a new handover, without rewriting that historical decision to Rejected. The register's concise work stage must not imply implementation is complete. A closed rejected or withdrawn change is distinct from an implemented change.

### 10.2 Role and authority model

Use existing identity and scoped permissions, augmented by an explicit versioned synthetic review policy. Author, discipline reviewer, technical decision authority, receiving owner and verifier are separate responsibilities. Existing `engineering.edit` is not a technical approval grant.

For the local fixture, technical decision authority must be independent of the proposal author and of anyone who materially authored its assessed technical content. Reassignment must not erase contribution history to enable self-approval. The policy identifies applicable company/site, discipline, purpose and allowed action. Absent policy displays **Authority not configured** and blocks positive decisions.

A commercial reviewer sees the permitted cost/variation facts; an Engineering reviewer cannot grant commercial authority by completing a technical review. Receiving owners act only for their own destination. A read-only viewer can inspect permitted history but cannot obtain hidden data through exports, search, counts, URLs or operation receipts.

### 10.3 Decision guards

Submitting for review requires a reasoned proposal, exact technical baseline/proposal, identified affected scope, explicit category assessments, assigned required reviewers and all mandatory technical evidence. Unknown nontechnical cost/date implications can remain visibly owned if policy permits technical review; they are not silently marked resolved.

Recording **Accept technical change** requires the exact submitted revision, current applicable technical sources, required independent discipline responses, resolved blocking technical findings and authority for the stated scope/purpose. No implicit Accepted with conditions state is used in the first increment. Resolve blocking conditions or narrow the proposal through an explicitly reviewed successor.

Technical acceptance may coexist with an outstanding commercial or scheduling decision, clearly shown as **Technical decision recorded · Implementation not authorised**. An implementation handover has additional guards in section 11. Record rejection or return with reasons and the evidence considered; correction creates a new proposal revision and retains prior responses.

### 10.4 Invalidation and version conflicts

Bind every review to the proposal revision, selected option, assessed scope, exact dependency versions and policy version. Material proposal changes require renewed relevant review. A source change invalidates the reviews that depended on it, with an explicit explanation; final handover confirmation always checks the full required dependency set.

Cosmetic preferences and private draft notes do not invalidate a decision. Changes to quantities, candidate identity, mapping, requirement, criterion, scope, approval purpose or technical evidence do. Reviewer/authority eligibility is re-evaluated on every positive command.

Two users editing the same revision receive an explicit conflict with their unsaved input retained. Do not silently overwrite a submitted assessment or accept a stale preview. External-source observation freshness follows a declared source-specific policy; no universal age threshold is invented.

## 11. Actions, handovers and receiving outcomes

### 11.1 Investigation and execution are different request purposes

An assessment can create an owned **Information required** or **Impact review requested** action before technical acceptance. Its text, type and receiving contract must identify it as investigation. It cannot be relabelled as an instruction to implement.

An **Implementation handover** requires a current accepted technical decision, resolved applicable commercial/delivery prerequisites, identified source-owner work, appropriate issue/release purpose and a complete destination-specific payload. Every required prerequisite is either evidenced as satisfied or explicitly not applicable with a competent reason. Unknown applicability blocks that handover.

Where a revised EN-05 drawing issue or EN-06 release does not yet exist, send an owned **Prepare revised technical release** request. It requests controlled preparation and cannot instruct procurement or field implementation. A later implementation payload links the exact resulting issue/release; it does not rely on the request alone.

### 11.2 Review before creating requests

The handover preview shows:

- Exact change/proposal/assessment/decision identities and source versions.
- Included scope, exclusions, required prerequisite evidence and currentness.
- Each destination, named owner, requested action, due date and receiving payload.
- Existing related requests, so the user can reuse/correct one instead of duplicating it.
- Required downstream approvals, revised technical releases and verification obligations.
- A plain-language effect summary, including which receiving decisions remain outstanding.

The confirm action is named for its effect, such as **Create 3 review requests** or **Submit implementation handover**. Display the actual count and purpose, never a generic Apply change label. Generated, submitted, accepted, distributed and acknowledged remain separate facts.

### 11.3 Durable receiving contract

Each request has a stable identity, destination/source context, exact submitted payload version, owner, purpose, submitted time and original-operation reference. Receiving acceptance records who accepted which submission, when and with what reason/evidence. It does not rewrite the technical decision or prove that the requested physical work occurred.

Returned requests retain their identity, original payload and reason. Correction creates a new submission linked to that request; the receiver must assess the new exact payload. Declined means the destination does not accept that request, with an accountable next step. A recipient removed after submission requires an explicit cancellation/successor event, not deletion of history.

If one of three receivers accepts and two remain unresolved, show those outcomes individually. Do not roll back accepted history or display a blanket Accepted badge. A revised change affecting an already accepted request creates an explicit amendment/withdrawal review for that receiver. It does not undo completed work or silently replace the receiver's accepted payload.

Reuse the existing shared Activity/hand-over/inbox identities. Persist local request creation atomically with its audit event and operation receipt. Use a durable outbox where delivery crosses service/adaptor boundaries; delivery attempts may retry but cannot create duplicate receiver effects. Unknown receiving outcomes remain **Outcome unknown — check original request** until reconciled.

## 12. Retest, verification and closure

The Retest & verification view is a flush register of obligations, not an independent test-execution engine. Each obligation identifies requirement/criterion, affected asset/system, applicable proposed configuration, approved test-procedure version, reason for test, responsible verifier, due date, evidence and result.

A completed Activity, attached photo or recipient acknowledgement cannot by itself satisfy a test criterion. Evidence must name what was tested, which configuration was present, when it was tested and the competent result source. A failed test retains the failed attempt and creates/links owned corrective work. A repeat attempt is a separate record, not an edited Pass over a prior Fail.

Test values and acceptance thresholds come from the exact approved technical basis. The plan supplies no hydraulic, electrical or control-performance limits. If the procedure or criterion is missing, show **Test basis needed** and block a positive verification result.

Closure checks the whole declared change scope, regardless of filters or pagination:

1. The final technical disposition is recorded and current for the closure being claimed.
2. Every required source-owner action has an evidenced outcome, with outstanding exclusions explicitly governed.
3. Required revised drawings/material releases exist with their proper purpose and retained issue references.
4. Required receiving decisions and acknowledgements are present; a notification attempt is not an acknowledgement.
5. Required retests pass for the relevant configuration, or a competent Not required rationale exists.
6. Installed/as-built evidence and EN-08 receiving references are present where applicable.
7. An authorised closer records the exact closure basis and reason.

An accepted technical proposal with unresolved implementation or verification cannot be closed as implemented. Rejected or withdrawn changes can close as **No implementation**, with reasons, resolution of issued requests and any required receiver acknowledgement. A withdrawal cannot erase accepted receiving obligations or already performed work.

After closure, later evidence is handled through a linked follow-up/change or an explicitly audited reopening policy. The first increment uses a linked successor change; it does not silently reopen or mutate the closed assessment.

## 13. Proposed data model and invariants

Inspect the live schema and current Engineering/EN-06 work before adding tables. The following are logical records, not an instruction to create one table for every row. Preserve current workspace, company, package and identity conventions.

| Logical record | Essential content |
|---|---|
| Change | UUID, permitted display reference, package/context, title, author, next owner, work stage, current revision, version |
| Proposal revision | Immutable submitted content, reason, selected option, scope, predecessor and revision author/contributors |
| Source snapshot | Typed source identity, engineering/file/record versions, hash where available, purpose, applicability, observed time, completeness/currentness |
| Affected object | Exact typed object, relation/evidence, scope, proposed disposition, inclusion/exclusion rationale |
| Impact assessment | Proposal/scope/source-set identity, category findings, alternatives, unknowns, completeness and snapshot hash |
| Review response | Assessor/discipline, dependencies, result, reason, source/policy versions, submitted time and applicability |
| Technical decision | Exact assessed content, independent authority, accepted/rejected result, purpose, reason and retained policy |
| Action/handover | Shared request identity, purpose, destination, owner, due date, accepted submission and receiving outcome |
| Retest obligation | Exact criterion, configuration, procedure source, responsible verifier, evidence attempts and final outcome |
| Closure snapshot | Change/review/request/test/release dependencies, authority, closure meaning, reason and timestamp |
| Audit/operation/outbox | Actor, command, expected versions, input hash, original result, delivery state and durable recovery identity |

Server rules must enforce:

- Workspace/company/site/package relationships are validated, not accepted from client labels.
- UUIDs and exact provider/configuration/company/entity keys establish identity; titles and display numbers do not.
- Submitted assessments, decisions, source snapshots, issued payloads and closure records are immutable. Mutable working drafts use optimistic versions.
- A submitted review cannot change its assessed option/scope after the fact. A successor retains its lineage.
- Scope manifest and required-review completeness are assessed across all relevant records, not the visible table page.
- Dates retain their meaning: local due dates and site timezone separately from UTC audit instants.
- Numeric quantities/money use the established exact decimal representation and stated units/currency; no binary-float equality for release decisions.
- Required review contributors remain recorded through reassignment and revision, supporting independence checks.
- Historical receipt recovery uses current access checks. Revoked access does not become a backdoor through old operation IDs.
- A closed or withdrawn record cannot accept a new implementation command without the defined successor path.

Display-reference allocation follows PPO-STD-001 and the actual existing catalogue. Do not invent a production reference prefix merely because examples use `SYN-EN07-001`. Such labels are explicit fixture aliases until mapped to the real naming scheme.

## 14. API, transaction and recovery design

Use the current Engineering read/command route conventions and domain services. Proposed API namespace is `/api/v1/engineering/[id]/changes`; endpoint shapes below are provisional and should align with actual repository adapters.

| Operation family | Purpose and critical guards |
|---|---|
| List/detail/history | Server-scoped projections, validated filters/cursors, permitted source and commercial fields |
| Create/update draft | Strict payload, valid linked package, editable state, expected record version |
| Capture assessment | Validate source set/scope/selected option; persist reproducible snapshot and dependencies |
| Submit/review/decide | Exact submission, independence, authority, current dependencies and explicit result |
| Preview/confirm requests | Server-derived exact manifest; current versions, required prerequisites and unique operation identity |
| Receive/correct request | Destination-owner permission, exact submission, reason, expected version and retained previous outcome |
| Record verification/close | Source-owned evidence references, exact criterion/configuration, whole-scope completion and closure authority |
| Recover original operation | Current access, original input identity and durable receipt; return the original permitted outcome |

For every positive command, derive principal/workspace from the session. Never trust client-supplied actor, approval authority, readiness, totals or scope-completeness booleans. Validate payloads through existing adapters and return structured field errors or explicit conflict/blocked/recovery outcomes.

Within the local PostgreSQL transaction, re-read/lock the applicable change, review, policy and local source versions; evaluate guards; write the decision/request/history and receipt together. The same operation identity with the same canonical input returns its original result. The same identity with different input is rejected. Simultaneous commands must not create duplicate decisions, requests or closure events.

A preview is informational until server confirmation. Confirmation revalidates its proposal/source/policy versions. If a dependency changes, preserve the user's proposed work and return **Source changed — review the updated comparison**. Do not transparently refresh the preview and apply different content.

A remote-source observation cannot be locked by a local database transaction. Store its provenance and completeness, apply a declared freshness/verification policy and refuse a current-use claim when the adapter cannot establish it. Synthetic adapters must model that limitation. Do not describe an old snapshot as an atomic live external check.

A source withdrawal is distinct from a newly available revision. Preserve the withdrawn source's history, make affected future-use decisions ineligible, and create an owned review of already submitted/accepted work. The receiving owner determines the actual operational response; the app must not claim that changing a badge stopped field work or recalled an issued document.

Failure before commit creates no effect. If commit succeeds but the response is lost, show an uncertain outcome and recover the original receipt; do not invite a new request with a fresh operation key. Separate local acceptance from outbox delivery and remote receiver outcome.

## 15. Architecture and implementation locations

Extend the existing modular application. No new service, database, UI framework or package upgrade is required by this plan.

| Layer | Existing reference / proposed implementation |
|---|---|
| App entry/layout | Existing `src/app/(business)/engineering/`; add route family from section 6 |
| Shared navigation | Reuse/extract My Work secondary-menu presentation and focus handling with an EN-07 preference key |
| UI components | Proposed `src/engineering/changes/components/`; register, inspector, comparison, review, receiving and verification components |
| Styles | Proposed `src/app/styles/engineering-changes.css`, scoped to EN-07; reuse full-bleed layout and shared tokens |
| Domain | Proposed `src/engineering/changes/model.ts`, `validation.ts`, `service.ts`; pure assessment/eligibility helpers where useful |
| Source adapters | Typed interfaces for technical sources, material releases, installed configuration, project/supply context and test evidence |
| API | Existing command/read conventions beneath the proposed Engineering changes namespace |
| Persistence | Current PostgreSQL, additive schema changes, shared operation/audit/outbox where suitable |
| Tests | Focused domain, database and browser cases for the risks in section 20 |
| Documentation | Stable decision/delivery files; issued plan/reference retained; concise actual-status update |

A shared-menu extraction should contain only reusable navigation/interaction behaviour and explicit configuration. Preserve My Work's own data fetching and visual defaults. If EN-06 already introduced that primitive locally, consume it rather than extracting another one.

Prefer server-side filtering and pagination using the current application's conventions. Do not fetch all cross-company records into the browser and hide them afterwards. Keep list payloads small; load detailed source/evidence projections when inspected. Stable ordering includes a tie-breaker so rows do not repeat or disappear across pages.

Allocate the next migration from the actual working tree. The inspected EN-06 source checkpoint listed migration 0028; that is not permission to assume 0029 is free. Follow AGENTS.md's migration-registry and dependent-test requirements. Re-read live schema because later migrations can change earlier definitions. Seed synthetic additions without resetting existing user data or rewriting prior fixtures. [S06][s06]

## 16. Synthetic scenario pack

All scenarios use clearly labelled fictional organisations, projects, sources, people and policies. Use existing compatible fixture identities when verified; otherwise allocate new namespaced identities. Never rewrite a retained EN-06 or Project fixture to make a new positive journey pass.

### 16.1 Desktop reference fixture

Keep a reproducible visual fixture matching the audited image, separate from mutable user work. Project/customer/site labels are **Nursery irrigation upgrade**, **Willowbank Horticulture**, **Nursery & propagation site**. The shown project alias is `SYN-PPO-PRJ-000701`; resolve a compatible existing fixture or explicitly create a new synthetic one through supported seed conventions. Do not equate that display alias with a package UUID or silently reuse an unrelated object.

The baseline screen contains eight open change records, no checkbox selection, and `SYN-EN07-003` open in the inspector. First-use menu preference remains collapsed; the screenshot deliberately shows the expanded state. The following dates are local dates in September 2026, not UTC instants.

| Reference | Change | Scope | Basis → proposal | Review state | Next action owner | Due | Attention |
|---|---|---|---|---|---|---|---|
| SYN-EN07-001 | Valve assembly substitution | Greenhouse 01 | H-102 · B → C | In review | Alex Lee | 21 Sep | Review required |
| SYN-EN07-002 | Pump duty amendment | Irrigation Shed 01 | H-101 · C → D | Assessing | Sam Jordan | 21 Sep | Source changed |
| SYN-EN07-003 | Control interface revision | Irrigation Shed 01 | E-201 · C → D | Decision recorded | Sam Jordan | 22 Sep | Cost review |
| SYN-EN07-004 | Sensor relocation | Propagation House | E-204 · A → B | In review | Alex Lee | 23 Sep | Review required |
| SYN-EN07-005 | Pipework reroute | Greenhouse 02 | H-110 · B → C | Returned | Sam Jordan | 24 Sep | Scope clarification |
| SYN-EN07-006 | Filter access clearance | Irrigation Shed 01 | M-106 · A → B | Assessing | Alex Lee | 25 Sep | Evidence needed |
| SYN-EN07-007 | Commissioning logic update | Shared controls | E-205 · B → C | Decision recorded | Sam Jordan | 25 Sep | Retest failed |
| SYN-EN07-008 | Valve isolation arrangement | Greenhouse 01 | H-108 · A → B | Draft | Alex Lee | Date needed | Assessment needed |

Give the selected record one affected installed asset, two material lines, a required retest and a pending cost decision. Populate exact provenance and independent-review policy for its accepted technical decision. Baseline E-201 revision C permits Procurement; proposed revision D is Not issued. Supply Chain's Awaiting response entry is an investigation/review request, not an implementation instruction. Preserve those distinctions when building the positive path.

Menu badges and register totals are derived from permitted queries with explicit scope, even where a seeded screenshot reproduces 2 reviews and 3 handovers. Unavailable counts cannot fall back to those numbers. Business records live on the server; only presentation preferences may use browser storage.

### 16.2 Behaviour and failure scenarios

The `EN07-S...` identifiers below name test scenarios, not the eight UI record IDs. Build variants through isolated fixtures or explicit successor events; do not seed contradictory facts onto a record solely to satisfy a screenshot.

The primary demonstration is a proposed irrigation control/valve assembly change in an awarded Project package. The installed asset sits in an irrigation shed and serves two growing areas. Source drawings, material lines, interface evidence and a future retest are linked by exact synthetic identities. Numeric technical limits are supplied only by explicit synthetic source records, not invented as operational advice.

| Scenario | Seeded condition | Required result |
|---|---|---|
| EN07-S001: complete path | Released baseline, proposed successor, complete technical evidence, independent reviewers and clear receiving scope | Technical decision, revised-release request, exact implementation handover, separate receiving, verified evidence and closure |
| EN07-S002: purpose mismatch | Source is approved for design coordination only | Investigation/review possible; procurement/installation handover remains blocked |
| EN07-S003: source advance | Relevant drawing/material version changes after assessment | Retained snapshot survives; dependent review requires reassessment; stale confirmation refused |
| EN07-S004: purchased/installed impact | One affected assembly ordered; another already installed; outstanding disposition/retest | Distinct impacts, source-owner requests and verification; no automatic PO or asset rewrite |
| EN07-S005: commercial unknown | Technical evidence sufficient; one cost component known and remobilisation unknown | Known partial amount labelled; technical decision may be recorded; implementation prerequisite remains open |
| EN07-S006: shared dependency | Two growing areas share a controller/interface | Subset selection cannot imply independent implementation; staged handover blocked without explicit evidence |
| EN07-S007: returned receiving | Supply accepts exact submission; Service returns its request with a reason | Individual outcomes retained; corrected Service submission uses the same request identity |
| EN07-S008: failed retest | Exact test fails, then a later corrective attempt passes | Both attempts retained; closure uses current successful evidence and resolved corrective work |
| EN07-S009: interruption | Confirm succeeds but response is lost; app restarts | Original receipt/outcomes recover with no duplicate requests |
| EN07-S010: access/authority | Restricted commercial viewer, revoked site access and self-review attempt | No hidden-field leakage; current access enforced; self-acceptance refused |
| EN07-S011: no impact | One source category not applicable and another assessed as no impact | Both require distinct rationale; empty/unavailable categories never count as assessed |
| EN07-S012: rejected/withdrawn | Rejected proposal plus a separate withdrawal with submitted requests | No-implementation closure follows explicit disposition/cancellation; accepted obligations remain visible |

Use a fixed demonstration clock for deterministic screenshots and due-date fixtures. Dates are explicit local dates; audit times are stored as instants and displayed with the relevant timezone. Missing due dates show Date needed with no contradictory invented date beside them.

Keep demo role/scenario controls clearly marked and away from routine product actions. Use actual server principals and synthetic policy for security tests; a client-side role dropdown alone is not permission enforcement.

## 17. Empty, error, restricted and interrupted states

| Condition | Required UI and recovery |
|---|---|
| No changes exist | Quiet empty state and New change if permitted; no invented examples mixed with live records |
| No filter matches | Explain active filters; offer Clear filters; preserve the chosen package |
| Loading | Stable table/skeleton geometry; loading is not zero results |
| Source missing/unavailable | Identify missing evidence and owner where permitted; retain last-known context as historical |
| Restricted source | Neutral permitted message; no hidden title, commercial figure, recipient or exact inaccessible count |
| Stale comparison | Source-change banner scoped to affected review; retain As reviewed and provide Refresh comparison |
| Returned review/request | Prominent reason, responsible owner and correction action; original history remains inspectable |
| Unsaved draft | Preserve input across recoverable errors; explicit leave/discard choice where navigation would lose it |
| Version conflict | Explain that another update exists; retain user's draft and provide a reviewed reconciliation path |
| Outcome unknown | Recover original operation; suppress duplicate positive command until reconciled |
| Failed retest | Show exact attempt, criterion/configuration and corrective owner; closure blocked |
| Export/print error | Retain current selection and explain retry; do not mark an output generated/issued |

Error content should say what failed and what the user can do next. Do not expose SQL errors, source credentials or implementation internals in the product UI. Preserve specific technical evidence where it helps the user make a decision.

## 18. Accessibility, privacy and outputs

Use semantic tables, named row checkboxes, associated field labels/errors, sort state, real navigation links and a visible focus indicator. Keyboard users must be able to open a record, inspect evidence, operate the menu, resize columns through an accessible alternative, submit a review and recover focus after closing a panel.

Do not use colour alone for attention, decision or selected state. Announce result counts and asynchronous command outcomes politely; avoid repeatedly announcing the entire table. At 200% zoom, toolbars may reflow and tables may scroll horizontally, but controls, validation and the final row remain reachable. Use the shared phone touch-target treatment, normally at least 44 px for principal actions.

Read, search, print, CSV and history use the same server permission projection. Sensitive cost components must not survive in hidden DOM, downloaded data, tooltips, source snippets or diagnostics. Source links and filenames are treated as untrusted content; render escaped text and use the existing safe-link/attachment mechanisms.

| Output | Required content and meaning |
|---|---|
| Change assessment summary | Exact proposal, baseline, options, affected scope, findings, unknowns and source time; review aid |
| Technical decision record | Exact assessed snapshot, purpose, independent decision, policy version and reasons; no purchase/field authority implied |
| Handover manifest | Exact source-owned requests, recipients/owners, scope, prerequisites and submission identities |
| Verification/closure report | Required obligations, retained failed/repeat attempts, current evidence, exclusions and closure meaning |
| Register CSV | Permitted filtered records with stated scope; no hidden commercial or recipient fields |

Exports must label **Synthetic local prototype** and their own generated time separately from source/decision times. Preserve units, currency and tax basis. Neutralise formula-leading user text in CSV. Exporting a report does not issue or distribute a controlled document. The build should provide accessible print output; any PDF mechanism must reuse an existing supported renderer rather than adding a new service by default.

## 19. Build stages and exit criteria

Build incrementally, with a usable integrated slice at each stage. Do not postpone the domain controls until after decorative UI work.

| Stage | Work | Evidence required before moving on |
|---|---|---|
| 0. Reconcile current checkout | Read root/nested instructions, status, actual schema, Engineering/EN-06 routes, My Work menu and source contracts; preserve local changes | Source map, reuse decisions, typed missing-dependency list and actual route/migration choices |
| 1. Workspace and navigation | Add scoped entry, six routes, compact breadcrumb, menu parity, full-bleed register and inspector using read-only synthetic records | Desktop captures show correct edges/menu states; route/back/focus work; My Work remains unchanged |
| 2. Persistent capture | Add only missing schema, validation, drafts, exact source snapshots, affected-object links and rerunnable seed | Save/reload/restart preserves IDs/content; source identity and permissions verified |
| 3. Assessment and review | Complete comparison/options, category completeness, independent reviews, decisions and source invalidation | Positive and missing/stale/self-review cases behave correctly; immutable history retained |
| 4. Requests and recovery | Add exact previews, source-owner requests, receiving returns/corrections, receipts and outbox/adapters | Mixed receiver outcomes, conflict, lost response and duplicate attempts proven |
| 5. Verification and closure | Link retest evidence, revised releases, installed/as-built references and closure snapshots | Failed test blocks closure; later exact successful evidence permits appropriate closure |
| 6. Conformance and handover | Finish responsive/accessibility/outputs, focused regression tests, documentation and evidence | Acceptance matrix recorded honestly; working local URL, captures, persistence proof and limitations supplied |

Use current pinned dependencies and launch instructions. The inspected repository uses `npm run dev` for local development; normal root is `http://127.0.0.1:3000`. Proposed module entry is `http://127.0.0.1:3000/engineering/changes`. Report the actual URL if the port or route differs. `npm start` was deliberately rejected in the inspected repository; do not replace its launcher.

Run additive migrations/seeds through existing scripts after inspecting their effects. Reuse a healthy local server and restart only task-owned processes. Database tests must use the approved synthetic test database (`ppo_synthetic_test` in the inspected instructions), never the user's working database. Keep environment values and connection strings out of output.

## 20. Acceptance and verification matrix

All cases below are **planned**. None is an executed result of this report. Record actual commands, commit, fixture/policy versions and evidence paths during implementation. Use unit checks for deterministic rules, database tests for transactions/permissions/restart and browser checks for user journeys and visual behaviour.

| ID | Case | Expected evidence |
|---|---|---|
| EN07-A01 | Entry and package identity | Engineering link reaches permitted context; Project UUID cannot substitute for package UUID |
| EN07-A02 | Six destinations | Direct links, refresh and browser history retain valid context and active navigation |
| EN07-A03 | Compact header | Breadcrumb identifies module/view; no duplicate large title, eyebrow or subtitle |
| EN07-A04 | My Work menu parity | Source-derived width, links, active marker, icons, toggle and focus match; My Work regression capture unchanged |
| EN07-A05 | Menu preference | First desktop use collapsed; actor/workspace choice persists; overlay does not overwrite it |
| EN07-A06 | Flush tables | Header, rows and rules meet both container edges in every register; no side strips in either menu state |
| EN07-A07 | Inspector geometry | Dock/overlay/full-width transitions preserve usable content, close/focus and no residual gutter |
| EN07-A08 | Inspect versus select | Opening a row leaves checkboxes empty; selection count and hidden selection remain explicit |
| EN07-A09 | Register controls | Search/filter/sort/columns, stable pagination, unknown ordering and Clear filters behave consistently |
| EN07-A10 | Missing dates/counts | Date needed has no invented date; unavailable/partial counts do not display a false zero |
| EN07-A11 | Draft persistence | Create/edit/reload/restart retains actual server record and audit identity |
| EN07-A12 | Exact baseline | Engineering revision, file version, hash, issue purpose and observation time remain separate |
| EN07-A13 | Unsupported source purpose | Coordination-only source cannot enable procurement/installation handover |
| EN07-A14 | Scope completeness | Empty, unavailable and not assessed differ from reasoned No impact/Not applicable |
| EN07-A15 | Scope independent of filters | Hidden rows and other result pages still participate in review/closure guards |
| EN07-A16 | Location versus served areas | One shared asset is not duplicated by its served-area count |
| EN07-A17 | Shared dependencies | Unproven independent subset cannot proceed through partial execution handover |
| EN07-A18 | Candidate option change | Selecting another option requires its own assessment/review and invalidates incompatible responses |
| EN07-A19 | Quantities and units | Exact conversion evidence, kit handling and incompatible-unit refusals match source contracts |
| EN07-A20 | Commercial unknowns | Partial known sum labelled; unknown is not zero; currency/tax mismatch not silently totalled |
| EN07-A21 | Dates and commitments | Proposed impacts leave supplier commitments, forecasts and confirmed bookings unchanged |
| EN07-A22 | Review independence | Author/contributor cannot self-accept through reassignment or alternate UI route |
| EN07-A23 | Authority policy | Absent/out-of-scope/revoked policy blocks positive command; exact evaluated policy retained |
| EN07-A24 | Return and correction | Reason retained, successor revision created and required reviews renewed |
| EN07-A25 | Technical versus implementation | Technical acceptance can coexist with unresolved nontechnical prerequisites; implementation remains blocked |
| EN07-A26 | Relevant source advance | Dependent review becomes inapplicable; original decision and comparison remain intact |
| EN07-A27 | Benign preference change | Column/menu/private-note changes do not falsely invalidate technical evidence |
| EN07-A28 | Competing edits | Expected-version conflict preserves user input; no silent lost update |
| EN07-A29 | Request purposes | Investigation and revised-release preparation cannot masquerade as implementation instruction |
| EN07-A30 | Exact handover preview | Confirmation validates same scope/source/policy; changed basis forces reviewed refresh |
| EN07-A31 | Receiver ownership | Only permitted destination owner can accept/return the exact submission |
| EN07-A32 | Mixed receiving outcomes | Accepted, returned and pending coexist correctly with separate histories |
| EN07-A33 | Same-identity resubmission | Corrected return preserves request UUID and prior payload/outcome; receiver assesses successor |
| EN07-A34 | Post-acceptance amendment | Changed proposal creates explicit receiver follow-up; accepted history is not overwritten |
| EN07-A35 | Fail before commit | No decision/request/audit/receipt partial effect remains |
| EN07-A36 | Lost response and restart | Recover original accepted operation after restart; one request set only |
| EN07-A37 | Duplicate/racing confirmation | Same input/key recovers; conflicting input/key refused; parallel commands do not duplicate effects |
| EN07-A38 | Adapter/outbox uncertainty | Retry preserves original identity; unavailable receiver never appears accepted |
| EN07-A39 | Test basis | Missing criterion/procedure/configuration blocks positive verification |
| EN07-A40 | Failed and repeat tests | Failed attempt remains; later pass binds to exact corrected configuration |
| EN07-A41 | Closure controls | Whole-scope requests/releases/retests/required acknowledgements checked; task completion alone insufficient |
| EN07-A42 | Rejected/withdrawn closure | No-implementation result explicit; existing accepted obligations remain accounted for |
| EN07-A43 | Historical integrity | Issued files, prior reviews, accepted manifests and closed assessment remain unchanged |
| EN07-A44 | Permission projection | APIs, direct URLs, search/counts, DOM, exports and receipts do not disclose restricted facts |
| EN07-A45 | Revoked access on recovery | Historical operation ID cannot bypass current site/company access |
| EN07-A46 | Responsive/accessibility | Target desktop sizes, 200% zoom, narrow review, keyboard/focus, named controls and errors verified |
| EN07-A47 | Export/print | Exact permitted snapshot, synthetic label, units/times and CSV formula handling; output is not issue |
| EN07-A48 | Migration/seed compatibility | Upgrade and rerun preserve existing records; registry-dependent suites updated as required |
| EN07-A49 | Adjacent module regression | Engineering intake, EN-06 if present, My Work menu and global shell retain their expected behaviour |
| EN07-A50 | Complete walkthrough | Author → independent review → revised release → handover/return → retest → closure works and survives restart |
| EN07-A51 | Overlapping proposals | Shared-object conflict discovered and rechecked at confirmation; no silent merge/rebase or contradictory implementation handover |
| EN07-A52 | Withdrawn technical source | Historical issue retained, future-use eligibility blocked and existing receiver obligations reviewed; no fictional recall/stop-work effect |
| EN07-A53 | Consistent semantic formatting | Equal domain conditions render equal tone/icon/label; both Review required rows informational; Decision recorded remains neutral |
| EN07-A54 | Source-currentness projection | Actual check time/provenance shown; unavailable, restricted, changed and withdrawn sources cannot show Sources current |
| EN07-A55 | Follow-through projection | Exact request/test state drives each label; inspecting it does not complete it; unknown outcome is not Not requested |
| EN07-A56 | Relevant primary action | Selected fixture opens permitted commercial review; resolving it recomputes next action; navigation grants no approval |
| EN07-A57 | Menu reuse without collateral change | Actual My Work geometry/focus/toggle preserved; EN-07-specific preference; shared extraction does not import weather/activity state |
| EN07-A58 | Source and menu counts | Counts reflect permitted complete scope or qualified partial state; no hard-coded 2/3/8 fallback or restricted count leak |
| EN07-A59 | Audited visual fixture | Eight records, selected third-row inspector, zero checks, exact revision/purpose and incomplete follow-through match r02 |
| EN07-A60 | No-runtime dependency fallback | Missing commercial/technical receiver opens labelled persisted local workflow or owned clarification; no dead link or fictitious live acceptance |

Visual evidence should include: register with menu collapsed; register with menu expanded; inspected row with empty selection; impact comparison; returned receiving request; failed retest; history; narrow/zoomed mode. Compare with audited EN-07 mockup r02, the written contract, actual My Work page and r22. Inspect computed CSS for semantic tokens and contrast, since generated raster colours are illustrative. An image resembling the design does not prove persistence or permissions.

Run the existing relevant typecheck, lint, build, domain/database and browser suites using current scripts. Broaden tests for actual shared-component/migration risks and repository-required gates. Do not claim a test passed if it was skipped or blocked; identify environment failures separately from regressions using the current baseline where necessary.

## 21. Open decisions and safe local defaults

| Decision | Local build default | Operational dependency retained |
|---|---|---|
| Technical authority | Explicit versioned synthetic policy; absent policy blocks | Actual competency, discipline and approval policy under D-019 |
| Source currency | Exact observation/version plus declared adapter capability | Verified provider-specific currentness/withdrawal rules |
| Change numbering | Existing naming mechanism; fixture aliases clearly labelled | Any new production reference type must follow PPO-STD-001 |
| Partial implementation | Whole-scope by default; reject unsupported staged execution | Evidence and policy for independent child scopes |
| Cost/date authority | Separate owned prerequisite; unknown remains visible | Real commercial and scheduling decision rules |
| Receiver availability | Reuse actual local runtime, otherwise visibly synthetic adapter | Verified operational integration and receiving authority |
| Retest completion | Exact source-owned test evidence; fixture engine only where needed | Commissioning/inspection authority and approved criteria |
| Closure after withdrawal | Explicit no-implementation disposition and receiver reconciliation | Operational treatment of already executed work |
| Notifications/distribution | Local inbox/action records and output previews | Authorised live delivery and DK-03 receipt/acknowledgement contract |
| Opportunity-context work | Permit assessment for enquiry support; block implementation handover without eligible awarded/delivery context | Any additional supported Service context requires its own verified contract |

These decisions allow a useful synthetic implementation without inventing operational authority. They are product/domain dependencies, not additional permission requests for routine local work already authorised in the implementation session.

## 22. Build deliverables and completion definition

The implementation should deliver the six-view local module, additive persistent model, typed source/receiving adapters, synthetic scenarios, meaningful tests and evidence, and a concise developer handover.

The handover must state the actual route/port, branch/commit, changed areas, migration/seed effects, current supported source integrations versus synthetic adapters, exact test results, persistence/restart evidence, visual captures and remaining limitations. Update the repository's existing decision/delivery/status records in the form required by its instructions. Do not label a plan, mockup or passed local suite as business acceptance or deployment.

Recommended eventual documentation locations, subject to existing local files:

- Stable plan: `docs/delivery/engineering-change-impact-review-build-plan.md`.
- Decision: `docs/decisions/engineering-change-impact-review-design.md`.
- Evidence: a scoped folder under `docs/testing/evidence/`.
- Issued reference: retain this r02 report and any existing issued r01 source unchanged beneath the appropriate `docs/reference/` location if later committed.

### 22.1 Files for the VS Code coding session

1. This plan: **`PPO-EN-07-Engineering-Change-Impact-Review-Build-Plan-r02.md`**.
2. Executable instruction file: **`PPO-EN-07-Engineering-Change-Impact-Review-VS-Code-Build-Prompt-r01.md`**.
3. Save the latest audited image as **`PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r02.png`**. Identify it by Sources current, follow-through progress and Open commercial review. The filename recommendation does not itself rename the generated image.
4. Optional supplementary references: supplied theme board r22 and `collapsible-menu.png`; use the actual My Work source for menu implementation.

Open the existing PPO checkout in Visual Studio Code; the user's earlier path was `C:/Users/Dean.Fiedler/Projects/powerplants-one`. Confirm the actual workspace. Attach the plan and image to the coding conversation and paste the companion prompt, or attach all three files and instruct the coding agent to execute the prompt. ChatGPT files are not automatically available in VS Code.

The prompt instructs the coding agent to implement, verify and run the module locally. It should work through the seven stages and preserve existing code/data. If the image is missing, continue from the written layout/fixture contract, name the missing reference and leave exact image comparison pending rather than falsely claiming conformance.

Use current local configuration and the existing launcher. Check database health, review/apply additive migrations and supported non-destructive seed changes, then run or reuse `npm run dev`. Local entry is proposed at `http://127.0.0.1:3000/engineering/changes`; report the actual route/port. Use the documented test configuration for a separate synthetic test database. Never use database reset to prepare the user's working app.

### 22.2 Planning handover status

This task delivers the updated plan and companion prompt. Application code, migrations, runtime tests and deployment are future implementation work; no such execution is claimed here. The visual audit corrects composition and state presentation but is not native browser, screen-reader or physical-device acceptance.

## 23. Traceability and source register

| Requirement / dependency | Contribution and limit |
|---|---|
| EN-07 / ENG-06 | Principal scope: technical change-impact assessment, authority, affected recipients and retest |
| ENG-02 / ENG-03 / ENG-04 | Preserve basis, interfaces, drawings, revisions, review and issue purpose through source links |
| ENG-05 / EN-06 | Assess consequences of exact material/substitution releases; do not recreate their authority |
| ENG-07 / EN-08 | Track required commissioning/as-built evidence and receiving references; no duplicate test engine |
| Projects / Supply / Service | Owned impact handovers; no implicit commercial, purchasing, stock or booking change |
| AT-37 / AT-38 | Engineering and project end-to-end evidence contributions; parent acceptance not claimed |
| D-008 / D-019 | Source-system and technical authority decisions remain operational dependencies |

Sources were inspected for this revision or earlier in the same ongoing design work; claims are bounded to the stated checkpoint. r01's domain sources retain their `99c32aed...` links. r02 refreshed main, instructions, runtime scripts, status, My Work shell/CSS and Engineering service at `1a69e93c...`; these current implementation references are identified below. r22's Git blob remains `d830d455dcfb6c2d815677baade7489f5845fbc5`. This is not a full re-audit of every upstream module.

| Source | Reference and use |
|---|---|
| S01 | [Coverage Register r06][s01]: EN-07 title, scope, EN-05 dependency and EN-08 allocation |
| S02 | [Master Blueprint section 11][s02]: ENG-01–ENG-07, change/substitution obligations and authority boundaries |
| S03 | Current `PPO-EN-06-Released-Materials-and-Substitutions-Build-Plan-r02.md`, saved revision 1, read 20 September 2026: approved desktop refinements and local build approach |
| S04 | [Project Delivery Readiness & Change Control decision][s04]: existing assessment, source, receiving and recovery design; standalone design is not runtime integration |
| S05 | [Supply Chain readiness contract][s05]: exact source/quantity/demand and independent receiving/booking meanings |
| S06 | [AGENTS.md][s06]: preserved references, source authority, migration effects and validation/handover rules |
| S07 | [My Work shell][s07]: header toggle, route/menu behaviour, persisted preference and dock/overlay handling |
| S08 | [My Work CSS][s08]: source menu geometry, typography, active/focus treatment and component tokens |
| S09 | [Engineering service][s09] and [model][s09b]: package context, scoped permissions, domain/operation conventions |
| S10 | [Header content][s10], [module layout][s10b] and [desktop shell][s10c]: supported slots and full-bleed composition |
| S11 | Supplied `powerplants-one-theme-style-board-r22(1).html`, [repository r22 reference][s11]: component profiles, register rhythm, colours and panels; source board contains mixed component lineage rather than a new universal layout |
| S12 | [Design index][s12]: distinction between available design, recorded approval and runtime evidence |
| S13 | Supplied Deals List/My Work screenshots and `collapsible-menu.png`: user-approved simplicity, flush-table direction and secondary-menu reference |
| S14 | Audited EN-07 desktop mockup r02 from this conversation: latest image with Sources current, follow-through progress and Open commercial review; written tokens and rules govern exact implementation |
| S15 | [Current package scripts][s15], [README][s15b] and [STATUS][s15c], checked at `1a69e93c...`: installed stack, local launcher and documented runtime limits |
| S16 | Current saved EN-07 Build Plan r01, read before this update: all domain sections retained with explicit r02 corrections and additional acceptance cases |

[s01]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html
[s02]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/blueprints/BP-01-master-blueprint.md
[s04]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/decisions/project-delivery-readiness-design.md
[s05]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/contracts/supply-chain-readiness.md
[s06]: https://github.com/deanrfiedler-gif/powerplants-one/blob/1a69e93c266f6b8d5a7d25d6423b7520690ab71c/AGENTS.md
[s07]: https://github.com/deanrfiedler-gif/powerplants-one/blob/1a69e93c266f6b8d5a7d25d6423b7520690ab71c/src/activities/components/client/my-work-shell.tsx
[s08]: https://github.com/deanrfiedler-gif/powerplants-one/blob/1a69e93c266f6b8d5a7d25d6423b7520690ab71c/src/app/styles/my-work.css
[s09]: https://github.com/deanrfiedler-gif/powerplants-one/blob/1a69e93c266f6b8d5a7d25d6423b7520690ab71c/src/engineering/service.ts
[s09b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/engineering/model.ts
[s10]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/components/header-content.tsx
[s10b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/app/module-workspaces.css
[s10c]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/app/desktop-shell.css
[s11]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html
[s12]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/reference/ui/README.md
[s15]: https://github.com/deanrfiedler-gif/powerplants-one/blob/1a69e93c266f6b8d5a7d25d6423b7520690ab71c/package.json
[s15b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/1a69e93c266f6b8d5a7d25d6423b7520690ab71c/README.md
[s15c]: https://github.com/deanrfiedler-gif/powerplants-one/blob/1a69e93c266f6b8d5a7d25d6423b7520690ab71c/docs/STATUS.md
