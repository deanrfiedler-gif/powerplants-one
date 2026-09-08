# PP-01 — Synthetic acceptance pack

**Edition:** v01 · **Status:** 30 authored procedure definitions. Their Not run defaults are not an execution ledger; actual results are recorded separately in delivery handovers and exact run evidence. P07 supplies the real PT-06 integrated sequence. No synthetic test proves a live source-system integration or operational policy.

[Package](../prototype/README.md) · [Implementation plan](../delivery/prototype-implementation-plan.md) · [Machine-readable cases](prototype-scenarios.json).

Current execution sources: [P09 full PT-06/PT-15/PT-16](../delivery/p09-handover.md), [P10 full PT-17/PT-19/PT-20/PT-21](../delivery/p10-handover.md), and [P11 integrated quality and explicit remaining limits](../delivery/p11-handover.md). The authored definitions and all thirty identities below remain unchanged; a later component result does not erase an earlier verified full status or confer a new one.

## 1. Test environment and evidence

Use an isolated database, synthetic file store, simulated source adapters and independent test sessions. Record commit, dependency versions, environment, seed revision, browser/device/network, actor/grants, UTC start/end, expected versus observed result, screenshots/outputs where relevant, database/API evidence, defect IDs and reviewer. Redact confidential diagnostics. A pass requires the specified outcome, not merely an HTTP 200 or attractive screenshot.

Status choices for future results: Not run, Passed, Failed, Blocked, Not applicable with approved scope reason. Keep the authored case catalogue separate from execution results. Any operational pilot requires its own approved cohort/data/source evidence and cannot inherit a synthetic Passed label.

## 2. Deterministic fixture contract

| Fixture | Required contents |
|---|---|
| SYN-W01 | One private workspace, no external customer access |
| SYN-C01/SYN-C02 | Two fictional ERP companies; same-name customer accounts with different company/account keys; no real ERP IDs |
| SYN-Q01 | Fictional greenhouse site in Australia/Brisbane with access window, current operator/contact and synthetic control checklist |
| SYN-V01 | Second fictional site in Australia/Melbourne to test daylight-saving offset handling; no real address/contact |
| SYN-A01/SYN-A02 | Verified synthetic irrigation-control asset and unresolved-serial asset; configuration revision and replacement/move history |
| SYN-T01/SYN-T02/SYN-T03 | Fictional technicians with distinct skills/calendars; include expiring competency and leave conflict |
| SYN-H01 | Prior report with intermittent sensor symptom, unsuccessful cable replacement and owned OEM query; suspected cause labelled |
| SYN-WO-001 | Inspection-only work with two scope items, two assets, two-person first visit and return-visit path |
| SYN-D01 | Synthetic technical instruction with versions 1/2; controlled pack/report/Finance templates; restricted internal notes |
| SYN-F01–SYN-F07 | Finance fixtures in the minimum Finance contract; all fictional amounts/target references |
| SYN-POL-01 | Explicit test policy: 15-minute planner grid; manually supplied travel buffers; non-waivable mandatory control; no automated messages |
| SYN-OFF-01 | Two downloaded jobs; simulated 24-hour expiry; injected quota, network, duplicate, stale-assignment and unsupported-schema failures |

Use fixed seed IDs/timestamps and a documented adjustable test clock. Validate Australia/Melbourne offset transitions against the installed timezone database at implementation; avoid inventing a daylight-saving date. Relative tests derive from the test clock rather than wall time. SYN references are fixture labels, not company opportunity or programme numbers.

Test quantities: 90 MIN labour and 2 EA material. Finance amounts and expected balances are independently specified in the Finance contract. No live customer contact details, source exports, passwords or real asset-control parameters belong in fixtures.

## 3. Procedure catalogue

### PT-01 — Server permissions and information isolation

**Parent:** AT-01 · **Build:** P02, P11 · **Status:** Not run

**Preconditions:** Coordinator, technician, Finance and Systems test identities; two company/site scopes.

**Procedure:** Read an assigned site as technician; request another site directly; request Finance data, search suggestions, document preview/export and notification payloads; repeat as Systems without business grants.

**Expected result:** Assigned context succeeds; unauthorised APIs/files/exports/search/notifications reveal no restricted fields or record titles. Systems cannot approve service or Finance by default.

