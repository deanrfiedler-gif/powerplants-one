# ES-07 completed conversion disposition evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 4 October 2026. Source implementation, automated proof, inspected layout, independent visual review, owner acceptance and deployment are separate.

## Starting evidence and environment

Refreshed main `a32b3b53c45bdc74061f3612c15d71c0544504d8` merges [#342](https://github.com/deanrfiedler-gif/powerplants-one/pull/342). GitHub confirms final head `2edcf91dab9245c4ead866920463ce902fabe267`, 25 successful checks and merge at `2026-10-03T23:19:41Z` (4 October Sydney). Downloaded final-head job logs confirm 580 units and PostgreSQL shards 377 + 350 = 727 cases. Both broad browser logs independently confirm 564 passed and 79 retained skips each (48.5 and 50.8 minutes). The original conversion ledger retains its earlier local/checkpoint wording; this reconciliation supersedes pending-merge statements without rewriting the evidence.

Worktree `codex/quotation-disposition` is isolated from the original checkout and unfinished Excel import. New task-owned loopback PostgreSQL 16 on port 5589 contains only `ppo_synthetic_test`; a separate task-owned retained restart cluster uses port 5590, and the compiled application uses port 3089. Live schema was inspected at 0061 before allocating 0062. Retained earlier databases are not reset or repurposed. Task logs/checkpoints live outside Git in a dedicated Codex temporary directory.

## Execution record

The first ten-case disposition database run passed five and failed five. The failures exposed JSON snapshot numeric quantities becoming JavaScript numbers: two exact-string assertions failed and three native-revision fixture calls rejected numeric inputs. Snapshot queries now preserve numeric quantities as exact decimal strings before JSON transport; the strict native quantity validator is unchanged. No retry or deadline was added. Subsequent results and final-head CI are recorded below when completed.

The first compiled build passed. Current final-source build, tests and CI remain separate until recorded. The first environment bootstrap used an incomplete synthetic connection URL and was refused before migration; the corrected task-owned disposable configuration migrated/seeded main successfully. No retained database was touched.

## Boundaries

Only original native Supply Demand targets are in scope. Retain, continuing Hold and eligible positive Forecast quantity revision are synthetic decisions. Approval thresholds, respondent/signing authority, validity/expiry, withdrawal, item governance and ERP mappings remain Not configured. No replacement conversion, cancellation, zero quantity, deletion, procurement, work release, live integration, message, merge or deployment is included. Exact accepted native reference images are unavailable; functional captures do not establish owner, physical-device, screen-reader or paired visual acceptance.

Executable coverage: `tests/database/quotation-disposition.test.ts`, `tests/http/quotation-disposition.test.ts`, `tests/browser/quotation-disposition.spec.ts`, `tests/unit/quotation-disposition.test.ts`, and `scripts/quotation-disposition-restart.ts`. The dedicated workflow retains actual restart and compiled desktop/mobile evidence. Original ES-04–07 workflows, both isolated mandatory PostgreSQL shards and both broad compiled browser lanes remain enabled with their existing deadlines and assertions.

## Completed local checks

- Second disposition PostgreSQL run: 10/10 passed after the decimal transport correction. Expanded final cases and final native-operation reservation checks are recorded separately below.
- Focused regression run: 53/53 passed across ES-04 review, ES-05 release, ES-06 response, original ES-07 conversion, Supply/custody and hosted-demo upgrade. Populated ES-05/06/07 upgrade assertions retain all previous evidence.
- Compiled HTTP: 3/3 passed (new disposition, original conversion, original response). The first attempted invocation reached the server before it was listening and failed with ECONNREFUSED; the next invocation first verified HTTP 200. No test retry setting changed.
- Full unit run on Windows: 579/582 passed. The two private-document-store cases and one private-recovery-directory case failed. All three reproduced in an unchanged detached `a32b3b53` checkout with the same pinned dependencies (1/4 passed in those two files). No assertion was weakened; Linux final-head CI remains the authoritative all-unit result.
- Compiled build, ESLint and TypeScript passed. Studio check passed: 330 entries, 37 components, 19 runnable examples; all 330 page and 37 component reviews remain pending. Foundation/prototype checks preserved all 78 requirements. Naming passed at 7,975 instruction characters after correcting its length/required-path failures. The first studio attempt named a test file as a source dependency; the unsupported dependency was removed, retaining the explicit test evidence in prose.

Final-head CI is not implied by these local results. The pull request checks and its final validation comment record the exact head, mandatory database shards and both broad browser outcomes. No queued or running result is a pass.

The expanded disposition PostgreSQL run passed 13/13, including maximum six-place quantities, forged direct-SQL refusal, downstream allocations/source edits, owner revocation, atomic rollback, concurrent effects and the populated 0061 upgrade. The compiled host plus shared component catalogue passed 15/15 (six desktop/mobile disposition cases, eight catalogue cases and warm-up). Final display and reserved-native-command changes receive their own subsequent proof; these counts do not silently inherit it.
