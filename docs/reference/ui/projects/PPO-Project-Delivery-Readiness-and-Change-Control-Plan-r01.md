---
title: Projects — Delivery Readiness & Change Control
document_type: HTML workspace build plan
revision: r01
date: 2026-09-15
prepared_for: Dean Fiedler
status: Proposed design plan; HTML build and application implementation not performed
work_package: PPO-012 / issue 12
source_commit: bc1dcf21490dda37979227f5fc13224183853d5a
source_tree: 7602fe7590137749ae9b0df29cada58eb44d04a9
---

# Projects — Delivery Readiness & Change Control

## 1. Recommended outcome

Create one self-contained, interactive HTML workspace showing how a project coordinator investigates delivery blockers, compares a proposed change, obtains the right reviews and creates accountable follow-up. The workspace should make a complex horticultural project understandable without requiring the user to inspect every source module first.

The central questions are: **What is stopping this work? What would this change affect? Who must decide or act next?**

Use six connected views: **Overview, Readiness, Programme, Changes, Actions, and Evidence & history**. They share one selected project, work-package scope, source set and demonstration state. The initial experience opens the Overview for a fictional Willowbank irrigation upgrade, with a clear route into its most consequential blocker.

This is a detailed design brief. New fields, layouts and demonstration transitions below are proposals for this HTML, unless explicitly identified as an existing repository contract. Adoption of the visual plan would not by itself establish a new database, permission or operating policy.

## 2. Repository and reference basis

Main was verified as `bc1dcf21490dda37979227f5fc13224183853d5a` on 15 September 2026. The supplied theme file was inspected directly; it was not altered.

