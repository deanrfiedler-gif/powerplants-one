---
document_id: BP-06
revision: r01
date: 2026-09-07
owner: Dean Fiedler - private prototype
status: Bounded discovery and proposed build contract; implementation not invoked
source_commit: 1f13dd8d6f5006559152fe9d5410aed3fff64234
---

# BP-06 — Projects & Commercial Delivery

[Source assessment](projects-source-assessment.md) · [Screens](projects-screen-specification.md) · [Sequence](../delivery/projects-implementation-plan.md) · [Acceptance](../testing/projects-acceptance.md) · [Handover](../delivery/projects-discovery-handover.md)

## 1. Objective and authority

Dean intends Projects eventually to replace the useful project coordination capabilities in **PPA - Project Delivery System - PROTOTYPE**. His 7 September “Proceed with the next bounded step” invokes discovery and first-increment design under PPO-012 / issue #12. This package defines a small usable coordination journey and preserves the broader PRJ-01–PRJ-08 scope. It does not invoke application implementation or Smartsheet migration.

First journey: an authorised coordinator selects an existing permitted customer and site, creates a synthetic project, assigns a coordinator, plans milestones and an initial Activity, records a progress update or blocker, and sees the same facts in the portfolio register. All design examples are fictional. The source workspace's naming, template rules and disabled controls are evidence to assess, not PPO authority.

The current master allocates full Projects to Wave C. The proposed first build, **J1 — Project register, milestones and owned follow-up**, may be brought forward after the P10–P12 service prototype is verified. That timing is a recommendation; it is not a newly imposed technical dependency. The later J1 invocation must record its actual sequencing choice. P01–P12 keep their existing order and names.

## 2. Proportionate scope by journey

| Journey | Projects treatment | Boundary |
|---|---|---|
| Product/parts sale | Usually CRM/quotation/order plus delivery follow-up; create a project only when coordination warrants one | Do not require a project for every sale or confuse order fulfilment with project completion |
| Planned service | Existing Ticket → WorkOrder → Appointment → Report → Finance journey | A project may later link work; it does not replace or authorise the work order |
| Equipment upgrade | J1's useful starting scenario: one customer/site, coordinator, milestones and actions | Technical release, parts readiness and booking remain their owners' decisions |
| Major greenhouse project | J1 can record a coordination outline; later increments add work packages, dependencies, contracts, tests and staged handover | J1 is not sufficient to control a live major-project delivery |
| Warranty/return | Existing service/coverage and later supply-chain return paths; link a project where necessary | Project health does not decide warranty, credits or supplier recovery |

J1 includes project list/detail/create, current manual stage and health, target/forecast finish, manual milestone dates, immutable update history and shared Activities. Excluded from J1: Gantt/dependency calculation, tasks/WBS engine, bulk edits, document uploads/issue, external links supplied by users, quote acceptance/conversion, scheduling requests, budget/cost/margin, imports, customer communications, portal access, offline storage, terminal project closure and owner/customer/site reassociation. These exclusions bound implementation; they do not delete parent requirements.

## 3. Source conclusions

MIG-01 supplies separate project identity, ERP status, coordinator, stage, health, target/forecast and next-action concepts. MIG-02 contains native PREDECESSOR values alongside legacy text; they must never be treated as interchangeable. MIG-07/08 distinguish evidence and review from merely completing an item. MIG-10 shows richer RAID and communication metadata; J1 needs only a milestone blocker with owned follow-up. MIG-11 has two distinct Customer Update Register assets; their writable authority remains unresolved.

The [source assessment](projects-source-assessment.md) records the exact bounded reads, classifications and unresolved evidence. No live project row, contact email, financial amount, attachment, comment or customer document was imported into this design. Existing source IDs appear only as provenance. Source template PT-/SC-/DL- labels are external keys, distinct from PPO tests and screens.

## 4. Records and identity — proposed J1 logical contract

Reuse BP-02's modular monolith, PostgreSQL, scoped domain services, immutable audit and durable command receipts. These are logical requirements, not an applied schema or allocation of a migration number.

