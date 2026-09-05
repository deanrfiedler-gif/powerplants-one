# Powerplants One — P05 Planner and Controlled Changes

Copy the task below into the next implementation session after P04 publication has been verified. This file prepares P05; it does not start P05 or grant execution authority in the P04 session.

---

Act as a senior full-stack developer, software architect, product designer, business analyst and quality engineer. Implement **P05 — Planner and controlled changes** for **Powerplants One (PPO)**, Dean Fiedler's personal private prototype for Powerplants Australia.

Carry the work through to a verified, reviewable outcome and durable repository handover. Complete the bounded P05 increment, prepare P06, then stop.

## 1. Objective and authority

Build on verified P01–P04. Deliver SC-07/SC-08 scheduling/planner work: controlled appointment confirmation, crew/resource reservation, day/week views, accessible moves, scheduling change requests, readiness/contact consequences and controlled cancellation.

I authorise necessary local implementation/dependencies, one focused P05 issue, dedicated branch, additive PostgreSQL migrations/fixtures, domain/API/UI changes, automated/manual visual checks, documentation/traceability, commits, PR and normal merge after actual required checks/review. Use synthetic data only.

Do not change repository visibility, membership, access controls, branch rules or paid services. This is not production hosting, live ERP/SharePoint integration, operational migration, customer communication, P06 pack issue or later P07–P12 authority. Make reasonable reversible choices; ask only for a consequential unresolved policy decision or genuine access restriction, after completing useful preparation.

## 2. Verify the maintained baseline

Repository: `https://github.com/deanrfiedler-gif/powerplants-one`.

P04 is tracked in issue **#26**, PR **#27**, branch `feature/p04-work-scope-readiness`. Read the exact final head/tree, merge SHA/tree and merged-main results from the current publication record and `docs/delivery/p04-handover.md`. Do not assume a prepared prompt proves successful merge.

Before editing, verify connector access, private visibility, current user permissions, main HEAD/tree, P04 issue/PR state, later commits and any existing P05 branch/issue/PR. Inspect the working tree and preserve unrelated work. If P04 is incomplete, resolve or explicitly identify that dependency before claiming P05 is ready. Reconcile newer maintained state against this prompt.

P01–P04 component delivery is distinct from full PP-01 acceptance. All full PT/AT remain incomplete unless exact later evidence proves otherwise.

## 3. Required source review

Read current AGENTS.md, README.md, docs/STATUS.md, PPO-STD-001, P04 handover/ADR-0009, ordered prototype plan, BP-02 and BP-07, service dictionary/API, acceptance catalogue, relevant source/decision/traceability registers and existing SQL/domain/permission/receipt/audit/outbox/seed implementations.

Concentrate on SC-07/SC-08, TR-03/TR-08/TR-16, DAT-06, API-R04/API-C04–07, EVT scheduling/change consequences, SR-05/SR-06/SR-07/SR-19/SR-20, VAL-05/06/07/08/21/22 and PT-08/PT-09/PT-10/PT-26 components. Read PT-04 readiness overlap and later P06 prerequisites to avoid circular gates.

Preserve issued source bytes and all 78 parent identities. Current user decisions and maintained amendments override older assumptions. Record material contract/architecture changes through the repository decision process.

## 4. Preserve P04 controls

P04 uses distinct current and authorised scope pointers. A successor Draft is not extra work authority. Approved scope, plan/evidence, authorisation actor/time, exact source snapshot/hash, coverage position and policy/readiness records remain immutable.

Appointments created in P04 are **Proposed** immutable intent with exact scope/content/policy references, UTC interval/site timezone/customer window and Unknown/Proposed commitment. They reserve nothing and retain dispatch hold. Additive P05 migration must preserve their IDs/references, original proposal provenance and receipts while introducing controlled commands. Never make all old proposals Confirmed or Ready in migration/seed.

P04 Authorisation readiness is scope-based. Booking/Dispatch criteria attach to a proposed appointment; actual crew competency and dispatch controls deliberately cannot clear in P04. Evolve those guards only through real typed resource/evidence support. Existing non-waivable controls and policy-controlled exception semantics remain authoritative. A tool collection plan cannot override competency, site access, isolation or shutdown authority.

Coverage is independent of billability/charging/warranty/supplier recovery. No planner operation creates a financial disposition. ReviewRequired asset configuration is not verified evidence. Unresolved equipment remains limited to exact authorised identification scope. P03 known-site intake remains in force.

