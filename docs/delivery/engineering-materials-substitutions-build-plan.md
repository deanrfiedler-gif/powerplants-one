---
title: EN-06 — Released Materials & Substitutions — Local App Build Plan
revision: r02
date: 2026-09-20
owner: Dean Fiedler
scope_id: EN-06
principal_requirement: ENG-05
status: Local application build plan prepared; implementation and runtime verification pending
source_repository: deanrfiedler-gif/powerplants-one
source_branch: main
source_commit: 99c32aed5032393b7658713cca53aa4c1a2ab2dd
ui_reference: PPO-EN-06-Released-Materials-and-Substitutions-Desktop-UI-Mockup-r04.png
supersedes: Standalone HTML delivery approach in Build Plan r01
---

# EN-06 — Released Materials & Substitutions

**Powerplants One · Local application build plan · r02**

## 1. Purpose, revision and delivery decision

Build **EN-06 — Released Materials & Substitutions** inside the existing local Powerplants One application. The principal requirement remains **ENG-05**. An engineer must be able to identify the exact material basis, review a substitution, issue a bounded technical release and inspect the separate Supply Chain receiving outcome.

**r02 supersedes the standalone-HTML delivery approach in r01.** This revision specifies a working Next.js/TypeScript/PostgreSQL module in the existing repository and local server. A standalone HTML screen, an iframe, a screenshot background or browser-only business records does not satisfy this increment. The underlying technical, quantity, permission, source and recovery requirements remain in scope.

| Document control | Position |
|---|---|
| Owner | Dean Fiedler |
| Plan revision | r02 · 20 September 2026 |
| Delivery target | Existing local PPO application; synthetic data and existing local PostgreSQL |
| Repository checkpoint inspected | `99c32aed5032393b7658713cca53aa4c1a2ab2dd`, main, refreshed for this revision |
| Visual reference | `PPO-EN-06-Released-Materials-and-Substitutions-Desktop-UI-Mockup-r04.png` |
| Reference identity | Latest corrected image from this conversation: expanded module menu and only “Date needed” in the missing material required-by field |
| Menu reference | Actual My Work implementation at `/work`, supported by `collapsible-menu.png` |
| Theme | r22; retain the relevant source profiles and approved module-specific composition |
| Companion instruction | `PPO-EN-06-Released-Materials-and-Substitutions-VS-Code-Build-Prompt-r01.md` |
| Status | Plan and build prompt prepared. EN-06 application implementation, migration execution and runtime acceptance are not claimed |

Technical review, technical release, commercial approval, demand approval, purchasing, receipt, installation and commissioning remain separate facts. A technical release is never permission to spend or place an order. [S02][s02] [S06][s06]

The local implementation includes six functional destinations, durable records, independent synthetic review roles, exact release snapshots, owned receiving outcomes, source-change handling and original-operation recovery. Live MYOB, SharePoint or supplier integrations, deployment and operational transactions remain outside this task.

### 1.1 Changes from r01 and the earlier mockups

| Earlier position | r02 decision |
|---|---|
| Standalone HTML with client-side demonstration persistence | Integrate into the current app; persist business records on the server |
| Work queue with persistent detail | Register/worklist with a closable right inspector |
| Six horizontal content tabs | Six route-backed destinations in a collapsible module menu |
| Approximate new menu design | Style and behaviour derived from the actual My Work menu |
| Large title, EN-06 eyebrow and subtitle | Compact global breadcrumb; no repeated title block |
| Inset table or surrounding card | Table header, rows and dividers flush to both register-container edges |
| Blue inspected row; checked row implied inspection | r22 pale-green row emphasis; inspector and checkbox selection are independent |
| “Technical state” and “Review owner” | “Line readiness” and “Next action owner” |
| General “holds before release” warning | Scoped material-attention message; partial release evaluated against exact dependencies |
| Unspecified source freshness | Exact revision, permitted purpose, observation time and current-use state |

The screenshot is a composition reference. Text and domain rules in this plan resolve any generated-image ambiguity. The sidebar is shown expanded in r04 to demonstrate its appearance; the register's first-use desktop preference is collapsed.

## 2. Verified implementation starting point

The current main checkpoint remains the same as r01. The user's Windows working tree may contain newer local work; inspect and preserve it before editing. Do not reset or downgrade it to this checkpoint.

| Inspected source | Verified use in this build |
|---|---|
| `AGENTS.md`, `README.md`, `docs/STATUS.md` | Repository instructions, current snapshot, existing local runtime and synthetic boundaries |
| `src/activities/components/client/my-work-shell.tsx` | Secondary-menu composition, `HeaderContent` menu portal, per-person preference, dock/overlay handling, edge toggle, Escape and focus return |
| `src/app/styles/my-work.css` | Exact My Work menu tokens and geometry: 220 px desktop width, 42 px minimum links, 20 px menu icons, 3 px navy active marker, 6 px controls |
| `src/app/desktop-shell.css` | Existing header menu slot, fixed-width 136 px Show/Hide menu button, compact variants and focus treatment |
| `src/components/header-content.tsx` | Existing slots are `menu`, `search` and `account`; there is no currently inspected `breadcrumb` slot |
| `src/app/module-workspaces.css` | Existing `data-module-layout="full-bleed"` removes module margin, padding, border and radius |
| `src/app/(business)/work/(workspace)/layout.tsx` | Persistent secondary-menu layout shared by six route destinations |
| `src/shell/navigation.ts` | Existing Engineering destination and My Work route/menu registration conventions |
| `src/app/(business)/engineering/page.tsx` | Existing Engineering workspace; preserve it and add a discoverable Materials entry |
| `src/engineering/model.ts`, `service.ts` | Current Project/Opportunity context, server permission checks, scoped queries, expected versions and shared-operation pattern |
| `src/app/api/v1/engineering/[id]/coordination/route.ts` | Existing `commandRoute` adapter to server domain service |
| `package.json` | Existing dev/build/typecheck/lint/database/browser scripts; use installed pinned dependencies rather than introducing a new stack |
| `db/migrations/0028-my-work-scheduling-and-views.sql` | Latest migration filename observed in the inspected tree; allocate the next number from the actual working tree, never assume 0029 is still free |
| Theme r22 and provided screenshots | Actual bytes/text inspected; register selection/hover, menu, table, typography and snapshot guidance inform this plan |

Observed package engines were Node 24.21.0 and npm 11.19.0. Re-read the actual working tree's runtime instructions and lockfile before running it; this document is not an instruction to change versions or upgrade dependencies.

EN-02, EN-03/EN-05, Products, ES-07 and Supply Chain remain source owners. Existing EN-03/EN-05 design-coordination evidence does **not** authorise procurement. Keep that negative example intact and create a separately identified synthetic procurement-capable fixture. The dedicated PD-04 compatibility service and any absent upstream runtime must not be presented as implemented integration. Use a typed, visibly synthetic adapter where a source runtime is unavailable.

The r01 source inspection found EN-03/EN-05 as an off-repository saved design. Reconcile its exact location before claiming live connectivity. Source/module names follow the coverage register: EN-07 is change-impact review; EN-08 is commissioning/as-built release. Preserve original issued source bytes. [S01][s01] [S03][s03]

## 3. Scope, source precedence and conformance

| Declaration | Required treatment |
|---|---|
| Scope identity | EN-06; parent ENG-05; retain related parent IDs and source mappings |
| Primary page type | Register/worklist with optional modeless inspector |
| Supporting page types | Review/comparison, record detail, guided form, document/evidence workspace |
| Application frame | Reuse the existing shell, identity, global search, quick add, help and account controls |
| Secondary navigation | My Work menu style and behaviour; module-specific labels/routes; independent preference key |
| Workspace | Full-bleed register surface, compact padded controls, square docked panels |
| Incoming | Exact package/context, design basis, drawing issue/purpose, scope, mappings and evidence |
| Outgoing | Immutable technical-release manifest and separate owned Supply Chain handover/outcome |
| Exceptions | Missing, unavailable, restricted, stale, returned, rejected, withdrawn, superseded, conflicting and unknown outcomes |
| Actual delivery | Local synthetic app increment; no assertion of business approval or production readiness |

Apply this order when references disagree:

1. Current explicit user instructions: flush tables, compact breadcrumb, collapsible menu styled the same as My Work, local app implementation.
2. This r02 plan's data, authority, interaction and audit corrections.
3. Actual My Work menu and shared-shell components for their respective appearance and behaviour.
4. Corrected desktop mockup r04 for module composition and information placement.
5. Relevant r22 component profiles for remaining controls, typography and table treatments.

Do not copy the mockup's approximate pixel dimensions over the existing My Work menu's measured source geometry. Do not redesign My Work or change its default expanded state as a side effect. Record scoped adaptations in the EN-06 decision/handover document; no further design permission is needed for the refinements already requested here.