| Record | Fields and meaning | Invariants |
|---|---|---|
| Project | `id`, `workspace_id`, `company_id`, `organisation_id`, `site_id`, `reference`, `title`, `coordinator_id`, `delivery_stage`, `coordination_state`, `target_finish`, `forecast_finish`, `health`, `health_commentary`, `next_activity_id`, `version`, `created_at/by`, `updated_at/by` | UUID identity; atomic permanent readable reference; known permitted organisation/site/operator relationship; company/site/coordinator fixed in J1; server-derived actor/workspace |
| ProjectMilestone | UUID, project UUID, title, owner UUID, `target_date`, `forecast_date`, `date_needed`, state, completion/cancellation text, actual completion instant, blocker Activity UUID, optional `supersedes_milestone_id`, version | Date-only plans; same project/company/site scope; actual completion only from a successful completion command; no duration or implied predecessor engine |
| ProjectUpdate | UUID, project UUID/version, author/time, update text, changed stage/health/date facts and reason | Append-only accepted snapshot; later correction references the original update; no silent rewriting of accepted history |
| ProjectMilestoneEvent | UUID, milestone/project UUIDs, old/new version, event type, actor/time, explanation | Append-only; maintains original dates, owners, completion and cancellation evidence |
| Shared Activity / ActivityLink | Existing states, owner, due instant or explicit due-needed, outcome/cancellation and content class | Add typed Project target with actual foreign keys and current permission checks; retain existing targets and lifecycle |
| External identity (later) | Provider/configuration/company/entity/key plus source time and classification | Never infer a MYOB project ID from a PPO reference or title; no verified external mapping in J1 |

The adopted naming catalogue already defines Project / PRJ / `SYN-PPO-PRJ-000001`. J1 must enable and validate its actual permanent-registry/reference allocation before persistence; no new reference pattern is proposed. Mockups use the adopted pattern with fictional values. Milestones/Activities need UUIDs; J1 does not invent extra human reference catalogues.

Creation requirements: title 1–200 characters; existing organisation and site; eligible coordinator; initial action with eligible owner and summary 1–160 characters; either a due instant or due-needed. Titles are trimmed, retain Unicode and are not keys. Reject unsupported fields; do not accept body actor/workspace identity. Detail narratives are 1–4,000 characters; concise health commentary is at most 1,000. These are proposed prototype limits, not source-system maxima.

J1 requires a known site to reuse the actual scope model. Multi-site projects and changes to customer/site/coordinator need a later relationship-impact contract, including actions and related permissions. Multiple milestones may share a name; UUIDs resolve ambiguity. Customer and site links open their existing canonical views.

## 5. State and date rules

Project `coordination_state` remains Active in J1. Proposed `delivery_stage` values are Intake, Planning, Delivery, Handover: manual coordination labels, never a technical, commercial or customer approval. Create starts Intake. An authorised coordinator may move between these stages with an explicit reason; no automatic change follows milestone completion. Complete/Cancelled/OnHold project lifecycle is deferred to J5's closure/hold contract. UI must not offer those values.

Proposed `health` values: NotAssessed, OnTrack, Attention, Blocked. Create starts NotAssessed with “Assessment needed”. Any subsequent health choice requires a commentary. Blocked additionally requires an open linked Activity with an owner and a due instant or due-needed. Attention requires an open linked follow-up too, at the time the assessment is written. Later Activity completion preserves that assessment/history and shows Follow-up needed; the next project update must reconcile it. Changing to OnTrack requires an explanation; a separately blocked milestone remains visible and produces “Blocked milestone remains” regardless of project health. No automatic health score or imported risk thresholds.

| Milestone transition | Required accepted evidence | Consequence |
|---|---|---|
| Create → Planned | Title, eligible owner; forecast date or explicit date-needed; optional target date | Appears in the project; no booking or approval |
| Planned → InProgress | Expected version and start reason | Records event; no technician start claim |
| Planned/InProgress → Blocked | Blocker explanation and open linked Activity | Shows responsible person and action; does not change confirmed bookings |
| Blocked → Planned/InProgress | Resolution/progress explanation | Keeps original blocker/history; Activity remains independently owned |
| Planned/InProgress/Blocked → Completed | Completion note; existing blocker follow-up must have an outcome or be explicitly retained as remaining work with reason | Records actual completion instant; no engineering/customer acceptance |
| Any non-terminal → Cancelled | Cancellation reason | Preserves target/forecast and history; linked Activity is not silently cancelled |

Completed/Cancelled milestones are immutable in J1. Corrections create a successor milestone linked to the original with a reason; they never overwrite completion evidence. Project closure is not available merely because all milestones are Completed.

