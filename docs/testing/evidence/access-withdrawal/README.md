# AD-01 request withdrawal evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: implemented with passing local coverage across the recorded runs; CI, independent security, visual/owner acceptance and deployment separate.

[Contract](../../../decisions/access-request-withdrawal.md). [Draft PR #423](https://github.com/deanrfiedler-gif/powerplants-one/pull/423), branch `codex/ad01-request-withdrawal`, starts at PR #417 `2e69c4caad0dbdaa5f298d62d1b41fb03e40f7c3`. Initial stack inspection found no reviews/comments and no #417 failures, with CI still running. Earlier parent failures matched corrections already in #417. The parent subsequently advanced to `8800193ba9551ac3562dfce230568ff426464cfc`; merge `e71e93507f8e29082ac4a84e2cdbcfb4be4f6a79` incorporates its repaired stack and accepted design records. LC-12/LC-13 keep the parent's original-ledger boundary plus exact added version 0081. The parent later advances to `2579bd9ab895477a86e7dc811fc2fe358f0b424b` with documentation-only Sales briefs/Cost sources records; those are also merged. Runtime, migrations and tests are unchanged by that second update, and documentation assurance is rerun. This task does not own parent integration or deployment.

## Scope and sources

Only the original requester with current local Workspace read/propose duties can withdraw an un-applied Submitted or Approved version. Closure retains proposal/approval, adds exact audit/receipt evidence and releases the pending tuple. It changes no grant or identity; a fresh proposal needs its own dates and independent decision. Migration 0081 has no seed. The hosted upgrade gate was reviewed for this schema-only closure; hosted commands remain refused.

Database source: `1e4eec78a983be30cecf6a7217f84565bc752570`. UI reason-control correction: `257af99`; integrated runtime source: `e71e935`; capture source: `e00f6a2`. Later documentation and test corrections retain their own Git history. Private configuration, credentials, application logs and raw job output stay outside Git. Database suites use only `ppo_synthetic_test`; browser fixtures use separate disposable `ppo_synthetic` on loopback. Assertions and normal connection/SQL timeouts are unchanged.

## Preserved failures and corrections

The first two withdrawal runs reached the new populated-0080 fixture's 120-second limit before request identities or withdrawal assertions; dependent cases then lacked those identities. Neither run is a pass. The fixture now declares a 300-second setup/test ceiling; the successful third run actually completes all nine checks in 87.6 seconds. It proves exact users/grants/audit/operations and historical ledgers, repeat migration/seeding, both source states, actor/current-duty restrictions, immutable evidence, races, rollback and original recovery. The separate unmodified-main `ba1f4e3` fresh-installation probe passes one check; this is a baseline observation, not proof of the timeout's cause.

The first existing request-suite run passes 12 checks but fails two after a database connection timeout in its direct-evidence guard check and final snapshot. FI-07's selected historical case also reaches the unchanged 120-second limit. DR01-DB03 also fails its setup hook at 120 seconds, E2 reaches the SQL timeout while resetting its historical fixture, and both Lead integration cases time out. All these selected cases pass unchanged isolated replays, with the same existing 120-second test limit. The two integrated LC-12/LC-13 ledger cases pass on the merged source. [Run ledger](validation-results.json) and [isolated ledger](isolated-results.json) retain their exact source, selection and exit status. Low available memory was observed during the first block; that is not an established cause. No failure is erased or recast as a first-run success.

The first browser block's new reason-focus assertion assumes direct field focus. The actual shared control first focuses the error summary and offers a field link. The corrected test follows that link, then verifies the withdrawal field receives focus, alone has the error, and the independent application reason remains unchanged. Runtime focus behaviour is not changed to satisfy the assertion. That corrected run passes desktop/narrow but its phone handover reads the queue before navigation completes. The test now waits for the exact saved URL and detail heading before reading status. The final two-case phone replay passes it and the unchanged older role-comparison case that timed out in the first block. Thus the first block has 47 passes/four failures, the corrected three-case block has two passes/one failure, and the final phone block has two passes. All 51 distinct scenarios have passing coverage; this is not a single clean first run.

## Recorded checks

[Machine-readable checks and artifact hashes](checks.json) preserve individual outcomes. [Validation profile](validation-profile.json) records the pinned local runtimes and unchanged replay limits. Text logs are normalised to UTF-8/LF with trailing whitespace removed; the original local output remains outside Git.

| Check | Passing coverage |
|---|---:|
| New withdrawal database cases | 9 |
| Existing request/application database cases | 29 |
| Selected historical upgrade cases, including merged LC-12/LC-13 | 14 |
| Hosted upgrade cases | 5 |
| Native browser scenarios at 1440, 390 and 320 px | 51 |
| Selected role/navigation/migration-registry unit cases | 12 |
| Retained access-review model assertions | 107 |

The 14 historical cases are three Products paths (25, 80 and 81, including reserved 0052), FI-01, FI-07, two policy cases, two E1 cases, E2, two Lead integration cases and LC-12/LC-13. This increment does not claim a rerun of all 61 historical cases from the previous application increment or the full repository suite. Other migration pins are updated and remain subject to CI. Build, final type checking and changed-source/test lint pass. The retained browser script is not rerun here; its prior evidence remains separate.

[Nine captures and hashes](captures.json) identify the exact source and viewport. The [page comparison](../../../design/development/pages/route-admin-access-requests-id.md#withdrawal-continuation) records implementer inspection and the visible limitations. Capture inspection is not an acceptance decision.

Studio, foundation, prototype and naming checks pass. The register retains 358 entries, 42 components, 330 unreviewed entries, 28 stale reviews and 42 pending component reviews. Documentation assurance preserves all 78 parent requirements; it does not grant business or visual acceptance. Both task-owned temporary services are stopped.

The [pre-publication CI snapshot](pre-publication-ci-checkpoint.json) is tied to `1053c3f`, with checks pending and no review feedback. The [final parent checkpoint](parent-final-checkpoint.json) identifies fresh parent `2579bd9`, for which checks were not yet reported; that is not a passing CI result. Later publication-head CI remains separate.

## Design and remaining work

The native closure deliberately differs from the retained simulated Draft/Submitted/Returned administrator workflow: it closes Submitted/Approved requests for their original requester only. Secondary action/neutral closed status and separate record forms remain exposed adaptations. The existing page is refined in the running app under ADR-0053; no new Figma page or accepted design is asserted.

Accepted native desktop/mobile mockup images, physical-device, zoom, screen-reader, independent security and owner review remain open. Teams, campaigns, installed-grant revocation/editing and operational D-020 remain open. All 78 parent IDs and issued reference bytes remain unchanged relative to the receiving parent. No hosted grant authority, external integration or deployment is added.
