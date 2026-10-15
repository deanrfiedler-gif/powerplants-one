# DK-03 register facts execution evidence

Owner: Dean Fiedler. Synthetic backend increment, 15 October 2026. Base `41c8479a0aa4ff8eeebec5efb66712c95ecc8874`; isolated `codex/output-register-facts`. Decision `89b2f02` precedes implementation `88e659c0894dc70863bf4e41d63ec7210f267957`. [Decision](../../../decisions/output-register-facts.md), [contract](../../../contracts/output-register.md).

The additive projection binds revision numbers to native exact revisions and counts only visible recipients with exact actor/hash acknowledgement evidence. Existing current-source, company, crew, final-authority and read-only boundaries remain. Service Reports retain frozen recipient facts without an invented acknowledgement result.

Focused source lint and diff whitespace validation passed. Two full local TypeScript attempts were interrupted under concurrent machine load; neither is counted as a pass. Database, compiled HTTP, full application checks, documentation assurance and independent automated review remain pending CI at this checkpoint. Tests extend the existing native register suites for partial/all acknowledgement, separate crew denominators, no issue, current draft versus earlier issue, successor isolation, historical/withdrawn facts, both output families and zero writes. Existing privacy, missing-byte, revocation and bounded-count tests remain intact.

No persistence or permission changes; no new migration/seed/grant, stored summary, framework or service. The native UI is unimplemented. Operational acceptance, CI, independent review, merge and deployment are separate from local checks. No actual delivery, customer communication or financial authority is claimed.

## Integrated main

PR #498 merged externally at `d070a61ff17e04ffa0f0d37c16052c24a0bb0e26` after this contribution began. The integration preserves both STATUS entries and the upstream CPQ implementation, migration 0102, historical-upgrade assertions and evidence. The register implementation is unchanged; integrated-head CI and independent review remain separate gates.

## Failure investigation and upstream reconciliation

At exact head `3c8535b570b19b8ddc802c8d91a245a6de058488`, Code Review diagnostics reported 52 successful checks, three failed checks (two lanes and their aggregate), and the intentional PT-27 skip. The dedicated actions, outputs and register jobs passed, as did the separate compiled mobile lane. Independent review was clean at [6187580031](https://github.com/deanrfiedler-gif/powerplants-one/pull/500#issuecomment-6187580031). This is not technical readiness.

[Application run 38703525600](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38703525600) retained the original failures. Database job 116317187426 returned a 120,000-character truncated cleanup tail through Code Review; artifact 11960808463 retained PDF and transport evidence but no test transcript. The failed assertion therefore remains unidentified at this checkpoint. Mobile job 116317187546 passed 394 tests and skipped 74 project-inapplicable cases; CR05 timed out at `captureSizes` while capturing the closed record, followed by a trace-recording fixture timeout. No failed business assertion was reported. Neither failure is labelled a baseline failure without reproduction.

Upstream #499 merged externally at `a676fde58d2ee88878bb2f9489912c97f49636b3`. Its exact source `25a07ad34c90de37c0ca1b6bbd1b26c015ad5703` completed every applicable check successfully, including database-2 and mobile. Its single PT-27 skip remains intentional. That comparison establishes a passing upstream run, not reproduction or root cause of #500 failures. Reconciliation retains both decisions, status entries, register entries and source changes. No PR is merged by this work.

Before changing CI retention: use Node’s existing TAP reporter in addition to its console reporter for every native database shard. Store the transcript in the existing redacted evidence artifact. Keep serial execution, four shards, all tests, assertions and deadlines, and the native nonzero exit unchanged. This addresses the demonstrated missing diagnostic artifact; it does not claim to fix an unidentified runtime defect. No new dependency, service or persistence is justified. A fresh exact-head run and independent review must verify the integrated result.

The reporter retention change was checked with an intentional assertion failure outside the repository: the console reported the failure, TAP retained `not ok` and `# fail 1`, and Node exited 1. This is harness validation only. Original exact-head check states are retained in [pr500-original-ci.json](pr500-original-ci.json).

## Identified failures and controlled comparisons

The [failure follow-up](failure-follow-up.json) supersedes the earlier unidentified-database checkpoint. Code Review's retained PostgreSQL tail confirms error 57014 while executing `0001-recover.sql`; the signed-in GitHub job view identifies `products-upgrade.test.ts:41`, the reset before the version-100 upgrade. The shard passed 387 other tests, including all six output-register cases. The original failure remains retained; no timeout or assertion is weakened.

Unchanged main `a676fde` and candidate `9c22a10` each passed the four populated Products upgrade cases from 99, 100, 101 and 102 on PostgreSQL 16.15, preserving exact originals, duties, ledgers and repeat-run stability. These eight results use the unchanged 10-second statement and 120-second test limits. The failure did not reproduce; passing comparisons do not establish its root cause or prove the entire shard.

The mobile artifact contains the screenshot/trace timeouts and no failing business assertion. CR05 passed in 1.7 minutes both on unchanged upstream `25a07ad` and on the same original #500 head `3c8535b` in its separate full compiled-mobile lane. The timing failure is intermittent; no product fix is justified by these observations alone. Every mobile assertion, viewport capture and timeout remains intact.

Focused ESLint passed at `9c22a10`. Documentation foundation and naming checks passed at their recorded checkpoint. Independent review of `9c22a10` was clean at [6190956565](https://github.com/deanrfiedler-gif/powerplants-one/pull/500#issuecomment-6190956565), with no review threads. Fresh exact-head CI was still queued at this checkpoint. This is not technical readiness; final CI and review must bind the latest head. The diagnostic retention repair preserves the original failing exit and allows a recurring database failure to be examined without relying on the truncated runner log.