Dates: `target_finish/target_date` are manually recorded objectives, not contractual baselines. `forecast_finish/forecast_date` are manual estimates, not dependency-calculated dates. Unknown displays “Date needed”; no zero/epoch placeholder. Changing an already recorded target or forecast requires a reason and an event retaining old/new values. Forecast before target is allowed and means early; past forecast is allowed with an overdue indicator. Actual future completion time is rejected; server sets completion time.

Project/milestone dates use ISO local calendar dates, displayed in Australian format; demo calendar zone is Australia/Brisbane and explicitly recorded. Activity keeps its existing instant contract: forms collect local date/time with zone, convert once to an instant, and display the zone. Overdue means an incomplete item with known due date before the current date in the project zone. Missing dates are not overdue. Weekend dates remain valid in J1; no working-day calculation is implied.

The next milestone is the earliest forecast-dated non-terminal milestone, tie-broken by UUID, including blocked/overdue items. Also show undated open milestone count. Target/forecast variance, if displayed, is calendar-day difference only and unknown when either date is missing. No percentages, weighted completion or cross-project money totals in J1.

## 6. Actors and permissions

Capabilities below are proposed additions, not present grants. Reuse current scoped identity with current workspace/company/site and active user membership. The business role names are fictional test roles; they do not appoint company employees.

| Actor | Proposed capabilities | Restrictions |
|---|---|---|
| Coordinator | `projects.read`, `projects.create`, `projects.edit`, `projects.milestone.edit`, `projects.update` plus needed shared/Activity permissions | Edits require current coordinator identity and scope; cannot grant access, transfer project ownership or override source-domain authority |
| Milestone/Activity owner | `projects.read`, `projects.milestone.progress` plus existing Activity permissions | Progress only their assigned milestone; Activity terminal commands retain current owner rules; cannot edit project health/stage |
| Viewer/manager | `projects.read` plus relevant shared-read grants | Read only; a title or management role never grants edit automatically |
| Unrelated or revoked actor | None for affected scope | No record, counts, autocomplete, history, receipt or linked action disclosure |

The server must require both Project visibility and relevant shared customer/site visibility. A link never broadens Activity access. Project-linked Activities must be denied when the Project is hidden even if the Activity's organisation is visible. Lists, detail, history, related reads and receipt recovery all use the same visibility predicates. Mixed-link Activity visibility requires every linked target to remain permitted, preserving current behaviour. Proposed J1 initial actions use Internal class and existing CustomerContact or RelationshipReview kinds; do not invent an incompatible ProjectAction enum.

## 7. Commands, reads and recovery

Proposed routes live under `/api/projects`; IDs denote real scoped UUIDs. Reconcile names and physical schema against actual main during J1 rather than treating this table as implemented.

| Contract | Input / guard | Atomic accepted result |
|---|---|---|
| CreateProject | Idempotency/operation identity; scoped organisation/site/coordinator; initial action | Project + initial Activity + typed link/designation + update/audit/receipt; all succeed or none |
| UpdateProject | Expected Project version; permitted stage/health/title/date fields; reasons | New version and immutable change/update snapshot; rejects relationship/owner edits |
| AddMilestone / ReviseMilestone | Project access and expected relevant versions; valid owner/date fields | New identity or version plus event; a successor explicitly points to terminal original |
| ProgressMilestone | Current owner or coordinator with capability; expected milestone version; transition evidence | One state transition/event and optional blocker Activity created atomically |
| PlanProjectAction | Current project version and existing Activity create rules | New linked Activity and optional next-action designation; no duplicate independent task store |
| DesignateNextAction | Existing open visible Activity already linked to this Project | Versioned pointer and history; rejects unrelated/terminal/hidden Activity |
| CorrectProjectUpdate | Original update ID and explanation; new text | Append-only correction; original still accessible in history |
| Read list/detail/history | Scoped filter/search/order/cursor; current actor | DTOs with only visible linked records; total count describes the exact permitted query |

All writes use existing canonical request hashing, durable operations and receipt patterns. Repeating the same operation/payload returns the original result under current authority; changed payload with the same operation identity is rejected. Version mismatch returns a conflict without overwriting either version. No outbox job is permitted to send a message or call MYOB/Smartsheet in J1. Reference allocation must survive retry and never reuse an accepted reference.

