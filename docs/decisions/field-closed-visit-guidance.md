# Closed-visit arrival and separate-visit entry guidance

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Decision: bounded synthetic implementation authorised 3 October 2026. Independent owner, physical-device, screen-reader and visual acceptance remain pending. Existing FI-01/FI-02/FI-05 scopes, SC-05/08/09/10, SVC-02/03/05/06/07/08/10/11 and NFR-01/07/09 remain unchanged.

## Starting evidence and gap

Refreshed main is FI-07 merge 8eeb0ffe0f8f760611caf64e501649f564940a5e. PR #336 merged at 2026-10-02T23:02:09Z (3 October in Sydney); all 22 checks passed on b3119b2721352d3ea7cca99e0d087b9696fa544c. No open PR existed at preflight. An isolated codex/field-closed-visit worktree preserves the original checkout, other worktrees, databases and evidence.

| Implemented | Proposed in this increment | Missing / outside this increment |
|---|---|---|
| P07 personal immutable arrival/evidence; FI-01 durable timer; P09 submission, separate internal attendance acceptance and exact reports; FI-07 response lineage | Actor-specific closed/pre-arrival guidance on My Jobs and job detail, including the timer host | Reopening accepted attendance, another arrival on the old visit or inheriting responses/acknowledgements |
| Existing work-order ProposeVisit, readiness assessments, appointment contact/booking, packs and separate second attendance | Contextual navigation to those same destinations, actual preparation/status and explicit limits on related visits | General return lineage, ReturnRequired appointment state, Superseded appointment state, all SV-06/SV-07 orchestration |
| Completed-return and Scheduling Step 6 persisted journeys with independent Finance outcomes | Fresh bounded compiled/persistence proof plus unchanged retained evidence | Full PT-30 owner demonstration, prior-case closure, benefit measurement and human acceptance |

Read current source, live PostgreSQL schema after all registered migrations through 0057, current scope/route guides and P07/P08/P09 contracts. The present StartPanel chooses generic arrival instructions solely from absence of the actor's attendance. The timer host repeats arrival instructions when authority is not Current. My Jobs similarly treats absence of personal start as preparation. This is misleading after CompletedPendingReview/Completed. Existing authority() accepts only Confirmed/InProgress for a new start; sharedOperation reauthorises before receipt recovery, and database transition guards prevent rewriting a started appointment.

## State and action matrix

These are projections of facts, not new stored lifecycle states. Unknown or failed sources never become clear authority.

| Actual source | Viewer without own attendance | Viewer with retained own attendance |
|---|---|---|
| Proposed | Not yet booked; no arrival action. Review existing preparation/booking in the receiving record if accessible | Unexpected combination: retain factual identity; no new arrival or inferred authority |
| Confirmed | Review exact pack/personal acknowledgement and current start blockers; arrival only with current field.start.own | Show personal attendance identity/captured/received times; never another arrival |
| InProgress | Another crew member's start is not yours; own arrival requires every current guard and fresh versions | Show own facts and independent timer state; current authority alone permits start/resume |
| CompletedPendingReview | Closed to new arrivals; factual completion awaits internal Service review. No arrival or old-pack acknowledgement invitation | Retain own arrival and report state; an already-started crew member can finish their own evidence under existing P09/FI-01 guards; no reopening or blanket claim every attendance is accepted |
| Completed | Closed to new arrivals; further physical attendance needs a separate visit | Show retained start, fixed accepted end where present, personal report state and stopped/frozen timer history; report corrections remain factual successors only |
| Cancelled | Cancelled; no arrival; review another permitted visit | Preserve any retained facts, refuse new arrival; normal controlled cancellation already refuses started work |
| Unknown/unavailable state | Cannot establish arrival authority; refresh/escalate through permitted context | Facts are history; no inferred permission |

Stopped time is not submitted evidence. Submitted/Returned/Draft/Reviewed/Issued are report states, distinct from appointment status. The immutable attendance_acceptances row fixes accepted end and internal Service acceptance, including after report correction. Customer AttendanceFacts acknowledgement and ReportContent response remain separate FI-07 facts. They do not close another attendance, clear incident/inspection/policy holds, complete an Activity or approve billing.

## Receiving relationship and navigation

The live schema has no general parent-return or predecessor-replacement foreign key for appointments. General return intent is recorded by existing owned remaining-work/response Activities and explicit Service preparation. ReturnRequired is conceptual blueprint language, not an available appointment state. Do not manufacture a relationship from a name, date, common scope or work order. Scheduling policy resolutions have an exact replacement_id for their own Replaced disposition; it is not general return lineage.

