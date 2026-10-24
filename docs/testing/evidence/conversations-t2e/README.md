# Conversations T2e offline evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executor: Codex. Date: 23 October 2026. Status: offline contribution in [PR #679](https://github.com/deanrfiedler-gif/powerplants-one/pull/679); Claude review of 99721da6 received via Dean; author disposition below; no live-call/cost authority or result. [Plan and gate register](../../../decisions/conversations-t2e-evaluation.md), [operator chapter](../../../delivery/conversations-t2d-local-adapter.md), [contract](../../../contracts/conversations-t2b.md).

## Environment and evidence classes

Dedicated managed worktree/branch codex/conversations-t2e-offline from main d3ccc0b79f8182fb1cd1498196f4aa2564818c0a. Shared checkout was not edited, switched or stashed. Node 24.22.1/npm 11.19.0, locked dependency install with task-owned empty npm config files; no dependency/lockfile change. Owned PostgreSQL 16 cluster on loopback 51479, database ppo_synthetic_test, disposable durability disabled, max_locks_per_transaction=1024. Test-only database identity/password are unmistakably dummy. Document storage is task-owned and outside Git.

Provider tests use actual SDK 1.1.0 with injected mocked transport and fixed dummy keys. Global fetch/HTTPS are blocked; the owned HTTPS proof intercepts https.request. No real credentials, environment/secret files or provider accounts were inspected. No live Messages, Models, token-count, validation or other provider request was made.

- **Simulated:** existing deterministic adapter/unit/database regression; zero API cost.
- **Actual SDK / mocked transport:** request options, all three fixed models, both refusal discriminators, inclusive thinking, safe metadata, transport/guard/cancellation cases.
- **Persisted synthetic integration:** real human post/queued turn/worker, checked answer/citations, ledger, audit/receipts, replay/reopen, run caps/stage/stop/source gates.
- **Live model:** none. No actual tokenizer/overhead, provider billing, grounding quality or latency measurement.

## Reproducible proof

Use the repository's normal Node test runner against an owned disposable ppo_synthetic_test with fresh explicit synthetic configuration. Do not source another contributor's environment or reuse a provider credential. The provider files install network blockers before every test path. Start an explicitly synthetic test child without inherited NODE_USE_SYSTEM_CA, OPENSSL_CONF, custom-CA/debug/key-log settings or corresponding Node flags; never inspect/dump the parent environment or change machine trust. Node's isolated test children can inherit --use-system-ca from their launcher, and the unchanged T2d guard correctly refuses it before key access. Claude reported 15 provider-test failures with that inherited setting under default isolation and 48/48 passes with --test-isolation=none. That alternate run is separate evidence, not a reason to weaken the guard or claim default isolation passed in that shell; the author did not reproduce the reviewer's parent-shell condition.

- node --import tsx --test --test-concurrency=1 tests/unit/assistant*.test.ts
- node --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/assistant*.test.ts
- 8GB TypeScript check, full-tree ESLint, existing documentation/status/naming/foundation/prototype checks.
- Existing full runtime/locked-tree dependency audit gates, with no new exception or package change.

assistant-evaluation.test.ts proves: all three model prices and inclusive reasoning; numeric/fixed-enum persistence without raw text; nine-calibration acceptance before main; one worker turn per invocation and model filtering before batch limit; calibration single call; retained Unknown after HTTP rejection/pool reopen; ten repetitions of two concurrent turns in one Node process (database-lock proof, not a multi-process test); immutable manifest/missing configuration/persisted stop; prior-month commitments/calibration cap; missing/unsupported billing and underestimated input; credit-exhausted outcome/TLS pre-key refusal; approved-evidence mismatch; source and derived Project changes; suppressed late answer after stop. Existing assistant tests cover P1/P3/access changes, citation safety, limits, replay, immutable answers, full monthly ledger and schema/upgrades.

## Execution ledger

Checkpoint: assistant unit subset **48/48 passed**, including five new evaluation unit cases. First persisted SDK/evaluation subset **15/15 passed**; expanded evaluation subset **10/10 passed** before evidence-hash and single-invocation refinements. Full affected database regression and final checks are recorded below after completion; earlier green counts do not stand in for the final changes.

Two local setup/test corrections remain visible: the first document storage path was inside Git, so seeding refused ExactDocumentUnavailable before tests; using owned storage outside Git fixed setup. A new derived-Project test incorrectly assumed saveTask leaves the Project row version unchanged; the canonical task service increments it. The fixture was corrected to add a RAID entry (a derived aggregate change without that row-version increment). This is a test-fixture correction, not a claimed baseline failure or weakened source guard.

Local completion results (the exact delivery head and CI disposition are recorded in the PR ledger):