## 5. Typed resources and policy

Implement the bounded DAT-06 resource/calendar/skill/availability/assignment/reservation entities needed for the synthetic planner. Use explicit UUIDs, workspace/company/site context, versions, effective dates, source-as-at/evidence and active states. Reuse applicable capability plus record scope; role labels or Systems access are insufficient.

Model fictional technicians, published working calendars/timezones, working intervals/exceptions, leave/unavailable/other-work blocks, base timezone, skill/competency codes and reviewed synthetic evidence with validity through visit end. Do not invent real trade approvals, roster rules, overtime policy, travel speeds or employee assignments.

Travel-before/after buffers must be explicit, nonnegative and included in reservations. A zero buffer is an explicit policy/proposal choice, not a silent default. If a consequential real rule remains unknown, use a clearly labelled conservative synthetic fixture/policy and record the limitation; ask only if no coherent bounded synthetic rule can preserve the control.

Published policy versions are immutable. Do not add an unrestricted no-code rules editor or client-submitted exception permission.

## 6. Appointment confirmation — TR-03

Implement Proposed → Confirmed only through the authoritative domain service/API-C04. Re-evaluate:

- applicable capability and record scope;
- expected appointment/work-order/scope/policy versions;
- current authorised scope and unresolved successor impact;
- site/timezone, valid interval and customer window;
- explicit crew roles/resources and active eligibility;
- skill/competency evidence through visit end;
- calendar/leave/unavailable blocks;
- explicit travel buffers and all resource conflicts;
- applicable booking readiness/preparation plan;
- current customer commitment/contact requirements defined by the maintained contract.

Reserve the full crew atomically using real PostgreSQL constraints and a consistent locking order. Use half-open intervals and enforce non-overlap across different appointments, not only expected versions on one record. No partial crew booking can commit.

Creating/proposing an appointment never reserves a resource. A project-originated request is not confirmed scheduling authority. Failure retains the original proposal/booking with precise permitted conflict details and user input. Urgent priority bypasses nothing.

Successful confirmation atomically records appointment/assignment versions, reservations, evidence/policy snapshots, audit, operation receipt and durable synthetic consequences. Identical retry must not double-book; changed operation reuse and stale proposals must be rejected. Reconcile uncertain accepted outcomes through original receipt recovery.

## 7. Planner experience — SC-07/SC-08

Deliver professional responsive day/week coordination views using current navy/green shell, Australian English, explicit site/display timezone and synthetic context. Show proposed versus confirmed distinctly, crew, site, scope/readiness/holds and next permitted actions.

Provide readable resource lanes, date navigation, bounded scoped data loading, meaningful filters, empty/error states, conflict feedback and observed/version context. Failed reads must not imply everyone is free.

Support drag-and-drop movement where useful, with a fully equivalent keyboard-accessible action/form. Dragging is a proposal until the server accepts it. Clearly show pending/rejected movement and preserve the original confirmed location on failure. Do not make colour the only status cue. Inspect desktop and phone views, visible focus, long content and touch/reflow.

Show the exact appointment and work-order identities; do not collapse requests/orders/visits into a generic job state. A confirmed appointment is not dispatched attendance or customer acknowledgement.

## 8. Controlled changes — TR-08 / API-C05–06

Implement expected-version moves/reassignment through the same confirmation guards, all-or-nothing reservation replacement and explicit change reason. Use deterministic resource lock order when old/new crews differ. Two simultaneous changes cannot overbook; failed move leaves original reservations and authority intact.

Implement typed ScheduleChangeRequest for manual/project-reference/technician-originated proposals. Pending request alone changes no booking. Accept/reject/cancel request states need explicit current authority, reasons, audit and idempotent receipts.

Any confirmed date/time/crew change records the current contract's preparation/pack-review/dispatch-hold consequence. P06 packs do not exist yet: represent the required consequence honestly without fabricating pack records, issues or acknowledgements. Do not clear a dispatch hold merely because the booking changed successfully.

When source resource/calendar/skill/availability data can be changed within P05, those commands must participate in the same locking and future-booking impact checks. Protect existing bookings from becoming silently invalid through a second mutation path.

## 9. Contact and customer consequences

Implement only the minimum typed ContactOutcome/owned follow-up needed by the maintained scheduling contract, with actual foreign-key and scope support. Recorded manual/simulated contact is distinct from sending, delivery and customer acknowledgement. No email/SMS is sent.

