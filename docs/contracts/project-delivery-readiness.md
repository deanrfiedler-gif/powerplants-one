---
document_id: PPO-PJ07-READINESS-CONTRACT
date: 2026-10-26
owner: Dean Fiedler
status: Proposed native implementation specification; no runtime or visual acceptance
source_commit: 55722e8226b62c2a0e2e3bfe67b38b104bb09590
versioning: git
---

# Project delivery readiness and movement coordination

## Authority, result and scope

Dean instructed **“Proceed”** after the recommendation to define PJ-07's readiness workflow/data contract and a Figma correction brief. This document supplies that specification. The [workflow reconciliation](../decisions/r10-workflow-reconciliation.md#pj-07--source-backed-review-with-separate-delivery-decisions) remains the decision authority; technical choices below are proposed implementation choices under that instruction, not additional quoted business approvals. The [correction brief](../design/project-delivery-readiness-correction-brief.md) translates the contract into reviewable screen changes. No Figma baseline is accepted or changed.

Traceability: PJ-07 / PPO-012; BP-01 PRJ-02/03/04/05, SVC-03/05, ENG-06, SCM-08, FIN-03 and NFR-01/09; F05/F06/F08; [BP-06](../blueprints/BP-06-projects-commercial-delivery.md). These IDs retain their original meanings; PJ-07 is a screen scope, not parent requirement PRJ-07. No parent acceptance is closed here.

Outcome: a permitted coordinator reviews one explicitly defined delivery step, sees what is ready, unknown or blocking, assigns source-owned follow-up, and submits a fully reviewed set of movement instructions to named receiving owners. Each source applies its own authorised changes. Readiness is coordination evidence, never permission to start work, dispatch, reserve stock, issue a drawing, approve a variation or close a Project.

The first native implementation uses the existing TypeScript/PostgreSQL modular monolith, scoped authorisers, transaction locks, immutable events and operation receipts. It adds no integration, stock ledger, scheduling engine or general task store. All endpoints/tables described below are **proposed and absent**. The reserved rail destination stays unavailable until built. Runtime work follows accepted design and the current Codex build limit; this documentation contribution does not start it.

## Current source inventory and authority

The main commit above was inspected. An adapter is new receiving work even when its source exists. Earlier blueprints and standalone HTML describe historical proposals; current native commands below govern actual effects.

| Area | Current source and native boundary | PJ-07 receiving rule / remaining work |
|---|---|---|
| Project context, tasks, forecast and calendar | [Project service](../../src/projects/service.ts), [calendar/actuals decision](../decisions/project-calendars-actuals.md), [overview](../../src/projects/overview-model.ts). Tasks, FS/SS warnings, calendar revisions and immutable baselines already exist. | Read exact Project/task/calendar versions. Define delivery-step membership; it is not inferred from every task at the site. Preserve baseline bytes and separate calendar-day/working-day units. |
| Materials | [Supply reducer](../../src/supply/model.ts), [reads](../../src/supply/reads.ts), [validity](../../src/supply/validity.ts), [contract](supply-chain-readiness.md). | Reuse current native assessment and exact allocations/facts. Select typed Project-origin and explicitly related WorkOrder/appointment demand; no title/reference matching. A project-wide demand without exact step allocation remains unassigned evidence, not automatically available to every step. |
| Engineering and technical release | [Engineering service](../../src/engineering/service.ts), [change reads](../../src/engineering/changes/reads.ts), [handover payload](../../src/engineering/changes/preview.ts). Technical decisions, revised releases, prerequisites and receiving have separate native meanings. | Bind exact package/release/source/purpose and covered scope. A Reviewed design basis is not automatically an issued construction release. Link an existing Engineering change when one exists; PJ-07 does not create a competing technical change or reuse Engineering's grant. |
| Site/customer access and shutdown | [CS readiness model](../../src/shared/cs/model.ts), [assessment](../../src/shared/cs/readiness.ts), [requirement revisions](../../src/shared/cs/requirement-revisions.ts). Shutdown approval is an evidence kind; requirements, reviewed evidence and work windows exist. | Reuse exact requirement revision, reviewed evidence, activity, facilities, visitors and interval. A working calendar day or recorded customer contact alone is not shutdown approval. Unknown visitors/intervals remain unresolved. |
| Crew and confirmed attendance | [Scheduling planner](../../src/scheduling/planner.ts), [change review](../../src/scheduling/change-review.ts). Native checks govern scope, resources, policies, travel and reservations. | No Project date creates an appointment or verifies crew availability. Show unbooked/unassessed separately from a current confirmed booking and its current dispatch holds. |
| Work preparation | [Packs](../../src/documents/packs.ts), [Parts readiness](../../src/service/parts-readiness.ts), [field readiness](../decisions/field-readiness-native.md). Exact scope/issue/hash, assignments, returns and acknowledgements matter. | A pack citing r02 while the required release is r03 needs its own source assessment/successor. PJ-07 cannot issue, acknowledge or clear it. Preserve the distinct Supply and field-gate unallocated-demand rules. |
| Commercial and specialist obligations | [Commercial contract](project-commercial-controls.md), [specialist packages](project-specialist-packages.md), [specialist handover](project-specialist-handover.md). | Include independently applicable release obligations even when the current change has no cost effect. Money requires separate Finance/commercial visibility. A technical/specialist handover acceptance does not imply delivered work. |
| Final acceptance and closeout | [PJ-09 policy](../../src/projects/acceptance/policy.ts). | Link applicable acceptance obligations and their native outcomes; do not reproduce PJ-09's gate or turn delivery readiness into Project closure. |