- **48/48 assistant unit tests passed** again after the implementation refinements.
- The complete affected assistant database inventory ran **74 cases: 73 passed and the one new Project fixture failed** as explained above. The corrected actual-SDK/evaluation subset then passed **21/21** (318.8 seconds), including all 12 evaluation cases. A final focused rerun passed **1/1** after preserving FeatureOff on an unconfigured runtime-Claude path; its dummy-key getter was never read. All 74 distinct database cases therefore have passing coverage across these runs, not a claimed single green 74-case rerun.
- Final 8GB typecheck, full-tree lint plus affected-file lint after the last edit, and application build passed. Carl was explicitly off during the build; no worker/server was launched by that compile check.
- A last self-inspection found the smaller run cap was reusing the accepted UI's specifically monthly BudgetSpent reason. It now uses generic ProviderUnavailable, with no UI change. The two affected cap/concurrency cases passed **2/2** afterward; this reason-only refinement did not require another full build. Self-inspection is not independent review.
- Foundation, naming, prototype, status sources/generated view, migration numbering, documentation scope and all **22 documentation regressions passed**. All 78 parent requirement IDs remain. Generated views remain ignored; protected landing pages are unchanged.
- Development-register integrity passed; **342 unreviewed and 26 stale** entries remain visible. No visual/owner acceptance was performed or credited.
- Runtime dependency audit: **zero vulnerabilities**. Full locked-tree gate passed with the existing documented braces exception only; no new exception or dependency change.
- Full repository unit/database/HTTP/browser inventories were not repeated locally. The affected suites above and compile checks cover this contribution; complete GitHub inventories are separate. At reviewed head 99721da67f28d9726ade8f3d186b044c8b9880e0 they subsequently completed: **72 check runs, 71 successful and one intentional PT-27 skip**, verified through GitHub on 23 October 2026. All eight general database shards, ordinary browser and compiled browser groups passed ([application run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39920427499), [compiled run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39920427417)). This is reviewed-head evidence, not CI for later corrections.

The task-owned PostgreSQL cluster was stopped after validation. Claude's subsequent independent review and the author's disposition are recorded below. Existing T2d historical CI is separate from this contribution's checks. No real credentials were inspected and no live API calls were made.

## Independent review and author disposition — 23 October 2026

Dean supplied Claude's independent review of commit **99721da67f28d9726ade8f3d186b044c8b9880e0** in this task. Claude reported source/test/catalogue/documentation inspection, 48/48 local assistant unit passes with isolation disabled, naming/status passes, and no local database execution. The reviewer identified the cap wording as the sole merge blocker; other findings concerned operational readiness and recommendations. This is a user-supplied review, not a fabricated GitHub review/comment or a claim that Claude reviewed later corrections. The author verified the findings against the reviewed code and current GitHub checks.

| Finding | Verification and disposition |
|---|---|
| 1 — cross-run allowance overclaim | **Accepted and corrected.** evaluation.ts queries member ledger state and binds the run ID/manifest. Same-run or reused-member rebinding is refused; entirely fresh messages under a new run ID receive new caps and do not inherit earlier Unknown/failure/stop gates. Plan, operator chapter and PR description now distinguish these controls from Dean's per-run approval and procedural prohibition on evasion. No workspace-wide gate is implemented or claimed. |
| 2 — manifest-less worker consumes queued members | **Accepted; runbook corrected.** turns.ts selects all Queued turns without a manifest, and commands.ts can end them as FeatureOff or start Simulated. Require a dedicated synthetic evaluation database and exclusive manifest-configured worker use from materialisation to final disposition. No durable reservation marker has been added. |
| 3 — nullable metadata ends calibration | **Verified; strict policy retained.** SDK 1.1.0 declares geo/speed/tier nullable; turns.ts requires explicit expected values after recordCall. Known representable usage settles and Missing stops the run. Null is not silently relabelled standard/global. The plan now requires acknowledgement of this first-call risk before calibration; any policy change needs a separately documented correction and offline proof. |
| 4 — stop helper is not an operator control | **Accepted; operational limits corrected.** stopEvaluation has no script/route, requires a bound turn and actorAccess, and uses a SKIP LOCKED lookup. Cease invocations first; that alone cannot suppress an in-flight answer. A successfully recorded stop suppresses posting; termination can leave Unknown for lease recovery. No access bypass or new stop endpoint is introduced. |
| 5 — no envelope/manifest preparation tool | **Verified; remaining corpus gate.** Existing hashing/buildEnvelope functions have test callers, but no operator exporter exists. Before instance approval, review a reproducible offline procedure or tested read-only helper, with correct tagger/working-company context and fitted bounds for C03/L12. No tool or approved instance inventory is claimed delivered by this correction. |
| 6 — catalogue is not machine-checked | **Verified; remaining corpus gate.** Manifest unit tests do not validate the source JSON catalogue against parent requirement IDs or excluded-sentinel placement. Require these checks during offline instance preparation; a catalogue validator remains recommended implementation work. Human review of gold/source mappings remains necessary. |
| Source freshness | Confirmed: preflight hash binds membership/coverage; dispatch/post only re-read included source versions/fields. The plan now states this limit explicitly. Full membership/coverage freshness and stale/refresh UX remain the specification §6 gap. |
| Haiku tier | Official pricing rechecked 23 October: the low tier ends at 100,000 prompt tokens; current per-turn aggregate input is 48,000. Added a pricing-source comment requiring limit/tier review together; no prices or limits changed. |
| Clean-tree check | Confirmed tracked-status check omits untracked files and is not protection against Git assume-unchanged/skip-worktree or operator administration. Content binding is not owner approval or attestation of an untrusted checkout. |
| Call ceiling | Clarified 657 as the conservative six-call arithmetic ceiling, not expected billed calls or reachable retry slots. Sent unknown errors stop immediately; known malformed output has two retries. Preserve the accepted six-call bound rather than claiming a tighter general limit without proving all access/retry paths. |
| Test isolation / race wording / CI | Documented the inherited-CA test prerequisite and reviewer-reported limitation above. Ten races means ten two-turn in-process races. Verified the reviewed-head 71-pass/one-skip CI inventory; later-head checks remain separate. |