Use the authoritative work_order_id/company/site relationship to show **Other visits on this work order**, explicitly stating that Service must establish suitability for the outstanding work. Do not label a particular row “the return”, “replacement”, “ready to attend” or “next visit” from inference. Show only currently readable destination records, bounded to the same exact workspace/company/site/order, excluding the original. A matching scope is context, never work authority; stale/different scope is explicitly review-required. No inaccessible count, hidden identifier, incident detail or staff note is returned. A denied optional destination is omitted; a failed source fails the read rather than showing an empty clear state.

| Receiving fact | Guidance / permitted action |
|---|---|
| No accessible alternative | Say no other accessible visit is shown; no claim that none exists. Open permitted work-order visits to review or prepare; otherwise ask the Service owner. Never create on navigation |
| Proposed + Unknown/Blocked preparation | Preparation incomplete. Existing appointment/work-order destinations own review. Unknown cannot be converted to Preparing by a readiness assessment: controlled cancellation plus an explicit new proposal retains the predecessor |
| Proposed + Preparing | Preparation recorded; still requires readiness, customer agreement, suitable available crew and Scheduling acceptance. Reuse the appropriate existing proposal rather than duplicating it |
| Confirmed | Booking accepted, not arrival authority. Open appointment; assigned viewer may open their field job and exact current pack |
| InProgress | Separate attendance underway; current assigned reader may inspect their own job; no inherited personal start |
| CompletedPendingReview/Completed/Cancelled | Retained history; no new arrival on that record |

Technicians retain current scoped schedule/work-order reads where already granted, with My Jobs links only after current assignment/field-read checks. Service preparation needs service.work_order.edit; readiness assessment, schedule.manage, schedule.contact and pack duties stay distinct. Read-only users receive navigation/context only. Service owners/coordinators use existing work-order and appointment hosts, without new field permissions. Opening any link is a read, never approval or permission to work.

Use existing projections, command guards and the existing booking session journal for the work-order visit-proposal entry. Preserve unsaved input, saving, saved, definite refusal, stale-version comparison and exact original recovery after a lost response/reload. One pending original blocks a fresh proposal; accepted receipt links to its allocated appointment. Do not automatically cancel, replace, confirm, assign or duplicate. Do not introduce schema, capabilities, grants, seeds, templates, routes, dependencies or another workflow/offline protocol.

## Currentness, offline and domain boundaries

Server reads recheck current membership, company/site/order, appointment and exact assignment; optional navigation checks the receiving reader as well. New arrival additionally rechecks field.start.own, scope, readiness, competency, policy, current exact issued bytes and personal acknowledgements. UI state is advisory. Refresh/loading/error/identity lock must not leave stale actionable navigation labelled current. Preserve correctable input and pending operations when a read fails; do not destroy an uncertain accepted original to hide an action.

P08 downloads retain their owner-bound cached timestamp and original authority. Cached closed status may explain the record but cannot establish current permission. Delayed Start is revalidated and refused after closure; already accepted originals recover only their original receipt. Timer/evidence originals keep the old appointment, actor, payload/hash and dependency chain; no rebasing to another visit or conversion of evidence into arrival. Existing restricted recovery retains rejected/review-required originals. Preparation, scheduling, inspection/incident receiving actions, review and issue remain online only. FI-07 exact presentations/responses and legacy P08 originals remain compatible.

Incoming: current Scheduling/assignment, authorised work scope, Job Pack, FI-05, personal P07 evidence, FI-01 timer, P09 completion/acceptance and permitted retained history. Outgoing: existing work-order proposed visits, appointment preparation/contact/booking, exact fresh pack/personal acknowledgement, separate arrival/evidence/report/review. Owned Activities/My Work, inspections/defects/retests, incidents, customer response and Finance keep independent authority and outcomes. No old mark, response, technical acceptance, pack acknowledgement or Finance result transfers.

## Design and verification

FI-01 uses r20 Register / worklist at My Jobs and Record detail at the job; SC-05/08 retain Record detail. Existing shell and main content scroll, PageHeader, Stamp, Status, ReadState/ErrorNotice, shared Button/ButtonLink and booking recovery remain. Accepted timer r05 bytes and geometry are unchanged; adapting its host guidance for closed/personal states is proposed for review. No accepted native closed-visit or return-entry mockup exists. Keep missing references and review states explicit in the live register.

[Acceptance matrix](../testing/field-closed-visit-acceptance.md) separates fresh proof, retained evidence and human checks. Verify desktop 1440/1024, phone 390/320, actual 200% browser zoom, keyboard/focus, original recovery, direct URLs, permissions and stale sources. Use task-owned ppo_synthetic_test clusters and preserve originals through an actual compiled-app/PostgreSQL restart. Keep the guarded job-owned lock setting, separate compiled HTTP/restart lane, assertion deadlines and performance targets unchanged. No merge or deployment.
