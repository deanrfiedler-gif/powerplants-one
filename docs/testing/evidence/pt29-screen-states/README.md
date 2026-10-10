# PT-29 screen-state execution

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 10 October 2026 (Australia/Brisbane). Review: implementation self-review; independent technical/visual review and owner acceptance remain pending. [Scope decision](../../../decisions/pt29-screen-state-verification.md), [fifteen-screen checklist](../../pt29-screen-states.md), [original procedure](../../prototype-acceptance.md#pt-29--honest-empty-error-and-partial-states).

## Source and environment

The primary execution uses test source `8f632cbc7e518513d8d1ba60d1de6e0a6ab70e7d`, integrating main `8869437` / PT-01. Application source matches that main revision: this contribution changes tests and documentation only. The compiled build ID, source tree, exact run counts/durations and result-file hashes are in [verification.json](verification.json). The capture recheck adds scrolling and full-viewport assertions for upload errors/retry controls and empty results. Its exact source is listed below; the application and other test cases are unchanged. Subsequent evidence/disposition edits change neither application nor test behaviour.

Local Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63.0 and Chrome 155.0.8059.40. The task owns an isolated loopback `ppo_synthetic_test` database and document directory. All records, roles, responses and files are synthetic. Desktop uses 1440×1000; phone uses 390×844 emulation. Existing narrow-width checks also run in the retained recovery and overview cases. My Work's existing dedicated server fixes its read clock; browser timers continue normally.

## Final result

Thirty browser scenarios pass with zero retries, skips or failures, plus the 672-route warm-up. After capture placement was tightened, the four affected upload/matrix cases pass again on `dd9573158e6c13cf964ee93655ffa5e90c74de05`; both retained matrix files come from that recheck. The selected suite, two overview runs and capture recheck remain separately identified in `verification.json`; earlier failed attempts are retained below.

## Proof boundaries

- [Desktop matrix](desktop-matrix.json) and [phone matrix](mobile-matrix.json): each of the fifteen screen families has populated, loading, failed, recovered, empty/unavailable and actual Systems-denial evidence. The populated label comes from the browser's actual GET; request queries and denied status are retained.
- Real persistence boundaries: invalid customer save followed by successful retry; identical disposition retry after a lost accepted response, with one saved disposition and unchanged original envelope/hash; photo upload failure leaves a real Pending attachment, then recovers the one original and verifies its exact bytes; concurrent Finance cancellation rejects the stale command with 409 and preserves safe input; complete/partial/failed account extractions never infer missing totals.
- Existing work-order, planner and pack-source cases retain invalid/stale input and original state. The My Work overview selection includes each suite's fixture-building case before its failed-read/recovery/limited-authority case.
- Read 503s, empty projections, unavailable-detail projections and renderer states are injected presentation challenges. The renderer case uses the retained synthetic pack fixture, with an explicit failed retry and StaleSource status; it is not a claim about worker rollback or provider recovery. PT-23 owns those boundaries.

The broad authored SC-15 administration catalogue is implemented only as its owned recovery window. Unsupported configuration publication, external distribution or receiving actions are not invented. A 404 detail is not an empty success record; a missing account extraction is not a zero balance. The original PP-01 SC IDs here are distinct from the later Supply module's SC page keys.

## Retained failures and corrections

The initial source `70786b7` passed 16 of 19 checks, including route warm-up. Two cases chose weekend fixture dates and correctly hit the published working-interval guard; the desktop matrix also looked for an account header key in the body. Working-day fixtures and a visible transaction-row assertion correct the drivers without weakening application checks.

At `78c0f0b`, both complete matrices passed; the combined run passed 25 of 27 checks. The new output test matched three legitimate “Output recovery needed” labels. Scoping it to the visible Job pack panel fixes the strict-locator failure. A separate two-viewport check passes after that correction.

The first standalone desktop overview runner timed out at its unchanged 120-second server-start deadline. The first standalone phone recovery selection lacked the preceding serial fixture and therefore had no overdue row to recover. Final sequential overview runs include the fixture cases. Original result hashes and dispositions are preserved in `verification.json`; failed attempts are not erased or described as application regressions. No timeout, calendar rule, permission or expected result is relaxed.

The first phone upload capture showed part of the error behind fixed timer controls; the first planner empty capture showed only the filters above the result. The four-case recheck scrolls the actual error/retry and empty-result elements into view and requires full viewport intersection before capturing. This is a test/evidence refinement, with no page or style change.

## Capture and review boundary

[captures.json](captures.json) inventories original capture hashes and the retained representatives. Adjacent JSON preserves original source/head/tree, viewport/full-page flag, byte count and hash. All 14 retained representative images were inspected at their original bytes; observations are recorded in the inventory. Representative images are retained under `captures/`; raw browser results and traces remain in the private task evidence directory. CI's existing focused P11 step runs these cases and retains its own original artifacts when this PR executes.

State and overflow assertions are functional observations. Representative visual inspection checks that the documented state is visible and understandable; it does not update accepted design fingerprints or grant independent visual review. The design register retains its existing unreviewed/stale entries.

Catalogue defaults, all 78 parent requirement IDs, AT-23's wider performance/accessibility obligations, physical-device observation, owner-led PT-30, production readiness, merge and deployment remain separate.

## Repository checks

Build, final TypeScript, changed-file ESLint, studio, foundation, prototype and naming checks pass; commands and original log hashes are retained in `verification.json`. The final runs have no test retries or recorded transient transport retries. Studio retains 322 unreviewed and 28 stale entries.

The naming check exposed an existing 8,012-character instruction file in integrated main. Two phrases were shortened without changing instruction meaning, bringing it to 7,999 characters; the earlier failure and passing rerun remain identified. No runtime change was required.

## Reproduction

Use the pinned dependencies, a completed compiled build and an isolated `ppo_synthetic_test` with the current migrations/seeds and a task-owned document directory. Supply the loopback synthetic environment privately to the test process; the launcher inherits it. Reset only that disposable database between the primary run and capture recheck. The overview fixtures own the second-company scenario and run sequentially. These are the exact Playwright selections at the recorded source:

```text
--config=playwright.compiled.config.ts tests/browser/quality-states.spec.ts tests/browser/quality.spec.ts tests/browser/work-orders.spec.ts:77 tests/browser/planner.spec.ts:304 tests/browser/job-pack-source-print.spec.ts:190
--config=playwright.compiled.config.ts tests/browser/my-work.spec.ts:36 tests/browser/my-work.spec.ts:325 --project=desktop-chromium --no-deps
--config=playwright.compiled.config.ts tests/browser/my-work-mobile.spec.ts:51 tests/browser/my-work-mobile.spec.ts:480 --project=mobile-chromium --no-deps
--config=playwright.compiled.config.ts tests/browser/quality-states.spec.ts --grep "all fifteen screen families|failed photo upload" --no-deps
```

Each run uses `--reporter=list,json`, a distinct output directory and `PLAYWRIGHT_JSON_OUTPUT_NAME`; `PPO_SOURCE_HEAD` records the exercised checkpoint. The primary selection includes the unchanged route warm-up. The capture recheck only repeats the two affected tests in each viewport. Existing test and server deadlines remain unchanged.