Changed dates or failed/no-response contact must remain owned and visible. Do not invent an appointment commitment from a contact attempt. Extend ActivityLink to WorkOrder/Appointment only if fully typed and independently permission-checked; do not enable Report/Handoff prematurely.

## 10. Controlled cancellation — TR-16

Implement bounded Proposed/Confirmed → Cancelled with required reason, permission/version checks, customer/resource/hold consequences and atomic release of future reservations. Preserve proposal/confirmation history and receipts. No hard deletion.

Actual-work checks must remain a hard gate; P07 field capture is unimplemented, so do not fabricate actual work. Preserve a clean contract and challenge the refusal using appropriate component fixtures if the maintained dictionary requires it. Cancellation never erases issued/document/financial effects once those later exist.

## 11. Data/API/security requirements

Continue Next.js/TypeScript/PostgreSQL/domain services, server-derived identity, expected versions, atomic operations/audit/outbox and replaceable adapters. Read routes and selectors apply the same record scope as commands.

Enumerate every new/changed endpoint and field in the API amendment. Narrow validators reject unlisted fields, client actor/workspace/audit/approval data, invalid enums, inaccessible resources and wrong company/site references. Reuse current error envelopes and same-404 semantics.

Use additive forward migrations. Preserve applied SQL checksums, all identities/references/counters, accepted operation hashes/receipts, audit/outbox, history and deliberate edits/revocations. Provide versioned non-destructive seed covering valid/blocked/conflicting/stale/move/cancel/crew/contact cases. No in-memory persistence.

## 12. Verification

Run all three maintained Python checks, npm run check, real PostgreSQL migrations/upgrade/repeat seed/reset/restart, HTTP and browser suites. Retain earlier component tests and adjust obsolete boundary assertions only with explicit replacement checks preserving their business meaning.

Challenge simultaneous same-appointment changes, different-appointment overlap, multi-resource conflicts, travel buffers, half-open adjacency, calendar/leave/skill expiry, wrong site/company, missing capability, Systems/technician authority, direct ID/filter/selector traversal, stale scope/policy, mandatory versus permitted readiness, urgent priority, identical retry/changed operation, and injected business/reservation/audit/receipt/outbox rollback.

Verify moves leave original reservations intact on failure, project requests never auto-confirm, cancellation releases future reservations once while preserving evidence, and contact attempts do not imply acknowledgement. Validate new resource/calendar/availability mutation paths against existing bookings.

Exercise SC-07/08 desktop/phone, day/week, drag/drop and keyboard alternatives, confirmation/refusal/conflict/uncertain-retry, empty/error/long-content, contact and cancelled states. Inspect actual screenshots manually; preserve original PNGs plus exact source/run/hash provenance as in P04.

PT-08/09/10/26 are component obligations. Mark a full procedure Passed only if every stated precondition and step exists and was executed. PP-01 is incomplete until the later integrated acceptance packages.

## 13. Publication and durable handover

Create one focused P05 implementation issue and dedicated branch after checking none exists. Keep commits reviewable. PR explains business outcome, scope/exclusions, decisions, migrations/compatibility, capabilities, relevant IDs, tests/evidence, limitations and P06 boundary.

Recheck current branch/check/review/thread requirements before normal merge; resolve defects without bypassing controls. After merge verify exact main SHA/tree and merged-main checks. Update STATUS, implementation plan, BP-07/architecture status, dictionary/API, ADR/registers/traceability and `docs/delivery/p05-handover.md`.

Record starting/final/merge SHA/tree, issue/PR, exact runtime/dependency versions, migration/seed, run/reset/recovery commands, actual counts/results and material failed runs/disposition, screenshot provenance/manual inspection, review state, operational limitations and deferred work. Distinguish implemented, component-verified, independently reviewed, accepted and production-ready.

## 14. Stop after P05

Do not build P06 packs/issue/distribution/crew acknowledgement, P07 field capture, P08 offline queue, P09 reports/customer response, P10 Finance or live integrations/hosting. Preserve Pipedrive/Smartsheet/MYOB/SharePoint/native CAD authority.

Finish with a concise outcome/repository/verification/decisions/limitations handover and prepare **P06 — Job-pack generation, issue and acknowledgement** from the maintained plan. Do not start P06. The target is a complete verified P05 increment, not premature downstream work.