## 4. Local application delivery boundary

### Included

- Real application routes and a discoverable entry from Engineering.
- Six meaningful route-backed views sharing one module layout and current package context.
- Scoped React/TypeScript components, existing theme assets and local server API/service integration.
- Durable material sets, lines, exact source snapshots, item/unit bindings, substitution decisions, release manifests, receiving outcomes and history in the existing PostgreSQL database.
- Additive migrations and non-destructive, rerunnable synthetic fixtures where the current schema lacks these records.
- Server-enforced scope, permission, independence, version and original-operation checks.
- Material creation/editing, search/filter/sort/column controls, selected-scope review, controlled synthetic issue, handover return/correction and history.
- Accessible responsive behaviour, local restart proof, focused domain/database/browser checks and visual comparison with the supplied reference.
- Updated decision, delivery, testing and status documentation describing what actually works.

### Outside this local increment

- Azure deployment, external publication, production data migration and live business-system integration.
- Real CAD/BOM extraction, SharePoint writes, ERP item creation, live supplier availability/prices, purchasing, stock changes or financial posting.
- Customer/supplier messages, controlled external distribution, booking changes or installed-controller configuration.
- Full EN-07/EN-08/PD-04 implementation or an unrelated redesign of the shared shell, Sales or My Work.
- Generic supplier spreadsheet/BOM import and arbitrary database/session restore through the UI.

Use existing local configuration without printing secrets. Do not reset the user's database or replace working records. Where a dependency is unavailable, show a bounded synthetic adapter or explicit unavailable state; do not fabricate a successful upstream integration. Presentation preferences may use browser storage; business decisions must not depend on it.

## 5. Actors and ownership

The following are fictional responsibility profiles for demonstrating the workflow. They do not allocate employees, define corporate authority or add existing application capabilities.

| Profile | Can demonstrate | Restrictions |
|---|---|---|
| Engineering author | Prepare material lines, link sources, propose substitutions, answer review findings and create successors | Cannot approve own submitted content |
| Technical reviewer | Inspect exact sources, record compatibility decisions, return/hold/reject or accept technical content within the fixture's discipline/purpose | Must be independent of the relevant author/proposer; cannot approve commercial changes |
| Material release authority | Authorise and issue the exact reviewed set under a configured fictional policy | Cannot manufacture upstream approval, repair item mappings silently or release outside the permitted scope |
| Supply Chain coordinator | Inspect the prepared release, accept or return the receiving package, record sourced receiving observations | Cannot alter technical approval or treat receiving acceptance as a purchase order |
| Project/commercial coordinator | Provide separately identified scope, cost/date and demand-authority evidence; own required decisions | Does not replace technical review |
| Read-only / limited viewer | Inspect permitted technical context and current/historical status | Restricted prices, source content and recipient details remain excluded from that projection |

The demonstration policy will explicitly list actor, company/site scope, discipline, permitted purpose and effective version. An unconfigured policy shows **Authority not configured** and prevents positive release. Existing `engineering.edit` permission does not imply a future technical approval or release grant. [S03][s03] [S04][s04]

## 6. Approved workspace, navigation and routes

### 6.1 Shared header and compact context

Use one existing application rail and one global header. Display `Engineering / Released Materials & Substitutions` as the module breadcrumb, removing the redundant Powerplants One text for this route where needed. Make the current destination identifiable when the menu is hidden, using the shell's route-aware breadcrumb treatment with accessible collapse on narrower widths. Do not add a second large title, EN-06 eyebrow or introductory paragraph. Keep an accessible page heading in the shell/semantic structure even when no repeated visual heading is rendered.

Mount Show menu / Hide menu through the existing `HeaderContent` **menu** slot. Extend the existing route-aware title/breadcrumb resolver if necessary; do not call an invented breadcrumb slot or manually mutate global DOM nodes. Keep search, quick add and utility positions stable. Scope any title adaptation to EN-06 and test adjacent routes.

Below the header, show a compact project/package picker, customer, site and material set `A · r03`, with Draft immediately beside that material-set value. Resolve these from the current server context. Retain the Engineering package identifier in the picker/details even when the visible headline is the Project. Put Add material requirement and Review release set on the right. Long context can reflow without squeezing the table or adding an oversized hero region.

### 6.2 Collapsible menu — mandatory My Work parity

**The EN-06 collapsible left menu must be styled the same as the menu on the My Work page.** Reuse the existing component where practical, or extract the shared visual/behaviour layer with explicit My Work regression coverage. Do not mount `MyWorkShell` wholesale with its activity APIs, weather state, pinned views or personal-work labels inside Engineering.

- Reuse the actual current `.mw-menu`, `.mw-menu-title`, menu links/icons/badges, active marker, `.mw-edge`, overlay and header-toggle treatment. The inspected desktop menu is **220 px**, not the earlier approximate 240 px recommendation.
- White surface, fine right border, source spacing, 18/24 bold menu heading, source 42 px minimum links, 20 px outline icons, pale neutral active link, 3 px navy marker and matching focus/hover states.
- Menu title: `Materials & substitutions`; small descriptor: `Engineering workspace`.
- Six links, in order: Materials register; Item & unit mapping; Substitution review; Review & release; Supply handover; Changes & history. Show a scoped accessible substitution count; unavailable is not zero.
- Replace horizontal module tabs completely. A menu link is route navigation (`aria-current="page"`), not a tab masquerading as a route.
- Default collapsed for a first-use desktop EN-06 register; remember subsequent user choice per workspace and actor using an EN-06-specific versioned key. Preserve My Work's own key and default. The r04 image deliberately shows expanded mode for review.
- Retain the source Show menu / Hide menu header button, `aria-expanded`, `aria-controls`, edge chevron and focus treatment. Hidden means no residual grid track, margin or white gutter.
- Retain the My Work wide/overlay interaction pattern: the inspected source docks at 1200 px and overlays below it; phone breakpoint is 780 px. Menu choice persists in docked mode; opening a temporary overlay does not overwrite that preference.
- With the inspector open, protect a usable register width. At widths that cannot accommodate all three surfaces, overlay the inspector or use a focused detail route rather than crushing columns. Do not silently reset the user's saved menu choice.
- Overlay Escape, backdrop and Close restore focus; route navigation moves focus to the destination appropriately. Do not leave hidden links in the keyboard order or stack two conflicting modal focus traps.

### 6.3 Proposed route contract

Inspect for existing EN-06 routes before adding these. Reuse an established equivalent and document any adjustment. `id` below means **Engineering package UUID**, never a project UUID inferred from the visible title.

| Destination | Proposed route | Required working content |
|---|---|---|
| Entry/context selection | `/engineering/materials` | Permission-scoped package picker/resume; navigate to selected package; no hard-coded fixture UUID |
| Materials register | `/engineering/[id]/materials` | Lines, quantities, exact drawing references, readiness, owners, filters, inspector and creation |
| Item & unit mapping | `/engineering/[id]/materials/mapping` | Product/company/item bindings, design/procurement units and conversion evidence |
| Substitution review | `/engineering/[id]/materials/substitutions` | Original/candidate comparison, evidence, proposal and independent decisions |
| Review & release | `/engineering/[id]/materials/releases` | Exact selected manifest, dependencies, purpose, blockers, authority, issue and recovery |
| Supply handover | `/engineering/[id]/materials/handover` | Exact release, demand basis, receiver, dates and returned/accepted outcomes |
| Changes & history | `/engineering/[id]/materials/history` | Revisions, decisions, issues, changes, withdrawal and receiving lineage |

Add a discoverable Materials entry to the existing Engineering workspace/package detail. Use Next.js shared layout conventions analogous to `work/(workspace)`, preserving `/engineering` and `/engineering/[id]` behaviour. Deep links and browser Back/Forward restore the package, set, destination and permitted query criteria. Use stable line IDs for an inspector query; `030` is a display number, not the database key.

### 6.4 Register surface and interaction

The table's header fill, all row backgrounds and horizontal rules must touch **both register-pane boundaries**. With menu expanded, the left boundary is its right divider; when collapsed, it is the application's rail/content boundary. With the inspector open, the right boundary is its left divider; when closed, the table expands to the workspace edge. There is **zero exterior horizontal table padding, margin, card border or corner radius**. Keep 12–16 px internal cell padding. Toolbars retain comfortable padding independently. Do not add a padded wrapper around the entire module.

Default columns: checkbox; Line; Material requirement; Design qty; Drawing / rev; Item mapping; Line readiness; Next action owner. Use a pale grey header, fine column separators in the header, white rows and light horizontal rules. Align numbers consistently and show units. Keep identities and quantities readable; allow accessible column sizing and contained horizontal scrolling with sticky checkbox/identity columns where appropriate. Follow the r22 register's 43 px header and normal 52 px row reference, growing rows for content rather than clipping two-line descriptions.

