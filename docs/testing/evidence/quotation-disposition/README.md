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

## Final implementation proof

Application source `b49817a2b0c4dc83015e2488733b3e9e6e03e924` compiled successfully. The reserved native-operation refusal and native replay case, populated-0050 upgrade and fresh registry proof passed 3/3. The original policy upgrade's preserved-ledger slice was corrected from nine to ten additions, retaining the exact `[53,54,55,56,57,58,59,60,61,62]` list. Final HTTP passed 1/1. The final desktop/mobile disposition run passed 7/7 including warm-up, with original/current company/entity keys and unsaved target-switch protection.

Actual PostgreSQL postmaster and application restart passed. Seventeen original release, response, receiving, resolution, plan, conversion, disposition and native receipts recovered and replayed exactly; all four original Draft/issued HTML/PDF files were byte-identical. Snapshot comparisons preserve original source and native records, histories, receipts, audits, outboxes and generated Impact/MaterialAction links. The earlier applied quantity remains exactly `1.375001`, version 2, while a later corrected response holds a subsequent pending review after restart. Checkpoint and retained database remain on task-owned port 5590; no proof database is repurposed.

Final foundation, prototype, naming and studio checks passed. The screenshot-only capture correction replaces a tall element capture (blank clipped space outside the shell's scroll viewport) with real viewport captures; it changes no functional assertion, retry or deadline. Layout inspection, paired visual review and owner acceptance remain different evidence.

## Inspected execution captures

The corrected capture cases passed 2/2 without retries. Unedited [desktop](desktop.png) (1440 × 1000) and [mobile 320 px](mobile-320.png) (320 × 740, emulated touch context) show the actual compiled native comparison. Codex inspected readable source/target quantities and wrapped original/current company/entity keys. The [capture manifest](capture-manifest.json) records exact image and source hashes. This limited layout inspection is not independent paired visual, physical-device, screen-reader or owner acceptance; no live register fingerprint was promoted.

## First PR-head CI and baseline assurance repair

[PR #343](https://github.com/deanrfiedler-gif/powerplants-one/pull/343) first checked head `823ebf792c8ca17120df417f5961b68adfa4ce5b` completed with 24 successful checks and two failures: the primary broad browser lane and its aggregate gate. Linux units passed 582/582; both mandatory isolated PostgreSQL shards passed 442 + 298 = 740 cases. The [dedicated disposition workflow](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37165810333) passed all 13 PostgreSQL, three HTTP, 17 exact restart-recovered original receipts, four unchanged output files and 15 compiled browser cases. The original ES-04–07 workflows passed. The [independent broad compiled lane](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37165810362) passed 570 cases with 79 retained skips, followed by 18 further cases.

The [primary broad lane](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37165810306/job/111328338464) passed 569, failed one and retained 79 skips. Its existing CR05 desktop assertion expected **Open correction** immediately after clicking **Complete customer review**. Retained error context shows **CompleteReview saved** and **Loading the saved revision before the next action**, with the prior Open record still rendered. The command receipt is not the separate completed-record GET. This is a different assertion from the earlier initial-navigation and closure repairs; their evidence remains unchanged.

Comparison used a fresh detached, compiled `a32b3b53` checkout with pinned dependencies, a task-owned disposable database on port 5589 and a separate document directory. Its tracked source remained unchanged. The ordinary original CR05 desktop test passed 1/1. A private copy then delayed only the real `ReviewCompleted` GET response by six seconds: the same five-second **Open correction** assertion failed, with the same saved-command/loading-old-revision state. No response body, receipt, server implementation or permission was replaced. The relevant original test, aftercare implementation, shared resource hook and command hook are byte-identical between main and the first PR head. Original failure, baseline pass and deterministic baseline failure are retained separately; no failed job was retried to obtain a pass.

The bounded test repair observes the exact successful `CompleteReview` receipt and completed-record GET, checks record ID, state and receipt version, then retains the existing rendered **Open correction** assertion. Both viewports deliberately delay the real completed-record response by six seconds. Existing assertion/test/job deadlines, retries, application behavior and CI coverage are unchanged. Subsequent local results and the final-head CI outcome are recorded separately; this first-head failure is not overwritten.

The repaired procedure passed 2/2 on compiled unchanged main, desktop and mobile, with the six-second response delay retained. ESLint, naming and diff whitespace checks passed. Private original evidence is retained as `ci-selected-failure`, `baseline-aftercare-original`, `baseline-aftercare-probe` and `baseline-aftercare-repaired` with their corresponding logs in the task evidence directory. Final PR-head CI is reported in the PR validation comment/body after completion, separately from these local comparison results.
