# FI-06 persisted incident verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic implementation evidence, not business acceptance, operating policy or deployment approval. [Acceptance matrix and human checklist](../../field-incidents-acceptance.md), [decision](../../../decisions/field-incidents.md) and [API/data contract](../../../contracts/field-incidents.md).

## Starting point and ownership

Refreshed main was `4ecef7f1820a269a2ec69d55859e66dea8c37989`. PR #334 merged at 2026-10-01T13:04:08Z from final checked head `ab63fd8be6172fec31c167de8cca96f2b0e50308`; all 21 checks passed. PR #333 was already merged. The exact GitHub response is indexed with the private original logs. Living STATUS/programme passages now distinguish those merged increments from the current incident work; #334's issued evidence and archived chronology remain unchanged.

Work uses isolated `codex/field-incidents`, retaining the original checkout's untracked worktree directory and unrelated Maintenance/Products/Excel worktrees. No overlapping open PR was found at preflight. Installed SQL/seed bytes through 0055, reserved 0051/0052 and all 78 parents are unchanged. No merge or deployment is performed.

Three task-owned PostgreSQL 16.15 clusters use database `ppo_synthetic_test`: regression 57661, browser/restart 57663 and focused regressions 57665. Compiled application uses 57660. Private environment files, credentials, browser profiles, original databases, raw command/recovery payloads, traces and issued originals stay outside Git. The initial incorrectly encoded focused database is retained separately as `ppo_synthetic_test_win1252`; tests only use the corrected UTF-8 `ppo_synthetic_test`. An unchanged-main detached checkout supplies comparison evidence. No other session's database or service was reset or stopped.

## Inspection dependency acceptance

Before runtime edits, the merged baseline was compiled and executed: 5/5 FI-03/FI-04 database scenarios and 4/4 compiled desktop/phone journey/reference cases passed. The technical F02-A sequence covers actual appointment/equipment, preparation, failure, reviewer clarification/return, owned correction, fresh retest, independent acceptance and exact scoped output. No relevant blocking permission, data-loss or recovery defect appeared. Retained #334 evidence supplies unchanged calibration, original-engine and restart history; new tests freshly exercise incident interactions.

No owner participated. No physical-device, screen-reader, independent visual acceptance or benefit/time study was performed. The concrete outstanding checklist remains in the acceptance matrix; these limits do not turn technical completion into operational approval. F02-A alone does not establish FI-06, F08-A, all Q01–Q05 or AT-17 acceptance.

## Implemented and executed boundaries

| Matrix cases | Technical proof |
|---|---|
| FI06-01/05 | Actual work/appointment/site/task/equipment/configuration; factual report before Start and under a hold, unknown assessment, attributable original/corrections, separate similar reports and explicit repeated-report link. Classification infers no blame, risk score or reportability. |
| FI06-02/03 | Current scoped read/report/review/close/sensitive duties; wrong company and asset, direct URLs, changed identity, non-lead assignment loss, revoked report/review/sensitive/read authority and recovered receipt checks. Restricted canaries excluded from ordinary record/list/history, global search results, Activities, field context, file URLs and controlled output. |
| FI06-04 | Two reporters and reviewers, concurrent decisions, stale facts retained for explicit reconciliation, unchanged original retries and lost responses. One report/action/Activity obligation per accepted original operation. |
| FI06-06/07 | Actual RestrictedService Activity handover, return/clarification, append-only original evidence, action-owner reassignment/adoption and independent evidence acceptance. Activity Completed does not close the incident; a passing inspection does not clear its independent incident hold. Linked defect closure still requires its own original correction, exact fresh retest and independent acceptance. |
| FI06-08/10 | Authoritative scoped readiness/Start/release; hold during active attendance preserves attendance/timer originals. Delayed offline Start refuses a newer hold. Existing P08 factual capture retains a server receipt with ReviewRequired/AuthorityReviewRequired attribution. Missing installed incident storage fails closed. Upload hash failure, missing stored evidence and changed equipment/source make review incomplete. |
| FI06-09 | Independent exact content acceptance followed by controlled Internal HTML/PDF. Closure removes only its incident hold; another incident, scheduling impacts and inspection requirements retain their independent state. Reopening and changed current binding withdraw current applicability without rewriting earlier output. |
| FI06-11/12 | Compiled keyboard entry/Enter save, guide Escape/focus return, retained validation/conflict/uncertain input, actual disconnected retry, reload and current identity access. Restart and final geometry evidence are indexed below. |

