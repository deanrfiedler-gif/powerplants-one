# Controlled scheduling-policy publication implementation plan

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Prepared:** 27 September 2026. **Status:** Concrete next synthetic implementation plan; publication is not implemented. Source review, visual review, owner acceptance and production readiness remain separate.

Traceability: SVC-04/05, DAT-06, NFR-08, D-015/D-020, TR-03/08, API-R04, API-C26, EVT-12, PT-08/09/28 and AT-35. Preserve all 78 parent IDs. [Current integration and evidence](scheduling-policy-impact-handover.md), [read-only decision](../decisions/scheduling-policy-impact-review.md), [publication design](../decisions/scheduling-policy-publication.md) and [consolidation allocation](../decisions/repository-consolidation.md) govern this continuation.

## Baseline and migration reconciliation

Start from integrated main `a3b5d49e47d70e85840594cb4259a595d24b125c` after the normal protected merges of #322/#323/#324 recorded in STATUS and the handover. Keep the CR05 reload correction; do not reconstruct the stack from its dated original heads. The runtime introduced by #324 remains pinned to `89faa078a22525653e6e8f07cb82425372385b07`; it is only a scoped read-only duration preview, not a durable publication review.

The actual disposable schema was inspected after applying the current registry. It contains 49 migrations through **0050**, with historic **0016** absent and reserved. `ppo.scheduling_policies` is Published-only and synthetic-only; UPDATE/DELETE are rejected by `scheduling_policy_immutable`. Its contact and all-crew flags must remain true. Appointments retain `scheduling_policy_id`; immutable appointment revisions retain their exact snapshot and hash. There is no proposal, publication chain or policy-impact persistence table. The separate `policy_version_id` belongs to readiness and must not be repurposed as a scheduling-policy version.

| Slot | Current allocation | Next action |
|---|---|---|
| 0049 | Applied Supply Chain | Preserve exact file, checksums and installed history. |
| 0050 | Applied field timer/offline | Preserve `0050-field-work-timers.sql`; no change for publication. |
| 0051 | Maintenance/Warranty | Preserve its reservation and unfinished checkout. Its local 0049 proposal is not a merged predecessor. |
| 0052 | Products | Preserve its reservation and unfinished checkout. Its local 0049 proposal is not a merged predecessor. |
| 0053 | Planned scheduling-policy publication | Use only after refreshing main and confirming this slot is still free; register only the actual reviewed file when implemented. No schema or registry entry is added by this plan. |

The selected plan permits an explicitly documented gap at 0051/0052. Publication depends only on the integrated schema through 0050. Both `scripts/database.ts` and `scripts/demo-upgrade.ts` apply registered versions missing from the installed ledger; they do not require invented files for every lower integer. Therefore no placeholder migration, missing-predecessor registration, renumbering of applied SQL or integration of unrelated features is needed. This is allocation reconciliation, not a claim that Maintenance/Products have been reconciled or tested.

When 0051/0052 are later ready, their owners must rebase on the then-current main, retain the reservations and prove application both before and after an already-installed 0053. Fresh ascending application and a ledger containing 0053 before those later additions are distinct upgrade histories. Stop and revise the allocation decision if actual intervening schema introduces a dependency or conflict; never relabel an installed history. Existing unpublished databases with branch-specific 0049 remain untouched.

## Bounded product contract

Implement one predefined synthetic scheduling-policy family, initially rooted at the existing seed policy. Only maximum visit duration and a future effective instant are editable. Carry forward expiry, mandatory customer-contact/crew rules, source provenance and other terms exactly. General rule authoring, template publication, resource/calendar/competency publication, operational policy values and external-system commands remain outside this increment.

The native PL-04 continuation must distinguish a temporary scoped comparison, a frozen proposal, an immutable reviewed population, a saved publication and unresolved owned impacts. A zero-row preview cannot be submitted as workspace-complete review. No button or receipt may imply dispatch approval or owner acceptance.

## Authority and immutable review