**Service command distinction.** Today `createChangeRequest` accepts `ProjectReference` as narrative provenance but still requires `schedule.request` and, for a non-technician request, `schedule.manage`. That string is not a typed Project authorisation. `decideChangeRequest(..., "accept")` calls `applyBooking` and can move the booking in the same native transaction. PJ-07 must not invoke that action as a harmless acknowledgement, or grant the coordinator scheduling authority. PL-04's current-version review may accept a request whose original schedule changed; this contract adds no blanket stale-original veto to that native policy.

## Delivery scope and complete membership

A **delivery scope** is a subordinate Project coordination record, not a new work package or task master. It contains:

- Stable `scope_id` UUID, Project UUID, immutable company/customer/site context and a positive `scope_version`.
- A named delivery step and exact native task/milestone IDs, with the observed task/dependency versions; at least one task is required for a reviewable scope. A future package selector must resolve to the same explicit membership before review.
- Explicit facility/area IDs and the activity being prepared. Null facility scope means source-recorded site-wide applicability; it never means all descendants of a selected facility.
- The required local date, its source task/version and site timezone. Any separately proposed attendance interval is explicit. Date-only tasks do not supply invented midnight appointment times.
- Exact related WorkOrder, appointment, Engineering package/release, Supply demand, commercial/specialist and acceptance references. Each link is verified against native company/customer/site and authorised relationships. Unknown or unallocated relationships remain visible gaps.
- A category applicability manifest for Engineering, Materials, Site/customer, Crew/attendance, Work preparation and Commercial. Each category is Required, NotApplicable or Undetermined, with an owner, reason and exact source basis. Other source obligations can contribute typed rows; labels alone cannot create obligations.

Only the current Project coordinator with current `project.read`/`project.edit` and native linked-context visibility may define/revise the scope or nominate it as the Project's next delivery step. Source-owned requirements cannot be excluded by a coordinator checkbox. NotApplicable needs the relevant source's explicit applicable statement or an authorised source-owner decision; lacking that mechanism means Undetermined. Selection of a different delivery step is an explicit scope change, not a filter.

Membership discovery is server-side and exhaustive for the chosen scope: union the explicit links with native incoming relationships and required native policy rows, de-duplicate by source/criterion identity, and expose unresolved membership. A new matching demand, requirement, dependency or work order invalidates the membership fingerprint even if every previously displayed row is unchanged. Pagination, collapsed groups and filters cannot shorten this discovery set. An adapter that cannot establish complete membership returns Partial or Unavailable; it must never substitute an empty success.