Use compact filters All materials, Ready for review and Needs attention, plus material search, discipline, Add condition, Filters, Columns and explicit sorting. Conditions combine predictably, with clear/removable applied filters. Counts and pagination come from the same permission-scoped query; disclose whether counts are package-wide or filtered. A single attention summary groups affected **lines**, not the number of separate findings. Five ready-for-review lines are not automatically eligible for issue.

Row activation opens the inspector; checkboxes independently select records for an explicit bulk/release-preparation action. Opening line 030 must leave its checkbox unchecked when no selection was made. For zero selection, show `0 selected`. For some visible rows selected, show the header checkbox as indeterminate and expose permitted contextual actions. Header selection applies to the explicitly stated current page; never silently selects hidden/unloaded records. Changes of identity/package clear inappropriate selection. Filtering an inspected record out must close the inspector or clearly disclose its out-of-results state; no invisible record action target.

Use pale green `#EDF6E9` for the highlighted inspected/selected record treatment and `#F8FAF7` hover, with distinct keyboard focus and checkbox state. Readiness awaiting review uses a neutral indicator; completed positive checks can use darker green. Use the label Line readiness for mixed blockers; show separate state families in details.

### 6.5 Inspector and audit corrections

The closable, square-edged right inspector shows line identity, physical location/system, proposed substitution status, readable specified/candidate product identity, relevant comparison rows, next action with owner/due date, material required-by date, exact source basis/purpose/currentness, technical acceptance and separate handover state. Open substitution review leads to the full comparison route with context intact. View exact sources opens retained evidence through existing document patterns without stacking independent docks.

Required-by and review due are separate date fields. An unknown required-by value is **Date needed**, with no invented date below it. A source may be current while the line still lacks firmware evidence; the source indicator must not imply technical acceptance. The screenshot's purpose/currentness labels are synthetic fixture data, not an unverified live claim. Keep returned, stale and restricted states equally explicit.

Use `3 material lines need attention` for the default fixture, with an actionable issues link. Evaluate any partial release on the selected scope and dependencies in Review & release. Keep the footer's technical release and purchase-authorisation distinction; avoid adding large KPI cards or repeated explanatory warnings.

## 7. Materials register and line specification

The register must support search by line reference, description, manufacturer/model, supplier part, product/item reference and drawing number. Filters cover package, selected area/system, discipline, review/release state, mapping condition, substitution status and owner. Counts identify their scope and incompleteness; an unavailable count is not zero.

| Field group | Required content and rule |
|---|---|
| Identity | Stable line UUID and separate readable line number; retain source line and predecessor links |
| Context | Company, Engineering package and immutable Project/Opportunity relationship; organisation/site; selected facilities/growing areas and affected assets |
| Material requirement | Plain description, category, required specification, quantity, unit, intended purpose and required-by date or explicit Date needed |
| Technical basis | Exact EN-02 snapshot and EN-03/EN-05 issue/member/review references; drawing number, engineering revision, source file version and evidence hash are separate |
| Applicability | System/discipline, installed location and served areas; scope exclusions; relevant equipment configuration and interface references |
| Product identity | PPO product UUID/version where known, manufacturer/model, supplier part identity; description alone is not a match |
| Quantity basis | Quantity method/source, unit, explicit conversion if needed, rounding/pack constraints and accountable confirmer |
| Mapping | Target provider/configuration/company/entity/item key, unit and mapping version; unknown and not required remain distinct |
| Dependencies | Other material lines, design interfaces, shared assemblies/kits and any all-or-nothing functional group |
| Responsibility | Author, reviewer, next-action owner and due date; source evidence classifications and outstanding findings |

Distinguish **physical location** from **area served**. A pump in Irrigation Shed 01 serving three growing areas is one asset/material requirement unless the actual source specifies multiple units. Do not multiply its quantity by the count of served areas.

For assemblies or kits, show parent/child relationships and whether a row is informational or independently procured. Totals cannot count both a purchased kit and its included children as separate demand. User-entered allowances must name their basis; the build must not invent waste percentages, spare percentages or equipment sizing.

Removal from a draft keeps an audit event. A submitted or issued line is immutable; correction creates a successor or an explicit cancellation/replacement relationship.

## 8. Product, ERP item and unit mapping

EN-06 binds a technical requirement to an exact candidate mapping. It does not create or publish catalogue or ERP records. A missing mapping generates an owned resolution request pointing to ES-07/AD-05 or the responsible workflow.

| Mapping condition | Behaviour |
|---|---|
| Verified for target | Show provider/configuration/company/entity/item identity, source observation and target unit; eligible only for that exact context |
| Proposed | Candidate visible for review; not a verified binding |
| Ambiguous | Show permissible candidates and discriminating evidence; no first-match selection |
| Missing | Keep requirement intact; identify the owner and evidence needed |
| Unavailable / restricted | Retain permitted last-known status with a clear limitation; no positive current mapping claim |
| Changed / inactive | Preserve previous binding, show the new evidence and require reassessment |
| Not required for stated purpose | Allowed only for a named non-procurement output, with rationale; cannot satisfy procurement readiness |

A technical requirement may be reviewed without an ERP item. For the local **procurement-ready handover** demonstration, all included lines require current verified target bindings and unit evidence. A technical information-only snapshot remains clearly labelled and cannot be accepted as procurement-ready.

Quantities use decimal strings with a documented exact arithmetic representation. The prototype may use six fractional places and rational conversion factors as an explicit fixture convention; do not adopt that as a universal ERP capability. Preserve the target's declared precision and refuse values that it cannot represent without an approved conversion/rounding basis.

Required rules:

- Compare only compatible dimensions. EA, metres, litres, mass and supplier packs are not interchangeable.
- Preserve design quantity, procurement quantity, conversion factor/version, minimum order or whole-pack constraint, and any authorised overage separately.
- Example: 12 EA with evidenced 4 EA per pack maps to 3 packs. Five EA does not silently become two packs; the overage requires a stated decision and receiving treatment.
- A missing unit or conversion is unresolved, not 1:1. A missing amount is unknown, not zero.
- One target company's item mapping cannot be reused for another company merely because the item code matches.
- Cost and lead-time observations retain source time, currency, tax basis and completeness. A technical choice cannot refresh an accepted estimate or customer quotation automatically.

## 9. Substitution comparison and technical decision

A substitution is a proposal against an exact original requirement and candidate version. It records who proposed it, why, affected quantities/areas, evidence, decision scope and any conditions. Approval of one package's candidate does not create universal catalogue compatibility.

The comparison should display **Meets**, **Does not meet**, **Evidence needed** and **Not applicable with reason** for each criterion. Do not calculate a percentage score that can conceal a failed mandatory criterion.

| Comparison dimension | Evidence to display |
|---|---|
| Intended function and performance | The stated requirement, candidate capability, units, applicable conditions and exact evidence |
| Physical fit and connections | Dimensions/envelope, mounting, interfaces, connectors, materials and source references |
| Electrical/control interface | Supply/interface requirements, supported communication, firmware/software compatibility and affected control configuration |
| Horticultural environment | Relevant humidity, corrosion, water/fertiliser compatibility, cleaning/biosecurity or crop-sensitive constraints, where supported by the stated scope |
| Reliability and support | Manufacturer support evidence, maintenance/spare requirements and explicit unknowns |
| Documentation and commissioning | Required manuals, certificates, drawings, parameter references, test criteria and retest obligations |
| Commercial and delivery effects | Sourced price/currency/unit and lead-time differences, availability completeness, affected dates and owned decisions |
| Installed/purchased status | Whether affected items have already been requested, ordered, received, installed or tested; evidence and source time |

The author identifies which criteria are mandatory under the reviewed requirement. The independent reviewer confirms that classification and the evidence. An unresolved mandatory criterion, failed criterion, inaccessible necessary source or unsupported purpose blocks positive acceptance. A disputed mandatory requirement must return upstream for a revised basis; it cannot be waived using a notes field.

Technical acceptance binds the original line revision, candidate product/mapping versions, comparison content, scope, review purpose, reviewer and policy version. A later mapping, quantity, interface, scope or source change makes that acceptance ineligible for a new release until reviewed again. Its historical record remains.

Return requests correction; Hold records a named unresolved dependency; Reject records an unsuitable candidate; Accept technical comparison records suitability only. Conditions that must be met before release are explicit blocking obligations. Residual nonblocking obligations may accompany release only when the fictional policy permits them, the reviewer identifies the limited purpose and the receiving owner is named.