No project-specific offline store is added. On failed/uncertain save keep the proposal in current component memory, show “Save not confirmed”, and offer receipt recovery for the original operation. Do not generate a new operation blindly. Warn before navigation discards an unsaved proposal. Browser reload may lose an unaccepted in-memory edit; show this limitation clearly before leaving. Actor/scope changes clear sensitive proposals and loaded details. If access is lost, do not show the original accepted response through recovery.

Completing/cancelling the designated Activity does not change project stage or milestone state; the next-action projection becomes “Next action needed”. Hidden/revoked owners or related records require owned remediation without leaking the hidden identity. The implementation must define its atomic handling of Activity completion versus next-action designation and test the race.

## 8. Later cross-domain controls

| Interface | Later required handoff | Refusal/recovery |
|---|---|---|
| CRM/Estimating → Projects | Explicit accepted commercial source/version, approved scope and handover owner | E1 draft quotation and CRM Open are not award/acceptance. J1 manual create does not convert an opportunity or write CRM/ERP |
| Projects → Service scheduling | Versioned demand/request; desired dates, reason, scope and existing appointment relationship | Existing P05 ProjectReference is contextual text, not a typed Project. Add a validated junction later. Only Service confirms/moves/cancels reservations; a forecast edit never does so |
| Engineering → Projects | Exact released technical revision, criteria, reviewer and controlled change impact | Project stage is not design release. PPO-011 remains prerequisite to accepting technical gates, not to this bounded design |
| Supply Chain → Projects | Source-backed readiness/shortages/shipment state by package and as-at | No purchase/stock effect from project status; unknown/partial remain explicit |
| Finance → Projects | Approved definitions, source currency/time/completeness, commitments/costs/invoices/receipts separately | P10 service handoff is not a project ledger; no invented margin, entitlement, revenue or reconciliation |
| Documents / customer portal | Exact customer-safe update revision, approved projection, recipient/access checks and issue/distribution evidence | Internal notes never flow directly to customer view. “Customer visible” is eligibility, not approval; corrections need renewed content-bound approval |

J2 scheduling must persist typed predecessor/successor UUIDs, FS/SS and signed lag with explicit units and calendar version, immutable baseline revisions and mutable forecast revisions. Validate self-links, duplicate edges, cycles, missing/cross-project references and concurrent graph edits. Specify working calendars, holidays and time conventions before calculation. Independent branches remain parallel; do not reconstruct a single chain from source text. The source read returned rendered native edges but no predecessor index; row-number mapping and calendar configuration remain unverified.

J4 commercial controls must bind contract obligations/notice dates/variations/subcontracts to reviewed source clauses and authorised reviewers; proposed states Requested, Assessed, Submitted, Approved, Rejected, Disputed and Withdrawn do not establish legal entitlement. Do not supply legal deadlines or financial thresholds in this package.

J5 separates submitted deliverables, technical review, customer acceptance, open defects, training, as-builts, support handover and commercial closure. Completion of a visit/milestone/project cannot close these other lifecycles automatically. Partial acceptance names the exact package/revision; supersession retains history and affected-recipient follow-up.

## 9. Traceability and remaining decisions

| Parent | First contribution | Later completion boundary / planned cases |
|---|---|---|
| PRJ-01 | J1 identity, customer/site, coordinator, register | J3 accepted sales handover; J5 lifecycle/classes; PA-01/02/03 |
| PRJ-02 | J1 manual milestone dates and history | J2 real dependencies/calendars/baselines; PA-06/12/13 |
| PRJ-03 | J1 owned blocker/follow-up and update trail | J2 full risks, assumptions, issues, decisions and changes; PA-04/05/07 |
| PRJ-04 | Preserved scheduling authority; no J1 command | J3 typed demand and controlled booking impact; PA-14 |
| PRJ-05 | Source-driven future commercial contract | J4 obligations/variations/subcontracts; PA-15 |
| PRJ-06 | Milestone completion distinguished from verification | J5 test/defect/hold/retest controls with BP-05; PA-16 |
| PRJ-07 | J1 internal portfolio, date/health updates | J4 controlled customer update, later portal; PA-08/09/17 |
| PRJ-08 | Preserve handover/closure distinction | J5 staged acceptance/support/closeout; PA-18 |

D-010 commercial policy, D-014 Smartsheet authority/parity and D-026 migration remain open. Unresolved design details are tracked as G01–G08 in the source assessment; no master decision is closed by this package. AT-01/09/17/20/21/24/30/32/34/36/38 stay at existing statuses. PA cases are authored future procedures only.