The worklist has one row per visible active Project, showing its **explicitly nominated** next scope. No nominated scope displays “Delivery step not selected”, with an owned setup action; it does not pick the earliest task and infer authority. Other scopes remain accessible from the Project. An inactive scope retains history; a Closed Project refuses new coordination commands while permitted history/original recovery remains available.

## Read model, freshness and deterministic assessment

Every prerequisite has a stable `(scope_id, source_kind, source_id, criterion_key)` key. A Project scope must not merge two distinct criteria merely because they share a source record. The server returns:

| Field group | Required values |
|---|---|
| Identity and coverage | Source UUID/type, criterion key, exact applicable scope, source owner ID, permitted source link, applicability and reason |
| Observation | Native state, native assessment/decision ID if present, source version/revision/hash, `source_observed_at`, `read_at`, validity interval and source policy/adapter version |
| Completeness | Complete / Partial / Unavailable, plus typed condition: Current / Changed / Expired / Missing / Restricted / Unsupported / NotAssessed |
| Coordination | Normalised display state, native explanation, next action/owner/due date, linked Activity/request IDs and unresolved source obligation |

`read_at` is not the evidence date and does not renew evidence. A successful refresh cannot turn captured evidence into reviewed evidence. Review applicability binds scope/membership, exact source versions, reviewed outcomes, policy/calendar versions and relevant time boundary. A promised date becomes overdue in the demand's timezone even without a database update; an induction or reviewed statement can expire. The fingerprint includes the relevant local date/validity boundary. No arbitrary new “30-minute freshness” policy is introduced.

Reads use one repeatable-read database snapshot. Native adapters accept its query client; do not assemble a supposedly consistent review from unrelated HTTP calls. Remote/unsupported sources return explicit unavailable evidence. Commands re-evaluate under the existing workspace mutation lock and current authority before accepting a new intent. A snapshot is historical evidence, not a durable assertion that its sources remain current.

### Row mapping

Use native states verbatim alongside the normalised coordination state. No client may submit a desired Ready value.

| Native evidence | Normalised result |
|---|---|
| Required criterion with an explicit unsatisfied native stop | Blocked; keep source reason and stop authority |
| Supply Approved, complete, usable allocations cover the exact demand | Ready for stated scope, limited to that material scope |
| Supply Approved shortage covered by a Complete SupplierConfirmed promise, quantity at least shortage, date from source-local today through required date inclusive | At risk; still not usable materials or field dispatch permission |
| Estimated, overdue, late, partial or insufficient promise against a complete Approved shortage | Blocked, using the native Supply reducer |
| Forecast Demand, irrespective of quantity/promise | Not assessed; never Approved or Ready |
| Missing/partial applicability or incomplete evidence | Evidence needed; unknown is not zero or NotApplicable |
| A required source cannot be read, is restricted or has no supported adapter | Source unavailable, with a safe explanation; no inferred outcome |
| Changed/expired evidence | Evidence needed with Changed/Expired retained; old Ready is historical only |
| Native exact-scope pass with all required qualifications current | Ready for stated scope; retain conditions and source scope |
| A source's valid PermittedException | Ready for stated scope **with exception recorded**, only for that source criterion and allowed interval; it grants no exception elsewhere |
| Explicit valid source-owned NotApplicable | Not applicable; retain evidence; exclude from Ready denominator |

