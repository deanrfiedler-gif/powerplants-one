# Warranty to Supply return receiving evidence

Source: [PR #945](https://github.com/deanrfiedler-gif/powerplants-one/pull/945), `codex/warranty-supply-receiving`, based on main `e41f806a6`. Synthetic local data only. [Contract](../../../contracts/maintenance-warranty-api.md#warranty-to-supply-return-receiving).

## Executed verification

The disposable environment was prepared with `scripts/cloud-setup.sh`: Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, database `ppo_synthetic_test`. The script reports database ready and browser unavailable. No renderer is needed by the bridge or its database cases.

- **22/22 database cases passed:** all 11 existing `supply.test.ts` cases and 11 new `warranty-supply-return.test.ts` cases, serial, unmocked, unchanged 120-second test deadline. Coverage includes exact current source/delivery identity, competing operations, no duplicate effects, native remaining-delivered limits, original receipt recovery, failed-write rollback, permission revocation/history redaction, external-history preservation, partial receiving, disposition, unknown-outcome reconciliation and independent customer/Finance state.
- The first run exposed missing native delivery evidence in the new fixture (2/10 passed); the fixture was corrected to execute native allocation, pick, stage, dispatch and delivery. The bridge now explicitly requires a current complete delivery fact. The next run passed 8/10; test-only corrections use the actual `valid_to` permission field and `InvalidTransition` refusal code. The subsequent ten-case run passed before the unknown-outcome case expanded coverage to eleven. No native guard or deadline was weakened.
- **3/3 existing Maintenance/Warranty regression cases passed** (MA-02 and MA-07). [Result](maintenance-regression.txt).
- **`npm run check` passed:** studio register, full ESLint, TypeScript, **1,450/1,450 unit tests** and production Next build. After the final bounded source changes (the native handover URL and `ExternalEvidenceOnly` marker), changed-file ESLint, TypeScript and production build passed again. The final **11/11 bridge database cases** also passed again. [Final bridge result](bridge-database.txt) · [combined 22-case run](supply-regression.txt).
- **3/3 compiled HTTP cases passed:** the new bridge scenario plus existing Maintenance and Supply route regressions. This verifies foreign-origin refusal, current authority, exact replay/content conflict, both original receipt endpoints, permission-scoped detail and a successful HTTP response from the native receiving handover page. Initial HTTP runs exposed two test assumptions: the loopback gateway returns text on foreign-origin refusal, and Supply returns 403 when the other workspace lacks its module capability. The test now asserts those existing behaviours; no runtime permission rule changed. [Result](compiled-http.txt).
- **Database restart and new-process replay passed:** after a real PostgreSQL restart, the exact claim/events/return/facts/receipts/audits/outbox snapshot remained unchanged; both original operations were recovered and replay added no effects. The verifier explicitly required a different database start time. [Result](restart.txt).
- **Documentation checks passed:** foundation, naming, prototype, status fragments, unchanged migration registry, all **44 documentation unit tests**, and whitespace/conflict checks. The contribution scope check is run against the committed branch before push. These are documentation assurance, not business acceptance.

## Reproduction and source binding

[SHA-256 source manifest](source-sha256.txt) identifies the final implementation, helper and proof files. The final database, compiled HTTP and restart results refer to these production sources. The combined Supply and Maintenance regression runs and full unit check preceded the two bounded final changes above; the final bridge/database and compiled regression runs cover their behaviour.

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

Independent Claude review, final-head CI and Dean's merge are separate. Browser/device/owner acceptance, full TS-05, stock posting, live ERP, customer or supplier communications and deployment are not claimed.
