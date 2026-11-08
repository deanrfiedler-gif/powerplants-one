# Corrected writer criterion: implicit workspace key-share lock

7 November 2026. Resume claim: [6704365817](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6704365817). This follows Claude's [corrected criterion 2](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6689649138) and [handover](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6689653453). Main `5a1c09fd3` was merged without conflicts in `01db19863`; application source still matches main. No queue lock change has been made.

## Stop condition found

`reconcileTesters` in [scripts/demo-database.ts](../../../../scripts/demo-database.ts), lines 70–101, is an existing operator transaction that writes `ppo.users`. It acquires advisory lock `10001`, updates active users, inserts a tester user and updates its display name. It then calls [ensurePackReviewer](../../../../scripts/demo-reviewer.ts), which inserts a second user and updates its display name. Neither the transaction nor its callees acquires `FOR UPDATE` on the coordinator workspace row.

This is a table the queue reads directly, independently of permission grants: the candidate query joins `ppo.users` for the owner name, and [queuePerson](../../../../src/estimating/review/queue-context.ts) selects `display_name` for the submitter. Permission checks also read `users.active`. The finding is not based on the grant writes, for which the original handover already allows the existing recheck.

The live PostgreSQL 16.15 catalog retains validated constraint `users_workspace_id_fkey`: `FOREIGN KEY (workspace_id) REFERENCES ppo.workspaces(id)`. `demoWorkspace` is the same `10000000-0000-4000-8000-000000000001` used by the coordinator fixture. On the new-user insertion path, PostgreSQL takes an implicit `FOR KEY SHARE` lock on that existing workspace row. Unlike the worker failure path, this writer is excluded by the queue's current `FOR UPDATE` and would be admitted by `FOR SHARE`.

## Native transaction proof

The [diagnostic source](writer-lock-probe.ts.txt) calls the existing `reconcileTesters` function on `ppo_synthetic_test`, after applying the existing hosted-only schema track locally using `migrateDemo`, as the demo database tests do. The operator CLI and hosted configuration are never invoked. The diagnostic observes native SQL, intercepts the attempted COMMIT, checks deferred constraints, and probes the workspace row from separate transactions while the native writer is still open. It then deliberately throws to roll back the writer. There is no modified SQL in the native writer and no runtime patch.

The [retained result](writer-lock-probe.json) contains the live foreign key, all observed native SQL templates without bind values, and these assertions:

| Separate connection probe on coordinator workspace | Result while native writer remains open |
|---|---|
| `FOR KEY SHARE NOWAIT` | Acquired |
| `FOR SHARE NOWAIT` | Acquired |
| `FOR NO KEY UPDATE NOWAIT` | Acquired |
| `FOR UPDATE NOWAIT` | `55P03` (lock not available) |

The combination distinguishes a key-share lock from a share or stronger lock. The writer inserted exactly two users; no explicit workspace row-lock statement was observed. All native statements completed before the COMMIT interception, and `SET CONSTRAINTS ALL IMMEDIATE` passed. The captured COMMIT is an intercepted attempt, not an executed commit. The subsequent native ROLLBACK executed, and the user count returned to its original value.

Reproduce after successful cloud setup by copying `writer-lock-probe.ts.txt` to ignored `tmp/prompt-s/writer-lock-probe.ts`, sourcing the setup environment, and running `node --env-file=.env.local --import tsx tmp/prompt-s/writer-lock-probe.ts`. It refuses any database other than `ppo_synthetic_test` and requires `local-synthetic`. The local demo schema remains installed; all tested invitation, user, grant and mailbox writes roll back. No hosted data or credentials are involved.

## Audit coverage and boundaries

| Writer examined | Workspace lock in its transaction | Disposition |
|---|---|---|
| Estimating and shared commands through `sharedOperation` | Explicit `FOR UPDATE` before authorisation and mutation (`src/platform/operations.ts:172`) | Retains exclusion; this observation is not an exhaustive command inventory |
| Quote worker claim and success (`src/estimating/worker.ts:52,81`) | Explicit `FOR UPDATE` in each transaction | Retains exclusion |
| Quote worker failure (`src/estimating/worker.ts:87–93`) | None; the job's unchanged workspace key does not acquire a workspace FK lock | Pre-existing gap, not a stop; no change to `worker.ts` |
| `reconcileTesters`, including `ensurePackReviewer`, when inserting new users | Implicit `FOR KEY SHARE`; no `FOR UPDATE` | Corrected criterion 2 stop condition, executed above |

The audit stops at this counterexample. It does not claim every writer has been enumerated, that every SELECT-only call path has been certified, or that the page/shell request audit is complete. This operator command is not issued by the review-register browser test. Its existence fails the universal writer criterion; it is not evidence that it caused the CI timeout, nor proof that a queue DTO changed in this experiment. Whether this operator path may be excluded from the criterion needs a new explicit decision. The current scope permits only the queue lock change, so the operator and worker are left unchanged.

The original [H1–H4 evidence](README.md) and the 8,708-statement full-window limit remain unchanged. The correction does not establish actual browser overlap. Criteria 1, 3–7, including the rejecting-wrapper test, reader/mutator concurrency tests, post-fix reproduction, browser request diagnostics and ready-head lanes, remain undelivered because criterion 2 fails before implementation.

Cloud setup succeeded with pinned Node 24.21.0/npm 11.19.0 and PostgreSQL 16.15; it reports browser unavailable. The native lock diagnostic passed. No application regression or browser suite was run for this evidence-only continuation. The review order remains [draft delivery → DONE → Claude review → ready → browser completion evidence](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6690379898); this stop is a clarification handover, not DONE or a request for the completed build's one review.