## 10. Change impact and adjacent approval boundaries

EN-06 prepares a substitution-specific impact preview. EN-07 remains responsible for the broader technical change process.

| Impact | EN-06 action | Owning decision remains with |
|---|---|---|
| Drawing/design basis changes | Link affected revisions; block new use of stale supporting evidence; prepare correction request | EN-02 and EN-03/EN-05 |
| Purchased, received or installed material | Identify exact source observations and affected quantities/assets; create owned review | Supply Chain, Projects and EN-07 |
| Customer scope, price or contract effect | Record unknown or sourced effect and required decision; keep procurement-ready handover held where authority is required | Sales/Estimating/Project commercial controls |
| Project dates or site windows | Present candidate impact and source time; prepare owned request | Projects and site readiness owners |
| Confirmed appointment or job pack | Show references and affected scope; do not move appointments or amend issued packs | Service planning and pack owner |
| Commissioning or configuration | Retain required tests, configuration evidence and retest requests | EN-08 and Quality/Field workflows |
| Bulletin or catalogue-wide replacement | Record a local candidate and source link | Equipment support and PD-04 |

Use independent technical and commercial status fields. Where the commercial applicability question itself is unanswered, show **Decision needed**. A technical reviewer must not mark it Not applicable on behalf of the commercial owner.

## 11. Review, material release and partial release

The review packet freezes the exact included line revisions, quantities, intended purpose, mappings, source manifest, substitution decisions, scope/exclusions, unresolved obligations and policy. Reviewers see a readable summary and can inspect every source behind it.

The local successful issue purpose is **Technical release for procurement**. It confirms an Engineering material basis for the stated procurement scope; it does not approve expenditure, place an order or authorise installation. Information-only comparison remains available but uses a visibly different output purpose and cannot satisfy the procurement-ready receiver.

Before positive release, verify:

1. Permitted package/company/site context and configured actor authority.
2. Source issue and basis support the requested procurement purpose and exact scope.
3. All mandatory technical evidence and line dependencies are complete and current within the declared observation basis.
4. Any substitution is independently accepted against the exact line/candidate content.
5. Quantity, unit, mapping and target precision requirements are satisfied.
6. Required commercial/scope decisions are separately evidenced; unresolved applicability remains held.
7. The submitted content and policy still match the reviewed snapshot.
8. No known or uncertain original issue effect already exists for this request.

**Partial release** is allowed only for an explicitly selected independent scope. The review must list included and excluded line quantities/areas, each held reason and owner. A functionally dependent kit, electrical/control pair or shared system cannot be split merely to make a package look ready.

If 4 of 6 identical units are released, identify the 4-unit scope or allocation basis and the remaining 2-unit requirement. Different releases cannot authorise the same line/scope quantity twice. A successor identifies which earlier entitlement it replaces; historical release quantities remain visible but are not added to the active total. This is technical-release accounting, not an inventory ledger.

The immutable release contains issue ID, technical revision, purpose, selected content hash, exact source identities, actor/time, authority-policy version, exclusions and intended receiving audience. Creation of that local release is separate from distribution. DK-03 owns any later controlled sending/delivery evidence.

## 12. Supply Chain handover and receiving contract

Prepare one receiving package for one declared company and receiving context. It includes the exact technical release and proposed demand lines; it is not an ERP requisition or purchase order.

| Handover field | Required content |
|---|---|
| Source | Material-release ID/revision/hash, original operation ID, issue purpose/time and complete source manifest |
| Context | Company, Project or permitted future WorkOrder target, site/areas, Engineering package and accountable coordinator |
| Lines | Source line/revision, product/item mapping/version, exact quantity and unit, conversion basis, substitution decision and exclusions |
| Timing | Required-by local date and site timezone or explicit missing-date state; no inferred customer deadline |
| Authority | Technical release evidence and separate Forecast/Approved demand basis; Approved requires named authority/evidence |
| Receiving | Destination owner, receiving schema version, requested action, original receiving operation and outcome evidence |
| Current usability | Known source changes/holds, observation completeness, current eligibility and retained historical issue |

The existing Engineering runtime links packages to Project or Opportunity. In this increment, only the fictional **Project** case demonstrates procurement-ready receiving. An Opportunity remains presales context; winning a deal or viewing a Project label must not be fabricated to satisfy the gate. Service-specific engineering linkage is future runtime scope unless separately designed.

Supply Chain can **accept** the complete exact payload or **return** it with line-level reasons, owner and due date. The first build uses whole-payload acceptance for each selected partial-release scope; it does not add a second implicit partial-acceptance ledger. A returned payload is retained unchanged. Correction produces a new handover revision and a readable difference; changed technical content also requires a successor technical release.

Receiving acceptance records the exact accepted payload and outcome. It does not prove stock availability, reservation, supplier confirmation, purchase, receipt, usable inspection, delivery or installation. Readiness remains assessed separately under the Supply Chain contract. [S06][s06]

If a source is withdrawn after receiving acceptance, retain that acceptance as history and create an owned impact item. Do not pretend the demand, order or physical material has been recalled automatically.

## 13. Proposed information model

These logical entities define the local server data contract. Map them to the existing schema and additive tables/structured snapshots as appropriate; they do not require one table per entity. No new database object is claimed until implementation and migration verification are complete.

| Entity | Key information and relationships |
|---|---|
| `EngineeringMaterialSet` | UUID, existing Engineering context, current draft version, title, owner, purpose and scope |
| `MaterialLineRevision` | Stable line UUID, content revision/version, exact requirement/source references, quantity/unit, dependencies and applicability |
| `MaterialItemBinding` | Product identity/version; supplier identity; provider/configuration/company/entity/key; target unit and mapping evidence/version |
| `UnitConversionEvidence` | Source/target units, exact factor, applicable product/package, precision/whole-pack conditions, source and review |
| `SubstitutionProposal` | Original line revision, candidate version, reason, selected scope/quantity, evidence matrix and impact references |
| `TechnicalReviewDecision` | Exact submitted snapshot/hash, actor, independence, policy, purpose, result, rationale and obligations |
| `MaterialRelease` | Immutable issue identity/revision, purpose, manifest, included/excluded scope, authority and original operation |
| `MaterialHandover` | Exact release, receiver/context, proposed demand, payload hash/revision and correction lineage |
| `ReceivingOutcome` | Original receiving operation, exact payload, Accepted/Returned/Unknown result and retained evidence |
| `MaterialImpactReview` | Changed source, affected current scopes and prior outcomes, owner, required action and resolution evidence |
| `OperationReceipt` | Operation identity, command/content hash, accepted result and outcome-recovery evidence |

Use stable UUIDs and snake_case JSON fields, PascalCase type names and state values, and user-facing labels with spaces. Existing readable references retain their original values. Fixture-only line labels such as “Line 010” and “Material set A” are not new governed reference type codes. Existing customer/project/site references use the retained `SYN-PPO-*` convention. Do not invent a new production allocator. [S12][s12]

Separate record version, material content revision, drawing engineering revision, SharePoint/native file version, source observation time, approval, issue, receiving outcome and software/schema version.

## 14. States and command rules

Use separate state families instead of one badge that implies the whole business process is complete.

| State family | Proposed values | Interpretation |
|---|---|---|
| Material draft/review | Draft, Submitted, Returned, Held, TechnicallyReviewed | Content preparation and exact technical review |
| Substitution | Draft, Submitted, Returned, Held, Rejected, Accepted | A decision about the exact candidate and scope |
| Release operation | Prepared, Authorised, Issuing, Issued, FailedNoEffect, OutcomeUnknown | Distinguish intent, authority, effect and uncertainty |
| Current eligibility | NotAssessed, EvidenceNeeded, EligibleForPurpose, ReassessmentNeeded, Withdrawn, Superseded | Current usability of retained content; separate from historical issue |
| Handover | Prepared, AwaitingReceiver, Accepted, Returned, OutcomeUnknown | Receiving state of an exact payload |
| Persistence | Unsaved, Saving, Saved, SaveFailed, Conflict, RecoveryRequired | Actual server outcome; browser session state is not business persistence |

