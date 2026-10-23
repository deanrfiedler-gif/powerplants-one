# Conversations T2e offline evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executor: Codex. Date: 23 October 2026. Status: offline contribution in [draft PR #679](https://github.com/deanrfiedler-gif/powerplants-one/pull/679); different-model review pending; no live-call/cost authority or result. [Plan and gate register](../../../decisions/conversations-t2e-evaluation.md), [operator chapter](../../../delivery/conversations-t2d-local-adapter.md), [contract](../../../contracts/conversations-t2b.md).

## Environment and evidence classes

Dedicated managed worktree/branch codex/conversations-t2e-offline from main d3ccc0b79f8182fb1cd1498196f4aa2564818c0a. Shared checkout was not edited, switched or stashed. Node 24.22.1/npm 11.19.0, locked dependency install with task-owned empty npm config files; no dependency/lockfile change. Owned PostgreSQL 16 cluster on loopback 51479, database ppo_synthetic_test, disposable durability disabled, max_locks_per_transaction=1024. Test-only database identity/password are unmistakably dummy. Document storage is task-owned and outside Git.

Provider tests use actual SDK 1.1.0 with injected mocked transport and fixed dummy keys. Global fetch/HTTPS are blocked; the owned HTTPS proof intercepts https.request. No real credentials, environment/secret files or provider accounts were inspected. No live Messages, Models, token-count, validation or other provider request was made.

- **Simulated:** existing deterministic adapter/unit/database regression; zero API cost.
- **Actual SDK / mocked transport:** request options, all three fixed models, both refusal discriminators, inclusive thinking, safe metadata, transport/guard/cancellation cases.
- **Persisted synthetic integration:** real human post/queued turn/worker, checked answer/citations, ledger, audit/receipts, replay/reopen, run caps/stage/stop/source gates.
- **Live model:** none. No actual tokenizer/overhead, provider billing, grounding quality or latency measurement.

## Reproducible proof

Use the repository's normal Node test runner against an owned disposable ppo_synthetic_test with fresh explicit synthetic configuration. Do not source another contributor's environment or reuse a provider credential. The provider files install network blockers before every test path.

- node --import tsx --test --test-concurrency=1 tests/unit/assistant*.test.ts
- node --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/assistant*.test.ts
- 8GB TypeScript check, full-tree ESLint, existing documentation/status/naming/foundation/prototype checks.
- Existing full runtime/locked-tree dependency audit gates, with no new exception or package change.

assistant-evaluation.test.ts proves: all three model prices and inclusive reasoning; numeric/fixed-enum persistence without raw text; nine-calibration acceptance before main; one worker turn per invocation and model filtering before batch limit; calibration single call; retained Unknown after HTTP rejection/pool reopen; ten admission races; immutable manifest/missing configuration/persisted stop; prior-month commitments/calibration cap; missing/unsupported billing and underestimated input; credit-exhausted outcome/TLS pre-key refusal; approved-evidence mismatch; source and derived Project changes; suppressed late answer after stop. Existing assistant tests cover P1/P3/access changes, citation safety, limits, replay, immutable answers, full monthly ledger and schema/upgrades.

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
- Full repository unit/database/HTTP/browser inventories were not repeated locally. The affected suites above and compile checks cover this contribution; complete GitHub inventories remain separate and were still running at the implementation checkpoint.

The task-owned PostgreSQL cluster was stopped after validation. No independent review is claimed. Existing T2d historical CI is separate from this contribution's checks. No real credentials were inspected and no live API calls were made.

## Safe retained artifacts

The [T2E-SYN-01 catalogue](../../../../tests/fixtures/assistant/t2e-cases.json) is proposed synthetic source material, not an approved instantiated run. Do not manufacture a live result from the mocked payloads. A later run needs Dean's approved canonical instance inventory, exact gold source/claim mappings, evidence hashes and private manifest/approval references.

Retain numeric token/byte/duration/cost measurements, fixed outcomes, model/price/commit/case/repetition/hash references and scored assertions. Raw requests/responses, provider headers/errors/identifiers, thinking/signatures, credentials and full environment dumps never enter logs, receipts, audit events or public diagnostics. Only specifically reviewed synthetic answer/oracle artifacts may enter an evaluation record; do not publish full local test logs or database dumps. Preserve failed-attempt history and Unknown reservations. No reset or release is a permission to retry.

Planning delivery, code merge, execution permission, live result, Dean's acceptance and production readiness remain separate claims.