**Evidence:** API responses, role-grant fixture and negative access assertions.

### PT-02 — Same-name account mapping

**Parent:** AT-02, AT-30 · **Build:** P02, P03 · **Status:** Not run

**Preconditions:** Two SYN companies each contain a customer called SYN Greenhouse Demonstration with distinct external IDs.

**Procedure:** Create work against site Q01; propose the other-company debtor; submit a handoff without verified mapping; then choose the correct explicit mapping.

**Expected result:** Ambiguous/wrong-company mapping cannot authorise financial release; correct connection/company/customer tuple is retained in source snapshot and every target mapping.

**Evidence:** Mapping records, refusal code VAL-01 and accepted tuple.

### PT-03 — Unknown equipment identity

**Parent:** AT-30 · **Build:** P02, P03 · **Status:** Not run

**Preconditions:** Asset SYN-A02 has no verified serial; another asset has a similar description.

**Procedure:** Attempt asset-specific scope authorisation; add an identification plan with reviewer/method/limits; authorise bounded identification work; later verify the asset.

**Expected result:** First attempt blocks with VAL-02. Approved identification plan permits only its scope. Serial is never guessed; later verification preserves original visit-time uncertainty.

**Evidence:** Before/after scope versions, identification plan and audit.

### PT-04 — Incomplete intake and readiness refusal

**Parent:** AT-06 · **Build:** P03, P04 · **Status:** Not run

**Preconditions:** Ticket missing access/control evidence; urgent priority; policy marks mandatory site control as non-waivable.

**Procedure:** Save incomplete ticket; attempt authorisation/dispatch; try a generic override; supply reviewed required context and permitted preparation evidence.

**Expected result:** Draft is saved with owner. Missing stage fields are listed. Urgent flag or general override cannot waive the mandatory control. Only valid evidence permits progression.

**Evidence:** Field-level errors, readiness assessments and policy version.

### PT-05 — Scope and coverage authority

**Parent:** AT-06, AT-33 · **Build:** P04 · **Status:** Not run

**Preconditions:** Inspection-only approved scope; disputed coverage; technician proposes a shutdown/extra task.

**Procedure:** Record the extra-work request; try to change approved scope in place; create a reviewed successor with explicit permitted conditions; inspect financial treatment.

**Expected result:** Original scope remains exact. Technician cannot approve extra work. Coverage dispute remains separate from billing/supplier recovery; no automatic free work or invoice.

**Evidence:** Scope hashes, approval event, rejected command and unresolved Finance decision.

### PT-06 — Complete pack issue and crew acknowledgement

