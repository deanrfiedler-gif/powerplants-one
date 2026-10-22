# Conversations T2d verification evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executor: Codex, working for Dean. Date: 22 October 2026. Status: in progress, independent review/acceptance pending. [Design](../../../decisions/conversations-t2d-design.md), [ADR-0061](../../../decisions/ADR-0061-local-claude-adapter.md), [draft PR #664](https://github.com/deanrfiedler-gif/powerplants-one/pull/664).

## Environment and boundaries

Dedicated worktree from main `002af00e4e19e9aa0d12f83d36199bebe6572a1b`. Actual npm install, Node 24.22.0/npm 11.19.0, no engine override. PostgreSQL 16 cluster owned by this contribution, loopback port 51447, database `ppo_synthetic_test`, max_locks_per_transaction=1024, 64 MB shared buffers, disposable durability disabled. Minimal ignored test configuration was written afresh; no other environment/credential file was copied or read. PC free memory was approximately 2.1–2.8 GB; heavy checks run serially. Services are stopped at handover.

Provider tests use the actual pinned SDK with unmistakably dummy credentials and an injected transport. Global fetch and Node HTTPS are blocked in those files; the HTTPS transport's own proof intercepts `https.request`. No live provider request or real-key inspection. Documentation/registry requests are separate from provider execution.

## Test-first and current proof

- Test-first unit file was written before the adapter. First restricted launch failed in tsx's `uv_os_get_passwd` (ENOMEM); rerunning outside the launcher restriction reached the intended missing-module failure. No application assertion had run in the restricted launch.
- Initial adapter unit file: 12/12 passed. Logging/SDK-default and inclusive-reasoning-usage additions brought the assistant subset to 34/34. Further transport checks are recorded at final validation.
- Persisted SDK integration: 7/7 passed. A real conversation service post queues a turn; concurrent existing worker runners dispatch the actual SDK once through mocked transport; PPO validates/persists the immutable answer/citations and settles 1234 input/123 output tokens to 3698 micro-USD. Human ask remains Open. Original post replay, worker replay and pool close/reopen cause no duplicate turn/request/answer.
- Further persisted cases prove fresh reservations for each of three known-malformed retries (176000, 172302, 168604 micro-USD); known usage settlement after invalid citations/unsafe text/access loss; fixed refusal body; Unknown retention/no retry for sent errors or unsupported billing categories; unsent credential failure releases; competing turn refused at the ceiling before transport; P3 reason privacy and no answer/key/error payload in audit/receipts/outbox/ledger.
- First 8 GB typecheck found two contribution-owned TypeScript narrowing/test-function-signature errors. Both were corrected before the next check. No assertions or deadlines weakened.

## Local checks before implementation push

- Assistant unit subset: 38/38 passed, including owned HTTPS restrictions, returned-model mismatch, actual SDK timeout and exact allowance boundaries; a further invalid-status transport defence is being checked.
- Full serial unit inventory at that checkpoint: 1033 tests, 1030 pass, 3 fail. The two document-store cases fail with ExactDocumentUnavailable and recovery's path case expects /outside Git/ but receives Unsafe recovery directory. Both files were rerun in a clean detached worktree at unchanged main 002af00e4e19e9aa0d12f83d36199bebe6572a1b with its own npm ci: the identical three failures reproduce (1 pass/3 fail), and git status stays clean. Subsequent focused additions do not replace this full-inventory result.
- 8 GB typecheck and full-tree lint pass. The typecheck also caught one new fixture missing NODE_ENV; corrected before the passing run.
- Runtime dependency audit: zero vulnerabilities. Full locked-tree audit gate passes with the existing documented braces exception; no new exception.
- Generated status/index check, naming, foundation and studio:check pass. Studio reports 340 unreviewed and 26 stale entries; no visual review was performed or credited. Foundation retains all 78 parent IDs.

Affected database, HTTP, ordinary/compiled browser, build, final checks and complete CI results remain to be recorded after execution. A mocked response is not evidence of live-model factual accuracy, latency, tokenizer behaviour or provider billing. The explicit input-overhead headroom is conservative engineering, not a measured provider token count; T2e must calibrate it. No visual/business acceptance is claimed.