1. Introduce narrow `schedule.policy.review` and `schedule.policy.publish` capabilities and dedicated fictional reviewer/publisher profiles. Existing `schedule.manage`, Systems, support, deployment and hosted tester roles gain neither duty. The publisher does not acquire booking-edit authority as a side effect. Use explicit active Workspace grants for this workspace-wide policy family; `requireCapability` alone is insufficient because a capability without a company parameter accepts narrower grants.
2. Require current source and booking visibility across the complete publication population, including company/site/work-order/scope-asset restrictions. The reviewer and publisher receive only the necessary synthetic read grants. Refuse incomplete authority without returning hidden counts or identities. Do not grant broad Finance or document-content authority. Revocation, expiry and inactive identity apply to review, publication and receipt recovery.
3. Save each proposal revision as a new immutable record. Bind workspace/family, root and exact source policy ID/version/hash, expected publication-head version, full fixed terms, proposed duration, canonical UTC effective instant/expiry, source evidence, proposer and schema/evaluator version. Hash canonical content with the existing `canonical`/SHA-256 conventions. Editing creates a successor proposal, never an UPDATE of reviewed content.
4. Review freezes a separate append-only snapshot: exact proposal ID/version/hash, source/head binding, evaluation time, ordered full candidate population, every candidate's complete dependency fingerprint and evaluation result, proposed impact owner and reason, reviewer and review event. The synthetic reviewer and publisher are distinct actors in the fixture; this models an explicit test boundary, not adopted operational staffing policy.
5. Publication accepts only the exact immutable review and proposal hashes, source/head versions and original command envelope. The transient #324 scenario hash is not a review token, and client-provided candidate lists never define publication scope. Reject mutated JSON, unknown fields, wrong family/workspace and forged hashes.

## Deterministic effective-policy selection

Use an append-only linear succession chain and a separately versioned family head. Each published successor points to the immediately preceding head. Its effective instant must be strictly later than that head's effective instant and the current database time, and strictly before the preserved expiry. For this increment reject insertion before an already scheduled successor, equal instants, branches and expiry extensions. This bounds future-dated publication without changing old policy bytes.

For a new unpinned booking, select the published chain member with the greatest effective instant at or before the proposed visit start. Its selection window ends at the next published successor's effective instant or its own expiry, whichever comes first. Use half-open intervals; equality at the boundary selects the successor. Reject a new booking spanning two selection windows, a gap, an expired family, ambiguous/corrupt lineage or an unreviewed selected version. Never select by insertion order, arbitrary UUID, mutable default ID or wall-clock policy validity alone. A future-dated published policy may be selected today for a visit wholly within its future window.

Return selected ID/version/content hash and head version with confirmation preparation; under the command lock recompute and require exact agreement. Changes between preparing and saving require fresh review. Update `schedulingPolicy`, booking preparation/defaults and `guardBooking` together: the existing fixed `SCHEDULING_POLICY_ID` and `effective_from <= clock_timestamp()` check cannot determine this future-visit selection.

Existing Confirmed bookings keep their exact policy pins, scope/readiness pins, schedule/crew and issued bytes. Publication does not repin or rebook them. Historic rendering resolves the pinned policy directly. Controlled moves retain that pin and existing booking validation, while also re-evaluating applicable outstanding publication impacts so a move cannot bypass a hold. Adoption of a successor pin uses an explicit controlled replacement proposal, retaining the old booking/history and applicable pack amendment workflow.

## Transaction and stale-review refusal

Use the existing `sharedOperation` transaction boundary in `src/platform/operations.ts`: original-operation advisory lock, then `SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE`. Booking confirm/move/cancel, change-request acceptance and actual start use the same workspace graph lock. Any resource row locks needed by evaluation follow the existing sorted UUID order. Do not invent a publication-only lock or evaluate outside the guarded transaction and then write optimistically.

Inside that transaction:

1. Re-read current publisher validity, complete scope and source entitlement. Current publisher permission checks precede receipt disclosure. Keep consumed-review, changed-head, reviewer/impact-owner eligibility and stale-booking validation out of this authorisation phase so an already accepted original can still recover its receipt. Historic review or task-owner changes cannot turn recovery into another publication.
2. Look up the original receipt using the canonical command hash. Return an authorised identical receipt before reapplying changed-version checks. The same operation ID with altered proposal/review/effective date/owner/reason must return the existing conflict without side effects. Another actor/workspace cannot recover it.
3. For a new operation, load and verify the exact immutable proposal/review and current head, then require current reviewer and impact-owner eligibility. Enumerate the entire current family population, including bookings pinned to ancestors, not only to the latest source. Include unstarted Confirmed bookings overlapping the new window, including visits crossing its start. Inspect actual attendance/capture markers, not just a client status. Exclude completed/cancelled/already-started work with explicit reasons. Unknown legacy pins or unsupported source states refuse publication.
4. Re-evaluate **every candidate**, including candidates that were previously compliant. Reuse a pure/read-only evaluator extracted from the booking rules; preserve existing command behaviour while adding explicit proposed-policy context. Recheck duration/window, scope/readiness versions, crew assignments, reservations/travel, resource/calendar/skill evidence, contact/preparation and owner eligibility. This must not call a mutating confirmation command or treat the #324 duration preview as full validation.
5. Compare deterministic population and dependency fingerprints with the frozen review. Added/removed/newly started/moved/reassigned bookings, altered work ownership, changed relevant source evidence or expired owner authority make the review stale. Even a change that appears more permissive requires another explicit review. Evaluation timestamps are retained as evidence, not included as an always-changing equality input. A candidate crossing into the past during the gap is a stale eligibility change. Refuse the whole publication before any write.
6. Resolve every required task to an active, currently permitted owner. Enforce the complete-population bound before writing. Initially refuse more than 200 candidates with no partial publication; do not narrow to a user-selected site, silently truncate or claim workspace completeness from a filtered preview.
7. Atomically insert the immutable successor, append its publication/lineage record, advance the head once, insert immutable impact snapshots and owned Activity tasks/typed junctions, then append audit, EVT-12 outbox and original-operation receipt. One impact record per publication/booking, with all reasons and exact dependencies, prevents duplicate tasks. Use the existing Activity ownership and link contracts; review any necessary enum/junction extension explicitly.

Failure at any point rolls back all these effects. A lost HTTP response after commit is recovered through the unchanged original operation; it never creates another successor, task, audit event or outbox event. EVT-12 records minimal versioned internal identifiers and hashes, with no customer message, external consumer or downstream business transaction implied. Outbox processing must not be the only enforcement of a hold: the committed impact records are immediately authoritative.

## Unresolved impacts and issued content

The proposed synthetic rule is conservative and explicit: an unresolved impact for an affected, unstarted booking blocks dispatch/actual-start authority from publication time, including a future-effective policy, while preserving the reservation and all pins. Expose the reason, owner, publication and controlled next action in PL-04, My Work and existing readiness reads. Incorporate the durable impact predicate into `dispatchReadiness` and its actual-start/offline-recovery callers under current authority. Do not infer an automatic change to `appointments.dispatch_hold` alone; readiness is computed from multiple sources today.

Activity completion by itself does not clear the impact. Add an intent-specific resolution command requiring the current authorised booking owner/scheduler, exact impact and booking versions, fresh applicable evaluation and a recorded outcome. Allowed first-increment outcomes are: verified no remaining conflict after a controlled change that retains the pin, or controlled cancellation/replacement with exact successor linkage. Reject a bare acknowledgement, arbitrary waiver, publisher self-dispatch, incomplete replacement or stale evaluation. A later change can make an earlier disposition stale and must restore a visible hold; new confirmation and move paths must evaluate the published chain and outstanding obligations.

Started/completed work remains historical and is not interrupted by this future-booking publication command. Offline start originals arriving after publication are freshly evaluated and may remain ReviewRequired; preserve their original bytes and original-operation recovery. No policy publish or impact-resolution command is available offline. Do not erase actual evidence or make a captured offline timestamp override present authority.