The corrective pass changes documentation and one explanatory pricing comment only. No adapter, accounting, access, stop or test behavior is changed. Documentation validation and the exact correction commit/CI are recorded in the PR. No application/database/provider tests are repeated for this prose/comment correction. The reviewed-head application evidence above remains the relevant behavior proof.

The review and disposition are recorded in the PR description and this evidence record. No formal GitHub review submission or later independent pass is claimed. That review grants no merge permission, calibration authority, live result or Dean acceptance. Current policy does not automatically require independent re-review after every correction; no waiver is invented. Dean subsequently authorised following CI, fixing failures and merging once all required checks pass, as recorded in the [merge-authority fragment](../../../status/2026-10-23-conversations-t2e-merge-authority.md). The earlier draft-only restriction is historical; calibration and live evaluation remain unauthorised. Final-head CI and merge outcome are recorded on PR #679, separately from reviewed-head evidence.

## Safe retained artifacts

The [T2E-SYN-01 catalogue](../../../../tests/fixtures/assistant/t2e-cases.json) is proposed synthetic source material, not an approved instantiated run. Do not manufacture a live result from the mocked payloads. A later run needs Dean's approved canonical instance inventory, exact gold source/claim mappings, evidence hashes and private manifest/approval references.

Retain numeric token/byte/duration/cost measurements, fixed outcomes, model/price/commit/case/repetition/hash references and scored assertions. Raw requests/responses, provider headers/errors/identifiers, thinking/signatures, credentials and full environment dumps never enter logs, receipts, audit events or public diagnostics. Only specifically reviewed synthetic answer/oracle artifacts may enter an evaluation record; do not publish full local test logs or database dumps. Preserve failed-attempt history and Unknown reservations. No reset or release is a permission to retry.

Planning delivery, code merge, execution permission, live result, Dean's acceptance and production readiness remain separate claims.

## Offline corpus preparation — 24 October 2026

Owner: Codex for Dean, [draft PR #686](https://github.com/deanrfiedler-gif/powerplants-one/pull/686), dedicated branch/worktree `codex/conversations-t2e-preparation`. This follows Dean's explicit offline-preparation instruction. No credentials inspected, no live API calls, no worker execution, no merge or deployment.

The [operator chapter](../../../delivery/conversations-t2d-local-adapter.md#offline-corpus-preparation-and-review) describes the catalogue validator, canonical builder, read-only exporter and repeat verification. The [plan](../../../decisions/conversations-t2e-evaluation.md#offline-corpus-preparation--24-october-2026) records fixture corrections and retained approval gates. All emitted cases and gold bindings are proposed review material.

Validation is in progress. The initial local dependency tree lacked the merged SDK, so no test assertions ran in that attempt; pinned dependencies were installed in this worktree without lifecycle scripts. Initial fixture failures exposed the site's required UTC validity instant and per-instance ERP external-key uniqueness; both were corrected without changing domain validation. PostgreSQL's default lock capacity could not reset the current full schema; only the owned cluster was restarted with 1024 locks per transaction. A new full-matrix test initially exceeded its two-minute deadline; it now has its own fifteen-minute bound for 117 independent samples and repeated verification. No existing timeout/assertion is weakened. Final results and proposed artifacts follow when verified.
