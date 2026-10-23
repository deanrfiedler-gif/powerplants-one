# Conversations T2d verification evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executor: Codex, working for Dean. Date: 22 October 2026. Status: Claude review received at 829ae67c; findings corrected; Dean authorised merge subject to checks on 23 October 2026; no subsequent independent review claimed. The final execution ledger and exact-head CI disposition are maintained on the linked draft PR; this source records the reproducible proof and checkpoint evidence. [Design](../../../decisions/conversations-t2d-design.md), [ADR-0062](../../../decisions/ADR-0062-local-claude-adapter.md), [draft PR #664](https://github.com/deanrfiedler-gif/powerplants-one/pull/664).

## Environment and boundaries

Dedicated worktree from main `002af00e4e19e9aa0d12f83d36199bebe6572a1b`. Actual npm install, Node 24.22.0/npm 11.19.0, no engine override. PostgreSQL 16 cluster owned by this contribution, loopback port 51447, database `ppo_synthetic_test`, max_locks_per_transaction=1024, 64 MB shared buffers, disposable durability disabled. Minimal ignored test configuration was written afresh; no other environment/credential file was copied or read. PC free memory was approximately 2.1–2.8 GB; heavy checks run serially. Owned services must be stopped at handover; completion is recorded in the PR execution ledger.

Provider tests use the actual pinned SDK with unmistakably dummy credentials and an injected transport. Global fetch and Node HTTPS are blocked in those files; the HTTPS transport's own proof intercepts `https.request`. No live provider request or real-key inspection. Documentation/registry requests are separate from provider execution.

## Test-first and current proof

- Test-first unit file was written before the adapter. First restricted launch failed in tsx's `uv_os_get_passwd` (ENOMEM); rerunning outside the launcher restriction reached the intended missing-module failure. No application assertion had run in the restricted launch.
- Initial adapter unit file: 12/12 passed. Logging/SDK-default and inclusive-reasoning-usage additions brought the assistant subset to 34/34. The final adapter subset at the source checkpoint is 39/39, including transport bounds, returned-model mismatch and real SDK timeout cancellation.
- Persisted SDK integration: 7/7 passed. A real conversation service post queues a turn; concurrent existing worker runners dispatch the actual SDK once through mocked transport; PPO validates/persists the immutable answer/citations and settles 1234 input/123 output tokens to 3698 micro-USD. Human ask remains Open. Original post replay, worker replay and pool close/reopen cause no duplicate turn/request/answer.
- Further persisted cases prove fresh reservations for each of three known-malformed retries (176000, 172302, 168604 micro-USD); known usage settlement after invalid citations/unsafe text/access loss; fixed refusal body; Unknown retention/no retry for sent errors or unsupported billing categories; unsent credential failure releases; competing turn refused at the ceiling before transport; P3 reason privacy and no answer/key/error payload in audit/receipts/outbox/ledger.
- First 8 GB typecheck found two contribution-owned TypeScript narrowing/test-function-signature errors. Both were corrected before the next check. No assertions or deadlines weakened.

## Local checks before implementation push

- Assistant unit subset: 39/39 passed, including owned HTTPS restrictions, invalid empty-body status handling, returned-model mismatch, actual SDK timeout and exact allowance boundaries. Native Node HTTP/TLS debug/key-log settings were added to the guard test first; it failed on credential access, then passed after the guard correction.
- Full serial unit inventory at the later d6291228 checkpoint: 1038 tests, 1035 pass, 3 fail. The two document-store cases fail with ExactDocumentUnavailable and recovery's path case expects /outside Git/ but receives Unsafe recovery directory. Both files were rerun in a clean detached worktree at unchanged main 002af00e4e19e9aa0d12f83d36199bebe6572a1b with its own npm ci: the identical three failures reproduce (1 pass/3 fail), and git status stays clean. The final nested-usage refinement subsequently passed the 39-case assistant subset and all seven persisted SDK cases; exact-head full checks are identified in the PR ledger.
- 8 GB typecheck and full-tree lint pass. The typecheck also caught one new fixture missing NODE_ENV; corrected before the passing run.
- Runtime dependency audit: zero vulnerabilities. Full locked-tree audit gate passes with the existing documented braces exception; no new exception.
- Generated status/index check, naming, foundation and studio:check pass. Studio reports 340 unreviewed and 26 stale entries; no visual review was performed or credited. Foundation retains all 78 parent IDs.

- After integrating main ab2142d12cce947483c8425c16e640e37f06e90e, all 22 documentation regressions, documentation scope, source generation, foundation, naming and prototype checks pass. Tracked status/index landing pages are unchanged; generated views are ignored.
- The first CI audit attempt on implementation head dfb5775d failed because npm's advisory endpoint returned HTTP 503 after five minutes. An unchanged rerun passed. This was an unavailable audit result, not a vulnerability finding or an exception.