Policy publication and impact resolution never rewrite an issued pack/report, original response, Finance outcome, offline original or booking pin. Any operational amendment/replacement is a separate existing controlled command with its own receipt, owner and exact issue. Retain file hashes before/after publication, resolution, retries and restart in acceptance evidence.

## Schema and implementation sequence

The following names are proposed, not existing tables or endpoints. Keep the implementation in the adopted TypeScript/Next.js/PostgreSQL stack under ADR-0010; no framework, service, dependency or generic rule engine is selected.

The proposed relational split is:

| Record | Required invariant |
|---|---|
| Policy family/head | Workspace/root identity, current published head and optimistic version; one family for the existing root. Adding metadata does not UPDATE the old policy. Only the guarded publication transaction advances the head. |
| Proposal revisions | Immutable typed full content and canonical hash; exact source/head binding and optional predecessor proposal ID. No mutable JSON masquerading as an approved revision. |
| Reviewed populations | Immutable proposal binding, evaluator version, ordered dependency snapshots and aggregate population hash; explicit complete coverage and reviewer. Keep observation time separate from deterministic comparison inputs. |
| Publications/lineage | Immutable review/source/successor binding; unique successor and predecessor relationship, strictly increasing effective instant, exact original operation linkage. Corrupt or branched chains fail selection. |
| Impacts and resolutions | Immutable per-publication/booking impact snapshot, typed Activity junction and append-only resolution events. A versioned current projection may reference the latest resolution; it cannot erase earlier reasons, owners or dependency hashes. |

Use workspace-qualified foreign keys and unique constraints for all cross-record links. Tie the publication receipt to the saved publication and policy version; resolve its review/hash/task IDs from immutable linked records rather than changing the meaning of existing command receipts. Review which existing receipt/object/outbox enums actually require extension against the then-current schema.

| Step | Reviewable output | Exit condition |
|---|---|---|
| 1 | Pure policy-chain selection, canonical proposal/review types and deterministic evaluation dependency contract under `src/scheduling/`; focused units | Window/equality/gap/lineage tests and unchanged booking-rule regression tests pass. No schema or publisher yet. |
| 2 | Actual additive `0053-scheduling-policy-publication.sql` and seed, after allocation refresh | Immutable proposal/review/publication/impact evidence; constrained family head/lineage and typed task junctions; deterministic upgrade and reseed proof. No missing 0051/0052 entries. |
| 3 | Review/publish/resolution commands under API-C26 and no-store reads; exact receipt recovery | Permission, stale review, atomicity, retry and two-connection concurrency tests pass through the actual command handlers. |
| 4 | Booking selection and existing readiness/start/offline authority integration | New future bookings select deterministically; old pins stay unchanged; pending impacts cannot be bypassed. |
| 5 | Bounded PL-04 reviewed-proposal/publication UI and owned task handovers | Desktop/phone compiled browser cases prove exact review, refusal/recovery and persisted publication. Shared controls, register and guides updated in the same PR. |
| 6 | Upgrade, continuous service/PT-28 policy procedure and protected PR integration | Exact source/environment/evidence retained; failures distinguished from corrections; remaining PT-28/PT-30 and owner/device limits stated. No deployment. |

Prefer immutable child evidence and typed junctions without introducing a new global business identity unless the actual My Work/link contract requires one. If `ppo.business_identities` must be altered, use the mandatory `SET CONSTRAINTS ppo.identity_target IMMEDIATE` / ALTERs / `DEFERRED` sequence and prove upgrade across 0026 with estimates present. Existing migration bytes and seed receipts are immutable.

Update every affected migration assertion: `field`, `finance-upgrade`, `offline`, `packs`, `planner`, `reports`; `atVersion(N)` and both `>=18` lists in `leads-projects-integration`; and `tests/demo/upgrade.test.ts` migration/user counts. Register seed 53 only against implemented migration 53 and in increasing order. Seed new synthetic profiles/grants without reopening revoked grants; update `quality-upgrade` reseed allowances and `tests/helpers/engineering-materials-grants.ts`, then run both Estimating upgrade suites. Review the actual hosted upgrade gate and runtime privileges before changing its pinned latest version; invited testers gain no publisher/reviewer duty.

