# Scheduling-policy Step 3 command evidence

Owner: Dean Fiedler. Source self-review and synthetic component verification; independent review and owner/production acceptance remain separate. Branch `codex/scheduling-policy-commands` is based on protected integrated main `0d294d1d337eb0a5c81a16da59c91d7f772aad96`. Traceability: SVC-04/05, DAT-06, NFR-08, D-015/D-020, TR-03/08, API-R04/API-C26, EVT-12, PT-08/09/28, AT-35. All 78 parent IDs and issued references are preserved.

## Environment and boundaries

Task-owned PostgreSQL 16.15, isolated port 55767 and database `ppo_synthetic_test`; configuration, database files, logs and document evidence remain outside Git under the task-specific private proof directory. Earlier clusters and worktrees were not reused. Locked dependencies, adopted Node/TypeScript/PostgreSQL stack, existing transaction and renderer were used. Migration/seed 0054 is additive; installed 0053 bytes and reserved 0051/0052 are unchanged. Tests retain existing assertions, timeouts, skips and performance thresholds.

The actual Step 3 handlers and HTTP adapters are **unregistered in live application/offline routes**. A test-only loopback server runs the same authenticated no-store adapters. Publication does not become available through a hidden button or feature flag. Step 4 selection/readiness/start/offline controls are still required together before activation; Step 5 owns PL-04 UI. Shared-lock serialization below is not hold enforcement.

## Command evidence

Implementation source is `b885237f91caaea35cecf1b52b6985fa08ff4692`; the corrected factual-offline fixture is `883fa87ca371f89314ab91a083dce00af4b2ce80`. [Source/log fingerprints](verification.json) bind the retained completed local runs. [PR #329](https://github.com/deanrfiedler-gif/powerplants-one/pull/329) records the final checked head, complete affected regression results, current required checks, review and protected integration status. Those statuses are not inferred from local component counts.

All **23 distinct new PostgreSQL/HTTP handler cases pass after corrections** across the recorded runs: ten core cases, eight concurrency cases, four disposition cases and one HTTP parent/harness case. The complete run also passes all eleven retained Step 2 persistence cases. Its one newly added offline fixture failure was corrected and rerun: the two retained-original cases pass, including exact issued files after publication/resolution, a non-empty factual recovery original and all earlier receipts. No assertion was removed.

Four selected Estimating migration/upgrade cases pass, including both required grant snapshots and the populated upgrade across 0026. All eight combined Quality/hosted-upgrade cases pass: three Quality states plus five hosted upgrade cases, with exact existing grants, revoked/inactive identities, invitation limits, Windows checksum history and transactional privilege-failure rollback retained. The existing nineteen-case Planner suite and further affected migration assertions are reported in PR #329 with the final CI evidence.

Build, lint, type checking, foundation/prototype/naming and `studio:check` passed. Full sequential units: **562/566 pass, four failures, zero skips** in 72.4 seconds; all four are the unchanged-main Windows failures described below. The new activation-boundary unit passes. Design-register integrity remains 321 entries / 167 routes / 29 components, with all 321 entry and 29 component reviews pending; no acceptance fingerprint was copied.

| Source | Proof |
|---|---|
| `tests/database/policy-commands.test.ts` | Explicit Workspace duties, narrow/revoked/expired/inactive refusal and hidden-source protection; immutable edits and exact bindings; complete 0/200/201 populations; seven dimensions and compliant candidates; booking/source/owner/permission stale reviews; all eleven durable-stage rollback injections; exact lost-response/replay recovery after later head/review advance; Activity completion versus append-only resolution; actor/workspace substitution, offline refusal and time-only expiry. |
| `tests/database/policy-dispositions.test.ts` | Successful 200-impact publication; fresh applicable pin-retaining change and controlled same-order replacement; publication/resolution race. |
| `tests/database/policy-concurrency.test.ts` | Real two-connection barriers and observed `pg_blocking_pids` edges for competing publications, identical original recovery, existing confirm/move/cancel/change acceptance and actual start. Issued file bytes and historic pins remain exact; actual attendance is an explicit exclusion. |
| `tests/database/policy-command-http.test.ts` | Actual authenticated adapters in isolated harness: transport/refusal/no-store, immutable reads, commit followed by destroyed response, original retry recovery and current-caller revocation. |
| `tests/unit/policy-activation.test.ts` | No live app/offline registration or user-selectable activation bypass. |

Failure injection uses test-created PostgreSQL triggers after policy, lineage member, publication, head advance, impact, Activity, Site link, typed Activity junction, audit, receipt and outbox writes. Each failure compares the complete durable graph, including reference counters, against its pre-command state. No runtime failure-injection switch exists. Receipt `task_ids` remains outbox IDs; tests resolve Activities through typed records. Only observed command-level proof is claimed; Step 2 SQL-fixture rollback alone is not command evidence.

## Original failures and corrections

Initial local handler runs exposed fixture defects: legal confirmed-booking clones need crew/reservations and server-assigned display references; version guards correctly refuse rewinding an appointment version. Those fixtures were corrected without disabling constraints. The evaluator initially missed the exact customer agreement retained in initial confirmation's booking snapshot after schedule-version advance; it now consumes that exact accepted contact and separately preserves the controlled move's owned changed-contact plan. No existing booking command behaviour changed.

The first complete concurrency run passed publication/retry/confirm/cancel/start and found Date objects where the command contract requires UTC strings for move/change acceptance. The HTTP child inherited Node's `NODE_TEST_CONTEXT` and refused a recursive runner. UTC serialization and the isolated child environment were corrected. The next transport/concurrency run passed all eight cases with zero skips in 178.2 seconds. Type checking also caught a shadowed evaluator-local variable during a cache optimization; it was renamed before final validation. These failed attempts remain in private logs. The added offline-preservation fixture initially tried to quarantine a Start authority intent; the existing `EvidenceOnly` refusal correctly rejected it. The corrected fixture retains a factual Capture original with its unresolved causal reference instead. Actual start remains a distinct command, and the existing recovery guard is unchanged.

A later proof run overlapped Next's build workers and encountered PostgreSQL connection timeouts. PostgreSQL's private log showed delayed worker starts and aborted client connections while the service remained available. After the build completed, all four disposition cases passed in 127.3 seconds, including 200-impact publication in 60.9 seconds. Connection/test timeouts and database assertions were not changed. The earlier eight core cases passed before that environmental interruption; affected cases were rerun separately.

The unchanged-main comparison recorded four Windows-only full-unit failures (two document-store boundaries, one private-path recovery boundary and one warm-route separator case). The baseline sequential run passed 561 of 565 with zero skips; assertions were retained. Final results below distinguish these environment failures from regressions.

## Review and remaining work

Source self-review found no remaining Step 3 blocker after the recorded corrections. The review covers authorization before receipt disclosure, immutable exact bindings, workspace/resource lock order, fresh complete populations, time boundaries, rollback/recovery, schema/seed upgrade compatibility and absence of activation paths. AD-01's 107 model groups and 40 Chrome 154 browser groups passed after LF regeneration; capture/function verification does not grant owner acceptance. The design register keeps pending review visible.

Next bounded step: Step 4 integrates deterministic future-visit policy selection and committed impact/disposition authority into booking preparation/confirm/move, readiness/actual start and delayed offline original handling; verify together before registering routes. No deployment, external business action, operational policy adoption or full PT-28/PT-30 closure is claimed.