The [17 October decision](../decisions/unallocated-demand-readiness-proposal.md#current-user-decision) still applies: Supply may show a known shortage while Service's Parts criterion is Unknown for no allocations. Show each in its own context; neither result overwrites the other. Likewise, CS's native unmet criterion remains blocked even when its reason is missing evidence; retain the native stop rather than reclassifying it away.

### Whole-scope summary

Compute assessment over every required row before filters and pagination. Return `primary_state`, `coverage`, explicit unresolved-condition flags, and authorised counts. Deterministic priority:

1. A visible native stop produces Blocked; add “assessment incomplete” when other required evidence is unresolved.
2. With no visible stop, any unavailable/restricted required source produces Source unavailable.
3. Then any missing/partial/changed/expired requirement or undecided applicability produces Evidence needed.
4. Then any required unassessed criterion produces Not assessed.
5. Then any At risk criterion produces At risk.
6. Only a fully enumerated, current scope whose applicable requirements all pass can produce Ready for stated scope. Retain exception/qualification flags. Use this scoped label for the Project aggregate; no unqualified universal Ready or percentage.

A newly created scope with no reviewed applicability is Not assessed. An empty source query is never a pass. If every category is validly NotApplicable, display “No applicable prerequisites — recorded scope”; do not manufacture a green readiness count. Counts are over authorised evidence only and identify Partial visibility. Never disclose hidden identities, amounts, restricted counts, hashes or indirect ordering/totals; a viewer without complete source visibility cannot receive a reassuring aggregate derived from secret rows. Source access loss clears protected cached content, including earlier captured comparisons.

## Responsibilities and capabilities

| Actor | Permitted responsibility | Boundary |
|---|---|---|
| Project reader | See permitted scope/rows/history and safe completeness; follow permitted native links | Reuse [Project visibility](../../src/projects/visibility.ts), including customer/site/internal visibility. `project.read` alone grants no Supply, pack, commercial or source access. |
| Current coordinator with Project edit | Define scope, record a review, prepare impact comparison and submit coordination instructions | All relevant current source reads are required for a fully reviewed movement request. Recording an incomplete assessment is allowed and labelled incomplete; it cannot authorise movement. |
| Named source owner / receiver | Answer their exact instruction, clarify/hold/return it, and act in their native workspace when authorised | Active, visible user; current Project visibility and required destination/source duties. Being assigned is not a grant. A team label cannot replace a named accountable user. |
| Scheduling authority | Create/decide native appointment change requests under `schedule.request`/`schedule.manage` and full native checks | Coordinator's PJ-07 submit never moves or reserves a booking. Accept in native Scheduling has its existing effect. |
| Technical/commercial reviewer | Perform source-owned review under its existing distinct duties and separation rules | A PJ-07 coordination answer never supplies technical issue, variation approval or Finance authority. |

No new capability is selected or granted in this specification. The implementation must demonstrate coverage with existing scoped duties or bring back a narrowly justified capability change. One person may hold several roles, but each item has an attributable response and native separation-of-persons rules continue to apply.

Each submitted payload is built server-side for its named recipient under current source permissions. It includes only entitled evidence and independently permitted safe prerequisite summaries. If redaction would remove evidence required for that person to make the requested decision, the receiver is ineligible for that instruction; do not ask them to approve an opaque full comparison. Retained full comparisons and recipient payload hashes have the same source-based access controls, including original recovery.

An assignment/reassignment requires eligibility at save, expected item version, reason and retained old owner/response. It does not transfer accepted work or consent. Reassignment before completion creates a successor submission to the new receiver. An inactive/revoked owner yields “Owner needs reassignment”; permitted original recovery is checked under current original-command authority, not the newly proposed owner.

## Blocker follow-up and My Work

“Assign follow-up” creates or explicitly links one existing shared Activity for the source criterion and scope; it does not edit the criterion's state. Reuse native Activity kinds and lifecycle; do not introduce an independent PJ task store. An eligible actor also needs native Activity creation/link authority. The operation saves the coordination pointer, Activity/link, event and receipt atomically, or saves none. Use a unique open-follow-up key per scope/criterion/purpose; after a genuinely completed item, a new source version may justify a successor follow-up with retained lineage.

My Work reads that Activity with the normal all-linked-target visibility rule. Use the Project as its native anchor plus a structured companion pointer to scope/criterion; any new target registration belongs to the later build. The Activity contains a safe task summary, not copied protected commercial evidence. Marking it Complete means the person completed their follow-up; readiness is recomputed from the native source. It cannot clear a blocker. If the source still blocks, display “Follow-up complete; source still unresolved”, retain the old Activity and allow an explicit successor. Source resolution does not silently complete an Activity either.

## Impact review and movement requests

### What the Project owns

Projects owns a subordinate **delivery change request** with a stable UUID, immutable proposal revisions, captured impact comparisons, named receiving instructions and outcome links. It owns coordination only. Reuse native Engineering change, commercial variation, Service request and Supply impact IDs where relevant; do not create duplicate native decisions. Display “Delivery change — [step]” plus creation time within its Project. `SYN-CHG-000012` remains a design fixture; this contract registers no CHG business-reference type or counter.

Each proposal states reason, selected scope/version, current and proposed values, affected and explicitly retained records, exact source basis, required receiving owners, intended order/dependencies and qualifications. Record a complete impact manifest, including unchanged-but-dependent records. Unknown applicability or viability cannot be hidden in “3 more rows”. InformationRequired and ImpactReview instructions may be sent while investigating; executable movement instructions require a complete assessed comparison, current evidence, identified owners and compatible intended effects. This does not require the present delivery state to be Ready: the request can address a known blocker.

### Separate facts and state transitions

| Record | Allowed progression / meaning |
|---|---|
| Proposal revision | Draft → Captured. Editing creates a successor Draft and invalidates dependent unexecuted review; captured bytes never change. |
| Captured comparison | Current / Changed / Unavailable, derived from its exact basis. Re-review captures a new comparison, retaining the old one. |
| Coordination item | Prepared → Requested → Received, Held or Returned. A received instruction means accepted responsibility only. Returned/Held keeps owner, reason, next action and date. |
| Corrected item | Same item UUID, next submission number, predecessor payload hash and reason; requires fresh applicable comparison and a new explicit response. Changed recipient/effect cannot inherit consent. |
| Outcome | Awaiting native action / Native request pending / Applied / Reported only / Outcome unknown. Applied requires verified native evidence. No manual “mark applied” override. |
| Cancellation | Coordinator can cancel an unexecuted instruction with reason. Accepted native changes are retained; cancellation never reverses them. Cancel native pending requests using their own command separately. |
| Closure | Coordinator records a final reconciliation of all required item outcomes and current source state. “Closed with unresolved effects” retains each unresolved item/owner; it never means Ready or applied in full. |

Batch submission creates every PJ instruction/Activity pointer and its immutable payload in one local transaction; failure creates none. It performs **no native domain change and no external send**. Destination work then proceeds independently. The batch projection distinguishes Requested, In progress, Partially applied, Outcome unknown, All requested effects evidenced, and Closed with unresolved effects. Unknown is shown prominently even if another item succeeded. All effects evidenced requires every required item to have verified evidence; cancelled/returned/reported-only items cannot be silently counted as success. Completion is not a new readiness assessment.

### Native action and outcome adapters

| Target | Required path and evidence |
|---|---|
| Forecast task dates | Named Project owner opens the native task form and saves under existing rules. Verify exact task IDs, before/after versions, intended dates, dependency retention and native operation receipt; all additional affected owners must have received their instructions. No auto-cascade or baseline write. |
| Confirmed Service booking | Route the instruction to an eligible scheduling owner. They create/use the native change request with exact proposed interval/crew and current native versions. PJ-07 records the typed appointment/request relationship; `ProjectReference` text alone is insufficient. A native Accepted result may already include the booking move; show that actual outcome and its receipt. Never add a second “apply” step that moves it again. |
| No appointment yet | Show a scheduling/intake follow-up. `createChangeRequest` cannot target an unbooked plan; do not fabricate a confirmed appointment to make it callable. |
| Shutdown/access | Owner records/reviews exact CS requirement evidence/work window through native CS controls. Link the requirement revision, reviewed evidence and applicable interval; a customer conversation or Activity completion alone is Reported only. |
| Pack/revised drawing | Source owners prepare/check/issue a successor and obtain required acknowledgement in their native workflows. Link exact release/pack issue IDs, hashes, scope and audience/assignment binding. Existing issue bytes remain retained. |
| Supplier promise / technical / commercial effect | Use the source's existing attributable fact/review/approval commands and exact outcome IDs. No email to a supplier/customer, stock release, technical approval or priced variation is inferred. |

The first receiving increment does not offer a generic “Apply all” command. Where a native adapter cannot verify that an outcome belongs to this instruction, keep Reported only and offer source review; matching dates or a pasted receipt ID are insufficient. Future adapters must correlate exact intent/submission and native operation/result, verify target/company/site, action, actor authority, original/current versions and intended effect, and refuse reused/unrelated outcomes. They may not rewrite the native receipt. Existing scoped material-resolution transactions retain their own atomicity and authorisations; PJ-07 links their results rather than splitting or expanding them.

Before each unexecuted item is acted on, re-read its full dependency set. If one completed sibling changed a shared Project version, a new comparison can explicitly account for **that exact verified effect** and obtain renewed consent where the payload changed. Do not whitelist every version increment because it came from the same batch. Unrelated source drift holds remaining instructions. A native owner may still act through its independently authorised current-state workflow; PJ-07 must reflect that outcome and request reconciliation, not claim a veto it does not enforce.

## Proposed persistence, API and recovery boundary

Logical names below are implementation targets, not a migration reservation or claim of existing tables. Use workspace-scoped composite foreign keys and native records for all referenced entities.

| Proposed relation | Minimum retained facts / constraints |
|---|---|
| `project_readiness_scopes`, `project_readiness_scope_revisions` | Root UUID/Project/context and current version; append-only membership/applicability/next-step revisions, author/reason/time. Unique root/version; no cross-Project or cross-company members. |
| `project_readiness_reviews` | Scope revision, complete manifest and fingerprint, exact source observations/policies/time boundary, normalised result, completeness, actor and original operation. Immutable; no later snapshot replacement. |
| `project_delivery_changes`, `project_delivery_change_revisions` | Root Project/scope UUID; append-only proposal revision, predecessor, intended effects and owners; captured comparison ID/hash. No public CHG identity or duplicate technical/commercial master. |
| `project_delivery_instructions`, `project_delivery_submissions` | Stable item UUID, purpose/target/owner; unique item/submission number; immutable payload/hash/predecessor and expected source versions; native request pointer where supported. One active equivalent instruction per target/purpose/effect and scope; exact retries recover it. |
| `project_delivery_events`, `project_delivery_outcomes` | Append-only receiving/reassignment/cancellation events with expected sequence; exact native operation/result references, before/after basis and verification status. Unique native effect linkage for a given instruction; one effect cannot satisfy two incompatible instructions. |
| Native Activities and operation receipts | Existing lifecycle, visibility and original-operation semantics. Companion links reference these, never duplicate them. No source writes in the PJ batch transaction. |

Mutable heads are projections of retained events, not freely editable statuses. Server and durable constraints must refuse snapshot mutation, invalid sequence/predecessor, foreign tenant/source, forged outcome, duplicate active intent and unauthorised state advance. Preserve existing Project/task version semantics; PJ-only events use their own sequence and do not falsely record a task save. Source-affecting commands continue to advance native versions normally.

Proposed routes use existing `/api/v1` conventions:

| Method and path | Contract |
|---|---|
| GET `/projects/readiness` | Permission-scoped worklist, stable cursor/filter/sort, one nominated scope per Project; no reads implied for hidden sources. |
| GET `/projects/:id/readiness` | Exact selected scope, whole-scope summary, paged authorised rows, applicability, current review and available actions. |
| POST `/projects/:id/readiness/scopes` | Create/revise/nominated-next scope under current coordinator authority; bind observed Project and scope versions. |
| POST `/projects/:id/readiness/reviews` | Record exact server-recomputed assessment with expected scope/version/fingerprint; permit explicit incomplete historical review. |
| POST `/projects/:id/readiness/follow-ups` | Create/link/reassign one source follow-up under native Activity authority, with expected versions and reason. |
| POST `/projects/:id/delivery-changes` | Create a root or append proposal/capture; observed Project/scope/change versions and exact source basis. |
| GET `/projects/:id/delivery-changes/:changeId/preview` | Current complete impact comparison, proposed instruction payloads, safe source conditions and confirmation hash. No mutations. |
| POST `/projects/:id/delivery-changes/:changeId/submit` | Exact preview/comparison hash and proposed item IDs; atomic coordination-only batch. |
| POST `/projects/:id/delivery-changes/:changeId/instructions/:itemId/receive` | Named owner records Received/Held/Returned for exact submission/hash/sequence; required reason and follow-up on Held/Returned. |
| POST `/projects/:id/delivery-changes/:changeId/instructions/:itemId/resubmit` | Coordinator submits an explicit correction under the same item identity; exact predecessor and new reviewed payload. |
| POST `/projects/:id/delivery-changes/:changeId/instructions/:itemId/outcomes` | Server verifies a typed native outcome; an unsupported link can record only Reported evidence, clearly labelled. |
| POST `/projects/:id/delivery-changes/:changeId/close` | Reasoned cancellation/final reconciliation with expected sequence and explicit unresolved items; never a target undo. |

All mutating endpoints use the existing operation envelope: actor-bound `operation_id`, `schema_version: 1`, reason, exact expected versions/sequences, and explicit `synthetic_only: true`. Reject unknown fields and client-supplied actor/time/state/permissions. Require UUIDs, strict dates/instants with site timezone, nonempty trimmed reasons (1–1000 characters) and evidence/next-action narratives (1–4000); retain exact units and source quantity strings without conversion. Bound request JSON to 64 KiB. Proposed first-slice limits: 100 selected tasks, 500 discovered prerequisites per scope, 50 instructions per batch, page sizes 1–100. An exceeded discovery bound is explicit Incomplete and holds submission; never truncate to a falsely complete result. These are proposed implementation limits, not business policy.

The same operation and canonical payload recover one original result after later changes, subject to current original-command/source authority. Changed content with the same operation is a conflict. An inconclusive lookup stays Outcome unknown; offer only the existing exact-intent recovery/retry protocol. Never generate replacement IDs while the original may exist. Before any retry, distinguish an unsent original from a committed/lost response. Permission loss withholds protected receipts; it does not erase or replay them. A partial set of independently committed native outcomes is retained and reconciled, never rolled back by cancelling the coordination batch.

## Navigation and design receiving contract

Implement the existing reserved Projects rail item as `/projects/readiness`, with exact static-route matching before generic Project-ID handling. Keep the accepted Project Overview/Schedule/default-tab behaviour. Add Readiness as the explicit later tab permitted by the [accepted Project record](../decisions/project-record-page-design.md#7-not-decided); this new tab still needs its own accepted layout. Proposed deep link: `/projects/:id?view=readiness&scope=:scopeId`, with change/item selection as validated UUID query fields. It must not overwrite the Project's nominated scope merely because someone opens a different one.

Worklist, Project tab and My Work open the same identities and assessment. Preserve permitted view/filter/selected scope and a safe return token for source drill-down; accept only known internal return destinations, never arbitrary redirect URLs. A source change on return shows a comparison; it cannot silently replace a captured review or discard a draft. Denied sources have safe explanations, not working-looking links or empty lists. Keep PJ-09 `/projects/acceptance/readiness` visibly distinct from delivery-step readiness.

All users can inspect every authorised impact before submitting. At 320/390px, render all labelled impact cards or a clearly actionable complete-review step; a summary of omitted rows is insufficient. Counts describe assessed scope separately from displayed rows. Long source references, owners, reason fields, dates and unknowns must wrap. Mobile inputs use 16px text and reachable shared targets, scrolling and safe-area spacing. Date-only comparison is in calendar days by default: 19 November to 2 December 2026 is **+13 calendar days**. If showing working-day variance, name the exact calendar revision and honour working-day exceptions; a generic weekday count cannot replace it.

## Acceptance examples and implementation sequence

These are specifications for future tests, not executed application proof.

| ID | Setup / action | Required observable result |
|---|---|---|
| PJ07-01 | Ready visible rows; one hidden required source; filter to ready rows | Partial visibility remains; no complete/Ready aggregate, hidden counts or evidence leak. |
| PJ07-02 | Empty or all-paged-away demand query / newly linked demand | Empty is not Ready; full membership is assessed and a new relevant link invalidates the review. |
| PJ07-03 | Approved demand 10 EA, usable allocation 6, complete confirmed promise 4 due today and required today | Supply At risk; no physical readiness or field-dispatch permission. Estimated/overdue promise gives Blocked. |
| PJ07-04 | Same unallocated Approved demand appears in Supply and a visit | Supply shortage and Service Unknown remain separately labelled; no silent rule unification. |
| PJ07-05 | Forecast demand fully covered | Not assessed remains; conversion is not demand approval. |
| PJ07-06 | Blocker Activity completed without source change | Activity complete, blocker unchanged; no green state or automatic replacement Activity. |
| PJ07-07 | Captured review; requirement/promise/calendar changes or evidence expires before submit | Changed/Expired shown; old comparison retained, stale submit refused without partial requests. |
| PJ07-08 | Batch submit fails late / response lost after commit / exact duplicate | Respectively zero effects / one recoverable batch / original batch, with no target movement. |
| PJ07-09 | Coordinator has Project edit but no scheduling authority | Can route an eligible coordination instruction; cannot directly create a ProjectReference scheduling request or accept/move it. |
| PJ07-10 | Service accepts native request, another owner returns their instruction | Booking outcome shown once, batch Partially applied/Returned; no automatic rollback or second move. |
| PJ07-11 | Source outcome resembles intended dates but has unrelated receipt/identity | Not Applied; exact correlation required. Revoked user cannot recover protected outcome. |
| PJ07-12 | One sibling completes; unrelated source changes; remaining item is retried | Exact completed effect retained; unrelated drift holds the remaining item until renewed review. |
| PJ07-13 | Native Service request's original schedule differs, current PL-04 checks pass | Preserve native current-state decision semantics; PJ-07 records actual outcome and renewed comparison, not a new unconditional veto. |
| PJ07-14 | Current date 25 Nov versus baseline 19 Nov; proposed 2 Dec | +6 and +13 calendar days; separately labelled working-day result uses exact calendar/exceptions. |
| PJ07-15 | Customer calendar permits Saturday but shutdown evidence is absent / visitor identity unknown | Calendar warning and CS access/approval remain separate; no implied shutdown/induction pass. |
| PJ07-16 | No new cost effect, but required commercial release obligation is unresolved | Commercial prerequisite remains visible to authorised users and unresolved in scope. |
| PJ07-17 | Desktop/tablet/390/320, long values, filtering and source drill-down | Same complete assessed scope, every impact reachable, retained return state, no clipped action or unreviewed scope substitution. |
| PJ07-18 | Close/reopen Project, race/reassign/decline; application/database restart and historical upgrade | Current authority, lifecycle, exact originals and retained ledgers survive; independent domain outcomes remain distinct. |

Build in bounded increments after review: (1) source adapters and read-only scope/completeness projection, (2) durable scope/review and source-linked follow-up, (3) captured impact and coordination-only receiving, (4) each verifiable native outcome adapter, (5) accepted Figma UI and full source/application comparison. Any newly introduced migration is reserved in that build PR and receives the repository's complete historical-upgrade/ledger checks. Each increment declares unsupported adapters and cannot display an enabled promise of missing functionality.

Before implementation, review the proposed reducer, scope applicability, Project-owned subordinate request identity, recipient authority, limits and per-domain correlation with Dean. The instruction to prepare this specification does not substitute for visual baseline acceptance. PR #698 owns Project-record implementation and PR #690 owns field-readiness P4/P5; sequence integrations against their actual merged contracts. Preserve r01/r02-named issued bytes and the r02 discrepancy; this specification is a new native contract, not a recovered r02 source.