| Command | Preconditions | Required result |
|---|---|---|
| Save line / binding | Editable draft, valid context and expected version | New draft version; preserve input on failure/conflict |
| Submit substitution | Identified original/candidate, scope and evidence matrix | Frozen comparison; missing evidence can be reviewed but prevents positive acceptance |
| Decide substitution | Independent permitted reviewer and exact submitted content | Retained rationale, evidence and result; no silent replacement of original line |
| Select accepted candidate | Exact eligible acceptance, editable successor line and current mapping | Explicit adopted candidate revision; retain original requirement and full lineage |
| Submit release set | Valid scope/quantity and complete inspectable manifest | Frozen set and explicit blockers; no issue effect |
| Authorise release | Exact positive review, eligible sources, satisfied required decisions and configured release authority | Authorisation bound to payload and policy |
| Issue material release | Recheck current context, source versions and exact authorisation; no prior/uncertain effect | One immutable release and original-operation receipt |
| Recover original issue | Same operation, permitted scope and retained receipt evidence | Return original result; assess present eligibility separately |
| Prepare/receive handover | Eligible exact release plus independently required demand/mapping/date evidence | Separate receiving operation and per-payload outcome |
| Return / revise | Explicit reason, owner and due date; retain submitted content | Successor with differences and fresh review where content changed |
| Withdraw current use | Permitted scoped action and reason | Current-use hold, affected-recipient worklist and preserved earlier evidence |

Reviewer and release roles may overlap only where the fictional policy explicitly permits it; the author cannot approve their own relevant submission. Role labels do not supply authority. An absent policy never falls back to permissive behaviour.

## 15. Server persistence, source change and original-operation recovery

Business state lives in the existing PostgreSQL database and is accessed through scoped server services. Browser storage is permitted only for presentation preferences such as menu state and column widths. It must never be the authority for accepted substitutions, releases, reviewer permissions or receiving outcomes.

Use existing database/transaction, identity, permission, validation, error and `sharedOperation` patterns after inspecting their full current contracts. Reads, history, exports, counts and receipt recovery must enforce workspace/company/site/package/source access. Recheck access before disclosing a cached or historical result. Identity changes must clear cached business views and stale pending actions.

Persist expected versions and use atomic transactions for content changes, review/issue/outcome records, domain history and original-operation receipts. Any required internal outbox work follows existing repository conventions. Do not run external business effects. Replaying the same operation and payload returns the original result; reusing an operation with changed content conflicts. Reject stale expected versions while preserving the user's unsaved input.

| Situation | Required local-app treatment |
|---|---|
| Save/reload/server restart | Persisted records and history survive; success text appears only after server confirmation |
| New required drawing/source version | Retain historical source; mark affected current eligibility Reassessment needed and expose the dependency path |
| Quantity/scope/candidate/mapping/policy change | Create required successor/review version; earlier acceptance cannot authorise changed content |
| Unavailable or restricted required evidence | Show permitted last-known time/completeness and block positive current decisions |
| Confirmed failure before effect | Preserve command/input and provide a valid retry path |
| Lost response after committed issue/receiving | Show Outcome unknown; recover by the original operation before allowing a new equivalent effect |
| Recovery after source change | Recover the historical receipt once, then separately show current use as stale/held |
| Concurrent edit | Return explicit conflict; preserve input and offer comparison/reload rather than silent overwrite |
| Invalid stored presentation preference | Fall back safely; do not corrupt business records or other modules' settings |
| Untrusted fixture/import data | Validate on the server; client-supplied approvals, hashes or role labels cannot grant authority |
| Withdrawal after downstream acceptance | Preserve past acceptance and create scoped follow-up; do not claim a real stock recall, cancellation or reversal |

Preserve exact decimal quantities using the repository's supported decimal-string/SQL representation and validated conversion rules. Avoid floating-point arithmetic for release allocation. Hashes identify retained content; they do not establish trusted engineering approval on their own.

Migrations are additive and rerunnable through the existing registry. Inspect the live development schema and current migration list before allocating a migration. Use synthetic fixture inserts with stable IDs and supported upsert/seed behaviour; do not reset or replace the developer's current database. Database tests run only against the approved synthetic test database.

## 16. Synthetic fixtures and demonstration journeys

Use fictional products and technical limits. Do not attribute invented performance, compatibility, availability or approval to Priva, Philips/Signify, Aranet or another supplier.

### Fixture A — Controlled procurement example

Create a separately labelled authored Project fixture with a reviewed procurement-capable design basis, exact fictional drawing issue, retained source bytes, configured fictional review policy and separately evidenced demand authority. It may reuse the canonical site hierarchy only after preserving its existing UUIDs and relationships. New technical evidence is explicitly authored for this demonstration.

The fixture must not alter the saved EN-03/EN-05 coordination-only source. Retain that file unchanged. A positive upstream procurement fixture is new demonstration evidence, with its own source manifest and provenance; it is not a claim that the earlier design was approved for procurement.

Suggested material set: pump assembly, control interface, isolation components and tubing. One alternate control interface lacks firmware evidence; another is supported by a complete fictional comparison. Quantity/unit examples include EA, metres and a supplier pack with an evidenced conversion. Technical values exist solely to exercise the stated validation rules.

### Fixture B — Presales / coordination-only hold

Use the retained EN-03/EN-05 design-coordination limitation as the negative example. Users may inspect and prepare requirements, but procurement release remains blocked by the exact source purpose. An Opportunity package also lacks awarded-project/demand authority. Explain each blocker separately.

### Fixture C — Partial release and changed source

Release an independent subset while another dependency group remains held. Record a receiving acceptance. Then introduce a changed drawing or withdrawn compatibility source, preserving the release and receiving evidence while creating a scoped impact review. A second attempt must not double-release the original scope.

| Journey | Required observable sequence |
|---|---|
| Normal release | Inspect procurement-capable basis → prepare lines → verify mapping/units → independent review → authorise → issue → prepare handover → separate simulated receiving acceptance |
| Substitution return | Propose alternate → identify missing mandatory evidence → return with owner/date → create corrected successor → review → explicitly adopt → release exact successor |
| Incompatible candidate | Failed required interface criterion → reject candidate → preserve original line and rejection evidence |
| Commercial hold | Candidate technically accepted → cost/scope decision outstanding → procurement-ready handover blocked → separate fictional owner decision → renewed exact eligibility check |
| Partial release | Show dependent/independent lines → refuse unsafe split → issue exact eligible subset → retain held remainder and owners |
| Receiver correction | Return for item/unit/date mismatch → retain payload → correct successor → show differences → accept exact new payload |
| Interrupted effect | Simulate lost response after release or receiving acceptance → Outcome unknown → lookup original operation → recover once |
| Post-acceptance source change | Retain original issue/receipt → mark current use held → identify affected scope/owners → prepare EN-07/Supply Chain follow-up |

The default opening view should show an understandable worklist with a few actionable holds. A compact page guide introduces fictional context and named scenarios; ordinary controls must still complete the journeys. Scenario setup must not grant authority through browser state. For visual review use the eight r04 materials (010–080), five ready-for-review rows, three attention rows and two explicitly identified substitution proposals. Keep line 030 inspected with zero checkboxes selected. Its review action is due 22 Sep 2026; material required-by remains unknown. Counts are computed, not hard-coded UI labels; test fixtures use a controlled scenario date. Seed names and references are synthetic, with stable real database IDs and valid existing context relationships.

## 17. Theme implementation, responsiveness and accessibility

Implement the approved composition using real DOM and the existing app's font/logo/icon assets. Do not recreate the screen as one image, embed a new app shell, import a parallel UI framework or apply broad global element overrides.

| Element | Implementation contract |
|---|---|
| Menu | Exact My Work menu profile and behaviour from section 6.2; changes scoped to EN-06 |
| Shell | Current rail/header and portal mounts; minimal route-aware breadcrumb adaptation only |
| Workspace | Existing full-bleed layout contract; one main content scroll owner and contained table horizontal overflow |
| Primary actions | Navy `#242A37` with white text; no green primary buttons |
| Brand accent | `#62BB46`, restrained; darker source-profile green for readable positive status text |
| Register | D23 white rows, pale grey header, `#EDF6E9` row highlight, `#F8FAF7` hover; fine source-profile dividers |
| Menu tokens | My Work neutral surface `#EDF0F5`, text/line/control/focus tokens from its source; do not silently average with the Deals profile |
| Typography | Existing Roboto assets with Verdana fallback; source 400/500/700 hierarchy; body/control about 14 px and supporting metadata about 12 px |
| Geometry | My Work's 220 px menu and source controls; 6 px control radius; square docks and table edges; comfortable internal padding |
| Inspector | One active supporting dock, no nested inspector stack; source-pattern sizing with an overlay/full-detail alternative when needed |
| Empty/failed states | Preserve context, distinguish no records from no matches, offer targeted recovery, never replace unavailable with zero |

At 1920×1080 and 1672×941, compare an expanded-menu, open-inspector state to the corrected r04 image; also capture the default collapsed-menu state. Verify 1440×960, 1280×800, 1024×768, 820×800, 390×844, 320 px width, short landscape and 200% zoom for containment and accessible use. These viewport checks are acceptance targets, not claims already verified. Preserve the My Work menu's source breakpoints; adapt inspector docking using available width. Keep table data readable with internal scrolling rather than shrinking text.

