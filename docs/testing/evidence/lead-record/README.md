# Lead record backend execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Execution date: 12 October 2026. Scope: private synthetic backend. [Contract](../../../decisions/lead-record-backend.md). Branch `codex/lead-record-reads`, based on PR #451 at `d02b2583cd6784d596b5a5bb69ff0a8db21c38d4`. Implementation source: `b7509820b2d40026aab6aeb79c7f52fe5e73de27`. [PR #452](https://github.com/deanrfiedler-gif/powerplants-one/pull/452) is stacked on #451; neither merge nor deployment is inferred.

## Executed verification

- Seven new PostgreSQL record-read cases pass. They cover native conversion receiving, saved versus resolved context, lifecycle changes, owner/company/workspace isolation, hidden linked history, relationship/permission movement and a detail read waiting for native activity completion. Exact business-table snapshots show no read-created effects.
- Across the four Leads database suites, 34 of 36 cases passed in the initial batch. The existing LC-12 ownership-transfer case and LC-11 late-outbox rollback case exceeded the unchanged 120-second deadline while the machine was under memory pressure. Both passed in isolation with the same source, assertions and deadline (37.9 seconds and 23.2 seconds). Thus all 36 cases have passing execution, but the original batch is retained as 34 pass / 2 timeout. No assertion or deadline was weakened. No unmodified-main comparison was needed after the unchanged isolated replays passed.
- All four historical Leads/Projects integration cases pass. Every original Lead field, receipt and migration ledger remains exact. The added observation/age fields are checked separately; the 0018 pipeline/context eligibility change is explicitly asserted rather than discarding readiness comparison.
- Five focused unit tests pass: two summary time/order cases and three existing Lead parser cases. Full TypeScript, full lint and the final changed-file lint pass.
- Foundation, naming, prototype and studio checks pass. Foundation retains all 78 parent requirements and 22 issued sources. Studio reports 358 entries, 330 unreviewed and 28 stale; no review fingerprint is changed.
- The complete Next.js build passes, including TypeScript. All three compiled HTTP cases pass (the new record journey and both register regressions), proving the actual route, no-store, native plan/complete/convert receiving, stale-version rejection and denied-scope responses. [Source manifest](manifest.json) records exact source hashes and the build ID; [results](results.json) retain passed and failed checkpoints.

The first build was deliberately interrupted during local memory pressure; it is not counted as a pass. An initial PostgreSQL launch using its default listener was unavailable; the retained private cluster started on its explicit loopback test port. The first HTTP attempt ran before the compiled listener was ready and all three cases received ECONNREFUSED. After the listener reported ready, the unchanged three cases passed. The foreground server and owned PostgreSQL test cluster are stopped after verification.

The initial test-authoring attempt had a missing array bracket and the first TypeScript pass found closure-based state narrowing in the new preview. Both were corrected before final verification. The first six new database scenarios then passed before the seventh concurrency case and broader suite were run. These development checkpoints are retained in tool history and private local logs, without connection strings or operational data in this repository.

## Boundaries

No UI composition, browser/device review, hosted deployment or business acceptance is claimed. Grouped history, other customer work and email/file integrations remain outside this increment. The full application database estate and full unit suite are left to contribution CI; local proof is scoped to Leads and its historical integration. The existing list DTO and source-command semantics are retained. The conversion guard extraction is exercised by both the new preview and existing native conversion regressions.

At the implementation source `b750982`, contribution CI reported 36 successful checks, 13 in progress and one optional skip, with no failures at that observation. This is not a final CI pass and the documentation evidence commit has its own head. CI is separate from local checks and must be read against its exact head. A source pass does not establish visual review or production readiness.