**Parent:** AT-07, AT-36 · **Build:** P06, P07 · **Catalogue default:** Not run; see [P07 execution evidence](../delivery/p07-handover.md#acceptance-boundaries-and-next-task)

**Preconditions:** Confirmed two-person appointment; checked nine-section pack and exact technical sources.

**Procedure:** Request issue; pause renderer; complete durable storage; acknowledge as first technician; try start; acknowledge as second; re-evaluate readiness and start.

**Expected result:** Queued generation is not Issued. Exactly one durable issue is created. First acknowledgement does not cover the second recipient; start blocks until all required conditions pass.

**Evidence:** Output/manifest hashes, recipient events and start guard result.

### PT-07 — Material pack amendment

**Parent:** AT-07, AT-34 · **Build:** P06 · **Status:** Not run

**Preconditions:** Pack revision 1 issued/acknowledged; scope/control amendment required before attendance.

**Procedure:** Raise material amendment; inspect dispatch; prepare/check/issue revision 2; retry old acknowledgement; acknowledge revision 2 as each required recipient.

**Expected result:** Dispatch hold begins when material change is raised. Original issue remains recoverable. Revision 1 acknowledgement cannot satisfy revision 2; each affected recipient must respond.

**Evidence:** Old/new output hashes, change reason, hold and acknowledgement list.

### PT-08 — Concurrent edit of one appointment

**Parent:** AT-08 · **Build:** P05 · **Status:** Not run

**Preconditions:** Two independent sessions read appointment version 3.

**Procedure:** Session A moves the booking and commits version 4. Session B submits a different move expecting version 3. Inspect booking, reservations and both user proposals.

**Expected result:** A single version-4 outcome persists. B receives VAL-05 and retains proposed input; no silent overwrite or partial resource release occurs.

**Evidence:** Two request/response traces, reservation rows, audit and retained form state.

### PT-09 — Concurrent crew conflict across bookings

**Parent:** AT-08 · **Build:** P05 · **Status:** Not run

**Preconditions:** Two different proposed appointments both need SYN-T01 during 09:00–11:00; each also includes a different second technician.

**Procedure:** Confirm both concurrently. Inspect all resource reservations. Attempt an adjacent visit whose explicit travel buffer overlaps the winning booking.

**Expected result:** Exactly one conflicting booking confirms; no partial crew reservation from loser. Adjacent core times still fail if buffer overlaps. No serial UI-only check can bypass database guard.

**Evidence:** Concurrent database/API test, complete crew reservation sets and VAL-06.

### PT-10 — Project-request boundary and keyboard move

**Parent:** AT-09, AT-32 · **Build:** P05 · **Status:** Not run

**Preconditions:** Confirmed appointment linked to a synthetic project reference.

**Procedure:** Submit a project-date change request. Inspect original booking; dispatcher uses keyboard Move action to evaluate/reject then later accept a valid request.

**Expected result:** Project request does not overwrite confirmed attendance. Rejection has reason. Accepted move applies the same guards as drag/drop, records history and requires pack/contact review.

**Evidence:** Change-request state, before/after booking, keyboard recording and contact tasks.

### PT-11 — Offline save, restart and quota failure

**Parent:** AT-10 · **Build:** P08 · **Status:** Not run

**Preconditions:** Two assigned cached jobs, current pack revisions; service worker enabled in a persistent test browser profile.

**Procedure:** Disconnect; capture note/time/photo; close and reopen browser with same profile; inspect saved entries. Force a storage/quota write failure on another entry.

**Expected result:** Committed local entries survive tested restart and show last sync/revision. Failed write never shows Saved. Evidence remains distinguishable from server-synchronised/reviewed work.

**Evidence:** IndexedDB state, restart evidence, quota failure message and device/browser version.

### PT-12 — Duplicate replay and payload conflict

**Parent:** AT-11 · **Build:** P08 · **Status:** Not run

**Preconditions:** 100 saved operations with stable IDs and one dependent attachment; server receipts initially absent.

**Procedure:** Synchronise; lose client acknowledgement; replay all 100; reuse one ID with changed payload; interrupt and retry photo finalisation.

**Expected result:** Exactly 100 evidence records exist; original receipts replay. Changed payload gets VAL-12. One final attachment identity exists; completion waits for its Available receipt.

**Evidence:** Record counts, operation receipts, hashes and dependency queue state.

### PT-13 — Time/material correction and review

**Parent:** AT-12 · **Build:** P07, P09 · **Status:** Not run

**Preconditions:** 90-minute labour interval and 2 EA consumed material; entries initially Draft.

**Procedure:** Submit and approve entries; try in-place edit; create reasoned successor correction; inspect dependent report and handoff readiness.

**Expected result:** Captured, reviewed and financial quantities remain separate. Approved original cannot change. Successor retains lineage; affected downstream review is invalidated without rewriting processed history.

**Evidence:** Entry revisions, guard response, dependent-review state and audit.

### PT-14 — Partial work and return visit

**Parent:** AT-14, AT-30 · **Build:** P07, P09 · **Status:** Not run

**Preconditions:** One work order addresses two tasks/assets; first visit cannot finish the second task.

**Procedure:** Submit Complete attendance with Partial scope outcome and owned follow-up; reviewer accepts attendance; propose return appointment; attempt whole-ticket/order closure prematurely.

**Expected result:** Visit can become Completed while order remains InProgress and ticket Waiting/Active. Remaining task and owner visible to return crew. Premature closure is blocked.

**Evidence:** Independent state records, follow-up, return appointment and closure refusal.

### PT-15 — Customer response alternatives

**Parent:** AT-13 · **Build:** P09 · **Status:** Not run

**Preconditions:** Exact issued customer report; five independent response fixtures.

**Procedure:** Capture Accepted, AcceptedWithReservations, Declined, Unavailable and Disputed outcomes against presented content; omit mandatory remarks once.

**Expected result:** Each response retains exact revision/hash/context. Reservations/decline/dispute need detail; unavailable has reason/contact action without invented signer. No response automatically approves billing.

**Evidence:** Response records, validation, owned activities and unchanged Finance state.

### PT-16 — Signed report revision

**Parent:** AT-13, AT-36 · **Build:** P09 · **Status:** Not run

**Preconditions:** Report revision 1 issued and accepted; a finding needs material correction.

**Procedure:** Create revision 2, re-review and issue; inspect old/new PDFs and response status; try attaching the old response to revision 2.

**Expected result:** Revision 1 and its response remain exact. Revision 2 has new content/hash and no inherited signature/acceptance. VAL-20 prevents false reassociation.

**Evidence:** Two manifests/outputs, response foreign keys and rejected operation.

### PT-17 — Finance split, allocation and no-posting outcome

**Parent:** AT-12, AT-31 · **Build:** P10 · **Status:** Not run

**Preconditions:** F-06: 90 approved MIN split 60 Billable/30 NonBillable; 2 EA part; verified synthetic mapping.

**Procedure:** Submit/review one handoff; concurrently allocate the same source quantity elsewhere; process synthetic target for approved billable treatment; reconcile non-billable disposition separately.

**Expected result:** Over-allocation is rejected atomically. All 90 MIN remain dispositioned. Target 60 MIN does not imply missing 30 when reviewed no-posting evidence covers it. No real ERP result is claimed.

**Evidence:** Allocation sum, target line map, non-billable reason, reconciliation record and synthetic label.

### PT-18 — Exact document access and source movement

**Parent:** AT-20, AT-36 · **Build:** P06, P11 · **Status:** Not run

**Preconditions:** Issued synthetic pack/report/Finance output; source adapter supports simulated rename/move/version removal; restricted internal notes.

**Procedure:** Rename source; resolve by stable identity; simulate identity-changing move and missing version; open retained exact issue; attempt technician/customer access to Finance/internal output.

**Expected result:** Supported reference resolves or creates a specific exception. Historical issued bytes remain exact. No silent latest-version substitution or restricted content leak, including metadata/attachment names.

**Evidence:** Reference resolution, output hashes, manifest and negative access/content assertions.

### PT-19 — Unknown external outcome and processing concurrency

**Parent:** AT-31 · **Build:** P10 · **Status:** Not run

**Preconditions:** Approved handoff; simulator creates one target then times out. Two Finance sessions can claim processing.

**Procedure:** Race processing claims; allow one simulator effect; timeout; attempt repeat; perform outcome lookup; map discovered target and reconcile.

**Expected result:** One processor claim and target effect only. State becomes OutcomeUnknown. Blind retry/cancel blocked; lookup resolves original reference before reconciliation.

**Evidence:** Claim/version evidence, simulator effect count, lookup and final mapping.

### PT-20 — Account amounts, unapplied cash and reversal

**Parent:** AT-18, AT-31 · **Build:** P10 · **Status:** Not run

**Preconditions:** F-01 original 1100, applied payment 400, credit 100, remaining 600; F-02 unapplied 200; F-03 payment reversal.

**Procedure:** Render F-01/F-02; compare source fields; apply F-03 observation; inspect history and company/currency labels.

**Expected result:** Original remains 1100; open 600; unapplied 200 separate. After reversal current remaining is 1000 with lineage. Page subtotal and cash are not silently netted into invoice balance.

**Evidence:** Exact expected/observed decimal values, source timestamps and status history.

### PT-21 — Incomplete source and undefined metric

**Parent:** AT-31 · **Build:** P10 · **Status:** Not run

**Preconditions:** F-04 missing second page; F-05 unknown commitment definition; existing last-good account snapshot.

**Procedure:** Fail a refresh midway; filter to one page; request undefined metric.

**Expected result:** Incomplete/unavailable/undefined states are explicit. Last-good values show their as-at/failure context. No verified zero, whole-account total from page sum, or invented commitment formula.

**Evidence:** Import run completeness, UI/JSON states and metric definition reference.

### PT-22 — Restore and safe queue recovery

**Parent:** AT-22 · **Build:** P12 · **Status:** Not run

**Preconditions:** Synthetic database, issued objects, audit/outbox and an OutcomeUnknown handoff.

**Procedure:** Take documented backup/checkpoint; restore into clean isolated environment with outbound effects disabled; compare records/files; recover queue leases and investigate unknown item before enabling simulation.

**Expected result:** Referenced objects and record relationships restore; hashes/counts match declared backup point. Outbox replay does not duplicate issues/targets. Actual measured recovery/loss recorded, not claimed candidate SLA.

**Evidence:** Restore commands, timestamps, counts/hashes, queue receipts and measured results.

### PT-23 — Template change, long output and storage failure

**Parent:** AT-36 · **Build:** P06, P09, P11 · **Status:** Not run

**Preconditions:** Long customer/site names, many assets/findings/pages; template versions 1/2; injectable storage/finalisation failure.

**Procedure:** Generate selected OUT outputs; inspect all pages; change template/source during generation; fail file store then database finalisation; retry same operation.

**Expected result:** No clipped/overlapping or confidential content. Stale render cannot issue without review. Durable storage failure does not show Issued; retry reconciles one output/issue. Prior template output unchanged.

**Evidence:** Page review checklist, output hashes, failed-attempt states and issue counts.

### PT-24 — Offline reassignment, cancellation and revocation

**Parent:** AT-11, AT-34 · **Build:** P08 · **Status:** Not run

**Preconditions:** Technician offline with revision 1 and unsent evidence; server reassigns/cancels and issues changed scope.

**Procedure:** Capture locally; reconnect with active identity but stale assignment; repeat with revoked normal access and no recovery capability; then exercise separately authorised recovery capability.

**Expected result:** Stale evidence retained in restricted ReviewRequired and excluded from approved totals. Revoked user gets no normal access; local evidence retained until authorised recovery. Old pack never claimed current; direct-contact need visible.

**Evidence:** Access/assignment versions, local queue, restricted recovery receipts and audit.

### PT-25 — Effective site/operator and asset history

**Parent:** AT-30, AT-33 · **Build:** P03 · **Status:** Not run

**Preconditions:** Completed visit and issued report under old operator/site/configuration; future appointment exists.

**Procedure:** Record reviewed operator change/asset move at an effective instant; inspect current context, historic report and future pack readiness.

**Expected result:** Current records reflect effective change; historical report/context unchanged. Affected future work requires review; no duplicate identity or retroactive reassignment. Automatic recurrence remains explicitly deferred.

**Evidence:** Effective relationships, old/new snapshots and future review task.

### PT-26 — Cancellation and actual-work preservation

**Parent:** AT-14 · **Build:** P05 · **Status:** Not run

**Preconditions:** One future confirmed visit with issued pack; another visit contains actual field labour.

**Procedure:** Cancel future visit with reason; attempt cancellation of visit with actual work; inspect resource reservations, packs, contacts and captured entries.

**Expected result:** Future reservations released and history retained; contact tasks created. Actual-work visit cannot be erased/cancelled as unstarted; completion with remaining-work disposition is required.

**Evidence:** Reservation changes, VAL-21, retained entries and cancellation audit.

### PT-27 — Accessibility and defined load

**Parent:** AT-23 · **Build:** P11 · **Status:** Not run

**Preconditions:** BP-02 benchmark fixture and recorded browser/device/network/build; keyboard and representative screen-reader setup.

**Procedure:** Complete intake, booking move, field submission, report response and Finance review by keyboard; inspect errors/focus/reflow; run core-read timing sample including cold/warm distinction.

**Expected result:** Workflow has labelled controls, meaningful focus, no drag-only action or colour-only meaning. Record p95 against candidate 3-second target with actual profile; disclose failures and no unsupported whole-product conformance claim.

**Evidence:** Accessibility findings, timings/raw sample, environment and remediation evidence.

### PT-28 — Schema, policy and application update

**Parent:** AT-35 · **Build:** P08, P12 · **Status:** Not run

**Preconditions:** Queued payload v1, application update and policy/template successor; backup/recovery instructions.

**Procedure:** Deploy compatible update; replay old payload; try unsupported schema; publish changed scheduling rule; inspect existing issued content and future bookings.

**Expected result:** Supported payload migrates/accepts once. Unsupported original retained for recovery. Future affected work flagged; no silent reassignment/reissue or changed historic evidence. Software rollback does not erase external outcomes.

**Evidence:** Migration/result receipts, preserved payload, impact tasks and release note.

### PT-29 — Honest empty, error and partial states

**Parent:** AT-23 · **Build:** P11 · **Status:** Not run

**Preconditions:** Known records plus injectable query/permission/render/upload failures.

**Procedure:** Visit all 15 screens in empty, populated, loading, failed and applicable restricted/stale states; retry save while retaining input.

**Expected result:** No-records differs from could-not-load. Errors provide actionable recovery without stack traces/secrets. Failed saves retain safe input; unsupported features never appear successful.

**Evidence:** Screen-state checklist, representative captures and API outcomes.

### PT-30 — Complete owner demonstration

**Parent:** AT-06, AT-07, AT-08, AT-12, AT-13, AT-14, AT-31 · **Build:** P11, P12 · **Status:** Not run

**Preconditions:** Fresh deterministic synthetic seed; completed P01–P12; previous PT findings dispositioned.

**Procedure:** Execute the full scope narrative from customer history through return visit, report reservation and Finance reconciliation; restart application/database during a safe saved stage; revisit next technician history.

**Expected result:** A complete persisted journey demonstrates preparation, controlled scheduling, useful history, field evidence and Finance outcome. All remaining limitations are labelled; no live integration/customer message claimed.

**Evidence:** Commit/environment, walkthrough record, outputs, test results and open-defect list.

## 4. Selected coverage and deliberate limits

Master AT-01/02/06–14/18/20/22/23/30/31/34–36 are addressed within the selected synthetic service scope. AT-32 is represented only by the project-change-request boundary, not Smartsheet migration/native predecessor conversion. AT-33 is represented by coverage/follow-up/effective history only; automatic recurrence/warranty/renewal machinery is deferred. AT-36 covers OUT-09/OUT-10/OUT-14, not every enterprise output.

Other master scenarios remain in the original acceptance catalogue and later domain backlog. A selected parent AT does not imply its entire future-enterprise scope is proved by one PT. Use the parent requirement disposition and each case's stated limits when reporting coverage.

## 5. Exit criteria

The complete PP-01 demonstration requires all applicable PT cases executed with evidence, all critical access/data-loss/duplicate-financial-effect defects resolved, other defects explicitly dispositioned, restored data/files/queue demonstrated, and a usable owner runbook. Performance/accessibility findings are reported against measured conditions; proposed operational RPO/RTO, source definitions and corporate approvals remain open until separately established.

## P04 component execution boundary

The [P04 handover](../delivery/p04-handover.md) records exact run results and visual evidence. `tests/database/work-orders.test.ts`, `tests/http/work-orders.test.ts` and `tests/browser/work-orders.spec.ts` exercise implemented SC-05/API-C03. They supplement existing P03 incomplete intake/urgent tests. These are component results; every full procedure above remains **Not run**.

| Procedure | P04 component obligation | Remaining full-procedure dependency |
|---|---|---|
| PT-03 | Unresolved equipment authorisation refusal; reviewed bounded Identification plan succeeds; original asset identity remains unchanged | Later field identification/verification with original visit-time uncertainty; site-less intake alternative remains deferred |
| PT-04 | Owned incomplete work remains visible; missing authorisation stage fields listed; urgent cannot waive mandatory access; forged exception/N/A refused; reviewed evidence clears the criterion; tool exception only from controlled policy | Dispatch and its exact later evidence are absent |
| PT-05 | Exact original approved hash/children preserved; technician cannot approve extra work; in-place edits refused; reviewed successor approved after new readiness; disputed coverage remains PendingFinanceReview | Technician extra-work request/field workflow, shutdown execution and full financial consequences are absent |

SC-05 screenshot provenance and hashes are retained with P04 evidence after manual review. Injected browser conflict/unreadable-response tests prove recovery presentation; independent PostgreSQL tests prove real stale versions and idempotency. No screenshot alone proves a transaction or acceptance.