## Later local execution and final usage refinement

The focused database run completed 36 passing cases before free RAM fell to 569416 KB; the owned test/queued validation processes and PostgreSQL cluster were stopped. After memory recovered, the remaining files passed 52/52, including three repeats: **85 distinct affected cases passed**, including both managed-template manifest cases. This is focused local coverage; the full local database inventory was not run under that observed resource constraint. Complete eight-shard CI remains separate.

The compiled Conversations HTTP suite passed 10/10. Controlled Chrome 156.0.8078.48 with Playwright 1.64.1 passed its offline renderer check. Compiled desktop/mobile Conversations passed 56 with seven existing viewport skips. The ordinary run reached its unchanged 900000 ms all-route warm-up deadline: one failed setup and 62 unrun browser cases. The unchanged-current-main comparison and its result belong to the PR ledger; no baseline classification is assumed here. Next's automatic tsconfig formatting/type-path edit was restored after its server stopped.

A final test-first case exposed acceptance of an unknown nested output_tokens_details category. The validator now permits only the documented inclusive thinking_tokens detail. The assistant subset passes 39/39 after the change; all seven actual-SDK persisted cases pass again (106.2 seconds), including full Unknown reservation retention and one dispatch for the new category, and an explicit raw-question leakage assertion. Known reasoning still settles once through the inclusive output total. No API call, new schema or additional billing representation was introduced.

The runtime/full-lock audit gate also hit npm HTTP 503 on the later d6291228 CI attempt; its unchanged rerun passed. Both unavailable audit attempts remain in GitHub history. No advisory exception was added.

## Exact-head execution ledger

The [draft PR #664](https://github.com/deanrfiedler-gif/powerplants-one/pull/664) records the final head, integrated main, full local unit outcome, affected database/HTTP/browser/build counts and complete required CI/database/compiled-browser group results after those runs finish. Check that exact head rather than treating an earlier green checkpoint or skipped docs-only job as implementation proof. Keep failed attempts and confirmed baseline comparisons in that ledger. No test deadline, inventory, assertion or production guard is weakened.

Reproduction uses the repository's normal scripts: an owned disposable PostgreSQL 16 database with the configuration above; serial tests/database/assistant*.test.ts and conversations*.test.ts plus template-manifest-drift; the real service/worker proof in assistant-claude.test.ts; Conversations HTTP and ordinary/compiled Playwright suites with only the owned port changed in ignored launcher configuration; 8 GB typecheck, full-tree lint, full unit inventory, build and both dependency gates. Every provider test intercepts networking. Resource-limited local coverage must be distinguished from all eight CI database shards. A mocked response is not evidence of live-model factual accuracy, latency, tokenizer behaviour or provider billing. The explicit input-overhead headroom is conservative engineering, not a measured provider token count; T2e must calibrate it. No visual/business acceptance is claimed.


## Claude review corrections — 22 October 2026

Independent review [received from Claude](https://github.com/deanrfiedler-gif/powerplants-one/pull/664#issuecomment-6339292849) at 829ae67c: two actionable findings, no secret-leak/retry/ledger-integrity defect found. Codex verified and accepted both findings. Corrected code is not independently accepted merely because these tests pass.

Test-first evidence: four red tests covered the existing long-history projection exceeding its allowance, missing bundled CA pin, environment overrides and command-line overrides reaching credential access. After correction, the expanded assistant subset passed 43/43. Two further red assertions established truthful history-limit footer rendering and omission of the unnecessary speed option before those changes. No real key was inspected and no provider request was made. Tests use dummy credentials, block global fetch/HTTPS, and intercept HTTPS only for the owned transport proof.

The expanded persisted suite adds the runner's default adapterFor(env) path through the actual SDK and anthropicHTTPS, intercepting only https.request, with reservation, concurrent-worker, replay/reload, citation and settlement assertions. A long-thread case verifies oldest-first fitting, additional fitting on known-malformed retry, separate reservations and preserved reader-visible omission grammar. Transport byte cap, mid-response abort and stream errors are tested as sent/unknown. Non-global billing metadata and fast usage fail closed. Execution results and final-head CI belong to the PR ledger after completion; earlier checkpoint counts are not evidence for this correction.

Expanded persisted actual-SDK suite: **9/9 passed** (343.9 seconds) on integrated main 612ebecbfc328a20a035b71c363729f3223efe7f. This includes the default factory/owned HTTPS path and long-history retry case above. The broader regression run and exact-head CI are reported separately in the PR ledger.
