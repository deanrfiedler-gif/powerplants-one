# PT-23 controlled output generation and recovery

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Execution date: 10 October 2026. Independent and owner review pending. [Scope decision](../../../decisions/controlled-output-recovery.md). Selected parent acceptance: AT-36; outputs OUT-09, OUT-10 and OUT-14. The original thirty-case catalogue and all 78 parent requirements remain unchanged.

The two long-output journeys pass. All eight retained PDFs (89 pages) pass automated content, footer and geometry checks and have an [every-page technical inspection record](page-review.md). Independent visual and owner acceptance remain pending, including the recorded sparse-page and split-row observations. All 12 recovery scenarios pass on test checkpoint `79dc341a28ed182846029a6a3e851c3b67eff04a`, with no skipped cases.

## Source and observed failures

Main later advanced to `ad45a520ae4b42144e2a18c92507bac1c72b4711` with four documentation-only icon-decision changes. Merge `f646ab3` preserves that decision and this status entry; application and test sources are unchanged.

The isolated branch starts at main `e5a94730025cf7a1ad4c1d0b1450532f591dba32`. Test checkpoints `f1a33bf` and `770b845` leave application runtime unchanged. Tests initially used an adapter-read outage; the strengthened joined sequence physically corrupts the exact task-owned bundle and restores its original bytes in `finally`.

1. OUT-09 verified storage before finalisation but did not reread it immediately before inserting the issue. The physical corruption challenge retained an `Issued` job and issue despite the wrong stored version. The correction adds the same final bundle check already present for reports and Finance.
2. OUT-14 classified `TemplateUnavailable` as a transient `Failed` attempt. After a renderer change was observed, restoring the renderer and retrying released the earlier attempt without a fresh review. The correction classifies that observation as `StaleSource`, matching the other selected output families.

No renderer, supported template definition, installed seed, migration, capability or UI source is changed. Old template definitions and previously issued bytes remain unchanged.

## Verification boundaries

The recovery matrix uses current PostgreSQL schema, real domain commands, actual Chrome HTML/PDF generation and the private synthetic document adapter. Each family joins failed storage, actual bundle corruption, a trigger-raised exception inside the issue transaction, unchanged concurrent retries and late duplicate recovery. It checks the original reserved identity/input, byte hashes, one issue/receipt/audit/outbox and recipient/presentation/distribution effects. Source, installed v1-to-v2 policy and renderer-fingerprint changes are challenged separately.

Two long journeys exercise both supported templates through actual pack preparation/check/issue, per-technician acknowledgements, personal capture, Service review/issue and separately reviewed/reconciled synthetic Finance output. They contain long customer/site names, 24 findings, eight material records and nine Finance allocations. Four distinct confidential markers are excluded from both HTML and extracted PDF text. Version-1 issued originals remain exact after selection of version 2.

The twenty-asset Service report variants are **unissued render-only pagination fixtures**. They challenge the table renderer without claiming those assets formed authorised work or Finance sources. Their manifests state that limitation. Automated glyph-bound, page-footer and content checks supplement every-page visual inspection; they do not confer PDF/UA, accessibility, owner or operational acceptance.

Local environment: Windows, Node 24.21.0/npm 11.19.0, PostgreSQL 16.15 and the installed supported Chrome. All database work is confined to the task-owned `ppo_synthetic_test` cluster and private files outside Git. `max_locks_per_transaction=512` permits full-schema resets; database durability settings are unchanged. This is logical rollback/retry and exact-file verification, not a power-loss or live-provider test.

The first reset run hit the default PostgreSQL lock limit after one passing sequence. A subsequent 120-second local run retained four passing pack cases before a reset-heavy case timed out; it was stopped. Targeted baseline and subsequent local runs use a 300-second per-test limit. No application deadline, performance target or CI command was changed.

The existing document-store unit tests initially reject Windows' short temp-path alias on unchanged application code. A canonical task temp directory allows the write-once/hash case to pass; this host still denies creation of the symlink needed by the other existing case (`EPERM`). No permission or filesystem guard was weakened. The remaining focused report/Finance units pass; retained command results distinguish this environment limit from the PT-23 failures.

Original [page hashes](page-checks.json), generated HTML/PDF pairs and [every-page observations](page-review.md) are retained here. The supported Chrome is version 155; exact application/test source hashes and command results are recorded in the verification manifest. CI, independent review, owner observations, merge, deployment, live SharePoint and operational Finance remain separate.

## Completed execution

| Check | Result | Retained evidence |
|---|---|---|
| Unchanged-main physical corruption challenge | Failed as expected: pack incorrectly Issued | [baseline](baseline-physical.txt), [actual job/effects](baseline/pack-corrupt-before-release.json) |
| Unchanged-main targeted final-read and restored-renderer challenges | Both failed as expected; Finance incorrectly Issued on retry | [baseline](baseline-targeted.txt) |
| Three-family joined recovery matrix | 12/12 pass; no skipped cases | [TAP](final-recovery.txt), family-named job/attempt/effect JSON files |
| Both installed-template long journeys | 2/2 pass | [TAP](long-pages-corrected.txt), OUT-prefixed original HTML/PDF/manifest files |
| PDF extraction, hashes, glyph bounds and footers | Eight documents, 89 pages, no check failures | [results](page-checks.json), [log including parser warnings](pdf-checks.txt) |
| Every-page technical inspection | Completed; pagination refinements recorded | [observations and exact PDF hashes](page-review.md) |
| Application build including TypeScript | Passed on corrected application source | [build](build.txt) |
| Changed TypeScript lint | Passed | [log](changed-lint.txt) |
| Existing affected database regressions | 4/4 pass: pack concurrency/render failure and Finance stored-output recovery/revoked owner | [TAP](existing-regressions.txt) |
| Studio, naming and prototype checks | Passed; existing 28 stale and 322 unreviewed design records remain visible | [studio](studio.txt), [naming](naming.txt), [prototype](prototype.txt) |
| Focused existing document-store, report and Finance units | 6 pass; one Windows symlink EPERM environment failure | [log](focused-units-canonical-temp.txt) |

The document store, its existing unit tests and all renderer/template sources remain byte-identical to main. The unit limitation was observed before the runtime correction and is not attributed to this change. The main baseline remains available at the named commit; no guard or test was disabled.

## Reproduction

Use a private environment file for the documented local synthetic runtime and a disposable database named `ppo_synthetic_test`. Set `PPO_PT23_EVIDENCE_DIRECTORY` to a private directory outside Git. Run the database files serially; the recovery suite temporarily changes the renderer fingerprint and restores it in `finally`, so do not build or run another renderer suite concurrently.

```text
node --env-file=<private-env> --import tsx --test --test-reporter=tap --test-concurrency=1 --test-timeout=300000 tests/database/controlled-output-recovery.test.ts
node --env-file=<private-env> --import tsx --test --test-reporter=tap --test-concurrency=1 --test-timeout=300000 tests/database/controlled-output-pages.test.ts
python scripts/check-controlled-output-pages.py <evidence-directory> --pdftoppm <installed-pdftoppm>
```

The larger timeout describes this local host only. Existing CI retains its command, serial file execution and 120-second limit; both new files are discovered by its database wildcard. PDF inspection dependencies remain local review tools. Retained text logs and JSON use LF line endings; logs have trailing whitespace removed; original generated HTML/PDF bytes are unchanged. Artifact and source SHA-256 values are in `verification.json`.