Navigation must work through actual links, browser history and keyboard. Provide clear focus, associated field errors, Escape and focus return, accessible checkbox names, sort state and keyboard/numeric column sizing. Menu counts and filtered results announce changes politely. Header and table stickiness must not obscure controls, validation messages or the last row. Screen-reader structure must retain a page heading even when the visible title exists only in the breadcrumb.

Separate view activation, checkbox selection, keyboard focus, lifecycle and urgency. Preserve drafts/filters/scroll position on safe navigation and explicitly handle unsaved edits. Never expose a disabled positive decision without a nearby reason. Reuse appropriate context menus/forms and full-page comparisons; avoid forcing every field into the default register.

## 18. Outputs and exports

| Output | Content | Authority |
|---|---|---|
| Material review summary | Selected requirement lines, evidence, mappings, comparisons, blockers and next owners | Review aid; no issue implied |
| Technical material-release manifest | Exact immutable issued content, source/file hashes, purpose, scope, exclusions and authorisation | Local synthetic technical issue only |
| Supply receiving preview | Exact release plus proposed demand/receiving information and outcome history | Local receiving simulation; no ERP effect |
| Substitution comparison | Original/candidate criterion matrix, source versions and exact reviewer decision | Scoped technical evidence; no global product compatibility approval |
| Change/impact summary | Predecessor/successor differences, affected releases/receivers and accountable follow-up | Owned review information; no automatic downstream alteration |
| Diagnostic export | Permitted synthetic record/version/receipt projection | Readable troubleshooting only; no generic state restore or client-supplied approval import |

CSV export must neutralise formula-leading text and quote fields correctly. Exports and printed output must respect the selected role projection, preserve units/currency/source time and avoid unlabelled totals across unlike units. Do not embed arbitrary imported HTML or execute attachment/script content.

## 19. Application architecture and proposed changes

Extend the current Next.js/React/TypeScript and PostgreSQL architecture. Inspect existing implementations first, then keep the change reviewable and domain-scoped. Do not introduce a separate service, database, runtime or UI framework for this module.

| Area | Existing reference / proposed change |
|---|---|
| Pages/layout | Existing `src/app/(business)/engineering/`; add the section 6.3 routes and shared EN-06 layout |
| UI | Proposed `src/engineering/materials/components/`; reuse/extract the My Work secondary-menu primitive without importing activity-only state |
| Module CSS | Proposed `src/app/styles/engineering-materials.css`, scoped under an EN-06 root; use existing full-bleed marker |
| Domain | Proposed `src/engineering/materials/model.ts`, `validation.ts`, `service.ts`; separate pure eligibility/allocation helpers as needed |
| API | Extend existing Engineering route conventions under `/api/v1/engineering/[id]/materials`; use current read/command adapters |
| Persistence | Add only missing material/set/line/source/mapping/comparison/review/release/handover/history/receipt storage; follow existing workspace keys and transaction conventions |
| Migrations/seeds | Next available additive migration and supported synthetic seed registration; inspect existing live schema first |
| Navigation | Existing Engineering workspace/package links and shell route resolution; avoid global navigation redesign |
| Verification | Focused unit, database, HTTP and Playwright coverage plus existing Engineering/My Work regressions |
| Working plan | `docs/delivery/engineering-materials-substitutions-build-plan.md` |
| Decision/handover | `docs/decisions/engineering-materials-substitutions-design.md` and `docs/delivery/engineering-materials-substitutions-handover.md` |
| Evidence | `docs/testing/evidence/engineering-materials-local-r01/README.md` with actual commands, captures and limits |
| Visual reference | Suggested `docs/reference/ui/engineering-materials/PPO-EN-06-Released-Materials-and-Substitutions-Desktop-UI-Mockup-r04.png` when the user supplies the image to the checkout |

Paths described as proposed are not claimed to exist. Reuse an equivalent existing module when found instead of duplicating it. A source manifest should record the actual working commit, reused component paths, r04 image hash, theme identity and any justified departure.

### 19.1 Services, validation and access

Design reads and commands around the existing Engineering package identity and permitted context. A list response should provide items, scoped counts, query/pagination state, observation/completeness and allowed actions. Details include exact line/set versions, source lineage, issues and review/release relationships. The server derives capabilities and validates IDs; hiding a button is not permission enforcement.

Reuse the existing engineering read/edit context rules where appropriate. Add explicitly registered capabilities/policy checks for independent substitution review, release authorisation/issue and receiving decisions as needed; do not treat `engineering.edit` as sufficient release authority. Follow the repository's capability vocabulary and seeds after inspecting them. Synthetic policy configuration must be versioned and auditable; an absent policy refuses positive authority.

Command coverage: create/update line; propose/verify binding within permitted scope; propose/submit/review substitution; explicitly adopt an accepted candidate into a successor; prepare/submit/authorise/issue an exact release; prepare/accept/return/revise handover; withdraw current use; recover an original outcome. Use expected versions and operation IDs using existing helpers. Author, reviewer and receiver are server-backed synthetic identities, not a client-side role dropdown that grants privileges.

No universal catalog compatibility, approved-demand promotion, purchase order, inventory receipt or installation authority may be inferred from these commands. A local Supply Chain adapter can exercise acceptance/return and persist its own receipts, while explicitly remaining a synthetic receiving contract.

### 19.2 Migration impact

Repository `AGENTS.md` records cross-suite exact migration-list assertions. If adding a migration, inspect and update affected expectations in `tests/database/field.test.ts`, `finance-upgrade.test.ts`, `offline.test.ts`, `packs.test.ts`, `planner.test.ts`, `reports.test.ts`, `leads-projects-integration.test.ts`, `tests/demo/upgrade.test.ts` and other actual registry consumers. Register seeds in order against an existing migration. Inspect `scripts/demo-upgrade.ts` before touching its latest-version review gate; never bump it just to silence a failure. Use the current tree to identify additions beyond this list.

## 20. Build sequence and completion gates

Proceed through these stages within the authorised local implementation. Stage boundaries are engineering checkpoints, not requests for repeated design approval. If a real prerequisite is missing, finish independent work and report the exact blocker without inventing success.

| Stage | Work | Required exit evidence |
|---|---|---|
| 1. Inspect and protect | Read instructions/status/current tree, worktree state, existing EN-06 work, local setup and My Work sources; create/use a suitable feature branch without discarding user changes | Actual commit, route/component map and concise implementation plan |
| 2. Establish real app composition | Shared EN-06 layout, My Work-style menu, header, context and flush register connected to a typed read path | Route loads in the existing server; expanded/collapsed and inspector states match r04 composition |
| 3. Persist requirements and mappings | Additive schema/fixtures, scoped reads/commands, line forms, source detail, units and mapping | Save, validation, scope rejection and restart proof |
| 4. Complete substitution workflow | Real candidate/evidence records, independent review, return/correction and explicit adoption | Valid/invalid criteria and stale-review scenarios proven |
| 5. Complete release and receiving | Exact manifest, partial scope/dependencies, authority, immutable issue, receiving outcomes and original-operation recovery | Normal, partial, returned and lost-response journeys proven |
| 6. Complete history and secondary controls | Source changes, successor comparison, withdrawal, filters/sort/columns, bounded exports | Every visible control has useful truthful behaviour; no empty route placeholders |
| 7. Verify and refine | Targeted domain/database/browser tests, compiled build, My Work/Engineering regressions, side-by-side visual inspection | Actual results, corrected defects and remaining limits recorded |
| 8. Local handover | Update stable plan/decision/handover/status and evidence; start/reuse local server | Exact working URL, synthetic test identities, walkthrough, commands and restart instructions |

Completion requires all six destinations to be functional in the declared local synthetic scope. A first visual shell alone is an intermediate result. Do not stop after a plan, screenshot, static JSX or mock-only API when the local implementation can be completed.

Preserve unrelated work. Do not deploy or publish externally as part of the local build request. Follow the repository's branch/review workflow for any later publication and report the local branch/change state precisely.

## 21. Planned verification and acceptance — local app

All checks below are **planned**, not executed. The `EN06-Axx` identifiers are task-local acceptance labels, not new blueprint requirements or parent test IDs.