For new capabilities, regenerate AD-01 from LF source with `python3 scripts/build-access-review.py`, add plain-English labels and update pinned contract sizes in its model/browser checks and workspace. Review the exact generated diff. Update local identity selection and profile tests only for the dedicated fictional users. None of this is an authority grant to a real user or a hosted deployment.

## Acceptance matrix

| Area | Required proof |
|---|---|
| Permission | Existing coordinator, Systems, technician, support and hosted tester refuse publication; valid dedicated actor succeeds; Company/Site-only grant cannot publish a Workspace family; wrong workspace, hidden historical asset, revoked/expired grant and inactive reviewer/owner refuse without leaking counts. Revocation also blocks receipt disclosure. |
| Immutability | Direct UPDATE/DELETE of proposals/reviews/publications/policy rows refused; changed input makes a successor proposal; hashes include all fixed terms and exact identities; cross-family/hash substitution refused. |
| Selection | Before/at/after future effective instant; equality; crossing visits; expiry/gap; competing future successors; same-time refusal; deterministic same input; preserved historic pin; future appointment prepared before policy activation selects the published future rule correctly. |
| Fresh review | Add, remove, move, reassign, cancel, start, change scope/calendar/skill/contact, change owner or revoke permission between review and publication; all refuse stale evidence atomically. Previously compliant and hidden candidates must not disappear from complete evaluation. Bound 200/201 and zero-candidate cases explicitly. |
| Concurrency | Two real database connections and controlled barriers, not sleep-based ordering: publish versus confirm/move/cancel/change acceptance/actual start and impact resolution; publish versus publish; same original versus altered retry. Prove shared graph-lock serialization, no phantom missed booking, one accepted head and no duplicate tasks. |
| Atomicity and recovery | Inject a failure after each durable stage and show no partial successor/head/task/audit/outbox/receipt; lose the accepted response and recover the byte-identical original receipt; altered retries and stale new operation IDs refuse. Confirm replay still works after time passes, head/review state advances or historic reviewer/task-owner eligibility changes, subject to current publisher and source-read authority. |
| Impacts and offline | Pending impact blocks readiness/start without changing reservation, pins or files; Activity completion alone cannot clear it; permitted resolution freshens exact dependencies; changed booking invalidates prior resolution; delayed offline original is retained for review; actual work is never silently erased. |
| Upgrade | Fresh registered schema through 50 then 53 with reserved gaps intact; current-50 populated upgrade; upgrade across 0026 with estimates/identities; hosted-only identity track in a disposable test environment; reseed/revocation preservation; rollback-to-old-code limit stated because older launchers cannot enforce new holds. Later 51/52 integration must prove both install orders against actual files. |
| Compiled browser | Explicit owned compiled launcher, HTTP readiness and `webServer: undefined`; reviewer/publisher identity separation, immutable proposal edit/successor, stale refusal, valid publish, exact post-reload receipt/state, lost-response identical retry, altered retry refusal, owned impact link and blocked start; desktop 1440/1024 and phone 390/320, keyboard/reflow and errors. No test skip or assertion-budget increase. |
| Bytes and assurance | Exact pre-existing policy/booking/revision/issued pack/report/PNG/offline hashes unchanged after publish/retry/resolution/restart; full required CI plus foundation/prototype/naming and `studio:check`; actual source review and source-linked register guidance. Capture review is not owner acceptance. |

The immediate next implementation step is **Step 1 on a new `codex/` branch from the recorded integrated baseline**: implement and test the deterministic chain selector and frozen proposal/review dependency contract. Confirm the 0053 reservation against fresh main before Step 2. Do not begin with a direct SQL policy edit or a publisher button over the temporary preview.

No deployment, live integration, production migration, business transaction or customer communication is authorised. MYOB, SharePoint and native CAD retain their existing authority. This plan does not close PT-28/PT-30, the existing PT-27 performance misses or independent owner/device/accessibility acceptance.