The Scheduling Step 6 contract intentionally treats already active attendance as Historical when policy publication occurs. The proof preserves that behavior and also compares other appointments' current policy holds before/after closure. It does not claim incident or policy publication retroactively stops attendance. Unknown/missing incident authority never becomes a clear result.

## Verification and original failures

The retained log index separates failed attempts from corrected successful runs. No assertion, performance target or timeout was weakened; no skip was introduced.

- Initial 0056 seed failed because the live grant capability constraint lacked the five new duties. The additive migration now extends that constraint; installed migrations remain unchanged.
- Early FI-06 fixtures used a stale pre-attendance Start version, attempted a protected direct appointment update, and expected ServerSaved rather than the existing ReviewRequired receipt for factual P08 capture. Corrections use a current pre-incident Start, actual policy publication and the existing receipt/authority contract. The initial expanded five-case and six-case failures remain retained.
- The first focused cluster used Windows' default WIN1252 encoding, so seeds failed before scenario execution. Its database remains retained; the replacement test database is explicitly UTF-8. The corrected six-case run passed 6/6.
- An added assignment-revocation fixture initially removed the lead crew member; the existing complete-crew invariant correctly refused it. The correction selects the actual non-lead member, preserving that invariant.
- The broad 71-case run passed 55 and failed 16: two then-incorrect FI-06 fixture expectations, followed by 14 PostgreSQL lock-capacity failures during schema reset. Unchanged main reproduced the reset failure on the same task cluster. Task-only `max_locks_per_transaction=256` supports the large schema proof. A restart command initially omitted the task port and attempted occupied default 5432; its next 20-case run failed before scenarios with connection refusal. Explicit port 57661 restored the original cluster.
- Initial browser launch orchestration attempted a second server; it was stopped by exact task-owned process identity. A later desktop check read the refreshed UI before the successful close response/record refresh completed. It now awaits those exact responses before the unchanged UI assertion. The corrected journey passed 4/4; the expanded disconnected/restricted journey passed 4/4 plus route warm-up. Two later private-harness warm-ups used default port 3000 because its webServer URL was omitted; they failed before the four journey cases. The harness now requires the already-running task-owned compiled server and supplies its exact URL.
- Lint caught an unused import during construction and then an impure render-time clock read in the overdue label. The final overdue status is derived in the server read. Type errors and first design-register/naming failures remain indexed with their corrections (explicit component reference anchor, source bindings and the 8,000-character instruction limit).
- Full unit execution passed 566/570. All four Windows failures also reproduce on unchanged main: two document-store path cases, a recovery path diagnostic and the warm-route separator assertion. The unchanged-main targeted run passed 3/7 with the same four failures. These are not presented as successful tests.

## Remaining acceptance and next increment

FI-06 is an online, synthetic Service incident consumer with one exact task/equipment binding per current record, retained binding history, explicit repeated-report relationships and bounded PNG/plain-text evidence. It is not a general incident platform, production policy, notification service, external reporting adapter or new attachment/offline protocol. Unsent edits stay in page memory; same-tab uncertain originals use the existing journal. Unsupported disconnected incident operations are never shown as saved. Closing a tab removes its session recovery copy.

The receiving Activity exists and can be performed through My Work. Appointment/work-order/project/customer/Finance completion, equipment control, regulatory notification, emergency response and external distribution remain unavailable. Cleared incident scope supplies no general permission to proceed. The synthetic seed adds no hosted tester rights.

Next bounded increment: define and implement FI-07 response review/refinement against these persisted incident/inspection restrictions, after identifying its exact receiving-domain command and acceptance boundary. Owner, device, visual, accessibility and existing performance work remain separately tracked.