| ID | Scenario / check | Required observable result |
|---|---|---|
| EN06-A01 | Scope and source declaration | EN-06, ENG-05, source commit, page types and synthetic status visible and consistent |
| EN06-A02 | Coordination-only input | Retained EN-03/EN-05 source cannot support procurement release; exact reason displayed |
| EN06-A03 | Positive authored input | Separate fictional procurement basis and issue are traceable; original source bytes unchanged |
| EN06-A04 | Company/site/context mismatch | Foreign context or unsupported Opportunity-to-procurement transition refused |
| EN06-A05 | Installed versus served areas | Shared pump counted once; relationships remain distinct |
| EN06-A06 | Ambiguous/missing item binding | No implicit first match, cross-company match or default mapping |
| EN06-A07 | Unit/pack conversion | Exact evidenced conversion succeeds; unknown, incompatible or unsupported precision blocks |
| EN06-A08 | Assembly and quantity conservation | Kit/children not double-counted; overlapping active release scope cannot exceed requirement |
| EN06-A09 | Mandatory compatibility failure | Positive substitution decision blocked by failed/unknown required criterion |
| EN06-A10 | Independent review | Author cannot approve own relevant content; missing policy grants no authority |
| EN06-A11 | Return and correction | Original comparison and reasons retained; corrected successor needs fresh decision |
| EN06-A12 | Accepted candidate adoption | Explicit line successor binds exact approved candidate; no automatic catalogue-wide change |
| EN06-A13 | Commercial decision outstanding | Technical acceptance remains visible while procurement-ready handover stays held |
| EN06-A14 | Stale source after review | Changed source, quantity, mapping or policy invalidates new issue eligibility |
| EN06-A15 | Exact release | Issue retains exact reviewed manifest, purpose, audience, content hash and actor/time |
| EN06-A16 | Partial release | Independent subset allowed; required dependency group cannot be split; exclusions and remaining owner explicit |
| EN06-A17 | Duplicate issue command | Same original operation returns one original result; changed payload conflicts |
| EN06-A18 | Failed-before-effect versus unknown | Distinct states/actions; unknown effect cannot create another equivalent release |
| EN06-A19 | Recover after source change | Original receipt recovered once; present usability shown separately as stale/held |
| EN06-A20 | Receiving acceptance | Exact payload outcome retained; acceptance creates no purchase, stock reservation or booking |
| EN06-A21 | Receiving return/revision | Original payload retained; successor comparison and new exact outcome required |
| EN06-A22 | Demand authority | Technical release does not convert Forecast into Approved demand without separate evidence |
| EN06-A23 | Withdrawal after receiving | Historical acceptance preserved; affected scope/owners identified; no fictional recall success |
| EN06-A24 | Restricted/partial source | Permitted projection and completeness shown; no positive release based on unavailable required evidence |
| EN06-A25 | Save failure/conflict | Input and original operation retained; successful-save language only after persistence succeeds |
| EN06-A26 | Corrupt preference / server recovery | Presentation fallback is safe; server records remain intact; no automatic database reset |
| EN06-A27 | Tampered command/evidence | Structural/hash/context mismatch refused by server; arbitrary approval flags cannot unlock release |
| EN06-A28 | Export and rendering | Role projection respected; CSV formula text neutralised; user text escaped; unlike units not totalled |
| EN06-A29 | Keyboard and focus | Menu links, forms, comparison, dialogs, errors and return paths usable without pointer |
| EN06-A30 | Responsive and long content | No accidental page overflow at declared widths/zoom; final field/actions reachable |
| EN06-A31 | Regression boundaries | Original issue bytes, estimates, bookings, pack acknowledgements and installed configuration unchanged |
| EN06-A32 | Local application reproduction | Clean install/build/migration/seed path and handover reproduce the local app; actual test results clearly recorded |


Additional task-local acceptance cases for the approved UI and local-server transition:

| ID | Scenario | Required evidence |
|---|---|---|
| EN06-A33 | Actual My Work menu parity | Same menu/toggle/edge/overlay style and interaction; expanded/collapsed captures beside `/work` |
| EN06-A34 | Default and saved preference | EN-06 initially collapsed, choice survives reload; My Work preference/default unchanged; actor/workspace isolation |
| EN06-A35 | Flush table geometry | Header/row bounds meet pane edges with menu and inspector independently open/closed; no gutter, rounded frame or duplicate shell |
| EN06-A36 | Route navigation | All six links/deep links work; browser Back restores context; no duplicate horizontal tabs; compact breadcrumb and current view identifiable |
| EN06-A37 | Inspection versus checkbox selection | Inspecting a row checks nothing; partial checkbox selection gives indeterminate header and explicit page-scoped bulk actions |
| EN06-A38 | Filter/count consistency | Server-derived scoped counts, owner/discipline/substitution filters and sorting agree with rows; absent data is not zero |
| EN06-A39 | Evidence/date clarity | Separate required-by/review due; only Date needed when unknown; source purpose/currentness does not imply acceptance |
| EN06-A40 | Runtime persistence | Save and reopen after browser reload and local server restart; history/review/issue/outcome remain intact |
| EN06-A41 | Server enforcement | Direct API attempts reject cross-scope, self-review, missing authority and stale-version writes even if client controls are bypassed |
| EN06-A42 | Transaction/replay recovery | Duplicate concurrent issue cannot over-allocate; lost response recovers the committed original ID without a second effect |
| EN06-A43 | Genuine screen states | Loading, empty, no-match, read-only, partial failure, unavailable source, stale evidence and unsaved/conflict states demonstrated |
| EN06-A44 | Layout stress | Long labels, all required viewports, 200% zoom, overlay focus and contained table scrolling remain usable |
| EN06-A45 | Existing-app regressions | My Work menu, header portals, `/engineering` and existing package detail/coordination still work |
| EN06-A46 | Migration/seed upgrade | Current development schema upgrades additively; seed rerun is safe; applicable registry consumers are updated |

All EN06-A01–A46 checks are planned until executed. Do not count an unbuilt view, skipped test or screenshot alone as a pass. Preserve parent AT-15/AT-37 acceptance boundaries.

Use existing scripts and pinned dependencies. Verified scripts include `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:db`, `npm run test:http`, `npm run test:browser`, `npm run build`, `npm run dev`, and `npm run serve:compiled`. Select focused test files first, then broaden for changed shared components and required repository gates. Inspect Playwright configuration and database safety checks before invoking them. Database suites must target `ppo_synthetic_test`; never repoint them at the user's development database to bypass the safeguard.

For relevant documentation/naming changes run `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`; run `check_prototype.py` when its package is affected, plus `git diff --check`. Confirm an apparent pre-existing failure against a safe baseline before attributing it to this change. Do not reset a checkout to obtain that baseline.

Inspect browser captures at matched viewport sizes, not merely CSS token assertions. Check the approved image, actual My Work menu and implementation together. Record the commit, fixture, viewport, menu/inspector state, commands and results. A static mockup cannot prove runtime accessibility, permissions or source authority.

## 22. Open decisions and bounded local assumptions

| Decision | Local build treatment | Remaining operational dependency |
|---|---|---|
| Technical competence and release authority | Versioned synthetic policy enforced on server; absent policy blocks | Real corporate competency and approval policy, D-002/D-019 |
| Upstream procurement purpose | Separate retained positive synthetic fixture; coordination-only negative remains blocked | Verified operational issue-purpose and retention contract |
| Product compatibility | Exact candidate comparison and scoped local decision | PD-04/supplier evidence governance |
| ERP item and units | Synthetic target keys/conversion evidence; no provider write | Verified MYOB entities, units and integration authority |
| Partial release | Explicit independent quantities/areas, dependency groups and conservation checks | Operational allocation/dependency policy |
| Commercial authority | Separate sourced synthetic decision; unknown applicability stays held | Real commercial routing and thresholds |
| Source freshness | Actual stored snapshot/version/completeness and observation time; no invented expiry | Agreed provider-specific currentness policy |
| Service linkage | Project positive fixture; Opportunity procurement blocked | Any future Service-specific package integration |
| Receiving | Local typed synthetic receiver with persisted exact outcomes | Live Supply Chain/provider contract and operational authority |
| External distribution | Readable preview/export only | DK-03 external delivery authority and evidence |

These operational decisions do not prevent a clearly labelled local synthetic implementation. They also do not permit a positive button to bypass missing synthetic policy or evidence. No material acceptance or real-world procurement approval is inferred from the user's approval of the UI.

## 23. VS Code handoff, local launch and deliverables

### 23.1 Files supplied to the coding session

1. This updated plan: `PPO-EN-06-Released-Materials-and-Substitutions-Build-Plan-r02.md`.
2. The build prompt: `PPO-EN-06-Released-Materials-and-Substitutions-VS-Code-Build-Prompt-r01.md`.
3. Save the **latest corrected** generated image as `PPO-EN-06-Released-Materials-and-Substitutions-Desktop-UI-Mockup-r04.png` and attach it or place it in the checkout's design-reference folder. The filename recommendation does not itself rename or copy the generated image.
4. Optional visual support: `collapsible-menu.png` and the supplied r22 theme HTML. The actual My Work code remains the menu implementation reference.

