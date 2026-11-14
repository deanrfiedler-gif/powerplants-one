# Warranty to Supply return receiving evidence

Source: [PR #945](https://github.com/deanrfiedler-gif/powerplants-one/pull/945), `codex/warranty-supply-receiving`, owned by Codex. Synthetic local data only. [Contract](../../../contracts/maintenance-warranty-api.md#warranty-to-supply-return-receiving).

## Review corrections — 14 November 2026

Read [Dean's instruction 6848501977](https://github.com/deanrfiedler-gif/powerplants-one/pull/945#issuecomment-6848501977) and [Claude's full review 5885392190](https://github.com/deanrfiedler-gif/powerplants-one/pull/945#pullrequestreview-5885392190). [Claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/945#issuecomment-6869255640). The dedicated worktree integrated main `4cd33a0b1f307defd03855e8620b02b011b35d83` in merge `31359cfa1afa6406498d11df86f19e9f01b32494`, with no conflicts. The reviewed contribution at `9e634df7` and its post-merge contribution have the same stable patch ID, `eb04fd3089205469a2163003453ae2b7c6dcb99d`. Both the C1 reviewed agreement charge schedules section and the adjacent Warranty receiving chapter retain their proper sections. No prior PR change was altered by integration.

Fix commit `a0e72bb1734a853de2c78bdf01636c8c058312f4` changes only the two findings and their proof/contract/decision. The existing native revision transaction refuses a bridged demand's customer or asset change with `409 SourceReviewRequired`. The read independently detects a mismatch with the retained claim customer/case asset. Facility is not a bound identity in this bridge. A rejected native authorisation now yields `AuthorisationRejected` when there is no receipt, subject to the existing incomplete/unknown evidence precedence. No migration, capability, grant, dependency, cancellation or other receiving behaviour is added. Repository search found no separate SC-08 stage type/label list or guide/register enumeration: the Warranty page renders source values generically.

Cloud setup succeeded with Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15 (`ppo_synthetic_test`); browser unavailable. The setup environment was sourced in each later shell. Executed with the unchanged 120-second database deadline and no retries:

- **Before any fix, after the main merge: 22/22 bridge and Supply database cases passed.** [Merge baseline](review-merge-database.txt).
- **Three new cases failed against the unchanged merged runtime**, reproducing the missing identity refusal, undetected demand drift, and false Prepared stage. No prior assertion was changed. [Negative control](review-defects-before.txt).
- **After the fixes: 25/25 bridge and Supply cases passed.** Separate null customer/asset changes, combined clearing and a different same-site asset are refused without effects; unrelated next-action/required-date changes persist. Direct SQL with live database guards simulates legacy customer/asset drift and proves `ReviewRequired`. Proposed → Rejected proves the explicit stage, zero receipt and unchanged claim/customer outcome. [Fixed proof](review-fixed-database.txt).
- **MA-02/MA-07: 3/3 passed.** [Regression](review-maintenance.txt).
- **Unmodified main control: 58/58 assistant unit cases passed** at `4cd33a0b1` in its own detached worktree. The previously reported 15 T2d/T2e failures did not recur. A first restricted-sandbox invocation reported only six file-level successes without individual cases; it is excluded from coverage. The normal execution environment ran all 58. [Main control](review-main-assistant.txt).
- **`npm run check` passed**, including studio integrity, full ESLint, TypeScript, **1,457/1,457 units** and production build. [Application summary](review-application.txt).
- **Compiled HTTP: 3/3 passed**, covering the bridge and existing Maintenance and Supply scenarios against that production build. [HTTP proof](review-http.txt).
- **Foundation, naming, status, migration registry, prototype and 44 documentation unit tests passed.** [Documentation results](review-documentation.txt). No assertion, retry or deadline was weakened.

The [current SHA-256 manifest](review-source-sha256.txt) binds the runtime, helpers, tests, contract and decision to fix commit `a0e72bb1734a853de2c78bdf01636c8c058312f4`. Subsequent documentation/evidence and the browser-test synchronization below leave those sources unchanged. The reproduction commands below remain applicable; the main control used `node --import tsx --test tests/unit/assistant*.test.ts` in the unmodified main worktree, and the pre-fix negative control selected the three added test names against merge `31359cfa1` before changing runtime code.

Final-head CI and the current-main merged-tree check are recorded on the PR; local passes do not replace them. Branch-protection settings could not be read with the current integration (`403 Resource not accessible by integration`), so no new observation of the configured required set is claimed. Browser/device/owner acceptance, full TS-05 and a new real-database restart were not run in this correction pass. The earlier restart proof remains historical. Nothing is merged or deployed; only confirmation of Claude's two findings is requested.

### CI reload synchronization

The first correction head, `d81a46ebe90e9efbbecfd309df7e240690f1b4bc`, failed one existing Engineering Materials browser assertion in [P01–P11 browser proof](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/43541156132/job/132281828786): immediately after reload, the menu had not yet received its asynchronous count. The original 5-second assertion expected `Substitution review 2`; the retained [post-failure snapshot](review-ci-materials-reload.png) and [error context](review-ci-materials-failure.txt) already show the expected badge `2`. That desktop invocation passed 412 cases, skipped nine and failed this one. Engineering Materials runtime and browser-test sources were identical to main `4cd33a0b1`, whose [Application assurance run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/43396621657) passed.

The [continuation claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/945#issuecomment-6870128469) covers a test-only synchronization repair: register the exact new frame request before reload, verify its successful response and await its body before the unchanged menu assertions. No existing assertion, retry count or timeout changes. No application behaviour changes. Changed-file ESLint and TypeScript pass; the unavailable local browser leaves execution to fresh CI on the new head. No failed job was rerun, and no infrastructure fault is claimed. The retained review artifact excludes raw Playwright traces; the snapshot establishes eventual correct rendering, not a measured request duration. [Investigation and source hashes](review-ci-materials-source.txt) identify the downloaded artifact and the repaired test.

## Initial implementation verification — 13 November 2026

The disposable environment was prepared with `scripts/cloud-setup.sh`: Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, database `ppo_synthetic_test`. The script reports database ready and browser unavailable. No renderer is needed by the bridge or its database cases.

- **22/22 database cases passed:** all 11 existing `supply.test.ts` cases and 11 new `warranty-supply-return.test.ts` cases, serial, unmocked, unchanged 120-second test deadline. Coverage includes exact current source/delivery identity, competing operations, no duplicate effects, native remaining-delivered limits, original receipt recovery, failed-write rollback, permission revocation/history redaction, external-history preservation, partial receiving, disposition, unknown-outcome reconciliation and independent customer/Finance state.
- The first run exposed missing native delivery evidence in the new fixture (2/10 passed); the fixture was corrected to execute native allocation, pick, stage, dispatch and delivery. The bridge now explicitly requires a current complete delivery fact. The next run passed 8/10; test-only corrections use the actual `valid_to` permission field and `InvalidTransition` refusal code. The subsequent ten-case run passed before the unknown-outcome case expanded coverage to eleven. No native guard or deadline was weakened.
- **3/3 existing Maintenance/Warranty regression cases passed** (MA-02 and MA-07). [Result](maintenance-regression.txt).
- **`npm run check` passed:** studio register, full ESLint, TypeScript, **1,450/1,450 unit tests** and production Next build. After the final bounded source changes (the native handover URL and `ExternalEvidenceOnly` marker), changed-file ESLint, TypeScript and production build passed again. The final **11/11 bridge database cases** also passed again. [Final bridge result](bridge-database.txt) · [combined 22-case run](supply-regression.txt).
- **3/3 compiled HTTP cases passed:** the new bridge scenario plus existing Maintenance and Supply route regressions. This verifies foreign-origin refusal, current authority, exact replay/content conflict, both original receipt endpoints, permission-scoped detail and a successful HTTP response from the native receiving handover page. Initial HTTP runs exposed two test assumptions: the loopback gateway returns text on foreign-origin refusal, and Supply returns 403 when the other workspace lacks its module capability. The test now asserts those existing behaviours; no runtime permission rule changed. [Result](compiled-http.txt).
- **Database restart and new-process replay passed:** after a real PostgreSQL restart, the exact claim/events/return/facts/receipts/audits/outbox snapshot remained unchanged; both original operations were recovered and replay added no effects. The verifier explicitly required a different database start time. [Result](restart.txt).
- **Documentation checks passed:** foundation, naming, prototype, status fragments, unchanged migration registry, all **44 documentation unit tests**, and whitespace/conflict checks. The contribution scope check is run against the committed branch before push. These are documentation assurance, not business acceptance.

## Reproduction and source binding

[Initial SHA-256 source manifest](source-sha256.txt) identifies the implementation, helper and proof files reviewed at `9e634df7`. The initial database, compiled HTTP and restart results refer to those production sources. The combined Supply and Maintenance regression runs and full unit check preceded the two bounded initial changes above; the initial final bridge/database and compiled regression runs cover their behaviour. These retained logs and hashes are historical and are not rewritten to claim the review corrections.

After successful `scripts/cloud-setup.sh`, source its reported tools environment in every shell. Use only the disposable `ppo_synthetic_test` database. The local executions used these commands (HTTP ran after the final production build):

```sh
npm run check
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/supply.test.ts tests/database/warranty-supply-return.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern='MA07|MA02' tests/database/maintenance.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/warranty-supply-return.test.ts
PPO_PORT=3100 npm run serve:compiled
# In another shell, with the same local database configuration:
PPO_PORT=3100 node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/http/warranty-supply-return.test.ts tests/http/maintenance.test.ts tests/http/supply.test.ts
```

For restart proof, run `scripts/warranty-supply-return-restart.ts write <scratch-path>` with Node's same env/tsx arguments, restart the disposable PostgreSQL container, then run `verify <scratch-path>` in a new process. No other writer may mutate the retained actor's evidence between these steps. The scratch file contains only synthetic test data and is not committed.

## Remaining gates

Claude completed the full review at `9e634df7`; confirmation of its two findings, final-head CI and Dean's merge remain separate. Browser/device/owner acceptance, full TS-05, stock posting, live ERP, customer or supplier communications and deployment are not claimed.