| Source | What this plan takes from it |
|---|---|
| Supplied `powerplants-one-theme-style-board-r20(3).html` | Composition patterns, Roboto hierarchy, navy/green, source-specific Gantt styling, rounded choice cards, flush panels, comparison, loading/recovery and Assistant patterns. |
| [BP-06 Projects blueprint](https://github.com/deanrfiedler-gif/powerplants-one/blob/bc1dcf21490dda37979227f5fc13224183853d5a/docs/blueprints/BP-06-projects-commercial-delivery.md) | Project identity, owned follow-up, milestones, commercial/technical boundaries and J1–J5 scope. |
| [Projects Gantt integration](https://github.com/deanrfiedler-gif/powerplants-one/blob/bc1dcf21490dda37979227f5fc13224183853d5a/docs/decisions/projects-gantt-integration.md) | Existing manual schedules, editable forecast milestones, FS/SS warnings and independent Service booking authority. |
| [J1 reconciliation](https://github.com/deanrfiedler-gif/powerplants-one/blob/bc1dcf21490dda37979227f5fc13224183853d5a/docs/delivery/projects-j1-reconciliation.md) | Reuse Project identities and shared Activities; richer coordination/health remains receiving work. |
| [F05, F06 and F08](https://github.com/deanrfiedler-gif/powerplants-one/blob/bc1dcf21490dda37979227f5fc13224183853d5a/docs/requirements/product-quality-register.md) | Source-bound change previews, accountable next actions, incomplete-data handling and horticultural access/shutdown context. |
| [Supply Chain readiness contract](https://github.com/deanrfiedler-gif/powerplants-one/blob/bc1dcf21490dda37979227f5fc13224183853d5a/docs/contracts/supply-chain-readiness.md) | Quantity states, shared allocations, partial receipt/quarantine example and explicit receiving decisions. |
| [Engineering integration](https://github.com/deanrfiedler-gif/powerplants-one/blob/bc1dcf21490dda37979227f5fc13224183853d5a/docs/decisions/engineering-r02-integration.md) | Existing intake versus wider technical-review/release scope. |
| [Customer/location workspace r03](https://github.com/deanrfiedler-gif/powerplants-one/blob/bc1dcf21490dda37979227f5fc13224183853d5a/docs/decisions/customers-sites-workspace-design.md) | Willowbank Horticulture, the Nursery & propagation site, Irrigation Shed 01 and pump `SYN-PPO-AST-000501`, serving three areas. |

The r20 source SHA-256 is `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. Its Chapter 04 and baseline specimens include proposed extensions; this plan does not call every r20 specimen an implemented or accepted application capability. The supplied file was reviewed in source, not certified through a new browser/device audit during this planning task.

Trace this page primarily to **PJ-07** from the prior page-coverage audit and **F05**. Reuse related PJ-02/03/04, EN-07 and SC-09 concepts rather than creating duplicate control systems. Repository parents include PRJ-02/03/04/05, SVC-03/05, ENG-06, SCM-08, FIN-03 and NFR-01/09. Full parent acceptance remains separate.

## 3. Audience and ownership

| Demonstration role | Work supported | Decision boundary |
|---|---|---|
| Project coordinator | Review project scope, blockers, schedule impacts, proposed responses and next actions. | Coordinates the response; cannot independently approve Engineering, Service or Finance decisions. |
| Engineer | Inspect design revisions, compatibility evidence, required technical review and retest consequences. | Technical disposition is scoped to an exact revision and purpose. |
| Supply coordinator | Inspect promises, quantities, allocations, inspection/quarantine and supplier follow-up. | Records source evidence; no stock posting or automatic substitution. |
| Service scheduler | Review a request affecting a confirmed visit, crew or preparation. | Booking acceptance is a separate reviewed action. |
| Commercial reviewer | Inspect permitted amounts, assumptions, customer variation references and unresolved effects. | Scenario cost, customer approval and ERP outcome remain separate. |
| Viewer | Inspect permitted project information and history. | No mutation controls. |

These are fictional demonstration roles. A static HTML role switch illustrates intended visibility and interaction; it cannot enforce secure access to data embedded in the file. All fixtures must therefore be synthetic. Actual roles and server permissions will be specified during application implementation.

## 4. Workspace frame and visual system

Deliver the module as standalone content, ready to mount beneath the shared PPO shell. Use a small removable context header in the standalone preview; omit the left navigation rail and global account/search controls. On integration, the real shell owns the department breadcrumb and page title, preventing duplicate headers.

Below that context, place a compact project strip: project selector/reference, project title, customer/site, selected work package or area, coordinator and source-as-at indicator. Keep this visible while changing tabs. Project identity is record context, not another application masthead.

The next row holds the six view tabs, a primary contextual action and secondary Snapshot, Assistant and Page guide controls. Use **Review next blocker** on Overview, **New change review** on Changes and **Preview impact** within an edited proposal. Avoid a generic Save button with unclear scope.

| Element | Proposed treatment based on r20 |
|---|---|
| Surfaces | `#F5F6F8` outer workspace; white working tables/panels; quiet grey separators. |
| Brand | Navy `#242A37` for selection and primary actions; green `#62BB46` for active context/progress. Reuse semantic status tokens; green is not an overall safety guarantee. |
| Type | Embedded Roboto 400/500/700 with Verdana fallback. 24 px standalone page heading, 20 px record title, 18 px section titles, 14 px working text, 12 px metadata. |
| Spacing | Proposed 24 px desktop / 16 px narrow insets, 16 px structural gaps and a 4 px rhythm within controls. Preserve Gantt-specific density. |
| Forms | Main measure up to 760 px; concise help and labels; 16 px inputs on phones. |
| Tables | Proposed 44 px default rows, expanding for essential text; dates, units and amounts remain readable. Gantt uses its source 38/42 px row treatment. |
| Numbers | Tabular numerals; cents for money; explicit currency/tax basis; year on dates; units with quantities. |
| Choice menus | r20 14 px floating-card corners, fine border, 7 px inset and keyboard selection. |
| Right panel | One at a time: 448 px Snapshot, 480 px Assistant, or Page guide. Flush square edges. Dock only when at least 440 px of main content remains. |
| Focused decisions | 10 px dialog corners, clear consequence, editable reason and precise confirmation label. |
| Scrolling | One primary vertical scroller per normal view. Wide tables/timelines scroll horizontally within their surface. Changes may use the r20 split queue/detail exception. |

Keep icon actions available on keyboard focus, with visible tooltips and accessible names. Do not hide critical instructions inside hover-only content. Use restrained motion and honour reduced-motion preferences.

## 5. Information shared across views

| Information | Required content |
|---|---|
| Project | Stable identity, readable reference, title, company, customer, site, coordinator and timezone. |
| Scope | Work-package identity, included facilities/growing areas and equipment, scope revision, exclusions and unresolved scope questions. |
| Programme | Current saved schedule revision, manual target/forecast, affected tasks, dependency rules and separately confirmed visits. |
| Readiness fact | Category, requirement, applicability, state, reason, responsible source owner and linked follow-up. |
| Evidence | Record identity, exact revision, source date, observation time, recorded-by, completeness and availability. |
| Proposed change | Type, reason, current basis, proposed values, affected scope, author, reviewers and comparison revision. |
| Impact | Affected record, current/proposed position, known consequence, uncertainty, owning domain and required action. |
| Follow-up | Shared Activity concept: source link, owner, due date or Due date needed, state, outcome and history. |

Keep a source's recorded date, its observation time and the preview's preparation time distinct. Show the source timezone where an instant or access window matters. Date-only programme values remain dates rather than midnight timestamps.

The first design uses one site per selected project. It may cover multiple areas within that site. Preserve facility nesting only where it is actual physical containment; equipment location and the areas it serves remain separate relationships.

## 6. View 1 — Overview

**Purpose:** understand the selected project's delivery position and open the next useful review.

Use four compact, clickable summary cells: **Blocking prerequisites**, **Evidence to review**, **Open change reviews** and **Next forecast milestone**. Counts describe the selected scope and current visible data. Clicking a count opens the corresponding filtered view. Never display a readiness percentage or an invented weighted health score.

The main area contains a prioritised attention list, a short upcoming-milestone strip and the latest change review. Each attention item states the problem, affected work, owner, due date and action. Group known blockers before information gaps and remaining follow-up; show unknown due dates explicitly. Make sort criteria visible.

A supporting area shows the work-package scope, customer access/shutdown window and source coverage. A manual project-health assessment, if demonstrated, retains its author, time and explanation independently of the readiness summary. Completing an action cannot silently turn a Blocked assessment green.

Include useful empty states: no blockers in the assessed scope; no assessment yet; no matches; and information unavailable. These have different meanings and next actions.

## 7. View 2 — Readiness

**Purpose:** inspect why a defined package is or is not ready and who owns the missing work.

Group the register into six categories:

| Category | Information to include |
|---|---|
| Engineering | Required design/drawing revision, issue purpose, technical review, outstanding query, substitution assessment and commissioning criteria. |
| Materials | Demand and unit, promised date, allocation, received/usable/quarantined quantities, shortage and source completeness. |
| Site and customer prerequisites | Exact work area, access and shutdown windows, customer prerequisites, induction/biosecurity instruction references and contingency questions. |
| Crew and attendance | Requested versus confirmed visit, accountable scheduler, required competencies, availability exceptions and customer date agreement. |
| Work scope and preparation | Authorised work scope, exclusions, work-order revision, issued job pack, affected instructions and individual preparation/acknowledgement requirements. |
| Commercial prerequisites | Named scope/spend authority, variation/customer decision reference, financial-source availability and questions requiring a commercial reviewer. |

Default columns: **Prerequisite; affected scope; state and reason; source/revision/as-at; owner; next action/due**. Quantity details and longer evidence open in a typed snapshot; they are not squeezed into every row. Provide category collapse, text search, owner/category/state filters, Needs attention and My actions presets, sortable dates and resizable desktop columns. Filters must never change an overall assessment's underlying scope silently.

Use proposed generic states **Not assessed, Evidence needed, At risk, Blocked, Ready for stated scope**. A justified non-applicable requirement is displayed separately as **Not required for this scope**, with reviewer, reason and version. Preserve source-domain states underneath; a received shipment is not itself Ready.

An assessment names its exact prerequisite set and source versions. A known blocker remains visible even when another source is unavailable. Partial/unavailable/stale evidence prevents a full Ready statement. No arbitrary evidence-expiry age is invented: staleness comes from a changed source/version or an explicitly supplied review rule.

Row actions: **Inspect source**, **Explain blocker**, **Plan follow-up** and **Start change review**. Reviewers can demonstrate a reasoned assessment in the local model, subject to the declared evidence requirements. There is no unrestricted Mark all ready command.

## 8. View 3 — Programme

**Purpose:** see when work is intended to happen and how an unresolved change affects that plan.

Reuse the current Gantt/List visual language: phase grouping, aligned task rows and bars, milestone diamonds, today marker, weekend shading, FS/SS links and written conflict explanations. Both views use the same tasks and selected scope. Keep **Fit, Week, Month, Today** and filters for conflicts, affected work and undated items.

Show **current saved forecast** and, while reviewing a change, a clearly labelled **proposed scenario**. Confirmed Service visits use a distinguishable marker and explicit Confirmed label. Do not show them as editable project-task bars. Task completion, reported percentage and technical/customer acceptance remain distinct.

Opening a task shows complete dates, predecessor identities, rule meaning, source revision and linked blockers. Forecast edits first modify a proposal. They must not automatically shift successors. Current repository rules support FS/SS warnings; holiday calendars, lags, resource levelling and critical-path calculation are not implied.

Optional illustrative snapshot B01 can demonstrate comparison, labelled **Planning snapshot — illustrative**, with capture date/author. It is not an approved contractual baseline. The essential r01 comparison is current saved forecast versus proposal; the build must remain useful without B01.

Provide a form-based date change with keyboard access. Interactive bar dragging and an automatic scheduling engine are deferred. Dates outside a supplied access window expose a reason and owner; software must not invent a replacement permitted window.

## 9. View 4 — Changes

**Purpose:** investigate one proposed change through a complete review journey.

Use the r20 work-queue/detail layout at sufficiently wide content widths. A proposed 264 px queue lists change reference/title, type, work package, state, owner, review due and primary consequence. The selected item remains highlighted. The main area shows its full review. On narrow screens, display the queue first and open one record at a time, retaining selection, filters and scroll on Return.

The comparison uses two columns when at least 820 px of content remains: **Current recorded position** and **Proposed position**. Place the impact table beneath them, aligned by consequence. At smaller widths, stack each field's current/proposed values together with explicit labels rather than separating all old and new values into distant blocks.

### Review steps

1. **Define the change.** Choose supplier delay, partial receipt/quarantine, proposed substitution, site-access change or scope/design revision. Capture affected scope, reason, evidence and proposed values.
2. **Preview impact.** Capture the exact source set and show affected work, visits, engineering reviews, materials, documents and permitted commercial consequences. Each impact is Known, Needs assessment or Not affected with a reason. Unavailable information remains explicit.
3. **Compare responses.** For the primary scenario, offer Delay affected work, Assess an alternative item, or Stage unaffected work. These are editable response candidates, not pre-approved solutions. Show required further evidence for each.
4. **Record specialist review.** Each domain review has an owner, requested purpose, evidence revision, outcome, conditions, due date and reason. Pending/returned reviews remain visible. Editing a relevant basis makes that review require reassessment; keep its old result in history.
5. **Confirm coordination actions.** Present a precise list of follow-ups or requests to create, with target, owner, due date and consequence. The primary action is **Create follow-up requests**, not Approve everything or Apply all changes.
6. **Track the response.** Show local receipts/history, request states and outstanding work. A separate simulated scheduler response can demonstrate acceptance, refusal or a request for more information against the original request. Technical and commercial outcomes retain their own records.

### Proposed change-review lifecycle

| State | Entry or exit condition |
|---|---|
| Draft | Editable proposal; saving requires a title, type and scope; missing review information can remain explicitly owned. |
| In review | Exact preview prepared, required reviewers identified and each unresolved item owned; unknown cost does not block investigation. |
| Returned for revision | A reasoned return; preserve the prior submission and reviews. |
| Ready to coordinate | Required coordination reviews support the listed actions and the source set is current. This is not a blanket technical, customer or commercial approval. |
| Actions requested | Confirmed local request set recorded once; downstream decisions can remain pending. |
| Resolved | All required impacts have an evidenced disposition and required follow-ups have outcomes, or explicitly accepted residual work remains with an owner/reason. No automatic project closure. |
| Withdrawn | Reason required; retain history. Existing accepted requests must be reconciled separately rather than silently deleted. |

Show **Source changed — refresh comparison** as a separate condition, not a replacement for the lifecycle. Preserve the proposal and historical preview. Disable confirmation against the stale basis and require refresh/review of affected changes.

Clarification/review Activities may be planned while the change is Draft or In review; their explicit purpose is to obtain evidence. A request to execute a schedule, substitution or commercial change needs the reviews applicable to that particular request before the parent reaches Ready to coordinate. A review outcome supporting investigation is not authority to execute the investigated change. The confirmation screen must name which kind of request is being created.

## 10. Commercial information within change review

Display a compact commercial-impact section, with supporting sources in the snapshot. Suggested columns: **Effect; amount or Not assessed; currency/tax basis; source; confidence/status; reviewer**.

Separate additional internal cost estimates, supplier charges, customer variation proposals and existing approved commitments. Do not combine them into a single profit or revenue figure. Restricted amounts and their derived totals are withheld in the role demonstration. If one required component is unknown, the overall cost impact stays Incomplete; a known subtotal may be shown with its exclusions.

An optional arithmetic fixture uses AUD excluding GST: freight estimate $480.00 plus additional labour estimate $720.00 equals known estimated cost $1,200.00. Label all three as fictional estimates. A separate customer variation proposal is not added to that cost subtotal. No exchange-rate engine, margin rule, tax calculation, legal notice deadline or ERP posting is included.

## 11. View 5 — Actions

**Purpose:** turn an impact review into visible responsibility and track what is still unresolved.

Provide a focused register: action summary, source change/blocker, target record, owner, due date, state and last outcome. Filters include Mine, Overdue, Due date needed, Waiting and Completed. These are page-session presets, not a new persistent team-view platform.

Use the existing shared Activity concept. Reopening the same obligation from several panels shows the same action identity. Prevent duplicate actions when retrying an accepted local command. Completion requires an outcome; reassignment has a reason and preserves the prior owner/history. Completing an action does not independently clear its originating technical or material blocker.

For downstream requests, identify Request sent for review, Accepted, Returned or Refused separately from the parent change. In this HTML, use **Requested in demo** rather than Sent where no transmission occurs. Show who must handle an offline/unavailable technician contact; no notification-delivery claim is fabricated.

## 12. View 6 — Evidence & history

Use a two-mode view: **Evidence** and **History**.

Evidence presents source title, domain, reference, exact revision, purpose/status, scope and observation time. Open the selected item in a readable evidence workspace or snapshot, using embedded fictional excerpts, tables or diagrams. Provide current/superseded comparison and a clear Return to review action.

History records captured proposals, source refreshes, reviews, returns, follow-up creation, downstream responses and corrections. Each event has actor/time, affected record, before/after where relevant and a reason. Earlier previews and reviewed sets remain inspectable during the session. History filtering must not reassign an event to the wrong project or change.

Distinguish working file version, engineering revision, approval purpose, issue, delivery and acknowledgement. Inspecting another revision does not approve or issue it. A source change identifies affected packs/documents for review without rewriting their original bytes or inheriting their acknowledgement.

Include **Print review summary** and **Download review summary**. The export contains the selected scope, exact preview/source revisions, visible impacts, current review/request state, open actions, as-at and a Synthetic design review label. Keep it distinct from a customer-approved update or transmittal. Print uses a single reading sequence with full text and no navigation controls.

## 13. Snapshot, Assistant and guide

The Snapshot is record-specific: selecting a task opens that task; a material line opens that line; a visit opens that appointment. Show record type/reference, source state, relevant relationships, evidence and next action. Switching Snapshot/Assistant/Guide preserves the initiating selection and shows only one right panel.

The Assistant follows r20's Conversation, Drafts and Activity structure, with source context visible. Suggested prompts are **Explain this blocker**, **What changes if delivery moves?**, **What still needs evidence?** and **Draft an internal coordination note**.

Responses are scripted, synthetic and tied to the selected project/change/source set. Include source links, a missing-information case, failed response, Stop/Retry and a changed-source warning. Suggestions may prepare an editable note or follow-up proposal; they cannot decide technical suitability, calculate an unsupported new schedule, approve a variation or move a booking. Review-before-create uses the same action model as the normal UI.

No live AI call is needed. Assistant context, drafts and history must not leak between projects or demonstration roles. Commercially restricted values must also be absent from rendered replies and exports.

The Page guide explains the six views, status meanings, the primary walkthrough, local-save behaviour and the difference between a preview, a request and a downstream decision. Place scenario/role/error controls inside a clearly separated **Demo controls** panel so they do not clutter the normal business workflow. Include no active recurring schedule; existing ChatGPT schedules remain paused.

## 14. Connected demonstration fixtures

Use a fixed demonstration clock of **15 September 2026, Australia/Brisbane**. Clearly identify the fixed clock so date-based warnings remain reproducible. Reuse exact existing customer/site/area/equipment identities when assembling fixtures; allocate collision-free synthetic identities for the new project, work packages and changes. Do not assume a matching name means a matching record.

| Fixture | Required facts and demonstration |
|---|---|
| Primary: Willowbank irrigation upgrade | Willowbank Horticulture, Nursery & propagation site. Pump `SYN-PPO-AST-000501` in Irrigation Shed 01 serves Greenhouse 01, Tunnel 01 and Propagation House 01. New project records are explicitly fictional additions. |
| Supplier delay | Promise changes from 21 Sep to 5 Oct 2026. Current installation forecast is 23–25 Sep; commissioning visit is confirmed for 28 Sep. Customer's recorded shutdown window is 23–25 Sep. New access window and revised visit remain to be agreed. |
| Partial receipt | A separate component line: 10 EA total demand, split Project 6 EA / Service 4 EA. Of 8 EA received, 3 EA are quarantined and 5 EA usable; 2 EA are unreceived. Usable allocations of 3 EA / 2 EA leave unmet demand of 3 EA / 2 EA. Do not double-subtract quarantine. This line is distinct from the delayed pump. |
| Substitution | Alternative pump candidate has an available supplier promise but incomplete compatibility/technical evidence. Procurement availability cannot make it approved for installation. |
| Source change during review | The fixture advances a promise, restriction or source revision after the preview. Earlier evidence remains; confirmation is refused until the comparison is refreshed. |
| Staged response | Identify unaffected work only from declared dependencies and area scope. A shared pump/shutdown dependency prevents assuming another served area is independent. |
| Second project | A small fictional propagation-controls project with no recorded blockers but incomplete site evidence. Supports switching, no-match and false-all-clear checks. |

### Primary walkthrough

Open Willowbank → select material blocker → inspect source/quantity → start change review → compare current and proposed programme → inspect site/crew/document impacts → record an Engineering question and commercial unknown → create owned clarification actions → receive the required fictional review evidence → choose a response → assign the reviewed follow-up requests → simulate the scheduler's refusal/return → revise the proposal → refresh changed evidence → confirm the new request set once → inspect history/export.

The demonstration must include a successful downstream response as a separate branch. A scheduler accepts only after the fictional fixture supplies a compatible window, crew and current preparation evidence. The original booking remains unchanged before that specific action. No response automatically completes technical handover or the project.

## 15. Interaction and recovery contract

| Interaction | Required behaviour |
|---|---|
| Search/filter/sort | Preserve typed text and focus. Counts and records agree. If selection becomes hidden, clear it or explain it; never operate on an invisible record. |
| Tab navigation | Retain project/scope and per-view filters, selection and scroll. Draft changes remain available. |
| Project change | Keep drafts under their original project; require Save demo draft, Discard or Stay when leaving edited work. Clear unrelated panel and Assistant context. |
| Preview | Read-only calculation of declared fixture impacts. No booking, issue, stock or commercial mutation. |
| Local save | Show Editing, Saved in this session, Save not confirmed or Save failed accurately. Do not label page-memory storage Synced. |
| Recovery | Simulate both fail-before-acceptance and response-lost-after-acceptance. Recover the original operation before permitting a new effect. |
| Partial-source failure | Keep available information and entered proposal; mark only the failed region unavailable. Retry that source without resetting the whole workspace. |
| Cancel/close | Preserve the proposal; explicit Discard is separate. Return focus to the initiating control. |
| Read-only/restricted role | Inspection remains available where permitted; unavailable controls have an explanation. Hide restricted derived values as well as raw fields. |
| Reset demo | Explain that local changes will be cleared; allow cancel. Restore the entire consistent fixture, not only visible rows. |
| Export | Use the selected exact review and role-visible fields. A stale summary retains a visible stale/source warning. |

For r01, use page-session memory with an explicit **Reload resets this demonstration** notice in the guide and Demo controls. Add unsaved/uncertain-work navigation warnings where browsers permit. Do not depend on file-origin browser storage or imply durable server persistence. Portable backup/import and a real offline queue are deferred.

Validate same-project/site scope, duplicate source links, permitted owner choices, date order, expected source versions and reasoned withdrawals/reassignments. Reject negative quantities and allocations exceeding evidenced usable quantities; compare quantities only in an explicitly common unit. Preserve null/unknown amounts and dates. Insert user-entered text as text, never executable markup. Link validation errors to the relevant field and retain all other entered values.

## 16. Responsive and accessible behaviour

| Surface | Expected adaptation |
|---|---|
| 1440/1366 px desktop | Full project context, six tabs, wide register/timeline, two-column comparison where actual available content permits. |
| 1024/820 px | Wrap lower-priority controls; stack 292 px supporting sections below the main task when insufficient room remains; panels overlay when docking would squeeze content. |
| 390/320 px phone | Readiness/action cards, programme List first with optional horizontally scrollable Gantt, queue-to-detail navigation, labelled stacked comparisons, full-width panels and 44 px principal targets. |
| 200% zoom / short height | All actions and final fields remain reachable; no trapped nested scroll or footer-covered content; short dialogs scroll internally. |

Use container width, not only the viewport, for two-column and dock decisions. The r20 shell's 780 px breakpoint remains a shell reference; module content can stack earlier. Two-column review requires at least 820 px content; split queue/detail uses approximately 700 px, subject to a legibility check. Programme can retain an internal 760 px minimum timeline with accessible horizontal scrolling.

Use semantic tabs, tables and headings; labelled form inputs; meaningful state text; focus-visible rings; an error summary linking to fields; polite announcements for saves and loading; Escape/close/focus return; trapped focus and inactive background for modal phone overlays. Modeless desktop snapshots must not trap focus. Provide keyboard alternatives for resizing, selecting dates and all pointer interactions.

Long labels can wrap or open complete text. Amounts cannot clip or lose units/currency. Colour alone never identifies a blocker, comparison delta or selected state. Reduced-motion and touch scrolling must work.

## 17. Build sequence and acceptance

Build the HTML in reviewable stages, all within one consistent fixture/model:

1. **Basis and fixtures:** refresh repository/source identities, extract the required r20 fonts/tokens/icons, freeze fixture dates/quantities, define source and decision relationships.
2. **Frame and navigation:** project strip, six tabs, filters, panels, responsive structure and typed snapshots.
3. **Readiness and programme:** faithful Gantt/List, source inspection, quantity accounting, scoped readiness and known/unknown impacts.
4. **Change-review journey:** drafts, captured comparisons, specialist reviews, stale-basis handling, response options and explicit follow-up requests.
5. **Actions, evidence and assistance:** shared local action identities, separate receiving responses, preserved history, export/print, scripted Assistant and Page guide.
6. **Verification and polish:** run interaction cases, render real browser captures, review long-content/mobile/zoom/focus states, correct defects and record actual evidence.

### Observable acceptance cases for the later HTML build

| Case | Pass condition |
|---|---|
| Navigation | Every tab, filter, metric and panel opens the correct project/record and returns without losing state. |
| Quantity integrity | The 10/8/3/5 EA example conserves supply and demand, with 3/2 EA unmet allocation displayed correctly. |
| Scoped readiness | Missing, partial or changed evidence prevents unsupported Ready; filters cannot conceal prerequisites used by the assessment. |
| Programme | Delay produces the expected conflict while original installation dates and confirmed visit remain unchanged. |
| Change control | Draft → review → returned revision → refreshed comparison → coordinated requests is possible with preserved history. |
| Source race | A source change after preview blocks confirmation, preserves the proposal and invalidates only affected reviews with explanation. |
| Domain boundaries | A project action cannot itself approve a substitution, move a visit, issue a pack or recognise revenue. |
| Downstream response | Accepted, returned and refused requests have separate evidence; parent change and booking states remain coherent. |
| Retry | Repeated confirmation/recovery returns the original request/action set without duplicates. |
| Actions | Completion requires an outcome; blocker and health do not silently resolve with it. |
| Commercial information | Known subtotal is accurate; unknown components remain incomplete; restricted values are absent from summaries, Assistant and exports. |
| Evidence | Earlier reviewed snapshots and source revisions remain inspectable; viewing a successor does not rewrite earlier review/acknowledgement. |
| Error/empty states | Loading, none recorded, no matches, failure, partial source, read only and unavailable permission are visually and semantically distinct. |
| Native usability | Real desktop/phone/320 px/200% zoom captures have no blocking overflow, clipping, obscured action or focus defect. |
| Assistant | Correct source context, scripted outcomes, Stop/Retry and review-before-create; no unsupported operational action. |
| Export/print | Exact selected review, visible scope, state, open items and synthetic designation survive print/download. |

These cases are proposed and have not been executed for an HTML that does not yet exist. DOM/model tests do not substitute for native browser rendering or physical-device review. Application integration will separately require server permissions, database/HTTP races, durable receipts, restarts and source adapter evidence.

## 18. Deliverables, naming and handover

The first build should produce:

- One self-contained HTML review issue, with embedded selected fonts/icons, all fictional data, CSS and JavaScript; no runtime installation or network access required.
- A concise design/receiving record identifying the source commit, r20 hash, page scope, fixture assumptions, implemented interactions and deferred controls.
- A verification record with actual test outcomes, source/file hashes and original browser captures for the key views and exception states.
- A design-index entry linking the current review issue, its status, predecessor where any, associated work package and runtime integration state.

Proposed stable working filename: `project-delivery-readiness-and-change-control.html`. Proposed issued review copy: `PPO-Project-Delivery-Readiness-and-Change-Control-r01.html`. Keep revision/status in metadata and preserve issued bytes. Confirm the repository's current design-index convention at build time; do not rename existing files or start a competing index as part of this page.

A suitable repository destination is the existing UI-reference family under `docs/reference/ui/projects/`, with a stable decision/receiving document under `docs/decisions/`. These are proposed destinations, not files created by this planning task. Track the design under existing issue #12 with links to #11/#13 and the adopted F05 package; no new parent requirement is necessary.

The standalone artifact should be organised for later reuse of existing Project, Activity, engineering, scheduling, document and Finance services. It must not contain invented ERP endpoints or copy the full 16 MB theme board into the deliverable. External source links in the guide are optional reading; core operation remains offline.

## 19. Decisions to keep explicit

The plan can proceed as a synthetic design with the defaults above. During review, record any requested change to the six-view structure, primary fixture, panel behaviour or session-only persistence. Operational evidence still needed later includes technical reviewer authority, cost definitions, permissible quantities/units, evidence-age rules, real calendars and shutdown approvals, external source ownership and the exact receiving command contracts.

Do not expand r01 into a full contract/claims system, Engineering release suite, stock ledger, automated critical-path scheduler, live AI service, customer portal publication, recurring monitor or offline synchronisation engine. Show the relevant source context and owned handover in this workspace; implement each owning capability through its existing scope.

The next concrete step is the first interactive HTML build following this plan, then visual and workflow review using the supplied r20 reference.