Open the existing `powerplants-one` folder in VS Code (the user's earlier location was `C:/Users/Dean.Fiedler/Projects/powerplants-one`; confirm the actual folder). Attach the plan and image to the Codex conversation or make their actual paths available. Paste the companion prompt or instruct Codex to execute the attached prompt. Files attached in ChatGPT are not automatically present in VS Code.

The build agent must read local `AGENTS.md` and nested instructions, inspect the current tree and implement the module. It must not stop at a proposed plan. If the image is unavailable, use the detailed written visual contract to continue useful implementation, clearly record visual comparison as outstanding and identify the missing reference rather than claiming an exact match.

### 23.2 Local server

Use current local configuration and the existing launcher. After inspecting the environment and migration changes, use the supported additive `npm run db:migrate` and `npm run db:seed` as appropriate, then `npm run dev`. Reuse an existing healthy server where possible; do not start conflicting processes. Normal local root is `http://127.0.0.1:3000`, with the new entry proposed at `http://127.0.0.1:3000/engineering/materials`. Report the actual port and route if different. `npm start` is deliberately rejected in the inspected repository; do not replace the local launcher.

For compiled verification use `npm run build` and the repository's `npm run serve:compiled`/Playwright setup as appropriate. Never print `.env.local` or connection strings. Restart only task-owned server processes and confirm health before the final handover.

### 23.3 Required implementation handover

Provide the exact working URL, relevant synthetic identities, what each of the six views does, the reviewed source paths, actual migration/seed changes, test commands/results, persistence/restart proof, screenshot paths and remaining limitations. Explain any visual departure. Update the stable decision/delivery documents and the existing STATUS entry concisely; do not append a long chronology or claim deployment.

The completed local app and its evidence are the implementation deliverable. This planning task delivers the revised plan and executable instruction document; it does not claim that application code has already been changed.

## 24. Traceability and source register

| Traceability | EN-06 contribution | Boundary |
|---|---|---|
| ENG-05 | Material requirements, exact release and scoped approved substitution | Principal requirement; broader acceptance remains separate |
| ENG-02 / ENG-03 / ENG-04 | Exact basis, drawing/file/review/issue lineage and purpose | Reuse upstream owners; do not recreate their approval |
| ENG-06 | Substitution-specific impact and receiving follow-up | Full technical change workflow remains EN-07 |
| ENG-07 | Required commissioning/retest and as-built references | Commissioning/as-built release remains EN-08 |
| SCM-01 / SCM-03 / SCM-04 / SCM-08 | Proposed demand, procurement references, supplier evidence and readiness impact | No purchase or stock command; Supply Chain owns receiving decisions |
| DOC-01 / DOC-02 | Exact source revisions, review, issue and retained evidence | Controlled distribution remains DK-03; operational document authority remains SharePoint |
| AT-15 / AT-37 | Engineering workflow and traceable technical-release evidence | EN06-A01–A46 are planned local component checks, not parent acceptance passes |
| D-002 / D-008 / D-019 | Accountability, authoring-system integration and technical authority | Fictional demonstration policy does not close these decisions |

The source register retains r01 domain references and adds the r02 implementation references. The pinned main checkpoint was rechecked for this revision; local checkout state must still be inspected. References to existing verification are historical source evidence, not newly rerun results.

| Source | Material inspected / purpose |
|---|---|
| S01 | [HTML module conformance][s01]: scope declaration, page types, reuse, issue preservation and application conformance gate |
| S02 | [Master Blueprint, Engineering section][s02]: ENG-01–ENG-07, issue purpose, substitutions and technical authority |
| S03 | [Engineering r02 integration decision][s03]: accepted design, implemented intake limits and confirmed SOLIDWORKS/SharePoint context |
| S04 | [Engineering model][s04] and [service][s04b]: actual package fields, context kinds, states, permissions and commands |
| S05 | [EN-02 design and receiving handover][s05]: exact basis, source, review and local receiving semantics; EN-07/EN-08 wording discrepancy noted in section 2 |
| S06 | [Supply Chain readiness contract][s06]: candidate demand/authority, item/unit/source completeness, quantities, readiness and unchanged bookings |
| S07 | [ES-07 item resolution and conversion][s07]: item mapping boundaries, exact payload review and original-outcome recovery |
| S08 | [Supplier Pricing & Cost Sources][s08]: supplier units, currency, conversion provenance and immutable prior commercial evidence |
| S09 | [Products r04 closeout][s09]: catalogue/detail design and historical limits; publication statements in this dated closeout are historical |
| S10 | [Coverage Register r06][s10]: EN-06 scope/dependencies and correct EN-07/EN-08 allocation |
| S11 | [BP-02 platform architecture][s11] and [ADR-0003][s11b]: modular monolith, domain services, database, receipts/outbox and replaceable adapters |
| S12 | [PPO naming standard][s12] and [ADR-0005][s12b]: stable IDs, separate revision/state, preserved external keys and working/issued filenames |
| S13 | [UI baseline register][s13]: accepted Engineering baseline and recorded r22 shared-source identity; [r22 source location][s13b]; r01 fetch limitation resolved for the visual audit by inspecting the supplied r22 HTML |
| S14 | [EN-02 build plan][s14]: established build-plan structure, page composition and responsive verification pattern |
| S15 | [AGENTS][s15], [README][s15b], [STATUS][s15c] and [design index][s15d]: instructions, current context and design/runtime distinctions |
| S16 | [Issue #11][s16]: closed issue state observed on 20 September; older body text and unchecked scope retained as historical context |
| S17 | Saved `PPO-Drawing-Register-Technical-Review-and-Release-r01.html`, dated 18 September 2026: source read through line 1216; six views, exact issue handling and Design coordination-only default fixture confirmed. Off-repository source; exact-byte provenance must be captured during the build |
| S18 | [Material Readiness r03 HTML][s18]: retained Supply Chain workspace source for future component/receiving comparison |

### Planning assurance and next bounded step

Repository access, exact main commit, existing EN-06 scope, Engineering runtime boundaries, current issue state and adjacent source contracts were inspected. The saved EN-03/EN-05 source was read, including its procurement limitation. The report separates observed facts from proposed behaviour and corrects the identified scope/status inconsistencies.

This revision delivers an updated local-app build plan and companion VS Code prompt. It records the approved UI and actual My Work implementation references. Application implementation, migration execution, native runtime verification and repository publication are not claimed. The next step is the six-view local application build defined in sections 19–23, including both deliberately different authority fixtures and the persistence/recovery proof.

### r02 implementation and visual references

| Reference | Source and treatment |
|---|---|
| UI-01 | Corrected r04 mockup from this conversation; screenshot composition reference, not executable UI |
| UI-02 | `collapsible-menu.png`; supports actual My Work implementation parity |
| UI-03 | `powerplants-one-theme-style-board-r22(1).html`; latest available supplied r22 board inspected in the audit |
| APP-01 | [My Work shell](https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/activities/components/client/my-work-shell.tsx) |
| APP-02 | [My Work styles](https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/app/styles/my-work.css) |
| APP-03 | [Desktop shell styles](https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/app/desktop-shell.css), [header portal](https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/components/header-content.tsx) and [module layout](https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/app/module-workspaces.css) |
| APP-04 | [Engineering service](https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/engineering/service.ts), [navigation](https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/shell/navigation.ts) and [package scripts](https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/package.json) |


[s01]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/standards/html-module-conformance.md
[s02]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/blueprints/BP-01-master-blueprint.md#11-engineering-and-design-control-capability-blueprint
[s03]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/decisions/engineering-r02-integration.md
[s04]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/engineering/model.ts
[s04b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/src/engineering/service.ts
[s05]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/decisions/engineering-basis-interface-register-design.md
[s06]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/contracts/supply-chain-readiness.md
[s07]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/decisions/item-resolution-conversion-design.md
[s08]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/decisions/supplier-pricing-cost-sources-design.md
[s09]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/reference/ui/products/ppo-session_2026-09-12_products-catalogue-r04_closeout.md
[s10]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html
[s11]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/architecture/BP-02-platform-architecture.md
[s11b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/decisions/ADR-0003-prototype-architecture.md
[s12]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/standards/naming-conventions.md
[s12b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/decisions/ADR-0005-project-naming-adoption.md
[s13]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/standards/ui-baselines.json
[s13b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html
[s14]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/delivery/engineering-basis-interface-register-build-plan.md
[s15]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/AGENTS.md
[s15b]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/README.md
[s15c]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/STATUS.md
[s15d]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/reference/ui/README.md
[s16]: https://github.com/deanrfiedler-gif/powerplants-one/issues/11
[s18]: https://github.com/deanrfiedler-gif/powerplants-one/blob/99c32aed5032393b7658713cca53aa4c1a2ab2dd/docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html
