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

Final head, integrated main, CI disposition and owned-service shutdown belong to the PR execution ledger. No independent review is claimed. Existing T2d historical CI is separate from this contribution's checks.

## Safe retained artifacts

The [T2E-SYN-01 catalogue](../../../../tests/fixtures/assistant/t2e-cases.json) is reviewed source material, not an approved instantiated run. Do not manufacture a live result from the mocked payloads. A later run needs Dean's approved canonical instance inventory, exact gold source/claim mappings, evidence hashes and private manifest/approval references.

Retain numeric token/byte/duration/cost measurements, fixed outcomes, model/price/commit/case/repetition/hash references and scored assertions. Raw requests/responses, provider headers/errors/identifiers, thinking/signatures, credentials and full environment dumps never enter logs, receipts, audit events or public diagnostics. Only specifically reviewed synthetic answer/oracle artifacts may enter an evaluation record; do not publish full local test logs or database dumps. Preserve failed-attempt history and Unknown reservations. No reset or release is a permission to retry.

Planning delivery, code merge, execution permission, live result, Dean's acceptance and production readiness remain separate claims.
