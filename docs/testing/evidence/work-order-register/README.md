# Work orders backend execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026. Source baseline: `fe7794b` (merged Quotations #450). Branch: `codex/work-orders-backend`. [Contract](../../../decisions/work-order-register-backend.md), [backend plan](../../../delivery/backend-completion-plan.md). Synthetic fixtures only. Independent review, page implementation, owner acceptance and deployment remain separate.

## Executed checks

| Check | Observed result |
|---|---|
| New database scenarios | All 7 have passing execution: lifecycle and immutable successor; earliest active visit and native cancellation; exact evidence/history; company/site/working-company and source permission boundaries; expired/stale readiness; late grant revocation; bounded query/paging/count semantics |
| Existing P04 regression | All 17 have passing execution. The first combined run passed 21/22 (five new cases and sixteen original cases), with one original readiness test timing out at its unchanged 120-second deadline. The control and replay below retain that failure separately |
| Focused unit cases | 3/3 pass: authorisation precedence, exact visit scope/version and strict bounded queries |
| Compiled authenticated HTTP | 3/3 pass: both additive routes, original detail compatibility, no-store, literal/invalid queries, native creation/save/visit receiving, exact receipt replay, 401/403/404 and unsupported POST refusal |
| Static/build | Full lint, TypeScript and compiled build pass. TypeScript and changed-test lint pass after the final fixture correction. Build ID and exact source/test hashes are in the [manifest](manifest.json) |
| Documentation/register | Foundation, PP-01 prototype, naming and live register checks pass. Register: 358 entries, 204 source routes, 330 unreviewed and 28 stale; existing review fingerprints unchanged |

The native lifecycle proofs preserve the original approved snapshot/hash across a successor and reconnect the database client before rereading the saved result. That is connection recovery, not a whole-application or machine restart proof. Normal register/record reads leave work-order/scope/visit/receipt/audit/outbox counts unchanged. The late-authority probe deliberately injects a grant revocation after history is read and verifies refusal and transaction rollback; it is distinct from a real concurrent access-administration workflow.

## Retained failures and corrections

- The first combined 22-case database run passed 21 and hit the existing readiness case's 120,000 ms deadline. An unchanged-main control at `fe7794b` passes that case in 21,163 ms; the candidate replay passes in 20,768 ms. Control source, native test and database runner were byte-compared with Git. The timeout did not reproduce; its cause is not established, and the original failed run is not relabelled as passing. No deadline or assertion changed.
- The first control setup omitted `public/brand/Roboto-variable.ttf` from the extracted main files and stopped in seeding. Main's public assets were restored before the successful control. This setup failure is not a native-test result.
- The first build compiled the application but rejected two TypeScript calls in the new late-revocation test hook. Binding the original query method fixes those calls. The subsequent full build and final type check pass; application authority logic was unchanged by this repair.
- The first expanded eight-case run passed seven and correctly rejected the expiry fixture's attempt to record already-expired Pass evidence. The corrected fixture first uses the native command to accept future-valid evidence, then advances only the test's readiness clock and proves the original saved Pass becomes an expired blocker. After restoring the clock it proves a changed scope invalidates the earlier assessment. The corrected isolated case passes at the unchanged deadline. No native guard was relaxed.

The local environment uses Node 24.21.0/npm 11.19.0 and a separate loopback PostgreSQL instance with a database named `ppo_synthetic_test`, preserving other sessions' databases. Configuration and generated database/output files stay outside tracked source. The live schema through migration 0085 was inspected. An initial schema probe ran before the migration transaction committed and found no tables; it was rerun after successful migration and seed.

## Reproduction and limits

Run database cases serially against the dedicated disposable database; run HTTP only after a fresh reset and the compiled server's successful listen/login check. Keep connection configuration outside Git.

```text
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/work-order-register.test.ts tests/database/work-orders.test.ts
node --import tsx --test tests/unit/work-order-register.test.ts
npm run typecheck
npm run lint
npm run build
node --env-file=.env.local --import tsx scripts/local-server.ts --compiled
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/http/work-order-register.test.ts
```

The final expanded run used the `Work order|non-waivable controls` name filter, followed by the corrected `expired and stale readiness` case. Every new database scenario and all seventeen native cases have passing execution as described above; this is not a claim that the original whole-suite run was clean. New database/HTTP files are discovered by the existing Application assurance globs.

The APIs have no business mutation, migration, seed or permission change. Current candidate-window counts are not global menu totals. Broader business history, external document access, frontend integration, visual review and deployment remain open. The unrelated full database/unit suites, browser/device/visual checks and production capacity were not rerun locally for this backend-only increment. PR CI and independent review remain separate; no operational acceptance is inferred.

## Accepted register implementation — 24 October 2026

Worktree: codex/work-orders-register, based on main 60a7f7b4; draft PR #697. Live Figma inspected: page 193:18953, desktop 196:24111, phone 196:24496, notes 196:24515, toolbar/row/menu and snapshot subframes. Phone P1–P9 and the existing shared shell supersede older retained toolbar geometry. No retained reference bytes changed. Exact Pro icons use the existing private Kit under ADR-0050; public/offline fallback glyphs remain distinct from licensed visual fidelity.

Implementation replaces card presentation with native filtered counts/grid, attention views, page selection/export/sequence and source-labelled snapshots. Native command rules remain unchanged. Missing states are adaptations requiring owner review. Review fingerprints remain untouched.

Validation ledger (in progress): three register unit tests passed. An initial full typecheck was interrupted without a result; the bounded-memory rerun is pending. First isolated database reset failed at the unchanged 10-second statement deadline while the shared workstation had approximately 1 GB free memory; no assertion/timeout was relaxed and no baseline attribution is made. Retry, database/HTTP/browser proofs and matching captures remain pending.
